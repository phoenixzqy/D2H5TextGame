/**
 * Online tick: pure function for one 6-second combat slice.
 *
 * The engine never schedules its own timers; the host (UI thread / Web Worker)
 * is responsible for calling {@link onlineTick} at the configured interval.
 *
 * # Contract for idle consumers (Bug #6)
 *
 * `onlineTick(raw, bonus, config)` returns a **per-tick delta**, not a running
 * total. The consumer MUST apply the delta on every call:
 *   1. `playerStore.gainExperience(result.reward.xp)` when xp > 0.
 *   2. `inventoryStore.addCurrency('rune-shard', result.reward.runeShards)`
 *      when runeShards > 0, and similarly for any other rolled currencies.
 *   3. Loot drops are NOT produced here — the consumer rolls loot via
 *      {@link import('../loot/award').rollKillRewards} and feeds drops into
 *      `inventoryStore.addItem(...)` per tick. Loot RNG MUST advance between
 *      ticks (use `tickCount` in the seed string) or every tick re-rolls
 *      the same outcome.
 *   4. Persist the returned `bonus` into the ticker store so the next tick
 *      sees the advanced window — without this, the window never decays.
 *
 * The returned object is fresh each call; consumers can safely retain it
 * without aliasing engine state.
 *
 * @module engine/idle/online-tick
 */

import type { IdleBonus } from './offline-bonus';
import { bonusMultiplier, consumeOnlineSession } from './offline-bonus';
import { createRng, hashSeed } from '../rng';
import type { MonsterTier } from '../combat/types';
import type { EliteConfigDef } from '../types/elite';
import type { SubAreaDef } from '../types/maps';

/** A combat-tick reward summary (per-tick delta, not a running total). */
export interface TickReward {
  /** XP delta this tick (post-multiplier, pre-cap). Apply once per tick. */
  readonly xp: number;
  /** Rune-shard delta this tick (replaces gold per GDD §8). */
  readonly runeShards: number;
  /** Effective MF used on this tick (display only — not a delta to apply). */
  readonly effectiveMagicFind: number;
  /** Wishstones, runes, gems collected this tick. */
  readonly currencies: Readonly<Record<string, number>>;
}

/** Empty reward. */
export const EMPTY_REWARD: TickReward = {
  xp: 0,
  runeShards: 0,
  effectiveMagicFind: 0,
  currencies: Object.freeze({})
};

/** Tick configuration (data-driven from the host). */
export interface OnlineTickConfig {
  /** Base seconds per tick (default 6). */
  readonly tickSeconds: number;
  /** Player magic find before bonus. */
  readonly baseMagicFind: number;
}

/** Result of one {@link onlineTick} call. */
export interface OnlineTickResult {
  /** Reward delta to apply this tick (xp, runeShards, currencies). */
  readonly reward: TickReward;
  /** Advanced bonus snapshot (window decays one tick). Persist this. */
  readonly bonus: IdleBonus;
}

export interface ResolveIdleEncounterInput {
  readonly subArea: SubAreaDef;
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly tickIndex: number;
  readonly seed: number;
  readonly playerLevel: number;
  readonly eliteMisses: number;
  readonly eliteConfig: EliteConfigDef;
  readonly fallbackArchetypeId: string;
}

export interface IdleEncounterFeedback {
  readonly kind: 'kill' | 'elite-kill' | 'pity-elite-kill';
}

export interface IdleEncounter {
  readonly subAreaId: string;
  readonly tickIndex: number;
  readonly monsterArchetypeId: string;
  readonly monsterLevel: number;
  readonly monsterTier: MonsterTier;
  readonly treasureClassId: string;
  readonly nextEliteMisses: number;
  readonly feedback: IdleEncounterFeedback;
}

/**
 * Apply a single tick of accumulated reward, multiplied by current idle bonus.
 *
 * This function is pure: it does not invoke combat itself. The caller assembles
 * raw rewards from {@link runBattle} and passes them in here so that the bonus
 * is applied consistently in one place.
 */
export function onlineTick(
  rawReward: TickReward,
  bonus: IdleBonus,
  config: OnlineTickConfig
): OnlineTickResult {
  const mult = bonusMultiplier(bonus);
  const reward: TickReward = {
    xp: Math.floor(rawReward.xp * mult),
    runeShards: rawReward.runeShards,
    effectiveMagicFind: Math.floor(config.baseMagicFind * mult),
    currencies: rawReward.currencies
  };
  const advanced = consumeOnlineSession(config.tickSeconds * 1000, bonus);
  return { reward, bonus: advanced };
}

/** Resolve one deterministic online-idle encounter without applying rewards. */
export function resolveIdleEncounter(input: ResolveIdleEncounterInput): IdleEncounter {
  const rng = createRng(hashSeed(`idle-encounter|${String(input.seed)}|${input.subArea.id}|${String(input.tickIndex)}`));
  const archetypeIds = idleMonsterPool(input.subArea);
  const monsterArchetypeId = rng.pick(archetypeIds.length > 0 ? archetypeIds : [input.fallbackArchetypeId]);
  const elite = resolveIdleEliteRoll(input.eliteMisses, input.eliteConfig, rng);
  const monsterLevelBonus = input.subArea.difficulty?.monsterLevelBonus ?? 0;
  const monsterLevel = Math.max(
    1,
    input.subArea.areaLevel +
      monsterLevelBonus +
      (elite.tier === 'rare-elite' ? 2 : elite.tier === 'champion' ? 1 : 0)
  );

  return {
    subAreaId: input.subArea.id,
    tickIndex: input.tickIndex,
    monsterArchetypeId,
    monsterLevel,
    monsterTier: elite.tier,
    treasureClassId: input.subArea.lootTable,
    nextEliteMisses: elite.tier === 'trash' ? input.eliteMisses + 1 : 0,
    feedback: {
      kind: elite.hardPity ? 'pity-elite-kill' : elite.tier === 'trash' ? 'kill' : 'elite-kill'
    }
  };
}

function idleMonsterPool(subArea: SubAreaDef): readonly string[] {
  if (subArea.monsterPool && subArea.monsterPool.length > 0) {
    return subArea.monsterPool.map((m) => m.archetypeId);
  }
  const ids: string[] = [];
  for (const wave of subArea.waves) {
    if (wave.type === 'boss') continue;
    for (const encounter of wave.encounters ?? []) {
      for (const monster of encounter.monsters) {
        if (!monster.boss) ids.push(monster.archetypeId);
      }
    }
  }
  return [...new Set(ids)];
}

function resolveIdleEliteRoll(
  eliteMisses: number,
  eliteConfig: EliteConfigDef,
  rng: ReturnType<typeof createRng>
): { readonly tier: 'trash' | 'champion' | 'rare-elite'; readonly hardPity: boolean } {
  const idle = eliteConfig.idle;
  if (!idle.enabled) return { tier: 'trash', hardPity: false };
  if (eliteMisses >= idle.hardPityMisses) return { tier: 'rare-elite', hardPity: true };

  const softPitySteps = Math.max(0, eliteMisses - idle.pityStartMisses);
  const eliteChance = Math.min(
    idle.pityChanceCap,
    idle.baseEliteChance + softPitySteps * idle.pityStep
  );
  if (!rng.chance(eliteChance)) return { tier: 'trash', hardPity: false };

  const totalShare = idle.championShareOfEliteRoll + idle.rareShareOfEliteRoll;
  const rareChance = totalShare > 0 ? idle.rareShareOfEliteRoll / totalShare : 0;
  return { tier: rng.chance(rareChance) ? 'rare-elite' : 'champion', hardPity: false };
}

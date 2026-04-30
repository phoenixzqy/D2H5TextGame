/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import i18n from '@/i18n';
import { runBattleRecorded, type BattleEvent, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import type { MonsterDef } from '@/engine/types/monsters';
import { rollKillRewards, type KillRewards } from '@/engine/loot/award';
import { xpForKill } from '@/engine/progression/xp';
import {
  buildMonsterUnit,
  resolveWavePlan,
  synthDefaultPlan,
  type WavePlan,
  type WaveSpec
} from '@/engine/combat';
import { loadAwardPools } from '@/data/loaders/loot';
import { eliteConfig, monsters as monsterList } from '@/data/index';
import { resolveSubArea } from './subAreaResolver';
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { mercToCombatUnit } from './mercToCombatUnit';
import { createRng, hashSeed } from '@/engine/rng';

/**
 * Convert a Player to a CombatUnit for battle
 */
export function playerToCombatUnit(player: Player): CombatUnit {
  return {
    id: player.id,
    name: player.name,
    side: 'player',
    level: player.level,
    tier: 'trash',
    stats: player.derivedStats,
    life: player.derivedStats.life,
    mana: player.derivedStats.mana,
    statuses: [],
    cooldowns: {},
    skillOrder: player.comboOrder,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'hero'
  };
}

// ---------------------------------------------------------------------------
// Monster catalog (data-driven; bug #6)
// ---------------------------------------------------------------------------

let monsterIndex: ReadonlyMap<string, MonsterDef> | null = null;
function getMonsterIndex(): ReadonlyMap<string, MonsterDef> {
  if (monsterIndex) return monsterIndex;
  const m = new Map<string, MonsterDef>();
  for (const def of monsterList) m.set(def.id, def);
  monsterIndex = m;
  return m;
}

/**
 * Pick a fallback monster archetype id for a given act, used when the
 * synthetic default wave plan needs a placeholder.
 */
function pickFallbackArchetypeId(act: number): string {
  const prefix = `monsters/act${String(act)}.`;
  const candidates = monsterList.filter((m) => m.id.startsWith(prefix));
  return (candidates[0] ?? monsterList[0])?.id ?? 'monsters/act1.fallen';
}

/**
 * Convert battle events to combat log entries.
 *
 * Bug #11 — all human-readable strings now go through i18next so the
 * combat log honours the active locale (zh-CN by default). Monster
 * names should be resolved via {@link resolveMonsterDisplayName} when
 * the unit map is built.
 *
 * @param event - The battle event to convert
 * @param unitMap - Optional map of unit IDs to (already-localized) display names.
 */
export function battleEventToLogEntry(
  event: BattleEvent,
  unitMap?: ReadonlyMap<string, string>
): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  return eventToLocalizedLogEntry(event, unitMap);
}

// ---------------------------------------------------------------------------
// Monster display-name localization (Bug #11)
// ---------------------------------------------------------------------------

/**
 * Derive the i18n key (under the `monsters:` namespace) for a monster
 * archetype id like `monsters/act1.fallen` → `fallen`, or
 * `monsters/act1.dark-stalker` → `darkStalker`. Mirrors the camelCase
 * convention used by `i18n/locales/{zh-CN,en}/monsters.json`.
 *
 * Engine `MonsterDef` does not currently carry a `nameKey`; deriving
 * here keeps the data files unchanged while still allowing localized
 * display names. If a `nameKey` field is introduced upstream this
 * helper transparently prefers it.
 */
export function deriveMonsterNameKey(def: { id: string; nameKey?: string }): string {
  if (def.nameKey && def.nameKey.length > 0) return def.nameKey;
  const last = def.id.split('/').pop() ?? def.id;
  const after = last.includes('.') ? last.split('.').slice(1).join('.') : last;
  return after.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Localized display name for a built monster {@link CombatUnit}.
 * Falls back to `unit.name` when no archetype can be resolved.
 */
export function resolveMonsterDisplayName(unit: CombatUnit): string {
  if (unit.kind !== 'monster') return unit.name;
  // Engine ids look like `enemy-{slug}-{index}-{idTag}` where slug is the
  // archetype's last `/` segment (e.g. `act1.fallen`).
  const m = /^enemy-([^]+?)-\d+-[0-9a-f]+$/i.exec(unit.id);
  const slug = m?.[1];
  if (!slug) return unit.name;
  const idx = getMonsterIndex();
  const def =
    idx.get(`monsters/${slug}`) ??
    [...idx.values()].find((d) => d.id.endsWith(`.${slug}`) || d.id.endsWith(`/${slug}`));
  if (!def) return unit.name;
  const key = deriveMonsterNameKey(def);
  const localized = i18n.t(`monsters:${key}`, { defaultValue: def.name });

  // Preserve the engine's optional " A"/"(Elite)"/"(Boss)" suffix so
  // multiple instances stay distinguishable.
  const suffix = unit.name.length > def.name.length
    ? unit.name.slice(def.name.length)
    : '';
  return `${localized}${suffix}`;
}

/**
 * Build the enemy team for a single {@link WaveSpec} from JSON monster
 * definitions. Falls back to the act's first archetype when an
 * archetype id is missing from the catalog (defensive — should never
 * happen for shipped data).
 */
export function buildEnemiesForWave(wave: WaveSpec, seed: number): CombatUnit[] {
  const idx = getMonsterIndex();
  const rng = createRng(seed >>> 0);
  const enemies: CombatUnit[] = [];

  for (const spawn of wave.spawns) {
    const def =
      idx.get(spawn.archetypeId) ??
      [...idx.values()].find((m) => m.id.endsWith(spawn.archetypeId.split('/').pop() ?? '')) ??
      [...idx.values()][0];
    if (!def) continue; // empty catalog — should never happen at runtime
    enemies.push(
      buildMonsterUnit({
        def,
        level: spawn.level,
        tier: spawn.tier,
        rng,
        index: spawn.index,
        ...(spawn.eliteAffix ? { extraSkillIds: [spawn.eliteAffix.skillId] } : {}),
        ...(spawn.tier === 'rare-elite' ? { resistanceBonus: eliteConfig.rareEliteResistanceBonus } : {}),
        ...(spawn.chapterBoss
          ? {
              skillOrderOverride: spawn.chapterBoss.skills,
              statOverrides: {
                lifeMax: spawn.chapterBoss.hp * eliteConfig.chapterBossHpMultiplier,
                attack: spawn.chapterBoss.atk,
                defense: spawn.chapterBoss.def
              }
            }
          : {})
      })
    );
  }
  return enemies;
}

/**
 * Award post-victory loot for a list of slain enemies. Pure dispatcher:
 * rolls items + currencies via the engine and pushes them into the
 * inventory store. Returns the aggregated rewards so the UI can render a
 * loot summary panel.
 */
export function awardLootForVictory(opts: {
  readonly slainEnemies: readonly CombatUnit[];
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly treasureClassId: string;
  readonly seed: number;
}): KillRewards {
  const player = usePlayerStore.getState().player;
  const magicFind = player?.derivedStats.magicFind ?? 0;
  const goldFind = player?.derivedStats.goldFind ?? 0;
  const pools = loadAwardPools();
  const rng = createRng(opts.seed >>> 0);
  const inv = useInventoryStore.getState();

  const items: Item[] = [];
  let runeShards = 0;
  let runes = 0;
  let gems = 0;
  let wishstones = 0;

  for (const enemy of opts.slainEnemies) {
    const r = rollKillRewards(
      {
        tier: enemy.tier,
        monsterLevel: enemy.level,
        treasureClassId: opts.treasureClassId,
        magicFind,
        goldFind,
        act: opts.act,
        difficulty: 'normal'
      },
      pools,
      rng
    );
    for (const it of r.items) {
      items.push(it);
      inv.addItem(it);
    }
    runeShards += r.runeShards;
    runes += r.runes;
    gems += r.gems;
    wishstones += r.wishstones;
  }

  const totalRuneShards = runeShards + runes;
  if (totalRuneShards > 0) inv.addCurrency('rune-shard', totalRuneShards);
  if (gems > 0) inv.addCurrency('gem-shard', gems);
  if (wishstones > 0) inv.addCurrency('wishstone', wishstones);

  return { items, runeShards, runes, gems, wishstones };
}

// ---------------------------------------------------------------------------
// Sub-area run state (mid-flight; not persisted to save)
// ---------------------------------------------------------------------------

interface ActiveRun {
  readonly plan: WavePlan;
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly seed: number;
  readonly playerUnit: CombatUnit;
  /** Index of the wave currently being played (0-based). */
  waveIdx: number;
  /** Ongoing alive player-side units carried between waves. */
  carryPlayerTeam: CombatUnit[];
}

let activeRun: ActiveRun | null = null;

/** @returns whether a sub-area run is currently active. */
export function hasActiveSubAreaRun(): boolean {
  return activeRun !== null;
}

/**
 * Start a sub-area run.
 *
 * Reads the requested sub-area definition from JSON (or falls back to a
 * synthetic 4-wave plan), then plays the first wave. Subsequent waves
 * are advanced via {@link advanceWaveOrFinish}, called by the UI when
 * playback of the current wave completes and the player team is alive.
 *
 * @param opts - sub-area run options
 *   - `subAreaId`: explicit id; defaults to `mapStore.currentSubAreaId`.
 *   - `act`: act number; defaults to `mapStore.currentAct`.
 *   - `level`: optional override for monster level (else from JSON).
 */
export function startSubAreaRun(opts: {
  readonly subAreaId?: string | null;
  readonly act?: number;
  readonly level?: number;
} = {}): { runId: string; totalWaves: number } | null {
  const playerState = usePlayerStore.getState();
  const combat = useCombatStore.getState();
  if (!playerState.player) {
    console.warn('[startSubAreaRun] no player; abort');
    return null;
  }

  const map = useMapStore.getState();
  const act = clampAct(opts.act ?? map.currentAct);
  const subAreaId = opts.subAreaId ?? map.currentSubAreaId;
  const subArea = resolveSubArea(act, subAreaId);

  // Resolve a wave plan, falling back to the synthetic 4-wave default.
  // Run seed is generated up-front and threaded into wave-plan resolution
  // so spawn-count rolls are reproducible per-run (Bug C).
  const fallbackArchetype = pickFallbackArchetypeId(act);
  const synthId = `areas/synth-act${String(act)}`;
  const planSeed = hashSeed(
    `${subArea?.id ?? synthId}|${String(Date.now())}`
  );
  const plan = subArea
    ? resolveWavePlan(subArea, fallbackArchetype, subArea.areaLevel, planSeed)
    : synthDefaultPlan(
        {
          id: synthId,
          lootTable: `loot/trash-act${String(act)}`,
          areaLevel: opts.level ?? playerState.player.level
        },
        fallbackArchetype,
        opts.level ?? playerState.player.level,
        planSeed
      );

  const seed = planSeed;
  const playerUnit = playerToCombatUnit(playerState.player);
  const fieldedMerc = useMercStore.getState().getFieldedMerc();
  const playerTeam: CombatUnit[] = fieldedMerc
    ? [playerUnit, mercToCombatUnit(fieldedMerc)]
    : [playerUnit];

  activeRun = {
    plan,
    act,
    seed,
    playerUnit,
    waveIdx: 0,
    carryPlayerTeam: playerTeam
  };

  // Reset per-run aggregate state. Bug #1 (P0): also clear sticky runVictory/runDefeat/subAreaRunId so a second run after a finished one renders cleanly.
  combat.resetRunRewards();
  if (combat.runVictory || combat.runDefeat || combat.subAreaRunId !== null) {
    useCombatStore.setState({ runVictory: false, runDefeat: false, subAreaRunId: null });
  }

  playWave(0);
  return { runId: plan.subAreaId, totalWaves: plan.waves.length };
}

/**
 * Advance to the next wave (if any) or finish the run. Intended to be
 * invoked by the UI once `playbackComplete === true` for the current
 * wave's recorded battle. Idempotent.
 *
 * @returns the new state after the call:
 *   - `'next-wave'` — a new wave's recorded battle has been installed.
 *   - `'victory'`   — the run is fully cleared.
 *   - `'defeat'`    — the player team died on the just-finished wave.
 *   - `'idle'`      — no active run.
 */
export function advanceWaveOrFinish(): 'next-wave' | 'victory' | 'defeat' | 'idle' {
  if (!activeRun) return 'idle';
  const combat = useCombatStore.getState();
  const outcome = combat.outcome;

  if (!outcome) return 'idle';

  const slain = outcome.finalEnemyTeam.filter(
    (u) => u.life <= 0 && inferKind(u) !== 'summon'
  );
  if (outcome.winner === 'player' && slain.length > 0) {
    let xpGained = 0;
    for (const enemy of slain) xpGained += xpForKill(enemy.level);
    if (xpGained > 0) {
      const xpResult = usePlayerStore.getState().gainExperience(xpGained);
      useMercStore.getState().shareExperienceWithFielded(xpGained);
      if (xpResult.levelsGained > 0) {
        combat.addLogEntry({
          type: 'system',
          actorId: 'system',
          actorName: 'System',
          message: `combat:levelUp:${String(xpResult.newLevel)}`
        });
      }
    }

    const wave = activeRun.plan.waves[activeRun.waveIdx];
    const tcId = wave?.lootTable ?? activeRun.plan.defaultLootTable;
    const rewards = awardLootForVictory({
      slainEnemies: slain,
      act: activeRun.act,
      treasureClassId: tcId,
      seed: activeRun.seed ^ 0x9e3779b1 ^ activeRun.waveIdx
    });
    combat.accumulateRunRewards(rewards);
  }

  const alivePlayer = outcome.finalPlayerTeam.find(
    (u) => u.id === activeRun?.playerUnit.id && u.life > 0
  );

  if (!alivePlayer) {
    combat.markRunDefeat();
    activeRun = null;
    return 'defeat';
  }

  activeRun.carryPlayerTeam = outcome.finalPlayerTeam.filter(
    (u) => inferKind(u) !== 'summon' && u.life > 0
  );
  const nextIdx = activeRun.waveIdx + 1;
  if (nextIdx >= activeRun.plan.waves.length) {
    // Bug B — mark the sub-area cleared on engine-side so any caller
    // benefits (idempotent in mapStore). Persistence is handled by the
    // existing zustand-persist subscription on mapStore.
    const clearedId = activeRun.plan.subAreaId;
    try {
      useMapStore.getState().markCleared(clearedId);
    } catch {
      // mapStore unavailable in some test harnesses; best-effort.
    }
    combat.markRunVictory();
    // Bug #3 — record the cleared sub-area so MapScreen flips its
    // badge and idle farming unlocks. Idempotent on the store side.
    // If engine-dev (fix/engine-skills-encounter) later moves this
    // call into markRunVictory itself, drop this line on merge.
    useMapStore.getState().markCleared(activeRun.plan.subAreaId);
    activeRun = null;
    return 'victory';
  }
  activeRun.waveIdx = nextIdx;
  playWave(nextIdx);
  return 'next-wave';
}

/** Tear down the active run without touching combat state. */
export function abortSubAreaRun(): void {
  activeRun = null;
}

/**
 * Internal: build & install the recorded battle for the given wave index
 * in the active run. Intentionally isolated so {@link startSubAreaRun}
 * and {@link advanceWaveOrFinish} share one code path.
 */
function playWave(waveIdx: number): void {
  if (!activeRun) return;
  const wave = activeRun.plan.waves[waveIdx];
  if (!wave) return;
  const combat = useCombatStore.getState();

  const waveSeed = (activeRun.seed ^ ((waveIdx + 1) * 0x9e3779b1)) >>> 0;
  const enemies = buildEnemiesForWave(wave, waveSeed);
  const playerTeam = activeRun.carryPlayerTeam;

  const { events, result } = runBattleRecorded({
    seed: waveSeed,
    playerTeam,
    enemyTeam: enemies
  });

  const unitMap = new Map<string, string>();
  [...result.playerTeam, ...result.enemyTeam].forEach((unit) => {
    unitMap.set(unit.id, resolveMonsterDisplayName(unit));
  });

  const playbackEvents: readonly RecordedBattleEvent[] = wave.bossIntro
    ? [
        {
          kind: 'message',
          messageKey: 'combat:bossIntro',
          params: { boss: unitMap.get(enemies[0]?.id ?? '') ?? enemies[0]?.name ?? wave.bossIntro.bossArchetypeId },
          simClockMs: 0,
          uiDelayMs: 1200
        },
        ...events
      ]
    : events;

  combat.setRecordedBattle({
    initialPlayerTeam: playerTeam,
    initialEnemyTeam: enemies,
    events: playbackEvents,
    unitNameMap: unitMap,
    outcome: {
      winner: result.winner,
      finalPlayerTeam: result.playerTeam,
      finalEnemyTeam: result.enemyTeam
    },
    currentWave: waveIdx + 1,
    totalWaves: activeRun.plan.waves.length,
    subAreaRunId: activeRun.plan.subAreaId
  });
}

function clampAct(n: number): 1 | 2 | 3 | 4 | 5 {
  return (Math.min(5, Math.max(1, Math.floor(n))) as 1 | 2 | 3 | 4 | 5);
}

/**
 * Backwards-compat shim: legacy "synthetic Fallen battle" entry point.
 * Now delegates to {@link startSubAreaRun} so callers (older E2E tests
 * and one-off demos) immediately benefit from the multi-wave flow and
 * data-driven monsters.
 *
 * @deprecated use {@link startSubAreaRun} directly.
 */
export function startSimpleBattle(enemyLevel = 1, _enemyCount = 3): void {
  void _enemyCount; // ignored — wave plan dictates enemy counts now
  startSubAreaRun({ level: enemyLevel });
}

/**
 * Lightweight, side-effect-free spawn helper retained so legacy combat
 * unit tests that fabricate trivial enemies can still construct one.
 *
 * The production code path is {@link buildEnemiesForWave}; this is an
 * adapter that picks the act-1 Fallen archetype out of JSON and hands
 * it to {@link buildMonsterUnit}.
 */
export function createSimpleEnemy(level: number, index?: number): CombatUnit {
  const idx = getMonsterIndex();
  const def =
    idx.get('monsters/act1.fallen') ??
    [...idx.values()][0];
  if (!def) {
    throw new Error('createSimpleEnemy: no monsters in JSON catalog');
  }
  const tier: MonsterTier = 'trash';
  return buildMonsterUnit({
    def,
    level,
    tier,
    rng: createRng(hashSeed(`simple-${String(level)}-${String(index ?? 0)}`)),
    ...(index !== undefined ? { index } : {})
  });
}
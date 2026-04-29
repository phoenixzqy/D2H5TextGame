/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import { runBattleRecorded, type BattleEvent } from '@/engine/combat/combat';
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
import { monsters as monsterList } from '@/data/index';
import { resolveSubArea } from './subAreaResolver';
import { useCombatStore, type CombatLogEntry } from './combatStore';
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
 * Convert battle events to combat log entries
 * @param event - The battle event to convert
 * @param unitMap - Optional map of unit IDs to names for display
 */
export function battleEventToLogEntry(
  event: BattleEvent,
  unitMap?: ReadonlyMap<string, string>
): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  const getName = (id: string): string => unitMap?.get(id) ?? id;

  switch (event.kind) {
    case 'turn-start':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: `Turn ${String(event.turn)} starts`
      };
    case 'action': {
      const actorName = getName(event.actor);
      return {
        type: 'skill',
        actorId: event.actor,
        actorName,
        message: `${actorName} uses ${event.skillId ?? 'basic attack'}`
      };
    }
    case 'damage': {
      const sourceName = getName(event.source);
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.source,
        actorName: sourceName,
        targetId: event.target,
        targetName,
        message: `${sourceName} deals ${String(event.amount)} ${event.damageType} damage to ${targetName}${event.crit ? ' (CRIT!)' : ''}${event.dodged ? ' (DODGED)' : ''}`,
        value: event.amount
      };
    }
    case 'death': {
      const targetName = getName(event.target);
      return {
        type: 'death',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} has died`
      };
    }
    case 'heal': {
      const targetName = getName(event.target);
      return {
        type: 'heal',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} heals for ${String(event.amount)}`,
        value: event.amount
      };
    }
    case 'buff': {
      const targetName = getName(event.target);
      return {
        type: 'buff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} gains ${event.buffId}`
      };
    }
    case 'status': {
      const targetName = getName(event.target);
      return {
        type: 'debuff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is afflicted with ${event.statusId}`
      };
    }
    case 'stunned': {
      const targetName = getName(event.target);
      return {
        type: 'system',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is stunned and cannot act`
      };
    }
    case 'dot': {
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} takes ${String(event.amount)} DoT damage`,
        value: event.amount
      };
    }
    case 'summon': {
      const ownerName = getName(event.owner);
      return {
        type: 'system',
        actorId: event.owner,
        actorName: ownerName,
        message: `${ownerName} summons ${event.unit.name}`
      };
    }
    case 'end':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: event.winner ? `${event.winner} side wins!` : 'Battle ended in a draw'
      };
    default:
      return null;
  }
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
        index: spawn.index
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
  const fallbackArchetype = pickFallbackArchetypeId(act);
  const plan = subArea
    ? resolveWavePlan(subArea, fallbackArchetype, subArea.areaLevel)
    : synthDefaultPlan(
        {
          id: `areas/synth-act${String(act)}`,
          lootTable: `loot/trash-act${String(act)}`,
          areaLevel: opts.level ?? playerState.player.level
        },
        fallbackArchetype,
        opts.level ?? playerState.player.level
      );

  const seed = hashSeed(`${plan.subAreaId}|${String(Date.now())}`);
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

  // Reset per-run aggregate state in the store.
  combat.resetRunRewards();

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
    combat.markRunVictory();
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
    unitMap.set(unit.id, unit.name);
  });

  combat.setRecordedBattle({
    initialPlayerTeam: playerTeam,
    initialEnemyTeam: enemies,
    events,
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
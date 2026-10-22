/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import i18n from '@/i18n';
import { MAX_SIM_MS, runBattleRecorded, type BattleEvent, type RecordedBattleEvent } from '@/engine/combat/combat';
import { rebaseStatusClock } from '@/engine/combat/status';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import type { MonsterDef } from '@/engine/types/monsters';
import { rollKillRewards, type KillRewards } from '@/engine/loot/award';
import { xpForKill } from '@/engine/progression/xp';
import {
  buildMonsterUnit,
  resolveChallengeWavePlan,
  synthDefaultPlan,
  type WaveSpec
} from '@/engine/combat';
import { loadAwardPools, loadItemBases } from '@/data/loaders/loot';
import { eliteConfig, monsters as monsterList } from '@/data/index';
import { resolveSubArea } from './subAreaResolver';
import { useCombatStore, type CombatLogEntry, type RecordedBattleOutcome } from './combatStore';
import { stageRecordedBattle, type RecordedBattlePublication } from './recordedBattlePublication';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import { abandonRecordedWaves, clearRecordedWavesAfterRestore } from './recordedWaveReceipt';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useFormationStore } from './formationStore';
import { createRng, hashSeed } from '@/engine/rng';
import { getIdleEliteMisses, resetIdleEliteMisses, setIdleEliteMisses } from './idleElitePity';
import { resolveSummonDisplayName } from './summonDisplayName';
import { loadMercPool } from '@/data/loaders/mercs';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from '@/engine/progression/equipment-mods';
import { deriveStats, effectiveStatValue } from '@/engine/progression/stats';
import { composeHeroRecovery } from '@/engine/progression/warmth';
import { resolveFrozenArmorRank } from '@/engine/skills/frozen-armor';
import { composeMightAura } from '@/engine/skills/might';
import { composeMeditationAura } from '@/engine/skills/meditation';
import { IRON_SKIN_DEFINITION, resolveIronSkinRank } from '@/engine/skills/iron-skin';
import { composeSkeletonMastery } from '@/engine/skills/skeleton-mastery';
import { isPreparationSummonSkill } from '@/engine/skills/summon-preparation';
import { isIronGolemSkill } from '@/engine/skills/iron-golem';
import { clearIronGolemSelection, clearIronGolemSelectionAfterRestore } from './ironGolemSelectionStore';
import { useHydrationStore } from './hydrationStore';
import { WaveGuardError, assertWaveRestoreOwner, assertWaveSnapshotAllowed, type WaveRestoreLease } from './waveTransitionGuard';
import { canonicalSkillIdFromData, getSkillRequiredLevel, getSkillsForClass,
  skillIdAliases, type SkillTemplate } from './skillsHelpers';

/** Check existing ownership before hydration; this preflight acquires no lease. */
function assertWaveReady(): void {
  assertWaveSnapshotAllowed();
  if (useHydrationStore.getState().status !== 'ready') throw new WaveGuardError('hydrationNotReady');
}

const CHALLENGE_ORDINAL_PERIOD = 360360;
let manualChallengeOrdinal = 0;

/** Validate class, level and allocations before scoped summon slots enter the engine. */
function scopedSummonConfiguration(player: Player): Pick<CombatUnit, 'skillOrder' | 'skillLevels'> {
  const skillLevels = { ...player.skillLevels };
  const catalog = getSkillsForClass(player.class);
  const byCanonical = new Map(catalog.map(skill => [canonicalSkillIdFromData(skill.id), skill]));
  const rank = (skill: SkillTemplate): number => {
    if (!Number.isInteger(skill.maxLevel) || skill.maxLevel < 1) return 0;
    let highest = 0;
    for (const alias of skillIdAliases(skill.id)) {
      const value = player.skillLevels?.[alias];
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= skill.maxLevel) {
        highest = Math.max(highest, value);
      }
    }
    return highest;
  };
  const skillOrder = player.comboOrder.filter(id => {
    const canonical = canonicalSkillIdFromData(id) ?? id;
    if (!isPreparationSummonSkill({ id: canonical }) && !isIronGolemSkill({ id: canonical })) return true;
    if (!Number.isInteger(player.level) || player.level < 1) return false;
    const source = byCanonical.get(canonical);
    if (!source) return false;
    const requiredLevel = getSkillRequiredLevel(source);
    if (!Number.isInteger(requiredLevel) || requiredLevel < 1 || player.level < requiredLevel) return false;
    const allocated = rank(source);
    if (allocated === 0) return false;
    if (source.prerequisites?.some(prerequisiteId => {
      const prerequisite = byCanonical.get(canonicalSkillIdFromData(prerequisiteId) ?? prerequisiteId);
      return !prerequisite || rank(prerequisite) === 0;
    })) return false;
    for (const alias of skillIdAliases(source.id)) Reflect.deleteProperty(skillLevels, alias);
    skillLevels[canonical] = allocated;
    return true;
  });
  return { skillOrder, skillLevels };
}

/**
 * Convert a Player to a CombatUnit for battle.
 *
 * Derives weapon metadata and stats from the same canonical equipment snapshot
 * so the AI
 * skill chooser can apply weapon-type / handedness gates
 * (see {@link import('@/engine/skills/eligibility').canCastSkill}).
 */
export function playerToCombatUnit(player: Player): CombatUnit {
  const equipped = useInventoryStore.getState().equipped;
  const equippedWeapon = resolveEquippedWeapon(equipped);
  const mods = aggregateEquipmentMods(equipped);
  const core = applyEquipmentCoreMods(player.coreStats, mods);
  const freshStats = deriveStats(core, player.level, equipmentModsToDerivedModifiers(mods));
  const ironSkinRank = player.class === 'barbarian' && Number.isFinite(player.level) &&
    player.level >= IRON_SKIN_DEFINITION.requiredLevel ? resolveIronSkinRank(player.skillLevels) : 0;
  const stats = { ...freshStats,
    defense: freshStats.defense * (1 + IRON_SKIN_DEFINITION.defensePctPerRank * ironSkinRank),
    life: Math.min(player.derivedStats.life, freshStats.lifeMax),
    mana: Math.min(player.derivedStats.mana, freshStats.manaMax) };
  const recovery = composeHeroRecovery({ classId: player.class, level: player.level,
    effectiveEnergy: effectiveStatValue(core.energy),
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const formation = useFormationStore.getState();
  return {
    id: player.id,
    name: player.name,
    side: 'player',
    level: player.level,
    tier: 'trash',
    stats,
    life: stats.life,
    mana: stats.mana,
    ...recovery,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    statuses: [],
    cooldowns: {},
    ...scopedSummonConfiguration(player),
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'hero',
    equippedWeapon,
    gridPosition: formation.playerPosition,
    summonGridPositions: formation.summonPositions
  };
}

/**
 * Resolve weapon eligibility metadata from the canonical weapon slot.
 * Missing items or unknown bases are explicitly unarmed; item flags and legacy
 * player equipment do not participate in this read.
 */
export function resolveEquippedWeapon(
  equipped: Readonly<Record<string, Item | null>>
): {
  weaponType?: import('@/engine/types/items').WeaponType;
  handedness?: import('@/engine/types/items').Handedness;
} {
  const weapon = equipped.weapon;
  if (!weapon) return {};
  const base = loadItemBases().get(weapon.baseId);
  if (!base) return {};
  const out: {
    weaponType?: import('@/engine/types/items').WeaponType;
    handedness?: import('@/engine/types/items').Handedness;
  } = {};
  if (base.weaponType !== undefined) out.weaponType = base.weaponType;
  if (base.handedness !== undefined) out.handedness = base.handedness;
  return out;
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

export function resolveCombatUnitDisplayName(unit: CombatUnit): string {
  const kind = inferKind(unit);
  if (kind === 'monster') return resolveMonsterDisplayName(unit);
  if (kind === 'summon') return resolveSummonDisplayName(unit);
  if (kind === 'merc') return resolveMercDisplayName(unit);
  return unit.name;
}

export function resolveMercDisplayName(unit: CombatUnit): string {
  if (inferKind(unit) !== 'merc') return unit.name;
  const rawId = unit.id.startsWith('merc-') ? unit.id.slice('merc-'.length) : unit.id;
  const baseId = rawId.split('#')[0] ?? rawId;
  const slash = baseId.indexOf('/');
  const slug = slash >= 0 ? baseId.slice(slash + 1) : baseId;
  const def = loadMercPool().pool.find((entry) => entry.id === baseId);
  return i18n.t(`mercs:byId.${slug}.name`, { defaultValue: def?.name ?? unit.name });
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
                defense: spawn.chapterBoss.def,
                ...(spawn.chapterBoss.magicResist !== undefined
                  ? { magicResist: spawn.chapterBoss.magicResist }
                  : {})
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
  /** Award-time multiplier applied after the MF diminishing-return curve. */
  readonly magicFindMultiplier?: number;
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
        magicFindMultiplier: opts.magicFindMultiplier ?? 1,
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
// Sub-area run helpers (mid-flight state lives in combatRunLifecycle)
// ---------------------------------------------------------------------------

/** @returns whether a sub-area run is currently active. */
export function hasActiveSubAreaRun(): boolean {
  return combatRunLifecycle.activeRun !== null;
}

/**
 * Replay the current wave with latest configuration when explicitly requested.
 * Ordinary changes leave the recording frozen and apply on the next playWave.
 * Staging errors preserve the prior run, recording and terminal clock.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration
 * before explicit replay controls or staging; ordinary refresh remains a no-op.
 */
export function refreshActivePlayerCombatConfig({
  replayCurrentWave = false
}: {
  readonly replayCurrentWave?: boolean;
} = {}): void {
  if (!replayCurrentWave) return;
  assertWaveReady();
  if (!combatRunLifecycle.activeRun) return;
  const combat = useCombatStore.getState();
  if (combat.inCombat) {
    playWave(combatRunLifecycle.activeRun.waveIdx);
  }
}

/** Reset transient online-idle elite pity when the player stops idle farming. */
export function resetIdleElitePity(): void {
  resetIdleEliteMisses();
}

/**
 * Start a sub-area run.
 *
 * Reads the requested sub-area definition from JSON (or falls back to a
 * synthetic 4-wave plan), then plays the first wave. Subsequent waves
 * are advanced via {@link advanceWaveOrFinish}, called by the UI when
 * playback of the current wave completes and the original hero has won alive.
 *
 * @param opts - sub-area run options
 *   - `subAreaId`: explicit id; defaults to `mapStore.currentSubAreaId`.
 *   - `act`: act number; defaults to `mapStore.currentAct`.
 *   - `level`: optional override for monster level (else from JSON).
 *   - `runSeed`: uint32 replay seed, including zero; defaults to the historical area/time hash.
 *   - `challengeOrdinal`: integer in [0, 360360); explicit values do not advance the default counter.
 * @returns the resolved seed/ordinal and run identity, or null without a player.
 * @throws {RangeError} if a provided replay input is outside its integer range;
 * validation precedes any store, active-run or counter mutation.
 * @throws If wave planning, simulation, terminal validation or normalization fails;
 * the previous run, recording, ordinal and rewards remain unchanged.
 * Publisher failures after successful staging still require receipt integration.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration, after
 * replay argument validation and before player/no-run controls or other effects.
 */
export function startSubAreaRun(opts: {
  readonly subAreaId?: string | null;
  readonly act?: number;
  readonly level?: number;
  readonly mode?: 'manual' | 'idle';
  readonly runSeed?: number;
  readonly challengeOrdinal?: number;
} = {}): { runId: string; totalWaves: number; runSeed: number; challengeOrdinal: number } | null {
  if (opts.runSeed !== undefined &&
    (!Number.isInteger(opts.runSeed) || opts.runSeed < 0 || opts.runSeed > 0xffffffff)) {
    throw new RangeError('runSeed must be an unsigned 32-bit integer');
  }
  if (opts.challengeOrdinal !== undefined &&
    (!Number.isInteger(opts.challengeOrdinal) || opts.challengeOrdinal < 0 ||
      opts.challengeOrdinal >= CHALLENGE_ORDINAL_PERIOD)) {
    throw new RangeError('challengeOrdinal must be an integer in [0, 360360)');
  }
  assertWaveReady();
  const playerState = usePlayerStore.getState();
  if (!playerState.player) {
    console.warn('[startSubAreaRun] no player; abort');
    return null;
  }

  const map = useMapStore.getState();
  const act = clampAct(opts.act ?? map.currentAct);
  const subAreaId = opts.subAreaId ?? map.currentSubAreaId;
  const subArea = resolveSubArea(act, subAreaId);
  const mode = opts.mode ?? 'manual';

  // Resolve a wave plan, falling back to the synthetic 4-wave default.
  // Run seed is generated up-front and threaded into wave-plan resolution
  // so spawn-count rolls are reproducible per-run (Bug C).
  const fallbackArchetype = pickFallbackArchetypeId(act);
  const synthId = `areas/synth-act${String(act)}`;
  const planSeed = opts.runSeed ?? hashSeed(
    `${subArea?.id ?? synthId}|${String(Date.now())}`
  );
  const challengeOrdinal = opts.challengeOrdinal ?? manualChallengeOrdinal;
  const plan = subArea
    ? resolveChallengeWavePlan({
        subArea,
        fallbackArchetypeId: fallbackArchetype,
        fallbackLevel: subArea.areaLevel,
        seed: planSeed,
        challengeOrdinal,
        mode,
        idleEliteMisses: getIdleEliteMisses()
      })
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
  const formation = useFormationStore.getState();
  const playerUnit = playerToCombatUnit(playerState.player);
  const mercState = useMercStore.getState();
  const fieldedMerc = mercState.fieldedMercId
    ? mercState.ownedMercs.find(merc => merc.id === mercState.fieldedMercId)
    : undefined;
  const mercUnit = fieldedMerc
    ? mercToCombatUnit(
        fieldedMerc, formation.mercPosition, mercState.mercEquipment[fieldedMerc.id]
      )
    : undefined;
  const playerTeam: CombatUnit[] = mercUnit ? [playerUnit, mercUnit] : [playerUnit];

  const candidate: ActiveRun = {
    plan,
    act,
    seed,
    mode,
    ...(mercUnit ? { fieldedMercCombatId: mercUnit.id } : {}),
    playerUnit,
    waveIdx: 0,
    carryPlayerTeam: playerTeam,
    waveElapsedMs: 0
  };

  const staged = stageWave(candidate, 0, true);
  combatRunLifecycle.activeRun = candidate;
  if (opts.challengeOrdinal === undefined) {
    manualChallengeOrdinal = (challengeOrdinal + 1) % CHALLENGE_ORDINAL_PERIOD;
  }
  installStagedWave(candidate, staged);
  return { runId: plan.subAreaId, totalWaves: plan.waves.length, runSeed: seed, challengeOrdinal };
}

/**
 * Advance to the next wave (if any) or finish the run. Intended to be
 * invoked by the UI once `playbackComplete === true` for the current
 * wave's recorded battle. Idempotent.
 *
 * @returns the new state after the call:
 *   - `'next-wave'` — a new wave's recorded battle has been installed.
 *   - `'victory'`   — the run is fully cleared.
 *   - `'defeat'`    — the wave was not won, or the original hero died.
 *   - `'idle'`      — no active run or current playback is incomplete.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration before
 * no-run/playback controls and every completion effect.
 */
export function advanceWaveOrFinish(): 'next-wave' | 'victory' | 'defeat' | 'idle' {
  assertWaveReady();
  if (!combatRunLifecycle.activeRun) return 'idle';
  const combat = useCombatStore.getState();
  const outcome = combat.outcome;

  if (!outcome || !combat.playbackComplete) return 'idle';

  const completedWave = combatRunLifecycle.activeRun.plan.waves[combatRunLifecycle.activeRun.waveIdx];
  if (
    combatRunLifecycle.activeRun.mode === 'idle' &&
    completedWave?.presentation?.idleEliteMissesAfterWave !== undefined
  ) {
    setIdleEliteMisses(completedWave.presentation.idleEliteMissesAfterWave);
  }

  const alivePlayer = outcome.finalPlayerTeam.find(
    (u) => u.id === combatRunLifecycle.activeRun?.playerUnit.id && u.life > 0
  );
  if (outcome.winner !== 'player' || !alivePlayer) {
    combat.markRunDefeat();
    combatRunLifecycle.activeRun = null;
    return 'defeat';
  }

  const slain = outcome.finalEnemyTeam.filter(
    (u) => u.life <= 0 && inferKind(u) !== 'summon'
  );
  if (slain.length > 0) {
    const now = Date.now();
    const multiplier = useMetaStore.getState().readIdleBonus(now).activeMultiplier;
    let xpGained = 0;
    for (const enemy of slain) xpGained += Math.floor(xpForKill(enemy.level) * multiplier);
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

    const wave = combatRunLifecycle.activeRun.plan.waves[combatRunLifecycle.activeRun.waveIdx];
    const tcId = wave?.lootTable ?? combatRunLifecycle.activeRun.plan.defaultLootTable;
    const rewards = awardLootForVictory({
      slainEnemies: slain,
      act: combatRunLifecycle.activeRun.act,
      treasureClassId: tcId,
      seed: combatRunLifecycle.activeRun.seed ^ 0x9e3779b1 ^ combatRunLifecycle.activeRun.waveIdx,
      magicFindMultiplier: multiplier
    });
    combat.accumulateRunRewards(rewards);
  }

  const nextIdx = combatRunLifecycle.activeRun.waveIdx + 1;
  if (nextIdx >= combatRunLifecycle.activeRun.plan.waves.length) {
    const recording = combatRunLifecycle.activeRun.recording;
    const boss = recording?.chapterBoss;
    if (boss && outcome === recording.outcome && combat.recordedEvents === recording.events &&
      combat.subAreaRunId === combatRunLifecycle.activeRun.plan.subAreaId &&
      combat.currentWave === combatRunLifecycle.activeRun.waveIdx + 1 && combat.totalWaves === combatRunLifecycle.activeRun.plan.waves.length &&
      outcome.finalEnemyTeam.some(enemy => enemy.id === boss.unitId && enemy.side === 'enemy' &&
        enemy.kind === 'monster' && enemy.tier === 'chapter-boss' && enemy.life <= 0)) {
      useMapStore.getState().recordBossKill({
        actId: `acts/act${String(combatRunLifecycle.activeRun.act)}`,
        areaId: combatRunLifecycle.activeRun.plan.subAreaId,
        bossArchetypeId: boss.archetypeId
      });
    }
    // Only a complete sequence of won waves can clear an area or unlock idle.
    useMapStore.getState().markCleared(combatRunLifecycle.activeRun.plan.subAreaId);
    combat.markRunVictory();
    combatRunLifecycle.activeRun = null;
    return 'victory';
  }
  const elapsedMs = combatRunLifecycle.activeRun.waveElapsedMs;
  combatRunLifecycle.activeRun.carryPlayerTeam = outcome.finalPlayerTeam
    .filter(u => inferKind(u) !== 'summon' && u.life > 0)
    .map(u => rebaseStatusClock(u, elapsedMs));
  combatRunLifecycle.activeRun.waveIdx = nextIdx;
  playWave(nextIdx);
  return 'next-wave';
}

/**
 * Abandon process-local combat only after a validated restore/deletion succeeds.
 * The caller retains its restore reservation throughout installation. An invalid
 * or released lease throws WaveGuardError before any transient state changes.
 */
export function clearCombatAfterRestore(lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  combatRunLifecycle.activeRun = null;
  clearRecordedWavesAfterRestore(lease);
  useCombatStore.getState().reset();
  clearIronGolemSelectionAfterRestore(lease);
}

/**
 * Abandon the active run and armed selection; recording reset belongs to the caller.
 * Throws WaveGuardError before any change during wave or restore ownership.
 */
export function abortSubAreaRun(): void {
  assertWaveSnapshotAllowed();
  combatRunLifecycle.activeRun = null;
  abandonRecordedWaves();
  clearIronGolemSelection();
}

/**
 * Internal: build & install the recorded battle for the given wave index
 * in the active run. Intentionally isolated so {@link startSubAreaRun}
 * and {@link advanceWaveOrFinish} share one code path.
 */
function playWave(waveIdx: number): void {
  if (!combatRunLifecycle.activeRun) return;
  const run = combatRunLifecycle.activeRun;
  installStagedWave(run, stageWave(run, waveIdx));
}

interface StagedWave {
  readonly waveIdx: number;
  readonly elapsedMs: number;
  readonly recording: NonNullable<ActiveRun['recording']>;
  readonly publication: RecordedBattlePublication;
}

/** Build the whole recording before changing any run metadata or combat state. */
function stageWave(run: ActiveRun, waveIdx: number, resetRunRewards = false): StagedWave {
  const wave = run.plan.waves[waveIdx];
  if (!wave) throw new Error('Wave index does not exist in run plan');
  const combat = useCombatStore.getState();

  const waveSeed = (run.seed ^ ((waveIdx + 1) * 0x9e3779b1)) >>> 0;
  const enemies = buildEnemiesForWave(wave, waveSeed);
  const spawn = wave.spawns.length === 1 ? wave.spawns[0] : undefined;
  const builtBoss = enemies.length === 1 ? enemies[0] : undefined;
  // Only the canonical single chapter-boss spawn has an unambiguous identity.
  // In particular, buildEnemiesForWave's fallback catalog lookup cannot qualify.
  const chapterBoss = spawn?.chapterBoss && spawn.tier === 'chapter-boss' &&
    spawn.archetypeId === spawn.chapterBoss.archetypeId && getMonsterIndex().has(spawn.archetypeId) &&
    builtBoss?.side === 'enemy' && builtBoss.kind === 'monster' && builtBoss.tier === 'chapter-boss'
    ? { unitId: builtBoss.id, archetypeId: spawn.archetypeId }
    : undefined;
  // Keep the original/rebased wave-input baseline intact. Repeated replay must
  // never inherit completed playback resources or a previously clamped replay.
  const currentPlayer = usePlayerStore.getState().player;
  const fresh = currentPlayer?.id === run.playerUnit.id
    ? playerToCombatUnit(currentPlayer) : null;
  const mightAura = currentPlayer?.id === run.playerUnit.id
    ? composeMightAura(currentPlayer, run.fieldedMercCombatId) : undefined;
  const meditationAura = fresh && currentPlayer?.id === run.playerUnit.id
    ? composeMeditationAura(currentPlayer, fresh.manaRegenPerSecond ?? 0, run.fieldedMercCombatId) : undefined;
  const skeletonMastery = currentPlayer?.id === run.playerUnit.id
    ? composeSkeletonMastery(currentPlayer) : undefined;
  const playerTeam = run.carryPlayerTeam.map(unit => {
    if (!fresh || unit.id !== fresh.id) return unit;
    const mana = Math.min(unit.mana, fresh.stats.manaMax);
    const capped = mana >= fresh.stats.manaMax;
    const refreshed = { ...unit, level: fresh.level, stats: fresh.stats,
      life: Math.min(unit.life, fresh.stats.lifeMax), mana,
      manaRegenPerSecond: fresh.manaRegenPerSecond ?? 0,
      increasedDamagePct: fresh.increasedDamagePct ?? { fire: 0 },
      manaRegenCarry: capped ? 0 : unit.manaRegenCarry ?? 0,
      manaRegenCompensation: capped ? 0 : unit.manaRegenCompensation ?? 0,
      ...(capped ? { manaRegenExactCarry: '0' } : {}),
      skillOrder: fresh.skillOrder, skillLevels: fresh.skillLevels ?? {},
      equippedWeapon: fresh.equippedWeapon ?? {},
      summonGridPositions: fresh.summonGridPositions ?? [] };
    if (resolveFrozenArmorRank(fresh.skillLevels) > 0) return refreshed;
    // Invalidate only this new input; replay retains the original paid baseline.
    const { frozenArmor, ...unarmored } = refreshed;
    void frozenArmor;
    return { ...unarmored, activeBuffIds: refreshed.activeBuffIds.filter(id =>
      id !== 'skills-sorceress-frozen-armor' && id !== 'sorceress.frozen_armor' && id !== 'frozen-armor') };
  });

  const { events, result } = runBattleRecorded({
    seed: waveSeed,
    playerTeam,
    enemyTeam: enemies,
    ...(mightAura ? { mightAura } : {}),
    ...(meditationAura ? { meditationAura } : {}),
    ...(skeletonMastery ? { skeletonMastery } : {})
  });
  const terminal = events.at(-1);
  if (terminal?.kind !== 'end' || !Number.isFinite(terminal.simClockMs) ||
    terminal.simClockMs < 0 || terminal.simClockMs > MAX_SIM_MS) {
    throw new Error('Recorded battle must end with a valid terminal simulation clock');
  }

  const unitMap = new Map<string, string>();
  [...result.playerTeam, ...result.enemyTeam].forEach((unit) => {
    unitMap.set(unit.id, resolveCombatUnitDisplayName(unit));
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

  const outcome: RecordedBattleOutcome = {
    winner: result.winner,
    finalPlayerTeam: result.playerTeam,
    finalEnemyTeam: result.enemyTeam
  };
  const publication = stageRecordedBattle({
    initialPlayerTeam: playerTeam,
    initialEnemyTeam: enemies,
    events: playbackEvents,
    unitNameMap: unitMap,
    outcome,
    currentWave: waveIdx + 1,
    totalWaves: run.plan.waves.length,
    subAreaRunId: run.plan.subAreaId,
    resetRunRewards,
    ...(wave.presentation ? { wavePresentation: wave.presentation } : {})
  }, combat);
  return Object.freeze({ waveIdx, elapsedMs: terminal.simClockMs, publication,
    recording: Object.freeze({ outcome, events: playbackEvents, ...(chapterBoss ? { chapterBoss } : {}) }) });
}

/** Install captured run metadata once, then publish the complete captured value once. */
function installStagedWave(run: ActiveRun, staged: StagedWave): void {
  run.waveIdx = staged.waveIdx;
  run.waveElapsedMs = staged.elapsedMs;
  run.recording = staged.recording;
  useCombatStore.getState().publishStagedRecordedBattle(staged.publication);
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

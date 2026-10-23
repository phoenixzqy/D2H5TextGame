import { captureAct4Encounter, hasOriginalAct4Victory, isAct4AdmissionEligible, type Act4Encounter } from '@/engine/map/act4-admission';
import { loadQuests } from '@/data/loaders/quests';
/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import i18n from '@/i18n';
import type { BattleEvent } from '@/engine/combat/combat';
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
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { stageRecordedWave, type StagedRecordedWave } from './recordedWaveStaging';
import { captureCouncilEncounter, COUNCIL_QUEST_ID, COUNCIL_RECEIPT_SOURCE,
  hasOriginalCouncilVictory, isCouncilAdmissionEligible, type CouncilEncounter } from '@/engine/map/council-admission';
import { captureGuardianEncounter, GUARDIAN_QUEST_ID, hasOriginalGuardianVictory,
  isGuardianAdmissionEligible, type GuardianEncounter } from '@/engine/map/guardian-admission';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import { abandonRecordedWaves, readRecordedWaveInstallation, markRecordedWaveMetadataInstalled,
  observeRecordedWaveSelection, recognizeRecordedWavePublication, RecordedWaveReceiptError,
  prepareRecordedWaveInstallation, assertPreparedRecordedWaveBinding, cancelPreparedRecordedWave,
  commitPreparedRecordedWave, inspectRecordedWaves, readRecordedWaveSettlement,
  beginRecordedWaveSettlement, finishRecordedWaveSettlement, failRecordedWaveSettlement,
  type RecordedWaveReceipt, type RecordedWaveLive, type RecordedWaveInstallIntent, type RecordedWaveSettlementProgress } from './recordedWaveReceipt';
import { assertRecordedWaveNewTransitionAllowed, assertRecordedWaveReplayAllowed,
  assertRecordedWavePublicationRecoveryAllowed, RecordedWaveAccessError } from './recordedWaveAccess';
export { clearCombatAfterRestore } from './combatRunLifecycle';
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
import { aggregateEquipmentMods, applyEquipmentCoreMods } from '@/engine/progression/equipment-mods';
import { effectiveStatValue } from '@/engine/progression/stats';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { composeHeroRecovery } from '@/engine/progression/warmth';
import { resolveFrozenArmorRank } from '@/engine/skills/frozen-armor';
import { composeMightAura } from '@/engine/skills/might';
import { composeMeditationAura } from '@/engine/skills/meditation';
import { IRON_SKIN_DEFINITION, resolveIronSkinRank } from '@/engine/skills/iron-skin';
import { composeSkeletonMastery } from '@/engine/skills/skeleton-mastery';
import { composeGolemMastery } from '@/engine/skills/golem-mastery';
import { composeCorpseExplosion } from '@/engine/skills/corpse-explosion';
import { composePoisonExplosion } from '@/engine/skills/poison-explosion';
import { isPreparationSummonSkill } from '@/engine/skills/summon-preparation';
import { IRON_GOLEM_SKILL_ID, isIronGolemSkill } from '@/engine/skills/iron-golem';
import { projectIronGolemItem } from '@/engine/items/iron-golem';
import { captureIronGolemDebit, classifyIronGolemDebit, type IronGolemDebitIntent } from './ironGolemDebit';
import { clearIronGolemSelection, consumeIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { useHydrationStore } from './hydrationStore';
import { beginWaveTransition, endWaveTransition, beginIronGolemDebit, endIronGolemDebit, assertWaveSnapshotAllowed, WaveGuardError, type WaveTransitionLease } from './waveTransitionGuard';
import { resumeWaveDeferredSave } from './persistence';
import { canonicalSkillIdFromData, getSkillRequiredLevel, getSkillsForClass,
  skillIdAliases, type SkillTemplate } from './skillsHelpers';

/** Hold ownership through synchronous callbacks; wake a deferred save after release. */
function withWaveTransition<T>(operation: (lease: WaveTransitionLease) => T,
  access: 'transition' | 'replay' = 'transition', observation?: PublicationAttemptObservation): T {
  if (access === 'replay') assertRecordedWaveReplayAllowed();
  else assertRecordedWaveNewTransitionAllowed();
  const lease = beginWaveTransition(useHydrationStore.getState().status === 'ready');
  try { return operation(lease); } finally {
    if (endWaveTransition(lease)) resumePublicationDeferredSave(observation);
  }
}

const CHALLENGE_ORDINAL_PERIOD = 360360;
let manualChallengeOrdinal = 0;

/**
 * Pure production configuration boundary shared by combat and presentation.
 * Validate class, level, rank and prerequisites before scoped summon slots enter
 * the engine. This does not qualify owner life, mana, item payment or preparation.
 * Copies configuration without mutating the player or consulting transient state.
 */
export function scopedSummonConfiguration(player: Player): Pick<CombatUnit, 'skillOrder' | 'skillLevels'> {
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
  const freshStats = deriveEquippedPlayerStats(player, player.level, equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems);
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
 * Ordinary changes leave the recording frozen and apply on the next accepted wave.
 * Staging errors preserve the prior run, recording and terminal clock.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration
 * before explicit replay controls or staging; ordinary refresh remains a no-op.
 * @throws {RecordedWaveAccessError} for unpublished/conflicting/settled replay, after
 * primitive ownership checks and before hydration or explicit replay controls.
 */
export function refreshActivePlayerCombatConfig({
  replayCurrentWave = false
}: {
  readonly replayCurrentWave?: boolean;
} = {}): void {
  if (!replayCurrentWave) return;
  withWaveTransition(lease => {
    const run = combatRunLifecycle.activeRun;
    if (!run) return;
    const combat = useCombatStore.getState();
    if (combat.inCombat) {
      const original = requirePublishedRun(run, lease).binding;
      const attempt = captureWaveAttempt();
      // Locked replay reinstalls the exact original baseline, including failed attempts.
      // Unlocked replay keeps ordinary current-config semantics while suppressing Iron.
      const staged: StagedWaveAttempt = original.publication.ironGolemReplayLocked
        ? { engineInput: original.engineInput, attestation: null, waveIdx: original.targetWaveIdx,
            elapsedMs: original.waveElapsedMs, recording: original.recording,
            publication: original.publication, debitIntent: null }
        : stageWave(run, run.waveIdx, attempt, false, run.carryPlayerTeam, false);
      // Replay retains the originally captured origin, even if mutable plan copies changed.
      const { councilEncounter: _recaptured, guardianEncounter: _guardianRecaptured, act4Encounter: _act4Recaptured, ...replay } = staged;
      commitStagedWave(run, { ...replay,
        ...(original.councilEncounter ? { councilEncounter: original.councilEncounter } : {}),
        ...(original.guardianEncounter ? { guardianEncounter: original.guardianEncounter } : {}),
        ...(original.act4Encounter ? { act4Encounter: original.act4Encounter } : {}) },
      { kind: 'replay' }, attempt, lease);
    }
  }, 'replay');
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
 *   - `questRecovery`: explicit new Council encounter for historical claimed Khalim recovery.
 * @returns the resolved seed/ordinal and run identity, or null without a player.
 * @throws {RangeError} if a provided replay input is outside its integer range;
 * validation precedes any store, active-run or counter mutation.
 * @throws If wave planning, simulation, terminal validation or normalization fails;
 * the previous run, recording, ordinal and rewards remain unchanged.
 * Publisher failures retain exact recovery progress/payload, without restaging.
 * Canceled unpaid item-setter failures throw an Error wrapper whose own cause is
 * the original thrown value. Committed/conflicting setter failures throw that value.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration, after
 * replay argument validation and before player/no-run controls or other effects.
 * @throws {RecordedWaveAccessError} for unpublished/conflicting/failed settlement, after
 * argument/ownership checks and before hydration, staging or ordinal changes.
 */
export function startSubAreaRun(opts: {
  readonly subAreaId?: string | null;
  readonly act?: number;
  readonly level?: number;
  readonly mode?: 'manual' | 'idle';
  readonly runSeed?: number;
  readonly challengeOrdinal?: number;
  readonly questRecovery?: 'khalims-council';
} = {}): { runId: string; totalWaves: number; runSeed: number; challengeOrdinal: number } | null {
  return startSubAreaRunAttempt(opts);
}

function startSubAreaRunAttempt(opts: Parameters<typeof startSubAreaRun>[0] = {},
  observation?: PublicationAttemptObservation): ReturnType<typeof startSubAreaRun> {
  const recoveryMode: unknown = opts.questRecovery;
  if (recoveryMode !== undefined && recoveryMode !== 'khalims-council') {
    throw new RangeError('Unknown quest recovery mode');
  }
  if (opts.runSeed !== undefined &&
    (!Number.isInteger(opts.runSeed) || opts.runSeed < 0 || opts.runSeed > 0xffffffff)) {
    throw new RangeError('runSeed must be an unsigned 32-bit integer');
  }
  if (opts.challengeOrdinal !== undefined &&
    (!Number.isInteger(opts.challengeOrdinal) || opts.challengeOrdinal < 0 ||
      opts.challengeOrdinal >= CHALLENGE_ORDINAL_PERIOD)) {
    throw new RangeError('challengeOrdinal must be an integer in [0, 360360)');
  }
  return withWaveTransition(lease => {
    const playerState = usePlayerStore.getState();
    if (!playerState.player) {
      console.warn('[startSubAreaRun] no player; abort');
      return null;
    }
    const attempt = captureWaveAttempt();

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
    const projectedPlayer = playerToCombatUnit(playerState.player);
    const playerUnit = { ...projectedPlayer,
      life: projectedPlayer.stats.lifeMax, mana: projectedPlayer.stats.manaMax };
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
      ...(opts.questRecovery ? { questRecovery: opts.questRecovery } : {}),
      ...(mercUnit ? { fieldedMercCombatId: mercUnit.id } : {}),
      playerUnit,
      waveIdx: 0,
      carryPlayerTeam: playerTeam,
      waveElapsedMs: 0
    };

    const staged = stageWave(candidate, 0, attempt, true);
    commitStagedWave(candidate, staged, { kind: 'newRun', nextDefaultChallengeOrdinal:
      opts.challengeOrdinal === undefined ? (challengeOrdinal + 1) % CHALLENGE_ORDINAL_PERIOD : null }, attempt, lease);
    return { runId: plan.subAreaId, totalWaves: plan.waves.length, runSeed: seed, challengeOrdinal };
  }, 'transition', observation);
}

/**
 * Advance to the next wave (if any) or finish the run. Intended to be
 * invoked by the UI once `playbackComplete === true` for the current
 * wave's recorded battle. Completion settles once; next-wave staging may retry
 * using captured carry without repeating effects or rebasing.
 *
 * @returns the new state after the call:
 *   - `'next-wave'` — a new wave's recorded battle has been installed.
 *   - `'victory'`   — the run is fully cleared.
 *   - `'defeat'`    — the wave was not won, or the original hero died.
 *   - `'idle'`      — no active run or current playback is incomplete.
 * @throws {WaveGuardError} for wave/restore ownership or unready hydration before
 * no-run/playback controls and every completion effect.
 * @throws {RecordedWaveAccessError} for unpublished/conflicting/failed settlement, after
 * primitive ownership checks and before hydration or any completion effect.
 * @throws {RecordedWaveReceiptError} for missing or mismatched published authority.
 * Completion-effect errors retain actual gains and enter stable settlementFailed;
 * staging/publication errors retain awaiting carry or committed publication.
 */
export function advanceWaveOrFinish(): 'next-wave' | 'victory' | 'defeat' | 'idle' {
  return advanceWaveOrFinishAttempt();
}

function advanceWaveOrFinishAttempt(observation?: PublicationAttemptObservation): ReturnType<typeof advanceWaveOrFinish> {
  return withWaveTransition(lease => {
    const run = combatRunLifecycle.activeRun;
    if (!run) return 'idle';
    const { receipt, binding, progress } = requirePublishedRun(run, lease);
    let next: { readonly nextWaveIdx: number; readonly carryPlayerTeam: CombatUnit[] };
    if (progress.phase === 'awaitingNextWave') {
      next = progress;
    } else {
      const combat = useCombatStore.getState();
      if (!beginRecordedWaveSettlement(receipt, lease, { activeRun: run,
        heroId: usePlayerStore.getState().player?.id ?? null, combat })) return 'idle';
      const outcome = binding.recording.outcome;
      // Snapshot eligibility before ordinary income or any quest event can publish.
      const councilProgress = useMapStore.getState().questProgress[COUNCIL_QUEST_ID];
      const councilEncounter = binding.councilEncounter;
      const councilEligible = councilEncounter !== undefined &&
        isCouncilAdmissionEligible(useMapStore.getState().questProgress, councilEncounter.historicalRecovery);
      const act4Encounter = binding.act4Encounter;
      const act4Progress = act4Encounter ? useMapStore.getState().questProgress[act4Encounter.contract.questId] : undefined;
      const act4Eligible = act4Encounter !== undefined && isAct4AdmissionEligible(act4Encounter.contract,
        useMapStore.getState().questProgress);
      const publishAct4Victory = (): void => {
        if (!act4Eligible || !act4Progress ||
          !hasOriginalAct4Victory(act4Encounter, binding.heroId, outcome)) return;
        const contract = act4Encounter.contract;
        if (contract.source.kind === 'chapterBoss' && (binding.targetWaveIdx + 1 !== binding.publication.totalWaves ||
          binding.recording.chapterBoss?.unitId !== act4Encounter.originalMemberIds[0] ||
          binding.recording.chapterBoss?.archetypeId !== contract.members[0])) return;
        if (useMapStore.getState().questProgress[contract.questId] !== act4Progress) return;
        const result = withQuestTransaction(() => {
          const map = useMapStore.getState();
          if (!isAct4AdmissionEligible(contract, map.questProgress)) return;
          const quest = loadQuests().find(row => row.id === contract.questId);
          if (!quest) throw new Error('Missing Act IV quest contract');
          const objectives = { ...act4Progress.objectives, [contract.objectiveId]: true };
          const next = { ...act4Progress, objectives, status: quest.objectives.every(row => objectives[row.id])
            ? 'completed' as const : 'inProgress' as const };
          const before = map.questReceipts;
          validateQuestActionReceipts({ ...before, [contract.proof]: true },
            { ...map.questProgress, [contract.questId]: next }, useInventoryStore.getState().questItems);
          try {
            useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [contract.questId]: next },
              questReceipts: { ...state.questReceipts, [contract.proof]: true } }));
          } catch (cause) {
            try {
              useMapStore.setState(state => {
                const restored = { ...state.questReceipts };
                if (Object.hasOwn(before, contract.proof)) restored[contract.proof] = true;
                else Reflect.deleteProperty(restored, contract.proof);
                return { questProgress: { ...state.questProgress, [contract.questId]: act4Progress }, questReceipts: restored };
              });
            } catch (error) { throw new AggregateError([error], 'Act IV victory restoration failed', { cause }); }
            throw cause;
          }
        });
        if (result === 'claim-in-progress') throw new Error('Act IV victory transaction is busy');
      };
      const guardianProgress = useMapStore.getState().questProgress[GUARDIAN_QUEST_ID];
      const guardianEligible = (() => {
        const map = useMapStore.getState();
        if (!binding.guardianEncounter || !isGuardianAdmissionEligible(map.questProgress, map.questReceipts)) return false;
        try { validateQuestActionReceipts(map.questReceipts, map.questProgress, useInventoryStore.getState().questItems); return true; }
        catch { return false; }
      })();
      const publishGuardianVictory = (): void => {
        if (!guardianEligible || !guardianProgress || !binding.guardianEncounter ||
          binding.targetWaveIdx + 1 !== binding.publication.totalWaves ||
          binding.recording.chapterBoss?.unitId !== binding.guardianEncounter.originalBossId ||
          binding.recording.chapterBoss.archetypeId !== binding.guardianEncounter.archetypeId ||
          !hasOriginalGuardianVictory(binding.guardianEncounter, binding.heroId, outcome) ||
          useMapStore.getState().questProgress[GUARDIAN_QUEST_ID] !== guardianProgress) return;
        const result = withQuestTransaction(() => {
          const map = useMapStore.getState();
          if (!isGuardianAdmissionEligible(map.questProgress, map.questReceipts)) return;
          // The shared graph validator must admit the existing Orb and its retained history.
          validateQuestActionReceipts(map.questReceipts, map.questProgress, useInventoryStore.getState().questItems);
          const completed = { ...guardianProgress, status: 'completed' as const,
            objectives: { ...guardianProgress.objectives, 'obj-kill-mephisto': true } };
          validateQuestActionReceipts(map.questReceipts, { ...map.questProgress, [GUARDIAN_QUEST_ID]: completed },
            useInventoryStore.getState().questItems);
          try {
            useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [GUARDIAN_QUEST_ID]: completed } }));
          } catch (cause) {
            try {
              useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [GUARDIAN_QUEST_ID]: guardianProgress } }));
            } catch (error) {
              throw new AggregateError([error], 'Guardian progress restoration failed', { cause });
            }
            throw cause;
          }
        });
        if (result === 'claim-in-progress') throw new Error('Guardian victory transaction is busy');
      };
      const publishCouncilProof = (): void => {
        if (councilEligible &&
          hasOriginalCouncilVictory(councilEncounter, binding.heroId, outcome) &&
          useMapStore.getState().questProgress[COUNCIL_QUEST_ID] === councilProgress) {
          // Only this guarded accepted settlement can publish the Council action proof.
          const result = withQuestTransaction(() => {
            const before = useMapStore.getState().questReceipts;
            if (Object.hasOwn(before, COUNCIL_RECEIPT_SOURCE)) return;
            const receipts = validateQuestActionReceipts({ ...before, [COUNCIL_RECEIPT_SOURCE]: true },
              useMapStore.getState().questProgress, useInventoryStore.getState().questItems);
            try {
              useMapStore.setState({ questReceipts: receipts });
            } catch (cause) {
              try {
                useMapStore.setState(state => {
                  const { [COUNCIL_RECEIPT_SOURCE]: _removed, ...receipts } = state.questReceipts;
                  return { questReceipts: receipts };
                });
              } catch (error) {
                throw new AggregateError([error], 'Council proof restoration failed', { cause });
              }
              throw cause;
            }
          });
          if (result === 'claim-in-progress') throw new Error('Council proof transaction is busy');
        }
      };
      try {
        const completedWave = run.plan.waves[binding.targetWaveIdx];
        if (
          run.mode === 'idle' &&
          completedWave?.presentation?.idleEliteMissesAfterWave !== undefined
        ) {
          setIdleEliteMisses(completedWave.presentation.idleEliteMissesAfterWave);
        }

        const alivePlayer = outcome.finalPlayerTeam.find(
          (u) => u.id === binding.heroId && u.life > 0
        );
        if (outcome.winner !== 'player' || !alivePlayer) {
          combat.markRunDefeat();
          finishRecordedWaveSettlement(receipt, lease, { kind: 'terminal', result: 'defeat' });
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

          const wave = run.plan.waves[binding.targetWaveIdx];
          const tcId = wave?.lootTable ?? run.plan.defaultLootTable;
          const rewards = awardLootForVictory({
            slainEnemies: slain,
            act: run.act,
            treasureClassId: tcId,
            seed: run.seed ^ 0x9e3779b1 ^ binding.targetWaveIdx,
            magicFindMultiplier: multiplier
          });
          combat.accumulateRunRewards(rewards);
        }

        if (completedWave?.waveTier === 'boss' && !completedWave.presentation?.isActBoss &&
          completedWave.spawns.length === binding.engineInput.enemyTeam.length) {
          const originals = binding.engineInput.enemyTeam;
          const archetypeIds = completedWave.spawns.flatMap((spawn, index) => {
            const original = originals[index];
            if (spawn.tier !== 'boss' || spawn.chapterBoss !== undefined || !getMonsterIndex().has(spawn.archetypeId) ||
              !original || original.side !== 'enemy' || original.kind !== 'monster' || original.tier !== 'boss' ||
              original.monsterArchetypeId !== spawn.archetypeId ||
              originals.filter(unit => unit.id === original.id).length !== 1) return [];
            const matches = outcome.finalEnemyTeam.filter(enemy => enemy.id === original.id);
            const final = matches[0];
            return matches.length === 1 && final?.side === 'enemy' && final.kind === 'monster' &&
              final.tier === 'boss' && final.monsterArchetypeId === spawn.archetypeId &&
              Number.isFinite(final.life) && final.life <= 0 ? [spawn.archetypeId] : [];
          });
          if (archetypeIds.length > 0) useMapStore.getState().recordMonsterKills({
            actId: `acts/act${String(run.act)}`, areaId: run.plan.subAreaId, archetypeIds,
            ...(completedWave.source ? { source: completedWave.source } : {})
          });
        }

        const nextIdx = binding.targetWaveIdx + 1;
        if (nextIdx >= run.plan.waves.length) {
          const recording = binding.recording;
          const boss = recording.chapterBoss;
          if (boss && outcome === recording.outcome && combat.recordedEvents === recording.events &&
            combat.subAreaRunId === run.plan.subAreaId &&
            combat.currentWave === binding.targetWaveIdx + 1 && combat.totalWaves === run.plan.waves.length &&
            outcome.finalEnemyTeam.some(enemy => enemy.id === boss.unitId && enemy.side === 'enemy' &&
              enemy.kind === 'monster' && enemy.tier === 'chapter-boss' && enemy.life <= 0)) {
            useMapStore.getState().recordBossKill({
              actId: `acts/act${String(run.act)}`,
              areaId: run.plan.subAreaId,
              bossArchetypeId: boss.archetypeId,
              ...(completedWave?.source ? { source: completedWave.source } : {})
            });
          }
          // Only a complete sequence of won waves can clear an area or unlock idle.
          useMapStore.getState().markCleared(run.plan.subAreaId);
          combat.markRunVictory();
          publishCouncilProof();
          publishGuardianVictory();
          publishAct4Victory();
          finishRecordedWaveSettlement(receipt, lease, { kind: 'terminal', result: 'victory' });
          combatRunLifecycle.activeRun = null;
          return 'victory';
        }
        const carryPlayerTeam = outcome.finalPlayerTeam
          .filter(u => inferKind(u) !== 'summon' && u.life > 0)
          .map(u => rebaseStatusClock(u, binding.waveElapsedMs));
        publishCouncilProof();
        publishAct4Victory();
        finishRecordedWaveSettlement(receipt, lease, { kind: 'nextWave', carryPlayerTeam });
        next = { nextWaveIdx: binding.targetWaveIdx + 1, carryPlayerTeam };
      } catch (error) {
        failRecordedWaveSettlement(receipt, lease, { error });
        throw error;
      }
    }
    // Staging/publication failures retain awaiting carry or committed publication;
    // they must never turn a successfully paid wave into settlementFailed.
    const attempt = captureWaveAttempt();
    const staged = stageWave(run, next.nextWaveIdx, attempt, false, next.carryPlayerTeam);
    commitStagedWave(run, staged, { kind: 'newWave', carryPlayerTeam: next.carryPlayerTeam }, attempt, lease);
    return 'next-wave';
  }, 'transition', observation);
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

/** Build the whole recording before changing any run metadata or combat state. */
interface StagedWaveAttempt extends StagedRecordedWave {
  readonly councilEncounter?: CouncilEncounter;
  readonly guardianEncounter?: GuardianEncounter;
  readonly act4Encounter?: Act4Encounter;
  readonly debitIntent: IronGolemDebitIntent | null;
}
function stageWave(run: ActiveRun, waveIdx: number, attempt: WaveAttempt, resetRunRewards = false,
  carryPlayerTeam = run.carryPlayerTeam, allowIron = true): StagedWaveAttempt {
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
  const golemMastery = currentPlayer?.id === run.playerUnit.id
    ? composeGolemMastery(currentPlayer) : undefined;
  const corpseExplosion = currentPlayer?.id === run.playerUnit.id
    ? composeCorpseExplosion(currentPlayer) : undefined;
  const poisonExplosion = currentPlayer?.id === run.playerUnit.id
    ? composePoisonExplosion(currentPlayer) : undefined;
  const playerTeam = carryPlayerTeam.map(unit => {
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
      skillOrder: allowIron ? fresh.skillOrder : fresh.skillOrder.filter(id => !isIronGolemSkill({ id })),
      skillLevels: fresh.skillLevels ?? {},
      equippedWeapon: fresh.equippedWeapon ?? {},
      summonGridPositions: fresh.summonGridPositions ?? [] };
    if (resolveFrozenArmorRank(fresh.skillLevels) > 0) return refreshed;
    // Invalidate only this new input; replay retains the original paid baseline.
    const { frozenArmor, ...unarmored } = refreshed;
    void frozenArmor;
    return { ...unarmored, activeBuffIds: refreshed.activeBuffIds.filter(id =>
      id !== 'skills-sorceress-frozen-armor' && id !== 'sorceress.frozen_armor' && id !== 'frozen-armor') };
  });

  // Qualification comes from the filtered Player configuration, independently of
  // life, item, mana, full preload or terminal startup success.
  const ironGolemReplayLocked = allowIron && Boolean(fresh?.skillOrder.some(id => isIronGolemSkill({ id })));
  const captured = ironGolemReplayLocked
    ? captureIronGolemDebit(attempt.heroId, attempt.selection, attempt.ownership) : null;
  const projected = captured?.ok ? projectIronGolemItem(captured.intent.item) : null;
  const ironGolem = captured?.ok && projected?.eligible
    ? { sourceHeroId: run.playerUnit.id, sourceItemId: captured.intent.item.id, ...projected.bonuses } : null;
  const councilEncounter = captureCouncilEncounter(run.act, run.plan.subAreaId, wave,
    enemies, run.questRecovery === 'khalims-council');
  const guardianEncounter = captureGuardianEncounter(run.act, run.plan.subAreaId, wave, enemies);
  const act4Encounter = captureAct4Encounter(run.act, run.plan.subAreaId, wave, enemies);
  const staged = stageRecordedWave({
    snapshot: {
      seed: waveSeed,
      playerTeam,
      enemyTeam: enemies,
      ...(ironGolem ? { ironGolem } : {}),
      ...(mightAura ? { mightAura } : {}),
      ...(meditationAura ? { meditationAura } : {}),
      ...(skeletonMastery ? { skeletonMastery } : {}),
      ...(golemMastery ? { golemMastery } : {}),
      ...(corpseExplosion ? { corpseExplosion: [corpseExplosion] } : {}),
      ...(poisonExplosion ? { poisonExplosion: [poisonExplosion] } : {})
    },
    waveIdx,
    totalWaves: run.plan.waves.length,
    subAreaRunId: run.plan.subAreaId,
    defaults: combat,
    resolveDisplayName: resolveCombatUnitDisplayName,
    resetRunRewards,
    ironGolemReplayLocked,
    ...(chapterBoss ? { chapterBoss } : {}),
    ...(wave.bossIntro ? { bossIntro: wave.bossIntro } : {}),
    ...(wave.presentation ? { wavePresentation: wave.presentation } : {})
  });
  const proof = staged.attestation;
  if (proof && (!captured?.ok || !ironGolem || proof.sourceHeroId !== ironGolem.sourceHeroId ||
    proof.sourceItemId !== ironGolem.sourceItemId || !Object.is(proof.skillId, IRON_GOLEM_SKILL_ID) ||
    !Number.isFinite(proof.paidMp) || proof.paidMp <= 0 || !staged.recording.events.some(event =>
      event.kind === 'summon' && event.owner === proof.sourceHeroId && event.summonId === 'iron_golem' &&
      event.unit.id === proof.spawnedUnitId && event.simClockMs === 0))) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  return { ...staged, debitIntent: proof && captured?.ok ? captured.intent : null,
    ...(councilEncounter ? { councilEncounter } : {}),
    ...(guardianEncounter ? { guardianEncounter } : {}),
    ...(act4Encounter ? { act4Encounter } : {}) };
}

/** Preserve cursor/recording values even if the referenced run changes during staging. */
interface WaveAttempt extends RecordedWaveLive {
  readonly waveIdx: number | null;
  readonly recording: ActiveRun['recording'];
}
/** Read exact operation-boundary references before staging, and again before commitment. */
function captureWaveAttempt(): WaveAttempt {
  const inventory = useInventoryStore.getState();
  const run = combatRunLifecycle.activeRun;
  return { activeRun: run, waveIdx: run?.waveIdx ?? null, recording: run?.recording,
    heroId: usePlayerStore.getState().player?.id ?? null,
    selection: useIronGolemSelectionStore.getState().selection,
    ownership: { backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
      mercEquipment: useMercStore.getState().mercEquipment } };
}

/** Active production runs require exact published installation authority, without fallback. */
function requirePublishedRun(run: ActiveRun, lease: WaveTransitionLease) {
  const current = inspectRecordedWaves().currentPublished;
  if (!current) throw new RecordedWaveReceiptError('bindingMismatch');
  const settlement = readRecordedWaveSettlement(current.receipt, lease);
  const { binding } = settlement;
  if (binding.candidateRun !== run || binding.heroId !== usePlayerStore.getState().player?.id ||
    run.playerUnit.id !== binding.heroId || run.waveIdx !== binding.targetWaveIdx || run.recording !== binding.recording) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  return { receipt: current.receipt, ...settlement };
}

function validateCapturedOrdinal(ordinal: number | null): void {
  if (ordinal !== null && (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= CHALLENGE_ORDINAL_PERIOD)) {
    throw new RangeError('nextDefaultChallengeOrdinal must be an integer in [0, 360360)');
  }
}

/** A canceled unpaid setter failure; original thrown value remains an own cause. */
class UnpaidIronGolemDebitError extends Error {
  constructor(error: unknown) {
    super('ironGolemDebitUnpaid', { cause: error }); this.name = 'UnpaidIronGolemDebitError';
  }
}

/** Prepare, exact-revalidate, observe actual debit, then install under the existing lease. */
function commitStagedWave(run: ActiveRun, staged: StagedWaveAttempt, intent: RecordedWaveInstallIntent,
  attempt: WaveAttempt, lease: WaveTransitionLease): void {
  if (intent.kind === 'newRun') validateCapturedOrdinal(intent.nextDefaultChallengeOrdinal);
  const receipt = prepareRecordedWaveInstallation({ candidateRun: run, expectedActiveRun: attempt.activeRun,
    heroId: run.playerUnit.id, targetWaveIdx: staged.waveIdx, waveElapsedMs: staged.elapsedMs,
    selection: attempt.selection, ownership: attempt.ownership, debitIntent: staged.debitIntent,
    engineInput: staged.engineInput, attestation: staged.attestation,
    ...(staged.councilEncounter ? { councilEncounter: staged.councilEncounter } : {}),
    ...(staged.guardianEncounter ? { guardianEncounter: staged.guardianEncounter } : {}),
    ...(staged.act4Encounter ? { act4Encounter: staged.act4Encounter } : {}),
    recording: staged.recording, publication: staged.publication }, intent, lease);
  const live = captureWaveAttempt();
  try {
    if (live.waveIdx !== attempt.waveIdx || live.recording !== attempt.recording) {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
    assertPreparedRecordedWaveBinding(receipt, lease, live);
  }
  catch (error) {
    // No setter has run: the exact captured preparation is provably unpaid.
    cancelPreparedRecordedWave(receipt, lease, attempt.ownership);
    throw error;
  }
  if (staged.debitIntent) {
    let failure: { error: unknown } | undefined;
    beginIronGolemDebit(lease);
    try {
      // Exact identity is the debit proof. Supported inventory operations replace
      // arrays immutably; do not copy this privately owned frozen expected array.
      useInventoryStore.setState({ backpack: staged.debitIntent.expectedBackpack as Item[] });
    } catch (error) { failure = { error }; }
    finally { endIronGolemDebit(lease); }
    const observed = captureWaveAttempt();
    let phase: ReturnType<typeof commitPreparedRecordedWave>;
    try { phase = commitPreparedRecordedWave(receipt, lease, observed, failure); }
    catch (error) {
      if (classifyIronGolemDebit(staged.debitIntent, observed.ownership) === 'original') {
        cancelPreparedRecordedWave(receipt, lease, observed.ownership);
        if (failure) throw new UnpaidIronGolemDebitError(failure.error);
      }
      throw error;
    }
    if (phase === 'prepared') {
      // Postwrite cancellation may use only verified LIVE original ownership.
      cancelPreparedRecordedWave(receipt, lease, observed.ownership);
      if (failure) throw new UnpaidIronGolemDebitError(failure.error);
      throw new RecordedWaveReceiptError('bindingMismatch'); // Silent unchanged setter.
    }
    if (failure) throw failure.error; // Exact committed/conflict receipt retains the first error.
    if (phase !== 'committedPendingPublication') throw new RecordedWaveReceiptError('bindingMismatch');
  } else if (commitPreparedRecordedWave(receipt, lease, live) !== 'committedPendingPublication') {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  installCapturedRecordedWave(receipt, lease);
}

/** Private attempt-local diagnostics; durable receipts retain their first error. */
interface PublicationAttemptObservation {
  failure?: { readonly error: unknown };
  wakeFailure?: { readonly error: unknown };
}

/** Install only the committed captured payload; never stage, debit or pay rewards. */
function installCapturedRecordedWave(receipt: RecordedWaveReceipt, lease: WaveTransitionLease,
  observation?: PublicationAttemptObservation): void {
  const view = readRecordedWaveInstallation(receipt, lease);
  const { binding, intent } = view;
  // Counter policy remains local to helpers, including retained recovery input.
  if (intent.kind === 'newRun') validateCapturedOrdinal(intent.nextDefaultChallengeOrdinal);
  if (!view.metadataInstalled) {
    const run = binding.candidateRun;
    combatRunLifecycle.activeRun = run;
    if (intent.kind === 'newWave') run.carryPlayerTeam = intent.carryPlayerTeam;
    run.waveIdx = binding.targetWaveIdx;
    run.waveElapsedMs = binding.waveElapsedMs;
    run.recording = binding.recording;
    if (intent.kind === 'newRun' && intent.nextDefaultChallengeOrdinal !== null) {
      manualChallengeOrdinal = intent.nextDefaultChallengeOrdinal;
    }
    markRecordedWaveMetadataInstalled(receipt, lease);
  }
  if (view.selectionProgress === 'pending') {
    let failure: { error: unknown } | undefined;
    try { consumeIronGolemSelection(binding.selection, lease); }
    catch (error) {
      failure = { error };
      if (observation) observation.failure = failure;
    }
    observeRecordedWaveSelection(receipt, lease, useIronGolemSelectionStore.getState().selection, failure);
    if (failure) throw failure.error;
    if (readRecordedWaveInstallation(receipt, lease).selectionProgress === 'pending') {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
  }
  const live = () => ({ activeRun: combatRunLifecycle.activeRun,
    heroId: usePlayerStore.getState().player?.id ?? null, combat: useCombatStore.getState() });
  try { useCombatStore.getState().publishStagedRecordedBattle(binding.publication); }
  catch (error) {
    if (observation) observation.failure = { error };
    recognizeRecordedWavePublication(receipt, lease, live(), { error });
    throw error;
  }
  if (!recognizeRecordedWavePublication(receipt, lease, live())) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
}

/**
 * Recover exactly one retained committed installation without simulation, item
 * payment, reward settlement or ordinal increments. Foundation-only, stale and
 * wrong-phase tokens refuse.
 * @throws {WaveGuardError} for primitive ownership or unready hydration first.
 * @throws {RecordedWaveReceiptError} for token/phase/installation mismatch.
 * @throws {RangeError} for invalid retained ordinal before any installation change.
 * Setter errors retain exact progress/payload and their first failure evidence.
 */
export function recoverRecordedWavePublication(receipt: RecordedWaveReceipt): void {
  recoverPublicationAttempt(receipt);
}

function recoverPublicationAttempt(receipt: RecordedWaveReceipt, observation?: PublicationAttemptObservation): void {
  assertWaveSnapshotAllowed();
  const lease = beginWaveTransition(useHydrationStore.getState().status === 'ready');
  try {
    assertRecordedWavePublicationRecoveryAllowed(receipt, lease);
    installCapturedRecordedWave(receipt, lease, observation);
  } finally {
    if (endWaveTransition(lease)) resumePublicationDeferredSave(observation);
  }
}

function resumePublicationDeferredSave(observation?: PublicationAttemptObservation): void {
  try { resumeWaveDeferredSave(); }
  catch (error) {
    // This exception belongs to the wake, even when its value equals a setter failure.
    if (observation) {
      delete observation.failure;
      observation.wakeFailure = { error };
    }
    throw error;
  }
}


/** Process-local recovery displayed by CombatScreen; never persisted or auto-executed. */
export type CombatTransitionRecovery =
  | { readonly kind: 'ready' }
  | { readonly kind: 'recoverPublication'; readonly receipt: RecordedWaveReceipt }
  | { readonly kind: 'retryNextWave'; readonly receipt: RecordedWaveReceipt;
      readonly progress: Extract<RecordedWaveSettlementProgress, { phase: 'awaitingNextWave' }> }
  | { readonly kind: 'parked'; readonly reason: 'conflict' | 'settling' | 'settlementFailed' };

/** Observe recovery without staging, publication or any gameplay effect. */
export function readCombatTransitionRecovery(): CombatTransitionRecovery {
  const { pending, currentPublished } = inspectRecordedWaves();
  if (pending?.phase === 'conflict') return { kind: 'parked', reason: 'conflict' };
  if (pending?.phase === 'committedPendingPublication' && pending.installation) {
    return { kind: 'recoverPublication', receipt: pending.receipt };
  }
  const progress = currentPublished?.installation?.settlement.progress;
  if (progress?.phase === 'settling' || progress?.phase === 'settlementFailed') {
    return { kind: 'parked', reason: progress.phase };
  }
  if (!pending && currentPublished && progress?.phase === 'awaitingNextWave') {
    return { kind: 'retryNextWave', receipt: currentPublished.receipt, progress };
  }
  // Foundation-only pending phases retain their existing typed access refusals.
  return { kind: 'ready' };
}

/** Explicit screen operations, with the exact recovery that was displayed. */
export type CombatScreenTransition =
  | { readonly kind: 'start'; readonly options?: Parameters<typeof startSubAreaRun>[0] }
  | { readonly kind: 'advance' }
  | { readonly kind: 'retry'; readonly recovery: CombatTransitionRecovery };

/**
 * Perform one explicit operation. False requires Retry or abandonment; true resumes
 * existing UI behavior (hydration remains independently gated). Classify only typed
 * refusals or exact newly observed failure evidence; unrelated thrown values escape.
 * Retry never substitutes another receipt or falls back to start/ordinary advance.
 */
export function performCombatScreenTransition(action: CombatScreenTransition): boolean {
  const before = inspectRecordedWaves();
  const retryAttempt: PublicationAttemptObservation = {};
  let advances = action.kind === 'advance';
  try {
    if (action.kind === 'start') startSubAreaRunAttempt(action.options, retryAttempt);
    else if (action.kind === 'advance') advanceWaveOrFinishAttempt(retryAttempt);
    else {
      const displayed = action.recovery; const live = readCombatTransitionRecovery();
      if (displayed.kind === 'parked') return false;
      if (displayed.kind !== live.kind ||
        (displayed.kind === 'recoverPublication' &&
          (live.kind !== 'recoverPublication' || displayed.receipt !== live.receipt)) ||
        (displayed.kind === 'retryNextWave' && (live.kind !== 'retryNextWave' ||
          displayed.receipt !== live.receipt || displayed.progress !== live.progress))) {
        throw new RecordedWaveReceiptError('staleReceipt');
      }
      if (displayed.kind === 'recoverPublication') recoverPublicationAttempt(displayed.receipt, retryAttempt);
      else if (displayed.kind === 'retryNextWave') { advances = true; advanceWaveOrFinishAttempt(retryAttempt); }
    }
    return true;
  } catch (error) {
    // Origin is observed before classifying typed refusals or retained gameplay errors.
    if (retryAttempt.wakeFailure !== undefined) throw error;
    if (error instanceof WaveGuardError) return error.code === 'hydrationNotReady';
    if (error instanceof RecordedWaveAccessError || error instanceof RecordedWaveReceiptError ||
      error instanceof UnpaidIronGolemDebitError) return false;
    const after = inspectRecordedWaves();
    const retryReceipt = action.kind === 'retry' && action.recovery.kind === 'recoverPublication'
      ? action.recovery.receipt : null;
    const failedHere = (view: typeof after.pending, previous: typeof before.pending) => view !== null && view !== previous &&
      (retryReceipt !== null
        ? view.receipt === retryReceipt && retryAttempt.failure !== undefined && Object.is(retryAttempt.failure.error, error)
        : [view.debitFailure, view.publicationFailure, view.installation?.selectionFailure,
          view.installation?.settlement.progress.phase === 'settlementFailed'
            ? view.installation.settlement.progress.failure : undefined]
          .some(failure => failure !== undefined && Object.prototype.hasOwnProperty.call(failure, 'error') && Object.is(failure.error, error)));
    if (failedHere(after.pending, before.pending)) return false;
    if (failedHere(after.currentPublished, before.currentPublished)) {
      // A publisher may notify then throw after its exact complete value was written.
      return after.pending === null && readCombatTransitionRecovery().kind === 'ready';
    }
    // Staging has no retained error; classify it only inside our own advance.
    if (advances && readCombatTransitionRecovery().kind === 'retryNextWave') return false;
    throw error;
  }
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

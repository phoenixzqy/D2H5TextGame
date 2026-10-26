import { advanceEndgameWave, captureEndgameWave, prepareEndgameAttempt, type EndgameWaveBinding } from '@/engine/endgame/runtime';
import { readEndgameState } from '@/engine/endgame/state';
import type { EndgameState } from '@/engine/endgame/types';
import { captureAct5Encounter, captureAct5ThroneWave, EVE_QUEST, THRONE_PROOF, type Act5Encounter } from '@/engine/map/act5-admission';
import { captureAct5SettlementRollback, prepareAct5Settlement } from './act5QuestAdmission';
import { captureAct4Encounter, hasOriginalAct4Victory, isAct4AdmissionEligible, type Act4Encounter } from '@/engine/map/act4-admission';
import { loadQuests } from '@/data/loaders/quests';
import { applyReplayProfileToPlan, type ReplayProfileId } from '@/engine/map/replay-profile';
import { validateCurrentCampaignRewards } from '@/engine/save/current-campaign';
/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import i18n from '@/i18n';
import type { BattleEvent } from '@/engine/combat/combat';
import { rebaseStatusClock } from '@/engine/combat/status';
import { composeDruidShapeshifting, refreshDruidFormState } from '@/engine/skills/druid-shapeshifting';
import { composeBurstOfSpeedRank } from '@/engine/skills/burst-of-speed';
import { composeConcentrateRank } from '@/engine/skills/concentrate';
import { composeSorceressBuffRanks } from '@/engine/skills/sorceress-buffs';
import { composeCloakOfShadowsRank } from '@/engine/skills/cloak-of-shadows';
import { composeLeapRank } from '@/engine/skills/leap';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { resolveEquippedRunewordGrants } from '@/engine/items/runeword-grants';
import { composeRunewordCombatModifiers } from '@/engine/items/runeword-combat';
import type { MonsterDef } from '@/engine/types/monsters';
import { rollKillRewards, type KillRewards } from '@/engine/loot/award';
import { mergeRewards, planRewardGrant } from '@/engine/loot/reward-plan';
import { xpForKill } from '@/engine/progression/xp';
import {
  buildMonsterUnit,
  resolveChallengeWavePlan,
  synthDefaultPlan,
  type WaveSpec
} from '@/engine/combat';
import { loadAwardPools } from '@/data/loaders/loot';
import { eliteConfig, monsters as monsterList } from '@/data/index';
import { resolveSubArea } from './subAreaResolver';
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { stageRecordedWave, type StagedRecordedWave } from './recordedWaveStaging';
import { hasBattleCommandCarry } from '@/engine/combat/combat';
import { nativeBattleCommandCarry, transferBattleCommandCarry } from './battleCommandCarry';
import { captureCouncilEncounter, COUNCIL_QUEST_ID, COUNCIL_RECEIPT_SOURCE,
  hasOriginalCouncilVictory, isCouncilAdmissionEligible, type CouncilEncounter } from '@/engine/map/council-admission';
import { captureGuardianEncounter, GUARDIAN_QUEST_ID, hasOriginalGuardianVictory,
  isGuardianAdmissionEligible, type GuardianEncounter } from '@/engine/map/guardian-admission';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { combatRunLifecycle, type ActiveRun, type RunOrigin } from './combatRunLifecycle';
import { abandonRecordedWaves, readRecordedWaveInstallation, markRecordedWaveMetadataInstalled,
  observeRecordedWaveSelection, observeRecordedWaveEntry, recognizeRecordedWavePublication, RecordedWaveReceiptError,
  prepareRecordedWaveInstallation, assertPreparedRecordedWaveBinding, cancelPreparedRecordedWave,
  commitPreparedRecordedWave, inspectRecordedWaves, readRecordedWaveSettlement,
  beginRecordedWaveSettlement, finishRecordedWaveSettlement, failRecordedWaveSettlement,
  type RecordedWaveReceipt, type RecordedWaveBinding, type RecordedWaveLive, type RecordedWaveInstallIntent, type RecordedWaveSettlementProgress } from './recordedWaveReceipt';
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
import { composeColdMastery } from '@/engine/skills/cold-mastery';
import { composeStaticField } from '@/engine/skills/static-field';
import { resolveFrozenArmorRank } from '@/engine/skills/frozen-armor';
import { composeColdArmorRanks, refreshColdArmorState } from '@/engine/skills/cold-armors';
import { composePeriodicSpellRanks } from '@/engine/skills/periodic-spell-authority';
import { composeHydraRank } from '@/engine/skills/hydra';
import { refreshPeriodicSpells } from '@/engine/skills/periodic-spells';
import { composeMightAura } from '@/engine/skills/might';
import { composeMeditationAura } from '@/engine/skills/meditation';
import { activeStatAura, composeStatAura } from '@/engine/skills/stat-auras';
import { activeDruidAllyAuras, composeDruidAllyAuras } from '@/engine/skills/druid-ally-auras';
import { composeSpiritOfBarbs } from '@/engine/skills/spirit-of-barbs';
import { withoutTemporaryLifeCapacity } from '@/engine/combat/life-capacity';
import { composeBarbarianPassives } from '@/engine/skills/barbarian-passives';
import { composeBoneArmor } from '@/engine/skills/bone-armor';
import { composeBonePrisonRank } from '@/engine/skills/bone-prison';
import { composeEnergyShield } from '@/engine/skills/energy-shield';
import { composeConversionRank } from '@/engine/skills/conversion';
import { composeHolyShieldRank, refreshHolyShieldState } from '@/engine/skills/holy-shield';
import { composeCycloneArmorRank, refreshCycloneArmorState } from '@/engine/skills/cyclone-armor';
import { composeDamageMasteries } from '@/engine/skills/damage-masteries';
import { isDualWielding } from '@/engine/items/equipped-weapon';
import { composeAssassinShadowPassives, composeAssassinVenom } from '@/engine/skills/assassin-shadow';
import { composeAssassinWeaponPassives } from '@/engine/skills/assassin-weapon-passives';
import { composeAmazonPassives } from '@/engine/skills/amazon-passives';
import { composeSkeletonMastery } from '@/engine/skills/skeleton-mastery';
import { composeSummonPassives } from '@/engine/skills/summon-passives';
import { composeGolemMastery } from '@/engine/skills/golem-mastery';
import { composeCorpseExplosion } from '@/engine/skills/corpse-explosion';
import { composeFindPotion } from '@/engine/skills/find-potion';
import { composeFindItem, findItemBonusEnemies } from '@/engine/skills/find-item';
import { composeGrimWard } from '@/engine/skills/grim-ward';
import { captureBattleCommandPassiveProfile, composeBattleCommandRank } from '@/engine/skills/battle-command';
import { composePoisonExplosion } from '@/engine/skills/poison-explosion';
import { isPreparationSummonSkill } from '@/engine/skills/summon-preparation';
import { IRON_GOLEM_SKILL_ID, isIronGolemSkill } from '@/engine/skills/iron-golem';
import { projectIronGolemItem } from '@/engine/items/iron-golem';
import { captureIronGolemDebit, classifyIronGolemDebit, type IronGolemDebitIntent } from './ironGolemDebit';
import { clearIronGolemSelection, consumeIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { useHydrationStore } from './hydrationStore';
import { beginWaveTransition, endWaveTransition, beginIronGolemDebit, endIronGolemDebit, assertWaveSnapshotAllowed,
  assertIronGolemOwnershipMutationAllowed, WaveGuardError, type WaveTransitionLease } from './waveTransitionGuard';
import { resumeWaveDeferredSave } from './persistence';
import { canonicalSkillIdFromData, getSkillRequiredLevel, getSkillsForClass,
  skillIdAliases, type SkillTemplate } from './skillsHelpers';
import { projectGovernedActives, type GovernedActiveRanks } from '@/engine/skills/runeword-actives';
import { projectPlayerClassActives } from '@/engine/skills/player-class-actives';
import { composeFeralRageRank } from '@/engine/skills/druid-sustain';
import { composeFrenzyRank } from '@/engine/skills/frenzy';
import { composeDruidSummonRanks } from '@/engine/skills/druid-summon-authority';
import { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';
export { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';

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

/**
 * Pure production configuration boundary shared by combat and presentation.
 * Validate class, level, rank and prerequisites before authored class slots enter
 * the engine. D06 summons retain direct prerequisites; ordinary actives require
 * transitive learned ownership. This does not qualify resources or item payment.
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
  return projectPlayerClassActives({ classId: player.class, level: player.level, skillOrder, skillLevels });
}

/**
 * Convert a Player to a CombatUnit for battle.
 *
 * Derives weapon metadata and stats from the same canonical equipment snapshot
 * so the AI
 * skill chooser can apply weapon-type / handedness gates
 * (see {@link import('@/engine/skills/eligibility').canCastSkill}).
 */
export function playerToCombatUnit(player: Player): CombatUnit & { readonly governedActiveRanks: GovernedActiveRanks } {
  const baseline = composeNativeCombatUnit(player, 0);
  if (player.class !== 'barbarian') return baseline;
  return { ...baseline, battleCommandPassives: Object.freeze({
    baseline: captureBattleCommandPassiveProfile(baseline),
    boosted: captureBattleCommandPassiveProfile(composeNativeCombatUnit(player, 1)) }) };
}

/** One stat/equipment composition for both learned and temporarily boosted passives. */
function composeNativeCombatUnit(player: Player, temporarySkillRankBonus: 0 | 1):
  CombatUnit & { readonly governedActiveRanks: GovernedActiveRanks } {
  const equipped = useInventoryStore.getState().equipped;
  const equippedWeapon = resolveEquippedWeapon(equipped);
  const mods = aggregateEquipmentMods(equipped);
  const core = applyEquipmentCoreMods(player.coreStats, mods);
  const map = useMapStore.getState();
  const freshStats = deriveEquippedPlayerStats(player, player.level, equipped, map.questProgress,
    useInventoryStore.getState().questItems, map.questReceipts);
  const { endurance, mastery, warcries, ironSkinDefenseBonus } = composeBarbarianPassives({
    classId: player.class, level: player.level, ...equippedWeapon, temporarySkillRankBonus,
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const amazon = composeAmazonPassives({ classId: player.class, level: player.level,
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const assassin = composeAssassinWeaponPassives({ classId: player.class, level: player.level,
    ...equippedWeapon, dualWielding: isDualWielding(equipped),
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const physicalDamagePct = mastery.physicalDamagePct + amazon.physicalDamagePct;
  const damageMasteries = composeDamageMasteries({ classId: player.class, level: player.level,
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const shadow = composeAssassinShadowPassives(player);
  const energyShield = composeEnergyShield(player);
  const allResistanceBonus = endurance.resistAllBonus + shadow.resistAllBonus;
  const lifeMax = freshStats.lifeMax * (endurance.lifeMultiplier + warcries.lifeBonus);
  const stats = { ...freshStats,
    lifeMax,
    attackSpeed: freshStats.attackSpeed * endurance.attackSpeedMultiplier * mastery.attackSpeedMultiplier,
    attack: freshStats.attack * amazon.attackMultiplier * assassin.attackMultiplier,
    critChance: freshStats.critChance + amazon.critChanceBonus + mastery.critChanceBonus + assassin.critChanceBonus,
    physDodge: freshStats.physDodge + amazon.physDodgeBonus + endurance.physDodgeBonus + assassin.physDodgeBonus,
    magicDodge: freshStats.magicDodge + amazon.magicDodgeBonus + endurance.magicDodgeBonus + damageMasteries.magicDodgeBonus + assassin.magicDodgeBonus + shadow.magicDodgeBonus,
    resistances: { physical: freshStats.resistances.physical + allResistanceBonus,
      fire: freshStats.resistances.fire + allResistanceBonus,
      cold: freshStats.resistances.cold + allResistanceBonus,
      lightning: freshStats.resistances.lightning + allResistanceBonus,
      arcane: freshStats.resistances.arcane + allResistanceBonus,
      poison: freshStats.resistances.poison + allResistanceBonus },
    defense: freshStats.defense * (1 + ironSkinDefenseBonus + warcries.defenseBonus),
    life: Math.min(player.derivedStats.life, lifeMax),
    mana: Math.min(player.derivedStats.mana, freshStats.manaMax) };
  const recovery = composeHeroRecovery({ classId: player.class, level: player.level,
    effectiveEnergy: effectiveStatValue(core.energy),
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const increasedDamagePct = { ...recovery.increasedDamagePct };
  for (const type of ['fire', 'cold', 'poison', 'arcane'] as const) {
    if (type in damageMasteries.increasedDamagePct) {
      increasedDamagePct[type] = (increasedDamagePct[type] ?? 0) + (damageMasteries.increasedDamagePct[type] ?? 0);
    }
  }
  if (shadow.poisonDamagePct > 0) increasedDamagePct.poison = (increasedDamagePct.poison ?? 0) + shadow.poisonDamagePct;
  if (physicalDamagePct > 0) increasedDamagePct.physical = (increasedDamagePct.physical ?? 0) + physicalDamagePct;
  const formation = useFormationStore.getState();
  const grants = resolveEquippedRunewordGrants(equipped);
  const configuration = scopedSummonConfiguration(player);
  const actives = projectGovernedActives({ owner: { kind: 'hero', classId: player.class,
    level: player.level, learnedRanks: player.skillLevels ?? {} }, grants,
    storedOrder: configuration.skillOrder });
  return {
    id: player.id,
    name: player.name,
    side: 'player',
    level: player.level,
    tier: 'trash',
    stats,
    life: stats.life,
    mana: stats.mana,
    ...composeRunewordCombatModifiers(grants, { ...recovery,
      manaRegenPerSecond: recovery.manaRegenPerSecond * (1 + warcries.manaRegenBonus + energyShield.manaRegenBonus), increasedDamagePct }),
    coldResistanceReductionPct: composeColdMastery(player),
    staticFieldRank: composeStaticField(player),
    bonePrisonRank: composeBonePrisonRank(player),
    coldArmorRanks: composeColdArmorRanks(player),
    periodicSpellRanks: composePeriodicSpellRanks(player),
    ...(player.class === 'sorceress' ? { hydraRank: composeHydraRank(player) } : {}),
    ...(player.class === 'sorceress' ? { sorceressBuffRanks: composeSorceressBuffRanks(player) } : {}),
    ...(energyShield.rank > 0 ? { energyShieldRank: energyShield.rank } : {}),
    ...(player.class === 'druid' ? { cycloneArmorRank: composeCycloneArmorRank(player) } : {}),
    ...(player.class === 'paladin' ? { holyShieldRank: composeHolyShieldRank(player), conversionRank: composeConversionRank(player) } : {}),
    ...(player.class === 'druid' ? { druidShapeRanks: composeDruidShapeshifting(player) } : {}),
    ...(player.class === 'barbarian' ? { frenzyRank: composeFrenzyRank({ classId: player.class,
      level: player.level, ...configuration }) } : {}),
    ...(player.class === 'druid' ? { feralRageRank: composeFeralRageRank({ classId: player.class,
      level: player.level, ...configuration }) } : {}),
    ...(player.class === 'druid' ? { druidSummonRanks: composeDruidSummonRanks(player) } : {}),
    ...(player.class === 'necromancer' ? { fireGolemRank:
      configuration.skillOrder.some(id => id === 'skills-necromancer-fire-golem' || id === 'necromancer.fire_golem')
        ? configuration.skillLevels?.['necromancer.fire_golem'] ?? 0 : 0 } : {}),
    ...(player.class === 'necromancer' ? { bloodGolemRank:
      configuration.skillOrder.some(id => id === 'skills-necromancer-blood-golem' || id === 'necromancer.blood_golem')
        ? configuration.skillLevels?.['necromancer.blood_golem'] ?? 0 : 0 } : {}),
    burstOfSpeedRank: composeBurstOfSpeedRank(player),
    cloakOfShadowsRank: composeCloakOfShadowsRank(player),
    ...(player.class === 'barbarian' ? { leapRank: composeLeapRank(player),
      concentrateRank: composeConcentrateRank(player), battleCommandRank: composeBattleCommandRank(player) } : {}),
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    // Fresh challenge entry may restore a zero-HP hero after this projection.
    // Engine registration grants potency only to a living owner.
    statuses: composeBoneArmor(player),
    cooldowns: {},
    ...configuration,
    skillOrder: actives.combatOrder,
    governedActiveRanks: actives.ranks,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'hero',
    equippedWeapon,
    gridPosition: formation.playerPosition,
    summonGridPositions: formation.summonPositions
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
 * Generate and validate the complete victory bag before one inventory write.
 * Descriptive rune/gem totals never grant shard currencies. Observer failures
 * restore inventory and propagate; native settlement additionally restores all
 * other participating domains under its existing wave lease.
 */
export function awardLootForVictory(opts: {
  readonly replayProfileId?: ReplayProfileId;
  readonly slainEnemies: readonly CombatUnit[];
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly treasureClassId: string;
  readonly seed: number;
  /** Award-time multiplier applied after the MF diminishing-return curve. */
  readonly magicFindMultiplier?: number;
}): KillRewards {
  assertIronGolemOwnershipMutationAllowed();
  const rewards = prepareLootForVictory(opts);
  const inv = useInventoryStore.getState();
  const grant = planRewardGrant(rewards, { ...inv, mercEquipment: useMercStore.getState().mercEquipment });
  try { useInventoryStore.setState(grant); }
  catch (cause) {
    try { useInventoryStore.setState(inv, true); }
    catch (error) { throw new AggregateError([error], 'Victory inventory restoration failed', { cause }); }
    throw cause;
  }
  return rewards;
}

/** Roll every enemy without publishing partial rewards or changing inventory. */
function prepareLootForVictory(opts: Parameters<typeof awardLootForVictory>[0]): KillRewards {
  const player = usePlayerStore.getState().player;
  const magicFind = player?.derivedStats.magicFind ?? 0;
  const goldFind = player?.derivedStats.goldFind ?? 0;
  const pools = loadAwardPools();
  const rng = createRng(opts.seed >>> 0);
  const rewards: KillRewards[] = [];
  for (const enemy of opts.slainEnemies) {
    rewards.push(rollKillRewards(
      {
        tier: enemy.tier,
        monsterLevel: enemy.level,
        treasureClassId: opts.treasureClassId,
        magicFind,
        magicFindMultiplier: opts.magicFindMultiplier ?? 1,
        goldFind,
        act: opts.act,
        difficulty: opts.replayProfileId ?? 'normal'
      },
      pools,
      rng
    ));
  }
  return mergeRewards(...rewards);
}

/** Restore participating journal entries while retaining unrelated observer writes. */
function restoreSettlementKeys<T>(current: Record<string, T>, before: Record<string, T>, keys: readonly string[]): Record<string, T> {
  if (keys.every(key => Object.hasOwn(current, key) === Object.hasOwn(before, key) && current[key] === before[key])) return current;
  const next = { ...current };
  for (const key of keys) {
    if (Object.hasOwn(before, key)) Object.defineProperty(next, key,
      { value: before[key], enumerable: true, configurable: true, writable: true });
    else Reflect.deleteProperty(next, key);
  }
  return Object.keys(next).length === Object.keys(before).length && Object.keys(before).every(key =>
    Object.hasOwn(next, key) && next[key] === before[key]) ? before : next;
}

/** Snapshot synchronous settlement participants; each restoration is attempted. */
function captureSettlementRollback(run: ActiveRun, binding: RecordedWaveBinding): (cause: unknown) => unknown {
  const player = usePlayerStore.getState(), merc = useMercStore.getState();
  const inventory = useInventoryStore.getState(), map = useMapStore.getState(), combat = useCombatStore.getState();
  const metadata = { playerUnit: run.playerUnit, waveIdx: run.waveIdx, carryPlayerTeam: run.carryPlayerTeam,
    waveElapsedMs: run.waveElapsedMs, recording: run.recording, endgameProgress: run.endgameProgress }, pity = getIdleEliteMisses();
  const restoreAct5 = captureAct5SettlementRollback(run);
  // Ordinary clear/kill events can touch any authored combat objective for this
  // area; source admissions additionally own their captured row and proof.
  const admissions = [binding.act4Encounter, binding.act5Encounter, binding.act5ThroneWave].flatMap(encounter =>
    encounter ? [encounter.contract] : []);
  const questIds = [...new Set([...loadQuests().filter(quest => quest.objectives.some(objective =>
    ['clear-area', 'kill', 'kill-boss'].includes(objective.type) && objective.areaId === run.plan.subAreaId)).map(quest => quest.id),
  ...admissions.map(contract => contract.questId), ...(binding.guardianEncounter ? [GUARDIAN_QUEST_ID] : [])])];
  const proofKeys = [...admissions.map(contract => contract.proof), ...(binding.councilEncounter ? [COUNCIL_RECEIPT_SOURCE] : [])];
  return cause => {
    const errors: unknown[] = [];
    const restore = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
    restore(() => { if (usePlayerStore.getState() !== player) usePlayerStore.setState(player, true); });
    restore(() => { if (useMercStore.getState() !== merc) useMercStore.setState(merc, true); });
    restore(() => { if (useInventoryStore.getState() !== inventory) useInventoryStore.setState(inventory, true); });
    restore(() => {
      const current = useMapStore.getState();
      const questProgress = restoreSettlementKeys(current.questProgress, map.questProgress, questIds);
      const questReceipts = restoreSettlementKeys(current.questReceipts, map.questReceipts, proofKeys);
      if (questProgress !== current.questProgress || questReceipts !== current.questReceipts ||
        current.clearedSubAreas !== map.clearedSubAreas || current.nightmareClearedSubAreas !== map.nightmareClearedSubAreas ||
        (run.origin.kind === 'endgame' && current.endgame !== map.endgame)) {
        useMapStore.setState({ questProgress, questReceipts, clearedSubAreas: map.clearedSubAreas,
          nightmareClearedSubAreas: map.nightmareClearedSubAreas,
          ...(run.origin.kind === 'endgame' ? { endgame: map.endgame } : {}) });
      }
    });
    restore(() => { if (useCombatStore.getState() !== combat) useCombatStore.setState(combat, true); });
    restore(() => { Object.assign(run, metadata); combatRunLifecycle.activeRun = run; });
    restore(() => { setIdleEliteMisses(pity); });
    restore(restoreAct5);
    return errors.length > 0 ? new AggregateError(errors, 'Wave settlement restoration failed', { cause }) : cause;
  };
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
            ...(original.findItemFinds ? { findItemFinds: original.findItemFinds } : {}),
            elapsedMs: original.waveElapsedMs, recording: original.recording,
            publication: original.publication, debitIntent: null }
        : stageWave(run, run.waveIdx, attempt, false, run.carryPlayerTeam, false);
      // Replay retains the originally captured origin, even if mutable plan copies changed.
      const { councilEncounter: _recaptured, guardianEncounter: _guardianRecaptured, act4Encounter: _act4Recaptured, act5Encounter: _act5Recaptured, act5ThroneWave: _throneRecaptured, ...replay } = staged;
      commitStagedWave(run, { ...replay,
        ...(original.endgameWave ? { endgameWave: original.endgameWave } : {}),
        ...(original.councilEncounter ? { councilEncounter: original.councilEncounter } : {}),
        ...(original.guardianEncounter ? { guardianEncounter: original.guardianEncounter } : {}),
        ...(original.act4Encounter ? { act4Encounter: original.act4Encounter } : {}),
        ...(original.act5Encounter ? { act5Encounter: original.act5Encounter } : {}),
        ...(original.act5ThroneWave ? { act5ThroneWave: original.act5ThroneWave } : {}) },
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
  readonly questSource?: 'act5-throne';
} = {}): { runId: string; totalWaves: number; runSeed: number; challengeOrdinal: number } | null {
  return startSubAreaRunAttempt(opts);
}

/**
 * Enter the unlocked manual dungeon using its issued seed and separate ordinal.
 * Uses the same guarded recording/installation/recovery path as area runs.
 * No caller-provided seed, level, difficulty or campaign counter is accepted.
 */
export function startEndgameRun(modifierId: string): {
  runId: string; totalWaves: number; runSeed: number; attemptOrdinal: number
} | null {
  const result = startSubAreaRunAttempt({}, undefined, { modifierId });
  return result && { runId: result.runId, totalWaves: result.totalWaves,
    runSeed: result.runSeed, attemptOrdinal: result.challengeOrdinal };
}

function startSubAreaRunAttempt(opts: Parameters<typeof startSubAreaRun>[0] = {},
  observation?: PublicationAttemptObservation, endgameRequest?: { readonly modifierId: string }): ReturnType<typeof startSubAreaRun> {
  const questSource: unknown = opts.questSource;
  if (questSource !== undefined && questSource !== 'act5-throne') throw new RangeError('Unknown quest source');
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
    const inventory = useInventoryStore.getState();
    const endgame = endgameRequest === undefined ? null : prepareEndgameAttempt({
      heroId: playerState.player.id, modifierId: endgameRequest.modifierId, state: map.endgame,
      campaign: { questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: inventory.questItems }
    });
    const profile = endgame ? 'normal' : map.selectedDifficulty;
    validateQuestActionReceipts(map.questReceipts, map.questProgress, inventory.questItems);
    validateCurrentCampaignRewards(map, inventory.questItems, inventory.questServices, map.endgame);
    const act = endgame ? 5 : clampAct(opts.act ?? map.currentAct);
    const subAreaId = opts.subAreaId ?? map.currentSubAreaId;
    const subArea = resolveSubArea(act, subAreaId);
    const mode = endgame ? 'manual' : opts.mode ?? 'manual';

    // Resolve a wave plan, falling back to the synthetic 4-wave default.
    // Run seed is generated up-front and threaded into wave-plan resolution
    // so spawn-count rolls are reproducible per-run (Bug C).
    const fallbackArchetype = pickFallbackArchetypeId(act);
    const synthId = `areas/synth-act${String(act)}`;
    const planSeed = endgame?.progress.context.seed ?? opts.runSeed ?? hashSeed(
      `${subArea?.id ?? synthId}|${String(Date.now())}`
    );
    const challengeOrdinal = endgame?.progress.context.attemptOrdinal ?? opts.challengeOrdinal ?? map.challengeOrdinals[profile];
    const eve = map.questProgress[EVE_QUEST];
    const projectThrone = profile === 'normal' && mode === 'manual' && subArea?.id === 'areas/act5-throne-of-destruction' &&
      eve?.id === EVE_QUEST && (eve.status === 'inProgress' || eve.status === 'completed') && eve.rewardClaimed !== true &&
      !Object.hasOwn(map.questReceipts, THRONE_PROOF);
    if (opts.questSource && !projectThrone) throw new Error('Act V quest-source projection is not eligible');
    if (profile === 'nightmare' && !subArea) throw new Error('Nightmare requires a canonical area');
    const normalPlan = endgame ? endgame.progress.plan : subArea
      ? resolveChallengeWavePlan({
          subArea,
          ...(projectThrone ? { questSourceProjection: 'act5-throne' as const } : {}),
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

    const plan = endgame ? endgame.progress.plan : applyReplayProfileToPlan(normalPlan, profile, getMonsterIndex());
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

    const origin = endgame?.progress.context ?? Object.freeze({ kind: 'area' as const, replayProfileId: profile });
    const candidate: ActiveRun = {
      origin,
      ...(endgame ? { endgameProgress: endgame.progress } : {}),
      plan,
      act,
      seed,
      mode,
      ...(opts.questRecovery ? { questRecovery: opts.questRecovery } : {}),
      ...(mercUnit && fieldedMerc ? {
        fieldedMercCombatId: mercUnit.id,
        fieldedMercBareUnit: Object.freeze(mercToCombatUnit(fieldedMerc, formation.mercPosition, {}))
      } : {}),
      playerUnit,
      waveIdx: 0,
      carryPlayerTeam: playerTeam,
      waveElapsedMs: 0
    };
    Object.defineProperty(candidate, 'origin', { value: origin, enumerable: true, writable: false, configurable: false });
    Object.defineProperty(candidate, 'replayProfileId', { value: profile, enumerable: true, writable: false, configurable: false });

    const staged = stageWave(candidate, 0, attempt, true);
    commitStagedWave(candidate, staged, { kind: 'newRun', nextDefaultChallengeOrdinal:
      endgame !== null || opts.challengeOrdinal !== undefined ? null : (challengeOrdinal + 1) % CHALLENGE_ORDINAL_PERIOD,
      ...(endgame ? { endgameEntry: { stateBefore: map.endgame, stateAfterEntry: endgame.stateAfterEntry } } : {}) }, attempt, lease, observation);
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
 * Completion-effect errors restore all participating domains and enter stable settlementFailed;
 * staging/publication errors retain awaiting carry or committed publication.
 */
export function advanceWaveOrFinish(): 'next-wave' | 'victory' | 'defeat' | 'idle' {
  return advanceWaveOrFinishAttempt();
}

function advanceWaveOrFinishAttempt(observation?: PublicationAttemptObservation): ReturnType<typeof advanceWaveOrFinish> {
  return withWaveTransition(lease => {
    const run = combatRunLifecycle.activeRun;
    if (!run) return 'idle';
    const { receipt, binding, progress, endgameState } = requirePublishedRun(run, lease);
    let next: { readonly nextWaveIdx: number; readonly carryPlayerTeam: CombatUnit[] };
    if (progress.phase === 'awaitingNextWave') {
      next = progress;
    } else {
      const combat = useCombatStore.getState();
      if (binding.origin.kind === 'endgame' && (useMapStore.getState().endgame !== endgameState ||
        run.endgameProgress !== binding.endgameWave?.progress)) throw new RecordedWaveReceiptError('bindingMismatch');
      if (!beginRecordedWaveSettlement(receipt, lease, { activeRun: run,
        heroId: usePlayerStore.getState().player?.id ?? null, combat })) return 'idle';
      const rollback = captureSettlementRollback(run, binding);
      let preparedRewards: KillRewards | undefined;
      try {
        const outcome = binding.recording.outcome;
        const areaRun = binding.origin.kind === 'area';
        const normalRun = areaRun && binding.origin.replayProfileId === 'normal';
        const endgameAdvance = binding.origin.kind === 'endgame' ? (() => {
          if (!run.endgameProgress || !binding.endgameWave) throw new RecordedWaveReceiptError('bindingMismatch');
          return advanceEndgameWave(run.endgameProgress, binding.endgameWave, outcome);
        })() : undefined;
        const publishEndgameProgress = (): void => {
          if (!endgameAdvance) return;
          if (useMapStore.getState().endgame !== endgameState || run.endgameProgress !== binding.endgameWave?.progress) {
            throw new RecordedWaveReceiptError('bindingMismatch');
          }
          if (endgameAdvance.completion) {
            const completion = endgameAdvance.completion;
            const map = useMapStore.getState();
            if (endgameState.attemptOrdinal !== completion.attemptOrdinal + 1) {
              throw new RecordedWaveReceiptError('bindingMismatch');
            }
            const next = readEndgameState({ ...endgameState, clearCounts: { ...endgameState.clearCounts,
              [completion.modifierId]: endgameState.clearCounts[completion.modifierId] + 1 } },
            { questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: useInventoryStore.getState().questItems });
            useMapStore.setState({ endgame: next });
            if (useMapStore.getState().endgame !== next) throw new RecordedWaveReceiptError('bindingMismatch');
          }
          run.endgameProgress = endgameAdvance.progress;
        };
        // Snapshot eligibility before ordinary income or any quest event can publish.
        const councilProgress = useMapStore.getState().questProgress[COUNCIL_QUEST_ID];
        const councilEncounter = binding.councilEncounter;
        const councilEligible = normalRun && councilEncounter !== undefined &&
          isCouncilAdmissionEligible(useMapStore.getState().questProgress, councilEncounter.historicalRecovery);
        const publishAct5Victory = areaRun ? prepareAct5Settlement(binding) : () => undefined;
        const act4Encounter = binding.act4Encounter;
        const act4Progress = act4Encounter ? useMapStore.getState().questProgress[act4Encounter.contract.questId] : undefined;
        const act4Eligible = normalRun && act4Encounter !== undefined && isAct4AdmissionEligible(act4Encounter.contract,
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
          if (!normalRun || !binding.guardianEncounter || !isGuardianAdmissionEligible(map.questProgress, map.questReceipts)) return false;
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
        const completedWave = run.plan.waves[binding.targetWaveIdx];
        const publishPity = () => {
          if (areaRun && run.mode === 'idle' && completedWave?.presentation?.idleEliteMissesAfterWave !== undefined) {
            setIdleEliteMisses(completedWave.presentation.idleEliteMissesAfterWave);
          }
        };

        const alivePlayer = outcome.finalPlayerTeam.find(
          (u) => u.id === binding.heroId && u.life > 0
        );
        if (outcome.winner !== 'player' || !alivePlayer || endgameAdvance?.progress.status === 'failed') {
          publishPity();
          combat.markRunDefeat();
          publishEndgameProgress();
          finishRecordedWaveSettlement(receipt, lease, { kind: 'terminal', result: 'defeat' });
          combatRunLifecycle.activeRun = null;
          return 'defeat';
        }
        const slain = outcome.finalEnemyTeam.filter(
          (u) => u.life <= 0 && inferKind(u) !== 'summon'
        );
        // Validate the entire private list before generating or publishing either reward bag.
        const { findItemFinds = [] } = binding;
        const searchEnemies = findItemBonusEnemies(findItemFinds, binding.engineInput,
          outcome.finalEnemyTeam, binding.heroId);
        if (slain.length > 0) {
          const now = Date.now();
          const multiplier = useMetaStore.getState().readIdleBonus(now).activeMultiplier;
          const wave = run.plan.waves[binding.targetWaveIdx];
          const tcId = wave?.lootTable ?? run.plan.defaultLootTable;
          const ordinaryRewards = prepareLootForVictory({
            replayProfileId: binding.replayProfileId ?? 'normal', slainEnemies: slain,
            act: run.act, treasureClassId: tcId,
            seed: run.seed ^ 0x9e3779b1 ^ binding.targetWaveIdx, magicFindMultiplier: multiplier
          });
          const killRewards = searchEnemies.length > 0 ? mergeRewards(ordinaryRewards, prepareLootForVictory({
            replayProfileId: binding.replayProfileId ?? 'normal', slainEnemies: searchEnemies,
            act: run.act, treasureClassId: tcId,
            seed: run.seed ^ 0x46494e44 ^ binding.targetWaveIdx, magicFindMultiplier: multiplier
          })) : ordinaryRewards;
          const cache = endgameAdvance?.completion?.materials;
          const rewards = cache ? mergeRewards(killRewards, { items: [], runeShards: 0, wishstones: 0,
            runes: 0, gems: Object.values(cache).reduce((sum, count) => sum + count, 0), materials: cache }) : killRewards;
          // Own diagnostic output before any synchronous observer can touch the grant.
          preparedRewards = structuredClone(rewards);
          planRewardGrant(rewards, { ...useInventoryStore.getState(), mercEquipment: useMercStore.getState().mercEquipment });
          mergeRewards(combat.runRewards, rewards);
          publishPity();
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

          // XP observers may legitimately change inventory. Recheck only pure
          // destination arithmetic against their current state, without rerolling.
          useInventoryStore.setState(current => planRewardGrant(rewards, { ...current, mercEquipment: useMercStore.getState().mercEquipment }));
          combat.accumulateRunRewards(rewards);
        } else publishPity();

        if (normalRun && completedWave?.waveTier === 'boss' && !completedWave.presentation?.isActBoss &&
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
          if (normalRun && boss && outcome === recording.outcome && combat.recordedEvents === recording.events &&
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
          if (normalRun) useMapStore.getState().markCleared(run.plan.subAreaId);
          else if (areaRun) useMapStore.setState(state => ({ nightmareClearedSubAreas: state.nightmareClearedSubAreas.includes(run.plan.subAreaId)
            ? state.nightmareClearedSubAreas : [...state.nightmareClearedSubAreas, run.plan.subAreaId] }));
          combat.markRunVictory();
          publishCouncilProof();
          publishGuardianVictory();
          publishAct4Victory();
          publishAct5Victory();
          publishEndgameProgress();
          finishRecordedWaveSettlement(receipt, lease, { kind: 'terminal', result: 'victory' });
          combatRunLifecycle.activeRun = null;
          return 'victory';
        }
        const carryPlayerTeam = outcome.finalPlayerTeam
          .filter(u => inferKind(u) !== 'summon' && u.life > 0)
          .map(u => rebaseStatusClock(u, binding.waveElapsedMs));
        transferBattleCommandCarry(outcome.finalPlayerTeam, binding.waveElapsedMs, carryPlayerTeam);
        publishCouncilProof();
        publishAct4Victory();
        publishAct5Victory();
        publishEndgameProgress();
        finishRecordedWaveSettlement(receipt, lease, { kind: 'nextWave', carryPlayerTeam });
        next = { nextWaveIdx: binding.targetWaveIdx + 1, carryPlayerTeam };
      } catch (error) {
        const failure = rollback(error);
        failRecordedWaveSettlement(receipt, lease, { error: failure, ...(preparedRewards ? { preparedRewards } : {}) });
        throw failure;
      }
    }
    // Staging/publication failures retain awaiting carry or committed publication;
    // they must never turn a successfully paid wave into settlementFailed.
    const attempt = captureWaveAttempt();
    const staged = stageWave(run, next.nextWaveIdx, attempt, false, next.carryPlayerTeam);
    commitStagedWave(run, staged, { kind: 'newWave', carryPlayerTeam: next.carryPlayerTeam }, attempt, lease, observation);
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
  readonly endgameWave?: EndgameWaveBinding;
  readonly councilEncounter?: CouncilEncounter;
  readonly guardianEncounter?: GuardianEncounter;
  readonly act4Encounter?: Act4Encounter;
  readonly act5Encounter?: Act5Encounter;
  readonly act5ThroneWave?: Act5Encounter & { readonly ordinal: number };
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
  const mercState = useMercStore.getState();
  const ownedMerc = mercState.ownedMercs.find(merc => `merc-${merc.id}` === run.fieldedMercCombatId);
  const freshMerc = ownedMerc
    ? mercToCombatUnit(ownedMerc, undefined, mercState.mercEquipment[ownedMerc.id])
    : run.fieldedMercBareUnit;
  const mightAura = currentPlayer?.id === run.playerUnit.id
    ? composeMightAura(currentPlayer, run.fieldedMercCombatId) : undefined;
  const statAura = currentPlayer?.id === run.playerUnit.id
    ? composeStatAura(currentPlayer, run.fieldedMercCombatId) : undefined;
  const meditationAura = fresh && currentPlayer?.id === run.playerUnit.id
    ? composeMeditationAura(currentPlayer, fresh.manaRegenBaselinePerSecond ?? fresh.manaRegenPerSecond ?? 0,
      run.fieldedMercCombatId) : undefined;
  const druidAllyAuras = currentPlayer?.id === run.playerUnit.id
    ? composeDruidAllyAuras(currentPlayer, run.fieldedMercCombatId) : undefined;
  const spiritOfBarbs = currentPlayer?.id === run.playerUnit.id
    ? composeSpiritOfBarbs(currentPlayer, run.fieldedMercCombatId) : undefined;
  const summonPassives = currentPlayer?.id === run.playerUnit.id
    ? composeSummonPassives(currentPlayer) : undefined;
  const skeletonMastery = currentPlayer?.id === run.playerUnit.id
    ? composeSkeletonMastery(currentPlayer) : undefined;
  const golemMastery = currentPlayer?.id === run.playerUnit.id
    ? composeGolemMastery(currentPlayer) : undefined;
  const findPotion = currentPlayer?.id === run.playerUnit.id ? composeFindPotion(currentPlayer) : undefined;
  const findItem = currentPlayer?.id === run.playerUnit.id ? composeFindItem(currentPlayer) : undefined;
  const grimWard = currentPlayer?.id === run.playerUnit.id ? composeGrimWard(currentPlayer) : undefined;
  const corpseExplosion = currentPlayer?.id === run.playerUnit.id
    ? composeCorpseExplosion(currentPlayer) : undefined;
  const assassinVenom = currentPlayer?.id === run.playerUnit.id
    ? composeAssassinVenom(currentPlayer) : undefined;
  const poisonExplosion = currentPlayer?.id === run.playerUnit.id
    ? composePoisonExplosion(currentPlayer) : undefined;
  const refreshedTeam = carryPlayerTeam.map(carried => {
    const unit = withoutTemporaryLifeCapacity(carried);
    if (freshMerc && unit.kind === 'merc' && unit.id === freshMerc.id) {
      // Equipment is authoritative at this wave boundary; current recording and
      // carried HP/MP remain untouched. Never project the bearer bonus onto summons.
      return refreshPeriodicSpells({ ...unit, level: freshMerc.level, stats: freshMerc.stats,
        life: unit.life,
        mana: Math.min(unit.mana, freshMerc.stats.manaMax),
        manaRegenPerSecond: freshMerc.manaRegenPerSecond ?? 0,
        manaRegenBaselinePerSecond: freshMerc.manaRegenBaselinePerSecond ?? 0,
        increasedDamagePct: freshMerc.increasedDamagePct ?? {},
        physicalReflectionPct: freshMerc.physicalReflectionPct ?? 0,
        skillOrder: freshMerc.skillOrder,
        governedActiveRanks: freshMerc.governedActiveRanks,
        equippedWeapon: freshMerc.equippedWeapon ?? {} });
    }
    if (!fresh || unit.id !== fresh.id) return unit;
    const mana = Math.min(unit.mana, fresh.stats.manaMax);
    const capped = mana >= fresh.stats.manaMax;
    const { battleCommandPassives: _oldCommandPassives, ...current } = unit;
    const refreshed = refreshPeriodicSpells(refreshColdArmorState(refreshHolyShieldState(refreshCycloneArmorState(refreshDruidFormState({ ...current, level: fresh.level, stats: fresh.stats,
      ...(fresh.battleCommandPassives ? { battleCommandPassives: fresh.battleCommandPassives } : {}),
      ...((unit.battleCommandRank !== undefined || fresh.battleCommandRank !== undefined)
        ? { battleCommandRank: fresh.battleCommandRank ?? 0 } : {}),
      life: unit.life,
      mana, ...((unit.druidShapeRanks !== undefined || fresh.druidShapeRanks !== undefined)
        ? { druidShapeRanks: fresh.druidShapeRanks } : {}),
      coldArmorRanks: fresh.coldArmorRanks ?? { 'shiver-armor': 0, 'chilling-armor': 0 },
      ...((unit.hydraRank !== undefined || fresh.hydraRank !== undefined)
        ? { hydraRank: fresh.hydraRank ?? 0 } : {}),
      periodicSpellRanks: fresh.periodicSpellRanks ?? { 'fire-wall': 0, 'thunder-storm': 0 },
      ...((unit.sorceressBuffRanks !== undefined || fresh.sorceressBuffRanks !== undefined)
        ? { sorceressBuffRanks: fresh.sorceressBuffRanks ?? { teleport: 0, enchant: 0 } } : {}),
      ...((unit.cycloneArmorRank !== undefined || fresh.cycloneArmorRank !== undefined)
        ? { cycloneArmorRank: fresh.cycloneArmorRank ?? 0 } : {}),
      ...((unit.holyShieldRank !== undefined || fresh.holyShieldRank !== undefined)
        ? { holyShieldRank: fresh.holyShieldRank ?? 0 } : {}),
      manaRegenPerSecond: fresh.manaRegenPerSecond ?? 0,
      manaRegenBaselinePerSecond: fresh.manaRegenBaselinePerSecond ?? 0,
      increasedDamagePct: fresh.increasedDamagePct ?? { fire: 0 },
      coldResistanceReductionPct: fresh.coldResistanceReductionPct ?? 0,
      ...((unit.conversionRank !== undefined || fresh.conversionRank !== undefined)
        ? { conversionRank: fresh.conversionRank ?? 0 } : {}),
      staticFieldRank: fresh.staticFieldRank ?? 0,
      bonePrisonRank: fresh.bonePrisonRank ?? 0,
      ...((unit.energyShieldRank !== undefined || fresh.energyShieldRank !== undefined)
        ? { energyShieldRank: fresh.energyShieldRank ?? 0 } : {}),
      burstOfSpeedRank: fresh.burstOfSpeedRank ?? 0,
      cloakOfShadowsRank: fresh.cloakOfShadowsRank ?? 0,
      ...((unit.concentrateRank !== undefined || fresh.concentrateRank !== undefined)
        ? { concentrateRank: fresh.concentrateRank ?? 0 } : {}),
      ...((unit.leapRank !== undefined || fresh.leapRank !== undefined)
        ? { leapRank: fresh.leapRank ?? 0 } : {}),
      ...((unit.frenzyRank !== undefined || fresh.frenzyRank !== undefined)
        ? { frenzyRank: fresh.frenzyRank ?? 0 } : {}),
      ...((unit.feralRageRank !== undefined || fresh.feralRageRank !== undefined)
        ? { feralRageRank: fresh.feralRageRank ?? 0 } : {}),
      ...((unit.druidSummonRanks !== undefined || fresh.druidSummonRanks !== undefined)
        ? { druidSummonRanks: fresh.druidSummonRanks ?? {} } : {}),
      ...((unit.fireGolemRank !== undefined || fresh.fireGolemRank !== undefined)
        ? { fireGolemRank: fresh.fireGolemRank ?? 0 } : {}),
      ...((unit.bloodGolemRank !== undefined || fresh.bloodGolemRank !== undefined)
        ? { bloodGolemRank: fresh.bloodGolemRank ?? 0 } : {}),
      physicalReflectionPct: fresh.physicalReflectionPct ?? 0,
      manaRegenCarry: capped ? 0 : unit.manaRegenCarry ?? 0,
      manaRegenCompensation: capped ? 0 : unit.manaRegenCompensation ?? 0,
      ...(capped ? { manaRegenExactCarry: '0' } : {}),
      skillOrder: allowIron ? fresh.skillOrder : fresh.skillOrder.filter(id => !isIronGolemSkill({ id })),
      skillLevels: fresh.skillLevels ?? {},
      governedActiveRanks: fresh.governedActiveRanks,
      equippedWeapon: fresh.equippedWeapon ?? {},
      summonGridPositions: fresh.summonGridPositions ?? [] })))));
    if (resolveFrozenArmorRank(fresh.skillLevels) > 0) return refreshed;
    // Invalidate only this new input; replay retains the original paid baseline.
    const { frozenArmor, ...unarmored } = refreshed;
    void frozenArmor;
    return { ...unarmored, activeBuffIds: refreshed.activeBuffIds.filter(id =>
      id !== 'skills-sorceress-frozen-armor' && id !== 'sorceress.frozen_armor' && id !== 'frozen-armor') };
  });

  // Preserve the fresh-base snapshot and original absolute HP. The engine settles
  // all pending capacity together after registering the complete party; ordinary
  // units still clamp against fresh equipment when no temporary layer is pending.
  const party = new Map([...refreshedTeam, ...enemies].map(unit => [unit.id, unit]));
  const battleCommandCarry = nativeBattleCommandCarry(carryPlayerTeam);
  const playerTeam = refreshedTeam.map(unit => {
    const oakRank = activeDruidAllyAuras(druidAllyAuras, unit, party)?.oakRank ?? 0;
    const aura = activeStatAura(statAura, unit.id, party);
    const pending = Boolean(unit.battleCommandPassives && hasBattleCommandCarry(battleCommandCarry, unit)) ||
      oakRank > 0 || aura?.selectedAuraId === 'paladin.vigor' ||
      unit.druidShapeRanks !== undefined || unit.druidForm !== undefined || unit.druidFormLife !== undefined;
    return pending ? unit : { ...unit, life: Math.min(unit.life, unit.stats.lifeMax) };
  });

  // Qualification comes from the filtered Player configuration, independently of
  // life, item, mana, full preload or terminal startup success.
  const ironGolemReplayLocked = allowIron && Boolean(fresh?.skillOrder.some(id => isIronGolemSkill({ id })));
  const captured = ironGolemReplayLocked
    ? captureIronGolemDebit(attempt.heroId, attempt.selection, attempt.ownership) : null;
  const projected = captured?.ok ? projectIronGolemItem(captured.intent.item) : null;
  const ironGolem = captured?.ok && projected?.eligible
    ? { sourceHeroId: run.playerUnit.id, sourceItemId: captured.intent.item.id, ...projected.bonuses } : null;
  const endgameWave = run.origin.kind === 'endgame' ? (() => {
    const progress = run.endgameProgress;
    if (!progress || progress.context !== run.origin || progress.plan !== run.plan || progress.nextWaveIndex !== waveIdx) {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
    return captureEndgameWave(progress, playerTeam, enemies);
  })() : undefined;
  const areaRun = run.origin.kind === 'area';
  const councilEncounter = areaRun ? captureCouncilEncounter(run.act, run.plan.subAreaId, wave,
    enemies, run.questRecovery === 'khalims-council') : undefined;
  const guardianEncounter = areaRun ? captureGuardianEncounter(run.act, run.plan.subAreaId, wave, enemies) : undefined;
  const act5Encounter = areaRun ? captureAct5Encounter(run.act, run.plan.subAreaId, wave, enemies) : undefined;
  const act5ThroneWave = areaRun && run.plan.questSourceProjection === 'act5-throne'
    ? captureAct5ThroneWave(run.act, run.plan.subAreaId, wave, enemies) : undefined;
  const act4Encounter = areaRun ? captureAct4Encounter(run.act, run.plan.subAreaId, wave, enemies) : undefined;
  const staged = stageRecordedWave({
    ...(battleCommandCarry ? { battleCommandCarry } : {}),
    replayProfileId: run.replayProfileId ?? 'normal',
    snapshot: {
      seed: waveSeed,
      playerTeam,
      enemyTeam: enemies,
      ...(ironGolem ? { ironGolem } : {}),
      ...(mightAura ? { mightAura } : {}),
      ...(meditationAura ? { meditationAura } : {}),
      ...(statAura ? { statAura } : {}),
      ...(druidAllyAuras ? { druidAllyAuras } : {}),
      ...(spiritOfBarbs ? { spiritOfBarbs } : {}),
      ...(skeletonMastery ? { skeletonMastery } : {}),
      ...(golemMastery ? { golemMastery } : {}),
      ...(summonPassives ? { summonPassives } : {}),
      ...(corpseExplosion ? { corpseExplosion: [corpseExplosion] } : {}),
      ...(findPotion ? { findPotion: [findPotion] } : {}),
      ...(findItem ? { findItem: [findItem] } : {}),
      ...(grimWard ? { grimWard: [grimWard] } : {}),
      ...(assassinVenom ? { assassinVenom } : {}),
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
  return { ...staged, ...(endgameWave ? { endgameWave } : {}), debitIntent: proof && captured?.ok ? captured.intent : null,
    ...(councilEncounter ? { councilEncounter } : {}),
    ...(guardianEncounter ? { guardianEncounter } : {}),
    ...(act4Encounter ? { act4Encounter } : {}),
    ...(act5Encounter ? { act5Encounter } : {}), ...(act5ThroneWave ? { act5ThroneWave } : {}) };
}

/** Preserve cursor/recording values even if the referenced run changes during staging. */
interface WaveAttempt extends RecordedWaveLive {
  readonly waveIdx: number | null;
  readonly recording: ActiveRun['recording'];
  readonly endgame: EndgameState;
}
/** Read exact operation-boundary references before staging, and again before commitment. */
function captureWaveAttempt(): WaveAttempt {
  const inventory = useInventoryStore.getState();
  const run = combatRunLifecycle.activeRun;
  return { activeRun: run, waveIdx: run?.waveIdx ?? null, recording: run?.recording,
    heroId: usePlayerStore.getState().player?.id ?? null,
    endgame: useMapStore.getState().endgame,
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
    run.origin !== binding.origin || run.playerUnit.id !== binding.heroId || run.waveIdx !== binding.targetWaveIdx || run.recording !== binding.recording ||
    (binding.origin.kind === 'endgame' && useMapStore.getState().endgame !== settlement.endgameState)) {
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
  attempt: WaveAttempt, lease: WaveTransitionLease, observation?: PublicationAttemptObservation): void {
  if (intent.kind === 'newRun') validateCapturedOrdinal(intent.nextDefaultChallengeOrdinal);
  const receipt = prepareRecordedWaveInstallation({ origin: run.origin,
    ...(staged.endgameWave ? { endgameWave: staged.endgameWave, endgameState: attempt.endgame } : {}),
    candidateRun: run, expectedActiveRun: attempt.activeRun,
    heroId: run.playerUnit.id, targetWaveIdx: staged.waveIdx, waveElapsedMs: staged.elapsedMs,
    selection: attempt.selection, ownership: attempt.ownership, debitIntent: staged.debitIntent,
    engineInput: staged.engineInput, attestation: staged.attestation,
    ...(staged.findItemFinds ? { findItemFinds: staged.findItemFinds } : {}),
    ...(staged.councilEncounter ? { councilEncounter: staged.councilEncounter } : {}),
    ...(staged.guardianEncounter ? { guardianEncounter: staged.guardianEncounter } : {}),
    ...(staged.act4Encounter ? { act4Encounter: staged.act4Encounter } : {}),
    ...(staged.act5Encounter ? { act5Encounter: staged.act5Encounter } : {}),
    ...(staged.act5ThroneWave ? { act5ThroneWave: staged.act5ThroneWave } : {}),
    recording: staged.recording, publication: staged.publication }, intent, lease);
  const live = captureWaveAttempt();
  try {
    if (live.waveIdx !== attempt.waveIdx || live.recording !== attempt.recording ||
      (run.origin.kind === 'endgame' && live.endgame !== attempt.endgame)) {
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
  installCapturedRecordedWave(receipt, lease, observation);
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
  const entry = observeRecordedWaveEntry(receipt, lease, useMapStore.getState().endgame);
  if (entry === 'conflict') throw new RecordedWaveReceiptError('bindingMismatch');
  let entryFailure: { error: unknown } | undefined;
  if (entry === 'write' && intent.kind === 'newRun' && intent.endgameEntry) {
    try { useMapStore.setState({ endgame: intent.endgameEntry.stateAfterEntry }); }
    catch (error) { entryFailure = { error }; if (observation) observation.failure = entryFailure; }
    const observed = observeRecordedWaveEntry(receipt, lease, useMapStore.getState().endgame, entryFailure);
    if (observed !== 'committed') {
      if (entryFailure) throw entryFailure.error;
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
  }
  if (!view.metadataInstalled) {
    const run = binding.candidateRun;
    combatRunLifecycle.activeRun = run;
    if (intent.kind === 'newWave') run.carryPlayerTeam = intent.carryPlayerTeam;
    run.waveIdx = binding.targetWaveIdx;
    run.waveElapsedMs = binding.waveElapsedMs;
    run.recording = binding.recording;
    if (intent.kind === 'newRun' && intent.nextDefaultChallengeOrdinal !== null) {
      const profile = binding.replayProfileId ?? 'normal';
      const nextOrdinal = intent.nextDefaultChallengeOrdinal;
      useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals,
        [profile]: nextOrdinal } }));
      if (useMapStore.getState().challengeOrdinals[profile] !== intent.nextDefaultChallengeOrdinal) {
        throw new RecordedWaveReceiptError('bindingMismatch');
      }
    }
    markRecordedWaveMetadataInstalled(receipt, lease);
  }
  if (entryFailure) throw entryFailure.error;
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
  if (observeRecordedWaveEntry(receipt, lease, useMapStore.getState().endgame) === 'conflict') {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  const live = () => ({ activeRun: combatRunLifecycle.activeRun, endgame: useMapStore.getState().endgame,
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

/** Display the captured origin across entry recovery, active waves and terminal settlement. */
export function readCombatRunOrigin(): RunOrigin | null {
  const { pending, currentPublished } = inspectRecordedWaves();
  return pending?.binding.origin ?? combatRunLifecycle.activeRun?.origin ?? currentPublished?.binding.origin ?? null;
}

/** Explicit screen operations, with the exact recovery that was displayed. */
export type CombatScreenTransition =
  | { readonly kind: 'start'; readonly options?: Parameters<typeof startSubAreaRun>[0] }
  | { readonly kind: 'endgame'; readonly modifierId: string }
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
    else if (action.kind === 'endgame') startSubAreaRunAttempt({}, retryAttempt, { modifierId: action.modifierId });
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

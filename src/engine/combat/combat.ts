import { ProjectileFlights } from './projectile-flight';
import { SLOW_MISSILES_DEFINITION, SLOW_MISSILES_IDS, slowMissilesRank } from '../skills/slow-missiles';
import { activeConversion, effectiveSide, opponentsOf, type ConversionBinding } from './allegiance';
import { attackCandidates } from './attack-targets';
import { CONVERSION_DEFINITION, CONVERSION_IDS, conversionRank, isConversionTarget, matchesConversion } from '../skills/conversion';
import { assassinVenomRawDps, copyAssassinVenomProjection, ASSASSIN_SHADOW_DEFINITIONS,
  type AssassinVenomProjection } from '../skills/assassin-shadow';
/**
 * Deterministic battle runner — timeline scheduler.
 *
 * Pure: same initial state + same seed → same event log, including
 * `simClockMs` annotations.
 *
 * Each combat unit has its own action period derived from `attackSpeed`
 * via {@link actionPeriodMs}; faster units therefore act more often than
 * slow ones over a given sim-second budget. Statuses, cooldowns and DoTs
 * are all keyed to {@link State.simClockMs} (milliseconds), not rounds.
 *
 * Shared boundaries settle every living target before deaths, effects or actions.
 * Actions use fixed seeded priorities for ties; periodic lethal instants and status
 * starts/expiries may advance the clock without consuming action budget.
 *
 * @module engine/combat/combat
 */

import type { Rng } from '../rng';
import { createRng } from '../rng';
import { DECOY_IDS, buildDecoy, decoyDuration, decoyRank, isDecoySkill, matchesDecoy } from '../skills/decoy';
import { activeBattleCry, paidBattleCry } from './warcry-definition';
import { BATTLE_COMMAND_IDS, battleCommandBonus, battleCommandDuration, battleCommandRank,
  captureBattleCommandPassiveProfile, isBattleCommandId, matchesBattleCommand,
  type BattleCommandGrant, type BattleCommandPassiveProfile } from '../skills/battle-command';
import { effectiveLearnedSkillRank } from '../skills/effective-rank';
import type { ActiveStatus, CombatUnit, CombatSide, GridPosition } from './types';
import { inferKind } from './types';
import { resolveDamage, rollDamage, resolveRolledDamage, mitigateDamage, type DamageInput } from './damage';
import {
  applyStatus,
  applyStatusWithResult,
  expireStatuses,
  hasStatus,
  isStunned,
  spreadPlague,
  activeStatusView,
  amplifyDamageReduction,
  statusActiveAt,
  shortenCleansingStatuses
} from './status';
import { CHILL_DEFINITION } from './chill-definition';
import { MANA_BURN_DEFINITION } from './mana-burn-definition';
import { PLAGUE_DEFINITION } from './plague-definition';
import { PlagueTracker } from './plague';
import { MERC_INNER_SIGHT_DEFINITION } from '../skills/inner-sight';
import { isMercHolyFreezeSource, MERC_HOLY_FREEZE_DEFINITION } from '../skills/merc-holy-freeze';
import { METEOR_ARMOR_MELT_DEFINITION } from '../skills/armor-melt';
import { activeMightAura, type MightAuraProjection } from '../skills/might';
import { activeMeditationAura, type MeditationAuraProjection } from '../skills/meditation';
import { activeStatAura, copyStatAuraProjection, statAuraDamageBonus, type StatAuraProjection } from '../skills/stat-auras';
import { projectLifeCapacity, withoutTemporaryLifeCapacity, type LifeCapacityBonus } from './life-capacity';
import { activeDruidAllyAuras, copyDruidAllyAuras, DRUID_ALLY_AURA_DEFINITIONS, type DruidAllyAuraProjection } from '../skills/druid-ally-auras';
import { activeSpiritOfBarbs, copySpiritOfBarbs, SPIRIT_OF_BARBS_DEFINITION, type SpiritOfBarbsProjection } from '../skills/spirit-of-barbs';
import { absorbHolyShield, activeHolyShield, HOLY_SHIELD_IDS, holyShieldDefense, holyShieldLethalBound,
  holyShieldQuota, holyShieldRank, matchesHolyShield, payHolyShield, refreshHolyShieldState } from '../skills/holy-shield';
import { FROZEN_ARMOR_DEFINITION, resolveFrozenArmorRank } from '../skills/frozen-armor';
import { COLD_ARMOR_IDS, coldArmorId, coldArmorRank, coldArmorBonuses, coldArmorCounterattack,
  matchesColdArmor, paidColdArmorRank, payColdArmor } from '../skills/cold-armors';
import { PERIODIC_SPELL_IDS, PERIODIC_SPELL_DEFINITIONS, periodicSpellId, periodicSpellRank,
  matchesPeriodicSpell, paidPeriodicSpell, payPeriodicSpell, refreshPeriodicSpells,
  nextPeriodicSpellPulse, isChanneling, type PeriodicSpellId } from '../skills/periodic-spells';
import { absorbBoneArmor, boneArmorPool, copyBoneArmorStatuses } from '../skills/bone-armor';
import { absorbCycloneArmor, activeCycloneArmor, CYCLONE_ARMOR_IDS, cycloneArmorLethalBound,
  cycloneArmorQuota, cycloneArmorRank, cycloneArmorResistance, matchesCycloneArmor,
  payCycloneArmor, refreshCycloneArmorState } from '../skills/cyclone-armor';
import { activeDruidForm, druidFormBonuses, druidFormForId, druidFormRank, matchesDruidForm, refreshDruidFormState, druidFormLifeBonus, selectedDruidForm, DRUID_SHAPE_IDS } from '../skills/druid-shapeshifting';
import { availableEnergyShieldMana, divertEnergyShield } from '../skills/energy-shield';
import { activeBurstOfSpeed, burstOfSpeedRank, copyBurstOfSpeedStatuses, matchesBurstOfSpeed,
  paidBurstOfSpeed, BURST_OF_SPEED_IDS, BURST_OF_SPEED_DEFINITION } from '../skills/burst-of-speed';
import { activeCloakOfShadows, cloakOfShadowsRank, copyCloakOfShadowsStatuses, matchesCloakOfShadows,
  paidCloakOfShadows, CLOAK_OF_SHADOWS_IDS, CLOAK_OF_SHADOWS_DEFINITION } from '../skills/cloak-of-shadows';
import { activeConcentrate, concentrateRank, copyConcentrateStatuses, matchesConcentrate,
  paidConcentrate, CONCENTRATE_IDS, CONCENTRATE_DEFINITION } from '../skills/concentrate';
import { activeSorceressBuff, canCaptureEnchantAttack, copySorceressBuffStatuses,
  matchesSorceressBuff, paySorceressBuff, sorceressBuffBonus, sorceressBuffId,
  sorceressBuffRank, SORCERESS_BUFF_DEFINITIONS } from '../skills/sorceress-buffs';
import { activeLeap, leapRank, copyLeapStatuses, matchesLeap,
  paidLeap, LEAP_IDS, LEAP_DEFINITION } from '../skills/leap';
import { activeFeralRage, copyFeralRageStatuses, FERAL_RAGE_DEFINITION, gainFeralRageStack } from '../skills/druid-sustain';
import { activeFrenzy, copyFrenzyStatuses, FRENZY_DEFINITION, gainFrenzyStack } from '../skills/frenzy';
import { copyDruidSummonRanks, isDruidSummonBody, qualifyDruidSummon } from '../skills/druid-summon-authority';
import { DRUID_SUMMON_DEFINITION, type DruidSummonId } from '../skills/druid-summon-definition';
import { FIRE_GOLEM_DEFINITION, qualifyFireGolem } from '../skills/fire-golem';
import { BLOOD_GOLEM_DEFINITION, qualifyBloodGolem } from '../skills/blood-golem';
import { HYDRA_DEFINITION, isHydraSkill, matchesHydra, hydraRank, buildHydra } from '../skills/hydra';
import { isStaticFieldId, matchesStaticField, staticFieldDamage, staticFieldRank } from '../skills/static-field';
import { activeDecrepify, paidDecrepify } from './decrepify-definition';
import { activeWeaken, paidWeaken } from './weaken-definition';
import { activeAmazonInnerSight, paidAmazonInnerSight } from './amazon-inner-sight-definition';
import { activeDimVision, paidDimVision } from './dim-vision-definition';
import { activeTerror } from './terror-definition';
import { activeBonePrison, BONE_PRISON_IDS } from './bone-prison-definition';
import { bonePrisonRank, matchesBonePrison } from '../skills/bone-prison';
import { BONE_WALL_IDS } from './bone-wall-definition';
import { absorbBoneWall, boneWallPool, boneWallRank, copyBoneWallStatuses, matchesBoneWall, payBoneWall } from '../skills/bone-wall';
import { activeDamageCurse, paidDamageCurse } from './damage-curse-definition';
import { comboMultiplier, shouldShatter } from './combo';
import { rollOrbDrops, applyOrbs, type Orb } from './orbs';
import {
  createManaRecoveryIntegral, exportManaRecoveryCarry, integrateManaRecoveryWithContributionBetween, type ManaRecoveryIntegral
} from './mana-recovery';
import { isImmobilized, shouldEnrage } from '../ai/policy';
import { canCastSkill } from '../skills/eligibility';
import { getSkill } from '../skills/registry';
import { governedActiveId } from '../skills/runeword-actives';
import { buildSummon, getSummon } from '../skills/summons';
import { isPreparationSummonSkill, SUMMON_PREPARATION_TEMPLATES } from '../skills/summon-preparation';
import { copyCorpseExplosionProjections, corpseExplosionRank, isCorpseExplosionId, matchesCorpseExplosion,
  type CorpseExplosionProjection } from '../skills/corpse-explosion';
import { copyPoisonExplosionProjections, poisonExplosionRank, isPoisonExplosionId, matchesPoisonExplosion,
  type PoisonExplosionProjection } from '../skills/poison-explosion';
import { copyFindPotionProjections, findPotionRank, findPotionRecovery, isFindPotionId, matchesFindPotion,
  FIND_POTION_IDS, type FindPotionProjection } from '../skills/find-potion';
import { copyFindItemProjections, findItemRank, isFindItemId, matchesFindItem, rollFindItemSearch,
  FIND_ITEM_IDS, type FindItemProjection, type FindItemFind } from '../skills/find-item';
import { GRIM_WARD_IDS, GRIM_WARD_DEFINITION, copyGrimWardProjections,
  grimWardDuration, grimWardRank, isGrimWardId, matchesGrimWard, type GrimWardProjection } from '../skills/grim-ward';
import type { SkeletonMasteryProjection } from '../skills/skeleton-mastery';
import type { GolemMasteryProjection } from '../skills/golem-mastery';
import { empowerNecromancerSummon, type SummonPassiveProjection } from '../skills/summon-passives';
import { SKELETAL_MAGE_DEFINITION, type SkeletalMageElement } from '../skills/skeletal-mage';
import { SKELETAL_MAGE_SIGNATURES } from '../skills/skeletal-mage-signatures';
import { IRON_GOLEM_SKILL_ID, isIronGolemSkill, qualifyIronGolemSource, applyIronGolemItemStats,
  type IronGolemInput, type IronGolemPreparationAttestation } from '../skills/iron-golem';
import { resolveSummonMaxCount, scalePerRank } from '../skills/scaling';
import { cellsForAoeShape, isValidGridPosition, resolveAoeTargets, withDefaultGridPositions } from './grid';
import type {
  RegisteredSkill,
  SkillEffect,
  DamageEffect,
  BuffEffect,
  SummonEffect,
  HealEffect
} from '../skills/effects';

/** ms per sim-second. */
export const SECONDS = 1000;
/** Hard sim-time cap; battles longer than this end in a draw. */
export const MAX_SIM_MS = 60_000;
/** Hard action cap as a runaway-loop safety net. */
export const MAX_ACTIONS = 1000;

/**
 * Compute action period (ms) for a unit with the given attack speed.
 * `clamp(2500 - speed*8, 400, 2000)`.
 */
export function actionPeriodMs(attackSpeed: number): number {
  const raw = 2500 - Math.floor(attackSpeed) * 8;
  return Math.max(400, Math.min(2000, raw));
}

/** Possible combat events. */
export type BattleEvent =
  | { readonly kind: 'message'; readonly messageKey: string; readonly params?: Readonly<Record<string, string | number>> }
  | { readonly kind: 'turn-start'; readonly turn: number }
  | { readonly kind: 'action'; readonly actor: string; readonly skillId: string | null;
      /** This scheduled action restores the owner instead of attempting an attack. */
      readonly corpseRecovery?: true }
  | {
      readonly kind: 'damage';
      readonly source: string;
      readonly target: string;
      readonly damageType: string;
      readonly amount: number;
      /** Already-mitigated damage paid by Bone Armor instead of HP. */
      readonly absorbed?: number;
      /** Paid Cyclone reduction, kept separate from the finite Bone Armor pool. */
      readonly cycloneAbsorbed?: number;
      /** Paid Holy Shield prevention, separate from other personal defenses. */
      readonly holyShieldAbsorbed?: number;
      /** Already-mitigated damage consumed by the finite paid Wall. */
      readonly wallAbsorbed?: number;
      readonly crit: boolean;
      readonly dodged: boolean;
    }
  | { readonly kind: 'status'; readonly target: string; readonly statusId: string }
  /** Silent complete active view; initial observations precede all gameplay. */
  | { readonly kind: 'status-state'; readonly target: string;
      readonly statuses: readonly ActiveStatus[]; readonly initial?: true }
  | { readonly kind: 'buff'; readonly target: string; readonly buffId: string;
      /** Status observations own this finite buff's presentation and expiry. */
      readonly statusBacked?: true }
  | {
      readonly kind: 'summon';
      readonly owner: string;
      readonly summonId: string;
      readonly unit: CombatUnit;
    }
  | { readonly kind: 'heal'; readonly target: string; readonly amount: number }
  /** Absolute passive/stat observation, including final layered capacity and unchanged resources. */
  | { readonly kind: 'stats-state'; readonly target: string;
      readonly state: BattleCommandPassiveProfile & Pick<CombatUnit, 'stats' | 'life' | 'mana' | 'vigorLife'> }
  | { readonly kind: 'life-capacity'; readonly target: string; readonly lifeMax: number; readonly life: number; readonly vigorBaseLifeMax?: number;
      readonly druidFormState?: Pick<CombatUnit, 'druidForm' | 'druidFormLife'> }
  | { readonly kind: 'mana'; readonly target: string; readonly mana: number;
      readonly reason: 'cast' | 'regeneration' | 'summon-refund' | 'orb' | 'redemption' | 'energy-shield' | 'solar-creeper' | 'mana-burn' | 'find-potion' }
  | { readonly kind: 'death'; readonly target: string }
  | { readonly kind: 'enrage'; readonly target: string }
  | { readonly kind: 'orb'; readonly target: string; readonly orb: Orb }
  | { readonly kind: 'stunned'; readonly target: string }
  | { readonly kind: 'dot'; readonly target: string; readonly amount: number;
      readonly absorbed?: number; readonly cycloneAbsorbed?: number; readonly holyShieldAbsorbed?: number; readonly wallAbsorbed?: number }
  | { readonly kind: 'end'; readonly winner: CombatSide | null };

/** Initial combat snapshot. */
export interface CombatSnapshot {
  /** Immutable run difficulty; omitted historical snapshots use Normal. */
  readonly difficulty?: 'normal' | 'nightmare';
  readonly seed: number;
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly act?: 1 | 2 | 3 | 4 | 5;
  readonly maxRounds?: number;
  /** Player-composed CE eligibility, copied once; corpses themselves never enter a snapshot. */
  readonly corpseExplosion?: readonly CorpseExplosionProjection[];
  /** Independent Player-composed PE eligibility; both consumers share one empty wave-local FIFO. */
  readonly poisonExplosion?: readonly PoisonExplosionProjection[];
  /** Learned native Barbarian recovery authority; shares the empty wave-local body pool. */
  readonly findPotion?: readonly FindPotionProjection[];
  /** Learned native corpse-search authority; no reward is granted during simulation/playback. */
  readonly findItem?: readonly FindItemProjection[];
  /** Native learned ward authority; no corpse or paid timer is accepted from a save. */
  readonly grimWard?: readonly GrimWardProjection[];
  /** Copied learned Assassin coating, bound to the exact player hero for this wave. */
  readonly assassinVenom?: AssassinVenomProjection;
  /** Frozen explicit player Might selection for this wave, active from simulation entry. */
  readonly mightAura?: MightAuraProjection;
  /** Frozen explicit Meditation selection; eligibility is captured at each interval start. */
  readonly meditationAura?: MeditationAuraProjection;
  /** Copied selected stat aura; mutually exclusive with Might and Meditation. */
  readonly statAura?: StatAuraProjection;
  /** Copied automatic allied Druid passives, bound to the original hero and party. */
  readonly druidAllyAuras?: DruidAllyAuraProjection;
  /** Native passive allocation only; actual support-spirit identity is authenticated inside combat. */
  readonly spiritOfBarbs?: SpiritOfBarbsProjection;
  /** Eligible player Mastery copied at wave entry; applies only at fresh summon creation. */
  readonly skeletonMastery?: SkeletonMasteryProjection;
  /** Copied authoritative Golem Mastery for fresh summons in this wave. */
  readonly golemMastery?: GolemMasteryProjection;
  /** Copied global bonuses for newly created owned Necromancer summons. */
  readonly summonPassives?: SummonPassiveProjection;
  /** Explicit isolated item bonuses for a selected-item Iron startup attempt. */
  readonly ironGolem?: IronGolemInput;
}

/** Final combat result. */
export interface CombatResult {
  readonly events: readonly BattleEvent[];
  readonly winner: CombatSide | null;
  /** All player-side units that ever existed (including spawned summons). */
  readonly playerTeam: readonly CombatUnit[];
  /** All enemy-side units that ever existed (including spawned summons). */
  readonly enemyTeam: readonly CombatUnit[];
  /** Number of "turns" emitted (5-second sim-time boundaries crossed). */
  readonly rounds: number;
  /** Successful paid corpse searches only; privately copied before native reward publication. */
  readonly findItemFinds?: readonly FindItemFind[];
  /** Present only after successful registration; survives that summon's later death. */
  readonly ironGolemPreparation?: IronGolemPreparationAttestation;
}

interface ProjectileImpact {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly effect: DamageEffect;
  readonly skillLevel: number;
}

interface State {
  /** Empty per battle; neither shots nor paid speed authority are accepted from input. */
  readonly projectiles: ProjectileFlights<ProjectileImpact>;
  readonly slowMissiles: Map<string, { readonly expiresAtMs: number; readonly projectileSpeedPct: number }>;
  /** Actual paid duplicates alone receive finite lifetime and distraction authority. */
  readonly decoys: Map<string, { readonly ownerId: string; readonly expiresAtMs: number }>;
  /** Paid Plague casts and marker lifetimes belong only to this battle. */
  readonly plague: PlagueTracker;
  /** Only actual paid casts establish recipient potency; imported markers are inert. */
  readonly battleCommands: Map<string, BattleCommandGrant>;
  readonly boostedCommandPassives: Set<string>;
  /** Only successful paid Hydra registration creates a binding; input markers grant no power. */
  readonly hydras: Map<string, { readonly ownerId: string; readonly rank: number; readonly expiresAtMs: number }>;
  /** Wave-local duplicate guard; paid phase itself is stored in standard status clocks. */
  readonly periodicSpellPulses: Map<string, Partial<Record<PeriodicSpellId, number>>>;
  /** Actual paid hits only; never copied from snapshot/status fields. */
  readonly conversions: Map<string, ConversionBinding>;
  readonly spiritOfBarbs?: SpiritOfBarbsProjection;
  /** Set only when this battle commits the actual passive support summon. Never copied from input. */
  barbsSpiritId?: string;
  readonly hasTemporaryLife: boolean;
  /** Factory-marked source IDs captured at registration; live eligibility is checked at use. */
  readonly holyFreezeSources: string[];
  readonly difficulty: 'normal' | 'nightmare';
  /** Valid copied player authority and FIFO primary enemy-monster death IDs; wave-local only. */
  readonly corpseExplosion: Map<string, number>;
  readonly poisonExplosion: Map<string, number>;
  readonly findPotion: Map<string, number>;
  readonly findItem: Map<string, number>;
  readonly findItemFinds: FindItemFind[];
  readonly grimWard: Map<string, number>;
  readonly grimWards: Map<string, { readonly corpseId: string; readonly rank: number;
    readonly createdAtMs: number; readonly expiresAtMs: number; readonly nextPulseAtMs: number }>;
  readonly assassinVenom?: AssassinVenomProjection;
  readonly corpses: string[];
  /** Only IDs committed/accepted by qualified preparation in this battle may use Druid effects. */
  readonly druidSummons: Map<string, { readonly ownerId: string; readonly template: DruidSummonId;
    readonly skillId: string; readonly rank: number }>;
  /** Only new body IDs from a qualified paid Fire Golem batch gain Fire/Burn attacks. */
  readonly fireGolems: Map<string, { readonly ownerId: string; readonly rank: number }>;
  /** Only a new qualified paid body can grant the non-stacking original-party leech aura. */
  readonly bloodGolems: Map<string, { readonly ownerId: string; readonly rank: number }>;
  readonly ironGolem?: IronGolemInput;
  ironGolemPreparation?: IronGolemPreparationAttestation;
  readonly mightAura?: MightAuraProjection;
  readonly meditationAura?: MeditationAuraProjection;
  readonly statAura?: StatAuraProjection;
  readonly druidAllyAuras?: DruidAllyAuraProjection;
  /** Next wave-local ambient pulse; never an action, cast or persisted timer. */
  nextAuraPulseAtMs?: number;
  readonly skeletonMastery?: SkeletonMasteryProjection;
  readonly golemMastery?: GolemMasteryProjection;
  readonly summonPassives?: SummonPassiveProjection;
  units: Map<string, CombatUnit>;
  events: BattleEvent[];
  /** Battle-local copied presentation views; never used by gameplay. */
  readonly observedStatuses: Map<string, readonly ActiveStatus[]>;
  /** parallel array: simClockMs at the moment events[i] was emitted. */
  simTimes: number[];
  rng: Rng;
  /** Independent stream for fixed per-unit scheduler priorities. */
  tieRng: Rng;
  tiePriority: Map<string, number>;
  act: 1 | 2 | 3 | 4 | 5;
  simClockMs: number;
  /** Registration order for targeting, periodic phases and priority collisions. */
  insertionIdx: Map<string, number>;
  /** time-based scheduler state */
  actionSchedule: Map<string, { at: number; period: number }>;
  cooldownExpiresAt: Map<string, Map<string, number>>;
  /** Pooled rate-times-ms integral, never persisted or transferred between battles. */
  periodic: Map<string, PeriodicIntegral>;
  /** Settled pre-cast periodic damage never contributes to paid Cyclone absorption. */
  readonly cyclonePeriodicBaseline: Map<string, number>;
  /** Post-Cyclone periodic damage at the paid Holy Shield cast; wave-local. */
  readonly holyShieldPeriodicBaseline: Map<string, number>;
  /** Cumulative recovery integral; only fractional MP transfers between battles. */
  manaRecovery: Map<string, ManaRecoveryIntegral>;
  deathsHandled: Set<string>;
  /** highest "turn" emitted (5s boundaries). */
  turnsEmitted: number;
  /** sticky flag — hero death = enemy victory regardless of summons. */
  heroDead: boolean;
  /** spawn counter, monotonically increasing. */
  insertionCounter: number;
  /** Runtime summon identity belongs to this battle, never a module singleton. */
  summonSequence: number;
  /** Valid startup sources authorize only their own exact template deaths. */
  preparationTemplates: Map<string, Set<string>>;
  /** Fresh qualified Mage registrations only; never copied from snapshots or saved. */
  skeletalMageElements: Map<string, SkeletalMageElement>;
}

interface PeriodicIntegral {
  /** Prior periodic damage removed by Wall, excluded from subsequent mana-diversion quotas. */
  wallAbsorbed?: number;
  /** Compensated accumulated damage in HP * milliseconds. */
  total: number;
  compensation: number;
  /** Whole HP already emitted; total/1000 - dealt is the pooled carry. */
  dealt: number;
}

function alive(u: CombatUnit): boolean {
  return u.life > 0;
}

/** Compare ordered records without collapsing absent fields or nonfinite values. */
function sameStatusView(previous: readonly ActiveStatus[], next: readonly ActiveStatus[]): boolean {
  return previous.length === next.length && previous.every((a, i) => {
    const b = next[i];
    if (!b) return false;
    const keys = Object.keys(a) as (keyof ActiveStatus)[];
    return keys.length === Object.keys(b).length && keys.every(key => {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (key === 'tags' && a.tags !== undefined && b.tags !== undefined) {
        return a.tags.length === b.tags.length && a.tags.every((tag, j) => Object.is(tag, b.tags?.[j]));
      }
      return Object.is(a[key], b[key]);
    });
  });
}

function holyFreezeSourceId(state: State): string | undefined {
  return state.holyFreezeSources.find(id => {
    const source = state.units.get(id);
    return source !== undefined && isMercHolyFreezeSource(source);
  });
}

/** Mercenary and selected hero Freeze supply one ambient Chill, with actual source provenance. */
function ambientChillSourceId(state: State): string | undefined {
  const merc = holyFreezeSourceId(state);
  if (merc !== undefined) return merc;
  const aura = state.statAura;
  return aura?.selectedAuraId === 'paladin.holy-freeze' && activeStatAura(aura, aura.sourceHeroId, state.units)
    ? aura.sourceHeroId : undefined;
}

/** Shared derived view for presentation and direct-hit combos, never written to raw statuses. */
function combatStatusView(state: State, unit: CombatUnit): CombatUnit {
  const view = activeStatusView(unit, state.simClockMs);
  const raw = activeConversion(state, unit) === undefined && view.statuses.some(s => s.id === 'converted')
    ? { ...view, statuses: view.statuses.filter(s => s.id !== 'converted') } : view;
  const aura = activeDruidAllyAuras(state.druidAllyAuras, unit, state.units);
  const barbs = activeSpiritOfBarbs(state.spiritOfBarbs, state.barbsSpiritId, unit, state.units);
  let active = raw;
  if (aura !== undefined || barbs !== undefined || raw.statuses.some(s => s.id === 'oak-sage' || s.id === 'heart-of-wolverine' || s.id === 'spirit-of-barbs')) {
    const statuses = raw.statuses.filter(s => s.id !== 'oak-sage' && s.id !== 'heart-of-wolverine' && s.id !== 'spirit-of-barbs');
    if (aura) {
      if (aura.oakRank > 0) statuses.push({ id: 'oak-sage', sourceId: aura.sourceHeroId, stacks: 1, remaining: -1 });
      if (aura.heartRank > 0) statuses.push({ id: 'heart-of-wolverine', sourceId: aura.sourceHeroId, stacks: 1, remaining: -1 });
    }
    if (barbs) statuses.push({ id: 'spirit-of-barbs', sourceId: barbs.sourceHeroId, stacks: 1, remaining: -1 });
    active = { ...raw, statuses };
  }
  if (effectiveSide(state, unit) !== 'enemy' || !alive(unit) || hasStatus(active, 'chill')) return active;
  const sourceId = ambientChillSourceId(state);
  return sourceId === undefined ? active : { ...active, statuses: [...active.statuses,
    { id: 'chill', stacks: 1, remaining: -1, sourceId, tags: ['cold', 'chill'] }] };
}

/** Observe committed state only; clocks, raw statuses and RNG remain authoritative. */
function observeStatuses(state: State, target: string, initial = false): void {
  const unit = state.units.get(target);
  if (!unit) return;
  const active = alive(unit) ? combatStatusView(state, unit).statuses : [];
  const previous = state.observedStatuses.get(target);
  if (!initial && previous !== undefined && sameStatusView(previous, active)) return;
  const statuses = active.map(s => ({ ...s, ...(s.tags !== undefined ? { tags: [...s.tags] } : {}) }));
  state.observedStatuses.set(target, statuses);
  emit(state, { kind: 'status-state', target, statuses, ...(initial ? { initial: true as const } : {}) });
}

/** Keep base stats intact; active Chill changes the stat before cadence/clamps. */
function effectiveActionPeriod(state: State, unit: CombatUnit): number {
  const chilled = unit.statuses.some(s => s.id === 'chill' && statusActiveAt(s, state.simClockMs)) ||
    (effectiveSide(state, unit) === 'enemy' && ambientChillSourceId(state) !== undefined);
  const enrage = unit.enraged ? unit.enrage?.attackSpeedMultiplier ?? 1 : 1;
  const speedBonus = druidFormBonuses(unit).attackSpeedPct + (activeBurstOfSpeed(unit, state.simClockMs)?.attackSpeedPct ?? 0) +
    (activeStatAura(state.statAura, unit.id, state.units)?.bonuses.attackSpeedPct ?? 0);
  // Add the new stack contribution before cadence flooring: 100 + 15 stays 115,
  // whereas 100 * (1 + .05 * 3) loses one speed point to binary rounding.
  const feralSpeed = unit.stats.attackSpeed * (activeFeralRage(unit, state.simClockMs)?.stacks ?? 0) *
    FERAL_RAGE_DEFINITION.attackSpeedPctPerStack;
  const frenzySpeed = unit.stats.attackSpeed * (activeFrenzy(unit, state.simClockMs)?.stacks ?? 0) *
    FRENZY_DEFINITION.attackSpeedPctPerStack;
  const decrepify = activeDecrepify(unit, state.simClockMs);
  return actionPeriodMs((unit.stats.attackSpeed * (1 + speedBonus) + feralSpeed + frenzySpeed) * enrage *
    (chilled ? CHILL_DEFINITION.attackSpeedMultiplier : 1) * (1 - (decrepify?.attackSpeedReductionPct ?? 0) / 100));
}

/** All new attempts start one full effective period after the current clock. */
function scheduleNextAction(state: State, unit: CombatUnit): void {
  if (unit.id === state.barbsSpiritId || state.decoys.has(unit.id)) return;
  const period = effectiveActionPeriod(state, unit);
  state.actionSchedule.set(unit.id, { at: state.simClockMs + period, period });
}

/** Preserve remaining progress at onset/expiry; unchanged refresh never reschedules. */
function reconcileActionPeriods(state: State): void {
  cancelInterruptedChannels(state);
  for (const [id, scheduled] of state.actionSchedule) {
    // Authored enrage observes damage/periodic boundaries and preserves pending phase.
    if (state.units.get(id)?.enrage) checkEnrage(state, id);
    const unit = state.units.get(id);
    if (!unit || !alive(unit)) {
      state.actionSchedule.delete(id);
      continue;
    }
    if (state.holyFreezeSources.length > 0 || state.statAura?.selectedAuraId === 'paladin.holy-freeze') observeStatuses(state, id);
    const period = effectiveActionPeriod(state, unit);
    if (period === scheduled.period) continue;
    const remaining = Math.max(0, scheduled.at - state.simClockMs);
    state.actionSchedule.set(id, {
      at: state.simClockMs + remaining * period / scheduled.period,
      period
    });
  }
}

function emit(state: State, ev: BattleEvent): void {
  state.events.push(ev);
  state.simTimes.push(state.simClockMs);
}

type ManaEvent = Extract<BattleEvent, { kind: 'mana' }>;

/** Commit the whole candidate; callers publish MP after their established action/orb cues. */
function commitMana(
  state: State,
  before: CombatUnit,
  candidate: CombatUnit,
  reason: ManaEvent['reason']
): ManaEvent | undefined {
  let next = candidate;
  const restored = next.mana > before.mana && next.statuses.some(status =>
    status.id === 'mana-burn' && statusActiveAt(status, state.simClockMs));
  if (restored) next = { ...next, statuses: next.statuses.filter(status =>
    status.id !== 'mana-burn' || !statusActiveAt(status, state.simClockMs)) };
  if (next.mana >= next.stats.manaMax) {
    state.manaRecovery.delete(next.id);
    if (next.manaRegenCarry !== undefined && next.manaRegenCarry !== 0) {
      next = { ...next, manaRegenCarry: 0 };
    }
    if (next.manaRegenCompensation !== undefined && next.manaRegenCompensation !== 0) {
      next = { ...next, manaRegenCompensation: 0 };
    }
    if (next.manaRegenExactCarry !== undefined && next.manaRegenExactCarry !== '0') {
      next = { ...next, manaRegenExactCarry: '0' };
    }
  }
  state.units.set(next.id, next);
  if (restored) observeStatuses(state, next.id);
  return before.mana === next.mana ? undefined : {
    kind: 'mana', target: next.id, mana: next.mana, reason
  };
}

function aliveOf(state: State, side: CombatSide): CombatUnit[] {
  const out: CombatUnit[] = [];
  for (const u of state.units.values()) if (u.side === side && alive(u)) out.push(u);
  return out;
}

/** Sort enemies for targeting: summons first (taunt), then by spawn order. */
function targetPriority(state: State, units: readonly CombatUnit[]): CombatUnit[] {
  const arr = [...units];
  arr.sort((a, b) => {
    const ka = inferKind(a) === 'summon' ? 0 : 1;
    const kb = inferKind(b) === 'summon' ? 0 : 1;
    if (ka !== kb) return ka - kb;
    const ia = state.insertionIdx.get(a.id) ?? 0;
    const ib = state.insertionIdx.get(b.id) ?? 0;
    return ia - ib;
  });
  return arr;
}

/**
 * Threat weight per defender role.
 *
 * Bug #2 (P0) — monsters previously hit `targetPriority(...)[0]` every action
 * which, with no summons in play, always resolved to the player hero. With
 * mercs/summons on the field aggro must be **shared**: summons taunt slightly
 * (front-line bias) but heroes/mercs still take their fair share.
 *
 * Weights: summons = 3, heroes/mercs = 2, anything else = 1. The light
 * summon bias preserves the existing taunt behaviour without making
 * heroes effectively untargetable. All randomness flows through the
 * seeded engine RNG so battles remain deterministic.
 */
function threatWeight(unit: CombatUnit): number {
  const kind = inferKind(unit);
  if (kind === 'summon') return 3;
  if (kind === 'hero' || kind === 'merc') return 2;
  return 1;
}

/**
 * Pick a single defender for an attacker out of a list of alive opponents.
 *
 * Selection rules:
 *  - Empty input → undefined.
 *  - Singleton → that unit (no RNG churn).
 *  - Player-side attacker → first by {@link targetPriority} (deterministic,
 *    taunt-respecting; matches v1 behaviour the rest of the engine relies on).
 *  - Enemy-side attacker → weighted random pick using {@link threatWeight}
 *    so monsters spread aggro across hero + mercs + summons. The RNG is
 *    the seeded engine RNG so battles remain deterministic.
 */
function pickDefender(
  state: State,
  attacker: CombatUnit,
  candidates: readonly CombatUnit[]
): CombatUnit | undefined {
  if (candidates.length === 0) return undefined;
  const taunt = activeStatusView(attacker, state.simClockMs).statuses.find(status =>
    status.id === 'taunt' && status.appliedAtMs !== undefined && status.expiresAtMs !== undefined &&
    Number.isFinite(status.appliedAtMs) && Number.isFinite(status.expiresAtMs));
  const forced = taunt && candidates.find(candidate => candidate.id === taunt.sourceId && alive(candidate));
  if (forced) return forced;
  if (effectiveSide(state, attacker) === 'enemy') {
    const decoy = candidates.find(candidate => {
      const binding = state.decoys.get(candidate.id), owner = binding && state.units.get(binding.ownerId);
      return binding && binding.expiresAtMs > state.simClockMs && owner && alive(owner) && alive(candidate);
    });
    if (decoy) return decoy;
  }
  if (candidates.length === 1) return candidates[0];

  if (effectiveSide(state, attacker) === 'player') {
    const sorted = targetPriority(state, candidates);
    return sorted[0];
  }

  let total = 0;
  for (const c of candidates) total += threatWeight(c);
  if (total <= 0) return candidates[0];
  const roll = state.rng.nextInt(0, total - 1);
  let acc = 0;
  for (const c of candidates) {
    acc += threatWeight(c);
    if (roll < acc) return c;
  }
  return candidates[candidates.length - 1];
}

function registerUnit(state: State, u: CombatUnit): void {
  const copiedBuffs = copyBoneWallStatuses(copySorceressBuffStatuses(u));
  const native = u.druidSummonRanks === undefined ? copiedBuffs : { ...copiedBuffs, druidSummonRanks: copyDruidSummonRanks(u.druidSummonRanks) };
  const copied = refreshCycloneArmorState(copyBoneArmorStatuses(copyConcentrateStatuses(copyLeapStatuses(copyCloakOfShadowsStatuses(copyBurstOfSpeedStatuses(copyFeralRageStatuses(copyFrenzyStatuses(native))))))));
  const shaped = refreshPeriodicSpells(refreshHolyShieldState(refreshDruidFormState(copied)));
  state.units.set(u.id, shaped);
  if (u.holyFreezeAura === true && !state.holyFreezeSources.includes(u.id)) state.holyFreezeSources.push(u.id);
  if (!state.insertionIdx.has(u.id)) {
    state.insertionIdx.set(u.id, state.insertionCounter++);
    state.tiePriority.set(u.id, state.tieRng.next());
  }
}

function nextSummonId(state: State, ownerId: string, templateId: string): string {
  let id: string;
  do {
    id = `${ownerId}-summon-${templateId}-${String(++state.summonSequence)}`;
  } while (state.units.has(id));
  return id;
}

/** A bare marker never establishes paid potency. */
function hasPaidFrozenArmor(unit: CombatUnit): unit is CombatUnit & {
  readonly frozenArmor: NonNullable<CombatUnit['frozenArmor']>;
} {
  const snapshot = unit.frozenArmor;
  return snapshot !== undefined && Number.isInteger(snapshot.rank) &&
    snapshot.rank > 0 && snapshot.rank <= FROZEN_ARMOR_DEFINITION.maxRank &&
    Number.isFinite(snapshot.defensePct) && snapshot.defensePct >= 0;
}

/** Compute damage with combo lookup applied. */
function buildDamageInput(
  state: State,
  attacker: CombatUnit,
  defender: CombatUnit,
  effect: DamageEffect,
  skillLevel = 1,
  baseFlatBonus = 0
): DamageInput {
  const activeDefender = combatStatusView(state, defender);
  const combo = comboMultiplier(activeDefender, effect.damageType);
  const emptyManaBurn = effect.damageType === 'arcane' && defender.mana === 0 && hasStatus(activeDefender, 'mana-burn');
  const stats = attacker.stats;
  const attackingCry = activeBattleCry(attacker, state.simClockMs);
  const attackingDecrepify = activeDecrepify(attacker, state.simClockMs);
  const attackingWeaken = activeWeaken(attacker, state.simClockMs);
  const blindnessPenalty = Math.max(
    hasStatus(activeStatusView(attacker, state.simClockMs), 'blind')
      ? DRUID_SUMMON_DEFINITION.raven.physicalHitChancePenalty : 0,
    (activeDimVision(attacker, state.simClockMs)?.physicalHitChanceReductionPct ?? 0) / 100
  );
  const defendingCry = activeBattleCry(defender, state.simClockMs);
  const attackingCloak = activeCloakOfShadows(attacker, state.simClockMs);
  const defendingCloak = activeCloakOfShadows(defender, state.simClockMs);
  const attackerAura = activeStatAura(state.statAura, attacker.id, state.units);
  const defenderAura = activeStatAura(state.statAura, defender.id, state.units);
  const heartRank = activeDruidAllyAuras(state.druidAllyAuras, attacker, state.units)?.heartRank ?? 0;
  const enemyAura = state.statAura && effectiveSide(state, defender) === 'enemy'
    ? activeStatAura(state.statAura, state.statAura.sourceHeroId, state.units) : undefined;
  const resistBonus = (defenderAura?.bonuses.resistAllPct ?? 0) * 100 + cycloneArmorResistance(defender) -
    (enemyAura?.enemyResistReductionPct ?? 0);
  const auraResistances = resistBonus === 0 ? defender.stats.resistances : {
    physical: defender.stats.resistances.physical + resistBonus,
    fire: defender.stats.resistances.fire + resistBonus, cold: defender.stats.resistances.cold + resistBonus,
    lightning: defender.stats.resistances.lightning + resistBonus,
    arcane: defender.stats.resistances.arcane + resistBonus, poison: defender.stats.resistances.poison + resistBonus
  };
  const lowerResist = activeDamageCurse(defender, state.simClockMs, 'lower-resist');
  const resistances = lowerResist === 0 ? auraResistances : {
    physical: auraResistances.physical - lowerResist, fire: auraResistances.fire - lowerResist,
    cold: auraResistances.cold - lowerResist, lightning: auraResistances.lightning - lowerResist,
    arcane: auraResistances.arcane - lowerResist, poison: auraResistances.poison - lowerResist
  };
  const baseMin = scalePerRank(effect.base[0], effect.perRank?.[0], skillLevel);
  const baseMax = scalePerRank(effect.base[1], effect.perRank?.[1], skillLevel);
  // Project source-owned penetration/curse before the existing act penalty and clamp.
  const defenderResistances = effect.damageType === 'physical'
    ? { ...resistances,
        physical: resistances.physical - amplifyDamageReduction(defender) }
    : effect.damageType === 'cold' && attacker.coldResistanceReductionPct
      ? { ...resistances,
          cold: resistances.cold - attacker.coldResistanceReductionPct }
      : resistances;
  const meltFactor = hasStatus(defender, METEOR_ARMOR_MELT_DEFINITION.statusId)
    ? 1 - METEOR_ARMOR_MELT_DEFINITION.defenseReductionPct / 100 : 1;
  const innerSightReduction = Math.max(activeAmazonInnerSight(defender, state.simClockMs)?.defenseReductionPct ?? 0,
    hasStatus(defender, MERC_INNER_SIGHT_DEFINITION.statusId) ? MERC_INNER_SIGHT_DEFINITION.defenseReductionPct : 0);
  const innerSightFactor = 1 - innerSightReduction / 100;
  const barbsDefense = defender.kind === 'summon'
    ? (activeSpiritOfBarbs(state.spiritOfBarbs, state.barbsSpiritId, defender, state.units)?.rank ?? 0) * SPIRIT_OF_BARBS_DEFINITION.summonDefensePerRank : 0;
  const armorBonus = (hasPaidFrozenArmor(defender) ? defender.frozenArmor.defensePct : 0) + coldArmorBonuses(defender).defense + barbsDefense + holyShieldDefense(defender) + (defendingCloak?.defensePct ?? 0) + (activeConcentrate(defender, state.simClockMs)?.defensePct ?? 0);
  return {
    baseMin,
    baseMax,
    flatBonus: baseFlatBonus + (effect.attackDamagePct
      ? stats.attack * (1 + (attackerAura?.bonuses.attackPct ?? 0) + heartRank * DRUID_ALLY_AURA_DEFINITIONS.heart.attackPerRank) * effect.attackDamagePct / 100 : 0),
    increasedPct: (attacker.increasedDamagePct?.[effect.damageType] ?? 0) +
      (effect.damageType === 'cold' ? coldArmorBonuses(attacker).cold : 0) +
      (effect.damageType === 'physical' ? activeLeap(attacker, state.simClockMs)?.physicalDamagePct ?? 0 : 0) +
      statAuraDamageBonus(attackerAura, effect.damageType) +
      (effect.damageType === 'physical' ? activeMightAura(state.mightAura, attacker.id, state.units)?.physicalDamagePct ?? 0 : 0) +
      (effect.damageType === 'cold' && attacker.side === 'player' && alive(attacker) && holyFreezeSourceId(state) !== undefined
        ? MERC_HOLY_FREEZE_DEFINITION.coldDamagePct : 0),
    comboMult: combo,
    ...((attackingCry ?? attackingDecrepify ?? attackingWeaken) ? { outgoingDamageMultiplier:
      (1 - (attackingCry?.damageReductionPct ?? 0) / 100) * (1 - (attackingDecrepify?.damageReductionPct ?? 0) / 100) *
      (1 - (attackingWeaken?.damageReductionPct ?? 0) / 100) } : {}),
    ...(emptyManaBurn ? { manaBurnMult: MANA_BURN_DEFINITION.zeroManaArcaneMultiplier } : {}),
    ...((effect.damageType === 'physical' || effect.damageType === 'thorns') &&
      blindnessPenalty > 0 ? { hitChancePenalty: blindnessPenalty } : {}),
    ...(effect.alwaysHits === true ? { ignoreDodge: true } : {}),
    type: effect.damageType,
    critChance: stats.critChance + heartRank * DRUID_ALLY_AURA_DEFINITIONS.heart.critPerRank + (effect.critChanceBonus ?? 0) + (attackingCloak?.critChancePct ?? 0),
    critMult: stats.critDamage,
    defenderResistances,
    defenderArmor: effect.ignoresDefense === true ? 0 : Math.max(0, defender.stats.defense * (1 + armorBonus + druidFormBonuses(defender).defensePct + (defenderAura?.bonuses.defensePct ?? 0)) * meltFactor * innerSightFactor * (1 - (defendingCry?.defenseReductionPct ?? 0) / 100)),
    defenderMagicResist: effect.ignoresMagicResist === true ? 0 : defender.stats.magicResist,
    defenderDodge:
      effect.damageType === 'physical' || effect.damageType === 'thorns'
        ? defender.stats.physDodge + druidFormBonuses(defender).physDodgePct + (activeBurstOfSpeed(defender, state.simClockMs)?.physDodgePct ?? 0) +
          (defenderAura?.bonuses.physDodgePct ?? 0)
        : defender.stats.magicDodge + coldArmorBonuses(defender).dodge + (defenderAura?.bonuses.magicDodgePct ?? 0) + (defendingCloak?.magicDodgePct ?? 0) + sorceressBuffBonus(defender, 'teleport', state.simClockMs),
    ...(defender.resistPenalty !== undefined ? { resistPenalty: defender.resistPenalty } : {})
  };
}

/** Supply duration authority only for the current eligible recipient; absence preserves ordinary application. */
function cleansingDurationInput(state: State, recipientId: string): { readonly cleansingDurationMultiplier?: number } {
  const multiplier = activeStatAura(state.statAura, recipientId, state.units)?.cleansingDurationMultiplier;
  return multiplier === undefined ? {} : { cleansingDurationMultiplier: multiplier };
}

/** Shared settlement/prediction: Cyclone, Holy Shield, finite Wall, MP diversion, then Bone Armor. */
function splitPersonalDamage(unit: CombatUnit, amount: number, clock: number, previousPeriodicDamage = 0,
  cycloneBaseline = 0, holyShieldBaseline = 0, previousWallAbsorbed = 0) {
  const sinceCast = Math.max(0, previousPeriodicDamage - cycloneBaseline);
  const cyclone = absorbCycloneArmor(unit, amount, sinceCast);
  const previousAfterCyclone = previousPeriodicDamage - cycloneArmorQuota(unit, sinceCast);
  const holySinceCast = Math.max(0, previousAfterCyclone - holyShieldBaseline);
  const holy = absorbHolyShield(unit, cyclone.damage, holySinceCast);
  const previousAfterHoly = previousAfterCyclone - holyShieldQuota(unit, holySinceCast);
  const wall = absorbBoneWall(unit, holy.damage, clock);
  const shield = divertEnergyShield(wall.unit, wall.damage, Math.max(0, previousAfterHoly - previousWallAbsorbed));
  const bone = absorbBoneArmor(shield.unit, shield.damage);
  return { ...bone, cycloneAbsorbed: cyclone.absorbed, holyShieldAbsorbed: holy.absorbed, wallAbsorbed: wall.absorbed,
    manaSpent: shield.manaSpent };
}

/** Preserve the ordinary damage path's resource/carry bytes when no MP was spent. */
function commitPersonalDamage(state: State, before: CombatUnit, candidate: CombatUnit): ManaEvent | undefined {
  if (before.mana !== candidate.mana) return commitMana(state, before, candidate, 'energy-shield');
  state.units.set(candidate.id, candidate);
  return undefined;
}

function applyDamageToUnit(
  state: State,
  attackerId: string,
  defenderId: string,
  effect: DamageEffect,
  skillLevel = 1,
  basicHit = false,
  auraPulse = false,
  armorReaction = false,
  periodicSpell = false,
  projectileImpact = false
): void {
  const attacker = state.units.get(attackerId);
  const defender = state.units.get(defenderId);
  if (!attacker || !defender || (!alive(attacker) && !armorReaction && !projectileImpact) || !alive(defender)) return;

  const hostileHit = effectiveSide(state, attacker) !== effectiveSide(state, defender);
  const bolts = effect.onHitBolts;
  if (bolts && (!Number.isInteger(bolts.count) || bolts.count < 1 || bolts.count > 8 ||
    !['original', 'adjacent-others'].includes(bolts.targetMode) ||
    !Number.isFinite(bolts.damage.min) || bolts.damage.min < 0 ||
    !Number.isFinite(bolts.damage.max) || bolts.damage.max < bolts.damage.min ||
    !Number.isFinite(bolts.damage.perRank) || bolts.damage.perRank < 0))
    throw new Error('Invalid impact bolts: expected bounded attempts and nonnegative damage');
  const impactCells = bolts?.targetMode === 'adjacent-others' && isValidGridPosition(defender.gridPosition)
    ? cellsForAoeShape(defender.gridPosition, 'cross') : [];
  const boltTargets = bolts?.targetMode === 'original' ? Array.from({ length: bolts.count }, () => defenderId)
    : bolts ? targetPriority(state, attackCandidates(state, attacker).filter(candidate =>
      candidate.id !== defenderId && effectiveSide(state, candidate) !== effectiveSide(state, attacker) &&
      impactCells.some(cell => cell.row === candidate.gridPosition?.row && cell.col === candidate.gridPosition.col)))
      .slice(0, bolts.count).map(candidate => candidate.id) : [];
  const activeDefender = activeStatusView(defender, state.simClockMs);
  // Capture pre-hit eligibility: a lethal victim hit may clear its curse during settlement.
  const lifeTap = activeDamageCurse(activeDefender, state.simClockMs, 'life-tap');
  const ironMaiden = activeDamageCurse(attacker, state.simClockMs, 'iron-maiden') / 100;
  const retaliates = !armorReaction && !periodicSpell && hasPaidFrozenArmor(activeDefender);
  const coldReactions = !armorReaction && !auraPulse && !periodicSpell && hostileHit
    ? COLD_ARMOR_IDS.map(id => ({ id, rank: paidColdArmorRank(activeDefender, id) }))
      .filter(({ id, rank }) => rank > 0 && (id === 'chilling-armor' || effect.damageType === 'physical')) : [];
  const input = buildDamageInput(state, attacker, activeDefender, effect, skillLevel);
  const enchantBase = hostileHit && effect.damageType === 'physical' && !auraPulse && !armorReaction && !periodicSpell
    ? sorceressBuffBonus(attacker, 'enchant', state.simClockMs) : 0;
  const sharedRoll = effect.components !== undefined || enchantBase > 0 ? rollDamage(input, state.rng) : undefined;
  const scalarOutcome = () => auraPulse
    ? { hit: true, crit: false, dodged: false,
      ...mitigateDamage((input.baseMin + input.flatBonus) * (1 + input.increasedPct) * input.comboMult, input) }
    : sharedRoll ? resolveRolledDamage(input, sharedRoll) : resolveDamage(input, state.rng);
  // All component inputs observe the same pre-strike units and statuses. One
  // hit/base/crit decision is shared; this strike cannot combo with its own statuses.
  const totalWeight = effect.components?.reduce((sum, component) => sum + component.weight, 0) ?? 1;
  const carrierHits = effect.components && sharedRoll
    ? effect.components.map(component => ({ damageType: component.damageType,
      outcome: resolveRolledDamage(buildDamageInput(state, attacker, activeDefender,
        { ...effect, damageType: component.damageType }, skillLevel), sharedRoll, component.weight / totalWeight) }))
    : [{ damageType: effect.damageType, outcome: scalarOutcome() }];
  const hits = [...carrierHits];
  if (enchantBase > 0 && sharedRoll?.hit) {
    // A weapon coating shares hit/crit without copying carrier penetration,
    // statuses or recovery, and without drawing another random number.
    const fire: DamageEffect = { kind: 'damage', damageType: 'fire', base: [0, 0] };
    hits.push({ damageType: 'fire', outcome: resolveRolledDamage(
      buildDamageInput(state, attacker, activeDefender, fire, 1, enchantBase), sharedRoll, 0) });
  }
  const outcome = hits[0]?.outcome;
  if (!outcome) return;
  let amount = 0;
  let physicalHpRemoved = 0;
  let newLife = defender.life;
  let remainingDefenses = defender;
  for (const [index, hit] of hits.entries()) {
    const hitAmount = hit.outcome.hit && hit.outcome.final > 0 && shouldShatter(activeDefender, hit.damageType)
      ? Math.max(hit.outcome.final, cycloneArmorLethalBound(defender, holyShieldLethalBound(defender,
        defender.life + (boneArmorPool(defender)?.boneArmor?.remaining ?? 0) +
        (boneWallPool(defender, state.simClockMs)?.boneWall?.remaining ?? 0) + availableEnergyShieldMana(defender))))
      : hit.outcome.final;
    amount += hitAmount;
    const absorption = splitPersonalDamage(remainingDefenses, hitAmount, state.simClockMs);
    emit(state, {
      kind: 'damage', source: attackerId, target: defenderId,
      damageType: hit.damageType, amount: absorption.damage,
      ...(absorption.absorbed > 0 ? { absorbed: absorption.absorbed } : {}),
      ...(absorption.cycloneAbsorbed > 0 ? { cycloneAbsorbed: absorption.cycloneAbsorbed } : {}),
      ...(absorption.holyShieldAbsorbed > 0 ? { holyShieldAbsorbed: absorption.holyShieldAbsorbed } : {}),
      ...(absorption.wallAbsorbed > 0 ? { wallAbsorbed: absorption.wallAbsorbed } : {}),
      crit: hit.outcome.crit, dodged: hit.outcome.dodged
    });
    if (hit.outcome.dodged) continue;
    const previousLife = newLife;
    newLife = Math.max(0, newLife - absorption.damage);
    if (hit.damageType === 'physical') physicalHpRemoved += previousLife - newLife;
    // Spend finite defenses in order, keeping original hit eligibility until the
    // final component commits HP. Death, orbs and corpse supply close once below.
    const manaEvent = commitPersonalDamage(state, remainingDefenses, { ...absorption.unit,
      life: index === hits.length - 1 ? newLife : defender.life });
    if (manaEvent) emit(state, manaEvent);
    if (absorption.absorbed > 0) observeStatuses(state, defenderId);
    remainingDefenses = state.units.get(defenderId) ?? absorption.unit;
  }

  if (outcome.dodged) return;

  const statuses = effect.applyStatuses ?? (effect.applyStatus ? [effect.applyStatus] : []);
  for (const hit of carrierHits) {
    for (const status of statuses) {
      // Scalar Physical carriers can apply elemental payloads. Only composite
      // statuses are bound to their matching component's damage and potency.
      if (effect.components && status.damageType !== hit.damageType) continue;
      const chance = status.chance ?? 1;
      if ((auraPulse && chance === 1) || state.rng.chance(chance)) {
        const stacks = status.stacksOnApply ?? 1;
        const dotPerStack =
          status.dotPctOfDamage !== undefined
            ? Math.max(1, Math.floor(hit.outcome.final * status.dotPctOfDamage))
            : undefined;
        const cur = state.units.get(defenderId);
        if (cur) {
          // Only the exact paid, eligible real hit can authenticate temporary allegiance.
          if (status.id === 'converted') {
            if (effect.conversion !== true || conversionRank(attacker) === 0 ||
              !hostileHit || !isConversionTarget(cur) || cur.life >= defender.life) continue;
            const expiresAtMs = state.simClockMs + CONVERSION_DEFINITION.durationMs;
            state.conversions.set(cur.id, { sourceId: attackerId, expiresAtMs });
            const updated: CombatUnit = { ...cur, statuses: [...cur.statuses.filter(s => s.id !== 'converted'), {
              id: 'converted', sourceId: attackerId, stacks: 1,
              remaining: CONVERSION_DEFINITION.durationMs / SECONDS,
              appliedAtMs: state.simClockMs, expiresAtMs
            }] };
            state.units.set(cur.id, updated);
            emit(state, { kind: 'status', target: defenderId, statusId: 'converted' });
            observeStatuses(state, defenderId);
            continue;
          }
          let updated = cur;
          let applied = false;
          for (let i = 0; i < stacks; i++) {
            const application = applyStatusWithResult(
              updated,
              {
                id: status.id,
                ...cleansingDurationInput(state, defenderId),
                sourceId: attackerId,
                simClockMs: state.simClockMs,
                ...(status.durationMs !== undefined ? { durationMs: status.durationMs } : {}),
                ...(dotPerStack !== undefined ? { dotPerStack } : {}),
                damageType: status.damageType ?? hit.damageType
              },
              state.rng
            );
            updated = application.unit;
            applied = applied || application.applied;
          }
          const drain = status.id === 'mana-burn' && hostileHit
            ? Math.min(updated.mana, Math.floor((defender.life - newLife) * MANA_BURN_DEFINITION.drainFraction)) : 0;
          const manaEvent = drain > 0
            ? commitMana(state, cur, { ...updated, mana: updated.mana - drain }, 'mana-burn') : undefined;
          if (drain <= 0) state.units.set(defenderId, updated);
          if (applied && status.id === 'plague') state.plague.mark(effect, updated, state.simClockMs);
          if (applied) emit(state, { kind: 'status', target: defenderId, statusId: status.id });
          if (manaEvent) emit(state, manaEvent);
          observeStatuses(state, defenderId);
        }
      }
    }
  }

  // Coating is a deterministic poison payload, independent of the physical hit's mitigation/crit.
  const rawPoison = basicHit ? assassinVenomRawDps(attacker, state.assassinVenom) : undefined;
  if (rawPoison !== undefined) {
    const poison: DamageEffect = { kind: 'damage', damageType: 'poison', base: [0, 0] };
    const dotPerStack = mitigateDamage(rawPoison, buildDamageInput(state, attacker, activeDefender, poison)).final;
    const current = state.units.get(defenderId);
    if (current) {
      state.units.set(defenderId, applyStatus(current, { id: 'poison', sourceId: attackerId,
        ...cleansingDurationInput(state, defenderId),
        simClockMs: state.simClockMs, durationMs: ASSASSIN_SHADOW_DEFINITIONS.venom.coatingDurationMs,
        dotPerStack, damageType: 'poison' }, state.rng));
      emit(state, { kind: 'status', target: defenderId, statusId: 'poison' });
      observeStatuses(state, defenderId);
    }
  }

  const survivingAttacker = state.units.get(attackerId);
  if (retaliates && outcome.hit && amount > 0 && survivingAttacker && alive(survivingAttacker)) {
    state.units.set(attackerId, applyStatus(survivingAttacker, {
      ...cleansingDurationInput(state, attackerId),
      id: 'chill', sourceId: defenderId, simClockMs: state.simClockMs
    }, state.rng));
    emit(state, { kind: 'status', target: attackerId, statusId: 'chill' });
    observeStatuses(state, attackerId);
  }

  // Snapshot eligibility before the incoming hit, including a lethal hit on the wearer.
  // Reuse real damage/status/shield/death settlement; reaction hits cannot trigger any armor.
  if (outcome.hit && amount > 0) for (const { id, rank } of coldReactions) {
    applyDamageToUnit(state, defenderId, attackerId, coldArmorCounterattack(id), rank, false, false, true);
  }

  const after = state.units.get(defenderId);
  const ordinaryReflectionPct = (after?.physicalReflectionPct ?? 0) +
    (activeStatAura(state.statAura, defenderId, state.units)?.bonuses.thornsPct ?? 0) +
    (after ? activeSpiritOfBarbs(state.spiritOfBarbs, state.barbsSpiritId, after, state.units)?.rank ?? 0 : 0) * SPIRIT_OF_BARBS_DEFINITION.thornsPerRank;
  if (after && !alive(after)) {
    finishDeaths(state, [activeStatusView(after, state.simClockMs)]);
  }
  // The curse punishes a paid attack even when its victim dies; ordinary Thorns keeps its living-wearer rule.
  const livingReflectionPct = after && alive(after) ? ordinaryReflectionPct : 0;
  const reflectionPct = ironMaiden + livingReflectionPct;
  // Only ordinary Thorns retains its minimum-one rule; a pure curse floors tiny HP loss to zero.
  const raw = Math.max(livingReflectionPct > 0 ? 1 : 0, Math.floor(physicalHpRemoved * reflectionPct));
  if (after && hostileHit && physicalHpRemoved > 0 && reflectionPct > 0 && raw > 0) {
    const target = state.units.get(attackerId);
    if (!target || !alive(target)) return;
    const thorns: DamageEffect = { kind: 'damage', damageType: 'thorns', base: [raw, raw] };
    const reflected = mitigateDamage(raw,
      buildDamageInput(state, after, activeStatusView(target, state.simClockMs), thorns));
    const reflectionAbsorption = splitPersonalDamage(target, reflected.final, state.simClockMs);
    emit(state, { kind: 'damage', source: defenderId, target: attackerId,
      damageType: 'thorns', amount: reflectionAbsorption.damage,
      ...(reflectionAbsorption.absorbed > 0 ? { absorbed: reflectionAbsorption.absorbed } : {}),
      ...(reflectionAbsorption.cycloneAbsorbed > 0 ? { cycloneAbsorbed: reflectionAbsorption.cycloneAbsorbed } : {}),
      ...(reflectionAbsorption.holyShieldAbsorbed > 0 ? { holyShieldAbsorbed: reflectionAbsorption.holyShieldAbsorbed } : {}),
      ...(reflectionAbsorption.wallAbsorbed > 0 ? { wallAbsorbed: reflectionAbsorption.wallAbsorbed } : {}),
      crit: false, dodged: false });
    const damaged = { ...reflectionAbsorption.unit, life: Math.max(0, target.life - reflectionAbsorption.damage) };
    const manaEvent = commitPersonalDamage(state, target, damaged);
    if (manaEvent) emit(state, manaEvent);
    if (reflectionAbsorption.absorbed > 0) observeStatuses(state, attackerId);
    if (!alive(damaged)) finishDeaths(state, [activeStatusView(damaged, state.simClockMs)]);
    recoverBloodGolem(state, defenderId, target.life - damaged.life, hostileHit);
  }

  // Explicit skill-hit recovery observes actual HP removed, after ordinary death/orb/reflection settlement.
  const hpRemoved = defender.life - newLife;
  const tappedAttacker = state.units.get(attackerId);
  if (hostileHit && hpRemoved > 0 && lifeTap > 0 && tappedAttacker && alive(tappedAttacker))
    commitHealing(state, tappedAttacker, Math.floor(hpRemoved * lifeTap / 100));
  const owner = state.units.get(attackerId);
  if (!basicHit && !auraPulse && !armorReaction && !periodicSpell && hostileHit && hpRemoved > 0 && owner && alive(owner)) {
    const fraction = effect.onHitRecovery?.lifeFraction;
    if (fraction !== undefined && Number.isFinite(fraction) && fraction > 0 && fraction <= 1) {
      commitHealing(state, owner, Math.floor(hpRemoved * fraction));
    }
    const selfCost = effect.onHitSelfDamage;
    if (selfCost && Number.isFinite(selfCost.lifeFraction) && selfCost.lifeFraction > 0 && selfCost.lifeFraction <= 1 &&
      Number.isInteger(selfCost.minimumLifeLoss) && selfCost.minimumLifeLoss > 0) {
      // A life tradeoff, not a hostile hit: never dodge, absorb, reflect or recurse.
      const loss = Math.min(owner.life, Math.max(selfCost.minimumLifeLoss, Math.floor(hpRemoved * selfCost.lifeFraction)));
      const damaged = { ...owner, life: owner.life - loss };
      state.units.set(attackerId, damaged);
      emit(state, { kind: 'damage', source: attackerId, target: attackerId,
        damageType: 'physical', amount: loss, crit: false, dodged: false });
      if (!alive(damaged)) finishDeaths(state, [activeStatusView(damaged, state.simClockMs)]);
    }
    const current = state.units.get(attackerId);
    if (effect.feralRage === true && current) {
      const updated = gainFeralRageStack(current, state.simClockMs);
      if (updated !== current) {
        state.units.set(attackerId, updated);
        emit(state, { kind: 'buff', target: attackerId, buffId: 'feral-rage', statusBacked: true });
        observeStatuses(state, attackerId);
      }
    }
    const frenzyOwner = state.units.get(attackerId);
    if (effect.frenzy === true && frenzyOwner) {
      const updated = gainFrenzyStack(frenzyOwner, state.simClockMs);
      if (updated !== frenzyOwner) {
        state.units.set(attackerId, updated);
        emit(state, { kind: 'buff', target: attackerId, buffId: 'frenzy', statusBacked: true });
        observeStatuses(state, attackerId);
      }
    }
  }
  recoverBloodGolem(state, attackerId, hpRemoved, hostileHit);
  if (bolts && hostileHit && outcome.hit && !basicHit && !auraPulse && !armorReaction && !periodicSpell) {
    const bolt: DamageEffect = { kind: 'damage', damageType: 'lightning',
      base: [bolts.damage.min, bolts.damage.max], perRank: [bolts.damage.perRank, bolts.damage.perRank] };
    for (const id of boltTargets) {
      const current = state.units.get(attackerId), target = state.units.get(id);
      if (!current || !alive(current)) break;
      if (target && alive(target) && effectiveSide(state, target) !== effectiveSide(state, current))
        applyDamageToUnit(state, attackerId, id, bolt, skillLevel);
    }
  }
}

/** Shared ambient layers, always applied over the current fresh personal capacity. */
function ambientLifeBonuses(state: State, unit: CombatUnit): readonly LifeCapacityBonus[] {
  const oakRank = activeDruidAllyAuras(state.druidAllyAuras, unit, state.units)?.oakRank ?? 0;
  const aura = activeStatAura(state.statAura, unit.id, state.units);
  const vigor = aura?.selectedAuraId === 'paladin.vigor' ? aura.bonuses.lifePct ?? 0 : 0;
  return [
    ...(oakRank ? [{ coefficient: DRUID_ALLY_AURA_DEFINITIONS.oak.lifePerRank, rank: oakRank }] : []),
    ...(vigor ? [{ coefficient: vigor, rank: 1 }] : [])
  ];
}

/** Switch native profiles only at a paid transition; preserve HP until all life layers settle. */
function reconcileBattleCommandPassives(state: State): void {
  for (const unit of state.units.values()) {
    const profiles = unit.battleCommandPassives;
    if (!profiles || unit.side !== 'player' || inferKind(unit) !== 'hero' ||
      unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined) continue;
    const boosted = battleCommandBonus(unit, state.simClockMs, state.battleCommands) > 0;
    if (boosted === state.boostedCommandPassives.has(unit.id)) continue;
    const profile = boosted ? profiles.boosted : profiles.baseline;
    const base = withoutTemporaryLifeCapacity(unit);
    const next = projectLifeCapacity({ ...base, ...profile, stats: { ...base.stats, ...profile.stats }, life: unit.life,
      mana: Math.min(unit.mana, profile.stats.manaMax) }, druidFormLifeBonus(base), ambientLifeBonuses(state, unit));
    if (boosted) state.boostedCommandPassives.add(unit.id);
    else state.boostedCommandPassives.delete(unit.id);
    state.units.set(unit.id, next);
    emit(state, { kind: 'stats-state', target: unit.id, state: {
      ...captureBattleCommandPassiveProfile(next), stats: next.stats, life: next.life, mana: next.mana,
      ...(next.vigorLife ? { vigorLife: next.vigorLife } : {}) } });
  }
}

/** Recompose temporary capacity once; removing it caps absolute HP without healing or damage. */
function reconcileLifeCapacities(state: State, forceFormIds: readonly string[] = []): void {
  if (!state.hasTemporaryLife) return;
  for (const unit of state.units.values()) {
    const ambient = ambientLifeBonuses(state, unit);
    const druid = forceFormIds.includes(unit.id) || unit.druidShapeRanks !== undefined || unit.druidForm !== undefined || unit.druidFormLife !== undefined;
    if (!druid && ambient.length === 0 && unit.vigorLife === undefined) continue;
    const next = projectLifeCapacity(unit, druidFormLifeBonus(unit), ambient);
    state.units.set(unit.id, next);
    if (unit.stats.lifeMax !== next.stats.lifeMax || unit.life !== next.life || forceFormIds.includes(unit.id)) {
      emit(state, { kind: 'life-capacity', target: unit.id, lifeMax: next.stats.lifeMax, life: next.life,
        ...(next.vigorLife ? { vigorBaseLifeMax: next.vigorLife.baseLifeMax } : {}),
        ...(druid ? { druidFormState: { ...(next.druidForm ? { druidForm: next.druidForm } : {}),
          ...(next.druidFormLife ? { druidFormLife: next.druidFormLife } : {}) } } : {}) });
    }
  }
}

/** Close and mark the whole death set before any spread/refund/orb side effect. */
function finishDeaths(state: State, primarySources: readonly CombatUnit[]): void {
  const primary = new Map(primarySources.filter(u => !state.deathsHandled.has(u.id)).map(u => [u.id, u]));
  const deadIds = new Set(primary.keys());
  // Ownership can be a graph; orphan-only deaths never get ordinary effects.
  let grew = true;
  while (grew) {
    grew = false;
    for (const u of state.units.values()) {
      if (alive(u) && u.summonOwnerId && deadIds.has(u.summonOwnerId) && !deadIds.has(u.id)) {
        deadIds.add(u.id);
        grew = true;
      }
    }
  }
  const dead = [...state.units.values()].filter(u => deadIds.has(u.id));
  for (const u of dead) {
    state.units.set(u.id, { ...u, life: 0 });
    state.deathsHandled.add(u.id);
    state.actionSchedule.delete(u.id);
    state.periodic.delete(u.id);
    state.manaRecovery.delete(u.id);
    if (inferKind(u) === 'hero') state.heroDead = true;
  }
  const hadConversions = state.conversions.size > 0;
  for (const [id] of state.conversions) {
    const unit = state.units.get(id);
    if (unit && activeConversion(state, unit) !== undefined) continue;
    state.conversions.delete(id);
    if (unit) state.units.set(id, { ...unit, statuses: unit.statuses.filter(s => s.id !== 'converted') });
  }
  for (const u of dead) {
    observeStatuses(state, u.id);
    emit(state, { kind: 'death', target: u.id });
  }
  reconcileLifeCapacities(state);
  // Derived allied auras disappear from survivors before any death-related recovery.
  if (state.druidAllyAuras !== undefined || state.spiritOfBarbs !== undefined || hadConversions) {
    for (const u of state.units.values()) if (alive(u)) observeStatuses(state, u.id);
  }
  for (const u of dead) stopGrimWard(state, u.id);
  for (const u of dead) {
    const source = primary.get(u.id);
    if (source) deathEffects(state, source);
  }
  // Publish only after the complete closure/effects, in the existing death-event order.
  // Keep every outcome unit and handled death intact for rewards and replay.
  const aura = state.statAura;
  if (state.corpseExplosion.size > 0 || state.poisonExplosion.size > 0 || state.findPotion.size > 0 || state.findItem.size > 0 || state.grimWard.size > 0 ||
    (aura?.redemption !== undefined && activeStatAura(aura, aura.sourceHeroId, state.units) !== undefined) ||
    [...state.druidSummons.keys()].some(id => {
      const bound = activeDruidSummon(state, id);
      return bound !== undefined && (bound.template === 'carrion_vine' || bound.template === 'solar_creeper');
    })) {
    for (const u of dead) {
      if (!primary.has(u.id) || u.side !== 'enemy' || inferKind(u) !== 'monster' ||
        u.summon === true || u.ownerId !== undefined || u.summonOwnerId !== undefined) continue;
      state.corpses.push(u.id);
      emit(state, { kind: 'message', messageKey: 'combat:corpses.available', params: { count: state.corpses.length } });
    }
  }
}

/** Ordinary effects use the frozen final-interval source and current living recipients. */
function deathEffects(state: State, dead: CombatUnit): void {
  if (hasStatus(dead, 'plague') || hasStatus(dead, 'poison')) {
    const recipients = [...state.units.values()].filter(u => u.side === dead.side && alive(u));
    const epidemic = state.plague.consume(dead);
    const fraction = epidemic ? PLAGUE_DEFINITION.epidemicSpreadFraction : PLAGUE_DEFINITION.ordinarySpreadFraction;
    for (const u of spreadPlague(dead, recipients, fraction, state.rng, state.simClockMs,
      recipient => activeStatAura(state.statAura, recipient.id, state.units)?.cleansingDurationMultiplier)) {
      state.units.set(u.id, u);
      observeStatuses(state, u.id);
    }
    if (epidemic) emit(state, { kind: 'message', messageKey: 'combat:epidemic.triggered',
      params: { percent: fraction * 100, targets: recipients.length } });
  }

  // Bug #3 (P0) - when a summon dies, refund the parent skill's mana cost
  // on the owner so they can re-cast on their next action ("骷髅兵死后再
  // 触发技能重新召唤"). Without this, a Necromancer with raise_skeleton
  // (mana cost 15, no cooldown, no in-combat regen) hits a hard mana wall
  // at 5 lifetime summons; once their mana drains, dead skeletons are
  // never replaced.
  if (inferKind(dead) === 'summon' && dead.summonOwnerId && dead.summonRefundOnDeath !== false &&
    !(dead.summonTemplateId && state.preparationTemplates.get(dead.summonOwnerId)?.has(dead.summonTemplateId))) {
    const owner = state.units.get(dead.summonOwnerId);
    if (owner && alive(owner)) {
      const summonSkill = owner.skillOrder
        .map((id) => getSkill(id))
        .find((s): s is RegisteredSkill =>
          !!s && s.effects.some((e): e is SummonEffect => e.kind === 'summon')
        );
      if (summonSkill) {
        const summonSkillLevel = effectiveSkillLevel(state, owner, summonSkill);
        const refundedMana = Math.min(
          owner.stats.manaMax,
          owner.mana + effectiveManaCost(summonSkill, summonSkillLevel)
        );
        const manaEvent = commitMana(state, owner, { ...owner, mana: refundedMana }, 'summon-refund');
        if (manaEvent) emit(state, manaEvent);
        const cdMap = state.cooldownExpiresAt.get(owner.id);
        if (cdMap) cdMap.delete(summonSkill.id);
      }
    }
  }
  // Orb drops — only enemy heroes/monsters drop, not summons.
  if (dead.side === 'enemy' && inferKind(dead) !== 'summon') {
    const orbs = rollOrbDrops(dead.tier, state.rng);
    const players = aliveOf(state, 'player');
    if (players.length > 0 && orbs.length > 0) {
      const manaEvents: ManaEvent[] = [];
      for (const p of players) {
        const updated = applyOrbs(p, orbs);
        const manaEvent = commitMana(state, p, updated, 'orb');
        if (manaEvent) manaEvents.push(manaEvent);
      }
      for (const orb of orbs) {
        for (const p of players) {
          emit(state, { kind: 'orb', target: p.id, orb });
        }
      }
      for (const manaEvent of manaEvents) emit(state, manaEvent);
    }
  }

  // Remove from action scheduler.
  state.actionSchedule.delete(dead.id);
}

function summonsOf(state: State, ownerId: string, summonTemplateId?: string): CombatUnit[] {
  const out: CombatUnit[] = [];
  for (const u of state.units.values()) {
    if (
      u.summonOwnerId === ownerId &&
      alive(u) &&
      (summonTemplateId === undefined || u.summonTemplateId === summonTemplateId)
    ) {
      out.push(u);
    }
  }
  return out;
}

function gridPositionKey(position: GridPosition | undefined): string | null {
  return position ? `${String(position.row)}:${String(position.col)}` : null;
}

function firstOpenSummonPosition(owner: CombatUnit, occupiedUnits: readonly CombatUnit[]): GridPosition | undefined {
  const occupied = new Set(
    occupiedUnits
      .map((unit) => gridPositionKey(unit.gridPosition))
      .filter((key): key is string => key !== null)
  );
  return owner.summonGridPositions?.find((position) => !occupied.has(gridPositionKey(position) ?? ''));
}

function skillLevelCandidates(skill: RegisteredSkill): readonly string[] {
  const rest = skill.id.slice(skill.archetype.length + 1);
  return [
    skill.id,
    `skills-${skill.archetype}-${rest.replace(/_/g, '-')}`
  ];
}

function learnedSkillLevel(state: State, unit: CombatUnit, skill: RegisteredSkill, legacyFallback = 1): number {
  if (SLOW_MISSILES_IDS.some(id => id === skill.id)) return slowMissilesRank(unit);
  if (DECOY_IDS.some(id => id === skill.id)) return decoyRank(unit);
  if (BONE_WALL_IDS.some(id => id === skill.id)) return boneWallRank(unit);
  if (BONE_PRISON_IDS.some(id => id === skill.id)) return bonePrisonRank(unit);
  if (isBattleCommandId(skill.id)) return battleCommandRank(unit);
  if (isCorpseExplosionId(skill.id)) return corpseExplosionRank(unit, state.corpseExplosion);
  if (isPoisonExplosionId(skill.id)) return poisonExplosionRank(unit, state.poisonExplosion);
  if (isFindPotionId(skill.id)) return findPotionRank(unit, state.findPotion);
  if (isFindItemId(skill.id)) return findItemRank(unit, state.findItem);
  if (isGrimWardId(skill.id)) return grimWardRank(unit, state.grimWard);
  const personalBuff = sorceressBuffId(skill.id);
  if (personalBuff) return sorceressBuffRank(unit, personalBuff);
  const periodic = periodicSpellId(skill.id);
  if (periodic) return periodicSpellRank(unit, periodic);
  if (CONVERSION_IDS.some(id => id === skill.id)) return conversionRank(unit);
  if (HOLY_SHIELD_IDS.some(id => id === skill.id)) return holyShieldRank(unit);
  if (CYCLONE_ARMOR_IDS.some(id => id === skill.id)) return cycloneArmorRank(unit);
  const form = druidFormForId(skill.id);
  if (form) return druidFormRank(unit, form);
  if (BURST_OF_SPEED_IDS.some(id => id === skill.id)) return burstOfSpeedRank(unit);
  if (CLOAK_OF_SHADOWS_IDS.some(id => id === skill.id)) return cloakOfShadowsRank(unit);
  if (LEAP_IDS.some(id => id === skill.id)) return leapRank(unit);
  if (CONCENTRATE_IDS.some(id => id === skill.id)) return concentrateRank(unit);
  if (isStaticFieldId(skill.id)) return staticFieldRank(unit);
  const armor = coldArmorId(skill.id);
  if (armor) return coldArmorRank(unit, armor);
  const governed = governedActiveId(skill.id);
  if (governed) {
    if (unit.governedActiveRanks) return unit.governedActiveRanks[governed];
    if (governed === 'item.redemption') return 0;
  }
  if (skill.id === 'sorceress.frozen_armor') return resolveFrozenArmorRank(unit.skillLevels);
  const levels = unit.skillLevels;
  if (!levels) return legacyFallback;
  for (const id of skillLevelCandidates(skill)) {
    const level = levels[id];
    if (typeof level === 'number' && level > 0) return Math.floor(level);
  }
  return legacyFallback;
}

/** Resolve permission first; a party bonus never grants a missing learned skill. */
function effectiveSkillLevel(state: State, unit: CombatUnit, skill: RegisteredSkill): number {
  const learned = learnedSkillLevel(state, unit, skill), bonus = battleCommandBonus(unit, state.simClockMs, state.battleCommands);
  if (!bonus) return learned;
  // Dedicated native projections already resolve learned authority. Merc/summon
  // orders contain their owned abilities; a missing hero allocation stays absent.
  const authorized = learnedSkillLevel(state, unit, skill, 0) > 0 ||
    ((unit.kind === 'merc' || unit.kind === 'summon') &&
      skillLevelCandidates(skill).some(id => unit.skillOrder.includes(id)));
  return authorized ? effectiveLearnedSkillRank(learned, bonus) : learned;
}

/** Captured provenance travels with paid potency after the live grant expires. */
function paidRankBonus(state: State, unit: CombatUnit): 1 | undefined {
  return battleCommandBonus(unit, state.simClockMs, state.battleCommands) > 0 ? 1 : undefined;
}

function effectiveManaCost(skill: RegisteredSkill, skillLevel: number): number {
  return Math.max(0, Math.round(skill.manaCost + (skill.manaCostPerRank ?? 0) * Math.max(0, skillLevel - 1)));
}

function effectiveCooldown(skill: RegisteredSkill, skillLevel: number): number {
  if (skill.cooldown <= 0) return 0;
  return Math.max(1, Number((skill.cooldown + (skill.cooldownPerRank ?? 0) * Math.max(0, skillLevel - 1)).toFixed(1)));
}

function activeBuffIdsForSkill(skill: RegisteredSkill): readonly string[] {
  return skill.effects
    .filter((effect): effect is BuffEffect => effect.kind === 'buff')
    .map((effect) => effect.id);
}

function isPaidFrozenArmorSkill(skill: RegisteredSkill): boolean {
  return skill.id === 'sorceress.frozen_armor' && skill.trigger === 'active' &&
    skill.target === 'self' && skill.effects.some(effect => effect.kind === 'buff' &&
      effect.id === 'frozen-armor' && effect.frozenArmor === true);
}

/** Potential is deterministic; availability must never consume a healing roll. */
function healingPotential(effect: HealEffect, target: CombatUnit): number {
  return effect.amount ?? effect.amountRange?.[1] ??
    Math.floor(target.stats.lifeMax * (effect.pctOfMaxLife ?? 0));
}

/** Commit only actual positive HP restoration; ambient and ordinary healing share playback. */
function commitHealing(state: State, target: CombatUnit, amount: number): void {
  if (!Number.isFinite(target.life) || target.life <= 0 || !Number.isFinite(target.stats.lifeMax) ||
    !Number.isFinite(amount) || amount <= 0) return;
  const restored = Math.min(target.stats.lifeMax - target.life, amount);
  if (restored <= 0) return;
  state.units.set(target.id, { ...target, life: target.life + restored });
  emit(state, { kind: 'heal', target: target.id, amount: restored });
}

/** Recover the living actual source once, using fresh post-settlement resources and paid authority. */
function recoverBloodGolem(state: State, sourceId: string, hpRemoved: number, hostile: boolean): void {
  if (!hostile || state.bloodGolems.size === 0 || !Number.isFinite(hpRemoved) || hpRemoved <= 0) return;
  const source = state.units.get(sourceId);
  if (!source || source.side !== 'player' || effectiveSide(state, source) !== 'player' ||
    !['hero', 'merc', 'summon'].includes(inferKind(source)) || !alive(source)) return;
  const active = [...state.bloodGolems].some(([id, binding]) => {
    const body = state.units.get(id), owner = state.units.get(binding.ownerId), skill = getSkill('necromancer.blood_golem');
    return body !== undefined && owner !== undefined && skill !== undefined &&
      body.id !== owner.id && body.side === 'player' && inferKind(body) === 'summon' &&
      body.summon === true && body.summonTemplateId === 'blood_golem' &&
      body.summonOwnerId === owner.id && (body.ownerId === undefined || body.ownerId === owner.id) &&
      Number.isFinite(body.life) && body.life > 0 && qualifyBloodGolem(owner, skill, binding.rank);
  });
  if (active) commitHealing(state, source, Math.floor(hpRemoved * BLOOD_GOLEM_DEFINITION.lifeLeechFraction));
}

/** Select fresh, same-side recipients, retaining insertion order for ratio ties. */
function healingTargets(state: State, actorId: string, effect: HealEffect): CombatUnit[] {
  const actor = state.units.get(actorId);
  if (!actor) return [];
  const candidates = effect.target === 'self' ? [actor] : [...state.units.values()];
  const eligible = candidates.filter(target => effectiveSide(state, target) === effectiveSide(state, actor) &&
    target.stats.lifeMax > 0 && target.life > 0 && target.life < target.stats.lifeMax &&
    healingPotential(effect, target) > 0);
  if (effect.target !== 'ally') return eligible;
  let selected: CombatUnit | undefined;
  for (const target of eligible) {
    if (!selected || target.life / target.stats.lifeMax < selected.life / selected.stats.lifeMax) {
      selected = target;
    }
  }
  return selected ? [selected] : [];
}

function hasAvailableEffect(state: State, actorId: string, skill: RegisteredSkill, skillLevel: number): boolean {
  if (matchesStaticField(skill)) {
    const actor = state.units.get(actorId);
    return actor !== undefined && opponentsOf(state, actor)
      .some(target => staticFieldDamage(target, state.difficulty) > 0);
  }
  if (skill.effects.length > 0 && skill.effects.every((effect) => effect.kind === 'heal')) {
    return skill.effects.some((effect) => healingTargets(state, actorId, effect).length > 0);
  }
  if (!skill.effects.every((effect) => effect.kind === 'summon')) return true;
  return skill.effects.some((effect) =>
    (effect.monsterDef !== undefined || getSummon(effect.summonId) !== undefined) &&
    summonsOf(state, actorId, effect.summonId).length < resolveSummonMaxCount(effect, skillLevel)
  );
}


/** Refuse marker-only, borrowed or incomplete runtime definitions before payment. */
function matchesSlowMissiles(skill: RegisteredSkill): boolean {
  const effect = skill.effects[0];
  return SLOW_MISSILES_IDS.some(id => id === skill.id) && skill.archetype === 'amazon' &&
    skill.target === 'all-enemies' && skill.minLevel === SLOW_MISSILES_DEFINITION.requiredLevel &&
    skill.effects.length === 1 && effect?.kind === 'debuff' && effect.statusId === 'slow-missiles' &&
    effect.slowMissiles === true && effect.durationMs === SLOW_MISSILES_DEFINITION.durationMs;
}

function canUseSkillForState(
  state: State,
  unit: CombatUnit,
  skill: RegisteredSkill,
  skillOrderId: string,
  hasEnemyTarget: boolean
): boolean {
  const slow = SLOW_MISSILES_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'debuff' && effect.slowMissiles === true);
  if (slow && (!matchesSlowMissiles(skill) || slowMissilesRank(unit) === 0 || !Number.isFinite(unit.mana) ||
    SLOW_MISSILES_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const prison = BONE_PRISON_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'debuff' && effect.bonePrison === true);
  if (prison && (!matchesBonePrison(skill) || bonePrisonRank(unit) === 0 ||
    !hasEnemyTarget || !Number.isFinite(unit.mana) ||
    BONE_PRISON_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const wall = BONE_WALL_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.boneWall === true);
  if (wall && (!matchesBoneWall(skill) || boneWallRank(unit) === 0 ||
    boneWallPool(unit, state.simClockMs) !== undefined || !Number.isFinite(unit.mana) ||
    BONE_WALL_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const command = isBattleCommandId(skillOrderId) || isBattleCommandId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'party-skill-ranks');
  if (command && (!matchesBattleCommand(skill) || battleCommandRank(unit) === 0 ||
    !Number.isFinite(unit.mana) || battleCommandBonus(unit, state.simClockMs, state.battleCommands) > 0 ||
    BATTLE_COMMAND_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const buffEffect = skill.effects.find(effect => effect.kind === 'buff' && effect.sorceressBuff !== undefined);
  const personalBuff = sorceressBuffId(skillOrderId) ?? sorceressBuffId(skill.id) ??
    (buffEffect?.kind === 'buff' ? buffEffect.sorceressBuff : undefined);
  if (personalBuff && (!matchesSorceressBuff(skill, personalBuff) || sorceressBuffRank(unit, personalBuff) === 0 ||
    !Number.isFinite(unit.mana) || activeSorceressBuff(unit, personalBuff, state.simClockMs) !== undefined ||
    [skill.id, skillOrderId, 'sorceress.' + personalBuff, 'skills-sorceress-' + personalBuff].some(id => (unit.cooldowns[id] ?? 0) > 0) ||
    (personalBuff === 'enchant' && !canCaptureEnchantAttack(unit.stats.attack, sorceressBuffRank(unit, personalBuff))))) return false;
  const periodicEffect = skill.effects.find(effect => effect.kind === 'periodic-spell');
  const periodic = periodicSpellId(skillOrderId) ?? periodicSpellId(skill.id) ??
    (periodicEffect?.kind === 'periodic-spell' ? periodicEffect.spell : undefined);
  if (periodic && (!matchesPeriodicSpell(skill, periodic) || periodicSpellRank(unit, periodic) === 0 ||
    !Number.isFinite(unit.mana) || paidPeriodicSpell(unit, periodic, state.simClockMs) !== undefined ||
    [skill.id, skillOrderId].some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if (inferKind(unit) === 'monster' && unit.mana === 0 &&
    unit.statuses.some(status => status.id === 'mana-burn' && statusActiveAt(status, state.simClockMs))) return false;
  const conversion = CONVERSION_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'damage' && effect.conversion === true);
  if (conversion && (!matchesConversion(skill) || conversionRank(unit) === 0 ||
    !Number.isFinite(unit.mana) || CONVERSION_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const holy = HOLY_SHIELD_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.holyShield === true);
  if (holy && (!matchesHolyShield(skill) || holyShieldRank(unit) === 0 ||
    activeHolyShield(unit) > 0 || !Number.isFinite(unit.mana) ||
    HOLY_SHIELD_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const cyclone = CYCLONE_ARMOR_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.cycloneArmor === true);
  if (cyclone && (!matchesCycloneArmor(skill) || cycloneArmorRank(unit) === 0 ||
    activeCycloneArmor(unit) > 0 || !Number.isFinite(unit.mana) ||
    CYCLONE_ARMOR_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const formEffect = skill.effects.find((effect): effect is BuffEffect => effect.kind === 'buff' && effect.druidForm !== undefined);
  const form = druidFormForId(skillOrderId) ?? druidFormForId(skill.id) ?? formEffect?.druidForm;
  if (form && (!matchesDruidForm(skill, form) || druidFormRank(unit, form) === 0 ||
    selectedDruidForm(unit) !== form || activeDruidForm(unit)?.form === form || !Number.isFinite(unit.mana) ||
    DRUID_SHAPE_IDS[form].some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const burst = BURST_OF_SPEED_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.timedStatBuff === 'burst-of-speed');
  const cloak = CLOAK_OF_SHADOWS_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.timedStatBuff === 'cloak-of-shadows');
  const concentrate = CONCENTRATE_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.timedStatBuff === 'concentrate');
  if (concentrate && (!matchesConcentrate(skill) || concentrateRank(unit) === 0 ||
    !Number.isFinite(unit.mana) || activeConcentrate(unit, state.simClockMs) !== undefined ||
    CONCENTRATE_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const leap = LEAP_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.timedStatBuff === 'leap');
  if (leap && (!matchesLeap(skill) || leapRank(unit) === 0 || !Number.isFinite(unit.mana) ||
    activeLeap(unit, state.simClockMs) !== undefined ||
    LEAP_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if (cloak && (!matchesCloakOfShadows(skill) || cloakOfShadowsRank(unit) === 0 || !Number.isFinite(unit.mana) ||
    activeCloakOfShadows(unit, state.simClockMs) !== undefined ||
    CLOAK_OF_SHADOWS_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  const ce = isCorpseExplosionId(skillOrderId) || isCorpseExplosionId(skill.id);
  const pe = isPoisonExplosionId(skillOrderId) || isPoisonExplosionId(skill.id);
  const fp = isFindPotionId(skillOrderId) || isFindPotionId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-recovery');
  const fi = isFindItemId(skillOrderId) || isFindItemId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-search');
  const gw = isGrimWardId(skillOrderId) || isGrimWardId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-ward');
  const skillLevel = effectiveSkillLevel(state, unit, skill);
  if (gw && (!matchesGrimWard(skill) || skillLevel === 0 || state.corpses.length === 0 || !hasEnemyTarget ||
    !Number.isFinite(unit.mana) || state.grimWards.has(unit.id) ||
    GRIM_WARD_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if (fi && (!matchesFindItem(skill) || skillLevel === 0 || state.corpses.length === 0 || !hasEnemyTarget ||
    !Number.isFinite(unit.mana) || FIND_ITEM_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if (fp && (!matchesFindPotion(skill) || skillLevel === 0 || state.corpses.length === 0 || !hasEnemyTarget ||
    FIND_POTION_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0) || !findPotionRecovery(unit, skillLevel, paidRankBonus(state, unit)))) return false;
  if (burst && (!matchesBurstOfSpeed(skill) || burstOfSpeedRank(unit) === 0 || !Number.isFinite(unit.mana) ||
    activeBurstOfSpeed(unit, state.simClockMs) !== undefined ||
    BURST_OF_SPEED_IDS.some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if ((isStaticFieldId(skillOrderId) || isStaticFieldId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'static-field')) &&
    (!matchesStaticField(skill) || skillLevel === 0 || !Number.isFinite(unit.mana))) return false;
  if (ce && (!matchesCorpseExplosion(skill) ||
    ['necromancer.corpse_explosion', 'skills-necromancer-corpse-explosion'].some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if (pe && (!matchesPoisonExplosion(skill) ||
    ['necromancer.poison_explosion', 'skills-necromancer-poison-explosion'].some(id => (unit.cooldowns[id] ?? 0) > 0))) return false;
  if ((ce || pe) && (skillLevel === 0 || state.corpses.length === 0 || !hasEnemyTarget || !Number.isFinite(unit.mana))) return false;
  if (skill.trigger === 'passive') return false;
  if (governedActiveId(skill.id) && skillLevel === 0) return false;
  if ((unit.cooldowns[skill.id] ?? unit.cooldowns[skillOrderId] ?? 0) > 0) return false;
  if (skill.id === 'sorceress.frozen_armor' && skillLevel === 0) return false;
  const armor = coldArmorId(skill.id);
  if (armor && (skillLevel === 0 || !matchesColdArmor(skill, armor) || paidColdArmorRank(unit, armor) > 0)) return false;
  if (effectiveManaCost(skill, skillLevel) > unit.mana) return false;
  if (unit.level < skill.minLevel) return false;
  if (isPaidFrozenArmorSkill(skill)) {
    if (hasPaidFrozenArmor(unit)) return false;
  } else if (!armor && !burst && !cloak && !leap && !concentrate && !form && !personalBuff && !wall &&
    skill.isBuff &&
    (unit.activeBuffIds.includes(skill.id) || activeBuffIdsForSkill(skill).some((id) => unit.activeBuffIds.includes(id)))
  ) return false;
  if (skill.requires && unit.equippedWeapon !== undefined) {
    const elig = canCastSkill(skill, unit.equippedWeapon);
    if (!elig.ok) return false;
  }
  if (
    (skill.target === 'single-enemy' ||
      skill.target === 'all-enemies' ||
      skill.target === 'area-enemies') &&
    !hasEnemyTarget
  ) {
    return false;
  }
  return hasAvailableEffect(state, unit.id, skill, skillLevel);
}

function chooseSkillForState(
  state: State,
  unit: CombatUnit,
  hasEnemyTarget: boolean
): { readonly skill: RegisteredSkill; readonly orderId: string } | undefined {
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill || ((isCorpseExplosionId(skillId) || isCorpseExplosionId(skill.id)) && !matchesCorpseExplosion(skill)) ||
      ((isPoisonExplosionId(skillId) || isPoisonExplosionId(skill.id)) && !matchesPoisonExplosion(skill)) ||
      isPreparationSummonSkill(skill) || isIronGolemSkill(skill) || isHydraSkill(skill, skillId) || isDecoySkill(skill, skillId)) continue;
    if (!canUseSkillForState(state, unit, skill, skillId, hasEnemyTarget)) continue;
    return { skill, orderId: skillId };
  }
  return undefined;
}

function applyEffect(
  state: State,
  actorId: string,
  skill: RegisteredSkill,
  effect: SkillEffect,
  skillLevel: number,
  enemySideAlive: readonly CombatUnit[]
): void {
  const acting = state.units.get(actorId);
  if (!acting || !alive(acting)) return;
  switch (effect.kind) {
    case 'party-skill-ranks': {
      if (!matchesBattleCommand(skill) || battleCommandRank(acting) === 0) break;
      const duration = battleCommandDuration(skillLevel), grant = Object.freeze({ sourceId: actorId,
        appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + duration });
      for (const recipient of state.units.values()) {
        if (recipient.side !== 'player' || effectiveSide(state, recipient) !== 'player' ||
          !Number.isFinite(recipient.life) || recipient.life <= 0 ||
          battleCommandBonus(recipient, state.simClockMs, state.battleCommands) > 0) continue;
        state.battleCommands.set(recipient.id, grant);
        state.units.set(recipient.id, { ...recipient, statuses: [...recipient.statuses,
          { id: 'battle-command', sourceId: actorId, stacks: 1, remaining: duration / SECONDS,
            appliedAtMs: grant.appliedAtMs, expiresAtMs: grant.expiresAtMs }] });
        emit(state, { kind: 'buff', target: recipient.id, buffId: 'battle-command', statusBacked: true });
        observeStatuses(state, recipient.id);
      }
      reconcileBattleCommandPassives(state);
      break;
    }
    case 'corpse-ward':
      // Private paid ward state is created only by the validated synchronous corpse cast.
      break;
    case 'corpse-search':
      // Only the validated synchronous cast may consume a body or attest a successful search.
      break;
    case 'corpse-recovery':
      // Synchronous finite-body recovery is committed once by castSkill, never as a generic effect.
      break;
    case 'hydra':
      // Hydra is committed only by its validated, paid battle-start preparation.
      break;
    case 'periodic-spell': {
      if (!matchesPeriodicSpell(skill, effect.spell) || periodicSpellRank(acting, effect.spell) === 0) break;
      state.units.set(actorId, payPeriodicSpell(acting, effect.spell, skillLevel, state.simClockMs));
      emit(state, { kind: 'buff', target: actorId, buffId: effect.spell, statusBacked: true });
      observeStatuses(state, actorId);
      pulsePaidSpell(state, actorId, effect.spell);
      break;
    }
    case 'static-field': {
      if (!matchesStaticField(skill) || staticFieldRank(acting) === 0) break;
      for (const candidate of enemySideAlive) {
        const target = state.units.get(candidate.id);
        if (!target) continue;
        const amount = staticFieldDamage(target, state.difficulty);
        if (amount <= 0) continue;
        const absorption = splitPersonalDamage(target, amount, state.simClockMs);
        const manaEvent = commitPersonalDamage(state, target, { ...absorption.unit, life: target.life - absorption.damage });
        emit(state, { kind: 'damage', source: actorId, target: target.id,
          damageType: 'lightning', amount: absorption.damage,
          ...(absorption.absorbed > 0 ? { absorbed: absorption.absorbed } : {}),
          ...(absorption.cycloneAbsorbed > 0 ? { cycloneAbsorbed: absorption.cycloneAbsorbed } : {}),
          ...(absorption.holyShieldAbsorbed > 0 ? { holyShieldAbsorbed: absorption.holyShieldAbsorbed } : {}),
          ...(absorption.wallAbsorbed > 0 ? { wallAbsorbed: absorption.wallAbsorbed } : {}),
          crit: false, dodged: false });
        if (manaEvent) emit(state, manaEvent);
        if (absorption.absorbed > 0) observeStatuses(state, target.id);
        recoverBloodGolem(state, actorId, Math.min(target.life, absorption.damage),
          effectiveSide(state, acting) !== effectiveSide(state, target));
      }
      break;
    }
    case 'damage': {
      if (effect.hitSequence !== undefined) {
        const strikes = effect.hitSequence.strikes;
        if (!Number.isInteger(strikes) || strikes < 2 || strikes > 8) {
          throw new Error('Invalid damage hit sequence: expected 2–8 attempts');
        }
        if (effect.hitSequence.targetMode === 'each-original') {
          for (let pass = 0; pass < strikes; pass++) {
            for (const original of enemySideAlive) {
              const actor = state.units.get(actorId);
              if (!actor || !alive(actor)) return;
              const target = state.units.get(original.id);
              if (target && alive(target)) applyDamageToUnit(state, actorId, target.id, effect, skillLevel);
            }
          }
          break;
        }
        let cursor = 0;
        for (let strike = 0; strike < strikes; strike++) {
          const actor = state.units.get(actorId);
          if (!actor || !alive(actor)) break;
          let target: CombatUnit | undefined;
          for (const offset of enemySideAlive.keys()) {
            const index = (cursor + offset) % enemySideAlive.length;
            const candidate = enemySideAlive[index];
            const current = candidate && state.units.get(candidate.id);
            if (current && alive(current)) {
              target = current;
              cursor = (index + 1) % enemySideAlive.length;
              break;
            }
          }
          if (!target) break;
          applyDamageToUnit(state, actorId, target.id, effect, skillLevel);
        }
        break;
      }
      for (const t of enemySideAlive) {
        if (effect.projectileFlightMs !== undefined) {
          state.projectiles.launch(actorId, effect.projectileFlightMs,
            { attackerId: actorId, defenderId: t.id, effect, skillLevel });
        } else applyDamageToUnit(state, actorId, t.id, effect, skillLevel);
      }
      break;
    }
    case 'buff': {
      const actor = state.units.get(actorId);
      if (!actor) return;
      if (effect.boneWall === true && matchesBoneWall(skill)) {
        state.units.set(actorId, payBoneWall(actor, skillLevel, state.simClockMs, paidRankBonus(state, actor)));
        emit(state, { kind: 'buff', target: actorId, buffId: 'bone-wall', statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (effect.sorceressBuff && matchesSorceressBuff(skill, effect.sorceressBuff)) {
        const id = effect.sorceressBuff, d = SORCERESS_BUFF_DEFINITIONS[id];
        if (sorceressBuffRank(actor, id) === 0 || activeSorceressBuff(actor, id, state.simClockMs)) return;
        const markers = [id, 'sorceress.' + id, 'skills-sorceress-' + id];
        state.units.set(actorId, { ...actor, activeBuffIds: actor.activeBuffIds.filter(id => !markers.includes(id)),
          statuses: [...actor.statuses.filter(status => !markers.includes(status.id)), {
            id, sourceId: actorId, stacks: 1, remaining: d.durationMs / 1000,
            appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + d.durationMs,
            sorceressBuff: paySorceressBuff(id, skillLevel, actor.stats.attack)
          }] });
        emit(state, { kind: 'buff', target: actorId, buffId: id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (matchesHolyShield(skill) && effect.holyShield === true) {
        state.units.set(actorId, payHolyShield(actor));
        const dealt = state.periodic.get(actorId)?.dealt ?? 0;
        state.holyShieldPeriodicBaseline.set(actorId, dealt - cycloneArmorQuota(actor,
          Math.max(0, dealt - (state.cyclonePeriodicBaseline.get(actorId) ?? 0))));
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id });
        break;
      }
      if (matchesCycloneArmor(skill) && effect.cycloneArmor === true) {
        state.units.set(actorId, payCycloneArmor(actor));
        state.cyclonePeriodicBaseline.set(actorId, state.periodic.get(actorId)?.dealt ?? 0);
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id });
        break;
      }
      if (effect.druidForm !== undefined && matchesDruidForm(skill, effect.druidForm)) {
        state.units.set(actorId, refreshDruidFormState(actor, effect.druidForm));
        reconcileLifeCapacities(state, [actorId]);
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (matchesBurstOfSpeed(skill) && effect.timedStatBuff === 'burst-of-speed') {
        if (burstOfSpeedRank(actor) === 0 || activeBurstOfSpeed(actor, state.simClockMs)) return;
        const exactMarkers: readonly string[] = [...BURST_OF_SPEED_IDS, 'burst-of-speed'];
        state.units.set(actorId, { ...actor,
          activeBuffIds: actor.activeBuffIds.filter(id => !exactMarkers.includes(id)),
          statuses: [...actor.statuses.filter(status => !exactMarkers.includes(status.id)), {
            id: 'burst-of-speed', sourceId: actorId, stacks: 1,
            remaining: BURST_OF_SPEED_DEFINITION.durationMs / 1000,
            appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + BURST_OF_SPEED_DEFINITION.durationMs,
            statBuff: paidBurstOfSpeed(skillLevel)
          }] });
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (matchesCloakOfShadows(skill) && effect.timedStatBuff === 'cloak-of-shadows') {
        if (cloakOfShadowsRank(actor) === 0 || activeCloakOfShadows(actor, state.simClockMs)) return;
        const markers: readonly string[] = [...CLOAK_OF_SHADOWS_IDS, 'cloak-of-shadows'];
        const duration = CLOAK_OF_SHADOWS_DEFINITION.durationMs;
        state.units.set(actorId, { ...actor,
          activeBuffIds: actor.activeBuffIds.filter(id => !markers.includes(id)),
          statuses: [...actor.statuses.filter(status => !markers.includes(status.id)), {
            id: 'cloak-of-shadows', sourceId: actorId, stacks: 1, remaining: duration / 1000,
            appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + duration,
            cloakOfShadows: paidCloakOfShadows(skillLevel)
          }] });
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (matchesConcentrate(skill) && effect.timedStatBuff === 'concentrate') {
        if (concentrateRank(actor) === 0 || activeConcentrate(actor, state.simClockMs)) return;
        const markers: readonly string[] = [...CONCENTRATE_IDS, 'concentrate'];
        const duration = CONCENTRATE_DEFINITION.durationMs;
        state.units.set(actorId, { ...actor,
          activeBuffIds: actor.activeBuffIds.filter(id => !markers.includes(id)),
          statuses: [...actor.statuses.filter(status => !markers.includes(status.id)), {
            id: 'concentrate', sourceId: actorId, stacks: 1, remaining: duration / 1000,
            appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + duration,
            concentrate: paidConcentrate(skillLevel, paidRankBonus(state, actor))
          }] });
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      if (matchesLeap(skill) && effect.timedStatBuff === 'leap') {
        if (leapRank(actor) === 0 || activeLeap(actor, state.simClockMs)) return;
        const markers: readonly string[] = [...LEAP_IDS, 'leap'], duration = LEAP_DEFINITION.durationMs;
        state.units.set(actorId, { ...actor,
          activeBuffIds: actor.activeBuffIds.filter(id => !markers.includes(id)),
          statuses: [...actor.statuses.filter(status => !markers.includes(status.id)), {
            id: 'leap', sourceId: actorId, stacks: 1, remaining: duration / 1000,
            appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + duration,
            leap: paidLeap(skillLevel, paidRankBonus(state, actor))
          }] });
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id, statusBacked: true });
        observeStatuses(state, actorId);
        break;
      }
      const coldArmor = coldArmorId(skill.id);
      if (coldArmor && matchesColdArmor(skill, coldArmor) && effect.coldArmor === coldArmor) {
        if (skillLevel === 0 || paidColdArmorRank(actor, coldArmor) > 0) return;
        state.units.set(actorId, payColdArmor(actor, coldArmor, skillLevel));
        emit(state, { kind: 'buff', target: actorId, buffId: coldArmor });
        break;
      }
      if (isPaidFrozenArmorSkill(skill) && effect.frozenArmor === true && effect.id === 'frozen-armor') {
        if (skillLevel === 0 || hasPaidFrozenArmor(actor)) return;
        const exactMarkers = ['frozen-armor', 'skills-sorceress-frozen-armor', 'sorceress.frozen_armor'];
        state.units.set(actorId, {
          ...actor,
          frozenArmor: Object.freeze({ rank: skillLevel,
            defensePct: skillLevel * FROZEN_ARMOR_DEFINITION.defensePctPerRank }),
          activeBuffIds: [...actor.activeBuffIds.filter(id => !exactMarkers.includes(id)), effect.id]
        });
        emit(state, { kind: 'buff', target: actorId, buffId: effect.id });
        break;
      }
      if (actor.activeBuffIds.includes(effect.id)) return;
      state.units.set(actorId, {
        ...actor,
        activeBuffIds: [...actor.activeBuffIds, effect.id]
      });
      emit(state, { kind: 'buff', target: actorId, buffId: effect.id });
      break;
    }
    case 'debuff': {
      if (effect.slowMissiles === true) {
        if (!matchesSlowMissiles(skill) || slowMissilesRank(acting) === 0) break;
        const d = SLOW_MISSILES_DEFINITION, expiresAtMs = state.simClockMs + d.durationMs;
        for (const target of enemySideAlive) {
          state.slowMissiles.set(target.id, { expiresAtMs, projectileSpeedPct: d.projectileSpeedPct });
          state.units.set(target.id, { ...target, statuses: [
            ...target.statuses.filter(status => status.id !== 'slow-missiles'),
            { id: 'slow-missiles', sourceId: actorId, stacks: 1, remaining: d.durationMs / SECONDS,
              appliedAtMs: state.simClockMs, expiresAtMs }
          ] });
          emit(state, { kind: 'status', target: target.id, statusId: 'slow-missiles' });
          observeStatuses(state, target.id);
        }
        break;
      }
      for (const t of enemySideAlive) {
        const application = applyStatusWithResult(
          t,
          {
            id: effect.statusId,
            ...(effect.targetCurse === effect.statusId ? { targetCurse: effect.targetCurse } : {}),
            ...(effect.dimVision === true && effect.statusId === 'dim-vision' ? { dimVision: paidDimVision() } : {}),
            ...(effect.damageCurse === effect.statusId
              ? { damageCurse: paidDamageCurse(effect.damageCurse) } : {}),
            ...(effect.weaken === true && effect.statusId === 'weaken' ? { weaken: paidWeaken() } : {}),
            ...(effect.innerSight === true && effect.statusId === 'inner-sight' ? { innerSight: paidAmazonInnerSight() } : {}),
            ...(effect.terror === true && effect.statusId === 'terror' ? { terror: true as const } : {}),
            ...(effect.bonePrison === true && effect.statusId === 'bone-prison' ? { bonePrison: true as const } : {}),
            ...(effect.decrepify === true && effect.statusId === 'decrepify' ? { decrepify: paidDecrepify() } : {}),
            ...(effect.battleCry === true && effect.statusId === 'battle-cry'
              ? { battleCry: paidBattleCry(skillLevel, paidRankBonus(state, acting)) } : {}),
            ...cleansingDurationInput(state, t.id),
            sourceId: actorId,
            simClockMs: state.simClockMs,
            ...(effect.duration !== undefined ? { duration: effect.duration } : {}),
            ...(effect.durationMs !== undefined ? { durationMs: effect.durationMs } : {}),
            ...(effect.physicalResistReductionPct !== undefined
              ? { physicalResistReductionPct: effect.physicalResistReductionPct } : {})
          },
          state.rng
        );
        state.units.set(t.id, application.unit);
        if (application.applied) emit(state, { kind: 'status', target: t.id, statusId: effect.statusId });
        observeStatuses(state, t.id);
      }
      break;
    }
    case 'summon': {
      const owner = state.units.get(actorId);
      if (!owner) return;
      const existing = summonsOf(state, actorId, effect.summonId).length;
      const cap = resolveSummonMaxCount(effect, skillLevel);
      if (existing >= cap) return;
      for (let i = 0; i < Math.min(effect.count ?? 1, cap - existing); i++) {
        const template = buildSummon(owner, effect.summonId, {
          skillLevel, statScaling: effect.statScaling, monsterDef: effect.monsterDef, rng: state.rng
        });
        if (!template) return;
        const empowered = empowerNecromancerSummon(owner, template, state.skeletonMastery, state.golemMastery, state.summonPassives);
        if (empowered) registerSpawnedSummon(state, owner, effect.summonId, {
          ...empowered, ...(effect.refundOnDeath !== undefined ? { summonRefundOnDeath: effect.refundOnDeath } : {})
        });
      }
      break;
    }
    case 'heal': {
      const heal: HealEffect = effect;
      const targets = healingTargets(state, actorId, heal);
      if (targets.length === 0) break;
      // One lazy inclusive roll per effect, shared by every eligible recipient.
      const rolledAmount = heal.amount ?? (heal.amountRange
        ? state.rng.nextInt(heal.amountRange[0], heal.amountRange[1]) : undefined);
      for (const t of targets) {
        const amount = rolledAmount ?? Math.floor(t.stats.lifeMax * (heal.pctOfMaxLife ?? 0));
        commitHealing(state, t, amount);
      }
      break;
    }
  }
}

/** Registration is the commit boundary; candidate building never allocates battle identity. */
function registerSpawnedSummon(state: State, owner: CombatUnit, templateId: string, template: CombatUnit, passiveSpirit = false): CombatUnit {
  const summon = { ...template, id: nextSummonId(state, owner.id, templateId) };
  const preferredPosition = firstOpenSummonPosition(owner, aliveOf(state, owner.side));
  const summonWithPreferredPosition = preferredPosition
    ? { ...summon, gridPosition: preferredPosition }
    : summon;
  const positionedSummon = withDefaultGridPositions([
    ...aliveOf(state, owner.side),
    summonWithPreferredPosition
  ]).find((u) => u.id === summon.id) ?? summonWithPreferredPosition;
  if (passiveSpirit) state.barbsSpiritId = positionedSummon.id;
  registerUnit(state, positionedSummon);
  scheduleNextAction(state, positionedSummon);
  state.cooldownExpiresAt.set(positionedSummon.id, new Map());
  reconcileLifeCapacities(state);
  const committed = state.units.get(positionedSummon.id) ?? positionedSummon;
  emit(state, { kind: 'summon', owner: owner.id, summonId: templateId, unit: committed });
  observeStatuses(state, positionedSummon.id);
  return committed;
}

function castSkill(
  state: State, actorId: string, skill: RegisteredSkill,
  prepared?: { readonly summonId: string; readonly units: readonly CombatUnit[]; readonly skillLevel?: number },
  skillOrderId = skill.id
): readonly CombatUnit[] | undefined {
  const actor = state.units.get(actorId);
  if (!actor) return;

  const ce = isCorpseExplosionId(skillOrderId) || isCorpseExplosionId(skill.id);
  const pe = isPoisonExplosionId(skillOrderId) || isPoisonExplosionId(skill.id);
  const fp = isFindPotionId(skillOrderId) || isFindPotionId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-recovery');
  const fi = isFindItemId(skillOrderId) || isFindItemId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-search');
  const gw = isGrimWardId(skillOrderId) || isGrimWardId(skill.id) ||
    skill.effects.some(effect => effect.kind === 'corpse-ward');
  const consumesCorpse = ce || pe || fp || fi || gw;
  if (consumesCorpse && !canUseSkillForState(state, actor, skill, skillOrderId,
    opponentsOf(state, actor).length > 0)) return;
  const skillLevel = prepared?.skillLevel ?? effectiveSkillLevel(state, actor, skill);
  const rankBonus = paidRankBonus(state, actor);
  const recovery = fp ? findPotionRecovery(actor, skillLevel, rankBonus) : undefined;
  // Synchronous commit: reserve exactly one oldest body before ordinary payment/effects.
  const corpseId = consumesCorpse ? state.corpses.shift() : undefined;
  const manaCost = effectiveManaCost(skill, skillLevel);
  const newMana = Math.max(0, actor.mana - manaCost);
  const manaEvent = commitMana(state, actor, { ...actor, mana: newMana }, 'cast');

  // Time-based cooldown.
  const cooldown = effectiveCooldown(skill, skillLevel);
  if (cooldown > 0) {
    let cdMap = state.cooldownExpiresAt.get(actorId);
    if (!cdMap) {
      cdMap = new Map();
      state.cooldownExpiresAt.set(actorId, cdMap);
    }
    cdMap.set(skill.id, state.simClockMs + cooldown * SECONDS);
  }

  emit(state, { kind: 'action', actor: actorId, skillId: skill.id });
  if (manaEvent) emit(state, manaEvent);
  if (consumesCorpse && !fi && !gw) emit(state, { kind: 'message', messageKey: fp ? 'combat:corpses.consumedFindPotion'
    : pe ? 'combat:corpses.consumedPoison' : 'combat:corpses.consumed',
    params: { count: state.corpses.length, ...(fp && corpseId !== undefined ? { corpseId } : {}) } });
  if (gw && corpseId !== undefined) {
    const duration = grimWardDuration(skillLevel, rankBonus), paid = state.units.get(actorId);
    state.grimWards.set(actorId, Object.freeze({ corpseId, rank: skillLevel, createdAtMs: state.simClockMs,
      expiresAtMs: state.simClockMs + duration, nextPulseAtMs: state.simClockMs }));
    if (paid) state.units.set(actorId, { ...paid, statuses: [...paid.statuses, {
      id: 'grim-ward', sourceId: actorId, stacks: 1, remaining: duration / SECONDS,
      appliedAtMs: state.simClockMs, expiresAtMs: state.simClockMs + duration }] });
    emit(state, { kind: 'message', messageKey: 'combat:corpses.consumedGrimWard',
      params: { count: state.corpses.length, corpseId, duration: duration / SECONDS } });
    observeStatuses(state, actorId);
    settleGrimWards(state);
    return;
  }
  if (fi && corpseId !== undefined) {
    const found = rollFindItemSearch(skillLevel, state.rng, rankBonus);
    if (found) state.findItemFinds.push(Object.freeze({ sourceHeroId: actorId, corpseId, rank: skillLevel,
      ...(rankBonus ? { rankBonus } : {}) }));
    emit(state, { kind: 'message', messageKey: found ? 'combat:corpses.findItemSuccess' : 'combat:corpses.findItemEmpty',
      params: { count: state.corpses.length, corpseId } });
    return;
  }
  if (recovery) {
    const paid = state.units.get(actorId);
    if (!paid) return;
    commitHealing(state, paid, recovery.life);
    const healed = state.units.get(actorId);
    if (healed && recovery.mana > 0) {
      const event = commitMana(state, healed, { ...healed, mana: healed.mana + recovery.mana }, 'find-potion');
      if (event) emit(state, event);
    }
    return;
  }
  if (prepared) {
    return prepared.units.map(candidate => registerSpawnedSummon(state, actor, prepared.summonId, candidate));
  }

  const enemiesAliveRaw = attackCandidates(state, actor);
  const enemies = targetPriority(state, enemiesAliveRaw);

  let targetEnemies: CombatUnit[] = enemies;
  if (skill.target === 'single-enemy' && enemiesAliveRaw.length > 0) {
    const picked = pickDefender(state, actor, enemiesAliveRaw);
    if (picked) targetEnemies = [picked];
  } else if (skill.target === 'area-enemies') {
    targetEnemies = resolveAoeTargets(enemies, skill.aoeShape, skill.maxTargets);
  }

  for (const effect of state.plague.prepare(skill.effects, targetEnemies, state.simClockMs)) {
    applyEffect(state, actorId, skill, effect, skillLevel, targetEnemies);
  }
  return undefined;
}

function basicAttack(state: State, actorId: string): void {
  const actor = state.units.get(actorId);
  if (!actor) return;
  const enemiesAlive = attackCandidates(state, actor);
  const target = pickDefender(state, actor, enemiesAlive);
  if (!target) return;

  emit(state, { kind: 'action', actor: actorId, skillId: null });
  const attackPct = (activeMightAura(state.mightAura, actorId, state.units)?.attackPct ?? 0) +
    (activeStatAura(state.statAura, actorId, state.units)?.bonuses.attackPct ?? 0) +
    (activeDruidAllyAuras(state.druidAllyAuras, actor, state.units)?.heartRank ?? 0) * DRUID_ALLY_AURA_DEFINITIONS.heart.attackPerRank;
  const ordinaryRange = actor.attackRange ?? [actor.stats.attack, actor.stats.attack];
  const fireGolem = activeFireGolem(state, actorId);
  const mageElement = state.skeletalMageElements.get(actorId);
  const damageType = actor.basicAttack?.damageType ?? mageElement ??
    (fireGolem ? FIRE_GOLEM_DEFINITION.attack.damageType : 'physical');
  const druid = damageType === 'physical' ? activeDruidSummon(state, actorId) : undefined;
  const projectAttack = (value: number): number => Math.max(1, Math.floor(value * (1 + attackPct)));
  const effect: DamageEffect = {
    kind: 'damage',
    damageType,
    base: actor.basicAttack?.damage ?? [projectAttack(ordinaryRange[0]), projectAttack(ordinaryRange[1])],
    ...(mageElement && actor.basicAttack === undefined ? { applyStatus: SKELETAL_MAGE_SIGNATURES[mageElement] }
      : fireGolem ? { applyStatus: { id: 'burn', damageType: 'fire' as const,
      dotPctOfDamage: FIRE_GOLEM_DEFINITION.attack.dotPctOfDamage } }
      : druid?.template === 'raven' ? { applyStatus: { id: 'blind' } }
      : druid?.template === 'poison_creeper' ? { applyStatus: { id: 'poison', damageType: 'poison' as const,
        dotPctOfDamage: DRUID_SUMMON_DEFINITION.poison.dotPctOfDamage } } : {})
  };
  applyDamageToUnit(state, actorId, target.id, effect, 1, true);
}

/** Revalidate paid runtime identity and its original living native owner at each ordinary hit. */
function activeFireGolem(state: State, bodyId: string): boolean {
  const binding = state.fireGolems.get(bodyId);
  if (!binding) return false;
  const body = state.units.get(bodyId), owner = state.units.get(binding.ownerId),
    skill = getSkill('necromancer.fire_golem');
  return body !== undefined && owner !== undefined && skill !== undefined &&
    body.id !== owner.id && body.side === 'player' && inferKind(body) === 'summon' &&
    body.summon === true && body.summonTemplateId === 'fire_golem' &&
    body.summonOwnerId === owner.id && (body.ownerId === undefined || body.ownerId === owner.id) &&
    body.basicAttack === undefined && Number.isFinite(body.life) && body.life > 0 &&
    qualifyFireGolem(owner, skill, binding.rank);
}

/** One scheduled body action, with an ordinary independently rolled hit for each living head. */
function attackWithHydra(state: State, body: CombatUnit): void {
  const bound = state.hydras.get(body.id), owner = bound && state.units.get(bound.ownerId);
  if (!bound || !owner || !alive(owner) || state.simClockMs >= bound.expiresAtMs) return;
  emit(state, { kind: 'action', actor: body.id, skillId: null });
  for (let head = 0; head < HYDRA_DEFINITION.heads; head++) {
    const current = state.units.get(body.id);
    if (!current || !alive(current)) break;
    const target = pickDefender(state, current, attackCandidates(state, current));
    if (!target) break;
    applyDamageToUnit(state, body.id, target.id, HYDRA_DEFINITION.bolt, bound.rank, true);
  }
}

/** Revalidate the original living owner and exact registered body on each use. */
function activeDruidSummon(state: State, bodyId: string) {
  const binding = state.druidSummons.get(bodyId);
  if (!binding) return undefined;
  const body = state.units.get(bodyId), owner = state.units.get(binding.ownerId), skill = getSkill(binding.skillId);
  if (!body || !owner || !skill || !isDruidSummonBody(body, owner.id, binding.template) ||
    qualifyDruidSummon(owner, skill, binding.rank) !== binding.template) return undefined;
  return { ...binding, body, owner };
}

/** Stage useful owner recovery before taking one shared FIFO token; a recovery uses this one action. */
function recoverDruidVine(state: State, bodyId: string): boolean {
  if (state.corpses.length === 0) return false;
  const bound = activeDruidSummon(state, bodyId);
  if (!bound || (bound.template !== 'carrion_vine' && bound.template !== 'solar_creeper')) return false;
  const life = bound.template === 'carrion_vine', owner = bound.owner;
  const maximum = life ? owner.stats.lifeMax : owner.stats.manaMax,
    current = life ? owner.life : owner.mana,
    fraction = life ? DRUID_SUMMON_DEFINITION.vines.lifeFraction : DRUID_SUMMON_DEFINITION.vines.manaFraction;
  if (!Number.isFinite(maximum) || maximum <= 0 || !Number.isFinite(current) || current < 0) return false;
  const amount = Math.min(maximum - current, Math.floor(maximum * fraction));
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const corpseId = state.corpses.shift();
  if (corpseId === undefined) return false;
  emit(state, { kind: 'action', actor: bodyId, skillId: null, corpseRecovery: true });
  emit(state, { kind: 'message', messageKey: life ? 'combat:corpses.consumedCarrion' : 'combat:corpses.consumedSolar',
    params: { count: state.corpses.length, corpseId } });
  if (life) commitHealing(state, owner, amount);
  else {
    const event = commitMana(state, owner, { ...owner, mana: current + amount }, 'solar-creeper');
    if (event) emit(state, event);
  }
  return true;
}

/** Integrate exactly the overlap; compensated HP-ms avoids repeated fractional-HP loss. */
function integratePeriodic(
  unit: CombatUnit,
  from: number,
  to: number,
  previous: PeriodicIntegral = { total: 0, compensation: 0, dealt: 0 }
): PeriodicIntegral {
  let { total, compensation } = previous;
  for (const status of unit.statuses) {
    const elapsed = Math.max(0, Math.min(to, status.expiresAtMs ?? Infinity) -
      Math.max(from, status.appliedAtMs ?? 0));
    const rate = (status.dotPerStack ?? 0) * status.stacks;
    if (elapsed <= 0 || rate <= 0) continue;
    const adjusted = rate * elapsed - compensation;
    const next = total + adjusted;
    compensation = (next - total) - adjusted;
    total = next;
  }
  return { total, compensation, dealt: Math.floor(total / SECONDS), wallAbsorbed: previous.wallAbsorbed ?? 0 };
}

/** Attribute only actual lost HP; preserve the shared integral and pooled damage event exactly. */
function periodicRecoveryShares(state: State, unit: CombatUnit, from: number, to: number, hpRemoved: number) {
  const weights = new Map<string, number>();
  if (state.bloodGolems.size === 0 || !Number.isFinite(hpRemoved) || hpRemoved <= 0) return [];
  for (const status of unit.statuses) {
    const elapsed = Math.max(0, Math.min(to, status.expiresAtMs ?? Infinity) -
      Math.max(from, status.appliedAtMs ?? 0));
    const weight = elapsed * (status.dotPerStack ?? 0) * status.stacks;
    if (Number.isFinite(weight) && weight > 0) weights.set(status.sourceId, (weights.get(status.sourceId) ?? 0) + weight);
  }
  const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total <= 0) return [];
  const shares = [...weights].map(([sourceId, weight], index) => {
    const exact = hpRemoved * (weight / total), source = state.units.get(sourceId);
    return { sourceId, index, amount: Math.floor(exact), remainder: exact - Math.floor(exact),
      hostile: source !== undefined && effectiveSide(state, source) !== effectiveSide(state, unit) };
  });
  let remaining = hpRemoved - shares.reduce((sum, share) => sum + share.amount, 0);
  for (const share of [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    const extra = Math.min(1, Math.max(0, remaining));
    share.amount += extra; remaining -= extra;
  }
  return shares;
}

/** Every HP write precedes events/deaths; sources freeze the just-integrated interval. */
function settlePeriodic(state: State, to: number): void {
  const from = state.simClockMs;
  const damages: { unit: CombatUnit; amount: number; absorbed: number; cycloneAbsorbed: number; holyShieldAbsorbed: number; wallAbsorbed: number; manaEvent: ManaEvent | undefined }[] = [];
  const dead: CombatUnit[] = [];
  const recoveries: ReturnType<typeof periodicRecoveryShares> = [];
  for (const before of state.units.values()) {
    if (!alive(before)) continue;
    const previous = state.periodic.get(before.id);
    const next = integratePeriodic(before, from, to, previous);
    const amount = next.dealt - (previous?.dealt ?? 0);
    state.periodic.set(before.id, next);
    if (amount <= 0) continue;
    const absorption = splitPersonalDamage(before, amount, from, previous?.dealt ?? 0,
      state.cyclonePeriodicBaseline.get(before.id) ?? 0, state.holyShieldPeriodicBaseline.get(before.id) ?? 0,
      previous?.wallAbsorbed ?? 0);
    state.periodic.set(before.id, { ...next, wallAbsorbed: (previous?.wallAbsorbed ?? 0) + absorption.wallAbsorbed });
    const after = { ...absorption.unit, life: Math.max(0, before.life - absorption.damage) };
    recoveries.push(...periodicRecoveryShares(state, before, from, to, before.life - after.life));
    const manaEvent = commitPersonalDamage(state, before, after);
    damages.push({ unit: after, amount: absorption.damage, absorbed: absorption.absorbed,
      cycloneAbsorbed: absorption.cycloneAbsorbed, holyShieldAbsorbed: absorption.holyShieldAbsorbed,
      wallAbsorbed: absorption.wallAbsorbed, manaEvent });
    if (!alive(after)) dead.push(activeStatusView(after, from));
  }
  state.simClockMs = to;
  emitTurnBoundaries(state);
  for (const { unit, amount, absorbed, cycloneAbsorbed, holyShieldAbsorbed, wallAbsorbed, manaEvent } of damages) {
    emit(state, { kind: 'dot', target: unit.id, amount, ...(absorbed > 0 ? { absorbed } : {}),
      ...(cycloneAbsorbed > 0 ? { cycloneAbsorbed } : {}),
      ...(wallAbsorbed > 0 ? { wallAbsorbed } : {}),
      ...(holyShieldAbsorbed > 0 ? { holyShieldAbsorbed } : {}) });
    if (manaEvent) emit(state, manaEvent);
  }
  finishDeaths(state, dead);
  const expiredDecoys = [...state.decoys].flatMap(([id, binding]) => {
    const body = state.units.get(id);
    return body && alive(body) && binding.expiresAtMs <= to ? [body] : [];
  });
  if (expiredDecoys.length > 0) finishDeaths(state, expiredDecoys);
  const expiredHydras = [...state.hydras].flatMap(([id, binding]) => {
    const body = state.units.get(id);
    return body && alive(body) && binding.expiresAtMs <= to ? [body] : [];
  });
  if (expiredHydras.length > 0) finishDeaths(state, expiredHydras);
  for (const recovery of recoveries) recoverBloodGolem(state, recovery.sourceId, recovery.amount, recovery.hostile);
  for (const u of state.units.values()) {
    if (alive(u)) state.units.set(u.id, expireStatuses(u, to));
  }
  for (const u of state.units.values()) {
    if (alive(u)) observeStatuses(state, u.id);
  }
}

/** Capture earned interval eligibility before periodic deaths change the source. */
function captureMeditationRecipients(state: State): ReadonlyMap<string, MeditationAuraProjection> {
  const recipients = new Map<string, MeditationAuraProjection>();
  for (const unit of state.units.values()) {
    const aura = activeMeditationAura(state.meditationAura, unit.id, state.units);
    if (aura) recipients.set(unit.id, aura);
  }
  return recipients;
}

/** Periodic deaths and cap side effects settle before living units recover. */
function settleManaRecovery(state: State, fromMs: number, toMs: number,
  intervalAuras: ReadonlyMap<string, MeditationAuraProjection>): void {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) return;
  for (const unit of state.units.values()) {
    const rate = unit.manaRegenPerSecond ?? 0;
    if (!alive(unit) || !Number.isFinite(unit.stats.manaMax) || unit.stats.manaMax <= 0) continue;
    const aura = intervalAuras.get(unit.id);
    // Recheck only the recipient: a source that died at this endpoint still earned the interval.
    const contribution = aura && Number.isFinite(unit.life) && unit.side === 'player' &&
      unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
      ((unit.id === aura.sourceHeroId && inferKind(unit) === 'hero') ||
        (unit.id === aura.fieldedMercCombatId && inferKind(unit) === 'merc')) &&
      aura.sourceBaselinePerSecond > 0 && aura.manaRegenPctPerRank > 0
      ? { sourceBaselinePerSecond: aura.sourceBaselinePerSecond,
        factors: [aura.manaRegenPctPerRank, aura.rank] as const } : undefined;
    if ((!Number.isFinite(rate) || rate <= 0) && !contribution) continue;
    if (unit.mana >= unit.stats.manaMax) {
      commitMana(state, unit, unit, 'regeneration');
      continue;
    }
    const previous = state.manaRecovery.get(unit.id) ??
      createManaRecoveryIntegral(unit.manaRegenCarry, unit.manaRegenCompensation, unit.manaRegenExactCarry);
    const next = integrateManaRecoveryWithContributionBetween(rate, contribution, fromMs, toMs, previous);
    state.manaRecovery.set(unit.id, next);
    const manaEvent = commitMana(state, unit, {
      ...unit,
      mana: Math.min(unit.stats.manaMax, unit.mana + next.wholeGranted - previous.wholeGranted),
      ...exportManaRecoveryCarry(next)
    }, 'regeneration');
    if (manaEvent) emit(state, manaEvent);
  }
}

/** Each paid pulse selects current hostiles and uses ordinary seeded damage/status/death resolution. */
function pulsePaidSpell(state: State, actorId: string, id: PeriodicSpellId): void {
  const actor = state.units.get(actorId);
  if (!actor || !alive(actor)) return;
  const paid = paidPeriodicSpell(actor, id, state.simClockMs);
  if (!paid) return;
  const last = state.periodicSpellPulses.get(actorId) ?? {};
  if (last[id] === state.simClockMs) return;
  state.periodicSpellPulses.set(actorId, { ...last, [id]: state.simClockMs });
  const definition = PERIODIC_SPELL_DEFINITIONS[id];
  const candidates = targetPriority(state, opponentsOf(state, actor));
  const targets = definition.target === 'area-enemies'
    ? resolveAoeTargets(candidates, definition.aoeShape) : candidates;
  for (const target of targets) {
    applyDamageToUnit(state, actorId, target.id, PERIODIC_SPELL_DEFINITIONS[id].pulse,
      paid.periodicSpell?.rank ?? 0, false, false, false, true);
  }
}

/** Periodic deaths/expiry and ambient auras precede spells; spells precede same-time ordinary actions. */
function settlePaidSpells(state: State): void {
  cancelInterruptedChannels(state);
  if (state.simClockMs === 0) return; // previous wave already settled its endpoint
  for (const actor of state.units.values()) {
    if (!alive(actor)) continue;
    for (const id of PERIODIC_SPELL_IDS) {
      const paid = paidPeriodicSpell(actor, id, state.simClockMs);
      if (!paid) continue;
      const age = state.simClockMs - (paid.appliedAtMs ?? 0);
      if (age > 0 && age % PERIODIC_SPELL_DEFINITIONS[id].intervalMs === 0) {
        pulsePaidSpell(state, actor.id, id);
        if (winnerOf(state) !== null) return;
      }
    }
  }
}

/** End private paid state exactly once; the visible marker cannot keep a ward alive. */
function stopGrimWard(state: State, sourceId: string): void {
  if (!state.grimWards.delete(sourceId)) return;
  const owner = state.units.get(sourceId);
  if (owner) {
    state.units.set(sourceId, { ...owner, statuses: owner.statuses.filter(status => status.id !== 'grim-ward') });
    observeStatuses(state, sourceId);
  }
  emit(state, { kind: 'message', messageKey: 'combat:corpses.grimWardEnded' });
}

/** A finite corpse ward fears current hostiles without drawing RNG or granting combatant/reward identity. */
function settleGrimWards(state: State): void {
  if (state.grimWards.size === 0) return;
  const tuning = GRIM_WARD_DEFINITION.ward;
  for (const [sourceId, ward] of state.grimWards) {
    const owner = state.units.get(sourceId);
    if (!owner || !alive(owner) || state.simClockMs >= ward.expiresAtMs || opponentsOf(state, owner).length === 0) {
      stopGrimWard(state, sourceId); continue;
    }
    if (state.simClockMs !== ward.nextPulseAtMs) continue;
    state.grimWards.set(sourceId, Object.freeze({ ...ward, nextPulseAtMs: ward.nextPulseAtMs + tuning.intervalMs }));
    const targets = opponentsOf(state, owner);
    for (const target of targets) {
      const application = applyStatusWithResult(target, { id: 'howl', sourceId,
        durationMs: tuning.fearDurationMs, simClockMs: state.simClockMs,
        config: { duration: tuning.fearDurationMs / SECONDS, maxStacks: 1,
          bossDurationMult: tuning.bossDurationMultiplier } }, state.rng);
      state.units.set(target.id, application.unit);
      if (application.applied) emit(state, { kind: 'status', target: target.id, statusId: 'howl' });
      observeStatuses(state, target.id);
    }
    emit(state, { kind: 'message', messageKey: 'combat:corpses.grimWardPulse', params: { targets: targets.length } });
  }
  cancelInterruptedChannels(state);
}

/** Ambient pulses share normal healing, mitigation, status and exact-once death settlement. */
function settleAuraPulse(state: State): void {
  const aura = state.statAura;
  if (!aura || state.nextAuraPulseAtMs !== state.simClockMs ||
    !activeStatAura(aura, aura.sourceHeroId, state.units)) return;
  if (aura.sanctuary) {
    const tuning = aura.sanctuary;
    state.nextAuraPulseAtMs += tuning.intervalMs;
    const effect: DamageEffect = { kind: 'damage', damageType: 'arcane', base: [tuning.damage, tuning.damage] };
    for (const target of state.units.values()) {
      if (effectiveSide(state, target) !== 'enemy' || target.undead !== true || !alive(target)) continue;
      applyDamageToUnit(state, aura.sourceHeroId, target.id, effect, 1, false, true);
      const survivor = state.units.get(target.id);
      if (!survivor || !alive(survivor)) continue;
      state.units.set(target.id, applyStatus(survivor, { id: 'stun', sourceId: aura.sourceHeroId,
        simClockMs: state.simClockMs, durationMs: tuning.repulseDurationMs }, state.rng));
      emit(state, { kind: 'status', target: target.id, statusId: 'stun' });
      observeStatuses(state, target.id);
    }
    return;
  }
  if (aura.redemption) {
    state.nextAuraPulseAtMs += aura.redemption.intervalMs;
    settleRedemption(state, aura);
    return;
  }
  if (aura.healing) {
    state.nextAuraPulseAtMs += aura.healing.intervalMs;
    const amount = Math.floor(aura.healing.amount * (1 + (aura.bonuses.lifeRegenPct ?? 0)));
    for (const target of state.units.values()) {
      if (activeStatAura(aura, target.id, state.units)) commitHealing(state, target, amount);
    }
    return;
  }
  const pulse = aura.pulse;
  if (!pulse) return;
  state.nextAuraPulseAtMs += pulse.intervalMs;
  const effect: DamageEffect = { kind: 'damage', damageType: pulse.damageType,
    base: [pulse.damage, pulse.damage],
    ...(pulse.burn ? { applyStatus: { id: 'burn', durationMs: pulse.burn.durationMs,
      dotPctOfDamage: pulse.burn.dotPctOfDamage } } : {}) };
  for (const target of state.units.values()) {
    if (effectiveSide(state, target) === 'enemy' && alive(target)) {
      applyDamageToUnit(state, aura.sourceHeroId, target.id, effect, 1, false, true);
    }
  }
}

/** Stage useful capped recovery before consuming one body from the shared CE/PE FIFO. */
function settleRedemption(state: State, aura: StatAuraProjection): void {
  if (!aura.redemption || state.corpses.length === 0) return;
  const hp = Math.floor(aura.redemption.life * (1 + (aura.bonuses.lifeRegenPct ?? 0)));
  const mp = Math.floor(aura.redemption.mana * (1 + (aura.bonuses.manaRegenPct ?? 0)));
  const recipients = [...state.units.values()].flatMap(target => {
    if (!activeStatAura(aura, target.id, state.units)) return [];
    const life = Number.isFinite(hp) && Number.isFinite(target.stats.lifeMax)
      ? Math.max(0, Math.min(target.stats.lifeMax - target.life, hp)) : 0;
    const mana = Number.isFinite(mp) && Number.isFinite(target.mana) && target.mana >= 0 &&
      Number.isFinite(target.stats.manaMax) && target.stats.manaMax > 0
      ? Math.max(0, Math.min(target.stats.manaMax - target.mana, mp)) : 0;
    return life > 0 || mana > 0 ? [{ target, life, mana }] : [];
  });
  if (recipients.length === 0) return;
  const corpseId = state.corpses.shift();
  if (corpseId === undefined) return;
  emit(state, { kind: 'message', messageKey: 'combat:corpses.consumedRedemption', params: { count: state.corpses.length, corpseId } });
  for (const { target, life, mana } of recipients) {
    commitHealing(state, target, life);
    const after = state.units.get(target.id);
    if (after && mana > 0) {
      const event = commitMana(state, after, { ...after, mana: after.mana + mana }, 'redemption');
      if (event) emit(state, event);
    }
  }
}

/** Next action/status/deadline boundary; starts include non-DoT pending controls. */
function projectileSpeed(state: State, sourceId: string): number {
  const binding = state.slowMissiles.get(sourceId);
  return binding && state.simClockMs < binding.expiresAtMs ? binding.projectileSpeedPct : 100;
}

function nextPeriodicBoundary(state: State, nextActionAt: number): number {
  let boundary = Math.min(MAX_SIM_MS, nextActionAt);
  boundary = Math.min(boundary, state.projectiles.nextImpactAt(id => projectileSpeed(state, id)) ?? Infinity);
  // Dead sources can still have flying shots; their private paid window expires normally.
  for (const binding of state.slowMissiles.values())
    if (binding.expiresAtMs > state.simClockMs) boundary = Math.min(boundary, binding.expiresAtMs);

  for (const [id, binding] of state.decoys) {
    const body = state.units.get(id);
    if (body && alive(body) && binding.expiresAtMs > state.simClockMs)
      boundary = Math.min(boundary, binding.expiresAtMs);
  }
  for (const [id, ward] of state.grimWards) {
    const owner = state.units.get(id);
    if (owner && alive(owner)) boundary = Math.min(boundary, ward.expiresAtMs, ward.nextPulseAtMs);
  }
  for (const [id, binding] of state.hydras) {
    const body = state.units.get(id);
    if (body && alive(body) && binding.expiresAtMs > state.simClockMs)
      boundary = Math.min(boundary, binding.expiresAtMs);
  }
  if (state.nextAuraPulseAtMs !== undefined && state.statAura &&
    activeStatAura(state.statAura, state.statAura.sourceHeroId, state.units)) {
    boundary = Math.min(boundary, state.nextAuraPulseAtMs);
  }
  for (const unit of state.units.values()) {
    if (!alive(unit)) continue;
    for (const id of PERIODIC_SPELL_IDS) {
      const at = nextPeriodicSpellPulse(unit, id, state.simClockMs);
      if (at !== undefined) boundary = Math.min(boundary, at);
    }
    for (const status of unit.statuses) {
      for (const at of [status.appliedAtMs, status.expiresAtMs]) {
        if (at !== undefined && at > state.simClockMs) boundary = Math.min(boundary, at);
      }
    }
  }
  // Rates are stable until the selected boundary. Find each target's earliest
  // supported integer-ms lethal instant, using the settlement integrator itself.
  for (const unit of state.units.values()) {
    if (!alive(unit) || boundary <= state.simClockMs) continue;
    const rate = activeStatusView(unit, state.simClockMs).statuses.reduce(
      (sum, status) => sum + Math.max(0, (status.dotPerStack ?? 0) * status.stacks), 0);
    if (rate <= 0) continue;
    const previous = state.periodic.get(unit.id);
    const carry = (previous?.total ?? 0) / SECONDS - (previous?.dealt ?? 0);
    const minimum = Math.floor(state.simClockMs) + 1;
    const maximum = Math.floor(boundary);
    if (minimum > maximum) continue;
    const effectiveLife = unit.life + (boneArmorPool(unit)?.boneArmor?.remaining ?? 0) +
      (boneWallPool(unit, state.simClockMs)?.boneWall?.remaining ?? 0) + availableEnergyShieldMana(unit);
    const lethalAt = (at: number): boolean => splitPersonalDamage(unit,
      integratePeriodic(unit, state.simClockMs, at, previous).dealt - (previous?.dealt ?? 0), state.simClockMs,
      previous?.dealt ?? 0, state.cyclonePeriodicBaseline.get(unit.id) ?? 0,
      state.holyShieldPeriodicBaseline.get(unit.id) ?? 0, previous?.wallAbsorbed ?? 0).damage >= unit.life;
    let candidate = Math.max(minimum, Math.min(maximum,
      Math.ceil(state.simClockMs + SECONDS * (effectiveLife - carry) / rate)));
    // Verify both candidate and predecessor; floating arithmetic may put the
    // analytic estimate on either side. A bounded binary correction never polls.
    if (!lethalAt(candidate) || (candidate > minimum && lethalAt(candidate - 1))) {
      if (!lethalAt(maximum)) continue;
      let low = minimum;
      let high = maximum;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (lethalAt(mid)) high = mid;
        else low = mid + 1;
      }
      candidate = low;
    }
    if (lethalAt(candidate) && (candidate === minimum || !lethalAt(candidate - 1))) {
      boundary = Math.min(boundary, candidate);
    }
  }
  return boundary;
}

/** Refresh the actor's cooldown view without mutating pending status records. */
function refreshCooldowns(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit) return;
  const effectiveCds: Record<string, number> = {};
  for (const [skillId, exp] of state.cooldownExpiresAt.get(unitId) ?? []) {
    if (exp > state.simClockMs) effectiveCds[skillId] = exp - state.simClockMs;
  }
  state.units.set(unitId, { ...unit, cooldowns: effectiveCds });
}

/** Reject malformed scoped source data before cap/resource decisions establish authority. */
function preparationEffect(
  skill: RegisteredSkill, expectedTemplate: string | undefined = SUMMON_PREPARATION_TEMPLATES[skill.id]
): SummonEffect | undefined {
  const effect = skill.effects[0];
  if (skill.trigger !== 'active' || skill.target !== 'summon' || skill.summonOnStart !== true ||
    skill.effects.length !== 1 || effect?.kind !== 'summon' ||
    effect.summonId !== expectedTemplate || !getSummon(effect.summonId) ||
    !Number.isInteger(skill.minLevel) || skill.minLevel <= 0 ||
    !Number.isFinite(skill.manaCost) || skill.manaCost < 0 ||
    !Number.isFinite(skill.cooldown) || skill.cooldown < 0 ||
    !Number.isFinite(skill.manaCostPerRank ?? 0) || !Number.isFinite(skill.cooldownPerRank ?? 0) ||
    !Number.isInteger(effect.maxCount) || effect.maxCount <= 0 ||
    !Object.values(effect.statScaling ?? {}).every(Number.isFinite)) return undefined;
  const skeleton = effect.summonId === 'skeleton';
  const multi = effect.summonId === 'raven' || effect.summonId === 'dire_wolf' || effect.summonId === 'spirit_wolf' ||
    effect.summonId === 'skeletal_mage' || effect.summonId === 'revived';
  if (skeleton ? effect.maxCount !== 3 || effect.maxCountScaling?.kind !== 'raise-skeleton-1-6-12-cap-3'
    : multi ? effect.maxCount !== 8 || effect.maxCountScaling?.kind !== 'first-three-then-every-three'
    : effect.maxCount !== 1 || effect.maxCountScaling !== undefined) return undefined;
  return effect;
}

function validPreparationCandidate(unit: CombatUnit): boolean {
  const stats = unit.stats;
  return stats.lifeMax > 0 && [unit.life, unit.mana, stats.life, stats.lifeMax, stats.mana, stats.manaMax,
    stats.attack, stats.defense, stats.magicResist, stats.attackSpeed, stats.critChance, stats.critDamage,
    stats.physDodge, stats.magicDodge, stats.magicFind, stats.goldFind]
    .every(value => Number.isFinite(value) && value >= 0) &&
    [stats.resistances.physical, stats.resistances.fire, stats.resistances.cold,
      stats.resistances.lightning, stats.resistances.arcane, stats.resistances.poison].every(Number.isFinite);
}

/** A learned passive creates one real support body; only this registration grants aura authority. */
function prepareSpiritOfBarbs(state: State): void {
  const projection = state.spiritOfBarbs;
  if (!projection || state.barbsSpiritId !== undefined || winnerOf(state) !== null) return;
  const owner = state.units.get(projection.sourceHeroId);
  if (!owner || owner.side !== 'player' || inferKind(owner) !== 'hero' || !alive(owner) ||
    owner.summon === true || owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    !Number.isInteger(owner.level) || owner.level < SPIRIT_OF_BARBS_DEFINITION.requiredLevel) return;
  const definition = SPIRIT_OF_BARBS_DEFINITION;
  const template = buildSummon(owner, definition.summonId);
  if (!template || !validPreparationCandidate(template) || template.skillOrder.length !== 0 ||
    template.stats.lifeMax !== definition.stats.life || template.stats.attack !== definition.stats.attack ||
    template.stats.defense !== definition.stats.defense) return;
  let templates = state.preparationTemplates.get(owner.id);
  if (!templates) { templates = new Set(); state.preparationTemplates.set(owner.id, templates); }
  // This free passive must never refund an unrelated active summoning spell.
  templates.add(definition.summonId);
  registerSpawnedSummon(state, owner, definition.summonId, template, true);
  for (const unit of state.units.values()) if (alive(unit)) observeStatuses(state, unit.id);
}

/** Stage the complete missing batch before payment, IDs, scheduler or RNG can change. */
function prepareSummons(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const effect = preparationEffect(skill);
  if (!effect || !Number.isFinite(owner.level) || owner.level < skill.minLevel ||
    !Number.isFinite(owner.mana) || owner.mana < 0) return;
  if (skill.requires && owner.equippedWeapon !== undefined && !canCastSkill(skill, owner.equippedWeapon).ok) return;
  const rank = effectiveSkillLevel(state, owner, skill);
  const cap = resolveSummonMaxCount(effect, rank);
  // The catalog limit describes learned capacity; paid Command may raise the
  // effective count beyond it without authorizing an over-cap allocation.
  const learnedRank = learnedSkillLevel(state, owner, skill);
  const learnedCap = resolveSummonMaxCount(effect, learnedRank);
  const cost = effectiveManaCost(skill, rank);
  const cooldown = effectiveCooldown(skill, rank);
  if (!Number.isInteger(rank) || rank <= 0 || !Number.isInteger(cap) || cap <= 0 || learnedCap > effect.maxCount ||
    !Number.isFinite(cost) || !Number.isFinite(cooldown * SECONDS)) return;
  const missing = Math.max(0, cap - summonsOf(state, owner.id, effect.summonId).length);
  const candidates: CombatUnit[] = [];
  for (let i = 0; i < missing; i++) {
    const template = buildSummon(owner, effect.summonId, { skillLevel: rank, statScaling: effect.statScaling });
    if (!template) return;
    const candidate = empowerNecromancerSummon(owner, template, state.skeletonMastery, state.golemMastery, state.summonPassives);
    if (!candidate || !validPreparationCandidate(candidate)) return;
    candidates.push(candidate);
  }
  let templates = state.preparationTemplates.get(owner.id);
  if (!templates) {
    templates = new Set();
    state.preparationTemplates.set(owner.id, templates);
  }
  templates.add(effect.summonId);
  const druidTemplate = qualifyDruidSummon(owner, skill, learnedRank);
  const bindDruidBodies = () => {
    if (!druidTemplate) return;
    for (const body of summonsOf(state, owner.id, druidTemplate).slice(0, cap)) {
      if (isDruidSummonBody(body, owner.id, druidTemplate)) state.druidSummons.set(body.id,
        { ownerId: owner.id, template: druidTemplate, skillId: skill.id, rank: learnedRank });
    }
  };
  if (missing === 0) { bindDruidBodies(); return; }
  if (cost > owner.mana) return;
  const registered = castSkill(state, owner.id, skill, { summonId: effect.summonId, units: candidates });
  if (registered?.length === candidates.length) bindDruidBodies();
  if (registered?.length === candidates.length && effect.summonId === 'fire_golem' &&
    qualifyFireGolem(owner, skill, learnedRank)) {
    for (const body of registered) state.fireGolems.set(body.id, { ownerId: owner.id, rank: learnedRank });
  }
  if (registered?.length === candidates.length && effect.summonId === 'blood_golem') {
    // Command raises paid body potency, including20→21; it never replaces learned authority.
    const learned = rank - (paidRankBonus(state, owner) ?? 0);
    if (qualifyBloodGolem(owner, skill, learned)) {
      for (const body of registered) state.bloodGolems.set(body.id, { ownerId: owner.id, rank: learned });
    }
  }
  // Generic preparation/payment stays intact; elemental authority requires explicit provenance.
  if (!registered || registered.length !== candidates.length ||
    skill.id !== 'necromancer.raise_skeletal_mage' || skill.archetype !== 'necromancer' ||
    owner.id.length === 0 || owner.side !== 'player' || inferKind(owner) !== 'hero' ||
    owner.summon === true || owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    !Number.isFinite(owner.life) || owner.life <= 0 ||
    !Number.isInteger(owner.level) || owner.level < skill.minLevel) return;
  // Match learned authority without mistaking a genuinely paid +1 for allocation.
  const rawRank = skillLevelCandidates(skill).map(id => owner.skillLevels?.[id])
    .find(level => typeof level === 'number' && level > 0);
  if (rawRank === undefined || !Number.isFinite(rawRank) || !Number.isInteger(rawRank) ||
    rawRank < 1 || rawRank > SKELETAL_MAGE_DEFINITION.maxRank ||
    rawRank !== rank - (paidRankBonus(state, owner) ?? 0)) return;
  registered.forEach((unit, index) => {
    if (unit.side !== 'player' || unit.kind !== 'summon' || unit.summon !== true ||
      unit.summonTemplateId !== 'skeletal_mage' || unit.summonOwnerId !== owner.id ||
      (unit.ownerId !== undefined && unit.ownerId !== owner.id)) return;
    state.skeletalMageElements.set(unit.id, SKELETAL_MAGE_DEFINITION.elementAt(index));
  });
}

/** Qualify authority first; a fully staged singleton is the only path to payment. */
function prepareIronGolem(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const learnedRank = qualifyIronGolemSource(owner, skill);
  const effect = preparationEffect(skill, 'iron_golem');
  if (learnedRank === 0 || !effect) return;
  if (skill.requires && owner.equippedWeapon !== undefined && !canCastSkill(skill, owner.equippedWeapon).ok) return;
  const rank = effectiveLearnedSkillRank(learnedRank, paidRankBonus(state, owner) ?? 0);
  const cost = effectiveManaCost(skill, rank);
  const cooldown = effectiveCooldown(skill, rank);
  if (!Number.isFinite(cost) || !Number.isFinite(cooldown * SECONDS)) return;
  let templates = state.preparationTemplates.get(owner.id);
  if (!templates) { templates = new Set(); state.preparationTemplates.set(owner.id, templates); }
  templates.add('iron_golem');
  if (summonsOf(state, owner.id, 'iron_golem').length >= 1) return;
  const input = state.ironGolem;
  if (!input || input.sourceHeroId !== owner.id || typeof input.sourceItemId !== 'string' || input.sourceItemId.length === 0 ||
    ![input.life, input.attack, input.defense].every(value => Number.isFinite(value) && value >= 0) ||
    !Number.isFinite(owner.mana) || owner.mana < cost) return;
  const template = buildSummon(owner, 'iron_golem', { skillLevel: rank, statScaling: effect.statScaling });
  if (!template) return;
  const stats = applyIronGolemItemStats(template.stats, input);
  if (!stats) return;
  const candidate = empowerNecromancerSummon(owner, { ...template, stats, life: stats.lifeMax },
    state.skeletonMastery, state.golemMastery, state.summonPassives);
  if (!candidate || !validPreparationCandidate(candidate)) return;
  const spawned = castSkill(state, owner.id, skill, { summonId: 'iron_golem', units: [candidate], skillLevel: rank })?.[0];
  if (spawned) state.ironGolemPreparation = Object.freeze({ sourceHeroId: owner.id, sourceItemId: input.sourceItemId,
    skillId: IRON_GOLEM_SKILL_ID, spawnedUnitId: spawned.id, paidMp: cost });
}

/** Build/validate the complete body before paying once; never bind a preloaded marker. */
function prepareHydra(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const learnedRank = hydraRank(owner);
  if (!matchesHydra(skill) || learnedRank === 0 || !Number.isFinite(owner.mana) ||
    owner.mana < HYDRA_DEFINITION.manaCost || opponentsOf(state, owner).length === 0 || state.heroDead) return;
  const rank = effectiveLearnedSkillRank(learnedRank, paidRankBonus(state, owner) ?? 0);
  const candidate = buildHydra(owner);
  if (!validPreparationCandidate(candidate)) return;
  const registered = castSkill(state, owner.id, skill,
    { summonId: 'hydra', units: [candidate], skillLevel: rank });
  const body = registered?.[0];
  if (registered?.length === 1 && body) state.hydras.set(body.id,
    { ownerId: owner.id, rank, expiresAtMs: state.simClockMs + HYDRA_DEFINITION.durationMs });
}

/** Complete validation precedes one ranked payment; bare/preloaded bodies never gain authority. */
function prepareDecoy(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const learned = decoyRank(owner), bonus = paidRankBonus(state, owner);
  if (!matchesDecoy(skill) || learned === 0 || !Number.isFinite(owner.mana) ||
    opponentsOf(state, owner).length === 0 || state.heroDead) return;
  const rank = effectiveLearnedSkillRank(learned, bonus ?? 0), cost = effectiveManaCost(skill, rank);
  if (!Number.isFinite(cost) || owner.mana < cost) return;
  const candidate = buildDecoy(owner, rank, bonus);
  if (!validPreparationCandidate(candidate)) return;
  const registered = castSkill(state, owner.id, skill,
    { summonId: 'decoy', units: [candidate], skillLevel: rank });
  const body = registered?.[0];
  if (registered?.length === 1 && body) {
    state.decoys.set(body.id, { ownerId: owner.id,
      expiresAtMs: state.simClockMs + decoyDuration(rank, bonus) });
    state.actionSchedule.delete(body.id);
  }
}

function castSummonsOnStart(state: State, unitId: string): void {
  let unit = state.units.get(unitId);
  if (!unit) return;
  const hasEnemy = opponentsOf(state, unit).length > 0;
  const prepared = new Set<string>();
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill || isCorpseExplosionId(skillId) || isCorpseExplosionId(skill.id) ||
      isPoisonExplosionId(skillId) || isPoisonExplosionId(skill.id)) continue;
    unit = state.units.get(unitId);
    if (!unit || !alive(unit)) return;
    if (isDecoySkill(skill, skillId)) {
      if (!prepared.has(DECOY_IDS[1])) {
        prepared.add(DECOY_IDS[1]);
        prepareDecoy(state, unit, skill);
      }
      continue;
    }
    if (isHydraSkill(skill, skillId)) {
      if (!prepared.has('sorceress.hydra')) {
        prepared.add('sorceress.hydra');
        prepareHydra(state, unit, skill);
      }
      continue;
    }
    if (isIronGolemSkill(skill)) {
      if (opponentsOf(state, unit).length > 0 && !state.heroDead && !prepared.has(IRON_GOLEM_SKILL_ID)) {
        prepared.add(IRON_GOLEM_SKILL_ID);
        prepareIronGolem(state, unit, skill);
      }
      continue;
    }
    if (isPreparationSummonSkill(skill)) {
      if (hasEnemy && !state.heroDead && !prepared.has(skill.id)) {
        prepared.add(skill.id);
        prepareSummons(state, unit, skill);
      }
      continue;
    }
    if (!skill.summonOnStart) continue;
    if (!canUseSkillForState(state, unit, skill, skillId, hasEnemy)) continue;
    castSkill(state, unitId, skill);
  }
}

/** Channels and ordinary actions share the exact supported-control/Concentration rule. */
function actionIsInterrupted(state: State, unit: CombatUnit): boolean {
  const active = activeStatusView(unit, state.simClockMs);
  // Concentration protects only this interruption check. The real Stun remains
  // visible to status lifecycle, recording and every other combat interaction.
  const blocking = activeStatAura(state.statAura, unit.id, state.units)?.preventStunInterruption
    ? { ...active, statuses: active.statuses.filter(status => status.id !== 'stun') }
    : active;
  return isStunned(blocking) || isImmobilized(blocking) || activeTerror(blocking, state.simClockMs) ||
    activeBonePrison(blocking, state.simClockMs);
}

/** Cancel at onset, including controls shorter than the interval between pulses. */
function cancelInterruptedChannels(state: State): void {
  for (const unit of state.units.values()) {
    if (!alive(unit) || !isChanneling(unit, state.simClockMs) || !actionIsInterrupted(state, unit)) continue;
    state.units.set(unit.id, { ...unit, statuses: unit.statuses.filter(status =>
      !PERIODIC_SPELL_IDS.some(id => id === status.id && PERIODIC_SPELL_DEFINITIONS[id].channelled === true)) });
    observeStatuses(state, unit.id);
  }
}

function takeAction(state: State, unitId: string): void {
  if (state.decoys.has(unitId)) return;
  const unit = state.units.get(unitId);
  if (!unit || !alive(unit)) return;
  if (actionIsInterrupted(state, unit)) {
    emit(state, { kind: 'stunned', target: unitId });
    return;
  }

  if (isChanneling(unit, state.simClockMs)) return;

  if (state.hydras.has(unit.id)) { attackWithHydra(state, unit); return; }

  if (recoverDruidVine(state, unitId)) return;

  const hasEnemy = opponentsOf(state, unit).length > 0;
  const skill = chooseSkillForState(state, unit, hasEnemy);
  if (skill) {
    castSkill(state, unitId, skill.skill, undefined, skill.orderId);
    return;
  }
  basicAttack(state, unitId);
}

function checkEnrage(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || unit.enraged) return;
  if (shouldEnrage(unit, state.act)) {
    state.units.set(unitId, { ...unit, enraged: true });
    emit(state, { kind: 'enrage', target: unitId });
  }
}

function winnerOf(state: State): CombatSide | null {
  // Hero death = sticky enemy win.
  if (state.heroDead) return 'enemy';
  const playersAlive = aliveOf(state, 'player').length > 0;
  const enemiesAlive = aliveOf(state, 'enemy').length > 0;
  if (playersAlive && !enemiesAlive) return 'player';
  if (!playersAlive && enemiesAlive) return 'enemy';
  if (!playersAlive && !enemiesAlive) return null;
  return null;
}

/** Pick earliest actor, then highest fixed seed priority, then registration order. */
function pickNextActor(state: State): { id: string; at: number } | null {
  let bestId: string | null = null;
  let bestAt = Infinity;
  let bestPriority = -Infinity;
  let bestIdx = Infinity;
  for (const [id, { at }] of state.actionSchedule) {
    const u = state.units.get(id);
    if (!u || !alive(u)) continue;
    const idx = state.insertionIdx.get(id) ?? 0;
    const priority = state.tiePriority.get(id) ?? 0;
    if (at < bestAt || (at === bestAt &&
      (priority > bestPriority || (priority === bestPriority && idx < bestIdx)))) {
      bestAt = at;
      bestPriority = priority;
      bestIdx = idx;
      bestId = id;
    }
  }
  if (bestId === null) return null;
  return { id: bestId, at: bestAt };
}

/** Emit `turn-start` for every 5-second boundary crossed up to `simClockMs`. */
function emitTurnBoundaries(state: State): void {
  const turnsTarget = Math.floor(state.simClockMs / 5000) + 1;
  while (state.turnsEmitted < turnsTarget) {
    state.turnsEmitted++;
    emit(state, { kind: 'turn-start', turn: state.turnsEmitted });
  }
}

/**
 * Run a deterministic battle.
 *
 * Determinism contract: same {@link CombatSnapshot} and optional native carry
 * proof ⇒ identical event log (including `simClockMs` in {@link runBattleRecorded}).
 * Proof remains reusable for replay and is never read from the snapshot/save DTO.
 */
export function runBattle(snapshot: CombatSnapshot, carry?: BattleCommandCarry): CombatResult {
  return runBattleWithTimestamps(snapshot, carry).result;
}

// Re-export for downstream consumers needing types.
export type { BuffEffect, SummonEffect };

/**
 * A {@link BattleEvent} annotated with sim-time + a UI playback delay (ms)
 * hint. The engine produces these during {@link runBattleRecorded}; the UI
 * uses `uiDelayMs` to pace animation between events.
 */
export type RecordedBattleEvent = BattleEvent & {
  /** Simulation clock (ms) at which the event was emitted. */
  readonly simClockMs: number;
  /** Suggested UI delay (ms) to wait before rendering this event. */
  readonly uiDelayMs: number;
};

declare const battleCommandCarryBrand: unique symbol;
/** Opaque in-memory proof of a prior paid interval; cloning/serialization loses authority. */
export interface BattleCommandCarry { readonly [battleCommandCarryBrand]: true }
interface CarriedCommand {
  readonly kind: ReturnType<typeof inferKind>;
  readonly ownerId: CombatUnit['ownerId'];
  readonly summonOwnerId: CombatUnit['summonOwnerId'];
  readonly grant: BattleCommandGrant;
}
const commandCarries = new WeakMap<BattleCommandCarry, ReadonlyMap<string, CarriedCommand>>();

/** Check a living matching recipient without revealing or consuming paid state. */
export function hasBattleCommandCarry(carry: BattleCommandCarry | undefined, unit: CombatUnit): boolean {
  const entry = carry && commandCarries.get(carry)?.get(unit.id);
  return Boolean(entry && unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0 &&
    inferKind(unit) === entry.kind && unit.ownerId === entry.ownerId && unit.summonOwnerId === entry.summonOwnerId);
}

/** Only actual engine bindings may issue a new proof, rebased against the actual terminal clock. */
function captureBattleCommandCarry(state: State): BattleCommandCarry | undefined {
  const grants = new Map<string, CarriedCommand>();
  for (const unit of state.units.values()) {
    if (!battleCommandBonus(unit, state.simClockMs, state.battleCommands)) continue;
    const grant = state.battleCommands.get(unit.id);
    if (!grant) continue;
    grants.set(unit.id, Object.freeze({ kind: inferKind(unit), ownerId: unit.ownerId,
      summonOwnerId: unit.summonOwnerId, grant: Object.freeze({ sourceId: grant.sourceId,
        appliedAtMs: grant.appliedAtMs - state.simClockMs, expiresAtMs: grant.expiresAtMs - state.simClockMs }) }));
  }
  if (grants.size === 0) return undefined;
  const carry = Object.freeze({}) as BattleCommandCarry;
  commandCarries.set(carry, grants);
  return carry;
}

/** Result of {@link runBattleRecorded}. */
export interface RecordedBattleResult {
  /** Explicit native carry only; this proof is never a snapshot/save field. */
  readonly battleCommandCarry?: BattleCommandCarry;
  /** Battle events with attached `simClockMs` + `uiDelayMs` hints. */
  readonly events: readonly RecordedBattleEvent[];
  /** The full {@link CombatResult} (final state, winner, rounds). */
  readonly result: CombatResult;
}

/**
 * Compute UI delay (ms) for the *current* event given the *previous* event's
 * `simClockMs`. The delay equals the sim-time delta clamped to `[50, 3000]`.
 * The very first event uses a fixed 200ms warm-up.
 */
export function computeUiDelayMs(
  currentSimClockMs: number,
  previousSimClockMs: number | null
): number {
  if (previousSimClockMs === null) return 200;
  const delta = currentSimClockMs - previousSimClockMs;
  return Math.max(50, Math.min(3000, delta));
}

/**
 * Run a deterministic battle and return events annotated with `simClockMs`
 * and `uiDelayMs` hints suitable for stepped UI playback.
 *
 * The battle outcome is fully determined when this returns.
 * Pass prior paid carry separately; copied/serialized proofs confer no authority.
 */
export function runBattleRecorded(snapshot: CombatSnapshot, carry?: BattleCommandCarry): RecordedBattleResult {
  const { events, simTimes, result, battleCommandCarry } = runBattleWithTimestamps(snapshot, carry);

  const recorded: RecordedBattleEvent[] = [];
  let prev: number | null = null;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const ts = simTimes[i] ?? 0;
    if (!ev) continue;
    const uiDelayMs = computeUiDelayMs(ts, prev);
    recorded.push({ ...ev, simClockMs: ts, uiDelayMs } as RecordedBattleEvent);
    prev = ts;
  }

  return { events: recorded, result, ...(battleCommandCarry ? { battleCommandCarry } : {}) };
}

/**
 * Internal twin of {@link runBattle} that also records the simClockMs
 * snapshot for every emitted event. Kept private to avoid leaking the
 * timing array into the main public surface.
 */
function runBattleWithTimestamps(snapshot: CombatSnapshot, carry?: BattleCommandCarry): {
  events: BattleEvent[];
  simTimes: number[];
  result: CombatResult;
  battleCommandCarry?: BattleCommandCarry;
} {
  // Pure engine entry points can also receive untyped external snapshots.
  if ((snapshot.difficulty as unknown) !== undefined && (snapshot.difficulty as unknown) !== 'normal' &&
    (snapshot.difficulty as unknown) !== 'nightmare') {
    throw new Error('Invalid combat difficulty');
  }
  if ([snapshot.mightAura, snapshot.meditationAura, snapshot.statAura].filter(aura => aura !== undefined).length > 1) {
    throw new Error('Only one player aura projection');
  }
  const rng = createRng(snapshot.seed);
  const aura = snapshot.mightAura;
  const meditation = snapshot.meditationAura;
  const statAura = copyStatAuraProjection(snapshot.statAura);
  const druidAllyAuras = copyDruidAllyAuras(snapshot.druidAllyAuras);
  const spiritOfBarbs = copySpiritOfBarbs(snapshot.spiritOfBarbs);
  const auraIntervalMs = statAura?.pulse?.intervalMs ?? statAura?.healing?.intervalMs ?? statAura?.redemption?.intervalMs ?? statAura?.sanctuary?.intervalMs;
  const mastery = snapshot.skeletonMastery;
  const golemMastery = snapshot.golemMastery;
  const iron = snapshot.ironGolem;
  const global = snapshot.summonPassives;
  const assassinVenom = copyAssassinVenomProjection(snapshot.assassinVenom);
  const state: State = {
    projectiles: new ProjectileFlights<ProjectileImpact>(),
    slowMissiles: new Map(),
    plague: new PlagueTracker(),
    battleCommands: new Map(),
    boostedCommandPassives: new Set(),
    hydras: new Map(),
    decoys: new Map(),
    periodicSpellPulses: new Map(),
    conversions: new Map(),
    ...(spiritOfBarbs ? { spiritOfBarbs } : {}),
    hasTemporaryLife: statAura?.selectedAuraId === 'paladin.vigor' || druidAllyAuras !== undefined ||
      [...snapshot.playerTeam, ...snapshot.enemyTeam].some(unit => unit.vigorLife !== undefined || unit.druidShapeRanks !== undefined || unit.druidForm !== undefined || unit.druidFormLife !== undefined),
    ...(druidAllyAuras ? { druidAllyAuras } : {}),
    holyFreezeSources: [],
    ...(statAura ? { statAura } : {}),
    ...(auraIntervalMs !== undefined ? { nextAuraPulseAtMs: auraIntervalMs } : {}),
    ...(assassinVenom ? { assassinVenom } : {}),
    ...(global ? { summonPassives: Object.freeze({ sourceHeroId: global.sourceHeroId,
      masteryRank: global.masteryRank, resistRank: global.resistRank,
      masteryMaxRank: global.masteryMaxRank, resistMaxRank: global.resistMaxRank,
      lifePct: global.lifePct, attackPct: global.attackPct, resistAllBonus: global.resistAllBonus }) } : {}),
    difficulty: snapshot.difficulty ?? 'normal',
    corpseExplosion: new Map(copyCorpseExplosionProjections(snapshot.corpseExplosion).map(p => [p.sourceHeroId, p.rank])),
    poisonExplosion: new Map(copyPoisonExplosionProjections(snapshot.poisonExplosion).map(p => [p.sourceHeroId, p.rank])),
    findPotion: new Map(copyFindPotionProjections(snapshot.findPotion).map(p => [p.sourceHeroId, p.rank])),
    findItem: new Map(copyFindItemProjections(snapshot.findItem).map(p => [p.sourceHeroId, p.rank])),
    findItemFinds: [],
    grimWard: new Map(copyGrimWardProjections(snapshot.grimWard).map(p => [p.sourceHeroId, p.rank])),
    grimWards: new Map(),
    corpses: [],
    druidSummons: new Map(),
    fireGolems: new Map(),
    bloodGolems: new Map(),
    ...(golemMastery ? { golemMastery: Object.freeze({ sourceHeroId: golemMastery.sourceHeroId,
      rank: golemMastery.rank, maxRank: golemMastery.maxRank, golemLifePct: golemMastery.golemLifePct,
      golemAttackSpeed: golemMastery.golemAttackSpeed }) } : {}),
    ...(iron ? { ironGolem: Object.freeze({ sourceHeroId: iron.sourceHeroId, sourceItemId: iron.sourceItemId,
      life: iron.life, attack: iron.attack, defense: iron.defense }) } : {}),
    ...(meditation ? { meditationAura: Object.freeze({ selectedAuraId: meditation.selectedAuraId,
      sourceHeroId: meditation.sourceHeroId, rank: meditation.rank, maxRank: meditation.maxRank,
      sourceBaselinePerSecond: meditation.sourceBaselinePerSecond, manaRegenPctPerRank: meditation.manaRegenPctPerRank,
      ...(meditation.fieldedMercCombatId !== undefined ? { fieldedMercCombatId: meditation.fieldedMercCombatId } : {}) }) } : {}),
    ...(mastery ? { skeletonMastery: Object.freeze({ sourceHeroId: mastery.sourceHeroId, rank: mastery.rank,
      maxRank: mastery.maxRank, summonLifePct: mastery.summonLifePct,
      summonAttackPct: mastery.summonAttackPct, summonDefensePct: mastery.summonDefensePct }) } : {}),
    ...(aura ? { mightAura: Object.freeze({ selectedAuraId: aura.selectedAuraId, sourceHeroId: aura.sourceHeroId,
      rank: aura.rank, maxRank: aura.maxRank, physicalDamagePct: aura.physicalDamagePct, attackPct: aura.attackPct,
      ...(aura.fieldedMercCombatId !== undefined ? { fieldedMercCombatId: aura.fieldedMercCombatId } : {}) }) } : {}),
    units: new Map(),
    events: [],
    observedStatuses: new Map(),
    simTimes: [],
    rng,
    tieRng: rng.fork('scheduler-ties'),
    tiePriority: new Map(),
    act: snapshot.act ?? 1,
    simClockMs: 0,
    insertionIdx: new Map(),
    actionSchedule: new Map(),
    cooldownExpiresAt: new Map(),
    periodic: new Map(),
    cyclonePeriodicBaseline: new Map(),
    holyShieldPeriodicBaseline: new Map(),
    manaRecovery: new Map(),
    deathsHandled: new Set(),
    turnsEmitted: 0,
    heroDead: false,
    insertionCounter: 0,
    summonSequence: 0,
    preparationTemplates: new Map(),
    skeletalMageElements: new Map()
  };

  // Wave-local visual markers cannot establish paid state or cross the wave boundary.
  const clearWardMarkers = (unit: CombatUnit): CombatUnit => ({ ...unit,
    statuses: unit.statuses.filter(status => status.id !== 'grim-ward' && !isGrimWardId(status.id) &&
      status.id !== 'battle-command' && !isBattleCommandId(status.id)),
    activeBuffIds: unit.activeBuffIds.filter(id => id !== 'grim-ward' && !isGrimWardId(id) &&
      id !== 'battle-command' && !isBattleCommandId(id)) });
  for (const u of withDefaultGridPositions(snapshot.playerTeam)) registerUnit(state, clearWardMarkers(u));
  for (const u of withDefaultGridPositions(snapshot.enemyTeam)) registerUnit(state, clearWardMarkers(u));
  for (const unit of state.units.values()) {
    const factor = activeStatAura(state.statAura, unit.id, state.units)?.cleansingDurationMultiplier;
    if (factor !== undefined) state.units.set(unit.id, shortenCleansingStatuses(unit, 0, factor));
  }
  // Feedback requires an actual eligible runtime hero, never an unbound projection alone.
  for (const id of state.corpseExplosion.keys()) {
    const hero = state.units.get(id);
    if (!hero || corpseExplosionRank(hero, state.corpseExplosion) === 0) state.corpseExplosion.delete(id);
  }
  for (const id of state.poisonExplosion.keys()) {
    const hero = state.units.get(id);
    if (!hero || poisonExplosionRank(hero, state.poisonExplosion) === 0) state.poisonExplosion.delete(id);
  }
  for (const id of state.findPotion.keys()) {
    const hero = state.units.get(id);
    if (!hero || findPotionRank(hero, state.findPotion) === 0) state.findPotion.delete(id);
  }
  for (const id of state.grimWard.keys()) {
    const hero = state.units.get(id);
    if (!hero || grimWardRank(hero, state.grimWard) === 0) state.grimWard.delete(id);
  }
  for (const id of state.findItem.keys()) {
    const hero = state.units.get(id);
    if (!hero || findItemRank(hero, state.findItem) === 0) state.findItem.delete(id);
  }

  // Restore only private paid proof. Imported markers were removed above, and
  // duplicate recipient IDs cannot inherit one legitimate binding twice.
  for (const unit of state.units.values()) {
    if (!hasBattleCommandCarry(carry, unit) || snapshot.playerTeam.filter(u => u.id === unit.id).length !== 1) continue;
    const entry = carry && commandCarries.get(carry)?.get(unit.id);
    if (!entry) continue;
    state.battleCommands.set(unit.id, entry.grant);
    state.units.set(unit.id, { ...unit, statuses: [...unit.statuses,
      { id: 'battle-command', stacks: 1,
        remaining: entry.grant.expiresAtMs / SECONDS, ...entry.grant }] });
  }
  // Keep the complete initial status prefix ahead of every other observation.
  for (const u of state.units.values()) observeStatuses(state, u.id, true);
  // Fresh potency must precede initial cadence, recovery and final life clamping.
  reconcileBattleCommandPassives(state);
  for (const u of state.units.values()) {
    scheduleNextAction(state, u);
    // At time zero, carried remaining milliseconds are their expiry timestamps.
    state.cooldownExpiresAt.set(u.id, new Map(Object.entries(u.cooldowns)
      .filter(([, remaining]) => Number.isFinite(remaining) && remaining > 0)));
  }
  // Rejected carried paid state still needs an explicit removal observation for playback.
  reconcileLifeCapacities(state, [...snapshot.playerTeam, ...snapshot.enemyTeam]
    .filter(unit => unit.druidForm !== undefined || unit.druidFormLife !== undefined).map(unit => unit.id));
  emitTurnBoundaries(state);

  prepareSpiritOfBarbs(state);
  const startOrder = [...state.units.values()]
    .sort(
      (a, b) =>
        (state.insertionIdx.get(a.id) ?? 0) - (state.insertionIdx.get(b.id) ?? 0)
    )
    .map((u) => u.id);
  for (const id of startOrder) castSummonsOnStart(state, id);
  reconcileActionPeriods(state);

  let actionsTaken = 0;
  while (winnerOf(state) === null && actionsTaken < MAX_ACTIONS) {
    const candidate = pickNextActor(state);
    if (!candidate) break;
    // A cap stop never fabricates deadline settlement. Otherwise advance all
    // targets together, even if no action is eligible before the deadline.
    if (state.simClockMs === MAX_SIM_MS && candidate.at > MAX_SIM_MS) break;
    const boundary = nextPeriodicBoundary(state, candidate.at);
    const from = state.simClockMs;
    const meditationRecipients = captureMeditationRecipients(state);
    const impacts = state.projectiles.advance(boundary, id => projectileSpeed(state, id));
    settlePeriodic(state, boundary);
    settleManaRecovery(state, from, boundary, meditationRecipients);
    reconcileBattleCommandPassives(state);
    if (winnerOf(state) !== null) break;
    settleAuraPulse(state);
    if (winnerOf(state) !== null) break;
    settleGrimWards(state);
    settlePaidSpells(state);
    if (winnerOf(state) !== null) break;
    // Existing periodic/ambient deaths settle first; impacts precede tied actions.
    for (const impact of impacts) {
      if (winnerOf(state) !== null) break;
      applyDamageToUnit(state, impact.attackerId, impact.defenderId, impact.effect,
        impact.skillLevel, false, false, false, false, true);
    }
    if (winnerOf(state) !== null) break;
    reconcileActionPeriods(state);
    // Status settlement may change the next actor or its pending timestamp.
    const next = pickNextActor(state);
    if (!next || next.at > state.simClockMs) continue;
    const actor = state.units.get(next.id);
    if (!actor || !alive(actor)) continue;
    refreshCooldowns(state, next.id);
    checkEnrage(state, next.id);
    if (winnerOf(state) !== null) break;
    takeAction(state, next.id);
    reconcileBattleCommandPassives(state);
    actionsTaken++;
    const after = state.units.get(next.id);
    if (after && alive(after)) {
      scheduleNextAction(state, after);
    } else {
      state.actionSchedule.delete(next.id);
    }
    reconcileActionPeriods(state);
  }

  const winner = winnerOf(state);
  for (const id of state.grimWards.keys()) stopGrimWard(state, id);
  // Native wave carry consumes this view; a terminal cast may have no later
  // actor refresh to publish the cooldown already paid into the expiry map.
  for (const unitId of state.units.keys()) refreshCooldowns(state, unitId);
  emit(state, { kind: 'end', winner });

  const all = [...state.units.values()].sort(
    (a, b) =>
      (state.insertionIdx.get(a.id) ?? 0) - (state.insertionIdx.get(b.id) ?? 0)
  );
  const playerTeam = all.filter((u) => u.side === 'player');
  const enemyTeam = all.filter((u) => u.side === 'enemy');

  const result: CombatResult = {
    events: state.events,
    winner,
    playerTeam,
    enemyTeam,
    rounds: state.turnsEmitted,
    ...(state.findItemFinds.length > 0 ? { findItemFinds: Object.freeze([...state.findItemFinds]) } : {}),
    ...(state.ironGolemPreparation ? { ironGolemPreparation: state.ironGolemPreparation } : {})
  };
  const battleCommandCarry = captureBattleCommandCarry(state);
  return { events: state.events, simTimes: state.simTimes, result,
    ...(battleCommandCarry ? { battleCommandCarry } : {}) };
}

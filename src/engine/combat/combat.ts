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
import type { ActiveStatus, CombatUnit, CombatSide, GridPosition } from './types';
import { inferKind } from './types';
import { resolveDamage, mitigateDamage, type DamageInput } from './damage';
import {
  applyStatus,
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
import { MERC_INNER_SIGHT_DEFINITION } from '../skills/inner-sight';
import { isMercHolyFreezeSource, MERC_HOLY_FREEZE_DEFINITION } from '../skills/merc-holy-freeze';
import { METEOR_ARMOR_MELT_DEFINITION } from '../skills/armor-melt';
import { activeMightAura, type MightAuraProjection } from '../skills/might';
import { activeMeditationAura, type MeditationAuraProjection } from '../skills/meditation';
import { activeStatAura, copyStatAuraProjection, statAuraDamageBonus, type StatAuraProjection } from '../skills/stat-auras';
import { FROZEN_ARMOR_DEFINITION, resolveFrozenArmorRank } from '../skills/frozen-armor';
import { absorbBoneArmor, boneArmorPool, copyBoneArmorStatuses } from '../skills/bone-armor';
import { activeBurstOfSpeed, burstOfSpeedRank, copyBurstOfSpeedStatuses, matchesBurstOfSpeed,
  paidBurstOfSpeed, BURST_OF_SPEED_IDS, BURST_OF_SPEED_DEFINITION } from '../skills/burst-of-speed';
import { isStaticFieldId, matchesStaticField, staticFieldDamage, staticFieldRank } from '../skills/static-field';
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
import type { SkeletonMasteryProjection } from '../skills/skeleton-mastery';
import type { GolemMasteryProjection } from '../skills/golem-mastery';
import { empowerNecromancerSummon, type SummonPassiveProjection } from '../skills/summon-passives';
import { SKELETAL_MAGE_DEFINITION, type SkeletalMageElement } from '../skills/skeletal-mage';
import { IRON_GOLEM_SKILL_ID, isIronGolemSkill, qualifyIronGolemSource, applyIronGolemItemStats,
  type IronGolemInput, type IronGolemPreparationAttestation } from '../skills/iron-golem';
import { resolveSummonMaxCount, scalePerRank } from '../skills/scaling';
import { resolveAoeTargets, withDefaultGridPositions } from './grid';
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
  | { readonly kind: 'action'; readonly actor: string; readonly skillId: string | null }
  | {
      readonly kind: 'damage';
      readonly source: string;
      readonly target: string;
      readonly damageType: string;
      readonly amount: number;
      /** Already-mitigated damage paid by Bone Armor instead of HP. */
      readonly absorbed?: number;
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
  | { readonly kind: 'mana'; readonly target: string; readonly mana: number;
      readonly reason: 'cast' | 'regeneration' | 'summon-refund' | 'orb' }
  | { readonly kind: 'death'; readonly target: string }
  | { readonly kind: 'enrage'; readonly target: string }
  | { readonly kind: 'orb'; readonly target: string; readonly orb: Orb }
  | { readonly kind: 'stunned'; readonly target: string }
  | { readonly kind: 'dot'; readonly target: string; readonly amount: number; readonly absorbed?: number }
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
  /** Copied learned Assassin coating, bound to the exact player hero for this wave. */
  readonly assassinVenom?: AssassinVenomProjection;
  /** Frozen explicit player Might selection for this wave, active from simulation entry. */
  readonly mightAura?: MightAuraProjection;
  /** Frozen explicit Meditation selection; eligibility is captured at each interval start. */
  readonly meditationAura?: MeditationAuraProjection;
  /** Copied selected stat aura; mutually exclusive with Might and Meditation. */
  readonly statAura?: StatAuraProjection;
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
  /** Present only after successful registration; survives that summon's later death. */
  readonly ironGolemPreparation?: IronGolemPreparationAttestation;
}

interface State {
  /** Factory-marked source IDs captured at registration; live eligibility is checked at use. */
  readonly holyFreezeSources: string[];
  readonly difficulty: 'normal' | 'nightmare';
  /** Valid copied player authority and FIFO primary enemy-monster death IDs; wave-local only. */
  readonly corpseExplosion: Map<string, number>;
  readonly poisonExplosion: Map<string, number>;
  readonly assassinVenom?: AssassinVenomProjection;
  readonly corpses: string[];
  readonly ironGolem?: IronGolemInput;
  ironGolemPreparation?: IronGolemPreparationAttestation;
  readonly mightAura?: MightAuraProjection;
  readonly meditationAura?: MeditationAuraProjection;
  readonly statAura?: StatAuraProjection;
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
  const active = activeStatusView(unit, state.simClockMs);
  if (unit.side !== 'enemy' || !alive(unit) || hasStatus(active, 'chill')) return active;
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
    (unit.side === 'enemy' && ambientChillSourceId(state) !== undefined);
  const enrage = unit.enraged ? unit.enrage?.attackSpeedMultiplier ?? 1 : 1;
  const speedBonus = (activeBurstOfSpeed(unit, state.simClockMs)?.attackSpeedPct ?? 0) +
    (activeStatAura(state.statAura, unit.id, state.units)?.bonuses.attackSpeedPct ?? 0);
  return actionPeriodMs(unit.stats.attackSpeed * (1 + speedBonus) * enrage * (chilled ? CHILL_DEFINITION.attackSpeedMultiplier : 1));
}

/** All new attempts start one full effective period after the current clock. */
function scheduleNextAction(state: State, unit: CombatUnit): void {
  const period = effectiveActionPeriod(state, unit);
  state.actionSchedule.set(unit.id, { at: state.simClockMs + period, period });
}

/** Preserve remaining progress at onset/expiry; unchanged refresh never reschedules. */
function reconcileActionPeriods(state: State): void {
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
  if (candidates.length === 1) return candidates[0];

  if (attacker.side === 'player') {
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
  state.units.set(u.id, copyBoneArmorStatuses(copyBurstOfSpeedStatuses(u)));
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
  const combo = comboMultiplier(combatStatusView(state, defender), effect.damageType);
  const stats = attacker.stats;
  const attackerAura = activeStatAura(state.statAura, attacker.id, state.units);
  const defenderAura = activeStatAura(state.statAura, defender.id, state.units);
  const enemyAura = state.statAura && defender.side === 'enemy'
    ? activeStatAura(state.statAura, state.statAura.sourceHeroId, state.units) : undefined;
  const resistBonus = (defenderAura?.bonuses.resistAllPct ?? 0) * 100 - (enemyAura?.enemyResistReductionPct ?? 0);
  const resistances = resistBonus === 0 ? defender.stats.resistances : {
    physical: defender.stats.resistances.physical + resistBonus,
    fire: defender.stats.resistances.fire + resistBonus, cold: defender.stats.resistances.cold + resistBonus,
    lightning: defender.stats.resistances.lightning + resistBonus,
    arcane: defender.stats.resistances.arcane + resistBonus, poison: defender.stats.resistances.poison + resistBonus
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
  const innerSightFactor = hasStatus(defender, MERC_INNER_SIGHT_DEFINITION.statusId)
    ? 1 - MERC_INNER_SIGHT_DEFINITION.defenseReductionPct / 100 : 1;
  const armorBonus = hasPaidFrozenArmor(defender) ? defender.frozenArmor.defensePct : 0;
  return {
    baseMin,
    baseMax,
    flatBonus: baseFlatBonus + (effect.attackDamagePct
      ? stats.attack * (1 + (attackerAura?.bonuses.attackPct ?? 0)) * effect.attackDamagePct / 100 : 0),
    increasedPct: (attacker.increasedDamagePct?.[effect.damageType] ?? 0) +
      statAuraDamageBonus(attackerAura, effect.damageType) +
      (effect.damageType === 'physical' ? activeMightAura(state.mightAura, attacker.id, state.units)?.physicalDamagePct ?? 0 : 0) +
      (effect.damageType === 'cold' && attacker.side === 'player' && alive(attacker) && holyFreezeSourceId(state) !== undefined
        ? MERC_HOLY_FREEZE_DEFINITION.coldDamagePct : 0),
    comboMult: combo,
    type: effect.damageType,
    critChance: stats.critChance,
    critMult: stats.critDamage,
    defenderResistances,
    defenderArmor: Math.max(0, defender.stats.defense * (1 + armorBonus + (defenderAura?.bonuses.defensePct ?? 0)) * meltFactor * innerSightFactor),
    defenderMagicResist: defender.stats.magicResist,
    defenderDodge:
      effect.damageType === 'physical' || effect.damageType === 'thorns'
        ? defender.stats.physDodge + (activeBurstOfSpeed(defender, state.simClockMs)?.physDodgePct ?? 0) +
          (defenderAura?.bonuses.physDodgePct ?? 0)
        : defender.stats.magicDodge + (defenderAura?.bonuses.magicDodgePct ?? 0),
    ...(defender.resistPenalty !== undefined ? { resistPenalty: defender.resistPenalty } : {})
  };
}

/** Supply duration authority only for the current eligible recipient; absence preserves ordinary application. */
function cleansingDurationInput(state: State, recipientId: string): { readonly cleansingDurationMultiplier?: number } {
  const multiplier = activeStatAura(state.statAura, recipientId, state.units)?.cleansingDurationMultiplier;
  return multiplier === undefined ? {} : { cleansingDurationMultiplier: multiplier };
}

function applyDamageToUnit(
  state: State,
  attackerId: string,
  defenderId: string,
  effect: DamageEffect,
  skillLevel = 1,
  basicHit = false,
  auraPulse = false
): void {
  const attacker = state.units.get(attackerId);
  const defender = state.units.get(defenderId);
  if (!attacker || !defender || !alive(attacker) || !alive(defender)) return;

  const activeDefender = activeStatusView(defender, state.simClockMs);
  const retaliates = hasPaidFrozenArmor(activeDefender);
  const input = buildDamageInput(state, attacker, activeDefender, effect, skillLevel);
  const outcome = auraPulse
    ? { hit: true, crit: false, dodged: false,
      ...mitigateDamage((input.baseMin + input.flatBonus) * (1 + input.increasedPct) * input.comboMult, input) }
    : resolveDamage(input, state.rng);
  const amount = outcome.hit && outcome.final > 0 && shouldShatter(activeDefender, effect.damageType)
    ? Math.max(outcome.final, defender.life + (boneArmorPool(defender)?.boneArmor?.remaining ?? 0))
    : outcome.final;
  const absorption = absorbBoneArmor(defender, amount);
  emit(state, {
    kind: 'damage',
    source: attackerId,
    target: defenderId,
    damageType: effect.damageType,
    amount: absorption.damage,
    ...(absorption.absorbed > 0 ? { absorbed: absorption.absorbed } : {}),
    crit: outcome.crit,
    dodged: outcome.dodged
  });

  if (outcome.dodged) return;
  const newLife = Math.max(0, defender.life - absorption.damage);
  state.units.set(defenderId, { ...absorption.unit, life: newLife });
  if (absorption.absorbed > 0) observeStatuses(state, defenderId);

  const statuses = effect.applyStatuses ?? (effect.applyStatus ? [effect.applyStatus] : []);
  for (const status of statuses) {
    const chance = status.chance ?? 1;
    if ((auraPulse && chance === 1) || state.rng.chance(chance)) {
      const stacks = status.stacksOnApply ?? 1;
      const dotPerStack =
        status.dotPctOfDamage !== undefined
          ? Math.max(1, Math.floor(outcome.final * status.dotPctOfDamage))
          : undefined;
      const cur = state.units.get(defenderId);
      if (cur) {
        let updated = cur;
        for (let i = 0; i < stacks; i++) {
          updated = applyStatus(
            updated,
            {
              id: status.id,
              ...cleansingDurationInput(state, defenderId),
              sourceId: attackerId,
              simClockMs: state.simClockMs,
              ...(status.durationMs !== undefined ? { durationMs: status.durationMs } : {}),
              ...(dotPerStack !== undefined ? { dotPerStack } : {}),
              damageType: effect.damageType
            },
            state.rng
          );
        }
        state.units.set(defenderId, updated);
        emit(state, { kind: 'status', target: defenderId, statusId: status.id });
        observeStatuses(state, defenderId);
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

  const after = state.units.get(defenderId);
  const reflectionPct = (after?.physicalReflectionPct ?? 0) +
    (activeStatAura(state.statAura, defenderId, state.units)?.bonuses.thornsPct ?? 0);
  if (after && !alive(after)) {
    finishDeaths(state, [activeStatusView(after, state.simClockMs)]);
  } else if (after && attacker.side !== defender.side && effect.damageType === 'physical' &&
    defender.life > newLife && reflectionPct > 0) {
    const target = state.units.get(attackerId);
    if (!target || !alive(target)) return;
    const raw = Math.max(1, Math.floor((defender.life - newLife) * reflectionPct));
    const thorns: DamageEffect = { kind: 'damage', damageType: 'thorns', base: [raw, raw] };
    const reflected = mitigateDamage(raw,
      buildDamageInput(state, after, activeStatusView(target, state.simClockMs), thorns));
    const reflectionAbsorption = absorbBoneArmor(target, reflected.final);
    emit(state, { kind: 'damage', source: defenderId, target: attackerId,
      damageType: 'thorns', amount: reflectionAbsorption.damage,
      ...(reflectionAbsorption.absorbed > 0 ? { absorbed: reflectionAbsorption.absorbed } : {}),
      crit: false, dodged: false });
    const damaged = { ...reflectionAbsorption.unit, life: Math.max(0, target.life - reflectionAbsorption.damage) };
    state.units.set(attackerId, damaged);
    if (reflectionAbsorption.absorbed > 0) observeStatuses(state, attackerId);
    if (!alive(damaged)) finishDeaths(state, [activeStatusView(damaged, state.simClockMs)]);
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
  for (const u of dead) {
    observeStatuses(state, u.id);
    emit(state, { kind: 'death', target: u.id });
  }
  for (const u of dead) {
    const source = primary.get(u.id);
    if (source) deathEffects(state, source);
  }
  // Publish only after the complete closure/effects, in the existing death-event order.
  // Keep every outcome unit and handled death intact for rewards and replay.
  if (state.corpseExplosion.size > 0 || state.poisonExplosion.size > 0) {
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
    for (const u of spreadPlague(dead, recipients, 0.5, state.rng, state.simClockMs,
      recipient => activeStatAura(state.statAura, recipient.id, state.units)?.cleansingDurationMultiplier)) {
      state.units.set(u.id, u);
      observeStatuses(state, u.id);
    }
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
        const summonSkillLevel = effectiveSkillLevel(owner, summonSkill);
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

function effectiveSkillLevel(unit: CombatUnit, skill: RegisteredSkill): number {
  if (BURST_OF_SPEED_IDS.some(id => id === skill.id)) return burstOfSpeedRank(unit);
  if (isStaticFieldId(skill.id)) return staticFieldRank(unit);
  const governed = governedActiveId(skill.id);
  if (governed) {
    if (unit.governedActiveRanks) return unit.governedActiveRanks[governed];
    if (governed === 'item.redemption') return 0;
  }
  if (skill.id === 'sorceress.frozen_armor') return resolveFrozenArmorRank(unit.skillLevels);
  const levels = unit.skillLevels;
  if (!levels) return 1;
  for (const id of skillLevelCandidates(skill)) {
    const level = levels[id];
    if (typeof level === 'number' && level > 0) return Math.floor(level);
  }
  return 1;
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

/** Select fresh, same-side recipients, retaining insertion order for ratio ties. */
function healingTargets(state: State, actorId: string, effect: HealEffect): CombatUnit[] {
  const actor = state.units.get(actorId);
  if (!actor) return [];
  const candidates = effect.target === 'self' ? [actor] : [...state.units.values()];
  const eligible = candidates.filter(target => target.side === actor.side &&
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
    return actor !== undefined && aliveOf(state, actor.side === 'player' ? 'enemy' : 'player')
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

function canUseSkillForState(
  state: State,
  unit: CombatUnit,
  skill: RegisteredSkill,
  skillOrderId: string,
  hasEnemyTarget: boolean
): boolean {
  const burst = BURST_OF_SPEED_IDS.some(id => id === skillOrderId || id === skill.id) ||
    skill.effects.some(effect => effect.kind === 'buff' && effect.timedStatBuff === 'burst-of-speed');
  const ce = isCorpseExplosionId(skillOrderId) || isCorpseExplosionId(skill.id);
  const pe = isPoisonExplosionId(skillOrderId) || isPoisonExplosionId(skill.id);
  const skillLevel = ce ? corpseExplosionRank(unit, state.corpseExplosion)
    : pe ? poisonExplosionRank(unit, state.poisonExplosion) : effectiveSkillLevel(unit, skill);
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
  if (effectiveManaCost(skill, skillLevel) > unit.mana) return false;
  if (unit.level < skill.minLevel) return false;
  if (isPaidFrozenArmorSkill(skill)) {
    if (hasPaidFrozenArmor(unit)) return false;
  } else if (!burst &&
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
      isPreparationSummonSkill(skill) || isIronGolemSkill(skill)) continue;
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
    case 'static-field': {
      if (!matchesStaticField(skill) || staticFieldRank(acting) === 0) break;
      for (const candidate of enemySideAlive) {
        const target = state.units.get(candidate.id);
        if (!target) continue;
        const amount = staticFieldDamage(target, state.difficulty);
        if (amount <= 0) continue;
        const absorption = absorbBoneArmor(target, amount);
        state.units.set(target.id, { ...absorption.unit, life: target.life - absorption.damage });
        emit(state, { kind: 'damage', source: actorId, target: target.id,
          damageType: 'lightning', amount: absorption.damage,
          ...(absorption.absorbed > 0 ? { absorbed: absorption.absorbed } : {}),
          crit: false, dodged: false });
        if (absorption.absorbed > 0) observeStatuses(state, target.id);
      }
      break;
    }
    case 'damage': {
      for (const t of enemySideAlive) {
        applyDamageToUnit(state, actorId, t.id, effect, skillLevel);
      }
      break;
    }
    case 'buff': {
      const actor = state.units.get(actorId);
      if (!actor) return;
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
      for (const t of enemySideAlive) {
        const updated = applyStatus(
          t,
          {
            id: effect.statusId,
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
        state.units.set(t.id, updated);
        emit(state, { kind: 'status', target: t.id, statusId: effect.statusId });
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
function registerSpawnedSummon(state: State, owner: CombatUnit, templateId: string, template: CombatUnit): CombatUnit {
  const summon = { ...template, id: nextSummonId(state, owner.id, templateId) };
  const preferredPosition = firstOpenSummonPosition(owner, aliveOf(state, owner.side));
  const summonWithPreferredPosition = preferredPosition
    ? { ...summon, gridPosition: preferredPosition }
    : summon;
  const positionedSummon = withDefaultGridPositions([
    ...aliveOf(state, owner.side),
    summonWithPreferredPosition
  ]).find((u) => u.id === summon.id) ?? summonWithPreferredPosition;
  registerUnit(state, positionedSummon);
  scheduleNextAction(state, positionedSummon);
  state.cooldownExpiresAt.set(positionedSummon.id, new Map());
  emit(state, { kind: 'summon', owner: owner.id, summonId: templateId, unit: positionedSummon });
  observeStatuses(state, positionedSummon.id);
  return positionedSummon;
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
  const consumesCorpse = ce || pe;
  if (consumesCorpse && !canUseSkillForState(state, actor, skill, skillOrderId,
    aliveOf(state, actor.side === 'player' ? 'enemy' : 'player').length > 0)) return;
  const skillLevel = ce ? corpseExplosionRank(actor, state.corpseExplosion)
    : pe ? poisonExplosionRank(actor, state.poisonExplosion)
    : prepared?.skillLevel ?? effectiveSkillLevel(actor, skill);
  // Synchronous commit: reserve exactly one oldest body before ordinary payment/effects.
  if (consumesCorpse) state.corpses.shift();
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
  if (consumesCorpse) emit(state, { kind: 'message', messageKey: pe ? 'combat:corpses.consumedPoison' : 'combat:corpses.consumed',
    params: { count: state.corpses.length } });
  if (prepared) {
    return prepared.units.map(candidate => registerSpawnedSummon(state, actor, prepared.summonId, candidate));
  }

  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemiesAliveRaw = aliveOf(state, enemySide);
  const enemies = targetPriority(state, enemiesAliveRaw);

  let targetEnemies: CombatUnit[] = enemies;
  if (skill.target === 'single-enemy' && enemiesAliveRaw.length > 0) {
    const picked = pickDefender(state, actor, enemiesAliveRaw);
    if (picked) targetEnemies = [picked];
  } else if (skill.target === 'area-enemies') {
    targetEnemies = resolveAoeTargets(enemies, skill.aoeShape);
  }

  for (const effect of skill.effects) {
    applyEffect(state, actorId, skill, effect, skillLevel, targetEnemies);
  }
  return undefined;
}

function basicAttack(state: State, actorId: string): void {
  const actor = state.units.get(actorId);
  if (!actor) return;
  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemiesAlive = aliveOf(state, enemySide);
  const target = pickDefender(state, actor, enemiesAlive);
  if (!target) return;

  emit(state, { kind: 'action', actor: actorId, skillId: null });
  const attackPct = (activeMightAura(state.mightAura, actorId, state.units)?.attackPct ?? 0) +
    (activeStatAura(state.statAura, actorId, state.units)?.bonuses.attackPct ?? 0);
  const ordinaryRange = actor.attackRange ?? [actor.stats.attack, actor.stats.attack];
  const projectAttack = (value: number): number => Math.max(1, Math.floor(value * (1 + attackPct)));
  const effect: DamageEffect = {
    kind: 'damage',
    damageType: actor.basicAttack?.damageType ?? state.skeletalMageElements.get(actorId) ?? 'physical',
    base: actor.basicAttack?.damage ?? [projectAttack(ordinaryRange[0]), projectAttack(ordinaryRange[1])]
  };
  applyDamageToUnit(state, actorId, target.id, effect, 1, true);
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
  return { total, compensation, dealt: Math.floor(total / SECONDS) };
}

/** Every HP write precedes events/deaths; sources freeze the just-integrated interval. */
function settlePeriodic(state: State, to: number): void {
  const from = state.simClockMs;
  const damages: { unit: CombatUnit; amount: number; absorbed: number }[] = [];
  const dead: CombatUnit[] = [];
  for (const before of state.units.values()) {
    if (!alive(before)) continue;
    const previous = state.periodic.get(before.id);
    const next = integratePeriodic(before, from, to, previous);
    const amount = next.dealt - (previous?.dealt ?? 0);
    state.periodic.set(before.id, next);
    if (amount <= 0) continue;
    const absorption = absorbBoneArmor(before, amount);
    const after = { ...absorption.unit, life: Math.max(0, before.life - absorption.damage) };
    state.units.set(before.id, after);
    damages.push({ unit: after, amount: absorption.damage, absorbed: absorption.absorbed });
    if (!alive(after)) dead.push(activeStatusView(after, from));
  }
  state.simClockMs = to;
  emitTurnBoundaries(state);
  for (const { unit, amount, absorbed } of damages) emit(state, { kind: 'dot', target: unit.id, amount,
    ...(absorbed > 0 ? { absorbed } : {}) });
  finishDeaths(state, dead);
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

/** Ambient pulses share normal healing, mitigation, status and exact-once death settlement. */
function settleAuraPulse(state: State): void {
  const aura = state.statAura;
  if (!aura || state.nextAuraPulseAtMs !== state.simClockMs ||
    !activeStatAura(aura, aura.sourceHeroId, state.units)) return;
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
    if (target.side === 'enemy' && alive(target)) {
      applyDamageToUnit(state, aura.sourceHeroId, target.id, effect, 1, false, true);
    }
  }
}

/** Next action/status/deadline boundary; starts include non-DoT pending controls. */
function nextPeriodicBoundary(state: State, nextActionAt: number): number {
  let boundary = Math.min(MAX_SIM_MS, nextActionAt);
  if (state.nextAuraPulseAtMs !== undefined && state.statAura &&
    activeStatAura(state.statAura, state.statAura.sourceHeroId, state.units)) {
    boundary = Math.min(boundary, state.nextAuraPulseAtMs);
  }
  for (const unit of state.units.values()) {
    if (!alive(unit)) continue;
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
    const effectiveLife = unit.life + (boneArmorPool(unit)?.boneArmor?.remaining ?? 0);
    const lethalAt = (at: number): boolean => integratePeriodic(unit, state.simClockMs, at, previous).dealt -
      (previous?.dealt ?? 0) >= effectiveLife;
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

/** Stage the complete missing batch before payment, IDs, scheduler or RNG can change. */
function prepareSummons(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const effect = preparationEffect(skill);
  if (!effect || !Number.isFinite(owner.level) || owner.level < skill.minLevel ||
    !Number.isFinite(owner.mana) || owner.mana < 0) return;
  if (skill.requires && owner.equippedWeapon !== undefined && !canCastSkill(skill, owner.equippedWeapon).ok) return;
  const rank = effectiveSkillLevel(owner, skill);
  const cap = resolveSummonMaxCount(effect, rank);
  const cost = effectiveManaCost(skill, rank);
  const cooldown = effectiveCooldown(skill, rank);
  if (!Number.isInteger(rank) || rank <= 0 || !Number.isInteger(cap) || cap <= 0 || cap > effect.maxCount ||
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
  if (missing === 0 || cost > owner.mana) return;
  const registered = castSkill(state, owner.id, skill, { summonId: effect.summonId, units: candidates });
  // Generic preparation/payment stays intact; elemental authority requires explicit provenance.
  if (!registered || registered.length !== candidates.length ||
    skill.id !== 'necromancer.raise_skeletal_mage' || skill.archetype !== 'necromancer' ||
    owner.id.length === 0 || owner.side !== 'player' || inferKind(owner) !== 'hero' ||
    owner.summon === true || owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    !Number.isFinite(owner.life) || owner.life <= 0 ||
    !Number.isInteger(owner.level) || owner.level < skill.minLevel) return;
  // Match effectiveSkillLevel's first-positive precedence without accepting its flooring/default.
  const rawRank = skillLevelCandidates(skill).map(id => owner.skillLevels?.[id])
    .find(level => typeof level === 'number' && level > 0);
  if (rawRank === undefined || !Number.isFinite(rawRank) || !Number.isInteger(rawRank) ||
    rawRank < 1 || rawRank > SKELETAL_MAGE_DEFINITION.maxRank || rawRank !== rank) return;
  registered.forEach((unit, index) => {
    if (unit.side !== 'player' || unit.kind !== 'summon' || unit.summon !== true ||
      unit.summonTemplateId !== 'skeletal_mage' || unit.summonOwnerId !== owner.id ||
      (unit.ownerId !== undefined && unit.ownerId !== owner.id)) return;
    state.skeletalMageElements.set(unit.id, SKELETAL_MAGE_DEFINITION.elementAt(index));
  });
}

/** Qualify authority first; a fully staged singleton is the only path to payment. */
function prepareIronGolem(state: State, owner: CombatUnit, skill: RegisteredSkill): void {
  const rank = qualifyIronGolemSource(owner, skill);
  const effect = preparationEffect(skill, 'iron_golem');
  if (rank === 0 || !effect) return;
  if (skill.requires && owner.equippedWeapon !== undefined && !canCastSkill(skill, owner.equippedWeapon).ok) return;
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

function castSummonsOnStart(state: State, unitId: string): void {
  let unit = state.units.get(unitId);
  if (!unit) return;
  const enemySide: CombatSide = unit.side === 'player' ? 'enemy' : 'player';
  const hasEnemy = aliveOf(state, enemySide).length > 0;
  const prepared = new Set<string>();
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill || isCorpseExplosionId(skillId) || isCorpseExplosionId(skill.id) ||
      isPoisonExplosionId(skillId) || isPoisonExplosionId(skill.id)) continue;
    unit = state.units.get(unitId);
    if (!unit || !alive(unit)) return;
    if (isIronGolemSkill(skill)) {
      if (aliveOf(state, enemySide).length > 0 && !state.heroDead && !prepared.has(IRON_GOLEM_SKILL_ID)) {
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

function takeAction(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || !alive(unit)) return;

  const active = activeStatusView(unit, state.simClockMs);
  if (isStunned(active) || isImmobilized(active)) {
    emit(state, { kind: 'stunned', target: unitId });
    return;
  }

  const enemySide: CombatSide = unit.side === 'player' ? 'enemy' : 'player';
  const hasEnemy = aliveOf(state, enemySide).length > 0;
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
 * Determinism contract: same {@link CombatSnapshot} ⇒ identical event log
 * (including event-attached `simClockMs` in {@link runBattleRecorded}).
 */
export function runBattle(snapshot: CombatSnapshot): CombatResult {
  return runBattleWithTimestamps(snapshot).result;
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

/** Result of {@link runBattleRecorded}. */
export interface RecordedBattleResult {
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
 */
export function runBattleRecorded(snapshot: CombatSnapshot): RecordedBattleResult {
  const { events, simTimes, result } = runBattleWithTimestamps(snapshot);

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

  return { events: recorded, result };
}

/**
 * Internal twin of {@link runBattle} that also records the simClockMs
 * snapshot for every emitted event. Kept private to avoid leaking the
 * timing array into the main public surface.
 */
function runBattleWithTimestamps(snapshot: CombatSnapshot): {
  events: BattleEvent[];
  simTimes: number[];
  result: CombatResult;
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
  const auraIntervalMs = statAura?.pulse?.intervalMs ?? statAura?.healing?.intervalMs;
  const mastery = snapshot.skeletonMastery;
  const golemMastery = snapshot.golemMastery;
  const iron = snapshot.ironGolem;
  const global = snapshot.summonPassives;
  const assassinVenom = copyAssassinVenomProjection(snapshot.assassinVenom);
  const state: State = {
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
    corpses: [],
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
    manaRecovery: new Map(),
    deathsHandled: new Set(),
    turnsEmitted: 0,
    heroDead: false,
    insertionCounter: 0,
    summonSequence: 0,
    preparationTemplates: new Map(),
    skeletalMageElements: new Map()
  };

  for (const u of withDefaultGridPositions(snapshot.playerTeam)) registerUnit(state, u);
  for (const u of withDefaultGridPositions(snapshot.enemyTeam)) registerUnit(state, u);
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

  for (const u of state.units.values()) {
    scheduleNextAction(state, u);
    // At time zero, carried remaining milliseconds are their expiry timestamps.
    state.cooldownExpiresAt.set(u.id, new Map(Object.entries(u.cooldowns)
      .filter(([, remaining]) => Number.isFinite(remaining) && remaining > 0)));
  }
  for (const u of state.units.values()) observeStatuses(state, u.id, true);
  emitTurnBoundaries(state);

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
    settlePeriodic(state, boundary);
    settleManaRecovery(state, from, boundary, meditationRecipients);
    if (winnerOf(state) !== null) break;
    settleAuraPulse(state);
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
    ...(state.ironGolemPreparation ? { ironGolemPreparation: state.ironGolemPreparation } : {})
  };
  return { events: state.events, simTimes: state.simTimes, result };
}

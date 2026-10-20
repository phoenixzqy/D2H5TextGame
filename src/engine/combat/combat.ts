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
import type { CombatUnit, CombatSide, GridPosition } from './types';
import { inferKind } from './types';
import { resolveDamage, type DamageInput } from './damage';
import {
  applyStatus,
  expireStatuses,
  hasStatus,
  isStunned,
  spreadPlague,
  activeStatusView,
  amplifyDamageReduction
} from './status';
import { comboMultiplier } from './combo';
import { rollOrbDrops, applyOrbs, type Orb } from './orbs';
import { isImmobilized, shouldEnrage } from '../ai/policy';
import { canCastSkill } from '../skills/eligibility';
import { getSkill } from '../skills/registry';
import { buildSummon } from '../skills/summons';
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
      readonly crit: boolean;
      readonly dodged: boolean;
    }
  | { readonly kind: 'status'; readonly target: string; readonly statusId: string }
  | { readonly kind: 'buff'; readonly target: string; readonly buffId: string }
  | {
      readonly kind: 'summon';
      readonly owner: string;
      readonly summonId: string;
      readonly unit: CombatUnit;
    }
  | { readonly kind: 'heal'; readonly target: string; readonly amount: number }
  | { readonly kind: 'death'; readonly target: string }
  | { readonly kind: 'enrage'; readonly target: string }
  | { readonly kind: 'orb'; readonly target: string; readonly orb: Orb }
  | { readonly kind: 'stunned'; readonly target: string }
  | { readonly kind: 'dot'; readonly target: string; readonly amount: number }
  | { readonly kind: 'end'; readonly winner: CombatSide | null };

/** Initial combat snapshot. */
export interface CombatSnapshot {
  readonly seed: number;
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly act?: 1 | 2 | 3 | 4 | 5;
  readonly maxRounds?: number;
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
}

interface State {
  units: Map<string, CombatUnit>;
  events: BattleEvent[];
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
  nextActionAt: Map<string, number>;
  cooldownExpiresAt: Map<string, Map<string, number>>;
  /** Pooled rate-times-ms integral, never persisted or transferred between battles. */
  periodic: Map<string, PeriodicIntegral>;
  deathsHandled: Set<string>;
  /** highest "turn" emitted (5s boundaries). */
  turnsEmitted: number;
  /** sticky flag — hero death = enemy victory regardless of summons. */
  heroDead: boolean;
  /** spawn counter, monotonically increasing. */
  insertionCounter: number;
  /** Runtime summon identity belongs to this battle, never a module singleton. */
  summonSequence: number;
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

function emit(state: State, ev: BattleEvent): void {
  state.events.push(ev);
  state.simTimes.push(state.simClockMs);
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
  state.units.set(u.id, u);
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

/** Compute damage with combo lookup applied. */
function buildDamageInput(
  attacker: CombatUnit,
  defender: CombatUnit,
  effect: DamageEffect,
  skillLevel = 1,
  baseFlatBonus = 0
): DamageInput {
  const combo = comboMultiplier(defender, effect.damageType);
  const stats = attacker.stats;
  const baseMin = scalePerRank(effect.base[0], effect.perRank?.[0], skillLevel);
  const baseMax = scalePerRank(effect.base[1], effect.perRank?.[1], skillLevel);
  // Project the curse before the existing act penalty, resistance clamp and defense.
  const defenderResistances = effect.damageType === 'physical'
    ? { ...defender.stats.resistances,
        physical: defender.stats.resistances.physical - amplifyDamageReduction(defender) }
    : defender.stats.resistances;
  return {
    baseMin,
    baseMax,
    flatBonus: baseFlatBonus,
    increasedPct: 0,
    comboMult: combo,
    type: effect.damageType,
    critChance: stats.critChance,
    critMult: stats.critDamage,
    defenderResistances,
    defenderArmor: defender.stats.defense,
    defenderMagicResist: defender.stats.defense,
    defenderDodge:
      effect.damageType === 'physical' || effect.damageType === 'thorns'
        ? defender.stats.physDodge
        : defender.stats.magicDodge,
    ...(defender.resistPenalty !== undefined ? { resistPenalty: defender.resistPenalty } : {})
  };
}

function applyDamageToUnit(
  state: State,
  attackerId: string,
  defenderId: string,
  effect: DamageEffect,
  skillLevel = 1
): void {
  const attacker = state.units.get(attackerId);
  const defender = state.units.get(defenderId);
  if (!attacker || !defender || !alive(defender)) return;

  const input = buildDamageInput(attacker, activeStatusView(defender, state.simClockMs), effect, skillLevel);
  const outcome = resolveDamage(input, state.rng);
  emit(state, {
    kind: 'damage',
    source: attackerId,
    target: defenderId,
    damageType: effect.damageType,
    amount: outcome.final,
    crit: outcome.crit,
    dodged: outcome.dodged
  });

  if (outcome.dodged) return;
  const newLife = Math.max(0, defender.life - outcome.final);
  state.units.set(defenderId, { ...defender, life: newLife });

  if (effect.applyStatus) {
    const chance = effect.applyStatus.chance ?? 1;
    if (state.rng.chance(chance)) {
      const stacks = effect.applyStatus.stacksOnApply ?? 1;
      const dotPerStack =
        effect.applyStatus.dotPctOfDamage !== undefined
          ? Math.max(1, Math.floor(outcome.final * effect.applyStatus.dotPctOfDamage))
          : undefined;
      const cur = state.units.get(defenderId);
      if (cur) {
        let updated = cur;
        for (let i = 0; i < stacks; i++) {
          updated = applyStatus(
            updated,
            {
              id: effect.applyStatus.id,
              sourceId: attackerId,
              simClockMs: state.simClockMs,
              ...(dotPerStack !== undefined ? { dotPerStack } : {}),
              damageType: effect.damageType
            },
            state.rng
          );
        }
        state.units.set(defenderId, updated);
        emit(state, { kind: 'status', target: defenderId, statusId: effect.applyStatus.id });
      }
    }
  }

  const after = state.units.get(defenderId);
  if (after && !alive(after)) {
    finishDeaths(state, [activeStatusView(after, state.simClockMs)]);
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
    state.nextActionAt.delete(u.id);
    state.periodic.delete(u.id);
    if (inferKind(u) === 'hero') state.heroDead = true;
  }
  for (const u of dead) emit(state, { kind: 'death', target: u.id });
  for (const u of dead) {
    const source = primary.get(u.id);
    if (source) deathEffects(state, source);
  }
}

/** Ordinary effects use the frozen final-interval source and current living recipients. */
function deathEffects(state: State, dead: CombatUnit): void {
  if (hasStatus(dead, 'plague') || hasStatus(dead, 'poison')) {
    const recipients = [...state.units.values()].filter(u => u.side === dead.side && alive(u));
    for (const u of spreadPlague(dead, recipients, 0.5, state.rng, state.simClockMs)) {
      state.units.set(u.id, u);
    }
  }

  // Bug #3 (P0) - when a summon dies, refund the parent skill's mana cost
  // on the owner so they can re-cast on their next action ("骷髅兵死后再
  // 触发技能重新召唤"). Without this, a Necromancer with raise_skeleton
  // (mana cost 15, no cooldown, no in-combat regen) hits a hard mana wall
  // at 5 lifetime summons; once their mana drains, dead skeletons are
  // never replaced.
  if (inferKind(dead) === 'summon' && dead.summonOwnerId) {
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
        state.units.set(owner.id, { ...owner, mana: refundedMana });
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
      for (const p of players) {
        const updated = applyOrbs(p, orbs);
        state.units.set(p.id, updated);
      }
      for (const orb of orbs) {
        for (const p of players) {
          emit(state, { kind: 'orb', target: p.id, orb });
        }
      }
    }
  }

  // Remove from action scheduler.
  state.nextActionAt.delete(dead.id);
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

function hasAvailableEffect(state: State, actorId: string, skill: RegisteredSkill, skillLevel: number): boolean {
  if (!skill.effects.every((effect) => effect.kind === 'summon')) return true;
  return skill.effects.some((effect) =>
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
  if ((unit.cooldowns[skill.id] ?? unit.cooldowns[skillOrderId] ?? 0) > 0) return false;
  const skillLevel = effectiveSkillLevel(unit, skill);
  if (effectiveManaCost(skill, skillLevel) > unit.mana) return false;
  if (unit.level < skill.minLevel) return false;
  if (
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
): RegisteredSkill | undefined {
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill) continue;
    if (!canUseSkillForState(state, unit, skill, skillId, hasEnemyTarget)) continue;
    return skill;
  }
  return undefined;
}

function applyEffect(
  state: State,
  actorId: string,
  effect: SkillEffect,
  skillLevel: number,
  enemySideAlive: readonly CombatUnit[],
  allySideAlive: readonly CombatUnit[]
): void {
  switch (effect.kind) {
    case 'damage': {
      for (const t of enemySideAlive) {
        applyDamageToUnit(state, actorId, t.id, effect, skillLevel);
      }
      break;
    }
    case 'buff': {
      const actor = state.units.get(actorId);
      if (!actor) return;
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
      }
      break;
    }
    case 'summon': {
      const owner = state.units.get(actorId);
      if (!owner) return;
      const existing = summonsOf(state, actorId, effect.summonId).length;
      const cap = resolveSummonMaxCount(effect, skillLevel);
      if (existing >= cap) return;
      const template = buildSummon(owner, effect.summonId, {
        skillLevel,
        statScaling: effect.statScaling
      });
      if (!template) {
        // Unknown template — log & no-op.
        // eslint-disable-next-line no-console
        console.warn(`[combat] unknown summonId: ${effect.summonId}`);
        return;
      }
      const summon = { ...template, id: nextSummonId(state, actorId, effect.summonId) };
      const preferredPosition = firstOpenSummonPosition(owner, aliveOf(state, owner.side));
      const summonWithPreferredPosition = preferredPosition
        ? { ...summon, gridPosition: preferredPosition }
        : summon;
      const positionedSummon = withDefaultGridPositions([
        ...aliveOf(state, owner.side),
        summonWithPreferredPosition
      ]).find((u) => u.id === summon.id) ?? summonWithPreferredPosition;
      registerUnit(state, positionedSummon);
      state.nextActionAt.set(
        positionedSummon.id,
        state.simClockMs + actionPeriodMs(positionedSummon.stats.attackSpeed)
      );
      state.cooldownExpiresAt.set(positionedSummon.id, new Map());
      emit(state, {
        kind: 'summon',
        owner: actorId,
        summonId: effect.summonId,
        unit: positionedSummon
      });
      break;
    }
    case 'heal': {
      const heal: HealEffect = effect;
      const targets =
        heal.target === 'self'
          ? [state.units.get(actorId)].filter((x): x is CombatUnit => !!x)
          : allySideAlive;
      for (const t of targets) {
        const amt =
          heal.amount ?? Math.floor(t.stats.lifeMax * (heal.pctOfMaxLife ?? 0));
        const newLife = Math.min(t.stats.lifeMax, t.life + amt);
        state.units.set(t.id, { ...t, life: newLife });
        emit(state, { kind: 'heal', target: t.id, amount: amt });
      }
      break;
    }
  }
}

function castSkill(state: State, actorId: string, skill: RegisteredSkill): void {
  const actor = state.units.get(actorId);
  if (!actor) return;

  const skillLevel = effectiveSkillLevel(actor, skill);
  const manaCost = effectiveManaCost(skill, skillLevel);
  const newMana = Math.max(0, actor.mana - manaCost);
  state.units.set(actorId, { ...actor, mana: newMana });

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

  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemiesAliveRaw = aliveOf(state, enemySide);
  const enemies = targetPriority(state, enemiesAliveRaw);
  const allies = aliveOf(state, actor.side);

  let targetEnemies: CombatUnit[] = enemies;
  if (skill.target === 'single-enemy' && enemiesAliveRaw.length > 0) {
    const picked = pickDefender(state, actor, enemiesAliveRaw);
    if (picked) targetEnemies = [picked];
  } else if (skill.target === 'area-enemies') {
    targetEnemies = resolveAoeTargets(enemies, skill.aoeShape);
  }

  for (const effect of skill.effects) {
    applyEffect(state, actorId, effect, skillLevel, targetEnemies, allies);
  }
}

function basicAttack(state: State, actorId: string): void {
  const actor = state.units.get(actorId);
  if (!actor) return;
  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemiesAlive = aliveOf(state, enemySide);
  const target = pickDefender(state, actor, enemiesAlive);
  if (!target) return;

  emit(state, { kind: 'action', actor: actorId, skillId: null });
  const baseAttack = Math.max(1, Math.floor(actor.stats.attack));
  const effect: DamageEffect = {
    kind: 'damage',
    damageType: 'physical',
    base: [baseAttack, baseAttack]
  };
  applyDamageToUnit(state, actorId, target.id, effect);
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
  const damages: { unit: CombatUnit; amount: number }[] = [];
  const dead: CombatUnit[] = [];
  for (const before of state.units.values()) {
    if (!alive(before)) continue;
    const previous = state.periodic.get(before.id);
    const next = integratePeriodic(before, from, to, previous);
    const amount = next.dealt - (previous?.dealt ?? 0);
    state.periodic.set(before.id, next);
    if (amount <= 0) continue;
    const after = { ...before, life: Math.max(0, before.life - amount) };
    state.units.set(before.id, after);
    damages.push({ unit: after, amount });
    if (!alive(after)) dead.push(activeStatusView(after, from));
  }
  state.simClockMs = to;
  emitTurnBoundaries(state);
  for (const { unit, amount } of damages) emit(state, { kind: 'dot', target: unit.id, amount });
  finishDeaths(state, dead);
  for (const u of state.units.values()) {
    if (alive(u)) state.units.set(u.id, expireStatuses(u, to));
  }
}

/** Next action/status/deadline boundary; starts include non-DoT pending controls. */
function nextPeriodicBoundary(state: State, nextActionAt: number): number {
  let boundary = Math.min(MAX_SIM_MS, nextActionAt);
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
    const lethalAt = (at: number): boolean => integratePeriodic(unit, state.simClockMs, at, previous).dealt -
      (previous?.dealt ?? 0) >= unit.life;
    let candidate = Math.max(minimum, Math.min(maximum,
      Math.ceil(state.simClockMs + SECONDS * (unit.life - carry) / rate)));
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

function castSummonsOnStart(state: State, unitId: string): void {
  let unit = state.units.get(unitId);
  if (!unit) return;
  const enemySide: CombatSide = unit.side === 'player' ? 'enemy' : 'player';
  const hasEnemy = aliveOf(state, enemySide).length > 0;
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill?.summonOnStart) continue;
    unit = state.units.get(unitId);
    if (!unit || !alive(unit)) return;
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
    castSkill(state, unitId, skill);
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
  for (const [id, at] of state.nextActionAt) {
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
  const rng = createRng(snapshot.seed);
  const state: State = {
    units: new Map(),
    events: [],
    simTimes: [],
    rng,
    tieRng: rng.fork('scheduler-ties'),
    tiePriority: new Map(),
    act: snapshot.act ?? 1,
    simClockMs: 0,
    insertionIdx: new Map(),
    nextActionAt: new Map(),
    cooldownExpiresAt: new Map(),
    periodic: new Map(),
    deathsHandled: new Set(),
    turnsEmitted: 0,
    heroDead: false,
    insertionCounter: 0,
    summonSequence: 0
  };

  for (const u of withDefaultGridPositions(snapshot.playerTeam)) registerUnit(state, u);
  for (const u of withDefaultGridPositions(snapshot.enemyTeam)) registerUnit(state, u);

  for (const u of state.units.values()) {
    state.nextActionAt.set(u.id, actionPeriodMs(u.stats.attackSpeed));
    state.cooldownExpiresAt.set(u.id, new Map());
  }
  emitTurnBoundaries(state);

  const startOrder = [...state.units.values()]
    .sort(
      (a, b) =>
        (state.insertionIdx.get(a.id) ?? 0) - (state.insertionIdx.get(b.id) ?? 0)
    )
    .map((u) => u.id);
  for (const id of startOrder) castSummonsOnStart(state, id);

  let actionsTaken = 0;
  while (winnerOf(state) === null && actionsTaken < MAX_ACTIONS) {
    const next = pickNextActor(state);
    if (!next) break;
    // A cap stop never fabricates deadline settlement. Otherwise advance all
    // targets together, even if no action is eligible before the deadline.
    if (state.simClockMs === MAX_SIM_MS && next.at > MAX_SIM_MS) break;
    const boundary = nextPeriodicBoundary(state, next.at);
    settlePeriodic(state, boundary);
    if (winnerOf(state) !== null) break;
    if (boundary < next.at) continue;
    const actor = state.units.get(next.id);
    if (!actor || !alive(actor)) continue;
    refreshCooldowns(state, next.id);
    checkEnrage(state, next.id);
    if (winnerOf(state) !== null) break;
    takeAction(state, next.id);
    actionsTaken++;
    const after = state.units.get(next.id);
    if (after && alive(after)) {
      state.nextActionAt.set(
        next.id,
        state.simClockMs + actionPeriodMs(after.stats.attackSpeed)
      );
    } else {
      state.nextActionAt.delete(next.id);
    }
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
    rounds: state.turnsEmitted
  };
  return { events: state.events, simTimes: state.simTimes, result };
}

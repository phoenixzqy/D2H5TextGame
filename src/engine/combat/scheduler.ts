/**
 * Tick-based combat scheduler — virtual-millisecond clock.
 *
 * Replaces the old "everyone acts once per round in attackSpeed-sorted order"
 * loop. Each combatant has its own `attackIntervalMs`; the scheduler always
 * advances time to whichever unit has the earliest `nextActionAt`. Pure and
 * deterministic: same {@link CombatSnapshot} (seed + units) ⇒ same event
 * sequence with identical `virtualTimeMs` stamps.
 *
 * Spec: `docs/design/tick-combat.md`.
 *
 * @module engine/combat/scheduler
 */

import { createRng, type Rng } from '../rng';
import type { ActiveStatus, CombatSide, CombatUnit } from './types';
import { resolveDamage, type DamageInput } from './damage';
import { applyStatus, hasStatus, isStunned, spreadPlague, dotDamageThisTick } from './status';
import { comboMultiplier } from './combo';
import { rollOrbDrops, applyOrbs, type Orb } from './orbs';
import { chooseSkill, isImmobilized, shouldEnrage } from '../ai/policy';
import { getSkill } from '../skills/registry';
import type {
  RegisteredSkill,
  SkillEffect,
  DamageEffect,
  HealEffect
} from '../skills/effects';

/** Average legacy round → virtual ms conversion factor. */
export const AVG_INTERVAL_MS = 1200;

/** Minimum cooldown floor for any *non-zero* skill cooldown (per spec §2.4). */
export const MIN_COOLDOWN_MS = 1000;

/** Hard cap on virtual-time per battle (per spec §2.6). */
export const MAX_VIRTUAL_MS = 120_000;

/** Lowest legal swing interval (per spec §3, after haste division floor). */
export const MIN_INTERVAL_MS = 50;

/** Fixed DoT tick boundary in ms. (Per spec §2.5.) */
export const DOT_TICK_MS = 500;

/** Possible combat events. */
export type BattleEvent =
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
  | { readonly kind: 'summon'; readonly owner: string; readonly summonId: string }
  | { readonly kind: 'heal'; readonly target: string; readonly amount: number }
  | { readonly kind: 'death'; readonly target: string }
  | { readonly kind: 'enrage'; readonly target: string }
  | { readonly kind: 'orb'; readonly target: string; readonly orb: Orb }
  | { readonly kind: 'stunned'; readonly target: string }
  | { readonly kind: 'dot'; readonly target: string; readonly amount: number }
  | { readonly kind: 'end'; readonly winner: CombatSide | null };

/** A {@link BattleEvent} stamped with the virtual-time at which it occurred. */
export type BattleEventWithTime = BattleEvent & { readonly virtualTimeMs: number };

/** Initial combat snapshot. */
export interface CombatSnapshot {
  readonly seed: number;
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly act?: 1 | 2 | 3 | 4 | 5;
  /**
   * Legacy "rounds" cap. If provided, the scheduler caps virtual time at
   * `maxRounds * AVG_INTERVAL_MS`. Mostly preserved for backward compat with
   * tests that target the old round-based loop. Default: scheduler uses
   * {@link MAX_VIRTUAL_MS}.
   */
  readonly maxRounds?: number;
  /** Direct virtual-time cap. Overrides {@link maxRounds} if both set. */
  readonly maxVirtualMs?: number;
}

/** Final combat result. */
export interface CombatResult {
  readonly events: readonly BattleEventWithTime[];
  readonly winner: CombatSide | null;
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  /** Synthetic legacy "rounds" count: `ceil(virtualTimeMs / AVG_INTERVAL_MS)`. */
  readonly rounds: number;
  readonly virtualTimeMs: number;
}

interface State {
  readonly units: Map<string, CombatUnit>;
  readonly pending: BattleEventWithTime[];
  readonly rng: Rng;
  readonly act: 1 | 2 | 3 | 4 | 5;
  virtualTimeMs: number;
  readonly nextActionAt: Map<string, number>;
  readonly lastDotTickAt: Map<string, number>;
  readonly lastActedAt: Map<string, number>;
}

function alive(u: CombatUnit): boolean {
  return u.life > 0;
}

function emit(state: State, ev: BattleEvent): void {
  state.pending.push({ ...ev, virtualTimeMs: state.virtualTimeMs });
}

function aliveOf(state: State, side: CombatSide): CombatUnit[] {
  const out: CombatUnit[] = [];
  for (const u of state.units.values()) if (u.side === side && alive(u)) out.push(u);
  return out;
}

function winnerOf(state: State): CombatSide | null {
  const playersAlive = aliveOf(state, 'player').length > 0;
  const enemiesAlive = aliveOf(state, 'enemy').length > 0;
  if (playersAlive && !enemiesAlive) return 'player';
  if (!playersAlive && enemiesAlive) return 'enemy';
  return null;
}

/**
 * Compute a unit's current swing interval in ms. Falls back to the
 * `attackSpeed`-derived value when {@link CombatUnit.attackIntervalMs} is
 * absent. Always ≥ {@link MIN_INTERVAL_MS}.
 */
export function getAttackIntervalMs(u: CombatUnit): number {
  const explicit = u.attackIntervalMs;
  if (explicit !== undefined && Number.isFinite(explicit)) {
    return Math.max(MIN_INTERVAL_MS, Math.floor(explicit));
  }
  const as = Math.max(1, u.stats.attackSpeed);
  return Math.max(MIN_INTERVAL_MS, Math.round(120_000 / as));
}

/** Normalize a skill's cooldown to virtual ms (auto-fill from legacy rounds). */
export function getSkillCooldownMs(skill: RegisteredSkill): number {
  if (skill.cooldown <= 0) return 0;
  return Math.max(MIN_COOLDOWN_MS, Math.round(skill.cooldown * AVG_INTERVAL_MS));
}

/**
 * Stamp `remainingMs` on any status that doesn't yet have one (post applyStatus).
 * Permanent statuses (`remaining < 0`) are left alone — they're treated as
 * never-expiring by {@link processStatusTickAndDot}.
 */
function stampRemainingMs(unit: CombatUnit): CombatUnit {
  let dirty = false;
  const next: ActiveStatus[] = [];
  for (const s of unit.statuses) {
    if (s.remainingMs !== undefined || s.remaining < 0) {
      next.push(s);
      continue;
    }
    dirty = true;
    next.push({ ...s, remainingMs: Math.max(0, s.remaining * AVG_INTERVAL_MS) });
  }
  return dirty ? { ...unit, statuses: next } : unit;
}

function buildDamageInput(
  attacker: CombatUnit,
  defender: CombatUnit,
  effect: DamageEffect
): DamageInput {
  const combo = comboMultiplier(defender, effect.damageType);
  const stats = attacker.stats;
  return {
    baseMin: effect.base[0],
    baseMax: effect.base[1],
    flatBonus: 0,
    increasedPct: 0,
    comboMult: combo,
    type: effect.damageType,
    critChance: stats.critChance,
    critMult: stats.critDamage,
    defenderResistances: defender.stats.resistances,
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
  effect: DamageEffect
): void {
  const attacker = state.units.get(attackerId);
  const defender = state.units.get(defenderId);
  if (!attacker || !defender || !alive(defender)) return;

  const input = buildDamageInput(attacker, defender, effect);
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
              ...(dotPerStack !== undefined ? { dotPerStack } : {}),
              damageType: effect.damageType
            },
            state.rng
          );
        }
        updated = stampRemainingMs(updated);
        state.units.set(defenderId, updated);
        emit(state, { kind: 'status', target: defenderId, statusId: effect.applyStatus.id });
      }
    }
  }

  const after = state.units.get(defenderId);
  if (after && !alive(after)) {
    emit(state, { kind: 'death', target: defenderId });
    handleDeath(state, after);
  }
}

function handleDeath(state: State, dead: CombatUnit): void {
  // Remove from action schedule
  state.nextActionAt.delete(dead.id);

  if (hasStatus(dead, 'plague') || hasStatus(dead, 'poison')) {
    const sameSideAlive = [...state.units.values()].filter(
      (u) => u.side === dead.side && u.id !== dead.id && alive(u)
    );
    const updated = spreadPlague(dead, sameSideAlive, 0.5, state.rng);
    for (const u of updated) state.units.set(u.id, stampRemainingMs(u));
  }
  if (dead.side === 'enemy') {
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
}

function applyEffect(
  state: State,
  actorId: string,
  effect: SkillEffect,
  enemySideAlive: readonly CombatUnit[],
  allySideAlive: readonly CombatUnit[]
): void {
  switch (effect.kind) {
    case 'damage': {
      const targets = enemySideAlive.length === 0 ? [] : enemySideAlive;
      for (const t of targets) {
        applyDamageToUnit(state, actorId, t.id, effect);
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
        let updated = applyStatus(
          t,
          {
            id: effect.statusId,
            sourceId: actorId,
            ...(effect.duration !== undefined ? { duration: effect.duration } : {})
          },
          state.rng
        );
        updated = stampRemainingMs(updated);
        state.units.set(t.id, updated);
        emit(state, { kind: 'status', target: t.id, statusId: effect.statusId });
      }
      break;
    }
    case 'summon': {
      const actor = state.units.get(actorId);
      if (!actor) return;
      if (actor.summonedAdds) return;
      state.units.set(actorId, { ...actor, summonedAdds: true });
      emit(state, { kind: 'summon', owner: actorId, summonId: effect.summonId });
      break;
    }
    case 'heal': {
      const heal: HealEffect = effect;
      const targets =
        heal.target === 'self'
          ? [state.units.get(actorId)].filter((x): x is CombatUnit => !!x)
          : allySideAlive;
      for (const t of targets) {
        const amt = heal.amount ?? Math.floor(t.stats.lifeMax * (heal.pctOfMaxLife ?? 0));
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

  const newMana = Math.max(0, actor.mana - skill.manaCost);
  const cdMs = getSkillCooldownMs(skill);
  const newCooldowns = { ...actor.cooldowns, [skill.id]: cdMs };
  state.units.set(actorId, { ...actor, mana: newMana, cooldowns: newCooldowns });

  emit(state, { kind: 'action', actor: actorId, skillId: skill.id });

  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemies = aliveOf(state, enemySide);
  const allies = aliveOf(state, actor.side);

  let targetEnemies: CombatUnit[] = enemies;
  if (skill.target === 'single-enemy' && enemies.length > 0) {
    const firstEnemy = enemies[0];
    if (firstEnemy) targetEnemies = [firstEnemy];
  } else if (skill.target === 'area-enemies') {
    targetEnemies = enemies.slice(0, 2);
  }

  for (const effect of skill.effects) {
    applyEffect(state, actorId, effect, targetEnemies, allies);
  }
}

function basicAttack(state: State, actorId: string): void {
  const actor = state.units.get(actorId);
  if (!actor) return;
  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemies = aliveOf(state, enemySide);
  if (enemies.length === 0) return;
  const target = enemies[0];
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

function castSummonsOnStart(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || !alive(unit) || unit.summonedAdds) return;
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill?.summonOnStart) continue;
    castSkill(state, unitId, skill);
    break;
  }
}

/**
 * Tick the actor's status durations and apply DoT damage at integer
 * 500-ms boundaries crossed since last processed time. May emit `dot` and
 * `death` events.
 */
function processStatusTickAndDot(state: State, actorId: string): void {
  const unit = state.units.get(actorId);
  if (!unit || !alive(unit)) return;
  const lastTick = state.lastDotTickAt.get(actorId) ?? 0;
  const now = state.virtualTimeMs;
  state.lastDotTickAt.set(actorId, now);

  let updated = unit;
  const dotTicks =
    Math.floor(now / DOT_TICK_MS) - Math.floor(lastTick / DOT_TICK_MS);
  if (dotTicks > 0) {
    const { total } = dotDamageThisTick(updated);
    if (total > 0) {
      const damage = total * dotTicks;
      const newLife = Math.max(0, updated.life - damage);
      updated = { ...updated, life: newLife };
      state.units.set(actorId, updated);
      emit(state, { kind: 'dot', target: actorId, amount: damage });
    }
  }

  // Decrement remainingMs by elapsed ms; drop expired.
  const elapsed = Math.max(0, now - lastTick);
  if (elapsed > 0 && updated.statuses.length > 0) {
    const next: ActiveStatus[] = [];
    for (const s of updated.statuses) {
      if (s.remaining < 0) {
        next.push(s); // permanent
        continue;
      }
      const remMs = s.remainingMs ?? s.remaining * AVG_INTERVAL_MS;
      const nextRem = remMs - elapsed;
      if (nextRem > 0) next.push({ ...s, remainingMs: nextRem });
    }
    if (next.length !== updated.statuses.length || elapsed > 0) {
      updated = { ...updated, statuses: next };
      state.units.set(actorId, updated);
    }
  }

  if (!alive(updated)) {
    emit(state, { kind: 'death', target: actorId });
    handleDeath(state, updated);
  }
}

function decrementActorCooldowns(state: State, actorId: string): void {
  const unit = state.units.get(actorId);
  if (!unit) return;
  const last = state.lastActedAt.get(actorId) ?? 0;
  const elapsed = Math.max(0, state.virtualTimeMs - last);
  if (elapsed === 0 && Object.keys(unit.cooldowns).length === 0) return;
  const cds: Record<string, number> = {};
  for (const [k, v] of Object.entries(unit.cooldowns)) {
    const next = Math.max(0, v - elapsed);
    if (next > 0) cds[k] = next;
  }
  state.units.set(actorId, { ...unit, cooldowns: cds });
}

function checkEnrage(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || unit.enraged) return;
  if (shouldEnrage(unit, state.act)) {
    state.units.set(unitId, { ...unit, enraged: true });
    emit(state, { kind: 'enrage', target: unitId });
  }
}

/** Pick the next actor: min nextActionAt, ties broken by lex `id` ascending. */
function pickNextActor(state: State): { id: string; t: number } | null {
  let best: { id: string; t: number } | null = null;
  for (const [id, t] of state.nextActionAt) {
    const u = state.units.get(id);
    if (!u || !alive(u)) continue;
    if (best === null || t < best.t || (t === best.t && id < best.id)) {
      best = { id, t };
    }
  }
  return best;
}

function* drain(state: State): Generator<BattleEventWithTime, void, void> {
  while (state.pending.length > 0) {
    const ev = state.pending.shift();
    if (ev) yield ev;
  }
}

function buildResult(
  state: State,
  snapshot: CombatSnapshot,
  winner: CombatSide | null
): CombatResult {
  return {
    events: [],
    winner,
    playerTeam: snapshot.playerTeam.map((u) => state.units.get(u.id) ?? u),
    enemyTeam: snapshot.enemyTeam.map((u) => state.units.get(u.id) ?? u),
    rounds: Math.max(1, Math.ceil(state.virtualTimeMs / AVG_INTERVAL_MS)),
    virtualTimeMs: state.virtualTimeMs
  };
}

function maxVirtualMsOf(snapshot: CombatSnapshot): number {
  if (snapshot.maxVirtualMs !== undefined) return snapshot.maxVirtualMs;
  if (snapshot.maxRounds !== undefined) {
    return Math.max(1, snapshot.maxRounds * AVG_INTERVAL_MS);
  }
  return MAX_VIRTUAL_MS;
}

/**
 * Run a battle as a deterministic stream of {@link BattleEventWithTime}.
 *
 * Pulling the same generator with the same {@link CombatSnapshot} twice
 * yields byte-identical events, including their `virtualTimeMs` stamps.
 *
 * Final return value is the {@link CombatResult}.
 */
export function* runBattleStream(
  snapshot: CombatSnapshot
): Generator<BattleEventWithTime, CombatResult, void> {
  const state: State = {
    units: new Map(),
    pending: [],
    rng: createRng(snapshot.seed),
    act: snapshot.act ?? 1,
    virtualTimeMs: 0,
    nextActionAt: new Map(),
    lastDotTickAt: new Map(),
    lastActedAt: new Map()
  };
  for (const u of snapshot.playerTeam) state.units.set(u.id, u);
  for (const u of snapshot.enemyTeam) state.units.set(u.id, u);

  const cap = maxVirtualMsOf(snapshot);

  // Synthetic legacy turn-start at t=0 for backward-compat tests/UI hooks.
  emit(state, { kind: 'turn-start', turn: 1 });
  yield* drain(state);

  // Initialize per-unit nextActionAt (everyone "winds up" their first swing).
  for (const u of state.units.values()) {
    if (!alive(u)) continue;
    state.nextActionAt.set(u.id, getAttackIntervalMs(u));
  }

  // Summon-on-start at t=0, deterministic lex order.
  const startIds = [...state.units.keys()].sort();
  for (const id of startIds) {
    castSummonsOnStart(state, id);
    yield* drain(state);
  }

  // Initial winner check (e.g. one side starts empty).
  {
    const w = winnerOf(state);
    if (w !== null || state.units.size === 0) {
      emit(state, { kind: 'end', winner: w });
      yield* drain(state);
      return buildResult(state, snapshot, w);
    }
  }

  // Main scheduler loop.
  for (;;) {
    const next = pickNextActor(state);
    if (next === null) {
      // No actor can act — end as draw / current side.
      const w = winnerOf(state);
      emit(state, { kind: 'end', winner: w });
      yield* drain(state);
      return buildResult(state, snapshot, w);
    }

    if (next.t > cap) {
      state.virtualTimeMs = cap;
      emit(state, { kind: 'end', winner: null });
      yield* drain(state);
      return buildResult(state, snapshot, null);
    }

    state.virtualTimeMs = next.t;
    const actorId = next.id;

    // 1) Status durations + DoT for actor.
    processStatusTickAndDot(state, actorId);

    // 2) Decrement actor's cooldowns by elapsed since their last action.
    decrementActorCooldowns(state, actorId);

    const actorAfterTick = state.units.get(actorId);
    if (actorAfterTick && alive(actorAfterTick)) {
      if (isStunned(actorAfterTick) || isImmobilized(actorAfterTick)) {
        emit(state, { kind: 'stunned', target: actorId });
      } else {
        const enemySide: CombatSide = actorAfterTick.side === 'player' ? 'enemy' : 'player';
        const hasEnemy = aliveOf(state, enemySide).length > 0;
        const skillId = chooseSkill(actorAfterTick, hasEnemy);
        if (skillId !== undefined) {
          const skill = getSkill(skillId);
          if (skill) {
            castSkill(state, actorId, skill);
          } else {
            basicAttack(state, actorId);
          }
        } else {
          basicAttack(state, actorId);
        }
      }
      checkEnrage(state, actorId);

      // Reschedule actor (if still alive — thorns / reflective damage may have
      // killed them). Skill `castTimeMs` future-hook supported via the
      // skill registry; basic skills use the actor's swing interval.
      const stillAlive = state.units.get(actorId);
      if (stillAlive && alive(stillAlive)) {
        const interval = getAttackIntervalMs(stillAlive);
        const push = Math.max(MIN_INTERVAL_MS, interval);
        state.nextActionAt.set(actorId, state.virtualTimeMs + push);
        state.lastActedAt.set(actorId, state.virtualTimeMs);
      } else {
        state.nextActionAt.delete(actorId);
      }
    } else {
      // Actor died (DoT) — already removed via handleDeath.
      state.nextActionAt.delete(actorId);
    }

    // Flush events from this step.
    yield* drain(state);

    // Terminal check.
    const w = winnerOf(state);
    if (w !== null) {
      emit(state, { kind: 'end', winner: w });
      yield* drain(state);
      return buildResult(state, snapshot, w);
    }
  }
}

/**
 * Run a battle to completion and return the legacy {@link CombatResult}
 * (events buffered, plus winner/teams/rounds). Pure wrapper around
 * {@link runBattleStream}.
 */
export function runBattle(snapshot: CombatSnapshot): CombatResult {
  const events: BattleEventWithTime[] = [];
  const it = runBattleStream(snapshot);
  for (;;) {
    const r = it.next();
    if (r.done) {
      return { ...r.value, events };
    }
    events.push(r.value);
  }
}

/**
 * Deterministic battle runner.
 *
 * Pure: same initial state + same seed → same event log.
 *
 * Turn structure (per side, per round, in `turnOrder`):
 *  1. If unit dead → skip.
 *  2. Tick cooldowns and DoT damage and statuses.
 *  3. Cast summon-on-start skills once (round 1 only).
 *  4. If stunned → emit `stunned`, skip action.
 *  5. Pick action via priority: first ready+affordable+valid skill, else basic attack.
 *  6. Apply effects (damage, buff, debuff, summon, heal).
 *  7. Check deaths; trigger plague spread; emit orb drops.
 *
 * The runner does **not** roll loot; the caller does that on combat resolution.
 *
 * @module engine/combat/combat
 */

import type { Rng } from '../rng';
import { createRng } from '../rng';
import type { CombatUnit, CombatSide } from './types';
import { resolveDamage, type DamageInput } from './damage';
import {
  applyStatus,
  tickStatuses,
  hasStatus,
  isStunned,
  spreadPlague,
  dotDamageThisTick
} from './status';
import { comboMultiplier } from './combo';
import { rollOrbDrops, applyOrbs, type Orb } from './orbs';
import { calculateTurnOrder } from '../turn-order';
import { chooseSkill, isImmobilized, shouldEnrage } from '../ai/policy';
import { getSkill } from '../skills/registry';
import type {
  RegisteredSkill,
  SkillEffect,
  DamageEffect,
  BuffEffect,
  SummonEffect,
  HealEffect
} from '../skills/effects';

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
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly rounds: number;
}

interface State {
  units: Map<string, CombatUnit>;
  events: BattleEvent[];
  rng: Rng;
  act: 1 | 2 | 3 | 4 | 5;
}

function alive(u: CombatUnit): boolean {
  return u.life > 0;
}

function emit(state: State, ev: BattleEvent): void {
  state.events.push(ev);
}

function aliveOf(state: State, side: CombatSide): CombatUnit[] {
  const out: CombatUnit[] = [];
  for (const u of state.units.values()) if (u.side === side && alive(u)) out.push(u);
  return out;
}

/** Compute damage with combo lookup applied. */
function buildDamageInput(
  attacker: CombatUnit,
  defender: CombatUnit,
  effect: DamageEffect,
  baseFlatBonus = 0
): DamageInput {
  const combo = comboMultiplier(defender, effect.damageType);
  const stats = attacker.stats;
  return {
    baseMin: effect.base[0],
    baseMax: effect.base[1],
    flatBonus: baseFlatBonus,
    increasedPct: 0,
    comboMult: combo,
    type: effect.damageType,
    critChance: stats.critChance,
    critMult: stats.critDamage,
    defenderResistances: defender.stats.resistances,
    defenderArmor: defender.stats.defense,
    defenderMagicResist: defender.stats.defense, // unified — caller can split via custom stat
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

  // Apply on-hit status
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
        state.units.set(defenderId, updated);
        emit(state, { kind: 'status', target: defenderId, statusId: effect.applyStatus.id });
      }
    }
  }

  // Death
  const after = state.units.get(defenderId);
  if (after && !alive(after)) {
    emit(state, { kind: 'death', target: defenderId });
    handleDeath(state, after);
  }
}

function handleDeath(state: State, dead: CombatUnit): void {
  // Plague spread
  if (hasStatus(dead, 'plague') || hasStatus(dead, 'poison')) {
    const sameSideAlive = [...state.units.values()].filter(
      (u) => u.side === dead.side && u.id !== dead.id && alive(u)
    );
    const updated = spreadPlague(dead, sameSideAlive, 0.5, state.rng);
    for (const u of updated) state.units.set(u.id, u);
  }
  // Orb drops (only enemy deaths reward player team)
  if (dead.side === 'enemy') {
    const orbs = rollOrbDrops(dead.tier, state.rng);
    const players = aliveOf(state, 'player');
    if (players.length > 0 && orbs.length > 0) {
      // Apply each orb to all alive players (D3-style)
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
      // Pick targets
      const skill = effect; // narrowing
      const targets: readonly CombatUnit[] =
        enemySideAlive.length === 0 ? [] : enemySideAlive;
      // Use first target for single, all for area/all
      // Caller (cast) decides single vs area via the skill.target and slices accordingly.
      for (const t of targets) {
        applyDamageToUnit(state, actorId, t.id, skill);
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
            ...(effect.duration !== undefined ? { duration: effect.duration } : {})
          },
          state.rng
        );
        state.units.set(t.id, updated);
        emit(state, { kind: 'status', target: t.id, statusId: effect.statusId });
      }
      break;
    }
    case 'summon': {
      const actor = state.units.get(actorId);
      if (!actor) return;
      // If summon-on-start gating is on, only fire once.
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
        const amt =
          heal.amount ??
          Math.floor(t.stats.lifeMax * (heal.pctOfMaxLife ?? 0));
        const newLife = Math.min(t.stats.lifeMax, t.life + amt);
        state.units.set(t.id, { ...t, life: newLife });
        emit(state, { kind: 'heal', target: t.id, amount: amt });
      }
      break;
    }
  }
}

function castSkill(
  state: State,
  actorId: string,
  skill: RegisteredSkill
): void {
  const actor = state.units.get(actorId);
  if (!actor) return;

  // Pay cost & start CD
  const newMana = Math.max(0, actor.mana - skill.manaCost);
  const newCooldowns = { ...actor.cooldowns, [skill.id]: skill.cooldown };
  state.units.set(actorId, { ...actor, mana: newMana, cooldowns: newCooldowns });

  emit(state, { kind: 'action', actor: actorId, skillId: skill.id });

  const enemySide: CombatSide = actor.side === 'player' ? 'enemy' : 'player';
  const enemies = aliveOf(state, enemySide);
  const allies = aliveOf(state, actor.side);

  // Slice targets per skill.target
  let targetEnemies: CombatUnit[] = enemies;
  if (skill.target === 'single-enemy' && enemies.length > 0) {
    const firstEnemy = enemies[0];
    if (firstEnemy) targetEnemies = [firstEnemy];
  } else if (skill.target === 'area-enemies') {
    // First two enemies (a "splash")
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
  const stats = actor.stats;
  const baseAttack = Math.max(1, Math.floor(stats.attack));
  const effect: DamageEffect = {
    kind: 'damage',
    damageType: 'physical',
    base: [baseAttack, baseAttack]
  };
  applyDamageToUnit(state, actorId, target.id, effect);
}

function tickUnit(state: State, unitId: string): void {
  const before = state.units.get(unitId);
  if (!before || !alive(before)) return;

  // Cooldowns -1
  const cds: Record<string, number> = {};
  for (const [k, v] of Object.entries(before.cooldowns)) {
    if (v - 1 > 0) cds[k] = v - 1;
  }
  let unit: CombatUnit = { ...before, cooldowns: cds };

  // DoT damage application
  const { total } = dotDamageThisTick(unit);
  if (total > 0) {
    const newLife = Math.max(0, unit.life - total);
    unit = { ...unit, life: newLife };
    emit(state, { kind: 'dot', target: unitId, amount: total });
    if (newLife <= 0) {
      state.units.set(unitId, unit);
      emit(state, { kind: 'death', target: unitId });
      handleDeath(state, unit);
      return;
    }
  }

  // Tick statuses (decrement durations)
  unit = tickStatuses(unit);
  state.units.set(unitId, unit);
}

function castSummonsOnStart(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || unit.summonedAdds) return;
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill?.summonOnStart) continue;
    castSkill(state, unitId, skill);
    break;
  }
}

function takeAction(state: State, unitId: string): void {
  const unit = state.units.get(unitId);
  if (!unit || !alive(unit)) return;

  if (isStunned(unit) || isImmobilized(unit)) {
    emit(state, { kind: 'stunned', target: unitId });
    return;
  }

  const enemySide: CombatSide = unit.side === 'player' ? 'enemy' : 'player';
  const hasEnemy = aliveOf(state, enemySide).length > 0;
  const skillId = chooseSkill(unit, hasEnemy);
  if (skillId) {
    const skill = getSkill(skillId);
    if (skill) {
      castSkill(state, unitId, skill);
      return;
    }
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
  const playersAlive = aliveOf(state, 'player').length > 0;
  const enemiesAlive = aliveOf(state, 'enemy').length > 0;
  if (playersAlive && !enemiesAlive) return 'player';
  if (!playersAlive && enemiesAlive) return 'enemy';
  if (!playersAlive && !enemiesAlive) return null;
  return null;
}

/**
 * Run a deterministic battle.
 * Returns events in the exact order they occurred.
 *
 * Determinism contract: same {@link CombatSnapshot} (same seed, same starting
 * units, same skill registry) ⇒ same {@link CombatResult.events}.
 */
export function runBattle(snapshot: CombatSnapshot): CombatResult {
  const state: State = {
    units: new Map(),
    events: [],
    rng: createRng(snapshot.seed),
    act: snapshot.act ?? 1
  };
  for (const u of snapshot.playerTeam) state.units.set(u.id, u);
  for (const u of snapshot.enemyTeam) state.units.set(u.id, u);

  const maxRounds = snapshot.maxRounds ?? 100;

  // Initial summon-on-start phase (all units, in turn order)
  const startSpeeds = [...state.units.values()].map((u) => ({
    id: u.id,
    attackSpeed: u.stats.attackSpeed
  }));
  const startOrder = calculateTurnOrder(startSpeeds, state.rng);
  for (const id of startOrder) castSummonsOnStart(state, id);

  let rounds = 0;
  for (let round = 0; round < maxRounds; round++) {
    rounds = round + 1;
    emit(state, { kind: 'turn-start', turn: rounds });

    // Compute turn order from CURRENT alive units
    const speeds = [...state.units.values()]
      .filter(alive)
      .map((u) => ({ id: u.id, attackSpeed: u.stats.attackSpeed }));
    const order = calculateTurnOrder(speeds, state.rng);

    for (const id of order) {
      tickUnit(state, id);
      checkEnrage(state, id);
      if (winnerOf(state) !== null && aliveOf(state, 'player').length === 0) break;
      if (aliveOf(state, 'enemy').length === 0) break;
      takeAction(state, id);
      const w = winnerOf(state);
      if (w !== null) break;
    }

    const w = winnerOf(state);
    if (w !== null) {
      emit(state, { kind: 'end', winner: w });
      return {
        events: state.events,
        winner: w,
        playerTeam: snapshot.playerTeam.map((u) => state.units.get(u.id) ?? u),
        enemyTeam: snapshot.enemyTeam.map((u) => state.units.get(u.id) ?? u),
        rounds
      };
    }
  }

  emit(state, { kind: 'end', winner: null });
  return {
    events: state.events,
    winner: null,
    playerTeam: snapshot.playerTeam.map((u) => state.units.get(u.id) ?? u),
    enemyTeam: snapshot.enemyTeam.map((u) => state.units.get(u.id) ?? u),
    rounds
  };
}

// Re-export for downstream consumers needing types.
export type { BuffEffect, SummonEffect };

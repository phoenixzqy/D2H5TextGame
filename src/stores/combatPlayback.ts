/**
 * Combat playback helpers — pure functions to step team state forward
 * one recorded event at a time. Lives outside the engine because it
 * deals with UI-shaped state (the store's `playerTeam` / `enemyTeam`).
 *
 * @module stores/combatPlayback
 */
import type { BattleEvent, RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';

/** Battle-local presentation authority; never part of a save or engine input. */
export interface StatusPlaybackState {
  readonly byId: ReadonlyMap<string, readonly ActiveStatus[]>;
  readonly deadIds: readonly string[];
}

function copyStatuses(statuses: readonly ActiveStatus[]): ActiveStatus[] {
  return statuses.map(s => ({ ...s, ...(s.tags !== undefined ? { tags: [...s.tags] } : {}) }));
}

/** Validate the complete explicit initial prefix without consuming any event. */
export function stageStatusPlayback(
  playerTeam: readonly CombatUnit[],
  enemyTeam: readonly CombatUnit[],
  events: readonly RecordedBattleEvent[]
): StatusPlaybackState | null {
  if (!events.some(ev => ev.kind === 'status-state')) return null;
  const units = new Map([...playerTeam, ...enemyTeam].map(u => [u.id, u]));
  const byId = new Map<string, readonly ActiveStatus[]>();
  const deadIds: string[] = [];
  const first = events[0];
  let index = first?.kind === 'message' && first.messageKey === 'combat:bossIntro' ? 1 : 0;
  for (const [id, unit] of units) {
    const ev = events[index++];
    if (ev?.kind !== 'status-state' || ev.initial !== true || ev.simClockMs !== 0 || ev.target !== id) {
      throw new Error('Malformed recorded status initial prefix');
    }
    if (!(unit.life > 0)) deadIds.push(id);
    byId.set(id, deadIds.includes(id) ? [] : copyStatuses(ev.statuses));
  }
  for (; index < events.length; index++) {
    const ev = events[index];
    if (ev?.kind === 'status-state' && ev.initial === true) {
      throw new Error('Unexpected later initial status observation');
    }
  }
  return { byId, deadIds };
}

function presentStatuses(unit: CombatUnit, state: StatusPlaybackState): CombatUnit {
  return { ...unit, statuses: unit.life > 0 && !state.deadIds.includes(unit.id)
    ? copyStatuses(state.byId.get(unit.id) ?? []) : [] };
}

/** Overlay copied last observations by ID, retaining every nonstatus field. */
export function overlayStatusPresentation(
  team: readonly CombatUnit[], state: StatusPlaybackState
): CombatUnit[] {
  return team.map(unit => presentStatuses(unit, state));
}

function replaceTargetStatuses(
  team: readonly CombatUnit[], target: string, state: StatusPlaybackState
): readonly CombatUnit[] {
  return team.some(u => u.id === target)
    ? team.map(u => u.id === target ? presentStatuses(u, state) : u) : team;
}

/** Result of advancing teams by a single event. */
export interface PlaybackStepResult {
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly statusPlayback?: StatusPlaybackState;
}

function patchUnit(
  teams: { player: readonly CombatUnit[]; enemy: readonly CombatUnit[] },
  id: string,
  patch: (u: CombatUnit) => CombatUnit
): { player: readonly CombatUnit[]; enemy: readonly CombatUnit[] } {
  let p = teams.player;
  let e = teams.enemy;
  const pIdx = p.findIndex((u) => u.id === id);
  if (pIdx !== -1) {
    const u = p[pIdx];
    if (u) {
      const next = patch(u);
      p = [...p.slice(0, pIdx), next, ...p.slice(pIdx + 1)];
    }
  } else {
    const eIdx = e.findIndex((u) => u.id === id);
    if (eIdx !== -1) {
      const u = e[eIdx];
      if (u) {
        const next = patch(u);
        e = [...e.slice(0, eIdx), next, ...e.slice(eIdx + 1)];
      }
    }
  }
  return { player: p, enemy: e };
}

/**
 * Apply a single recorded {@link BattleEvent} to the given teams,
 * returning immutable resource/buff updates and copied authoritative status
 * observations when supplied. Statuses are never inferred from cues or clocks.
 * Omitted authority preserves the legacy helper result and death behavior.
 */
export function applyEventToTeams(
  playerTeam: readonly CombatUnit[],
  enemyTeam: readonly CombatUnit[],
  ev: BattleEvent,
  statusPlayback?: StatusPlaybackState | null
): PlaybackStepResult {
  let teams = { player: playerTeam, enemy: enemyTeam };

  switch (ev.kind) {
    case 'stats-state': {
      teams = patchUnit(teams, ev.target, (unit) => {
        const { vigorLife: _previous, manaCapacity: _mana, manaRegenCarry: _carry,
          manaRegenCompensation: _compensation, manaRegenExactCarry: _exact, ...base } = unit;
        return { ...base, ...ev.state };
      });
      break;
    }
    case 'life-capacity': {
      teams = patchUnit(teams, ev.target, (unit) => {
        const { vigorLife: _previous, ...base } = unit;
        const { druidForm: _form, druidFormLife: _capacity, ...human } = base;
        return { ...(ev.druidFormState !== undefined ? { ...human, ...ev.druidFormState } : base),
          stats: { ...base.stats, lifeMax: ev.lifeMax }, life: ev.life,
          ...(ev.vigorBaseLifeMax !== undefined
            ? { vigorLife: { baseLifeMax: ev.vigorBaseLifeMax, appliedLifeMax: ev.lifeMax } } : {}) };
      });
      break;
    }
    case 'mana-capacity': {
      teams = patchUnit(teams, ev.target, unit => {
        const { manaCapacity: _mana, manaRegenCarry: _carry, manaRegenCompensation: _compensation,
          manaRegenExactCarry: _exact, ...base } = unit;
        return { ...base, stats: { ...base.stats, manaMax: ev.manaMax }, ...ev.state };
      });
      break;
    }
    case 'mana': {
      teams = patchUnit(teams, ev.target, (u) => ({ ...u, mana: ev.mana }));
      break;
    }
    case 'damage': {
      if (ev.dodged) break;
      teams = patchUnit(teams, ev.target, (u) => ({
        ...u,
        life: Math.max(0, u.life - ev.amount)
      }));
      break;
    }
    case 'dot': {
      teams = patchUnit(teams, ev.target, (u) => ({
        ...u,
        life: Math.max(0, u.life - ev.amount)
      }));
      break;
    }
    case 'heal': {
      teams = patchUnit(teams, ev.target, (u) => ({
        ...u,
        life: Math.min(u.stats.lifeMax, u.life + ev.amount)
      }));
      break;
    }
    case 'death': {
      teams = patchUnit(teams, ev.target, (u) => ({ ...u, life: 0 }));
      if (statusPlayback?.byId.has(ev.target)) {
        const byId = new Map(statusPlayback.byId);
        const deadIds = statusPlayback.deadIds.includes(ev.target)
          ? statusPlayback.deadIds : [...statusPlayback.deadIds, ev.target];
        byId.set(ev.target, []);
        statusPlayback = { byId, deadIds };
        teams = {
          player: replaceTargetStatuses(teams.player, ev.target, statusPlayback),
          enemy: replaceTargetStatuses(teams.enemy, ev.target, statusPlayback)
        };
      }
      break;
    }
    case 'buff': {
      if (ev.statusBacked) break;
      teams = patchUnit(teams, ev.target, (u) =>
        u.activeBuffIds.includes(ev.buffId)
          ? u
          : { ...u, activeBuffIds: [...u.activeBuffIds, ev.buffId] }
      );
      break;
    }
    case 'status':
      break;
    case 'status-state': {
      if (!statusPlayback?.byId.has(ev.target) || statusPlayback.deadIds.includes(ev.target)) break;
      const byId = new Map(statusPlayback.byId);
      byId.set(ev.target, copyStatuses(ev.statuses));
      statusPlayback = { byId, deadIds: statusPlayback.deadIds };
      teams = {
        player: replaceTargetStatuses(teams.player, ev.target, statusPlayback),
        enemy: replaceTargetStatuses(teams.enemy, ev.target, statusPlayback)
      };
      break;
    }
    case 'summon': {
      const exists =
        teams.player.some((u) => u.id === ev.unit.id) ||
        teams.enemy.some((u) => u.id === ev.unit.id);
      if (!exists) {
        const unit = statusPlayback ? { ...ev.unit, statuses: [] } : ev.unit;
        if (statusPlayback) {
          const byId = new Map(statusPlayback.byId);
          const deadIds = !(unit.life > 0) && !statusPlayback.deadIds.includes(unit.id)
            ? [...statusPlayback.deadIds, unit.id] : statusPlayback.deadIds;
          byId.set(unit.id, []);
          statusPlayback = { byId, deadIds };
        }
        if (ev.unit.side === 'player') {
          teams = { player: [...teams.player, unit], enemy: teams.enemy };
        } else {
          teams = { player: teams.player, enemy: [...teams.enemy, unit] };
        }
      }
      break;
    }
    case 'enrage': {
      teams = patchUnit(teams, ev.target, (u) => ({ ...u, enraged: true }));
      break;
    }
    default:
      break;
  }

  return { playerTeam: teams.player, enemyTeam: teams.enemy,
    ...(statusPlayback ? { statusPlayback } : {}) };
}

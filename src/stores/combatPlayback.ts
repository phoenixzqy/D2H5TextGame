/**
 * Combat playback helpers — pure functions to step team state forward
 * one recorded event at a time. Lives outside the engine because it
 * deals with UI-shaped state (the store's `playerTeam` / `enemyTeam`).
 *
 * @module stores/combatPlayback
 */
import type { BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';

/** Result of advancing teams by a single event. */
export interface PlaybackStepResult {
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
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
 * returning new arrays (immutable). Only HP / buff-list deltas are
 * tracked — full simulation lives in the engine; this is just enough
 * for the UI to animate progressive depletion of HP bars.
 */
export function applyEventToTeams(
  playerTeam: readonly CombatUnit[],
  enemyTeam: readonly CombatUnit[],
  ev: BattleEvent
): PlaybackStepResult {
  let teams = { player: playerTeam, enemy: enemyTeam };

  switch (ev.kind) {
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
      break;
    }
    case 'buff': {
      teams = patchUnit(teams, ev.target, (u) =>
        u.activeBuffIds.includes(ev.buffId)
          ? u
          : { ...u, activeBuffIds: [...u.activeBuffIds, ev.buffId] }
      );
      break;
    }
    case 'summon': {
      const exists =
        teams.player.some((u) => u.id === ev.unit.id) ||
        teams.enemy.some((u) => u.id === ev.unit.id);
      if (!exists) {
        if (ev.unit.side === 'player') {
          teams = { player: [...teams.player, ev.unit], enemy: teams.enemy };
        } else {
          teams = { player: teams.player, enemy: [...teams.enemy, ev.unit] };
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

  return { playerTeam: teams.player, enemyTeam: teams.enemy };
}

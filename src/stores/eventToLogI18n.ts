/**
 * i18n-aware combat-event → log-entry conversion.
 *
 * Single source of truth used by both {@link battleEventToLogEntry}
 * (legacy synchronous helper, mostly for tests) and the live combat
 * playback in {@link useCombatStore}. Pulls translations directly off
 * the i18next singleton because zustand stores are outside the React
 * tree and cannot use the `useTranslation` hook.
 *
 * @module stores/eventToLogI18n
 */

import i18n from '@/i18n';
import type { BattleEvent, RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatLogEntry, UnitNameMap } from './combatStore';

type LogPayload = Omit<CombatLogEntry, 'id' | 'timestamp'>;

function tx(key: string, opts?: Record<string, unknown>): string {
  // i18next is initialized at app startup; in tests it's available too.
  return opts !== undefined ? i18n.t(key, opts) : i18n.t(key);
}

function damageTypeLabel(type: string | undefined): string {
  if (!type) return '';
  return tx(`combat:damageType.${type}`, { defaultValue: type });
}

/**
 * Convert a battle event (recorded or live) to a localized log entry.
 *
 * Returns null for events that should not appear in the visible log.
 */
export function eventToLocalizedLogEntry(
  event: BattleEvent | RecordedBattleEvent,
  unitMap?: UnitNameMap
): LogPayload | null {
  const getName = (id: string): string => unitMap?.get(id) ?? id;

  switch (event.kind) {
    case 'turn-start':
      return {
        type: 'system',
        actorId: 'system',
        actorName: tx('combat:event.system', { defaultValue: 'System' }),
        message: tx('combat:event.turnStart', {
          turn: event.turn,
          defaultValue: `Turn ${String(event.turn)} starts`
        })
      };
    case 'action': {
      const actorName = getName(event.actor);
      if (event.skillId) {
        // Translate the skill id (e.g. `barbarian.bash`) to its
        // localized name (e.g. `重击`). Skill names live under the
        // `skills:` namespace as `<class>.<skill>.name`. Falls back to
        // the raw id when no translation exists so the engine never
        // ships an empty log line.
        const skillName = i18n.t(`skills:${event.skillId}.name`, {
          defaultValue: event.skillId
        });
        return {
          type: 'skill',
          actorId: event.actor,
          actorName,
          message: tx('combat:event.skillCast', {
            actor: actorName,
            skill: skillName,
            defaultValue: `${actorName} casts ${skillName}`
          })
        };
      }
      return {
        type: 'skill',
        actorId: event.actor,
        actorName,
        message: tx('combat:event.basicAction', {
          actor: actorName,
          defaultValue: `${actorName} attacks`
        })
      };
    }
    case 'damage': {
      const sourceName = getName(event.source);
      const targetName = getName(event.target);
      const type = damageTypeLabel(event.damageType);
      const params = {
        actor: sourceName,
        target: targetName,
        amount: event.amount,
        type
      };
      let key: string;
      if (event.dodged) key = 'combat:event.dodge';
      else if (event.crit) key = 'combat:event.basicAttackCrit';
      else key = 'combat:event.basicAttack';
      return {
        type: 'damage',
        actorId: event.source,
        actorName: sourceName,
        targetId: event.target,
        targetName,
        message: tx(key, params),
        value: event.amount
      };
    }
    case 'death': {
      const targetName = getName(event.target);
      return {
        type: 'death',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.death', { target: targetName })
      };
    }
    case 'heal': {
      const targetName = getName(event.target);
      return {
        type: 'heal',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.heal', {
          target: targetName,
          amount: event.amount,
          defaultValue: `${targetName} heals for ${String(event.amount)}`
        }),
        value: event.amount
      };
    }
    case 'buff': {
      const targetName = getName(event.target);
      return {
        type: 'buff',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.buffApplied', {
          target: targetName,
          buff: event.buffId,
          defaultValue: `${targetName} gains ${event.buffId}`
        })
      };
    }
    case 'status': {
      const targetName = getName(event.target);
      return {
        type: 'debuff',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.statusApplied', {
          target: targetName,
          status: event.statusId,
          defaultValue: `${targetName} is afflicted with ${event.statusId}`
        })
      };
    }
    case 'stunned': {
      const targetName = getName(event.target);
      return {
        type: 'system',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.stunned', {
          target: targetName,
          defaultValue: `${targetName} is stunned`
        })
      };
    }
    case 'dot': {
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.target,
        actorName: targetName,
        message: tx('combat:event.dotTick', {
          target: targetName,
          amount: event.amount,
          defaultValue: `${targetName} takes ${String(event.amount)} DoT damage`
        }),
        value: event.amount
      };
    }
    case 'summon': {
      const ownerName = getName(event.owner);
      return {
        type: 'system',
        actorId: event.owner,
        actorName: ownerName,
        message: tx('combat:event.summon', {
          actor: ownerName,
          minion: event.unit.name
        })
      };
    }
    case 'end':
      if (event.winner === 'player') {
        return {
          type: 'system',
          actorId: 'system',
          actorName: tx('combat:event.system', { defaultValue: 'System' }),
          message: tx('combat:event.victory')
        };
      }
      if (event.winner === 'enemy') {
        return {
          type: 'system',
          actorId: 'system',
          actorName: tx('combat:event.system', { defaultValue: 'System' }),
          message: tx('combat:event.defeat')
        };
      }
      return {
        type: 'system',
        actorId: 'system',
        actorName: tx('combat:event.system', { defaultValue: 'System' }),
        message: tx('combat:event.draw', {
          defaultValue: 'Battle ended in a draw'
        })
      };
    default:
      return null;
  }
}

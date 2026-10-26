import { effectiveSide, opponentsOf, type AllegianceContext } from './allegiance';
import { activeTargetCurse } from './target-curse-definition';
import type { CombatUnit } from './types';

/**
 * Candidates for a newly acquired offensive target, separate from allegiance/support.
 * A live other Attract bait wins in original registration order; Confuse otherwise
 * offers live hostile comrades. Empty redirected pools preserve ordinary targeting.
 * The caller retains its existing seeded defender selection without an extra roll.
 */
export function attackCandidates(context: AllegianceContext, actor: CombatUnit): CombatUnit[] {
  const hostileEnemy = (unit: CombatUnit): boolean => unit.life > 0 &&
    unit.side === 'enemy' && effectiveSide(context, unit) === 'enemy';
  if (hostileEnemy(actor)) {
    const comrades = [...context.units.values()].filter(unit => unit.id !== actor.id && hostileEnemy(unit));
    const bait = comrades.find(unit => activeTargetCurse(unit, 'attract', context.simClockMs));
    if (bait) return [bait];
    if (comrades.length > 0 && activeTargetCurse(actor, 'confuse', context.simClockMs)) return comrades;
  }
  return opponentsOf(context, actor);
}

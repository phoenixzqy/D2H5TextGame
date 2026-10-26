import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import { projectPlayerClassActives } from './player-class-actives';
import { periodicSpellCanonicalId, periodicSpellDataId } from './periodic-spells';

/** Native learned eligibility is independent of selection and of carried paid rank. */
export function composePeriodicSpellRanks(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): NonNullable<CombatUnit['periodicSpellRanks']> {
  const rank = (id: 'inferno' | 'fire-wall' | 'thunder-storm') => {
    const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
      skillOrder: [periodicSpellDataId(id)], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
    return projected.skillOrder.length === 1 ? projected.skillLevels?.[periodicSpellCanonicalId(id)] ?? 0 : 0;
  };
  return Object.freeze({ inferno: rank('inferno'), 'fire-wall': rank('fire-wall'), 'thunder-storm': rank('thunder-storm') });
}

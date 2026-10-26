import rows from '../../data/skills/necromancer.json';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { BONE_PRISON_DEFINITION, BONE_PRISON_IDS, isBonePrisonDefinition } from '../combat/bone-prison-definition';
import { projectPlayerClassActives } from './player-class-actives';

const matches = rows.filter(row => row.id === BONE_PRISON_IDS[0]);
const row = matches[0];
if (matches.length !== 1 || !row || !isBonePrisonDefinition(row))
  throw new Error('Invalid authored Bone Prison cast');
const cast = Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
  manaCost: row.cost.mana, cooldown: row.cooldown, costPerRank: row.scaling.costPerLevel ?? 0,
  cooldownPerRank: row.scaling.cooldownPerLevel ?? 0 });

/** Resolve actual class allocation and all transitive prerequisites before native entry. */
export function composeBonePrisonRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [BONE_PRISON_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[BONE_PRISON_IDS[1]] ?? 0 : 0;
}

/** A living original hero needs explicit native learned authority; a combo supplies none. */
export function bonePrisonRank(unit: CombatUnit): number {
  const rank = unit.bonePrisonRank;
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) && unit.level >= cast.requiredLevel &&
    typeof rank === 'number' && Number.isInteger(rank) && rank > 0 && rank <= cast.maxRank ? rank : 0;
}

/** Refuse contradictory registry replacements before any mana, cooldown or trap is committed. */
export function matchesBonePrison(skill: RegisteredSkill): boolean {
  const effect = skill.effects[0];
  return skill.id === BONE_PRISON_IDS[1] && skill.archetype === 'necromancer' &&
    skill.trigger === 'active' && skill.target === 'all-enemies' && skill.isBuff !== true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === cast.requiredLevel &&
    skill.manaCost === cast.manaCost && skill.cooldown === cast.cooldown &&
    skill.manaCostPerRank === cast.costPerRank && skill.cooldownPerRank === cast.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'debuff' && effect.statusId === 'bone-prison' &&
    effect.bonePrison === true && effect.durationMs === BONE_PRISON_DEFINITION.durationMs &&
    Object.keys(effect).every(key => ['kind', 'statusId', 'bonePrison', 'durationMs'].includes(key));
}

import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from '../skills/skill-validator';

export const BONE_WALL_IDS = ['skills-necromancer-bone-wall', 'necromancer.bone_wall'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate the complete authored personal barrier contract before granting paid power. */
export function isBoneWallDefinition(source: unknown): source is SkillDef & { readonly requiredLevel: number } {
  return validate(source) && source.id === BONE_WALL_IDS[0];
}
/** Copy finite tuning and cast requirements independently of caller mutations. */
export function resolveBoneWallDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === BONE_WALL_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !isBoneWallDefinition(row) || !row.boneWall ||
    row.cost.mana === undefined || row.scaling === undefined)
    throw new Error('Invalid authored Bone Wall');
  return Object.freeze({ ...row.boneWall, requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    manaCost: row.cost.mana, cooldown: row.cooldown, costPerRank: row.scaling.costPerLevel ?? 0,
    cooldownPerRank: row.scaling.cooldownPerLevel ?? 0 });
}
/** Immutable personal barrier tuning, shared by runtime and truthful previews. */
export const BONE_WALL_DEFINITION = resolveBoneWallDefinition(rows);

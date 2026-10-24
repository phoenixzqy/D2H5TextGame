import { createSkillValidator } from './skill-validator';
import sorceressSkills from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';

/** Independent authored potency used by the shared pre-hit defense projection. */
export interface MeteorArmorMeltDefinition {
  readonly statusId: 'armor-melt';
  readonly defenseReductionPct: number;
  readonly durationMs: number;
}

const validate = createSkillValidator<SkillDef>();

/** Validate one exact authored Meteor row and copy its immutable Melt definition. */
export function resolveMeteorArmorMelt(rows: readonly unknown[]): MeteorArmorMeltDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-sorceress-meteor');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Meteor Armor Melt skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Meteor Armor Melt skill');
  const metadata = row.additionalStatusEffects?.['armor-melt'];
  if (!metadata) throw new Error('Missing authored Meteor Armor Melt metadata');
  return Object.freeze({ statusId: 'armor-melt',
    defenseReductionPct: metadata.defenseReductionPct, durationMs: metadata.durationMs });
}

/** JSON-derived values copied independently of the mutable catalog and registry. */
export const METEOR_ARMOR_MELT_DEFINITION = resolveMeteorArmorMelt(sorceressSkills);

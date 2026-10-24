import { createSkillValidator } from './skill-validator';
import rows from '../../data/skills/item.json';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill, HealEffect } from './effects';

const validate = createSkillValidator<SkillDef>();

/** Validate the single item-specific row and copy its values into a frozen runtime skill. */
export function resolveItemRedemption(source: readonly unknown[]): RegisteredSkill {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'item-redemption');
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored item Redemption skill');
  const pctOfMaxLife = row.heal?.pctOfMaxLife;
  const manaCost = row.cost.mana;
  if (pctOfMaxLife === undefined || manaCost === undefined) throw new Error('Missing item Redemption metadata');
  const effect: HealEffect = Object.freeze({ kind: 'heal', pctOfMaxLife, target: 'self' });
  return Object.freeze({ id: 'item.redemption', archetype: 'item', trigger: 'active',
    target: 'self', cooldown: row.cooldown, manaCost, minLevel: row.minLevel,
    effects: Object.freeze([effect]) });
}

/** Registered independently of equipment availability; no Paladin aura is reused. */
export const ITEM_REDEMPTION_SKILL = resolveItemRedemption(rows);

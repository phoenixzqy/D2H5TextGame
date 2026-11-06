import rows from '../../data/skills/monsters.json';
import { AMPLIFY_DAMAGE_DEFINITION } from '../combat/amplify-damage-definition';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

// The shared schema permits an omitted cost on free monster actions.
const validate = createSkillValidator<Omit<SkillDef, 'cost'> & { readonly cost?: SkillDef['cost'] }>();

/** Resolve the authored monster curse without a damaging carrier or mutable source references. */
export function resolveMonsterCurseSkill(input: readonly unknown[]): RegisteredSkill {
  const matches = input.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'monster-curse');
  if (matches.length !== 1) throw new Error('Expected exactly one authored monster-curse');
  const row = matches[0];
  if (!validate(row) || row.trigger !== 'active' || row.target !== 'single-enemy' ||
    row.cooldown < 1 || row.minLevel !== 1 || row.maxLevel !== 1 || (row.cost?.mana ?? 0) !== 0 ||
    row.appliesTags?.length !== 1 || row.appliesTags[0] !== 'amp-damage' ||
    row.damage !== undefined || row.damageType !== undefined || row.appliesStatus !== undefined ||
    row.statusEffect !== undefined || row.scaling !== undefined || row.heal !== undefined ||
    'summon' in row || row.summonId !== undefined || row.timedBuff !== undefined) {
    throw new Error('Invalid authored monster-curse');
  }
  const family = AMPLIFY_DAMAGE_DEFINITION;
  return Object.freeze({ id: 'monster.curse', archetype: 'monster', target: row.target,
    cooldown: row.cooldown, minLevel: row.minLevel, manaCost: row.cost?.mana ?? 0,
    effects: Object.freeze([Object.freeze({ kind: 'debuff' as const,
      statusId: family.canonicalStatusId, durationMs: family.durationMs,
      physicalResistReductionPct: family.physicalResistReductionPct })]) });
}

/** Monster targeting/cooldown and existing JSON-derived Amplify family duration/potency. */
export const MONSTER_CURSE_SKILL = resolveMonsterCurseSkill(rows);

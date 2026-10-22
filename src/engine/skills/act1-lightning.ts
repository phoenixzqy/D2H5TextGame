import Ajv2020 from 'ajv/dist/2020';
import monsterSkills from '../../data/skills/monsters.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';

/** Exact authored leaf used only by promoted Act I Lightning affixes. */
export const ACT1_LIGHTNING_AFFIX_ID = 'monster-act1-lightning-affix';
/** Registered identity used by the existing effective-rank damage pipeline. */
export const ACT1_LIGHTNING_AFFIX_CANONICAL_ID = 'monster.act1_lightning_affix';
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(skillSchema);

/** Validate one authored leaf and copy its tuning into an independent immutable skill. */
export function resolveAct1LightningAffix(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === ACT1_LIGHTNING_AFFIX_ID);
  if (matches.length !== 1) throw new Error('Expected exactly one authored Act I Lightning affix skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Act I Lightning affix skill');
  const damage = row.damage;
  const growth = row.scaling?.monsterLevelDamageGrowth;
  if (!damage || !growth || !orderedRange([damage.min, damage.max]) || !orderedRange(growth)) {
    throw new Error('Invalid authored Act I Lightning affix damage ranges');
  }
  const effect: DamageEffect = Object.freeze({
    kind: 'damage', damageType: 'lightning',
    base: Object.freeze([damage.min, damage.max] as const),
    perRank: Object.freeze([growth[0], growth[1]] as const)
  });
  return Object.freeze({
    id: ACT1_LIGHTNING_AFFIX_CANONICAL_ID, archetype: 'monster', target: 'single-enemy',
    cooldown: row.cooldown, minLevel: row.minLevel, manaCost: 0,
    effects: Object.freeze([effect])
  });
}

function orderedRange(range: readonly [number, number]): boolean {
  return range.every(value => Number.isFinite(value) && Number.isInteger(value) && value >= 0) &&
    range[0] <= range[1];
}

/** JSON-derived affix power, independent of the shared monster Lightning stub. */
export const ACT1_LIGHTNING_AFFIX_SKILL = resolveAct1LightningAffix(monsterSkills);

import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-diablo-fire-breath': 'monster.diablo_fire_breath',
  'monster-diablo-lightning': 'monster.diablo_lightning'
} as const;

/** Validate and copy Diablo’s two authored cone spells into immutable native payloads. */
export function resolveDiabloSignatures(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType, statusEffect, aoeShape, maxTargets } = row;
    const status = row.appliesStatus?.[0];
    if (!damage || !damageType || !statusEffect || !status || !aoeShape || maxTargets === undefined || damage.min > damage.max ||
      damage.breakdown[damageType] !== damage.max) throw new Error(`Invalid authored ${authored} payload`);
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      applyStatus: Object.freeze({ id: status, ...statusEffect }) });
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      aoeShape, maxTargets, effects: Object.freeze([effect]) });
  }));
}

/** Native Diablo spells; shared spells and existing prison/charge stay independent. */
export const DIABLO_SIGNATURES = resolveDiabloSignatures(rows);

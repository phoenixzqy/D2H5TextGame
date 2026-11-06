import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-baal-frost-nova': 'monster.baal_frost_nova',
  'monster-baal-inferno': 'monster.baal_inferno',
  'monster-baal-mana-rift': 'monster.baal_mana_rift'
} as const;

/** Validate and copy Baal's authored spells into immutable native payloads. */
export function resolveBaalSignatures(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType, statusEffect } = row;
    const status = row.appliesStatus?.[0], growth = row.scaling?.monsterLevelDamageGrowth;
    if (!damage || !damageType || !statusEffect || !status || damage.min > damage.max ||
      damage.breakdown[damageType] !== damage.max || growth && growth[0] > growth[1]) {
      throw new Error(`Invalid authored ${authored} payload`);
    }
    const primary = Object.freeze({ id: status, ...statusEffect });
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      ...(growth ? { perMonsterLevel: Object.freeze([growth[0], growth[1]] as const) } : {}),
      ...(authored === 'monster-baal-inferno'
        ? { applyStatuses: Object.freeze([primary, Object.freeze({ id: 'armor-melt' })] as const) }
        : { applyStatus: primary }) });
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      ...(row.aoeShape ? { aoeShape: row.aoeShape, maxTargets: row.maxTargets } : {}),
      effects: Object.freeze([effect]) });
  }));
}

/** Baal's elemental variants; shared monsters retain their own spell contracts. */
export const BAAL_SIGNATURES = resolveBaalSignatures(rows);

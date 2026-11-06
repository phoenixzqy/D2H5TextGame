import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-frost-nova': 'monster.frost_nova',
  'monster-arcane-bolt': 'monster.arcane_bolt'
} as const;
function ordered(range: readonly [number, number]): boolean {
  return range.every(value => Number.isFinite(value) && Number.isInteger(value) && value >= 0) && range[0] <= range[1];
}

/** Validate and freeze JSON-owned spell curves without using allocated skill ranks. */
export function resolveMonsterLevelSpells(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType } = row, growth = row.scaling?.monsterLevelDamageGrowth;
    if (!damage || !damageType || !growth || !ordered([damage.min, damage.max]) || !ordered(growth) ||
      Object.keys(damage.breakdown).length !== 1 || damage.breakdown[damageType] !== damage.max)
      throw new Error(`Invalid authored ${authored} damage curve`);
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      perMonsterLevel: Object.freeze([growth[0], growth[1]] as const),
      ...(authored === 'monster-frost-nova' ? { applyStatus: Object.freeze({ id: 'chill' }) } : {}),
      ...(row.projectileFlightMs === undefined ? {} : { projectileFlightMs: row.projectileFlightMs }) });
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Shared native Cold/Arcane spell curves for monsters and promoted affixes. */
export const MONSTER_LEVEL_SPELLS = resolveMonsterLevelSpells(rows);

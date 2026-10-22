import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import skillSchema from '../../data/schema/skill.schema.json';
import necromancerSkills from '../../data/skills/necromancer.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';

const MAGE = 'skills-necromancer-raise-skeletal-mage';
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(skillSchema);
function authored(id = MAGE): Record<string, unknown> {
  const row = [...necromancerSkills, ...sorceressSkills].find(row => row.id === id);
  if (!row) throw new Error(`Missing authored fixture ${id}`);
  return structuredClone(row);
}

describe('D06 authored Mage basic attack element metadata', () => {
  it('authors fire/cold/lightning/poison without changing preparation or growth', () => {
    const row = authored();
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(row).toMatchObject({ id: MAGE, summon: true, summonId: 'skeletal_mage',
      requiredLevel: 12, prerequisites: ['skills-necromancer-raise-skeleton'],
      trigger: 'active', target: 'summon', cooldown: 1, minLevel: 1, maxLevel: 20,
      cost: { mana: 22 }, scaling: { summonMaxCount: { kind: 'first-three-then-every-three' },
        summonStatsPerLevel: { lifeMax: 7, attack: 3, magicDodge: 0.002 } } });
    if (!validate(row)) throw new Error('Invalid production Mage');
    expect(row.summonBasicAttackElements).toEqual(['fire', 'cold', 'lightning', 'poison']);
  });

  it('requires the field on the exact authored Mage instead of a physical fallback', () => {
    const row = authored();
    delete row.summonBasicAttackElements;
    expect(validate(row)).toBe(false);
    expect(validate.errors).toContainEqual(expect.objectContaining({ keyword: 'required',
      params: { missingProperty: 'summonBasicAttackElements' } }));
  });

  it.each([
    ['fire', 'cold', 'lightning', 'poison'],
    ['poison', 'lightning', 'cold', 'fire'],
    ['cold', 'fire', 'poison', 'lightning']
  ].map(elements => [elements]))('accepts authored permutation %j without a TypeScript order default', elements => {
    expect(validate({ ...authored(), summonBasicAttackElements: elements }), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    [], null, 'fire', 4, {}, true,
    ['fire'], ['fire', 'cold', 'lightning'],
    ['fire', 'cold', 'lightning', 'poison', 'fire'],
    ['fire', 'cold', 'lightning', 'fire'],
    ['fire', 'cold', 'lightning', null], ['fire', 'cold', 'lightning', 1],
    ['fire', 'cold', 'lightning', {}], ['fire', 'cold', 'lightning', ['poison']],
    ['fire', 'cold', 'lightning', 'physical'], ['fire', 'cold', 'lightning', 'arcane'],
    ['fire', 'cold', 'lightning', 'thorns'], ['fire', 'cold', 'lightning', 'Poison'],
    ['fire', 'cold', 'lightning', ''], ['fire', 'cold', 'lightning', 'unknown']
  ].map(elements => [elements]))('rejects malformed or incomplete metadata %j', elements => {
    expect(validate({ ...authored(), summonBasicAttackElements: elements })).toBe(false);
  });

  it.each([
    'skills-necromancer-raise-skeletal-mage-copy',
    'skills-necromancer-raise-skeleton', 'skills-sorceress-ice-bolt'
  ])('rejects the field on unrelated row %s while preserving its base schema', id => {
    const row: Record<string, unknown> = id.endsWith('-copy')
      ? { ...authored(), id } : authored(id);
    delete row.summonBasicAttackElements;
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...row, summonBasicAttackElements: ['fire', 'cold', 'lightning', 'poison'] })).toBe(false);
  });

  it('keeps canonical runtime aliases outside the authored ID format', () => {
    const row = { ...authored(), id: 'necromancer.raise_skeletal_mage',
      summonBasicAttackElements: ['fire', 'cold', 'lightning', 'poison'] };
    expect(validate(row)).toBe(false);
    expect(validate.errors).toContainEqual(expect.objectContaining({ keyword: 'pattern', instancePath: '/id' }));
  });

  it('preserves every authored Necromancer and Sorceress row', () => {
    for (const row of [...necromancerSkills, ...sorceressSkills]) {
      expect(validate(row), `${row.id}: ${JSON.stringify(validate.errors)}`).toBe(true);
      if (row.id !== MAGE) expect(row).not.toHaveProperty('summonBasicAttackElements');
    }
  });
});

import { MERC_ELEMENTAL_ARROWS } from './merc-elemental-arrows';
import { MERC_BLESSED_AIM_SKILL } from './merc-blessed-aim';
import { MERC_FROZEN_ARMOR_SKILL } from './merc-frozen-armor';
import { MERC_PILFER_SKILL } from './merc-pilfer';
import { afterEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_ARROW_SKILLS, resolveMercArrowSkills } from './merc-arrows';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from './registry';
import { MERC_STUB_SKILLS } from './aliases';

const ids = ['mskill-basic-arrow', 'mskill-pierce-arrow'];
const fixtures = () => rows.filter(row => ids.includes(row.id)).map(row => ({
  ...structuredClone(row), cost: { mana: 0 }, attackDamagePct: 100 }));
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('exact authored mercenary arrows', () => {
  it('consumes actual JSON tuning and freezes independent values', () => {
    const source = structuredClone(rows), before = structuredClone(source);
    const skills = resolveMercArrowSkills(source);
    expect(skills).toEqual([
      { id: ids[0], archetype: 'mercenary', target: 'single-enemy', cooldown: 1, manaCost: 0,
        minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [16, 26],
          attackDamagePct: 100, tags: ['physical'] }] },
      { id: ids[1], archetype: 'mercenary', target: 'all-enemies', cooldown: 3, manaCost: 0,
        minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [26, 42],
          attackDamagePct: 100, tags: ['physical'] }] }
    ]);
    expect(skills).toEqual(MERC_ARROW_SKILLS);
    expect(source).toEqual(before);
    expect(Object.isFrozen(skills)).toBe(true);
    for (const skill of skills) {
      expect(Object.isFrozen(skill)).toBe(true);
      expect(Object.isFrozen(skill.effects)).toBe(true);
      const effect = skill.effects[0];
      if (effect?.kind !== 'damage') throw new Error('Missing arrow damage');
      expect(Object.isFrozen(effect)).toBe(true);
      expect(Object.isFrozen(effect.base)).toBe(true);
      expect(Object.isFrozen(effect.tags)).toBe(true);
      const row = source.find(row => row.id === skill.id);
      if (!row?.damage) throw new Error('Missing authored arrow fields');
      expect(Object.isFrozen(row)).toBe(false);
      row.damage.min = 999;
      row.appliesTags[0] = 'fire';
    }
    expect(skills).toEqual(MERC_ARROW_SKILLS);
  });

  it('reads finite nonnegative authored coefficients, including zero and fractions', () => {
    for (const attackDamagePct of [0, 12.5, 100]) {
      const source = fixtures().map(row => ({ ...row, attackDamagePct }));
      expect(resolveMercArrowSkills(source).map(skill => skill.effects[0]))
        .toEqual(source.map(row => {
          if (!row.damage) throw new Error('Missing authored damage');
          return { kind: 'damage', damageType: 'physical', base: [row.damage.min, row.damage.max],
            attackDamagePct, tags: ['physical'] };
        }));
    }
  });

  it('rejects missing and duplicate exact IDs while ignoring unrelated rows', () => {
    const [basic, pierce] = fixtures();
    for (const source of [[], [basic], [pierce], [basic, basic, pierce], [basic, pierce, pierce]]) {
      expect(() => resolveMercArrowSkills(source)).toThrow(/exactly one/);
    }
    expect(resolveMercArrowSkills([null, 42, { id: 'unrelated' }, basic, pierce]))
      .toEqual(MERC_ARROW_SKILLS);
  });

  it.each([
    { attackDamagePct: undefined }, ...[-1, NaN, Infinity, -Infinity, '100', null].map(attackDamagePct => ({ attackDamagePct })),
    { damage: { min: 40, max: 1, breakdown: { physical: 1 } } },
    { damage: { min: 1.5, max: 2, breakdown: { physical: 2 } } },
    { cost: {} }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
    { cooldown: 0 }, { damageType: 'fire' }, { trigger: 'passive' },
    { target: 'all-enemies' }, { appliesStatus: ['freeze'] },
    { scaling: { damagePerLevel: 10 } }, { attackDamagePercent: 100 }
  ])('rejects invalid or silently unsupported arrow metadata %j', patch => {
    const [basic, pierce] = fixtures();
    expect(() => resolveMercArrowSkills([{ ...basic, ...patch }, pierce])).toThrow();
  });

  it('rejects this authored field on unrelated mercenary skills, allowing native Jab, and keeps schema closed', () => {
    const validate = new Ajv2020({ strict: true }).compile(schema);
    for (const row of rows.filter(row => ![...ids, 'mskill-jab', 'mskill-fire-arrow', 'mskill-cold-arrow'].includes(row.id))) {
      expect(validate({ ...row, attackDamagePct: 100 }), row.id).toBe(false);
    }
    for (const row of rows) expect(validate(row), row.id).toBe(true);
  });

  it('restores both exact arrows on repeated default loads while preserving other registrations', () => {
    for (let i = 0; i < 3; i++) {
      for (const skill of MERC_ARROW_SKILLS) registerSkill({ ...skill, effects: [] });
      loadDefaultSkills();
      for (const skill of MERC_ARROW_SKILLS) expect(getSkill(skill.id)).toBe(skill);
    }
    const replaced = [...ids, ...MERC_ELEMENTAL_ARROWS.map(skill => skill.id), 'mskill-inner-sight', 'mskill-minor-heal', 'mskill-frozen-armor', 'mskill-pilfer', 'aura-blessed-aim'];
    expect(getSkill('mskill-frozen-armor')).toBe(MERC_FROZEN_ARMOR_SKILL);
    expect(getSkill('mskill-pilfer')).toBe(MERC_PILFER_SKILL);
    expect(getSkill('aura-blessed-aim')).toBe(MERC_BLESSED_AIM_SKILL);
    for (const arrow of MERC_ELEMENTAL_ARROWS) expect(getSkill(arrow.id)).toBe(arrow);
    for (const skill of MERC_STUB_SKILLS.filter(skill => !replaced.includes(skill.id))) {
      expect(getSkill(skill.id)).toBe(skill);
    }
  });
});

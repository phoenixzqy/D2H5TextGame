import { describe, expect, it } from 'vitest';
import amazon from '../../data/skills/amazon.json';
import necromancer from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

function avoid() {
  const row = amazon.find(row => row.id === 'skills-amazon-avoid');
  if (!row) throw new Error('Missing authored Avoid');
  return structuredClone(row);
}
describe('shared strict authored skill validation', () => {
  it('permits the reviewed Defense bypass only for Impale and player Corpse Explosion', () => {
    const validate = createSkillValidator<SkillDef>();
    const ce = necromancer.find(row => row.id === 'skills-necromancer-corpse-explosion');
    const impale = amazon.find(row => row.id === 'skills-amazon-impale');
    const teeth = necromancer.find(row => row.id === 'skills-necromancer-teeth');
    expect(ce).toBeDefined(); expect(impale).toBeDefined(); expect(teeth).toBeDefined();
    expect(validate({ ...ce, ignoresDefense: true })).toBe(true);
    expect(validate(impale)).toBe(true);
    expect(validate({ ...teeth, ignoresDefense: true })).toBe(false);
    expect(validate({ ...ce, id: 'skills-monster-corpse-explosion', ignoresDefense: true })).toBe(false);
    expect(validate({ ...ce, ignoresDefense: false })).toBe(false);
  });

  it('reports multiple schema errors without coercion, defaults or dropping unknown fields', () => {
    const validate = createSkillValidator<SkillDef>();
    const row = { ...avoid(), extra: true, cooldown: -1, requiredLevel: '12' };
    const before = structuredClone(row);
    expect(validate(row)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: 'additionalProperties' }),
      expect.objectContaining({ keyword: 'minimum', instancePath: '/cooldown' }),
      expect.objectContaining({ keyword: 'type', instancePath: '/requiredLevel' }),
    ]));
    expect(row).toEqual(before);
  });
  it('validates each row afresh, including mutated previously valid tuning', () => {
    const first = createSkillValidator<SkillDef>(), second = createSkillValidator<SkillDef>();
    const row = avoid();
    expect(first(row)).toBe(true);
    const coefficient = row.scaling.passiveStatsPerLevel;
    if (!coefficient || !('magicDodgePct' in coefficient)) throw new Error('Missing authored tuning');
    coefficient.magicDodgePct = -1;
    expect(second(row)).toBe(false);
    expect(second.errors).not.toBeNull();
    coefficient.magicDodgePct = 0.01;
    expect(first(row)).toBe(true);
    expect(first.errors).toBeNull();
  });
});

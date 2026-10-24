import { describe, expect, it } from 'vitest';
import amazon from '../../data/skills/amazon.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

function avoid() {
  const row = amazon.find(row => row.id === 'skills-amazon-avoid');
  if (!row) throw new Error('Missing authored Avoid');
  return structuredClone(row);
}
describe('shared strict authored skill validation', () => {
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

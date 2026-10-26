import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createSkillValidator } from '../skills/skill-validator';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { DIM_VISION_DEFINITION, isDimVisionDefinition, paidDimVision, resolveDimVisionDefinition } from './dim-vision-definition';

const row = rows.find(r => r.id === 'skills-necromancer-dim-vision');
if (!row) throw new Error('Missing authored Dim Vision');
const validate = createSkillValidator();
it('requires complete finite authored accuracy tuning and preserves the original resource/rank contract', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(isDimVisionDefinition(row)).toBe(true);
  expect(DIM_VISION_DEFINITION).toEqual({ durationMs: 3000, physicalHitChanceReductionPct: 50 });
  expect(paidDimVision()).toEqual({ physicalHitChanceReductionPct: 50 });
  expect(row).toMatchObject({ requiredLevel: 6, maxLevel: 20, cost: { mana: 9 }, cooldown: 3,
    scaling: { cooldownPerLevel: -.05, costPerLevel: -.2 } });
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 3000 } },
  { statusEffect: { physicalHitChanceReductionPct: 50 } },
  ...[0, -1, NaN, Infinity].map(durationMs => ({ statusEffect: { ...row.statusEffect, durationMs } })),
  ...[0, -1, 100, NaN, Infinity].map(physicalHitChanceReductionPct => ({ statusEffect: { ...row.statusEffect, physicalHitChanceReductionPct } })),
  { statusEffect: { ...row.statusEffect, chance: .5 } },
  { statusEffect: { ...row.statusEffect, damageReductionPct: 50 } },
  { trigger: 'passive' }, { target: 'self' }, { requiredLevel: 5 }, { maxLevel: 21 }, { prerequisites: [] },
  { cooldown: 0 }, { cost: { mana: 0 } }, { scaling: { cooldownPerLevel: 0, costPerLevel: -.2 } },
  { appliesStatus: ['blind'] }, { appliesStatus: ['dim-vision', 'blind'] },
  { damage: { min: 1, max: 1 } }, { damageType: 'physical' }
])('rejects missing/nonfinite/mismatched canonical blindness %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false);
  expect(isDimVisionDefinition(invalid)).toBe(false);
  expect(() => resolveDimVisionDefinition([invalid])).toThrow();
});
it('freezes a detached scalar copy, preserves caller ownership and refuses duplicate/missing definitions', () => {
  const source = structuredClone(rows), definition = resolveDimVisionDefinition(source);
  const copied = source.find(r => r.id === row.id);
  if (!copied?.statusEffect) throw new Error('Missing copied metadata');
  copied.statusEffect.physicalHitChanceReductionPct = 40;
  expect(definition.physicalHitChanceReductionPct).toBe(50);
  expect(resolveDimVisionDefinition(source).physicalHitChanceReductionPct).toBe(40);
  expect(Object.isFrozen(definition)).toBe(true);
  expect(Object.isFrozen(copied.statusEffect)).toBe(false);
  expect(Object.isFrozen(paidDimVision())).toBe(true);
  expect(() => resolveDimVisionDefinition([])).toThrow();
  expect(() => resolveDimVisionDefinition([...rows, row])).toThrow();
  expect(() => resolveDimVisionDefinition([...rows, null, {}, rows[0]])).not.toThrow();
});
it('grants a paid adapter capability only for complete canonical metadata', () => {
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed Dim Vision');
  expect(registeredSkillFromJson(typed).effects)
    .toEqual([{ kind: 'debuff', statusId: 'dim-vision', durationMs: 3000, dimVision: true }]);
  for (const statusEffect of [{}, { durationMs: 3000 }, { physicalHitChanceReductionPct: 50 },
    { durationMs: 3000, physicalHitChanceReductionPct: Infinity },
    { durationMs: 3000, physicalHitChanceReductionPct: 50, chance: .5 }])
    expect(registeredSkillFromJson({ ...typed, statusEffect }).effects)
      .toEqual([{ kind: 'debuff', statusId: 'dim-vision' }]);
  expect(registeredSkillFromJson({ ...typed, appliesStatus: ['blind'] }).effects)
    .toEqual([{ kind: 'debuff', statusId: 'blind' }]);
});

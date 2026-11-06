import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { createSkillValidator } from '@/engine/skills/skill-validator';
const validate = createSkillValidator();
function row(slug: string) {
  const skill = PLAYABLE_CLASS_SKILL_DATA.amazon.find(s => s.id === 'skills-amazon-' + slug);
  if (!skill) throw new Error('Missing Amazon definition');
  return skill;
}
for (const slug of ['guided-arrow', 'multiple-shot', 'strafe']) {
  const skill = row(slug), capability = slug === 'guided-arrow' ? 'alwaysHits' : slug === 'multiple-shot' ? 'aoeShape' : 'hitSequence';
  it(`${slug} has schema-valid authored capability and immutable registration`, () => {
    const before = structuredClone(skill);
    expect(validate(skill), JSON.stringify(validate.errors)).toBe(true);
    const registered = registeredSkillFromJson(skill);
    expect(skill).toEqual(before);
    expect(registered.effects).toEqual([expect.objectContaining({ kind: 'damage', damageType: 'physical' })]);
    if (slug === 'guided-arrow') expect(registered.effects[0]).toHaveProperty('alwaysHits', true);
    if (slug === 'multiple-shot') expect(registered).toMatchObject({ aoeShape: 'cone-3', maxTargets: 5 });
    if (slug === 'strafe') expect(registered.effects[0]).toHaveProperty('hitSequence', { strikes: 2, targetMode: 'each-original' });
  });
  it(`${slug} rejects removing its actual behavior or transplanting its identity`, () => {
    const missing: Record<string, unknown> = { ...structuredClone(skill) }; Reflect.deleteProperty(missing, capability);
    expect(validate(missing)).toBe(false);
    expect(validate({ ...skill, id: 'skills-amazon-fire-arrow' })).toBe(false);
  });
  it.each([{ trigger: 'passive' }, { passive: true }, { aura: true }, { summon: true }, { damageType: 'fire' }, { cooldown: 0 }, { requiredLevel: 1 },
    { maxLevel: 21 }, { prerequisites: [] }, { appliesStatus: ['burn'] }, { requires: { weaponType: ['bow'] } }])(
    `${slug} rejects a contradictory payload %j`, patch => { expect(validate({ ...skill, ...patch })).toBe(false); });
}
it.each([false, 0, 'true', null, {}])('rejects malformed Guided hit guarantee %j', alwaysHits => {
  expect(validate({ ...row('guided-arrow'), alwaysHits })).toBe(false);
});
it.each([0, 1, 4, 6, 1.5, '5', null])('rejects altered Multiple Shot cap %j', maxTargets => {
  expect(validate({ ...row('multiple-shot'), maxTargets })).toBe(false);
});
it.each([{ strikes: 1 }, { strikes: 3, targetMode: 'each-original' }, { strikes: 2 },
  { strikes: 2, targetMode: 'each-original', typo: true }])('rejects altered Strafe sequence %j', hitSequence => {
  expect(validate({ ...row('strafe'), hitSequence })).toBe(false);
});
it('keeps every playable class definition schema valid', () => {
  for (const skills of Object.values(PLAYABLE_CLASS_SKILL_DATA)) for (const skill of skills)
    expect(validate(skill), skill.id + JSON.stringify(validate.errors)).toBe(true);
});

it.each([-1, '40', null])('rejects malformed volley Attack growth %j', attackDamagePctPerLevel => {
  const skill = row('multiple-shot');
  expect(validate({ ...skill, scaling: { ...skill.scaling, attackDamagePctPerLevel } })).toBe(false);
});
it('confines required rank-based Attack growth to Multiple Shot', () => {
  const skill = row('multiple-shot'), scaling = { ...skill.scaling };
  Reflect.deleteProperty(scaling, 'attackDamagePctPerLevel');
  expect(validate({ ...skill, scaling })).toBe(false);
  const other = row('guided-arrow');
  expect(validate({ ...other, scaling: { ...other.scaling, attackDamagePctPerLevel: 40 } })).toBe(false);
});

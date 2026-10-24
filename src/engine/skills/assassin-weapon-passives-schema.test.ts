import { expect, it } from 'vitest';
import { createSkillValidator } from './skill-validator';
import skills from '../../data/skills/assassin.json';

const validate = createSkillValidator();
it.each(['claw-mastery', 'weapon-block'])('requires exact authored %s mechanics and coefficients', slug => {
  const row = skills.find(row => row.id === 'skills-assassin-' + slug);
  if (!row) throw new Error('Missing authored Assassin passive');
  const proposed = { ...row, ...(slug === 'claw-mastery' ? { requires: { weaponType: ['claw'], handedness: ['oneHanded'] } } : {}) };
  expect(validate(proposed)).toBe(true);
  const tuning = row.scaling.passiveStatsPerLevel;
  for (const patch of [{ trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
    { requiredLevel: undefined }, { cost: { mana: 0 } }, { damageType: 'physical' },
    { scaling: { passiveStatsPerLevel: { ...tuning, lifePct: 0.5 } } },
    ...Object.keys(tuning ?? {}).flatMap(stat => [-1, Infinity, NaN, null, '0.03'].map(value =>
      ({ scaling: { passiveStatsPerLevel: { ...tuning, [stat]: value } } }))),
    ...(slug === 'claw-mastery' ? [{ requires: undefined }, { requires: { weaponType: ['sword'] } }]
      : [{ prerequisites: [] }, { requires: { weaponType: ['claw'] } }]),
  ]) expect.soft(validate({ ...proposed, ...patch }), JSON.stringify(patch)).toBe(false);
});

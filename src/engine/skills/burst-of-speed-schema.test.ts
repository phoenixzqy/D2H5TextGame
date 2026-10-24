import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator();
it('requires explicit finite timing and exact paid personal Burst semantics', () => {
  const row = skills.find((s) => s.id === 'skills-assassin-burst-of-speed');
  if (!row) throw new Error('Missing Burst');
  const proposed = { ...row, timedBuff: { durationMs: 10000 } };
  expect.soft(validate(proposed)).toBe(true);
  for (const patch of [
    { timedBuff: undefined },
    { trigger: 'passive' },
    { target: 'all-allies' },
    { cooldown: 0 },
    { cost: undefined },
    { requiredLevel: undefined },
    { appliesStatus: ['other'] },
    { prerequisites: [] },
    { scaling: { passiveStatsPerLevel: { attackSpeedPct: 0.02 } } },
    ...[0, -1, Infinity, NaN, '10000', null, 1.5].map((durationMs) => ({
      timedBuff: { durationMs }
    })),
    { timedBuff: { durationMs: 10000, unknown: true } }
  ])
    expect.soft(validate({ ...proposed, ...patch }), JSON.stringify(patch)).toBe(false);
  expect(validate({ ...proposed, id: 'skills-assassin-other' })).toBe(false);
});

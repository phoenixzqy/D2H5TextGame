import { expect, it } from 'vitest';
import { createSkillValidator } from './skill-validator';
import skills from '../../data/skills/assassin.json';
const validate = createSkillValidator();
it('requires exact automatic Fade semantics and finite authored coefficients', () => {
  const fade = skills.find((s) => s.id === 'skills-assassin-fade');
  if (!fade) throw new Error('Missing Fade');
  expect(validate(fade)).toBe(true);
  for (const patch of [
    { trigger: 'active' },
    { target: 'all-allies' },
    { cooldown: 1 },
    { requiredLevel: undefined },
    { cost: { mana: 0 } },
    { prerequisites: [] },
    { scaling: { passiveStatsPerLevel: { resistAllPct: 0.02 } } },
    { scaling: { passiveStatsPerLevel: { resistAllPct: -0.02, magicDodgePct: 0.005 } } },
    { scaling: { passiveStatsPerLevel: { resistAllPct: 0.02, magicDodgePct: Infinity } } },
    {
      scaling: {
        passiveStatsPerLevel: { resistAllPct: 0.02, magicDodgePct: 0.005, physDodgePct: 0.1 }
      }
    }
  ])
    expect.soft(validate({ ...fade, ...patch }), JSON.stringify(patch)).toBe(false);
});
it('requires an explicit closed Venom coating and rejects unrelated/invalid mechanics', () => {
  const venom = skills.find((s) => s.id === 'skills-assassin-venom');
  if (!venom) throw new Error('Missing Venom');
  const proposed = { ...venom, venomOnBasicHit: { attackPct: 0.05, durationMs: 5000 } };
  expect.soft(validate(proposed)).toBe(true);
  for (const patch of [
    { venomOnBasicHit: undefined },
    { trigger: 'active' },
    { target: 'all-enemies' },
    { appliesTags: [] },
    { cooldown: 1 },
    { prerequisites: [] },
    { requiredLevel: undefined },
    { appliesStatus: ['poison'] },
    { statusEffect: { dotPctOfDamage: 0.05 } },
    { scaling: { passiveStatsPerLevel: { poisonDamagePct: NaN } } },
    { scaling: { passiveStatsPerLevel: { poisonDamagePct: 0.03, physicalDamagePct: 0.1 } } },
    ...[0, -1, Infinity, null, '0.05'].map((attackPct) => ({
      venomOnBasicHit: { attackPct, durationMs: 5000 }
    })),
    ...[0, -1, Infinity, null, '5000'].map((durationMs) => ({
      venomOnBasicHit: { attackPct: 0.05, durationMs }
    })),
    { venomOnBasicHit: { attackPct: 0.05, durationMs: 5000, stacks: 3 } }
  ])
    expect.soft(validate({ ...proposed, ...patch }), JSON.stringify(patch)).toBe(false);
  expect(validate({ ...proposed, id: 'skills-assassin-other' })).toBe(false);
});

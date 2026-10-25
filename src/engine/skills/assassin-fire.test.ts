import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const slugs = [
  'fire-blast',
  'fists-of-fire',
  'dragon-tail',
  'wake-of-fire',
  'wake-of-inferno',
  'phoenix-strike'
];
const validate = createSkillValidator();
function row(slug: string) {
  const s = PLAYABLE_CLASS_SKILL_DATA.assassin.find((r) => r.id === 'skills-assassin-' + slug);
  if (!s) throw new Error('Missing actual Assassin Fire source');
  return s;
}
for (const slug of slugs) {
  it(`${slug} authors and forwards explicit positive on-hit Fire potency`, () => {
    const s = row(slug),
      before = structuredClone(s);
    expect(s.statusEffect?.dotPctOfDamage).toBe(0.1);
    expect(validate(s), JSON.stringify(validate.errors)).toBe(true);
    expect(registeredSkillFromJson(s).effects[0]).toMatchObject({
      kind: 'damage',
      ...(slug === 'phoenix-strike'
        ? {
            applyStatuses: [
              { id: 'burn', dotPctOfDamage: 0.1 },
              { id: 'chill' },
              { id: 'paralyze' }
            ]
          }
        : { applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } })
    });
    expect(s).toEqual(before);
  });
  it(`${slug} rejects absent, zero, negative and nonfinite powered Burn metadata`, () => {
    const s = row(slug);
    for (const rate of [undefined, 0, -1, NaN, Infinity]) {
      expect(
        validate({ ...s, statusEffect: rate === undefined ? {} : { dotPctOfDamage: rate } }),
        String(rate)
      ).toBe(false);
    }
  });
  it(`${slug} displays the explicit Burn at unlearned/current/next/MAX with correct attribution`, () => {
    const s = row(slug);
    for (const rank of [0, 1, 2, 19, 20]) {
      const m = computeSkillDisplayModel(s, rank),
        stats = m.current ?? m.next;
      expect(stats?.burn).toEqual({
        percentOfHit: 10,
        durationSeconds: 3,
        maxStacks: 5,
        minDps: 1,
        ...(slug === 'phoenix-strike' ? { component: 'fire' } : {})
      });
      if (rank > 0 && rank < 20) expect(m.next?.burn).toEqual(stats?.burn);
      if (rank === 20) expect(m.next).toBeUndefined();
    }
  });
}
it('Phoenix registers only authored typed weights and three component-specific statuses', () => {
  const s = row('phoenix-strike');
  expect(s.damageComposition).toBe('weighted-components');
  expect(registeredSkillFromJson(s).effects[0]).toMatchObject({
    kind: 'damage',
    base: [120, 180],
    perRank: [12, 12],
    components: [
      { damageType: 'fire', weight: 60 },
      { damageType: 'cold', weight: 60 },
      { damageType: 'lightning', weight: 60 }
    ],
    applyStatuses: [
      { id: 'burn', damageType: 'fire', dotPctOfDamage: 0.1 },
      { id: 'chill', damageType: 'cold' },
      { id: 'paralyze', damageType: 'lightning' }
    ]
  });
  expect(computeSkillDisplayModel(s, 1).current?.composite).toEqual({
    chillSeconds: 2,
    paralyzeSeconds: 1
  });
});
it('Phoenix rejects missing composition, invalid weights or contradictory native identity', () => {
  const s = row('phoenix-strike'),
    complete = {
      ...s,
      damageComposition: 'weighted-components',
      statusEffect: { dotPctOfDamage: 0.1 }
    };
  for (const patch of [
    { damageComposition: undefined },
    { target: 'all-enemies' },
    { requiredLevel: 1 },
    { prerequisites: [] },
    { appliesStatus: ['burn'] },
    { damageType: 'cold' },
    { hitSequence: { strikes: 3 } },
    ...[0, -1, NaN, Infinity].map((fire) => ({
      damage: { ...s.damage, breakdown: { fire, cold: 60, lightning: 60 } }
    }))
  ]) {
    expect(validate({ ...complete, ...patch }), JSON.stringify(patch)).toBe(false);
  }
  expect(validate({ ...complete, id: 'skills-assassin-death-sentry' })).toBe(false);
});
it('does not invent Burn potency or composite behavior for Death Sentry or other ordinary Assassin skills', () => {
  const s = row('death-sentry');
  expect(s.statusEffect?.dotPctOfDamage).toBeUndefined();
  expect(computeSkillDisplayModel(s, 1).current?.burn).toBeUndefined();
  expect(registeredSkillFromJson(s).effects[0]).not.toHaveProperty('components');
});

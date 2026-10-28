import { expect, it } from 'vitest';
import rows from '../../data/skills/assassin.json';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
import { AssassinCharges, ASSASSIN_CHARGE_DEFINITION as rules } from './assassin-charges';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';

const validate = createSkillValidator<SkillDef>();
function source(id: string): SkillDef {
  const row = rows.find(row => row.id === 'skills-' + id.replace('.', '-').replaceAll('_', '-'));
  if (!validate(row)) throw new Error('Missing authored martial skill');
  return row;
}
for (const id of rules.builders) it.each([0, 1, 2, 19, 20, 21])(
  `${id} previews current/next/MAX paid releases at allocated rank%i without changing the source`, rank => {
    const row = source(id), before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
    for (const stats of [model.current, model.next]) {
      if (!stats) continue;
      expect(stats.assassinMartial).toMatchObject({ kind: 'builder', maxStacks: 3,
        durationSeconds: 15, finishers: rules.finishers });
      expect(stats.statuses).toEqual(id === 'assassin.cobra_strike' ? [] : row.appliesStatus ?? []);
      const payout = stats.assassinMartial?.payout;
      if (id === 'assassin.cobra_strike') {
        expect(payout).toEqual({ kind: 'recovery', releases: [
          { stacks: 1, lifePercent: 10, manaPercent: 10 },
          { stacks: 2, lifePercent: 20, manaPercent: 20 },
          { stacks: 3, lifePercent: 30, manaPercent: 30 }
        ] });
      } else {
        const base = row.damage;
        if (!base) throw new Error('Missing builder damage');
        expect(payout?.kind).toBe('damage');
        if (payout?.kind !== 'damage') throw new Error('Missing damage preview');
        expect(payout.percentPerStack).toBe(50);
        expect(payout.damageTypes).toEqual(id === 'assassin.phoenix_strike'
          ? ['fire', 'cold', 'lightning'] : [row.damageType]);
        for (const stacks of [1, 2, 3]) {
          const growth = (row.scaling?.damagePerLevel ?? 0) * (stats.rank - 1);
          const expected = { stacks, min: Math.floor((base.min + growth) * stacks * .5),
            max: Math.floor((base.max + growth) * stacks * .5) };
          expect(payout.releases[stacks - 1]).toEqual(expected);
          const actual = new AssassinCharges();
          for (let n = 0; n < stacks; n++) expect(actual.gain('hero', id, stats.rank, n)).toBe(true);
          expect(actual.consume('hero', 3)[0]?.effect?.base).toEqual([expected.min, expected.max]);
        }
      }
    }
    expect(row).toEqual(before);
    if (rank === 0) expect(model.current).toBeUndefined();
    if (rank >= 20) { expect(model.maxed).toBe(true); expect(model.next).toBeUndefined(); }
  });

it.each(rules.finishers)('%s previews release rules without inventing unknown stored damage', id => {
  for (const rank of [1, 20]) expect(computeSkillRankDisplayStats(source(id), rank).assassinMartial)
    .toEqual({ kind: 'finisher', maxStacks: 3, durationSeconds: 15, finishers: rules.finishers });
});

it('omits martial promises for foreign, incomplete or altered authored skills', () => {
  const tiger = source('assassin.tiger_strike');
  for (const patch of [{ id: 'foreign.tiger_strike' }, { trigger: 'passive' }, { maxLevel: 21 },
    { target: 'all-enemies' }, { cost: { mana: 0 } }, { scaling: { damagePerLevel: 999 } },
    { appliesStatus: ['poison'] }]) {
    expect(computeSkillRankDisplayStats({ ...tiger, ...patch }, 1).assassinMartial).toBeUndefined();
  }
  const missing = { ...tiger };
  Reflect.deleteProperty(missing, 'damage');
  expect(computeSkillRankDisplayStats(missing, 1).assassinMartial).toBeUndefined();
});

it('keeps generic statuses without recovery promises for unrecognized Cobra sources', () => {
  const cobra = source('assassin.cobra_strike');
  if (!cobra.appliesStatus) throw new Error('Missing authored Cobra statuses');
  const incomplete = { ...cobra };
  Reflect.deleteProperty(incomplete, 'damage');
  const forged = { ...source('assassin.tiger_strike'), id: cobra.id, appliesStatus: cobra.appliesStatus };
  for (const row of [incomplete, forged, { ...cobra, id: 'foreign.cobra_strike' },
    { ...cobra, trigger: 'passive' }, { ...cobra, cost: { mana: 0 } },
    { ...cobra, scaling: { damagePerLevel: 999 } }, { ...cobra, appliesStatus: ['life-steal'] }]) {
    const before = structuredClone(row), stats = computeSkillRankDisplayStats(row, 1);
    expect(stats.assassinMartial).toBeUndefined();
    expect(stats.statuses).toEqual(row.appliesStatus ?? []);
    expect(row).toEqual(before);
  }
});

import { describe, expect, it } from 'vitest';
import authored from '../../data/skills/necromancer.json';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
const validate = createSkillValidator<SkillDef>();
function source() {
  const row: unknown = authored.find(s => s.id === 'skills-necromancer-blood-golem');
  if (!validate(row)) throw new Error('Missing validated Blood Golem display source');
  return row;
}
it.each([0, 1, 2, 18, 19, 20])('Blood Golem current/next/MAX at allocation%i', allocation => {
  const s = source(), before = structuredClone(s), model = computeSkillDisplayModel(s, allocation);
  const check = (rank: number) => {
    const current = computeSkillRankDisplayStats(s, rank);
    expect(current.summonUnit?.attackType).toBe('physical');
    expect(current.summonUnit?.effect).toEqual({ kind: 'lifeLeech', percentOfDamage: 10 });
    expect(current.manaCost).toBe(25); expect(current.cooldown).toBe(4);
    expect(current.summonCap).toBe(1);
    expect(Object.fromEntries(current.summonUnit?.stats.map(row => [row.id, row.value]) ?? []))
      .toMatchObject({ lifeMax: 180 + 14 * (rank - 1), attack: 34 + 2 * (rank - 1),
        defense: 24 + rank - 1, attackSpeed: 70, poisonResistance: 0.2 });
    return current;
  };
  if (allocation === 0) { expect(model.current).toBeUndefined(); expect(model.next).toEqual(check(1)); }
  else expect(model.current).toEqual(check(allocation));
  if (allocation > 0 && allocation < 20) expect(model.next).toEqual(check(allocation + 1));
  if (allocation === 20) expect(model.next).toBeUndefined();
  expect(s).toEqual(before);
});
describe('Blood Golem preview identity', () => {
  it('does not promise Physical/leech on foreign or contradictory sources', () => {
    const s = source();
    for (const row of [{ ...s, id: 'foreign' }, { ...s, summonId: 'clay_golem' },
      { ...s, summon: false }, { ...s, trigger: 'passive' }, { ...s, target: 'self' }]) {
      const body = computeSkillRankDisplayStats(row, 1).summonUnit;
      expect(body?.attackType).toBeUndefined(); expect(body?.effect).toBeUndefined();
    }
  });
});

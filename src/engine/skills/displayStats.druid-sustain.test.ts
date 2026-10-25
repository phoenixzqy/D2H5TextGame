import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/druid.json';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator<SkillDef>();
function source(slug: string) {
  const row: unknown = skills.find((s) => s.id === 'skills-druid-' + slug);
  if (!validate(row)) throw new Error('Invalid sustain display fixture');
  return row;
}
describe('authored direct-hit sustain display', () => {
  it.each(['feral-rage', 'hunger'])(
    'shows fixed %s recovery and stack tuning at preview/current/next/MAX',
    (slug) => {
      const s = source(slug),
        before = structuredClone(s);
      for (const rank of [0, 1, 2, 19, 20]) {
        const model = computeSkillDisplayModel(s, rank),
          stats = rank === 0 ? model.next : model.current;
        expect(stats?.recovery).toEqual({ percentOfHpRemoved: slug === 'feral-rage' ? 10 : 50 });
        expect(stats?.feralRage).toEqual(
          slug === 'feral-rage'
            ? { percentPerStack: 5, maxStacks: 5, durationSeconds: 8 }
            : undefined
        );
        if (rank > 0 && rank < 20) expect(model.next?.recovery).toEqual(stats?.recovery);
        if (rank === 20) expect(model.next).toBeUndefined();
      }
      expect(s).toEqual(before);
    }
  );
  it('refuses to invent a recovery value from a marker or invalid fraction', () => {
    const s = source('hunger');
    for (const lifeFraction of [0, -1, 1.1, NaN, Infinity])
      expect(
        computeSkillRankDisplayStats({ ...s, onHitRecovery: { lifeFraction } }, 1).recovery
      ).toBeUndefined();
    const { onHitRecovery, ...plain } = s;
    void onHitRecovery;
    expect(computeSkillRankDisplayStats(plain, 1).recovery).toBeUndefined();
    expect(
      computeSkillRankDisplayStats({ ...source('feral-rage'), id: 'other' }, 1).feralRage
    ).toBeUndefined();
  });
});

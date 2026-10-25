import { expect, it } from 'vitest';
import type { CombatUnit } from './types';
import { projectLifeCapacity, withoutTemporaryLifeCapacity } from './life-capacity';
const unit = { id: 'fixture', life: 1700, stats: { lifeMax: 1000 } } as CombatUnit;
it('adds form and ambient contributions over one base and preserves HP above either partial cap', () => {
  const projected = projectLifeCapacity(unit, { coefficient: 0.03, rank: 20 }, [
    { coefficient: 0.03, rank: 20 }
  ]);
  expect(projected).toMatchObject({
    life: 1700,
    stats: { lifeMax: 2200 },
    druidFormLife: { baseLifeMax: 1000, appliedLifeMax: 1600 },
    vigorLife: { baseLifeMax: 1600, appliedLifeMax: 2200 }
  });
  expect(
    projectLifeCapacity(projected, { coefficient: 0.03, rank: 20 }, [
      { coefficient: 0.03, rank: 20 }
    ])
  ).toEqual(projected);
  expect(withoutTemporaryLifeCapacity(projected)).toEqual(unit);
});
it('floors exact19×.03×100 and each contribution independently', () => {
  const out = projectLifeCapacity(
    { ...unit, life: 75, stats: { ...unit.stats, lifeMax: 100 } },
    { coefficient: 0.03, rank: 19 },
    [{ coefficient: 0.03, rank: 19 }]
  );
  expect([out.stats.lifeMax, out.life]).toEqual([214, 75]);
});
it('removes and reduces capacity with one final clamp and no healing', () => {
  const full = projectLifeCapacity(unit, { coefficient: 0.03, rank: 20 }, [
    { coefficient: 0.03, rank: 20 }
  ]);
  expect(projectLifeCapacity(full, undefined, [{ coefficient: 0.03, rank: 20 }])).toMatchObject({
    life: 1600,
    stats: { lifeMax: 1600 }
  });
  expect(projectLifeCapacity(full)).toEqual({ ...unit, life: 1000 });
  expect(
    projectLifeCapacity({ ...full, life: 700 }, undefined, [{ coefficient: 0.03, rank: 20 }]).life
  ).toBe(700);
});
it('does not trust a malformed or nonmatching carried baseline', () => {
  const malformed = { ...unit, vigorLife: { baseLifeMax: 5, appliedLifeMax: 999 } };
  expect(projectLifeCapacity(malformed)).toEqual({ ...unit, life: 1000 });
});

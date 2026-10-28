import { expect, it } from 'vitest';
import type { CombatUnit } from './types';
import { projectManaCapacity, withoutTemporaryManaCapacity } from './mana-capacity';

const unit = { id: 'fixture', mana: 125, stats: { manaMax: 100 },
  manaRegenCarry: .5, manaRegenCompensation: .01, manaRegenExactCarry: '1/2' } as CombatUnit;
it('preserves absolute MP above the personal cap until final composition without drift', () => {
  const before = structuredClone(unit), out = projectManaCapacity(unit, .30);
  expect(out).toMatchObject({ mana: 125, stats: { manaMax: 130 },
    manaCapacity: { baseManaMax: 100, appliedManaMax: 130 }, manaRegenCarry: .5 });
  expect(projectManaCapacity(out, .30)).toEqual(out);
  expect(withoutTemporaryManaCapacity(out)).toEqual(unit);
  expect(unit).toEqual(before);
});
it('clamps only on withdrawal, resets all carry, and never refills on reacquisition', () => {
  const active = projectManaCapacity(unit, .30), withdrawn = projectManaCapacity(active);
  expect(withdrawn).toEqual({ ...unit, mana: 100, manaRegenCarry: 0,
    manaRegenCompensation: 0, manaRegenExactCarry: '0' });
  expect(projectManaCapacity(withdrawn, .30)).toMatchObject({ mana: 100, stats: { manaMax: 130 } });
  expect(projectManaCapacity({ ...unit, mana: 80 }, .30).mana).toBe(80);
});
it.each([[19, .30, 24], [0, .30, 0], [100, 0, 100], [100, .125, 112]])(
  'floors independently for base %s and coefficient %s', (base, coefficient, expected) => {
    expect(projectManaCapacity({ ...unit, mana: 0, stats: { ...unit.stats, manaMax: base } }, coefficient))
      .toMatchObject({ mana: 0, stats: { manaMax: expected } });
  });
it.each([
  { baseManaMax: -1, appliedManaMax: 100 }, { baseManaMax: 5, appliedManaMax: 99 },
  { baseManaMax: Infinity, appliedManaMax: 100 }, { baseManaMax: 5, appliedManaMax: NaN },
  { baseManaMax: 101, appliedManaMax: 100 }, { baseManaMax: 5, appliedManaMax: 100, extra: 1 }
])('strips invalid capacity without trusting its baseline %j', manaCapacity => {
  expect(withoutTemporaryManaCapacity({ ...unit, manaCapacity })).toEqual(unit);
});
it('restores a zero baseline and does not invent exported carry fields', () => {
  const bare = { id: 'zero', mana: 3, stats: { manaMax: 3 },
    manaCapacity: { baseManaMax: 0, appliedManaMax: 3 } } as CombatUnit;
  expect(projectManaCapacity(bare, .30)).toEqual({ id: 'zero', mana: 0, stats: { manaMax: 0 } });
});

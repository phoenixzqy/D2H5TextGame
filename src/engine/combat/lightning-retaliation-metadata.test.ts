import { expect, it, vi } from 'vitest';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { copyLightningRetaliation, type LightningRetaliation } from './lightning-retaliation';

it('copies and freezes optional authored tuning independently, including probability endpoints', () => {
  expect(copyLightningRetaliation(undefined)).toBeUndefined();
  for (const chance of [0, 0.25, 1]) {
    const input = { chance, damage: [40, 60] }, before = structuredClone(input);
    const copy = copyLightningRetaliation(input);
    expect(copy).toEqual(input);
    expect(copy).not.toBe(input);
    expect(copy?.damage).not.toBe(input.damage);
    expect(Object.isFrozen(copy)).toBe(true);
    expect(Object.isFrozen(copy?.damage)).toBe(true);
    expect(input).toEqual(before);
    input.damage[0] = 999;
    expect(copy?.damage).toEqual([40, 60]);
  }
});

it.each([null, [], {}, { chance: 0.25 }, { damage: [40, 60] },
  { chance: -0.1, damage: [40, 60] }, { chance: 1.1, damage: [40, 60] },
  { chance: NaN, damage: [40, 60] }, { chance: Infinity, damage: [40, 60] },
  { chance: '0.25', damage: [40, 60] }, { chance: 0.25, damage: [60, 40] },
  { chance: 0.25, damage: [-1, 60] }, { chance: 0.25, damage: [40, Infinity] },
  { chance: 0.25, damage: [NaN, 60] }, { chance: 0.25, damage: [40] },
  { chance: 0.25, damage: [40, 60, 80] }, { chance: 0.25, damage: ['40', 60] },
  { chance: 0.25, damage: [40, 60], extra: true }
])('rejects invalid tuning before any factory random draw: %j', value => {
  const rng = createRng(7), nextInt = vi.spyOn(rng, 'nextInt'), pick = vi.spyOn(rng, 'pick');
  expect(() => copyLightningRetaliation(value)).toThrow(RangeError);
  expect(() => buildMonsterUnit({ def: { id: 'monsters/fixture', name: 'fixture', life: [10, 20],
    lifeGrowth: [1, 2], skills: [], attackSpeed: 100, baseExperience: 1, canBeElite: true, canBeBoss: false },
    level: 1, tier: 'elite', rng, lightningRetaliation: value as LightningRetaliation })).toThrow(RangeError);
  expect(nextInt).not.toHaveBeenCalled();
  expect(pick).not.toHaveBeenCalled();
});

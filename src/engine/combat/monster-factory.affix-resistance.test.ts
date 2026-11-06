import { expect, it } from 'vitest';
import act1Monsters from '../../data/monsters/act1.json';
import { createRng } from '../rng';
import type { Resistances } from '../types/attributes';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';

const fallen = (act1Monsters as unknown as MonsterDef[]).find(row => row.id === 'monsters/act1.fallen');
if (!fallen) throw new Error('Missing native Fallen');

it.each([
  [-80, 30, 50, 0], [60, 30, 50, 75], [0, 0, 12.5, 12.5]
])('combines cold base %s, tier %s and affix %s before capping at %s', (base, tier, affix, expected) => {
  const def = { ...fallen, resistances: { ...fallen.resistances, cold: base } };
  const bonuses = { cold: affix, fire: 10 };
  const before = structuredClone({ def, bonuses });
  const rng = createRng(7), control = createRng(7);
  const opts = { def, level: 7, tier: 'champion' as const, resistanceBonus: tier };
  const enemy = buildMonsterUnit({ ...opts, resistanceBonuses: bonuses, rng });
  const plain = buildMonsterUnit({ ...opts, rng: control });
  expect(enemy.stats.resistances.cold).toBe(expected);
  expect(enemy.stats.resistances.fire).toBe(tier + 10);
  expect(enemy.stats.resistances.lightning).toBe(plain.stats.resistances.lightning);
  expect({ ...enemy.stats, resistances: plain.stats.resistances }).toEqual(plain.stats);
  expect({ ...enemy, stats: plain.stats }).toEqual(plain);
  expect(rng.next()).toBe(control.next());
  expect({ def, bonuses }).toEqual(before);
});

it('preserves exact factory output when resistance metadata is absent or empty', () => {
  const opts = { def: fallen, level: 7, tier: 'champion' as const };
  expect(buildMonsterUnit({ ...opts, rng: createRng(7), resistanceBonuses: {} }))
    .toEqual(buildMonsterUnit({ ...opts, rng: createRng(7) }));
});

it.each([
  { cold: NaN }, { cold: Infinity }, { cold: -1 }, { cold: 101 },
  { cold: '50' }, { cold: null }, { unknown: 50 }, { thorns: 50 }, null, [], 50
])('rejects invalid bonus metadata %j before consuming RNG', value => {
  const rng = createRng(7), control = createRng(7);
  expect(() => buildMonsterUnit({ def: fallen, level: 7, tier: 'champion', rng,
    resistanceBonuses: value as unknown as Partial<Resistances> })).toThrow(RangeError);
  expect(rng.next()).toBe(control.next());
});

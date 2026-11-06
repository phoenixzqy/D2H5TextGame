import { expect, it } from 'vitest';
import act1Monsters from '../../data/monsters/act1.json';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';

const fallen = (act1Monsters as unknown as MonsterDef[]).find(row => row.id === 'monsters/act1.fallen');
if (!fallen) throw new Error('Missing native Fallen');

it.each([1, 1.5, 2])('applies speed multiplier %s once without changing other stats, input or RNG', attackSpeedMultiplier => {
  const rng = createRng(7), control = createRng(7), before = structuredClone(fallen);
  const opts = { def: fallen, level: 7, tier: 'champion' as const };
  const enemy = buildMonsterUnit({ ...opts, rng, attackSpeedMultiplier });
  const plain = buildMonsterUnit({ ...opts, rng: control });
  expect(enemy.stats.attackSpeed).toBe(95 * attackSpeedMultiplier);
  expect({ ...enemy.stats, attackSpeed: 95 }).toEqual(plain.stats);
  expect({ ...enemy, stats: plain.stats }).toEqual(plain);
  expect(rng.next()).toBe(control.next());
  expect(fallen).toEqual(before);
});

it('keeps fractional speed and the absent archetype speed fallback', () => {
  const opts = { level: 7, tier: 'champion' as const, attackSpeedMultiplier: 1.5 };
  expect(buildMonsterUnit({ ...opts, def: { ...fallen, attackSpeed: 95.25 }, rng: createRng(7) })
    .stats.attackSpeed).toBe(142.875);
  const { attackSpeed: _speed, ...legacyDef } = fallen;
  expect(buildMonsterUnit({ ...opts, def: legacyDef, rng: createRng(7) }).stats.attackSpeed).toBe(142.5);
  expect(buildMonsterUnit({ def: legacyDef, level: 7, tier: 'champion', rng: createRng(7) })
    .stats.attackSpeed).toBe(95);
});

it.each([0, -1, NaN, Infinity, -Infinity, '1.5', null, Number.MAX_VALUE])(
  'rejects invalid multiplier or resolved overflow %s before consuming RNG', value => {
    const rng = createRng(7), control = createRng(7);
    expect(() => buildMonsterUnit({ def: fallen, level: 7, tier: 'champion', rng,
      attackSpeedMultiplier: value as number })).toThrow(RangeError);
    expect(rng.next()).toBe(control.next());
  }
);

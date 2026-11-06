import { expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import schema from '../../data/schema/monster.schema.json';
import rows from '../../data/monsters/act2.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';
import type { MonsterTier } from './types';

const validate = compileAuthoredValidator<MonsterDef>(new Ajv2020({ strict: true }), 'monsters');
const original: unknown = rows.find(row => row.id === 'monsters/act2.duriel');
if (!validate(original)) throw new Error('Invalid Duriel definition');
// Both controls are custom bodies: edited rows cannot borrow bundled delivery provenance.
const plain = { ...original, id: 'monsters/fixture' };
Reflect.deleteProperty(plain, 'critDamage');

it.each([1, 1.25, 2.5])('accepts authored critical multiplier %s without changing other stats or RNG', value => {
  const def = { ...plain, critDamage: value };
  expect(validate(def)).toBe(true);
  expect(schema.additionalProperties).toBe(false);
  const before = structuredClone(def), left = createRng(13), right = createRng(13);
  const changed = buildMonsterUnit({ def, level: 32, tier: 'chapter-boss', rng: left });
  const control = buildMonsterUnit({ def: plain, level: 32, tier: 'chapter-boss', rng: right });
  expect(changed.stats.critDamage).toBe(value);
  expect({ ...changed, stats: { ...changed.stats, critDamage: control.stats.critDamage } }).toEqual(control);
  expect(left.next()).toBe(right.next());
  expect(def).toEqual(before);
});

it('retains the absent-field defaults and uses authored data for every tier without ID inference', () => {
  const tiers: MonsterTier[] = ['trash', 'elite', 'rare-elite', 'rare-minion', 'champion', 'boss', 'chapter-boss'];
  for (const tier of tiers) {
    expect(validate(plain)).toBe(true);
    const options = { level: 32, tier };
    const control = buildMonsterUnit({ ...options, def: plain, rng: createRng(7) });
    expect(control.stats.critDamage).toBe(tier === 'boss' || tier === 'chapter-boss' ? 1.75 : 1.5);
    expect(control.stats.critChance).toBe(tier === 'boss' || tier === 'chapter-boss' ? .10 : .05);
    const renamed = { ...plain, id: 'monsters/fixture', name: 'Unrelated', critDamage: 1.25 };
    expect(buildMonsterUnit({ ...options, def: renamed, rng: createRng(7) }).stats.critDamage).toBe(1.25);
  }
});

it.each([0, .99, -1, NaN, Infinity, -Infinity, '1.25', null])(
  'rejects invalid critical multiplier %s at the schema and direct factory boundaries before drawing RNG', value => {
    const def = { ...plain, critDamage: value } as MonsterDef;
    expect(validate(def)).toBe(false);
    const left = createRng(13), right = createRng(13);
    expect(() => buildMonsterUnit({ def, level: 32, tier: 'chapter-boss', rng: left }))
      .toThrow('Invalid critical damage multiplier');
    expect(left.next()).toBe(right.next());
  }
);

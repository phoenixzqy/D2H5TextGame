import { expect, it } from 'vitest';
import { GameDataValidationError, validateGameData } from '../loader';
import schema from '../schema/elite-config.schema.json';
import config from './elite-config.json';

const candidate = (value: unknown) => ({ ...config, affixes: [
  { id: 'elite-affix/custom', nameKey: 'fixture.custom', skillId: 'monster-charge', attackSpeedMultiplier: value }
] });

it('validates actual elite data with exactly one authored Fast speed modifier', () => {
  expect(() => validateGameData(schema.$id, config)).not.toThrow();
  expect(config.affixes.filter(row => row.attackSpeedMultiplier !== undefined))
    .toEqual([{ id: 'elite-affix/fast', nameKey: 'combat.eliteAffix.fast',
      skillId: 'monster-charge', attackSpeedMultiplier: 1.5 }]);
});

it('preserves legacy affixes without speed metadata', () => {
  const legacy = { ...config, affixes: config.affixes.map(({ attackSpeedMultiplier: _speed, ...affix }) => affix) };
  expect(() => validateGameData(schema.$id, legacy)).not.toThrow();
});

it.each([0.5, 1, 1.5, 2])('accepts finite positive speed multiplier %s', value => {
  expect(() => validateGameData(schema.$id, candidate(value))).not.toThrow();
});

it.each([0, -1, NaN, Infinity, -Infinity, '1.5', null, true, {}, []])('rejects invalid authored speed %s', value => {
  expect(() => validateGameData(schema.$id, candidate(value))).toThrow(GameDataValidationError);
});

it('keeps affix properties strict', () => {
  expect(() => validateGameData(schema.$id, { ...config,
    affixes: [{ ...candidate(1.5).affixes[0], attackSpeedMultipler: 1.5 }] }))
    .toThrow(GameDataValidationError);
});

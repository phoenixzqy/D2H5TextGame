import { expect, it } from 'vitest';
import { GameDataValidationError, validateGameData } from '../loader';
import schema from '../schema/elite-config.schema.json';
import config from './elite-config.json';

const aura = { damage: 15, intervalMs: 5000, chillDurationMs: 2000 };
const candidate = (frostAura: unknown) => ({ ...config, affixes: [
  { id: 'elite-affix/custom', nameKey: 'fixture.custom', skillId: 'monster-frost-nova', frostAura }
] });

it('validates actual Cold Enchanted with its aura and resistance, leaving every other affix without a passive', () => {
  expect(() => validateGameData(schema.$id, config)).not.toThrow();
  expect(config.affixes.filter(affix => affix.frostAura !== undefined)).toEqual([
    { id: 'elite-affix/cold-enchanted', nameKey: 'combat.eliteAffix.coldEnchanted',
      skillId: 'monster-frost-nova', resistanceBonuses: { cold: 50 }, frostAura: aura }
  ]);
});

it('preserves schema compatibility for affixes without passive metadata', () => {
  const legacy = { ...config, affixes: config.affixes.map(({ frostAura: _aura, ...affix }) => affix) };
  expect(() => validateGameData(schema.$id, legacy)).not.toThrow();
});

it.each([aura, { damage: 0, intervalMs: 1000, chillDurationMs: 1000 },
  { damage: 9.5, intervalMs: 3000, chillDurationMs: 1000 }])('accepts authored aura %j', value => {
  expect(() => validateGameData(schema.$id, candidate(value))).not.toThrow();
});

it.each([
  null, [], {}, 15, { ...aura, damage: NaN }, { ...aura, damage: Infinity },
  { ...aura, damage: -1 }, { ...aura, damage: '15' },
  { ...aura, intervalMs: 999 }, { ...aura, intervalMs: 1000.5 },
  { ...aura, intervalMs: Infinity }, { ...aura, chillDurationMs: 999 },
  { ...aura, chillDurationMs: 1000.5 }, { ...aura, chillDurationMs: NaN },
  { ...aura, extra: true }, { damage: 15, intervalMs: 5000 }
])('rejects invalid authored aura %j', value => {
  expect(() => validateGameData(schema.$id, candidate(value))).toThrow(GameDataValidationError);
});

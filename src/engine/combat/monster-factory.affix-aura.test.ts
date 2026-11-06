import { expect, it } from 'vitest';
import act1Monsters from '../../data/monsters/act1.json';
import act2Monsters from '../../data/monsters/act2.json';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';

const fallen = (act1Monsters as unknown as MonsterDef[]).find(row => row.id === 'monsters/act1.fallen');
const duriel = (act2Monsters as unknown as MonsterDef[]).find(row => row.id === 'monsters/act2.duriel');
if (!fallen || !duriel?.frostAura) throw new Error('Missing native aura fixtures');
const aura = { damage: 15, intervalMs: 5000, chillDurationMs: 2000 };

it('copies an explicit affix aura immutably without changing other fields or consuming additional RNG', () => {
  const rng = createRng(7), control = createRng(7);
  const opts = { def: fallen, level: 7, tier: 'champion' as const };
  const before = structuredClone({ opts, aura });
  const unit = buildMonsterUnit({ ...opts, rng, frostAura: aura });
  const plain = buildMonsterUnit({ ...opts, rng: control });
  expect(unit.frostAura).toEqual(aura);
  expect(unit.frostAura).not.toBe(aura);
  expect(Object.isFrozen(unit.frostAura)).toBe(true);
  const { frostAura: _aura, ...withoutAura } = unit;
  expect(withoutAura).toEqual(plain);
  expect(rng.next()).toBe(control.next());
  expect({ opts, aura }).toEqual(before);
});

it('preserves the native Duriel aura when an override is absent and replaces it once when supplied', () => {
  const opts = { def: duriel, level: 32, tier: 'boss' as const };
  const native = buildMonsterUnit({ ...opts, rng: createRng(7) });
  expect(buildMonsterUnit({ ...opts, rng: createRng(7), frostAura: undefined })).toEqual(native);
  expect(native.frostAura).toEqual(duriel.frostAura);
  expect(native.frostAura).not.toBe(duriel.frostAura);
  const override = { damage: 9.5, intervalMs: 3000, chillDurationMs: 1000 };
  const unit = buildMonsterUnit({ ...opts, rng: createRng(7), frostAura: override });
  expect(unit.frostAura).toEqual(override);
  expect({ ...unit, frostAura: native.frostAura }).toEqual(native);
});

it('accepts zero damage and the minimum cadence without inferring an aura from skill IDs', () => {
  const opts = { def: fallen, level: 7, tier: 'champion' as const,
    extraSkillIds: ['monster-frost-aura', 'monster-frost-nova'] };
  expect(buildMonsterUnit({ ...opts, rng: createRng(7) }).frostAura).toBeUndefined();
  const zero = { damage: 0, intervalMs: 1000, chillDurationMs: 1000 };
  expect(buildMonsterUnit({ ...opts, rng: createRng(7), frostAura: zero }).frostAura).toEqual(zero);
});

it.each([
  null, [], {}, 15, { ...aura, damage: NaN }, { ...aura, damage: Infinity },
  { ...aura, damage: -1 }, { ...aura, damage: '15' },
  { ...aura, intervalMs: 999 }, { ...aura, intervalMs: 1000.5 },
  { ...aura, intervalMs: Infinity }, { ...aura, chillDurationMs: 999 },
  { ...aura, chillDurationMs: 1000.5 }, { ...aura, chillDurationMs: NaN },
  { ...aura, extra: true }, { damage: 15, intervalMs: 5000 }
])('rejects invalid supplied aura %j before consuming RNG', value => {
  const rng = createRng(7), control = createRng(7);
  expect(() => buildMonsterUnit({ def: fallen, level: 7, tier: 'champion', rng,
    frostAura: value as unknown as MonsterDef['frostAura'] })).toThrow(RangeError);
  expect(rng.next()).toBe(control.next());
});

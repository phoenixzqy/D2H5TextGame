import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import recovery from '../../data/combat/recovery.json';
import schema from '../../data/schema/recovery.schema.json';
import { RECOVERY_DEFINITION, resolveRecoveryDefinition } from './recovery-definition';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

describe('P07a01a authored hero mana recovery baseline', () => {
  it('validates the actual JSON and exposes its frozen provisional per-Energy rate', () => {
    const before = structuredClone(recovery);
    expect(validate(recovery)).toBe(true);
    expect(RECOVERY_DEFINITION).toEqual({
      id: 'combat/recovery', heroManaPerEffectiveEnergyPerSecond: 0.2
    });
    expect(resolveRecoveryDefinition(recovery)).toEqual(RECOVERY_DEFINITION);
    expect(Object.isFrozen(RECOVERY_DEFINITION)).toBe(true);
    expect(recovery).toEqual(before);
  });

  it.each([0, 0.125, 2])('copies a valid rate %s without retaining or freezing the source', (rate) => {
    const source = { id: 'combat/recovery', heroManaPerEffectiveEnergyPerSecond: rate };
    const before = structuredClone(source);
    expect(validate(source)).toBe(true);
    const definition = resolveRecoveryDefinition(source);
    expect(definition).toEqual(before);
    expect(definition).not.toBe(source);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(source)).toBe(false);
    expect(source).toEqual(before);
    source.heroManaPerEffectiveEnergyPerSecond = 999;
    expect(definition.heroManaPerEffectiveEnergyPerSecond).toBe(rate);
    expect(Reflect.set(definition, 'heroManaPerEffectiveEnergyPerSecond', 888)).toBe(false);
    expect(definition.heroManaPerEffectiveEnergyPerSecond).toBe(rate);
  });

  it.each([-1, NaN, Infinity, -Infinity, '0.2', null, true])(
    'rejects invalid rate %s at the schema and pure-definition boundary', (rate) => {
      const source = { id: 'combat/recovery', heroManaPerEffectiveEnergyPerSecond: rate };
      const before = structuredClone(source);
      expect(validate(source)).toBe(false);
      expect(() => resolveRecoveryDefinition(source)).toThrow(/Invalid combat recovery definition/);
      expect(source).toEqual(before);
    }
  );

  it.each([
    undefined, null, [], 0.2, 'combat/recovery', {},
    { id: 'combat/recovery' },
    { heroManaPerEffectiveEnergyPerSecond: 0.2 },
    { id: 'other/recovery', heroManaPerEffectiveEnergyPerSecond: 0.2 },
    { id: 'combat/recovery', heroManaPerEffectiveEnergyPerSecond: 0.2, extra: 1 }
  ])('rejects an incomplete or unknown config shape: %j', (source) => {
    const before = structuredClone(source);
    expect(validate(source)).toBe(false);
    expect(() => resolveRecoveryDefinition(source)).toThrow(/Invalid combat recovery definition/);
    expect(source).toEqual(before);
  });
});

import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import chill from '../../data/combat/chill.json';
import schema from '../../data/schema/chill.schema.json';
import { CHILL_DEFINITION, resolveChillDefinition } from './chill-definition';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

describe('authored Chill attack-speed coefficient', () => {
  it('loads the actual closed JSON definition with the advertised half-speed stat', () => {
    const before = structuredClone(chill);
    expect(validate(chill)).toBe(true);
    expect(CHILL_DEFINITION).toEqual({ id: 'combat/chill', attackSpeedMultiplier: 0.5 });
    expect(resolveChillDefinition(chill)).toEqual(CHILL_DEFINITION);
    expect(Object.isFrozen(CHILL_DEFINITION)).toBe(true);
    expect(chill).toEqual(before);
  });

  it.each([0.001, 0.5, 1])('copies and freezes valid multiplier %s without mutating callers', m => {
    const source = { id: 'combat/chill', attackSpeedMultiplier: m };
    expect(validate(source)).toBe(true);
    const definition = resolveChillDefinition(source);
    expect(definition).toEqual(source);
    expect(definition).not.toBe(source);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(source)).toBe(false);
    source.attackSpeedMultiplier = 0.9;
    expect(definition.attackSpeedMultiplier).toBe(m);
    expect(Reflect.set(definition, 'attackSpeedMultiplier', 0.8)).toBe(false);
    expect(definition.attackSpeedMultiplier).toBe(m);
  });

  it.each([0, -0.1, 1.001, NaN, Infinity, -Infinity, '0.5', null, true])(
    'rejects invalid multiplier %s', m => {
      const source = { id: 'combat/chill', attackSpeedMultiplier: m };
      const before = structuredClone(source);
      expect(validate(source)).toBe(false);
      expect(() => resolveChillDefinition(source)).toThrow('Invalid combat Chill definition');
      expect(source).toEqual(before);
    }
  );

  it.each([
    undefined, null, [], 0.5, 'combat/chill', {},
    { id: 'combat/chill' }, { attackSpeedMultiplier: 0.5 },
    { id: 'other/chill', attackSpeedMultiplier: 0.5 },
    { id: 'combat/chill', attackSpeedMultiplier: 0.5, durationMs: 2000 }
  ])('rejects incomplete, wrong or unknown shape %j', source => {
    const before = structuredClone(source);
    expect(validate(source)).toBe(false);
    expect(() => resolveChillDefinition(source)).toThrow('Invalid combat Chill definition');
    expect(source).toEqual(before);
  });
});

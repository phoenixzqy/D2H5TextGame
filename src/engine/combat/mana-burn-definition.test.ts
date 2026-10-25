import { expect, it } from 'vitest';
import data from '../../data/combat/mana-burn.json';
import { MANA_BURN_DEFINITION, resolveManaBurnDefinition } from './mana-burn-definition';

it('validates actual tuning and returns a frozen detached policy', () => {
  const source = structuredClone(data), definition = resolveManaBurnDefinition(source);
  expect(definition).toEqual({ id: 'combat/mana-burn', drainFraction: .2,
    zeroManaArcaneMultiplier: 1.5, durationSeconds: -1 });
  expect(definition).toEqual(MANA_BURN_DEFINITION);
  expect(Object.isFrozen(definition)).toBe(true);
  source.drainFraction = .9;
  expect(definition.drainFraction).toBe(.2);
  expect(Object.isFrozen(source)).toBe(false);
});
it.each([
  undefined, null, [], {}, { ...data, extra: true }, { ...data, id: 'other' },
  ...[0, -.1, 1.01, NaN, Infinity, '0.2'].map(drainFraction => ({ ...data, drainFraction })),
  ...[0, 1, NaN, Infinity, '1.5'].map(zeroManaArcaneMultiplier => ({ ...data, zeroManaArcaneMultiplier })),
  ...[0, 3, '-1', undefined].map(durationSeconds => ({ ...data, durationSeconds }))
])('rejects invalid or incomplete shared policy %j without mutating it', source => {
  const before = structuredClone(source);
  expect(() => resolveManaBurnDefinition(source)).toThrow('Invalid combat Mana Burn definition');
  expect(source).toEqual(before);
});

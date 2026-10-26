import { expect, it } from 'vitest';
import { PLAGUE_DEFINITION, resolvePlagueDefinition } from './plague-definition';

const authored = { id: 'combat/plague', poisonStacksForEpidemic: 10,
  ordinarySpreadFraction: .5, epidemicSpreadFraction: 1 };

it('loads the authored max-Poison threshold and ordinary/Epidemic fractions', () => {
  expect(PLAGUE_DEFINITION).toEqual(authored);
  expect(Object.isFrozen(PLAGUE_DEFINITION)).toBe(true);
});
it('copies valid tuning without freezing or retaining mutable caller input', () => {
  const source = { ...authored, poisonStacksForEpidemic: 8, ordinarySpreadFraction: .25 };
  const before = structuredClone(source), result = resolvePlagueDefinition(source);
  expect(result).toEqual(before);
  expect(result).not.toBe(source);
  expect(source).toEqual(before);
  expect(Object.isFrozen(source)).toBe(false);
  source.ordinarySpreadFraction = .75;
  expect(result.ordinarySpreadFraction).toBe(.25);
  expect(Reflect.set(result, 'epidemicSpreadFraction', .9)).toBe(false);
});
it.each([undefined, null, [], {}, 10, 'combat/plague',
  { ...authored, id: 'combat/other' }, { ...authored, unknown: true },
  { ...authored, poisonStacksForEpidemic: 0 }, { ...authored, poisonStacksForEpidemic: 11 },
  { ...authored, poisonStacksForEpidemic: 1.5 },
  { ...authored, epidemicSpreadFraction: .25 }])('rejects invalid shape/range/order %#', source => {
  const before = structuredClone(source);
  expect(() => resolvePlagueDefinition(source)).toThrow('Invalid combat Plague definition');
  expect(source).toEqual(before);
});
it.each(['poisonStacksForEpidemic', 'ordinarySpreadFraction', 'epidemicSpreadFraction'])(
  'requires finite numeric %s and rejects missing values', key => {
    for (const value of [undefined, null, '1', NaN, Infinity, -Infinity, 0, -1]) {
      expect(() => resolvePlagueDefinition({ ...authored, [key]: value })).toThrow('Invalid combat Plague definition');
    }
    const source: Record<string, unknown> = { ...authored };
    Reflect.deleteProperty(source, key);
    expect(() => resolvePlagueDefinition(source)).toThrow('Invalid combat Plague definition');
  });
it.each(['ordinarySpreadFraction', 'epidemicSpreadFraction'])('rejects over-one %s', key => {
  expect(() => resolvePlagueDefinition({ ...authored, [key]: 1.01 })).toThrow('Invalid combat Plague definition');
});

import { expect, it } from 'vitest';
import type { CombatUnit } from './types';
import { cellsForAoeShape, resolveAoeTargets } from './grid';

function unit(id: string, row?: number, col?: number): CombatUnit {
  return { id, name: id, side: 'enemy', level: 1, tier: 'trash',
    stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 1, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    life: 100, mana: 0, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false,
    ...(row !== undefined && col !== undefined ? { gridPosition: { row, col } } : {}) };
}
const ids = (units: readonly CombatUnit[]) => units.map(value => value.id);
it('starts at target priority, then follows nearest unvisited neighbors up to the cap', () => {
  const input = Array.from({ length: 12 }, (_, i) => unit(String(i), Math.floor(i / 3), i % 3));
  const before = structuredClone(input);
  expect(ids(resolveAoeTargets(input, 'chain', 5))).toEqual(['0', '1', '2', '5', '4']);
  expect(input).toEqual(before);
});
it('reaches five separated targets across overflow rows', () => {
  const input = Array.from({ length: 8 }, (_, i) => unit(String(i), i * 10, i % 3));
  expect(ids(resolveAoeTargets(input, 'chain', 5))).toEqual(['0', '1', '2', '3', '4']);
});
it('breaks equal-distance ties by existing target priority rather than coordinates', () => {
  const input = [unit('start', 3, 3), unit('priority', 4, 3), unit('other', 2, 3)];
  expect(ids(resolveAoeTargets(input, 'chain', 2))).toEqual(['start', 'priority']);
});
it('does not revisit duplicate IDs or mutate the original target references', () => {
  const a = unit('a', 0, 0), b = unit('b', 0, 1);
  const out = resolveAoeTargets([a, a, b, unit('a', 9, 9)], 'chain', 5);
  expect(ids(out)).toEqual(['a', 'b']); expect(out[0]).toBe(a); expect(out[1]).toBe(b);
});
it('uses target priority for missing positions without the legacy two-target fallback', () => {
  const input = Array.from({ length: 7 }, (_, i) => unit(String(i)));
  expect(ids(resolveAoeTargets(input, 'chain', 5))).toEqual(['0', '1', '2', '3', '4']);
});
it('prefers known finite distances before unknown positions, preserving fallback order', () => {
  const input = [unit('start', 0, 0), unit('unknown'), unit('near', 0, 1), unit('unknown-2')];
  expect(ids(resolveAoeTargets(input, 'chain', 5))).toEqual(['start', 'near', 'unknown', 'unknown-2']);
});
it('handles empty pools, singleton pools and explicit zero/one caps', () => {
  expect(resolveAoeTargets([], 'chain', 5)).toEqual([]);
  const a = unit('a', 0, 0), b = unit('b', 0, 1);
  expect(resolveAoeTargets([a], 'chain', 5)).toEqual([a]);
  expect(resolveAoeTargets([a, b], 'chain', 0)).toEqual([]);
  expect(resolveAoeTargets([a, b], 'chain', 1)).toEqual([a]);
});
it('preserves geometric selection then cap and existing uncapped/default behavior', () => {
  const input = [unit('center', 1, 1), unit('top', 0, 1), unit('left', 1, 0), unit('right', 1, 2), unit('bottom', 2, 1)];
  expect(ids(resolveAoeTargets(input, 'cross'))).toEqual(['top', 'left', 'center', 'right', 'bottom']);
  expect(ids(resolveAoeTargets(input, 'cross', 3))).toEqual(['top', 'left', 'center']);
  expect(ids(resolveAoeTargets(input, undefined, 5))).toEqual(['center', 'top']);
  expect(ids(resolveAoeTargets(input, 'all-enemies', 3))).toEqual(['center', 'top', 'left']);
});
it('has no fixed cell footprint: every next hop depends on the preceding target', () => {
  expect(cellsForAoeShape({ row: 1, col: 1 }, 'chain')).toEqual([]);
});

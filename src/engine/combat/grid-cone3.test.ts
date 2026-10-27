import { expect, it } from 'vitest';
import { cellsForAoeShape, resolveAoeTargets } from './grid';
import type { CombatUnit } from './types';
it('cone3 contains ordered widening1/3/5 cells and preserves cone2', () => {
  const shape = 'cone-3';
  expect(cellsForAoeShape({ row: 0, col: 2 }, shape)).toEqual([
    { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }]);
  expect(cellsForAoeShape({ row: 0, col: 2 }, 'cone-2')).toEqual([
    { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }]);
  expect(cellsForAoeShape({ row: 0, col: 0 }, shape)).toEqual([
    { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }]);
});
it('cone3 picks its most populated anchor, caps in grid order and never mutates candidates', () => {
  const cells = cellsForAoeShape({ row: 0, col: 2 }, 'cone-3');
  const candidates = cells.map((gridPosition, i) => ({ id: 'enemy-' + String(i), gridPosition })) as CombatUnit[];
  const before = structuredClone(candidates);
  expect(resolveAoeTargets([...candidates].reverse(), 'cone-3', 5).map(u => u.id))
    .toEqual(['enemy-0', 'enemy-1', 'enemy-2', 'enemy-3', 'enemy-4']);
  expect(candidates).toEqual(before);
  expect(resolveAoeTargets([], 'cone-3', 5)).toEqual([]);
});

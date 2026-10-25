import { expect, it } from 'vitest';
import type { CombatUnit } from './types';
import { cellsForAoeShape, resolveAoeTargets, type AoeShape } from './grid';

const cone: AoeShape = 'cone-2';
// These pure selectors inspect only identity and grid position.
function unit(id: string, row: number, col: number): CombatUnit {
  return { id, gridPosition: { row, col } } as CombatUnit;
}
function grid(offset = 0) {
  return Array.from({ length: 9 }, (_, i) => unit(String(i), offset + Math.floor(i / 3), i % 3));
}
const ids = (units: readonly CombatUnit[]) => units.map((u) => u.id);

it('uses one apex cell and a three-cell widening next row', () => {
  expect(cellsForAoeShape({ row: 0, col: 1 }, cone)).toEqual([
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 }
  ]);
});
it('clips the negative edge without wrapping or adding same-row wings', () => {
  expect(cellsForAoeShape({ row: 0, col: 0 }, cone)).toEqual([
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 }
  ]);
});
it('preserves explicit overflow coordinates in the shared grid convention', () => {
  expect(cellsForAoeShape({ row: 4, col: 3 }, cone)).toEqual([
    { row: 4, col: 3 },
    { row: 5, col: 2 },
    { row: 5, col: 3 },
    { row: 5, col: 4 }
  ]);
  expect(ids(resolveAoeTargets(grid(3), cone))).toEqual(['1', '3', '4', '5']);
});
it('chooses the densest occupied apex with row then column tie order', () => {
  const targets = grid(),
    before = structuredClone(targets);
  for (const input of [
    targets,
    [...targets].reverse(),
    [...targets.slice(4), ...targets.slice(0, 4)]
  ])
    expect(ids(resolveAoeTargets(input, cone))).toEqual(['1', '3', '4', '5']);
  expect(targets).toEqual(before);
});
it('chooses a denser later apex rather than keeping the first candidate', () => {
  const targets = [
    unit('early', 0, 0),
    unit('apex', 2, 1),
    unit('left', 3, 0),
    unit('middle', 3, 1),
    unit('right', 3, 2)
  ];
  expect(ids(resolveAoeTargets(targets, cone))).toEqual(['apex', 'left', 'middle', 'right']);
});
it('resolves equal-density left and right cones by the leftmost apex', () => {
  const targets = [unit('right', 0, 2), unit('left', 0, 0), unit('below', 1, 1)];
  expect(ids(resolveAoeTargets(targets, cone))).toEqual(['left', 'below']);
});
it('covers cells rather than imposing an invented four-enemy cap', () => {
  expect(ids(resolveAoeTargets([...grid(), unit('duplicate', 1, 1)], cone))).toEqual([
    '1',
    '3',
    '4',
    'duplicate',
    '5'
  ]);
});
it('keeps the legacy first-two fallback when no coordinates exist', () => {
  const targets = ['a', 'b', 'c'].map((id) => ({ id }) as CombatUnit);
  expect(ids(resolveAoeTargets(targets, cone))).toEqual(['a', 'b']);
});
it('ignores unpositioned candidates when positioned candidates exist', () => {
  const targets = [...grid(), { id: 'missing' } as CombatUnit];
  expect(ids(resolveAoeTargets(targets, cone))).toEqual(['1', '3', '4', '5']);
});
it('returns no targets for an empty formation', () => {
  expect(resolveAoeTargets([], cone)).toEqual([]);
});

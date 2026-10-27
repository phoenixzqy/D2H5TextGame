import type { CombatUnit, GridPosition } from './types';

/** Position-aware AOE shapes supported by the battle grid. */
export type AoeShape =
  | 'single'
  | 'line-3'
  | 'column-3'
  | 'cross'
  | 'cone-2'
  | 'cone-3'
  | 'chain'
  | 'box-3x3'
  | 'all-enemies';

const DEFAULT_CELL_ORDER: readonly GridPosition[] = Object.freeze([
  { row: 1, col: 1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 2 },
  { row: 2, col: 1 },
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 2 }
]);

export function isValidGridPosition(pos: GridPosition | undefined): pos is GridPosition {
  return pos !== undefined &&
    Number.isInteger(pos.row) &&
    Number.isInteger(pos.col) &&
    pos.row >= 0 &&
    pos.col >= 0;
}

function keyOf(pos: GridPosition): string {
  return `${String(pos.row)}:${String(pos.col)}`;
}

function samePosition(a: GridPosition, b: GridPosition): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Assign deterministic 3-column positions to units that do not already have one. */
export function withDefaultGridPositions(units: readonly CombatUnit[]): CombatUnit[] {
  const occupied = new Set<string>();
  for (const unit of units) {
    if (isValidGridPosition(unit.gridPosition)) occupied.add(keyOf(unit.gridPosition));
  }

  let nextIndex = 0;
  return units.map((unit, index) => {
    if (isValidGridPosition(unit.gridPosition)) return unit;

    let pos: GridPosition | undefined;
    while (nextIndex < DEFAULT_CELL_ORDER.length) {
      const candidate = DEFAULT_CELL_ORDER[nextIndex];
      nextIndex++;
      if (!candidate || occupied.has(keyOf(candidate))) continue;
      pos = candidate;
      occupied.add(keyOf(candidate));
      break;
    }

    // Large waves can exceed the 3x3 presentation grid. Keep deterministic
    // 3-column overflow rows rather than dropping units or inventing range.
    pos ??= {
      row: 3 + Math.floor(Math.max(0, index - DEFAULT_CELL_ORDER.length) / 3),
      col: Math.max(0, index - DEFAULT_CELL_ORDER.length) % 3
    };

    return { ...unit, gridPosition: pos };
  });
}

/** Fixed shape cells; all-enemy and chain footprints depend on the target roster. */
export function cellsForAoeShape(anchor: GridPosition, shape: AoeShape): readonly GridPosition[] {
  switch (shape) {
    case 'single':
      return [anchor];
    case 'line-3':
      return [
        { row: anchor.row, col: anchor.col - 1 },
        anchor,
        { row: anchor.row, col: anchor.col + 1 }
      ].filter(isValidGridPosition);
    case 'column-3':
      return [
        { row: anchor.row - 1, col: anchor.col },
        anchor,
        { row: anchor.row + 1, col: anchor.col }
      ].filter(isValidGridPosition);
    case 'cross':
      return [
        anchor,
        { row: anchor.row, col: anchor.col - 1 },
        { row: anchor.row, col: anchor.col + 1 },
        { row: anchor.row - 1, col: anchor.col },
        { row: anchor.row + 1, col: anchor.col }
      ].filter(isValidGridPosition);
    case 'cone-3': {
      const cells: GridPosition[] = [];
      for (let depth = 0; depth < 3; depth++) {
        for (let col = anchor.col - depth; col <= anchor.col + depth; col++) {
          const cell = { row: anchor.row + depth, col };
          if (isValidGridPosition(cell)) cells.push(cell);
        }
      }
      return cells;
    }
    case 'cone-2':
      return [
        anchor,
        { row: anchor.row + 1, col: anchor.col - 1 },
        { row: anchor.row + 1, col: anchor.col },
        { row: anchor.row + 1, col: anchor.col + 1 }
      ].filter(isValidGridPosition);
    case 'box-3x3': {
      const cells: GridPosition[] = [];
      for (let row = anchor.row - 1; row <= anchor.row + 1; row++) {
        for (let col = anchor.col - 1; col <= anchor.col + 1; col++) {
          const pos = { row, col };
          if (isValidGridPosition(pos)) cells.push(pos);
        }
      }
      return cells;
    }
    case 'chain':
    case 'all-enemies':
      return [];
  }
}

function targetsInCells(
  candidates: readonly CombatUnit[],
  cells: readonly GridPosition[]
): CombatUnit[] {
  return candidates.filter((unit) => {
    const pos = unit.gridPosition;
    return isValidGridPosition(pos) && cells.some((cell) => samePosition(pos, cell));
  });
}

function compareByGrid(a: CombatUnit, b: CombatUnit): number {
  const ap = a.gridPosition;
  const bp = b.gridPosition;
  if (!isValidGridPosition(ap) || !isValidGridPosition(bp)) return 0;
  if (ap.row !== bp.row) return ap.row - bp.row;
  if (ap.col !== bp.col) return ap.col - bp.col;
  return 0;
}

/**
 * Resolve a shaped AOE target list from already-prioritized candidates.
 *
 * Missing shapes and candidates without positions fall back to the previous
 * first-two area behavior so legacy skills and synthetic callers still work.
 */
function shapedTargets(
  candidates: readonly CombatUnit[],
  shape?: AoeShape
): CombatUnit[] {
  if (shape === undefined) return candidates.slice(0, 2);
  if (shape === 'all-enemies') return [...candidates];
  if (shape === 'single') return candidates.slice(0, 1);

  const positioned = candidates.filter((unit) => isValidGridPosition(unit.gridPosition));
  if (positioned.length === 0) return candidates.slice(0, 2);

  let bestAnchor: GridPosition | null = null;
  let bestTargets: CombatUnit[] = [];
  for (const unit of positioned) {
    const anchor = unit.gridPosition;
    if (!anchor) continue;
    const targets = targetsInCells(candidates, cellsForAoeShape(anchor, shape));
    if (
      targets.length > bestTargets.length ||
      (
        targets.length === bestTargets.length &&
        bestAnchor !== null &&
        (anchor.row < bestAnchor.row || (anchor.row === bestAnchor.row && anchor.col < bestAnchor.col))
      ) ||
      (targets.length > 0 && bestAnchor === null)
    ) {
      bestAnchor = anchor;
      bestTargets = targets;
    }
  }

  return bestTargets.sort(compareByGrid);
}

function chainTargets(candidates: readonly CombatUnit[], limit: number): CombatUnit[] {
  const seen = new Set<string>();
  const remaining = candidates.filter(unit => {
    if (seen.has(unit.id)) return false;
    seen.add(unit.id);
    return true;
  });
  const selected: CombatUnit[] = [];
  while (remaining.length > 0 && selected.length < limit) {
    const previous = selected.at(-1)?.gridPosition;
    let nextIndex = 0, nearest = Infinity;
    for (let index = 0; index < remaining.length; index++) {
      const position = remaining[index]?.gridPosition;
      const distance = isValidGridPosition(previous) && isValidGridPosition(position)
        ? Math.abs(previous.row - position.row) + Math.abs(previous.col - position.col) : Infinity;
      if (distance < nearest) { nearest = distance; nextIndex = index; }
    }
    const next = remaining.splice(nextIndex, 1)[0];
    if (next) selected.push(next);
  }
  return selected;
}

/**
 * Resolve prioritized targets without mutation or RNG. The optional cap follows
 * geometric selection; chains stop at the cap and never revisit an ID. A chain
 * starts at target priority, then chooses the nearest Manhattan-grid neighbor,
 * preserving priority on ties and placing unknown distances after finite ones.
 */
export function resolveAoeTargets(
  candidates: readonly CombatUnit[],
  shape?: AoeShape,
  maxTargets?: number
): CombatUnit[] {
  const targets = shape === 'chain' ? chainTargets(candidates, maxTargets ?? candidates.length)
    : shapedTargets(candidates, shape);
  return maxTargets === undefined ? targets : targets.slice(0, maxTargets);
}

import { describe, expect, it } from 'vitest';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import {
  cellsForAoeShape,
  resolveAoeTargets,
  withDefaultGridPositions
} from './grid';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 10,
  defense: 0,
  attackSpeed: 10,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function unit(id: string, row: number, col: number): CombatUnit {
  return {
    id,
    name: id,
    side: 'enemy',
    level: 1,
    tier: 'trash',
    stats: baseStats,
    life: 100,
    mana: 50,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    gridPosition: { row, col }
  };
}

function unpositioned(id: string): CombatUnit {
  const { gridPosition: _gridPosition, ...combatUnit } = unit(id, 9, 9);
  return combatUnit;
}

describe('combat grid AOE', () => {
  it('assigns deterministic default 3-column grid positions', () => {
    const positioned = withDefaultGridPositions([
      unpositioned('a'),
      unpositioned('b'),
      unpositioned('c'),
      unpositioned('d')
    ]);

    expect(positioned.map((u) => u.gridPosition)).toEqual([
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 }
    ]);
  });

  it('computes a 3x3 box around the anchor cell', () => {
    expect(cellsForAoeShape({ row: 1, col: 1 }, 'box-3x3')).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 }
    ]);
  });

  it('chooses the densest anchor and returns deterministic row-major targets', () => {
    const targets = [
      unit('top-left', 0, 0),
      unit('top-mid', 0, 1),
      unit('mid-mid', 1, 1),
      unit('far-row', 4, 1)
    ];

    expect(resolveAoeTargets(targets, 'box-3x3').map((u) => u.id)).toEqual([
      'top-left',
      'top-mid',
      'mid-mid'
    ]);
  });

  it('falls back to the legacy first-two area behavior when positions are absent', () => {
    const targets = [
      unpositioned('a'),
      unpositioned('b'),
      unpositioned('c')
    ];

    expect(resolveAoeTargets(targets, 'cross').map((u) => u.id)).toEqual(['a', 'b']);
  });

  it('preserves legacy first-two area behavior when no shape is provided', () => {
    const targets = [
      unit('a', 0, 0),
      unit('b', 0, 1),
      unit('c', 0, 2)
    ];

    expect(resolveAoeTargets(targets).map((u) => u.id)).toEqual(['a', 'b']);
  });
});

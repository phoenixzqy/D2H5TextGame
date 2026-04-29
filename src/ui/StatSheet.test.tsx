/**
 * StatSheet DOM tests — verifies the equip-compare panel renders as a
 * single 3-column table whose row structure stays consistent across the
 * three modes:
 *   1. single (current-only)
 *   2. compare with current present (3 cols)
 *   3. compare with current absent / first equip (2 cols, candidate-only)
 *
 * These guard against the previous bug where current/candidate columns
 * were rendered as two independent flex stacks, so labels and numbers
 * drifted out of alignment.
 */
import { describe, it, expect } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { StatSheet } from './StatSheet';
import type { ComparableStatKey, StatDelta } from '@/features/inventory/compareEquip';
import type { Resistances } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';

const STAT_KEYS: readonly ComparableStatKey[] = [
  'lifeMax', 'manaMax', 'attack', 'defense', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
];
const RESIST_KEYS_LOCAL: readonly (keyof Resistances)[] = [
  'fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'
];

function singleStats(): Record<ComparableStatKey, number> {
  return STAT_KEYS.reduce<Record<ComparableStatKey, number>>((acc, k) => {
    acc[k] = 10;
    return acc;
  }, {});
}

function singleResists(): Record<keyof Resistances, number> {
  return RESIST_KEYS_LOCAL.reduce<Record<keyof Resistances, number>>((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});
}

function compareStats(): Record<ComparableStatKey, StatDelta> {
  return STAT_KEYS.reduce<Record<ComparableStatKey, StatDelta>>((acc, k) => {
    acc[k] = { current: 10, candidate: 12, delta: 2 };
    return acc;
  }, {});
}

function compareResists(): Record<keyof Resistances, StatDelta> {
  return RESIST_KEYS_LOCAL.reduce<Record<keyof Resistances, StatDelta>>((acc, k) => {
    acc[k] = { current: 0, candidate: 0, delta: 0 };
    return acc;
  }, {});
}

const candidate: Item = {
  id: 'cand-1',
  baseId: 'items/base/weapon-sword',
  rarity: 'magic',
  level: 5,
  affixes: []
} as unknown as Item;

const current: Item = {
  id: 'cur-1',
  baseId: 'items/base/weapon-mace',
  rarity: 'normal',
  level: 5,
  affixes: []
} as unknown as Item;

function wrap(node: JSX.Element) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{node}</Suspense>
    </I18nextProvider>
  );
}

describe('<StatSheet>', () => {
  it('single mode renders a 2-column table with one row per stat', () => {
    render(
      wrap(
        <StatSheet
          mode="single"
          item={current}
          stats={singleStats()}
          resistances={singleResists()}
        />
      )
    );
    const table = screen.getByTestId('stat-compare-table');
    expect(table.tagName).toBe('TABLE');
    expect(table.getAttribute('data-cols')).toBe('2');
    const rows = screen.getAllByTestId('stat-row');
    expect(rows.length).toBe(STAT_KEYS.length);
    // Each row has exactly 1 <th> (label) + 1 <td> (current).
    for (const row of rows) {
      expect(row.querySelectorAll('th').length).toBe(1);
      expect(row.querySelectorAll('td').length).toBe(1);
    }
  });

  it('compare mode (current present) renders a 3-column table', () => {
    render(
      wrap(
        <StatSheet
          mode="compare"
          current={current}
          candidate={candidate}
          stats={compareStats()}
          resistances={compareResists()}
        />
      )
    );
    const table = screen.getByTestId('stat-compare-table');
    expect(table.getAttribute('data-cols')).toBe('3');
    const rows = screen.getAllByTestId('stat-row');
    expect(rows.length).toBe(STAT_KEYS.length);
    for (const row of rows) {
      expect(row.querySelectorAll('th').length).toBe(1);
      expect(row.querySelectorAll('td').length).toBe(2);
    }
  });

  it('compare mode (current=null, first equip) renders a 2-column table', () => {
    render(
      wrap(
        <StatSheet
          mode="compare"
          current={null}
          candidate={candidate}
          stats={compareStats()}
          resistances={compareResists()}
        />
      )
    );
    const table = screen.getByTestId('stat-compare-table');
    expect(table.getAttribute('data-cols')).toBe('2');
    const rows = screen.getAllByTestId('stat-row');
    expect(rows.length).toBe(STAT_KEYS.length);
    for (const row of rows) {
      expect(row.querySelectorAll('th').length).toBe(1);
      expect(row.querySelectorAll('td').length).toBe(1);
    }
  });

  it('omits delta when delta=0 (no parens rendered)', () => {
    const stats = compareStats();
    for (const k of STAT_KEYS) stats[k] = { current: 5, candidate: 5, delta: 0 };
    render(
      wrap(
        <StatSheet
          mode="compare"
          current={current}
          candidate={candidate}
          stats={stats}
          resistances={compareResists()}
        />
      )
    );
    const table = screen.getByTestId('stat-compare-table');
    expect(table.textContent).not.toMatch(/\(\+|\(-/);
  });

  it('uses tabular-nums on the table for digit alignment', () => {
    render(
      wrap(
        <StatSheet
          mode="single"
          item={current}
          stats={singleStats()}
          resistances={singleResists()}
        />
      )
    );
    const table = screen.getByTestId('stat-compare-table');
    expect(table.className).toMatch(/tabular-nums/);
  });
});

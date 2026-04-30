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
  const stats: Partial<Record<ComparableStatKey, number>> = {};
  for (const key of STAT_KEYS) stats[key] = 10;
  return stats as Record<ComparableStatKey, number>;
}

function singleResists(): Record<keyof Resistances, number> {
  const resists: Partial<Record<keyof Resistances, number>> = {};
  for (const key of RESIST_KEYS_LOCAL) resists[key] = 0;
  return resists as Record<keyof Resistances, number>;
}

function compareStats(): Record<ComparableStatKey, StatDelta> {
  const stats: Partial<Record<ComparableStatKey, StatDelta>> = {};
  for (const key of STAT_KEYS) stats[key] = { current: 10, candidate: 12, delta: 2 };
  return stats as Record<ComparableStatKey, StatDelta>;
}

function compareResists(): Record<keyof Resistances, StatDelta> {
  const resists: Partial<Record<keyof Resistances, StatDelta>> = {};
  for (const key of RESIST_KEYS_LOCAL) resists[key] = { current: 0, candidate: 0, delta: 0 };
  return resists as Record<keyof Resistances, StatDelta>;
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

  it('Bug 2: same-baseId items render distinct headers (rarity badge)', () => {
    const a = { ...current, baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const, affixes: [] } as Item;
    const b = { ...candidate, baseId: 'items/base/wp1h-short-sword', rarity: 'magic' as const, affixes: [{ id: 'x' }, { id: 'y' }] } as unknown as Item;
    render(
      wrap(
        <StatSheet
          mode="compare"
          current={a}
          candidate={b}
          stats={compareStats()}
          resistances={compareResists()}
        />
      )
    );
    const curHeader = screen.getByTestId('current-item-header');
    const candHeader = screen.getByTestId('candidate-item-header');
    // Same base name on both columns, distinct badges (rarity + affix count).
    expect(curHeader.textContent).not.toEqual(candHeader.textContent);
    // Candidate should expose `+2` affix count badge.
    expect(candHeader.textContent ?? '').toMatch(/\+2/);
  });

  it('compare mode adds data-col attrs and data-trend on non-zero deltas', () => {
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
    const cur = screen.getByTestId('current-item-header');
    const cand = screen.getByTestId('candidate-item-header');
    expect(cur.getAttribute('data-col')).toBe('current');
    expect(cand.getAttribute('data-col')).toBe('candidate');
    const deltas = screen.getAllByTestId('stat-delta');
    expect(deltas.length).toBeGreaterThan(0);
    for (const d of deltas) {
      const trend = d.getAttribute('data-trend');
      expect(['up', 'down', 'flat']).toContain(trend);
      // Arrow glyph or sign present (non-color signal).
      expect(d.textContent ?? '').toMatch(/[↑↓]/);
    }
  });

  it('empty-slot single mode marks current header data-empty="true"', () => {
    render(
      wrap(
        <StatSheet
          mode="single"
          item={null}
          stats={singleStats()}
          resistances={singleResists()}
          emptySlot
        />
      )
    );
    const h = screen.getByTestId('current-item-header');
    expect(h.getAttribute('data-empty')).toBe('true');
  });
});

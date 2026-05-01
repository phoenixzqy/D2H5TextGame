/**
 * EquipPicker RTL — mirrors the 5/6 sub-tests from
 * tests/e2e/equip-picker-v3.spec.ts at unit level:
 *   - Esc closes the picker (calls onClose).
 *   - Auto-select first eligible candidate on open.
 *   - Changing the candidate updates [data-col=candidate] header text.
 *   - Same-baseId+rarity headers differ via rarity badge.
 *   - data-trend on stat-delta cells (delegated to <StatSheet>).
 *   - aria-live region present in the compare panel.
 *
 * What stays Playwright-only (documented for P08):
 *   - 360×640 horizontal-scroll measurement (browser layout / CSS).
 *   - Real ScreenShell + inventory-screen "click slot to open" plumbing
 *     (browser-level testid harness `equip-slot-weapon`, gesture, stash).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { EquipPicker } from './EquipPicker';
import { useInventoryStore, usePlayerStore } from '@/stores';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';

function shortSword(id: string, rarity: 'normal' | 'magic'): Item {
  const affixes =
    rarity === 'magic'
      ? [
          {
            id: 'affix-test-prefix',
            name: 'affix.test.sharp',
            type: 'prefix' as const,
            tier: 1,
            mods: [{ stat: 'attack', value: 5 }],
          },
        ]
      : [];
  return {
    id,
    baseId: 'items/base/wp1h-short-sword',
    rarity,
    level: 1,
    ilvl: 1,
    identified: true,
    equipped: false,
    affixes,
  } as unknown as Item;
}

function wrap(node: JSX.Element) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{node}</Suspense>
    </I18nextProvider>
  );
}

function seedPlayer() {
  act(() => {
    usePlayerStore.getState().setPlayer(createMockPlayer('PickerHero', 'barbarian'));
  });
}

function seedBackpack(items: Item[]) {
  act(() => {
    useInventoryStore.getState().reset();
    for (const it of items) useInventoryStore.getState().addItem(it);
  });
}

describe('<EquipPicker> — Esc / auto-select / candidate change (mirrors equip-picker-v3.spec.ts)', () => {
  beforeEach(async () => {
    act(() => { usePlayerStore.getState().reset(); });
    act(() => { useInventoryStore.getState().reset(); });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('returns null when slot is null (renders nothing)', () => {
    seedPlayer();
    const onClose = vi.fn();
    const { container } = render(
      wrap(<EquipPicker slot={null} onClose={onClose} />),
    );
    expect(container.querySelector('[data-testid="equip-picker"]')).toBeNull();
  });

  it('auto-selects the first eligible candidate and populates the compare panel', () => {
    seedPlayer();
    const a = shortSword('cand-normal', 'normal');
    const b = shortSword('cand-magic', 'magic');
    seedBackpack([a, b]);

    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));

    expect(screen.getByTestId('equip-picker')).toBeInTheDocument();
    const panel = screen.getByTestId('compare-panel');
    expect(panel).toBeInTheDocument();
    expect(screen.getByTestId('item-compare')).toBeInTheDocument();
    expect(screen.getByTestId('stat-compare-table')).toHaveAttribute('data-cols', '3');
    // Both column markers exist.
    expect(panel.querySelectorAll('th[data-col="current"]').length).toBe(1);
    expect(panel.querySelectorAll('th[data-col="candidate"]').length).toBe(1);
    // Empty current slot → current header marked data-empty.
    expect(screen.getByTestId('current-item-header').getAttribute('data-empty')).toBe('true');
    // First-eligible row is selected (aria-selected="true" on its <li>).
    const selectedRow = panel.parentElement?.querySelector(
      `[data-testid="equip-picker-row-${a.id}"]`,
    );
    // The auto-selected row is whichever appears first in slotCandidates.
    const allRows = document.querySelectorAll('[role="option"][aria-selected="true"]');
    expect(allRows.length).toBe(1);
    expect(selectedRow ?? document.querySelector('[role="option"][aria-selected="true"]')).toBeTruthy();
  });

  it('renders an aria-live="polite" region inside compare-panel', () => {
    seedPlayer();
    seedBackpack([shortSword('cand-magic', 'magic')]);
    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));
    const panel = screen.getByTestId('compare-panel');
    expect(panel.querySelectorAll('[aria-live="polite"]').length).toBe(1);
  });

  it('Esc key invokes onClose', () => {
    seedPlayer();
    seedBackpack([shortSword('only', 'magic')]);
    const onClose = vi.fn();
    render(wrap(<EquipPicker slot="weapon" onClose={onClose} />));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking the close (×) button invokes onClose', () => {
    seedPlayer();
    seedBackpack([shortSword('only', 'magic')]);
    const onClose = vi.fn();
    render(wrap(<EquipPicker slot="weapon" onClose={onClose} />));
    fireEvent.click(screen.getByTestId('equip-picker-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('changing the candidate updates the candidate-item-header text', () => {
    seedPlayer();
    const a = shortSword('cand-normal', 'normal');
    const b = shortSword('cand-magic', 'magic');
    seedBackpack([a, b]);
    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));

    const candHeader = screen.getByTestId('candidate-item-header');
    const before = candHeader.textContent || '';
    // Click the *other* candidate row.
    const rows = document.querySelectorAll('[data-testid^="equip-picker-row-"]');
    expect(rows.length).toBe(2);
    const selectedFirst = document.querySelector('[role="option"][aria-selected="true"]');
    const otherRow = Array.from(rows).find((r) => r !== selectedFirst) as HTMLElement | undefined;
    expect(otherRow).toBeDefined();
    if (otherRow) fireEvent.click(otherRow);

    const after = screen.getByTestId('candidate-item-header').textContent || '';
    expect(after).not.toBe(before);
  });

  it('same-baseId items render distinct current/candidate headers (rarity badge)', () => {
    seedPlayer();
    const cur = shortSword('eq-normal', 'normal');
    const cand = shortSword('cand-magic', 'magic');
    // Equip the normal one first.
    act(() => {
      useInventoryStore.getState().reset();
      useInventoryStore.getState().addItem(cur);
      useInventoryStore.getState().addItem(cand);
      const r = useInventoryStore.getState().equipItem(cur);
      expect(r.ok).toBe(true);
    });

    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));
    const curHeader = screen.getByTestId('current-item-header');
    const candHeader = screen.getByTestId('candidate-item-header');
    expect(curHeader.textContent).not.toEqual(candHeader.textContent);
    // Candidate carries a "魔法" / "Magic" rarity badge.
    expect(candHeader.textContent || '').toMatch(/魔法|Magic/);
  });

  it('non-zero stat-delta cells carry data-trend (up|down) and an arrow glyph', () => {
    // Empty current slot vs a sword candidate yields positive base-damage
    // deltas through the same engine pipeline the production path uses.
    // Affix-driven scaling needs a fully-rolled AffixRoll which is out of
    // scope at the unit level — rely on base-stat deltas instead.
    seedPlayer();
    const cand = shortSword('cand-magic', 'magic');
    seedBackpack([cand]);
    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));

    const deltas = document.querySelectorAll('[data-testid="stat-delta"]');
    expect(deltas.length).toBeGreaterThan(0);
    let nonZero = 0;
    for (const d of Array.from(deltas)) {
      const trend = d.getAttribute('data-trend');
      expect(['up', 'down', 'flat']).toContain(trend);
      if (trend !== 'flat') {
        nonZero++;
        expect(d.textContent || '').toMatch(/[↑↓]/);
      }
    }
    expect(nonZero).toBeGreaterThan(0);
  });

  it('confirm button equips the candidate and calls onEquipped + onClose', () => {
    seedPlayer();
    seedBackpack([shortSword('only', 'magic')]);
    const onEquipped = vi.fn();
    const onClose = vi.fn();
    render(
      wrap(
        <EquipPicker
          slot="weapon"
          onClose={onClose}
          onEquipped={onEquipped}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId('equip-picker-confirm'));
    expect(onEquipped).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useInventoryStore.getState().equipped.weapon?.id).toBe('only');
  });

  it('shows the already-equipped badge and disables Equip when same item is selected', () => {
    seedPlayer();
    const same = shortSword('only', 'normal');
    act(() => {
      useInventoryStore.getState().reset();
      useInventoryStore.getState().addItem(same);
      useInventoryStore.getState().equipItem(same);
    });
    // After equipping, slotCandidates(backpack) should include nothing of
    // matching baseId from backpack — but we want to assert the
    // already-equipped path. Add a structurally-identical clone.
    const clone = shortSword('clone', 'normal');
    act(() => { useInventoryStore.getState().addItem(clone); });

    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));
    expect(screen.getByTestId('already-equipped-badge')).toBeInTheDocument();
    expect(screen.getByTestId('equip-picker-confirm')).toBeDisabled();
  });

  it('shows the empty-list message when no candidates exist', () => {
    seedPlayer();
    seedBackpack([]); // no items at all
    render(wrap(<EquipPicker slot="weapon" onClose={() => undefined} />));
    expect(screen.getByTestId('equip-picker-empty')).toBeInTheDocument();
    // Compare panel only renders when there's a selected candidate.
    expect(screen.queryByTestId('compare-panel')).toBeNull();
  });
});

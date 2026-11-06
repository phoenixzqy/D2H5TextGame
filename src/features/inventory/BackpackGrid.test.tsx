import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { BackpackGrid } from './BackpackGrid';

const tooltipRenders = vi.hoisted(() => vi.fn());

// Hundreds of floating-position hooks obscure the grid boundary under test.
// Keep real item cards; browser recovery tests exercise the complete tooltips.
vi.mock('@/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/ui')>()),
  Tooltip: ({ children }: { children: ReactNode }) => {
    tooltipRenders();
    return <>{children}</>;
  }
}));

function inventory(count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `legacy-${String(index)}`,
    baseId: 'items/base/helm-cap',
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: false
  }));
}

describe('BackpackGrid legacy capacity visibility', () => {
  it('updates the item, upgrade badge and callback without replacing its card', () => {
    const item = inventory(1)[0];
    if (!item) throw new Error('Missing inventory fixture');
    const previousSelect = vi.fn();
    const latestSelect = vi.fn();
    const view = (entry: Item, upgrade: boolean, onSelect: (id: string | null) => void) => (
      <I18nextProvider i18n={i18n}>
        <BackpackGrid items={[entry]} capacity={1} selectedId={null} onSelect={onSelect}
          isUpgrade={() => upgrade} />
      </I18nextProvider>
    );
    const { rerender } = render(view(item, false, previousSelect));
    const card = screen.getByTestId(`inv-item-${item.id}`);
    const previousName = card.getAttribute('aria-label');
    const updated = { ...item, baseId: 'items/base/helm-skull-cap' };
    rerender(view(updated, true, latestSelect));
    expect(screen.getByTestId(`inv-item-${item.id}`)).toBe(card);
    expect(card.getAttribute('aria-label')).not.toBe(previousName);
    expect(screen.getByTestId(`inv-upgrade-badge-${item.id}`)).toBeInTheDocument();
    fireEvent.click(card);
    expect(latestSelect).toHaveBeenCalledWith(item.id);
    expect(previousSelect).not.toHaveBeenCalled();
    rerender(view(updated, false, latestSelect));
    expect(screen.queryByTestId(`inv-upgrade-badge-${item.id}`)).not.toBeInTheDocument();
  });

  it('refreshes item names after a locale change with identical item props', async () => {
    const originalLocale = i18n.language;
    const items = inventory(1);
    const isUpgrade = vi.fn(() => true);
    try {
      await act(async () => { await i18n.changeLanguage('en'); });
      render(
        <I18nextProvider i18n={i18n}>
          <BackpackGrid items={items} capacity={1} selectedId={null} onSelect={vi.fn()} isUpgrade={isUpgrade} />
        </I18nextProvider>
      );
      const card = screen.getByTestId('inv-item-legacy-0');
      expect(card).toHaveAttribute('aria-label', 'Cap · item');
      expect(screen.getByTestId('inv-upgrade-badge-legacy-0')).toHaveAttribute('aria-label', 'Upgrade');
      await act(async () => { await i18n.changeLanguage('zh-CN'); });
      expect(screen.getByTestId('inv-item-legacy-0')).toBe(card);
      expect(card).toHaveAttribute('aria-label', '帽子 · item');
      expect(screen.getByTestId('inv-upgrade-badge-legacy-0')).toHaveAttribute('aria-label', '净提升');
      expect(isUpgrade).toHaveBeenCalledTimes(1);
    } finally {
      await act(async () => { await i18n.changeLanguage(originalLocale); });
    }
  });

  it.each(['remove earlier item', 'reorder items'] as const)(
    'does not rebuild unchanged tooltips after %s', operation => {
      const items = inventory(3);
      const onSelect = vi.fn();
      const view = (entries: readonly Item[]) => (
        <I18nextProvider i18n={i18n}>
          <BackpackGrid items={entries} capacity={4} selectedId={null} onSelect={onSelect} />
        </I18nextProvider>
      );
      const { rerender } = render(view(items));
      tooltipRenders.mockClear();
      const next = operation === 'remove earlier item'
        ? items.slice(1)
        : [...items.slice(2), ...items.slice(0, 2)];
      rerender(view(next));
      expect(screen.getAllByTestId(/^inv-item-/u).map(node => node.dataset.testid))
        .toEqual(next.map(item => `inv-item-${item.id}`));
      expect(tooltipRenders).not.toHaveBeenCalled();
    }
  );

  it('only compares inserted or replaced items after removal and reordering', () => {
    const items = inventory(4);
    const onSelect = vi.fn();
    const isUpgrade = vi.fn((item: Item) => item.identified);
    const view = (entries: readonly Item[]) => (
      <I18nextProvider i18n={i18n}>
        <BackpackGrid items={entries} capacity={4} selectedId={null} onSelect={onSelect} isUpgrade={isUpgrade} />
      </I18nextProvider>
    );
    const { rerender } = render(view(items.slice(0, 3)));
    const card = screen.getByTestId('inv-item-legacy-1');
    isUpgrade.mockClear();
    rerender(view(items.slice(1, 3).reverse()));
    expect(isUpgrade).not.toHaveBeenCalled();
    rerender(view(items.slice(1)));
    expect(isUpgrade.mock.calls.map(([item]) => item.id)).toEqual(['legacy-3']);
    const replacement = items[1];
    if (!replacement) throw new Error('Missing replacement fixture');
    isUpgrade.mockClear();
    rerender(view([{ ...replacement, identified: false }, ...items.slice(2)]));
    expect(isUpgrade.mock.calls.map(([item]) => item.id)).toEqual(['legacy-1']);
    expect(screen.getByTestId('inv-item-legacy-1')).toBe(card);
    expect(screen.queryByTestId('inv-upgrade-badge-legacy-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('inv-upgrade-badge-legacy-2')).toBeInTheDocument();
  });

  it.each(['remove earlier item', 'reorder items'] as const)(
    'preserves item focus and current selection after %s', operation => {
      const items = inventory(3);
      const focusedId = 'legacy-1';
      const onSelect = vi.fn();
      const view = (entries: readonly Item[], selectedId: string | null = null) => (
        <I18nextProvider i18n={i18n}>
          <BackpackGrid items={entries} capacity={4} selectedId={selectedId} onSelect={onSelect} />
        </I18nextProvider>
      );
      const { rerender } = render(view(items));
      const card = screen.getByTestId(`inv-item-${focusedId}`);
      card.focus();
      expect(card).toHaveFocus();

      const next = operation === 'remove earlier item'
        ? items.slice(1)
        : [...items.slice(2), ...items.slice(0, 2)];
      rerender(view(next));
      expect(screen.getByTestId(`inv-item-${focusedId}`)).toBe(card);
      expect(card).toHaveFocus();
      expect(screen.getAllByTestId(/^inv-item-/u).map(node => node.dataset.testid))
        .toEqual(next.map(item => `inv-item-${item.id}`));
      expect(screen.getAllByTestId(/^inv-empty-/u)).toHaveLength(4 - next.length);
      fireEvent.click(card);
      expect(onSelect).toHaveBeenLastCalledWith(focusedId);

      // Stable identity must still render fresh props and use the latest click closure.
      rerender(view(next, focusedId));
      expect(screen.getByTestId(`inv-item-${focusedId}`)).toBe(card);
      expect(card).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(card);
      expect(onSelect).toHaveBeenLastCalledWith(null);
    }
  );

  it.each([
    [100, 99],
    [100, 100],
    [100, 101],
    [500, 499],
    [500, 500],
    [500, 501]
  ])('keeps every item accessible at capacity %i with %i saved items', (capacity, count) => {
    const items = inventory(count);
    const before = structuredClone(items);
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <BackpackGrid items={items} capacity={capacity} selectedId={null} onSelect={onSelect} />
      </I18nextProvider>
    );

    const grid = screen.getByTestId('backpack-grid');
    expect(grid.querySelectorAll('[data-testid^="inv-item-"]')).toHaveLength(count);
    expect(grid.querySelectorAll('[data-testid^="inv-empty-"]')).toHaveLength(
      Math.max(0, capacity - count)
    );
    const lastId = `legacy-${String(count - 1)}`;
    fireEvent.click(screen.getByTestId(`inv-item-${lastId}`));
    expect(onSelect).toHaveBeenCalledWith(lastId);
    expect(items).toEqual(before);
  });

  it('restores empty slots after an over-cap inventory is reduced below capacity', () => {
    const items = inventory(101);
    const onSelect = vi.fn();
    const view = (entries: readonly Item[]) => (
      <I18nextProvider i18n={i18n}>
        <BackpackGrid items={entries} capacity={100} selectedId={null} onSelect={onSelect} />
      </I18nextProvider>
    );
    const { rerender } = render(view(items));
    expect(screen.getByTestId('inv-item-legacy-100')).toBeInTheDocument();
    rerender(view(items.slice(0, 100)));
    expect(screen.queryByTestId('inv-item-legacy-100')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId(/^inv-empty-/u)).toHaveLength(0);
    rerender(view(items.slice(0, 99)));
    expect(screen.getByTestId('inv-empty-99')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('inv-item-legacy-98'));
    expect(onSelect).toHaveBeenCalledWith('legacy-98');
  });
});

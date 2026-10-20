import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { BackpackGrid } from './BackpackGrid';

// Hundreds of floating-position hooks obscure the grid boundary under test.
// Keep real item cards; browser recovery tests exercise the complete tooltips.
vi.mock('@/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/ui')>()),
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>
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

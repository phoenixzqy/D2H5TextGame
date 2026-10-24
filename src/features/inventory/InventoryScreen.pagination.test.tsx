import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import type { Item } from '@/engine/types/items';
import * as comparison from './compareEquip';
import { InventoryScreen } from './InventoryScreen';

// Floating-position subscriptions are unrelated to the page/ownership boundary;
// the production browser check retains actual tooltips and cards.
vi.mock('@/ui', async importOriginal => ({
  ...(await importOriginal<typeof import('@/ui')>()),
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const stores = [useInventoryStore, usePlayerStore, useMercStore, useMapStore, useCombatStore] as const;
const items = (count: number): Item[] => Array.from({ length: count }, (_, index) => ({
  id: `page-item-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: []
}));
const mount = () => render(<MemoryRouter><I18nextProvider i18n={i18n}><InventoryScreen /></I18nextProvider></MemoryRouter>);
const cardCount = () => screen.getByTestId('backpack-grid').querySelectorAll('[data-testid^="inv-item-"]').length;

describe.each(['en', 'zh-CN'] as const)('bounded inventory pages %s', locale => {
  const en = locale === 'en';
  beforeEach(async () => {
    __resetPersistenceForTests();
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Pages', 'sorceress'));
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => { for (const store of stores) store.getState().reset(); });
  });

  it('renders and compares one page while every overflow item remains reachable without changing ownership', () => {
    const backpack = items(201), compared: string[] = [];
    useInventoryStore.setState({ backpack });
    const before = structuredClone(useInventoryStore.getState().backpack);
    const prepare = comparison.prepareCompareEquip;
    vi.spyOn(comparison, 'prepareCompareEquip').mockImplementation((...args) => {
      const project = prepare(...args);
      return (item, slot) => { compared.push(item.id); return project(item, slot); };
    });
    mount();
    expect(cardCount()).toBe(100);
    expect(new Set(compared).size).toBe(100);
    expect(screen.queryByTestId('inv-item-page-item-200')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    expect(cardCount()).toBe(1);
    expect(screen.getByTestId('inv-item-page-item-200')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('inv-item-page-item-200'));
    expect(screen.getByTestId('inv-primary-action')).toBeInTheDocument();
    expect(useInventoryStore.getState().backpack).toEqual(before);
  });

  it('jumps to a middle page, clamps after removal, and retains whole-backpack bulk counts', () => {
    const backpack = items(201);
    useInventoryStore.setState({ backpack }); mount();
    expect(screen.getByTestId('bulk-discard-normal')).toHaveTextContent('201');
    fireEvent.change(screen.getByRole('spinbutton', { name: en ? 'Page' : '页码' }), { target: { value: '2' } });
    expect(screen.getByTestId('inv-item-page-item-100')).toBeInTheDocument();
    expect(screen.queryByTestId('inv-item-page-item-0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    act(() => { useInventoryStore.setState({ backpack: backpack.slice(0, 99) }); });
    expect(cardCount()).toBe(99);
    expect(screen.getByTestId('inv-item-page-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('inv-empty-99')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('pages stash overflow independently and returns to the retained backpack page', () => {
    useInventoryStore.setState({ backpack: items(201), stash: items(501).map(item => ({ ...item, id: 'stash-' + item.id })) });
    mount();
    fireEvent.click(screen.getByRole('button', { name: en ? 'Next page' : '下一页' }));
    fireEvent.click(screen.getByRole('tab', { name: en ? /^Stash/ : /^仓库/ }));
    expect(cardCount()).toBe(100);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    expect(screen.getByTestId('inv-item-stash-page-item-500')).toBeInTheDocument();
    expect(cardCount()).toBe(1);
    expect(useInventoryStore.getState().stash).toHaveLength(501);
    fireEvent.click(screen.getByRole('tab', { name: en ? /^Backpack/ : /^背包/ }));
    expect(screen.getByTestId('inv-item-page-item-100')).toBeInTheDocument();
  });
});

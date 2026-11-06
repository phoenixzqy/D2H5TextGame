import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
import * as countedContract from '@/features/quests/countedQuestContract';
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

  it('avoids global quest validation for paging, selection and gear-only updates', () => {
    const backpack = items(201);
    useInventoryStore.setState({ backpack });
    const validate = vi.spyOn(countedContract, 'validateLiveCountedQuestGraphs');
    mount();
    const initialReads = validate.mock.calls.length;
    expect(initialReads).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    expect(cardCount()).toBe(1);
    expect(validate).toHaveBeenCalledTimes(initialReads);
    fireEvent.click(screen.getByTestId('inv-item-page-item-200'));
    expect(screen.getByTestId('inv-primary-action')).toBeInTheDocument();
    expect(validate).toHaveBeenCalledTimes(initialReads);
    act(() => { useInventoryStore.setState({ backpack: [...backpack] }); });
    // Quest queries read their own ledger/map inputs, never gear ownership.
    expect(validate).toHaveBeenCalledTimes(initialReads);
    act(() => { useInventoryStore.setState({ stash: items(1) }); });
    act(() => { useInventoryStore.setState({ equipped: { ...useInventoryStore.getState().equipped } }); });
    act(() => { usePlayerStore.setState({ player: createMockPlayer('Changed', 'sorceress') }); });
    expect(validate).toHaveBeenCalledTimes(initialReads);
    act(() => { useInventoryStore.setState({ questItems: { ...useInventoryStore.getState().questItems } }); });
    const ledgerReads = validate.mock.calls.length;
    expect(ledgerReads).toBeGreaterThan(initialReads);
    act(() => { useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress } }); });
    expect(validate.mock.calls.length).toBeGreaterThan(ledgerReads);
  });

  it('keeps panel state and live material and locale updates after paging', async () => {
    useInventoryStore.setState({ backpack: items(201), materials: { 'runes/el': 3 } });
    mount();
    const materials = screen.getByTestId('materials-panel');
    fireEvent.click(within(materials).getByRole('button', { name: en ? 'All materials' : '全部材料' }));
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    expect(within(materials).getAllByTestId(/^material-/)).toHaveLength(69);
    act(() => { useInventoryStore.setState({ materials: { 'runes/el': 6 } }); });
    expect(within(materials).getByTestId('material-runes/el')).toHaveTextContent(en ? 'Owned: 6' : '持有：6');
    expect(screen.getByTestId('crafting-panel')).toHaveTextContent(en ? 'Owned: 6' : '持有：6');
    await act(async () => { await i18n.changeLanguage(en ? 'zh-CN' : 'en'); });
    expect(within(materials).getByRole('button', { name: en ? '全部材料' : 'All materials' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('quest-items-panel')).toHaveTextContent(en ? '尚无任务物品。' : 'No quest items yet.');
    expect(screen.getByTestId('inv-item-page-item-200')).toBeInTheDocument();
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

  it('only compares the newly visible item after a native transfer', () => {
    const backpack = items(201), compared: string[] = [];
    useInventoryStore.setState({ backpack });
    const prepare = comparison.prepareCompareEquip;
    vi.spyOn(comparison, 'prepareCompareEquip').mockImplementation((...args) => {
      const project = prepare(...args);
      return (item, slot) => { compared.push(item.id); return project(item, slot); };
    });
    mount();
    expect(new Set(compared).size).toBe(100);
    const survivor = screen.getByTestId('inv-item-page-item-1');
    fireEvent.click(screen.getByTestId('inv-item-page-item-0'));
    compared.length = 0;
    fireEvent.click(screen.getByTestId('inv-secondary-action'));
    expect(screen.queryByTestId('inv-item-page-item-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('inv-item-page-item-1')).toBe(survivor);
    expect(screen.getByTestId('inv-item-page-item-100')).toBeInTheDocument();
    expect(useInventoryStore.getState().backpack).toEqual(backpack.slice(1));
    expect(useInventoryStore.getState().stash).toEqual(backpack.slice(0, 1));
    expect(compared).toEqual(['page-item-100']);
  });

  it('refreshes badges for equipment, player and every quest comparison input', () => {
    const backpack = items(2), compared: string[] = [];
    useInventoryStore.setState({ backpack });
    const prepare = comparison.prepareCompareEquip;
    const prepareSpy = vi.spyOn(comparison, 'prepareCompareEquip').mockImplementation((...args) => {
      const project = prepare(...args);
      return (item, slot) => { compared.push(item.id); return project(item, slot); };
    });
    mount();
    expect(screen.getAllByTestId(/^inv-upgrade-badge-/u)).toHaveLength(2);
    const currentPlayer = () => {
      const player = usePlayerStore.getState().player;
      if (!player) throw new Error('Missing player fixture');
      return player;
    };
    const updates = [
      () => { useInventoryStore.setState({ equipped: {
        ...useInventoryStore.getState().equipped,
        head: { ...backpack[0], id: 'equipped-head', baseId: 'items/base/helm-skull-cap',
          rarity: 'normal', level: 1, identified: true, equipped: true }
      } }); },
      () => { useInventoryStore.setState({ equipped: { ...useInventoryStore.getState().equipped, head: null } }); },
      () => { const player = currentPlayer(); usePlayerStore.setState({ player: { ...player, level: player.level + 1 } }); },
      () => { const player = currentPlayer(); usePlayerStore.setState({ player: { ...player, coreStats: { ...player.coreStats, energy: player.coreStats.energy + 1 } } }); },
      () => { const player = currentPlayer(); usePlayerStore.setState({ player: { ...player, derivedStats: { ...player.derivedStats, lifeMax: player.derivedStats.lifeMax + 1 } } }); },
      () => { useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress } }); },
      () => { useInventoryStore.setState({ questItems: { ...useInventoryStore.getState().questItems } }); },
      () => { useMapStore.setState({ questReceipts: { ...useMapStore.getState().questReceipts } }); }
    ];
    for (const [index, update] of updates.entries()) {
      const previousPrepares = prepareSpy.mock.calls.length;
      compared.length = 0;
      act(update);
      expect(prepareSpy).toHaveBeenCalledTimes(previousPrepares + 1);
      expect(compared).toEqual(backpack.map(item => item.id));
      expect(screen.queryAllByTestId(/^inv-upgrade-badge-/u)).toHaveLength(index === 0 ? 0 : 2);
      expect(prepareSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ level: currentPlayer().level, coreStats: currentPlayer().coreStats,
          derivedStats: currentPlayer().derivedStats }),
        useInventoryStore.getState().equipped, expect.any(Map), useMapStore.getState().questProgress,
        useInventoryStore.getState().questItems, useMapStore.getState().questReceipts
      );
    }
    act(() => { usePlayerStore.setState({ player: { ...currentPlayer(), level: 0 } }); });
    expect(screen.queryAllByTestId(/^inv-upgrade-badge-/u)).toHaveLength(0);
    act(() => { usePlayerStore.setState({ player: null }); });
    expect(screen.queryAllByTestId(/^inv-upgrade-badge-/u)).toHaveLength(0);
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

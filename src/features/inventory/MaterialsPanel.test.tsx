import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { materialCatalog } from '@/data/loaders/materials';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore, usePlayerStore, useMapStore, useMercStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { InventoryScreen } from './InventoryScreen';
import { stubMatchMedia, stubResizeObserver } from '@/test/layoutShims';

const stores = [useInventoryStore, usePlayerStore, useMapStore, useMercStore] as const;

function mount() {
  const view = render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <InventoryScreen />
  </MemoryRouter></I18nextProvider>);
  fireEvent.click(screen.getByRole('tab', { name: i18n.language === 'en' ? 'Materials' : '材料' }));
  return view;
}

describe.each(['en', 'zh-CN'] as const)('material inventory %s', locale => {
  const english = locale === 'en';
  const panel = () => screen.getByRole('region', { name: english ? 'Materials' : '材料' });
  const row = (id: string) => within(panel()).getByTestId(`material-${id}`);
  const kind = (name: string) => fireEvent.click(within(panel()).getByRole('tab', { name }));

  beforeEach(async () => {
    stubMatchMedia();
    stubResizeObserver();
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Collector', 'sorceress'));
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    act(() => { for (const store of stores) store.getState().reset(); });
    vi.unstubAllGlobals();
  });

  it('has a translated catalog name for every concrete definition', () => {
    expect(materialCatalog.size).toBe(69);
    for (const material of materialCatalog.values()) {
      expect(i18n.exists(material.nameKey.slice('items.'.length), { lng: locale, ns: 'items' }), material.id).toBe(true);
    }
  });

  it('shows an empty Materials panel without inferring materials from old shard currencies', () => {
    useInventoryStore.setState({ currencies: { 'rune-shard': 99, 'gem-shard': 44 } });
    const before = useInventoryStore.getState();
    mount();
    expect(panel()).toHaveTextContent(english ? 'No materials yet.' : '尚无材料。');
    expect(panel()).toHaveTextContent(english ? 'do not use equipment slots' : '不占装备栏位');
    expect(within(panel()).queryAllByTestId(/^material-/)).toHaveLength(0);
    expect(useInventoryStore.getState().currencies).toBe(before.currencies);
    expect(useInventoryStore.getState().backpack).toBe(before.backpack);
    expect(useInventoryStore.getState().stash).toBe(before.stash);
  });

  it('lets players browse every concrete material with localized names, zero counts and honest uses', () => {
    mount();
    const catalog = within(panel()).getByRole('button', { name: english ? 'All materials' : '全部材料' });
    catalog.focus();
    fireEvent.click(catalog);
    expect(catalog).toHaveFocus();
    expect(catalog).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel()).getAllByTestId(/^material-/)).toHaveLength(33);
    expect(row('runes/el')).toHaveTextContent(english ? 'El' : '艾尔符文');
    kind(english ? 'Gems' : '宝石');
    expect(row('gems/amethyst/chipped')).toHaveTextContent(english ? 'Chipped Amethyst' : '碎裂的紫宝石');
    expect(row('gems/topaz/perfect')).toHaveTextContent(english ? 'Perfect Topaz' : '完美的黄宝石');
    expect(within(panel()).getAllByTestId(/^material-/)).toHaveLength(35);
    kind(english ? 'Crafting materials' : '制作材料');
    expect(row('materials/scrap')).toHaveTextContent(english ? 'Scrap' : '废料');
    expect(within(panel()).getAllByTestId(/^material-/)).toHaveLength(1);
    kind(english ? 'Runes' : '符文');
    expect(row('runes/el')).toHaveTextContent(english ? 'Owned: 0' : '持有：0');
    expect(panel()).toHaveTextContent(english ? 'Victory loot and certain quest rewards.' : '战斗胜利掉落及部分任务奖励。');
    kind(english ? 'Crafting materials' : '制作材料');
    expect(panel()).toHaveTextContent(english ? 'Salvage eligible backpack or stash equipment.' : '分解符合条件的背包或仓库装备。');
    expect(panel()).toHaveTextContent(english ? 'Preview crafting and socket actions below' : '可在下方预览制作与镶嵌操作');
    expect(panel().textContent).not.toMatch(/items\.(?:rune|gem|material)\.|materials\.(?:title|source|use)/);
    fireEvent.click(within(panel()).getByRole('button', { name: english ? 'Owned materials' : '已持有材料' }));
    expect(within(panel()).queryAllByTestId(/^material-/)).toHaveLength(0);
  });

  it('renders only exact typed holdings and follows ledger changes without moving equipment or currencies', () => {
    useInventoryStore.setState({ materials: { 'runes/el': 2, 'gems/ruby/perfect': 3, 'materials/scrap': 4 } });
    const before = useInventoryStore.getState();
    mount();
    expect(within(panel()).getAllByTestId(/^material-/)).toHaveLength(1);
    expect(row('runes/el')).toHaveTextContent(english ? 'Owned: 2' : '持有：2');
    kind(english ? 'Gems' : '宝石');
    expect(row('gems/ruby/perfect')).toHaveTextContent(english ? 'Perfect Ruby' : '完美的红宝石');
    expect(row('gems/ruby/perfect')).toHaveTextContent(english ? 'Owned: 3' : '持有：3');
    kind(english ? 'Crafting materials' : '制作材料');
    expect(row('materials/scrap')).toHaveTextContent(english ? 'Owned: 4' : '持有：4');
    act(() => { useInventoryStore.setState({ materials: { 'runes/eld': Number.MAX_SAFE_INTEGER } }); });
    kind(english ? 'Runes' : '符文');
    expect(within(panel()).getAllByTestId(/^material-/)).toHaveLength(1);
    expect(row('runes/eld')).toHaveTextContent(new Intl.NumberFormat(locale).format(Number.MAX_SAFE_INTEGER));
    expect(useInventoryStore.getState().currencies).toBe(before.currencies);
    expect(useInventoryStore.getState().backpack).toBe(before.backpack);
    expect(useInventoryStore.getState().stash).toBe(before.stash);
  });

  it('names concrete scrap spending paths and their authored costs', () => {
    useInventoryStore.setState({ materials: { 'materials/scrap': 20 } });
    mount();
    fireEvent.click(within(panel()).getByRole('tab', { name: english ? 'Crafting materials' : '制作材料' }));
    expect(panel()).toHaveTextContent(english ? 'Craft a caster amulet' : '制作施法者项链');
    expect(panel()).toHaveTextContent(english ? '20 Scrap' : '20 废料');
    expect(panel()).toHaveTextContent(english ? 'Anya' : '安雅');
    expect(panel()).toHaveTextContent(english ? '40 Scrap' : '40 废料');
  });
});

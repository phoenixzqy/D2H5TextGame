import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { CraftingPanel } from '@/features/inventory/CraftingPanel';
const stores = [useInventoryStore, usePlayerStore, useMercStore, useMapStore, useCombatStore] as const;
const gear = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => ({
  id: `${prefix}-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal' as const,
  level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: []
}));
describe.each(['en', 'zh-CN'] as const)('crafting target preparation %s', locale => {
  const en = locale === 'en';
  beforeEach(async () => {
    __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Target cost', 'sorceress'));
    useInventoryStore.setState({ backpack: gear('backpack', 201), stash: gear('stash', 101) });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => { vi.restoreAllMocks(); act(() => { for (const store of stores) store.getState().reset(); }); });
  const category = (value: string) => fireEvent.change(screen.getByLabelText(en ? 'Action' : '操作'), { target: { value } });
  const mount = () => render(<I18nextProvider i18n={i18n}><CraftingPanel /></I18nextProvider>);
  it.each(['rune-fusion', 'gem-fusion', 'gem-dismantle'])('does not rebuild %s controls after an unrelated native gear transfer', kind => {
    mount(); category(kind);
    const panel = screen.getByTestId('crafting-panel');
    const controls = panel.innerHTML;
    const before = useInventoryStore.getState();
    const item = before.backpack[0];
    if (!item) throw new Error('Missing transfer item');
    const translate = vi.spyOn(i18n, 't');
    act(() => { expect(useInventoryStore.getState().moveToStash(item.id)).toEqual({ ok: true }); });
    expect(useInventoryStore.getState().backpack).toEqual(before.backpack.slice(1));
    expect(useInventoryStore.getState().stash).toEqual([...before.stash, item]);
    expect(panel.innerHTML).toBe(controls);
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.title')).toHaveLength(0);
  });
  it('ignores unused stash and quarantine changes while socket targets still follow the live backpack', () => {
    mount(); category('socket-insert');
    const translate = vi.spyOn(i18n, 't');
    act(() => { useInventoryStore.setState({ stash: gear('new-stash', 3), socketQuarantine: [] }); });
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.title')).toHaveLength(0);
    act(() => { useInventoryStore.setState({ backpack: gear('new-backpack', 1) }); });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByLabelText(/#new-backpack-0\b/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/#backpack-0\b/)).not.toBeInTheDocument();
  });
  it('keeps salvage selection and its current source after a native transfer', () => {
    useInventoryStore.setState({ backpack: gear('moving', 1), stash: gear('stored', 1) });
    mount(); category('salvage');
    fireEvent.click(screen.getByLabelText(/#moving-0\b/));
    expect(screen.getByLabelText(/#moving-0\b/)).toBeChecked();
    expect(screen.getByLabelText(/#moving-0\b/).closest('label')).toHaveTextContent(en ? 'Backpack' : '背包');
    act(() => { expect(useInventoryStore.getState().moveToStash('moving-0')).toEqual({ ok: true }); });
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByLabelText(/#moving-0\b/)).toBeChecked();
    expect(screen.getByLabelText(/#moving-0\b/).closest('label')).toHaveTextContent(en ? 'Stash' : '仓库');
  });
  it('reads quarantine updates independently and reselects current gear when leaving recovery', () => {
    const recovered = gear('recovered', 1)[0];
    if (!recovered) throw new Error('Missing recovery item');
    mount(); category('recover-v18');
    const translate = vi.spyOn(i18n, 't');
    act(() => { useInventoryStore.setState({ backpack: gear('latest', 1), stash: gear('latest-stash', 1) }); });
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.title')).toHaveLength(0);
    act(() => { useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18,
      item: { ...recovered, rarity: 'runeword', runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] },
      origin: { container: 'stash', index: 0 } }] }); });
    expect(screen.getByLabelText(/#recovered-0\b/)).toBeInTheDocument();
    category('socket-insert');
    expect(screen.getByLabelText(/#latest-0\b/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/#recovered-0\b/)).not.toBeInTheDocument();
    category('salvage');
    expect(screen.getByLabelText(/#latest-stash-0\b/)).toBeInTheDocument();
  });
  it('refreshes current material and currency balances for a material-only recipe', () => {
    mount(); category('gem-fusion');
    act(() => { useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 47 }, currencies: { 'gem-shard': 23 } }); });
    const panel = screen.getByTestId('crafting-panel');
    expect(panel).toHaveTextContent(en ? 'Owned: 47' : '持有：47');
    expect(panel).toHaveTextContent(en ? 'Owned: 23' : '持有：23');
  });
  it('does not localize unused gear origins for material-only operations or inventory updates', () => {
    const translate = vi.spyOn(i18n, 't'); mount(); category('gem-fusion'); category('gem-dismantle');
    act(() => { useInventoryStore.setState({ backpack: gear('replacement', 301) }); });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.backpack' || key === 'crafting.stash')).toHaveLength(0);
    expect(useInventoryStore.getState().backpack).toHaveLength(301);
    expect(useInventoryStore.getState().stash).toHaveLength(101);
  });
  it('localizes each salvage source once while preserving paged search and exact target selection', () => {
    mount(); const translate = vi.spyOn(i18n, 't'); category('salvage');
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.backpack')).toHaveLength(1);
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.stash')).toHaveLength(1);
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    fireEvent.change(screen.getByLabelText(en ? 'Search equipment' : '搜索装备'), { target: { value: '#stash-100' } });
    const item = screen.getByLabelText(/#stash-100\b/); fireEvent.click(item); expect(item).toBeChecked();
    expect(item.closest('label')).toHaveTextContent(en ? 'Stash' : '仓库');
    expect(useInventoryStore.getState().backpack).toHaveLength(201); expect(useInventoryStore.getState().stash).toHaveLength(101);
  });
  it('prepares backpack targets only for socket operations and refreshes the source label after locale change', async () => {
    mount(); const translate = vi.spyOn(i18n, 't'); category('socket-insert');
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.backpack')).toHaveLength(1);
    expect(translate.mock.calls.filter(([key]) => key === 'crafting.stash')).toHaveLength(0);
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    await act(async () => { await i18n.changeLanguage(en ? 'zh-CN' : 'en'); });
    const item = screen.getByLabelText(/#backpack-0\b/);
    expect(item.closest('label')).toHaveTextContent(en ? '背包' : 'Backpack');
    fireEvent.change(screen.getByLabelText(en ? '搜索装备' : 'Search equipment'), { target: { value: '#stash-' } });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

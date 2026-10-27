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

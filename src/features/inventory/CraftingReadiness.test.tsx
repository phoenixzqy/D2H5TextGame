import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { clearIronGolemSelection, armIronGolemSelection } from '@/stores/ironGolemSelectionStore';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores } from '@/stores/persistence';
import { reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import * as actions from '@/stores/materialActions';
import { CraftingPanel } from './CraftingPanel';

vi.mock('@/stores/save-adapter', () => ({ saveSave: () => Promise.resolve() }));
const stores = [useInventoryStore, usePlayerStore, useMapStore, useMercStore, useCombatStore] as const;
const blade = { id: 'blade', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
  level: 1, identified: true, equipped: false, socketCapacity: 2 };

describe.each(['en', 'zh-CN'] as const)('crafting availability %s', locale => {
  const en = locale === 'en';
  const preview = () => screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' });
  const category = (value: string) => fireEvent.change(screen.getByLabelText(en ? 'Action' : '操作'), { target: { value } });
  const mount = () => render(<I18nextProvider i18n={i18n}><CraftingPanel /></I18nextProvider>);
  beforeEach(async () => {
    __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
    clearIronGolemSelection(); useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Readiness', 'necromancer'));
    useInventoryStore.setState({ backpack: [blade], materials: { 'runes/el': 3 } });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => { vi.restoreAllMocks(); act(() => { clearIronGolemSelection(); for (const store of stores) store.getState().reset(); }); });

  it('lists simultaneous material and currency shortfalls, then enables Preview without preparing an intent', () => {
    const prepare = vi.spyOn(actions, 'prepareLiveMaterialAction');
    const plan = vi.spyOn(actions, 'previewLiveMaterialAction');
    const before = useInventoryStore.getState();
    mount(); category('gem-fusion');
    expect(preview()).toBeDisabled();
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'Chipped Amethyst' : '碎裂的紫宝石');
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'Gem-shards' : '宝石碎片');
    act(() => { useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 2 }, currencies: { 'gem-shard': 9 } }); });
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'Need 1 more' : '还缺 1');
    expect(screen.getByTestId('crafting-readiness')).not.toHaveTextContent(en ? 'Gem-shards' : '宝石碎片');
    act(() => { useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 3 } }); });
    expect(preview()).toBeEnabled(); expect(screen.queryByTestId('crafting-readiness')).not.toBeInTheDocument();
    expect(prepare).not.toHaveBeenCalled(); expect(plan).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().backpack).toBe(before.backpack);
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(before.materialActionOrdinal);
    expect(useInventoryStore.getState().latestMaterialAction).toBe(before.latestMaterialAction);
  });
  it('recovers after the last restore guard releases, without another store change or user action', async () => {
    mount(); expect(preview()).toBeEnabled();
    const lease = reserveWaveRestore();
    try {
      await act(async () => { await Promise.resolve(); });
      expect(preview()).toBeDisabled();
      expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'Wait for the current action' : '请等待当前操作');
    } finally { await act(async () => { releaseWaveRestore(lease); await Promise.resolve(); }); }
    expect(preview()).toBeEnabled();
  });
  it('recovers automatically after a successful native save import finishes', async () => {
    const exported = exportCurrentSave();
    if (exported === null) throw new Error('Expected an exportable native save');
    mount();
    act(() => { useInventoryStore.setState({ materials: {} }); });
    expect(preview()).toBeDisabled();
    await act(async () => { await importIntoStores(exported); });
    await waitFor(() => { expect(preview()).toBeEnabled(); });
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 3 });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(0);
    expect(useInventoryStore.getState().latestMaterialAction).toBeNull();
  });
  it('follows native map authority when only the selected title changes', () => {
    mount(); expect(preview()).toBeEnabled();
    const selection = { recipeId: 'recipes/rune-fusion/el' };
    expect(() => { actions.validateLiveMaterialAction(selection); }).not.toThrow();
    act(() => { useMapStore.setState({ selectedTitle: 'titles/slayer_of_baal' }); });
    expect(() => { actions.validateLiveMaterialAction(selection); })
      .toThrow('Material action replay profile is not earned');
    expect(preview()).toBeDisabled();
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'progression' : '进度');
    act(() => { useMapStore.setState({ selectedTitle: null }); });
    expect(preview()).toBeEnabled();
  });
  it('follows hero availability, battle state and current golem reservations', () => {
    mount(); category('socket-insert'); fireEvent.click(screen.getByLabelText(/#blade/));
    expect(preview()).toBeEnabled();
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing hero');
    act(() => { armIronGolemSelection(hero.id, blade.id, true); });
    expect(preview()).toBeDisabled();
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'select eligible items' : '选择符合条件的物品');
    act(() => { clearIronGolemSelection(); useCombatStore.setState({ inCombat: true }); });
    expect(preview()).toBeDisabled();
    expect(screen.getByTestId('crafting-readiness')).toHaveTextContent(en ? 'Finish or leave' : '完成或离开');
    act(() => { useCombatStore.setState({ inCombat: false }); });
    expect(preview()).toBeEnabled();
    act(() => { usePlayerStore.setState({ player: null }); });
    expect(preview()).toBeDisabled();
    act(() => { usePlayerStore.getState().setPlayer(hero); });
    expect(preview()).toBeEnabled();
  });
});

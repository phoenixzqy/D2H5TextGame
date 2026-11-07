import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense, type ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { MercsScreen } from './MercsScreen';

vi.mock('@/ui/ScreenShell', () => ({ ScreenShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));

const source: Item = { id: 'selected', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
  identified: true, equipped: false, socketCapacity: 0 };
let mercId: string;

function show() {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MercsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId(`merc-equipment-${mercId}`));
  fireEvent.click(screen.getByTestId('merc-equip-slot-head-select'));
}

beforeEach(async () => {
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
  await i18n.changeLanguage('en');
  const def = loadMercPool().pool.find(entry => entry.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing authored merc');
  const merc = createMercFromDef(def);
  mercId = merc.id;
  useMercStore.getState().addMerc(merc);
  useInventoryStore.setState({ backpack: [source] });
});

describe('MercsScreen authoritative equipment transfer', () => {
  it('swaps and unequips once, normalizes flags and preserves same-ID stash gear', () => {
    const old: Item = { ...source, id: 'old', equipped: true, equipSlot: 'head',
      affixes: [{ affixId: 'old-affix', values: new Map([['statMods.life', 5]]) }] };
    const stashed: Item = { ...source, level: 7 };
    useInventoryStore.setState({ stash: [stashed] });
    useMercStore.setState({ mercEquipment: { [mercId]: { head: old } } });
    show();
    fireEvent.click(within(screen.getByTestId('merc-equip-candidates')).getByText('#selected'));
    fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.give') }));
    expect(useInventoryStore.getState().stash).toEqual([stashed]);
    const { equipSlot: _slot, ...returned } = old;
    expect(useInventoryStore.getState().backpack).toEqual([{ ...returned, equipped: false }]);
    expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...source, equipped: true, equipSlot: 'head' });
    fireEvent.click(screen.getByRole('button', { name: 'Unequip' }));
    expect(useMercStore.getState().getMercEquipment(mercId).head).toBeNull();
    expect(useInventoryStore.getState().backpack).toEqual([{ ...returned, equipped: false }, source]);
  });

  it.each(['en', 'zh-CN'] as const)('keeps the picker after a stale candidate refuses and permits corrected retry (%s)', async locale => {
    await i18n.changeLanguage(locale);
    show();
    fireEvent.click(within(screen.getByTestId('merc-equip-candidates')).getByText('#selected'));
    const equip = screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.give') });
    const changed: Item = { ...source, baseId: 'items/base/wp1h-short-sword' };
    // A real current-source change before the captured candidate handler runs.
    equip.addEventListener('click', () => { useInventoryStore.setState({ backpack: [changed] }); }, { capture: true, once: true });
    fireEvent.click(equip);
    expect(useInventoryStore.getState().backpack).toEqual([changed]);
    expect(useMercStore.getState().getMercEquipment(mercId).head ?? null).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(locale === 'en' ? 'Cannot equip' : '无法装备');
    expect(screen.getByText(locale === 'en' ? 'No compatible backpack items for this slot.' : '背包中没有可装备到该部位的物品。')).toBeVisible();
    act(() => { useInventoryStore.setState({ backpack: [source] }); });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.give') }));
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useMercStore.getState().getMercEquipment(mercId).head?.id).toBe(source.id);
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('mercs:equipmentFlow.equipped', { name: i18n.t('items:base.helm-cap') }));
    expect(screen.queryByRole('button', { name: i18n.t('mercs:equipmentFlow.give') })).not.toBeInTheDocument();
  });
});

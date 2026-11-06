import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
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

const gear: Item = { id: 'old', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: true, equipSlot: 'head',
  affixes: [{ affixId: 'saved', values: new Map([['statMods.life', 7]]) }] };
const message = (locale: string) => locale === 'en'
  ? 'Backpack is full. Make room before moving or removing equipment.'
  : '背包已满，请腾出空间后再转移物品或卸下装备。';
let mercId: string;

function show() {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MercsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId(`merc-equipment-${mercId}`));
}

beforeEach(() => {
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
  const def = loadMercPool().pool.find(entry => entry.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing authored merc');
  const merc = createMercFromDef(def);
  mercId = merc.id;
  useMercStore.getState().addMerc(merc);
  useMercStore.setState({ mercEquipment: { [mercId]: { head: gear } } });
  useInventoryStore.setState({ backpack: Array.from({ length: 100 }, (_, i) => ({
    ...gear, id: `F${String(i)}`, equipped: false
  })) });
});

describe.each(['en', 'zh-CN'] as const)('MercsScreen capacity feedback %s', locale => {
  it('announces refusal outside a picker, retranslates, retains gear and retries after making room', async () => {
    await i18n.changeLanguage(locale);
    show();
    const slot = screen.getByTestId('merc-equip-slot-head');
    const beforeInventory = useInventoryStore.getState();
    const beforeMerc = useMercStore.getState();
    fireEvent.click(within(slot).getByRole('button', { name: locale === 'en' ? 'Unequip' : '卸下' }));
    // Prove missing feedback independently of the state guard's separate RED.
    expect(screen.queryByRole('status')).toHaveTextContent(message(locale));
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(useInventoryStore.getState()).toBe(beforeInventory);
    expect(useMercStore.getState()).toBe(beforeMerc);
    expect(slot).toBeInTheDocument();
    const nextLocale = locale === 'en' ? 'zh-CN' : 'en';
    await act(async () => { await i18n.changeLanguage(nextLocale); });
    expect(screen.getByRole('status')).toHaveTextContent(message(nextLocale));
    act(() => { useInventoryStore.getState().discardItem('F0'); });
    fireEvent.click(within(slot).getByRole('button', { name: nextLocale === 'en' ? 'Unequip' : '卸下' }));
    const { equipSlot: _slot, ...fields } = gear;
    expect(useInventoryStore.getState().backpack).toEqual([...beforeInventory.backpack.slice(1), { ...fields, equipped: false }]);
    expect(useMercStore.getState().getMercEquipment(mercId).head).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('retains an open picker on refusal and clears feedback on slot change or successful swap', async () => {
    await i18n.changeLanguage(locale);
    show();
    fireEvent.click(screen.getByTestId('merc-equip-slot-head-select'));
    const candidate = screen.getAllByRole('button', { name: locale === 'en' ? 'Equip' : '装备' })[0];
    if (!candidate) throw new Error('Missing candidate');
    fireEvent.click(within(screen.getByTestId('merc-equip-slot-head')).getByRole('button', { name: locale === 'en' ? 'Unequip' : '卸下' }));
    expect(screen.queryByRole('status')).toHaveTextContent(message(locale));
    expect(candidate).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('merc-equip-slot-boots-select'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('merc-equip-slot-head-select'));
    fireEvent.click(within(screen.getByTestId('merc-equip-slot-head')).getByRole('button', { name: locale === 'en' ? 'Unequip' : '卸下' }));
    expect(screen.getByRole('status')).toHaveTextContent(message(locale));
    fireEvent.click(screen.getAllByRole('button', { name: locale === 'en' ? 'Equip' : '装备' })[0] ?? candidate);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: locale === 'en' ? 'Equip' : '装备' })).toEqual([]);
    expect(useInventoryStore.getState().backpack).toHaveLength(100);
    expect(useMercStore.getState().getMercEquipment(mercId).head?.id).toBe('F0');
  });
});

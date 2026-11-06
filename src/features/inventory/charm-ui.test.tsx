import { beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { InventoryScreen } from './InventoryScreen';
import { CharacterScreen } from '@/features/character/CharacterScreen';
import { MercsScreen } from '@/features/mercs/MercsScreen';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore, usePlayerStore, useMapStore, useMercStore } from '@/stores';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import type { Item } from '@/engine/types/items';

const charm: Item = { id: 'public-charm', baseId: 'items/base/small-charm',
  uniqueId: 'items/unique/ormus-charm', rarity: 'unique', level: 32, ilvl: 32,
  identified: true, equipped: false };
function show(node: JSX.Element) {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>
  </Suspense></I18nextProvider>);
}
function player() {
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Missing fixture hero');
  return hero;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useMapStore.getState().reset(); useMercStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Charm UI', 'sorceress'));
  useInventoryStore.setState({ backpack: [charm] });
  usePlayerStore.getState().recomputeDerived({});
});
describe.each(['en', 'zh-CN'] as const)('hero charm controls %s', locale => {
  it('equips through the slot picker, shows named details, and removes without healing', async () => {
    await i18n.changeLanguage(locale);
    const english = locale === 'en', name = english ? 'Ormus’s Charm' : '奥玛斯的护符';
    const before = player().derivedStats;
    show(<InventoryScreen />);
    fireEvent.click(screen.getByRole('tab', { name: english ? 'Equipment' : '装备' }));
    const slot = screen.getByTestId('equip-slot-charm');
    expect(slot).toHaveAttribute('aria-label', english ? 'Charm' : '护符');
    fireEvent.click(within(slot).getByRole('button', { name: english ? 'Charm' : '护符' }));
    const picker = screen.getByTestId('equip-picker');
    expect(within(picker).getByTestId(`equip-picker-row-${charm.id}`)).toHaveTextContent(name);
    fireEvent.click(screen.getByTestId('equip-picker-confirm'));
    expect(useInventoryStore.getState().equipped.charm?.id).toBe(charm.id);
    expect(player().derivedStats).toMatchObject({ lifeMax: before.lifeMax + 20, manaMax: before.manaMax + 10,
      life: before.life, mana: before.mana });
    fireEvent.click(screen.getByTestId('equip-slot-charm-details'));
    const details = screen.getByTestId('equipped-item-modal');
    expect(details).toHaveTextContent(name);
    expect(details).toHaveTextContent(english ? 'Charm — Charm' : '护符 · 护符');
    fireEvent.click(screen.getByTestId('equipped-item-modal-close'));
    fireEvent.click(within(screen.getByTestId('equip-slot-charm')).getByRole('button', { name: english ? 'Unequip' : '卸下' }));
    expect(useInventoryStore.getState().equipped.charm).toBeNull();
    expect(useInventoryStore.getState().backpack).toEqual([charm]);
    expect(player().derivedStats).toEqual(before);
  });
  it('exposes an equipped charm in Character and its details modal', async () => {
    await i18n.changeLanguage(locale);
    expect(useInventoryStore.getState().equipItem(charm)).toEqual({ ok: true });
    show(<CharacterScreen />);
    const slot = screen.getByTestId('char-equip-slot-charm');
    expect(slot).toHaveTextContent(locale === 'en' ? 'Ormus’s Charm' : '奥玛斯的护符');
    fireEvent.click(slot);
    expect(screen.getByTestId('equipped-item-modal')).toHaveTextContent(locale === 'en' ? 'Charm — Charm' : '护符 · 护符');
  });
  it('keeps merc slots and candidates restricted to existing gear', async () => {
    await i18n.changeLanguage(locale);
    const def = loadMercPool().pool[0];
    if (!def) throw new Error('Missing authored merc');
    const merc = createMercFromDef(def); useMercStore.getState().addMerc(merc);
    show(<MercsScreen />);
    fireEvent.click(screen.getByTestId(`merc-equipment-${merc.id}`));
    expect(screen.queryByTestId('merc-equip-slot-charm')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('merc-equip-slot-amulet-select'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveTextContent(locale === 'en' ? 'Ormus’s Charm' : '奥玛斯的护符');
    expect(useInventoryStore.getState().backpack).toEqual([charm]);
  });
});

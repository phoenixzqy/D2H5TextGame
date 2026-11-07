/**
 * MercsScreen smoke tests — verifies roster joins runtime mercs with their
 * static defs and that "Set as Fielded" flips the active merc.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Suspense, type ReactNode } from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { MercsScreen } from './MercsScreen';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { useMercStore } from '@/stores';
import { mercXpForLevel } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';

vi.mock('@/ui/ScreenShell', () => ({ ScreenShell: ({ children, testId }: { children: ReactNode; testId?: string }) => <div data-testid={testId}>{children}</div> }));

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MercsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('MercsScreen', () => {
  beforeEach(() => {
    act(() => {
      useMercStore.getState().reset();
      useInventoryStore.getState().reset();
    });
  });

  it('shows empty state when no mercs are owned', () => {
    renderScreen();
    expect(screen.getByTestId('mercs-screen').textContent).toMatch(
      /尚未|no mercenaries/i
    );
  });

  it('renders an owned merc and toggles fielded state', () => {
    const pool = loadMercPool();
    const def = pool.pool[0];
    if (!def) throw new Error('merc pool is empty');
    act(() => {
      useMercStore.getState().addMerc(createMercFromDef(def));
    });
    renderScreen();

    const card = screen.getByTestId(`merc-card-${def.id}`);
    expect(card).toBeInTheDocument();

    const button = screen.getByTestId(`merc-field-${def.id}`);
    fireEvent.click(button);
    expect(useMercStore.getState().fieldedMercId).not.toBeNull();
  });

  it('hires an act-specific merc without opening gacha', () => {
    renderScreen();

    fireEvent.click(screen.getByRole('tab', { name: /招募|hire/i }));
    const hireButton = screen.getAllByRole('button', { name: /招募|hire/i })[0];
    if (!hireButton) throw new Error('hire button not found');
    fireEvent.click(hireButton);

    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
    expect(useMercStore.getState().fieldedMercId).toBe(useMercStore.getState().ownedMercs[0]?.id);
  });

  it('shows missing progress at the owned level, follows level updates, then explicit progress updates', () => {
    const def = loadMercPool().pool.find((entry) => entry.reqLevel === 3);
    if (!def) throw new Error('Missing level-three merc definition');
    const merc = createMercFromDef(def);
    useMercStore.setState({ ownedMercs: [merc] });
    const missing = useMercStore.getState().mercProgress;
    renderScreen();
    const xp = screen.getByTestId(`merc-xp-${def.id}`);
    expect(xp).toHaveTextContent('0 / 304');
    expect(useMercStore.getState().mercProgress).toBe(missing);
    act(() => { useMercStore.getState().upgradeMerc(merc.id); });
    expect(xp).toHaveTextContent(`0 / ${String(mercXpForLevel(4))}`);
    expect(useMercStore.getState().mercProgress).toBe(missing);
    act(() => {
      useMercStore.setState({ mercProgress: { [merc.id]: { experience: 17, experienceToNextLevel: 50 } } });
    });
    expect(xp).toHaveTextContent('17 / 50');
    act(() => { useMercStore.getState().addExperience(merc.id, 5); });
    expect(xp).toHaveTextContent('22 / 50');
  });

  it('blocks dismissing a merc that still has equipment', () => {
    const pool = loadMercPool();
    const def = pool.pool[0];
    if (!def) throw new Error('merc pool is empty');
    act(() => {
      const merc = createMercFromDef(def);
      useMercStore.getState().addMerc(merc);
      useMercStore.setState((s) => ({
        mercEquipment: {
          ...s.mercEquipment,
          [merc.id]: {
            weapon: { id: 'item-1', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: true, affixes: [] },
          },
        },
      }));
    });
    renderScreen();

    fireEvent.click(screen.getByTestId(`merc-dismiss-${def.id}`));

    expect(screen.getByText(/先卸下|Unequip every item/i)).toBeInTheDocument();
    expect(screen.queryByTestId(`merc-dismiss-confirm-${def.id}`)).not.toBeInTheDocument();
    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
  });
  function openEquipment() {
    const def = loadMercPool().pool[0];
    if (!def) throw new Error('Empty merc pool');
    const merc = createMercFromDef(def);
    const item: Item = { id: 'preview-weapon', baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, identified: true, equipped: false, affixes: [], socketCapacity: 0, baseRolls: { attack: 37 } };
    useMercStore.setState({ ownedMercs: [merc] });
    useInventoryStore.setState({ backpack: [item] });
    renderScreen();
    fireEvent.click(screen.getByTestId(`merc-equipment-${def.id}`));
    fireEvent.click(screen.getByTestId('merc-equip-slot-weapon-select'));
    return { merc, item };
  }

  it('previews exact items before equip, shows the result, and returns replaced gear once', () => {
    const { merc, item } = openEquipment();
    const dialog = screen.getByRole('dialog');
    const candidates = screen.getByTestId('merc-equip-candidates');
    fireEvent.click(within(candidates).getByRole('button', { name: /preview-weapon/ }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(within(screen.getByTestId('merc-candidate-item')).getByTestId('item-tooltip-damage')).toHaveTextContent('37');
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    fireEvent.click(within(dialog).getByRole('button', { name: /交给佣兵装备|Equip on mercenary/ }));
    expect(useMercStore.getState().mercEquipment[merc.id]?.weapon?.id).toBe(item.id);
    expect(screen.getByTestId('merc-current-item')).toHaveTextContent('37');
    expect(useInventoryStore.getState().backpack).toHaveLength(0);
    const replacement = { ...item, id: 'replacement-weapon', baseRolls: { attack: 51 } };
    act(() => { useInventoryStore.setState({ backpack: [replacement] }); });
    fireEvent.click(within(screen.getByTestId('merc-equip-candidates')).getByRole('button', { name: /replacement-weapon/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /交给佣兵装备|Equip on mercenary/ }));
    expect(useInventoryStore.getState().backpack.map(gear => gear.id)).toEqual([item.id]);
    expect(screen.getByTestId('merc-current-item')).toHaveTextContent('51');
    fireEvent.click(within(dialog).getByRole('button', { name: /卸下|Unequip/ }));
    expect(useInventoryStore.getState().backpack.map(gear => gear.id)).toEqual([item.id, replacement.id]);
    expect(useMercStore.getState().mercEquipment[merc.id]?.weapon).toBeNull();
  });

  it('shows unmet merc requirements without transferring the selected item', () => {
    const { item } = openEquipment();
    act(() => { useInventoryStore.setState({ backpack: [{ ...item, baseId: 'items/base/wp1h-phase-blade' }] }); });
    fireEvent.click(within(screen.getByTestId('merc-equip-candidates')).getByRole('button', { name: /preview-weapon/ }));
    expect(screen.getByRole('button', { name: /交给佣兵装备|Equip on mercenary/ })).toBeDisabled();
    expect(screen.getByTestId('merc-candidate-item')).toHaveTextContent('50');
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
  });

  it('shows full-backpack refusal inside the equipment dialog and retains the gear', () => {
    const { merc, item } = openEquipment();
    act(() => {
      useMercStore.setState({ mercEquipment: { [merc.id]: { weapon: { ...item, equipped: true } } } });
      useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ({ ...item, id: `filler-${String(index)}` })) });
    });
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /卸下|Unequip/ }));
    expect(within(dialog).getByRole('status')).toHaveTextContent(/背包已满|Backpack full/i);
    expect(useMercStore.getState().mercEquipment[merc.id]?.weapon?.id).toBe(item.id);
    expect(useInventoryStore.getState().backpack).toHaveLength(BACKPACK_CAPACITY);
  });

});

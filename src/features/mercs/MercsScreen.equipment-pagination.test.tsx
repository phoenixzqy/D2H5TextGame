import { Suspense, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

let mercId: string;
const items: Item[] = Array.from({ length: 201 }, (_, index) => ({
  id: `candidate-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: false, socketCapacity: 0, baseRolls: { defense: index % 4 + 1 }
}));

function show() {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MercsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId(`merc-equipment-${mercId}`));
  fireEvent.click(screen.getByTestId('merc-equip-slot-head-select'));
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
  const def = loadMercPool().pool.find(entry => entry.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing authored merc');
  const merc = createMercFromDef(def);
  mercId = merc.id;
  useMercStore.getState().addMerc(merc);
  useInventoryStore.setState({ backpack: structuredClone(items) });
});

describe.each(['en', 'zh-CN'] as const)('Mercenary equipment browsing %s', locale => {
  it('bounds visible candidates, reaches the last page and transfers one exact searched instance', async () => {
    await i18n.changeLanguage(locale);
    const beforeInventory = useInventoryStore.getState();
    const beforeMerc = useMercStore.getState();
    show();
    const list = screen.getByTestId('merc-equip-candidates');
    expect(within(list).getAllByRole('listitem')).toHaveLength(100);
    const next = screen.getByRole('button', { name: i18n.t('common:pagination.next') });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('#candidate-200')).toBeVisible();
    expect(useInventoryStore.getState()).toBe(beforeInventory);
    expect(useMercStore.getState()).toBe(beforeMerc);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' #CANDIDATE-150 ' } });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByText('#candidate-150'));
    fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.give') }));
    expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...items[150], equipped: true, equipSlot: 'head' });
    expect(useInventoryStore.getState().backpack).toEqual(items.filter(item => item.id !== 'candidate-150'));
    expect(screen.getByTestId('merc-current-item')).toHaveTextContent(i18n.t('items:base.helm-cap'));

  });

  it('clamps after live removals, searches localized names and clears search on slot change', async () => {
    await i18n.changeLanguage(locale);
    show();
    const next = screen.getByRole('button', { name: i18n.t('common:pagination.next') });
    fireEvent.click(next);
    fireEvent.click(next);
    act(() => { useInventoryStore.setState({ backpack: structuredClone(items.slice(0, 100)) }); });
    expect(screen.queryByRole('button', { name: i18n.t('common:pagination.next') })).not.toBeInTheDocument();
    const list = screen.getByTestId('merc-equip-candidates');
    expect(within(list).getAllByRole('listitem')).toHaveLength(100);
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: i18n.t('items:base.helm-cap') } });
    expect(within(list).getAllByRole('listitem')).toHaveLength(100);
    fireEvent.change(search, { target: { value: 'not-an-owned-item' } });
    expect(screen.getByText(i18n.t('inventory:crafting.noMatches'))).toBeVisible();
    expect(screen.queryByTestId('merc-equip-candidates')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.back') }));
    fireEvent.click(screen.getByTestId('merc-equip-slot-boots-select'));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByText(i18n.t('mercs:noCompatibleItems'))).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.back') }));
    fireEvent.click(screen.getByTestId('merc-equip-slot-head-select'));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(within(screen.getByTestId('merc-equip-candidates')).getAllByRole('listitem')).toHaveLength(100);

  });
});

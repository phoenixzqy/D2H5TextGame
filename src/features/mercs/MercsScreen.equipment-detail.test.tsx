import { Suspense, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { useInventoryStore, useMercStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { MercsScreen } from './MercsScreen';

vi.mock('@/ui/ScreenShell', () => ({ ScreenShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));

const current: Item = { id: 'current-sword', baseId: 'items/base/wp1h-short-sword', rarity: 'magic',
  level: 1, identified: true, equipped: true, equipSlot: 'weapon', socketCapacity: 1,
  affixes: [{ affixId: 'saved', values: new Map([['statMods.life', 7]]) }], baseRolls: { attack: 37 } };
const candidate: Item = { ...current, id: 'candidate-sword', rarity: 'rare', equipped: false,
  baseRolls: { attack: 51 } };
let mercId: string;

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useInventoryStore.getState().reset();
  useMercStore.getState().reset();
  const def = loadMercPool().pool[0];
  if (!def) throw new Error('Missing mercenary');
  const merc = createMercFromDef(def);
  mercId = merc.id;
  useMercStore.setState({ ownedMercs: [merc], mercEquipment: { [merc.id]: { weapon: current } } });
  useInventoryStore.setState({ backpack: [candidate] });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MercsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId(`merc-equipment-${mercId.split('#')[0] ?? mercId}`));
});

it('opens populated equipment details independently of replacement candidates in one dialog', () => {
  fireEvent.click(screen.getByTestId('merc-equip-slot-weapon-details'));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  const details = screen.getByTestId('merc-equipped-item-details');
  expect(within(details).getByTestId('item-tooltip-damage')).toHaveTextContent('37');
  expect(within(details).getByTestId('item-tooltip-affixes')).toHaveTextContent('7');
  expect(details).toHaveTextContent(i18n.t('rarity:tier.magic'));
  expect(details).toHaveTextContent('1');
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(useMercStore.getState().mercEquipment[mercId]?.weapon).toEqual(current);
});

it('shows rarity and upgrade hints before selection, then complete mercenary deltas before transfer', () => {
  fireEvent.click(screen.getByTestId('merc-equip-slot-weapon-select'));
  const list = screen.getByTestId('merc-equip-candidates');
  expect(list).toHaveTextContent(i18n.t('rarity:tier.rare'));
  expect(list.querySelector('[data-trend="up"]')).not.toBeNull();
  fireEvent.click(within(list).getByText('#candidate-sword'));
  expect(screen.getByTestId('merc-candidate-item')).toHaveTextContent('51');
  expect(screen.getByTestId('compare-panel')).toBeInTheDocument();
  expect(screen.getByTestId('net-summary')).toHaveAttribute('data-trend', 'up');
  expect(useInventoryStore.getState().backpack).toEqual([candidate]);
  fireEvent.click(screen.getByRole('button', { name: i18n.t('mercs:equipmentFlow.give') }));
  expect(useMercStore.getState().mercEquipment[mercId]?.weapon?.id).toBe(candidate.id);
  expect(useInventoryStore.getState().backpack[0]?.id).toBe(current.id);
});

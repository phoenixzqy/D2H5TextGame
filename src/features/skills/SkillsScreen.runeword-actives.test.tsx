import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';
import i18n from '@/i18n';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

function word(id: string, base: string): Item {
  const row = socketRunewords.find(row => row.id === `runewords/${id}`);
  if (!row) throw new Error('Missing authored word');
  return { id, baseId: `items/base/${base}`, rarity: 'runeword', level: 70,
    identified: true, equipped: false, runewordId: row.id, socketCapacity: row.sockets,
    socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
}
function reset() {
  abortSubAreaRun(); useCombatStore.getState().reset();
  usePlayerStore.getState().reset(); useInventoryStore.getState().reset();
}
function at<T>(values: T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`Missing expected control at ${String(index)}`);
  return value;
}
beforeEach(async () => { reset(); await i18n.changeLanguage('en'); });
afterEach(reset);
function show(order = ['skills-paladin-sacrifice']) {
  const hero = { ...createMockPlayer('Temporary skills', 'paladin'), level: 70,
    comboOrder: order, skillLevels: { 'skills-paladin-sacrifice': 1 } };
  usePlayerStore.getState().setPlayer(hero);
  render(<I18nextProvider i18n={i18n}><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <SkillsScreen />
  </MemoryRouter></I18nextProvider>);
  fireEvent.click(screen.getByRole('tab', { name: 'Active Skills' }));
  return { hero, panel: within(screen.getByTestId('skills-active-panel')) };
}

it.each([
  ['leaf', 'weapon-staff', 'weapon', 'sorceress.fire_bolt', 'Fire Bolt'],
  ['hand-of-justice', 'wp1h-legend-sword', 'weapon', 'sorceress.blaze', 'Blaze'],
  ['death', 'wp1h-legend-sword', 'weapon', 'sorceress.chain_lightning', 'Chain Lightning'],
  ['phoenix', 'sh-monarch', 'offhand', 'item.redemption', 'Redemption']
])('displays %s grant after explicit priority without allocating or persisting the projection', (id, base, slot, skillId, name) => {
  useInventoryStore.setState({ equipped: { [slot]: word(id, base) } });
  const { hero, panel } = show();
  const selects = panel.getAllByRole('combobox');
  expect(selects[0]).toHaveValue('skills-paladin-sacrifice');
  expect(selects[1]).toHaveValue(skillId);
  expect(within(at(selects, 1)).getByRole('option', { name })).toBeEnabled();
  expect(usePlayerStore.getState().player).toEqual(hero);
  expect(screen.queryByTestId('skill-node-skills-sorceress-fire-bolt')).not.toBeInTheDocument();
});

it('persists an explicit grant priority, leaves it dormant on unequip and restores it on re-equip', () => {
  const equipped = { offhand: word('phoenix', 'sh-monarch') };
  useInventoryStore.setState({ equipped });
  const { hero, panel } = show();
  fireEvent.click(at(panel.getAllByRole('button', { name: 'Move up' }), 1));
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(['item.redemption', 'skills-paladin-sacrifice']);
  act(() => { useInventoryStore.setState({ equipped: {} }); });
  const first = at(panel.getAllByRole('combobox'), 0);
  expect(first).toHaveValue('item.redemption');
  expect(within(first).getByRole('option', { name: 'Redemption (unavailable)' })).toBeDisabled();
  expect(usePlayerStore.getState().player?.skillLevels).toEqual(hero.skillLevels);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(['item.redemption', 'skills-paladin-sacrifice']);
  act(() => { useInventoryStore.setState({ equipped }); });
  expect(within(first).getByRole('option', { name: 'Redemption' })).toBeEnabled();
});

it('preserves dormant governed priorities and the complete tail beyond nine rows during cleanup and edits', () => {
  const order = [...Array.from({ length: 10 }, () => 'skills-paladin-sacrifice'), 'item-redemption'];
  const { panel } = show(order);
  expect(panel.getAllByRole('combobox')).toHaveLength(11);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual([...order.slice(0, 10), 'item.redemption']);
  fireEvent.click(at(panel.getAllByRole('button', { name: 'Move up' }), 10));
  expect(usePlayerStore.getState().player?.comboOrder).toEqual([
    ...order.slice(0, 9), 'item.redemption', 'skills-paladin-sacrifice'
  ]);
});

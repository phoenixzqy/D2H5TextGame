import { afterEach, beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';
import { MercsScreen } from './MercsScreen';

const id = 'mercs/act1-rogue-inner-sight';
beforeEach(async () => {
  useMercStore.getState().reset(); useCombatStore.getState().reset();
  await i18n.changeLanguage('en');
  const def = loadMercPool().pool.find(row => row.id === id);
  if (!def) throw new Error('Missing real Rogue');
  useMercStore.getState().addMerc(createMercFromDef(def));
});
afterEach(() => { useMercStore.getState().reset(); useCombatStore.getState().reset(); });
function renderScreen() {
  render(<I18nextProvider i18n={i18n}><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <MercsScreen />
  </MemoryRouter></I18nextProvider>);
  return within(screen.getByTestId(`merc-card-${id}`));
}

it('exposes named secondary priority controls while locking signature and boundaries', () => {
  const card = renderScreen();
  expect(card.getByRole('button', { name: 'Move Pierce Arrow earlier' })).toBeEnabled();
  expect(card.getByRole('button', { name: 'Move Basic Arrow earlier' })).toBeDisabled();
  expect(card.getByRole('button', { name: 'Move Pierce Arrow later' })).toBeDisabled();
  expect(card.queryByRole('button', { name: /Move Inner Sight/ })).not.toBeInTheDocument();
  fireEvent.click(card.getByRole('button', { name: 'Move Pierce Arrow earlier' }));
  expect(useMercStore.getState().ownedMercs[0]?.comboOrder)
    .toEqual(['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow']);
  expect(card.getByRole('button', { name: 'Move Basic Arrow earlier' })).toBeEnabled();
  fireEvent.click(card.getByRole('button', { name: 'Move Basic Arrow earlier' }));
  expect(useMercStore.getState().ownedMercs[0]?.comboOrder)
    .toEqual(['mskill-inner-sight', 'mskill-basic-arrow', 'mskill-pierce-arrow']);
});

it('disables and explains priority editing while combat is active', () => {
  useCombatStore.setState({ inCombat: true });
  const card = renderScreen();
  expect(card.getByRole('button', { name: 'Move Pierce Arrow earlier' })).toBeDisabled();
  expect(card.getByText('Finish the current battle before changing skill priority.')).toBeVisible();
});

it('localizes the priority controls in Chinese', async () => {
  await i18n.changeLanguage('zh-CN');
  const card = renderScreen();
  fireEvent.click(card.getByRole('button', { name: '提高穿透箭的优先级' }));
  expect(useMercStore.getState().ownedMercs[0]?.comboOrder)
    .toEqual(['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow']);
});

it('distinguishes legacy skill controls when names are untranslated', () => {
  const merc = useMercStore.getState().ownedMercs[0];
  if (!merc) throw new Error('Missing owned Rogue');
  useMercStore.setState({ ownedMercs: [{ ...merc,
    comboOrder: ['mskill-inner-sight', 'mskill-legacy-arrow', 'mskill-legacy-bolt'] }] });
  const card = renderScreen();
  fireEvent.click(card.getByRole('button', { name: 'Move Unrecognized skill: legacy bolt earlier' }));
  expect(card.getByRole('button', { name: 'Move Unrecognized skill: legacy arrow earlier' })).toBeEnabled();
  expect(useMercStore.getState().ownedMercs[0]?.comboOrder)
    .toEqual(['mskill-inner-sight', 'mskill-legacy-bolt', 'mskill-legacy-arrow']);
});

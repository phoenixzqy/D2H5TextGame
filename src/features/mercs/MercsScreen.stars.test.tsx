import { afterEach, beforeEach, expect, it } from 'vitest';
import { Suspense } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { createMercFromDef } from '@/stores/mercFactory';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { MercsScreen } from './MercsScreen';

const id = 'mercs/act1-rogue-inner-sight';
beforeEach(() => {
  __resetPersistenceForTests(); useCombatStore.getState().reset(); useMercStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Stars', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  const def = loadMercPool().pool.find(row => row.id === id);
  if (!def) throw new Error('Missing native merc');
  useMercStore.getState().addMerc(createMercFromDef(def));
  useMercStore.setState({ recruitmentProgress: { [id]: { shards: 105, stars: 0 } } });
});
afterEach(() => { __resetPersistenceForTests(); });

it.each(['en', 'zh-CN'])('shows owned stars/shards and performs a real upgrade in %s', async locale => {
  await i18n.changeLanguage(locale);
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MercsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  const card = screen.getByTestId(`merc-card-${id}`);
  const box = within(card).getByTestId(`merc-stars-${id}`);
  expect(box).toHaveTextContent('0 / 5');
  expect(box).toHaveTextContent('105 / 100');
  const natural = useMercStore.getState().ownedMercs[0];
  fireEvent.click(within(box).getByRole('button'));
  expect(useMercStore.getState().recruitmentProgress[id]).toEqual({ shards: 5, stars: 1 });
  expect(box).toHaveTextContent('1 / 5'); expect(box).toHaveTextContent('5 / 100');
  expect(box).toHaveTextContent('12%');
  expect(within(box).getByRole('button')).toBeDisabled();
  const label = within(card).getByText('STR').parentElement;
  expect(label).toHaveTextContent(String(Number(((natural?.coreStats.strength ?? 0) * 1.08).toFixed(2))));
  expect(useMercStore.getState().ownedMercs[0]).toBe(natural);
});

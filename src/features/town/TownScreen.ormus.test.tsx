/** Constructed clear graph; actual NPC click and protected action are real. */
import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import i18n from '@/i18n';
import { ORMUS } from '@/engine/map/ormus-quest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { TownScreen } from './TownScreen';

const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
function reset() {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function mount(proof = true) {
  usePlayerStore.getState().setPlayer(createMockPlayer('Town Ormus', 'sorceress'));
  useMapStore.setState({ currentAct: 3, currentSubAreaId: ORMUS.area,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'],
    questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { [ORMUS.first]: proof, [ORMUS.talk]: false } } }, questReceipts: proof ? { [ORMUS.proof]: true } : {} });
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TownScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); });

it.each(['en', 'zh-CN'])('actual %s Act III Ormus tile completes Talk without changing remembered field selection', async locale => {
  await i18n.changeLanguage(locale); mount();
  const hero = structuredClone(usePlayerStore.getState().player), inventory = useInventoryStore.getState();
  fireEvent.click(screen.getByTestId('town-npc-ormus'));
  expect(useMapStore.getState().questProgress[ORMUS.quest]).toMatchObject({ status: 'completed', rewardClaimed: false,
    objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } });
  expect(useMapStore.getState().currentSubAreaId).toBe(ORMUS.area);
  expect(usePlayerStore.getState().player).toEqual(hero); expect(useInventoryStore.getState()).toBe(inventory);
  expect(screen.getByTestId('town-npc-ormus')).toHaveFocus();
});
it('keeps ordinary dialogue available before the clear without inventing quest progress', () => {
  mount(false); const before = useMapStore.getState().questProgress;
  fireEvent.click(screen.getByTestId('town-npc-ormus'));
  expect(useMapStore.getState().questProgress).toBe(before);
  expect(useMapStore.getState().questReceipts).toEqual({});
  expect(screen.getByTestId('town-npc-ormus')).toHaveAttribute('aria-expanded', 'true');
});

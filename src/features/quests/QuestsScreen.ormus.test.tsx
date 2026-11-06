/** Constructed history/clear capabilities; real journal and town interactions. */
import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import i18n from '@/i18n';
import { ORMUS } from '@/engine/map/ormus-quest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { QuestsScreen } from './QuestsScreen';
import { TownScreen } from '@/features/town/TownScreen';

const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
function reset() { cleanup(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset(); }
function mount(town = false) {
  const result = render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{town ? <TownScreen /> : <QuestsScreen />}</MemoryRouter></Suspense></I18nextProvider>);
  if (!town) fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
  return result;
}
function card() { return within(screen.getByTestId(`quest-${ORMUS.quest}`)); }
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Ormus journal', 'sorceress'));
  useMapStore.setState({ currentAct: 3, currentSubAreaId: ORMUS.area,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); });

it.each(['en', 'zh-CN'])('shows %s actual objective flags and named reward for completed proofless legacy history', async locale => {
  await i18n.changeLanguage(locale);
  useMapStore.setState({ questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'completed', rewardClaimed: false,
    objectives: { [ORMUS.first]: true } } }, questReceipts: {} });
  mount(); const quest = card();
  expect(quest.getByText(i18n.t('byId.act3-ormus-charm.obj1', { ns: 'quests' }), { exact: false })).toHaveClass('line-through');
  expect(quest.getByText(i18n.t('byId.act3-ormus-charm.obj2', { ns: 'quests' }))).not.toHaveClass('line-through');
  expect(screen.getByTestId(`quest-${ORMUS.quest}`)).toHaveTextContent(locale === 'en' ? 'Ormus’s Charm' : '奥玛斯的护符');
  expect(screen.getByTestId(`quest-claim-${ORMUS.quest}`)).toBeDisabled();
});
it.each(['en', 'zh-CN'])('starts both %s objectives and real Ormus Talk enables explicit journal Claim', async locale => {
  await i18n.changeLanguage(locale); mount();
  fireEvent.click(screen.getByTestId(`quest-start-${ORMUS.quest}`));
  expect(useMapStore.getState().questProgress[ORMUS.quest]?.objectives).toEqual({ [ORMUS.first]: false, [ORMUS.talk]: false });
  cleanup();
  useMapStore.setState({ questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'inProgress', rewardClaimed: false,
    objectives: { [ORMUS.first]: true, [ORMUS.talk]: false } } }, questReceipts: { [ORMUS.proof]: true } });
  mount(true); fireEvent.click(screen.getByTestId('town-npc-ormus')); cleanup(); mount();
  expect(useInventoryStore.getState().backpack).toEqual([]);
  expect(useInventoryStore.getState().currencies.wishstone).toBeUndefined();
  expect(screen.getByTestId(`quest-${ORMUS.quest}`)).toHaveTextContent(i18n.t('gacha:wishstones'));
  fireEvent.click(screen.getByTestId(`quest-claim-${ORMUS.quest}`));
  expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  expect(useInventoryStore.getState().backpack).toHaveLength(1);
  expect(useInventoryStore.getState().backpack[0]?.uniqueId).toBe('items/unique/ormus-charm');
  expect(useMapStore.getState().questProgress[ORMUS.quest]?.rewardClaimed).toBe(true);
});

/**
 * Native physical Recover/Give UI regressions.
 * Constructed tracking/clear fixtures are
 * not earned gameplay, save/Continue evidence, browser acceptance, or balance.
 * Real MapScreen → AreaObjectsPanel Recover → BottomNav Town → selected Charsi
 * Give are exercised. Town retains the remembered canonical Catacombs selection.
 * No physical item, objective completion, Smith kill, or service is injected.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestProgressData } from '@/engine/types/save';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { MapScreen } from '@/features/map/MapScreen';
import { TownScreen } from '@/features/town/TownScreen';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { claimQuestReward } from '@/features/quests/claimReward';
import { xpTotal } from '@/engine/progression/xp';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';

const QUEST = 'quests/act1-tools-of-the-trade';
const SIDE = 'quests/side-act1-charsis-imbue';
const ITEM = 'quest/horadric_malus';
const SOURCE = `${QUEST}#objective:obj-recover-malus`;
const AREA = 'areas/act1-catacombs';
const RECOVER = 'obj-recover-malus';
const GIVE = 'obj-imbue-ready';
const stores = [usePlayerStore, useMapStore, useInventoryStore, useMercStore,
  useCombatStore, useMetaStore, useFormationStore] as const;
type History = 'fresh' | 'sparse-claimed';

function dataOnly(value: object) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry !== 'function'));
}

function snapshot() {
  return structuredClone(stores.map(store => dataOnly(store.getState())));
}

/** Includes whole hero/merc payloads, wallet/materials/equipment and service uses. */
function protectedIncome() {
  const inventory = Object.fromEntries(Object.entries(dataOnly(useInventoryStore.getState()))
    .filter(([key]) => key !== 'questItems'));
  return structuredClone({ player: dataOnly(usePlayerStore.getState()),
    mercs: dataOnly(useMercStore.getState()), inventory,
    receipts: useMapStore.getState().questReceipts,
    ordinaryOrdinals: useMapStore.getState().challengeOrdinals,
    side: useMapStore.getState().questProgress[SIDE] });
}

function reset() {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}

function Location() {
  const location = useLocation();
  return <output data-testid="malus-location">{location.pathname + location.search}</output>;
}

function mount() {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter initialEntries={['/map']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/map" element={<MapScreen />} />
        <Route path="/town" element={<TownScreen />} />
        <Route path="/quests" element={<QuestsScreen />} />
      </Routes>
      <Location />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
}

function prepare(history: History, cleared = true) {
  const objectives = history === 'fresh' ? { [RECOVER]: false, [GIVE]: false } : {};
  const progress: QuestProgressData = { id: QUEST,
    status: history === 'fresh' ? 'inProgress' : 'completed',
    rewardClaimed: history !== 'fresh', objectives };
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor',
    selectedDifficulty: 'normal', clearedSubAreas: cleared ? [AREA] : [],
    questProgress: { [QUEST]: progress }, questReceipts: {} });
  // A real native recipient makes accidental mercenary XP observable.
  const merc = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!merc) throw new Error('Missing native mercenary fixture');
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  expect(useMercStore.getState().fieldedMercId).not.toBeNull();
  useInventoryStore.setState({ currencies: { gold: 71, wishstones: 3 } });
  return progress;
}

function authoredMalus() {
  const item = loadQuestItems().find(row => row.id === ITEM);
  if (item?.kind !== 'delivery') throw new Error('Missing authored Malus delivery definition');
  expect(item.sourceQuestId).toBe(QUEST);
  expect(item.sourceObjectiveId).toBe(RECOVER);
  expect(item.consumeObjectiveId).toBe(GIVE);
  expect(item.outputItemId).toBeUndefined();
  expect(questItemSource(item)).toBe(SOURCE);
  const quest = loadQuests().find(row => row.id === QUEST);
  expect(quest?.objectives).toEqual([
    expect.objectContaining({ id: RECOVER, type: 'fetch', itemId: ITEM,
      areaId: AREA, targetId: 'objects/horadric_malus_cache' }),
    expect.objectContaining({ id: GIVE, type: 'give', itemId: ITEM, npcId: 'npc/charsi' }),
  ]);
  return item;
}

function openCache() {
  fireEvent.click(screen.getByTestId('area-objects-a1-catacombs'));
  expect(useMapStore.getState().currentAct).toBe(1);
  expect(useMapStore.getState().currentSubAreaId).toBe(AREA);
  const panel = screen.getByTestId('area-object-panel');
  expect(panel).toBeVisible();
  return panel;
}

function navigateToTown() {
  fireEvent.click(screen.getByRole('link', { name: i18n.t('common:nav.town') }));
  expect(screen.getByTestId('malus-location')).toHaveTextContent('/town');
  expect(screen.getByTestId('town-screen')).toBeVisible();
  // Opening Town does not replace the remembered map selection with a town id.
  expect(useMapStore.getState().currentAct).toBe(1);
  expect(useMapStore.getState().currentSubAreaId).toBe(AREA);
}

function expectGraph(history: History, state: 'owned' | 'consumed') {
  const consumed = state === 'consumed';
  expect(useInventoryStore.getState().questItems).toEqual({ [SOURCE]: { itemId: ITEM, state } });
  expect(useMapStore.getState().questProgress[QUEST]).toEqual({ id: QUEST,
    status: history === 'sparse-claimed' || consumed ? 'completed' : 'inProgress',
    rewardClaimed: history === 'sparse-claimed',
    objectives: history === 'sparse-claimed' && !consumed
      ? { [RECOVER]: true } : { [RECOVER]: true, [GIVE]: consumed } });
  const map = useMapStore.getState();
  expect(() => validateQuestItemLedger(useInventoryStore.getState().questItems,
    map.questProgress, map.questReceipts)).not.toThrow();
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Malus physical UI fixture', 'sorceress'));
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); });

describe.each(['en', 'zh-CN'] as const)('Malus actual Recover/Give UI in %s', locale => {
  it.each(['fresh', 'sparse-claimed'] as const)('recovers and gives once for %s history without Smith proof or income', async history => {
    await i18n.changeLanguage(locale); prepare(history);
    const item = authoredMalus(), income = protectedIncome();
    const combat = useCombatStore.getState();
    expect(useMapStore.getState().questReceipts).toEqual({});
    mount(); const panel = openCache();
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(panel).toHaveTextContent(i18n.t(item.nameKey));
    expect(panel).toHaveTextContent(i18n.t(item.descKey));
    const recover = within(panel).getByTestId(`quest-recover-${ITEM}`);
    expect(recover).toHaveAccessibleName(i18n.t('quests:areaObjects.recover'));
    expect(recover).toBeEnabled(); fireEvent.click(recover);
    expectGraph(history, 'owned'); expect(recover).toBeDisabled();
    expect(protectedIncome()).toEqual(income);
    const recovered = snapshot(); fireEvent.click(recover); expect(snapshot()).toEqual(recovered);

    navigateToTown();
    const owned = useInventoryStore.getState().questItems;
    fireEvent.click(screen.getByTestId('town-npc-charsi'));
    // Talk selects the real conversation; it must not consume or hand in Malus.
    expect(useInventoryStore.getState().questItems).toBe(owned);
    expectGraph(history, 'owned'); expect(protectedIncome()).toEqual(income);
    const deliveries = screen.getByTestId('quest-deliveries');
    expect(deliveries).toHaveTextContent(i18n.t('town:delivery.consumes', { item: i18n.t(item.nameKey) }));
    const give = within(deliveries).getByTestId(`quest-give-${ITEM}`);
    expect(give).toHaveAccessibleName(i18n.t('town:delivery.give', { item: i18n.t(item.nameKey) }));
    expect(give).toHaveAttribute('type', 'button');
    expect(give).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    expect(give).toBeEnabled(); fireEvent.click(give);
    expectGraph(history, 'consumed'); expect(give).toBeDisabled();
    expect(deliveries).toHaveTextContent(i18n.t('town:delivery.consumed'));
    expect(deliveries.textContent).not.toMatch(/quest\/|delivery\.|questItems\.|undefined/);
    expect(protectedIncome()).toEqual(income);
    expect(useCombatStore.getState()).toBe(combat);
    expect(useMapStore.getState().currentSubAreaId).toBe(AREA);
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(useInventoryStore.getState().questServices).toEqual({});
    expect(screen.queryByTestId(`quest-service-${QUEST}#reward:service`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`quest-service-${SIDE}#reward:service`)).not.toBeInTheDocument();
    const given = snapshot(); fireEvent.click(give); expect(snapshot()).toEqual(given);
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    fireEvent.click(screen.getByTestId('town-npc-charsi'));
    expect(screen.getByTestId(`quest-give-${ITEM}`)).toBeDisabled();
    expect(snapshot()).toEqual(given);

    // Hand-in grants no income; only a separate first Claim grants its once-only bundle.
    let result: ReturnType<typeof claimQuestReward> | undefined;
    const beforeClaim = snapshot();
    const heroBefore = usePlayerStore.getState().player;
    if (!heroBefore) throw new Error('Missing hero before Claim');
    act(() => { result = claimQuestReward(QUEST); });
    expect(result).toBe(history === 'sparse-claimed' ? 'already-claimed' : 'ok');
    if (history === 'sparse-claimed') {
      expect(snapshot()).toEqual(beforeClaim); expect(protectedIncome()).toEqual(income);
    } else {
      const hero = usePlayerStore.getState().player;
      if (!hero) throw new Error('Missing hero after Claim');
      expect(xpTotal(hero.level) + hero.experience).toBe(xpTotal(heroBefore.level) + heroBefore.experience + 3500);
      expect(useMercStore.getState().ownedMercs).not.toEqual(income.mercs.ownedMercs);
      expect(useInventoryStore.getState().questServices).toEqual({ [`${QUEST}#reward:service`]: { serviceId: 'imbue_item', state: 'available' } });
      expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    }
    const afterClaim = snapshot();
    act(() => { expect(claimQuestReward(QUEST)).toBe('already-claimed'); });
    expect(snapshot()).toEqual(afterClaim);
    fireEvent.click(screen.getByRole('link', { name: i18n.t('common:nav.quests') }));
    const card = screen.getByTestId(`quest-${QUEST}`);
    expect(card).toHaveTextContent(i18n.t('quests:byId.act1-tools-of-the-trade.name'));
    if (history === 'sparse-claimed') expect(screen.getByTestId(`quest-claim-${QUEST}`)).toBeDisabled();
    expect(snapshot()).toEqual(afterClaim);
  });

  it('requires a canonical Catacombs clear before explicit Recover and never grants automatically', async () => {
    await i18n.changeLanguage(locale); prepare('fresh', false); authoredMalus();
    const income = protectedIncome(); mount(); openCache();
    const recover = screen.getByTestId(`quest-recover-${ITEM}`);
    expect(recover).toBeDisabled();
    const before = snapshot(); fireEvent.click(recover); expect(snapshot()).toEqual(before);
    expect(useInventoryStore.getState().questItems).toEqual({});
    act(() => { useMapStore.getState().markCleared(AREA); });
    expect(recover).toBeEnabled();
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(useMapStore.getState().questProgress[QUEST]?.objectives[RECOVER]).toBe(false);
    expect(protectedIncome()).toEqual(income);
    fireEvent.click(recover); expectGraph('fresh', 'owned');
    expect(protectedIncome()).toEqual(income);
  });

  it('keeps the physical Malus owned at the wrong selected NPC until explicit Charsi Give', async () => {
    await i18n.changeLanguage(locale); prepare('fresh'); authoredMalus();
    const income = protectedIncome(); mount(); openCache();
    fireEvent.click(screen.getByTestId(`quest-recover-${ITEM}`));
    expectGraph('fresh', 'owned'); navigateToTown();
    const owned = useInventoryStore.getState().questItems;
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(screen.queryByTestId(`quest-give-${ITEM}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems).toBe(owned);
    expectGraph('fresh', 'owned'); expect(protectedIncome()).toEqual(income);
    fireEvent.click(screen.getByTestId('town-npc-charsi'));
    expectGraph('fresh', 'owned');
    fireEvent.click(screen.getByTestId(`quest-give-${ITEM}`));
    expectGraph('fresh', 'consumed'); expect(protectedIncome()).toEqual(income);
    expect(useMapStore.getState().currentSubAreaId).toBe(AREA);
  });
});

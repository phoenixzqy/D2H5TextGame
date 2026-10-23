import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource, type AssembledQuestItemDef } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { COUNCIL_RECEIPT_SOURCE } from '@/engine/map/council-admission';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { recoverQuestTool } from '@/features/quests/interactObject';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { releaseWaveRestore, reserveWaveRestore } from '@/stores/waveTransitionGuard';
import { AreaObjectsPanel } from './AreaObjectsPanel';

const KHALIM = 'quests/act3-khalims-will', GUARDIAN = 'quests/act3-guardian';
const ORB_SOURCE = `${GUARDIAN}#action:break-compelling-orb`;
const ORB_BUTTON = 'quest-action-actions/act3-break-compelling-orb';
const TRAVINCAL = 'areas/act3-travincal';
const hydration = useHydrationStore.getState();
const stores = [useInventoryStore, useMapStore, useCombatStore, useMercStore, usePlayerStore] as const;

function willDefinition(): AssembledQuestItemDef {
  const will = loadQuestItems().find((item): item is AssembledQuestItemDef =>
    item.kind === 'assembled' && item.sourceQuestId === KHALIM);
  if (!will) throw new Error('Missing authored Khalim recipe');
  return will;
}

function hero() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing Khalim visitor');
  return player;
}

function seedTrackedQuests() {
  const questIds = ['quests/act2-horadric-staff', KHALIM, GUARDIAN];
  // Constructed retained proof fixture; combat admission is verified separately.
  useMapStore.setState({ questReceipts: { [COUNCIL_RECEIPT_SOURCE]: true }, clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'],
    questProgress: Object.fromEntries(questIds.map(id => {
      const quest = loadQuests().find(row => row.id === id);
      if (!quest) throw new Error('Missing authored quest');
      return [id, { id, status: 'inProgress' as const,
        objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) }];
    })) });
}

function recoverCube() {
  const will = willDefinition();
  const cube = loadQuestItems().find(item => item.id === will.requiredTool);
  if (cube?.kind !== 'tool') throw new Error('Missing retained recipe tool');
  const quest = loadQuests().find(row => row.id === cube.sourceQuestId);
  const fetch = quest?.objectives.find(row => row.id === cube.sourceObjectiveId);
  if (!quest || typeof fetch?.areaId !== 'string') throw new Error('Missing tool recovery area');
  useMapStore.getState().setCurrentLocation(2, fetch.areaId);
  expect(recoverQuestTool(questItemSource(cube))).toBe('ok');
  return cube;
}

function mount(content: React.ReactNode) {
  return render(content, { wrapper: ({ children }) => <I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter></I18nextProvider> });
}

function recoverComponents(reverse: boolean) {
  const will = willDefinition(), ids = reverse ? [...will.ingredients].reverse() : will.ingredients;
  const view = mount(<QuestItemsPanel />);
  ids.forEach((id, index) => {
    const component = loadQuestItems().find(item => item.id === id);
    if (component?.kind !== 'component') throw new Error('Missing authored Khalim component');
    const quest = loadQuests().find(row => row.id === component.sourceQuestId);
    const fetch = quest?.objectives.find(row => row.id === component.sourceObjectiveId);
    if (typeof fetch?.areaId !== 'string') throw new Error('Missing component recovery area');
    const areaId = fetch.areaId;
    act(() => {
      useMapStore.getState().setCurrentLocation(3, areaId);
      useMapStore.getState().markCleared(areaId);
    });
    view.rerender(<><AreaObjectsPanel act={3} areaId={areaId} onClose={() => undefined} /><QuestItemsPanel /></>);
    const recover = screen.getByTestId(`quest-recover-${id}`);
    expect(recover).toBeEnabled();
    fireEvent.click(recover);
    expect(recover).toBeDisabled();
    expect(useInventoryStore.getState().questItems[questItemSource(component)]).toEqual({ itemId: id, state: 'owned' });
    const assemble = screen.getByTestId(`quest-assemble-${will.id}`);
    if (index < ids.length - 1) expect(assemble).toBeDisabled();
    else expect(assemble).toBeEnabled();
  });
  act(() => { useMapStore.getState().setCurrentLocation(3, 'areas/act3-town'); });
  view.rerender(<QuestItemsPanel />);
  return { will, view, assemble: screen.getByTestId(`quest-assemble-${will.id}`) };
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Khalim visitor', 'sorceress'));
});
afterEach(() => {
  vi.restoreAllMocks();
  act(() => { stores.forEach(store => { store.getState().reset(); }); });
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Khalim and Guardian player actions %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });

  it.each([false, true])('recovers four unordered ingredients, assembles portably, and breaks the Orb with Claim first=%s', claimFirst => {
    seedTrackedQuests(); const cube = recoverCube();
    const before = hero();
    const { will, view, assemble } = recoverComponents(claimFirst);
    const inventory = screen.getByTestId('quest-items-panel');
    will.ingredients.forEach(id => {
      const input = loadQuestItems().find(item => item.id === id);
      if (!input) throw new Error('Missing ingredient label');
      expect(inventory).toHaveTextContent(i18n.t(input.nameKey));
    });
    expect(inventory).toHaveTextContent(i18n.t(cube.nameKey));
    expect(inventory).toHaveTextContent(locale === 'en' ? 'is retained' : '会保留');
    expect(inventory.textContent).not.toMatch(/questItems\.|quest\/|undefined/);
    expect(assemble).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    fireEvent.click(assemble);
    expect(assemble).toBeDisabled();
    expect(useInventoryStore.getState().questItems[questItemSource(will)]).toEqual({ itemId: will.id, state: 'owned' });
    for (const id of will.ingredients) {
      const input = loadQuestItems().find(item => item.id === id);
      if (!input) throw new Error('Missing consumed ingredient');
      expect(useInventoryStore.getState().questItems[questItemSource(input)]?.state).toBe('consumed');
    }
    expect(useInventoryStore.getState().questItems[questItemSource(cube)]?.state).toBe('owned');
    expect(useMapStore.getState().questProgress[KHALIM]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[KHALIM]?.rewardClaimed).not.toBe(true);
    expect(hero()).toBe(before);
    if (claimFirst) {
      view.rerender(<QuestsScreen />);
      const card = screen.getByTestId(`quest-${KHALIM}`);
      expect(card.textContent).not.toMatch(/quests\/|rewardLabel|questItems\.|undefined/);
      fireEvent.click(screen.getByTestId(`quest-claim-${KHALIM}`));
      expect(useMapStore.getState().questProgress[KHALIM]?.rewardClaimed).toBe(true);
    }
    act(() => { useMapStore.getState().setCurrentLocation(3, TRAVINCAL); });
    view.rerender(<><AreaObjectsPanel act={3} areaId={TRAVINCAL} onClose={() => undefined} /><QuestItemsPanel /></>);
    const action = screen.getByTestId(ORB_BUTTON), beforeOrb = hero();
    const guardian = useMapStore.getState().questProgress[GUARDIAN];
    expect(action).toBeEnabled();
    expect(action).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    expect(screen.getByTestId('area-object-panel')).toHaveTextContent(i18n.t(
      'areaObjects.actions.act3-break-compelling-orb.description', { ns: 'quests' }));
    fireEvent.click(action);
    expect(action).toBeDisabled();
    expect(useInventoryStore.getState().questItems[questItemSource(will)]?.state).toBe('consumed');
    expect(useMapStore.getState().questReceipts[ORB_SOURCE]).toBe(true);
    expect(useInventoryStore.getState().questItems[questItemSource(cube)]?.state).toBe('owned');
    expect(useMapStore.getState().questProgress[GUARDIAN]).toEqual(guardian);
    expect(hero()).toBe(beforeOrb);
    expect(screen.getByTestId('area-object-panel')).toHaveTextContent(i18n.t(
      'areaObjects.actions.act3-break-compelling-orb.consumed', { ns: 'quests' }));
    const ledger = useInventoryStore.getState().questItems;
    fireEvent.click(action);
    expect(useInventoryStore.getState().questItems).toBe(ledger);
    expect(hero()).toBe(beforeOrb);
    if (!claimFirst) {
      view.rerender(<QuestsScreen />);
      fireEvent.click(screen.getByTestId(`quest-claim-${KHALIM}`));
      expect(useMapStore.getState().questProgress[KHALIM]?.rewardClaimed).toBe(true);
    }
  });

  it('shows loading, guarded and rollback failures at the real Orb boundary, then permits retry', () => {
    seedTrackedQuests(); recoverCube();
    const { view, assemble } = recoverComponents(true);
    fireEvent.click(assemble);
    act(() => { useMapStore.getState().setCurrentLocation(3, TRAVINCAL); });
    view.rerender(<AreaObjectsPanel act={3} areaId={TRAVINCAL} onClose={() => undefined} />);
    const action = screen.getByTestId(ORB_BUTTON);
    const ledger = useInventoryStore.getState().questItems, before = hero();
    act(() => { useHydrationStore.getState().setStatus('loading'); });
    fireEvent.click(action);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.not-ready', { ns: 'quests' }));
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    const restore = reserveWaveRestore();
    try {
      fireEvent.click(action);
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.busy', { ns: 'quests' }));
    } finally { releaseWaveRestore(restore); }
    const setter = vi.spyOn(useInventoryStore, 'setState').mockImplementation(() => { throw new Error('Injected ledger setter failure'); });
    try {
      fireEvent.click(action);
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.restoration-failed', { ns: 'quests' }));
    } finally { setter.mockRestore(); }
    expect(useInventoryStore.getState().questItems).toBe(ledger);
    expect(hero()).toBe(before);
    fireEvent.click(action);
    expect(action).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(useMapStore.getState().questReceipts[ORB_SOURCE]).toBe(true);
    expect(hero()).toBe(before);
  });

  it('previews the actual Guardian rewards and renders a constructed retained Soulstone without Read or recovery', () => {
    seedTrackedQuests(); recoverCube();
    const { view, assemble } = recoverComponents(false);
    fireEvent.click(assemble);
    act(() => { useMapStore.getState().setCurrentLocation(3, TRAVINCAL); });
    view.rerender(<AreaObjectsPanel act={3} areaId={TRAVINCAL} onClose={() => undefined} />);
    fireEvent.click(screen.getByTestId(ORB_BUTTON));
    const soulstone = loadQuestItems().find(item => item.sourceQuestId === GUARDIAN);
    const guardian = loadQuests().find(quest => quest.id === GUARDIAN);
    if (!soulstone || !guardian) throw new Error('Missing authored Guardian reward');
    const beforePreview = useInventoryStore.getState().questItems;
    view.rerender(<><QuestsScreen /><QuestItemsPanel /></>);
    const card = screen.getByTestId(`quest-${GUARDIAN}`);
    expect(card).toHaveTextContent(i18n.t(soulstone.nameKey));
    expect(card).toHaveTextContent(i18n.t('rewardLabel.rewardCache', { ns: 'quests' }));
    expect(card).toHaveTextContent(String(guardian.rewards?.xp));
    expect(card.textContent).not.toMatch(/questItem|lootTable|tableId|soulstone_mephisto|rewardLabel|[{}]/);
    expect(screen.queryByTestId(`quest-item-${soulstone.id}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems).toBe(beforePreview);
    // Constructed post-Claim rendering fixture; this does not exercise or prove Mephisto victory admission.
    act(() => {
      useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress, [GUARDIAN]: {
        id: GUARDIAN, status: 'completed', rewardClaimed: true,
        objectives: Object.fromEntries(guardian.objectives.map(objective => [objective.id, true]))
      } } });
      useInventoryStore.setState({ questItems: { ...useInventoryStore.getState().questItems,
        [questItemSource(soulstone)]: { itemId: soulstone.id, state: 'owned' } } });
    });
    const ledger = useInventoryStore.getState().questItems, map = useMapStore.getState();
    expect(validateQuestItemLedger(ledger, map.questProgress, map.questReceipts)).toBe(ledger);
    view.rerender(<><QuestsScreen /><QuestItemsPanel /></>);
    const retained = screen.getByTestId(`quest-item-${soulstone.id}`);
    expect(retained).toHaveTextContent(i18n.t(soulstone.nameKey));
    expect(retained).toHaveTextContent(i18n.t(soulstone.descKey));
    expect(retained).toHaveTextContent(i18n.t('questItems.owned', { ns: 'inventory' }));
    expect(within(retained).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTestId(`quest-reward-recover-${GUARDIAN}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems).toBe(ledger);
  });

  it('does not invent a Will or Orb completion from objective flags alone or merely viewing the panel', () => {
    seedTrackedQuests();
    const will = willDefinition(), before = useInventoryStore.getState().questItems;
    const quest = loadQuests().find(row => row.id === KHALIM);
    if (!quest) throw new Error('Missing Khalim quest');
    useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress, [KHALIM]: {
      id: KHALIM, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true]))
    } } });
    act(() => { useMapStore.getState().setCurrentLocation(3, TRAVINCAL); });
    mount(<><AreaObjectsPanel act={3} areaId={TRAVINCAL} onClose={() => undefined} /><QuestItemsPanel /></>);
    expect(screen.getByTestId(ORB_BUTTON)).toBeDisabled();
    expect(screen.queryByTestId(`quest-assemble-${will.id}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems).toBe(before);
    expect(useMapStore.getState().questReceipts[ORB_SOURCE]).toBeUndefined();
  });
});

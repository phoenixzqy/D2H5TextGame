import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { recoverQuestTool } from '@/features/quests/interactObject';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { TownScreen } from '@/features/town/TownScreen';
import { xpTotal } from '@/engine/progression/xp';
import type { Item } from '@/engine/types/items';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { EquipPicker } from './EquipPicker';
import { InventoryScreen } from './InventoryScreen';
import { QuestItemsPanel } from './QuestItemsPanel';

const QUEST = 'quests/act3-golden-bird';
const POTION_SOURCE = `${QUEST}#reward:questItem`;
const hydration = useHydrationStore.getState();
const domains = [useInventoryStore, useMapStore, useCombatStore, useMercStore, usePlayerStore] as const;

function authoredItem(id: string) {
  const item = loadQuestItems().find(row => row.id === id);
  if (!item) throw new Error('Missing authored Golden Bird item');
  return item;
}

function seedQuest() {
  const quest = loadQuests().find(row => row.id === QUEST);
  const jade = authoredItem('quest/jade_figurine');
  const fetch = quest?.objectives.find(row => row.id === jade.sourceObjectiveId);
  if (!quest || typeof fetch?.areaId !== 'string') throw new Error('Missing Golden Bird recovery objective');
  useMapStore.setState({ currentAct: 3, currentSubAreaId: fetch.areaId,
    clearedSubAreas: ['areas/act2-tomb-of-tal-rasha', fetch.areaId], questProgress: {
      [QUEST]: { id: QUEST, status: 'inProgress',
        objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) }
    } });
  return jade;
}

function recoverJade() {
  const jade = seedQuest();
  expect(recoverQuestTool(questItemSource(jade))).toBe('ok');
  useMapStore.getState().setCurrentLocation(3, 'areas/act3-town');
  return jade;
}

function completeDeliveries() {
  const jade = recoverJade(), bird = authoredItem('quest/golden_bird');
  expect(giveQuestItem(questItemSource(jade), 'npc/cain')).toBe('ok');
  expect(giveQuestItem(questItemSource(bird), 'npc/alkor')).toBe('ok');
}

function hero() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing Golden Bird visitor');
  return player;
}

function mount(content: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{content}</MemoryRouter></I18nextProvider>);
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  domains.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Golden Bird visitor', 'sorceress'));
});
afterEach(() => {
  vi.restoreAllMocks();
  act(() => { domains.forEach(store => { store.getState().reset(); }); });
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Golden Bird player actions %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });

  it('exchanges real items, claims XP plus Potion separately, then Reads for maximum Life once without healing', () => {
    const jade = recoverJade(), bird = authoredItem('quest/golden_bird');
    const before = hero(), beforeItems = useInventoryStore.getState().questItems;
    mount(<><Routes><Route path="/" element={<TownScreen />} />
      <Route path="/quests" element={<QuestsScreen />} /></Routes><QuestItemsPanel /></>);
    fireEvent.click(screen.getByTestId('town-npc-cain'));
    expect(useInventoryStore.getState().questItems).toBe(beforeItems);
    const exchange = screen.getByTestId('quest-deliveries');
    expect(exchange).toHaveTextContent(i18n.t('delivery.exchange', { ns: 'town',
      item: i18n.t(jade.nameKey), output: i18n.t(bird.nameKey) }));
    fireEvent.click(screen.getByTestId('quest-give-quest/jade_figurine'));
    expect(useInventoryStore.getState().questItems[questItemSource(jade)]?.state).toBe('consumed');
    expect(useInventoryStore.getState().questItems[questItemSource(bird)]?.state).toBe('owned');
    expect(hero()).toBe(before);
    fireEvent.click(screen.getByTestId('town-npc-alkor'));
    expect(useInventoryStore.getState().questItems[questItemSource(bird)]?.state).toBe('owned');
    fireEvent.click(screen.getByTestId('quest-give-quest/golden_bird'));
    expect(useInventoryStore.getState().questItems[questItemSource(bird)]?.state).toBe('consumed');
    expect(useMapStore.getState().questProgress[QUEST]?.status).toBe('completed');
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]).toBeUndefined();
    expect(hero()).toBe(before);
    fireEvent.click(screen.getByTestId('town-conversation-quests'));
    const card = screen.getByTestId(`quest-${QUEST}`);
    expect(card).toHaveTextContent(i18n.t('rewardLabel.lifePotion', { ns: 'quests',
      item: i18n.t('questItems.potionOfLife.name', { ns: 'inventory' }), maxLife: 20 }));
    expect(card.textContent).not.toMatch(/questItem|potion_of_life_q|rewardLabel|[{}]/);
    fireEvent.click(screen.getByTestId(`quest-claim-${QUEST}`));
    const claimed = hero();
    expect(xpTotal(claimed.level) + claimed.experience).toBe(xpTotal(before.level) + before.experience + 4000);
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('owned');
    // Establish missing current Life after any Claim level-up, isolating the Read effect.
    act(() => { usePlayerStore.setState({ player: { ...claimed, derivedStats: { ...claimed.derivedStats, life: 7 } } }); });
    const unread = hero();
    const read = screen.getByTestId('quest-item-read-items/potion_of_life_q');
    read.focus(); fireEvent.click(read);
    expect(read).toHaveFocus();
    expect(read).toHaveAttribute('aria-disabled', 'true');
    expect(read).toHaveTextContent(i18n.t('questItems.consumed', { ns: 'inventory' }));
    expect(hero().derivedStats.lifeMax).toBe(unread.derivedStats.lifeMax + 20);
    expect(hero().derivedStats.life).toBe(7);
    expect(hero().experience).toBe(unread.experience);
    expect(hero().level).toBe(unread.level);
    expect(hero().statPoints).toBe(unread.statPoints);
    expect(hero().skillPoints).toBe(unread.skillPoints);
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('consumed');
    expect(within(screen.getByTestId('quest-items-panel')).getByRole('status')).toHaveTextContent(
      i18n.t('questItems.feedback.life-increased', { ns: 'inventory', maxLife: 20 }));
    const consumed = hero();
    fireEvent.click(read);
    expect(hero()).toBe(consumed);
    expect(within(screen.getByTestId('quest-items-panel')).getByRole('status')).toHaveTextContent(
      i18n.t('questItems.feedback.life-already-consumed', { ns: 'inventory' }));
  });

  it('offers explicit reward repair only after real item deliveries for a previously claimed quest, without XP', () => {
    completeDeliveries();
    useMapStore.getState().markQuestRewardClaimed(QUEST);
    const before = hero();
    mount(<QuestItemsPanel />);
    const repair = screen.getByTestId(`quest-reward-recover-${QUEST}`);
    expect(repair).toHaveAccessibleName(i18n.t('questItems.recovery.action', { ns: 'inventory',
      item: i18n.t('questItems.potionOfLife.name', { ns: 'inventory' }) }));
    expect(screen.getByTestId(`quest-reward-recovery-${QUEST}`)).toHaveTextContent(
      i18n.t('questItems.recovery.ready', { ns: 'inventory' }));
    fireEvent.click(repair);
    expect(screen.queryByTestId(`quest-reward-recover-${QUEST}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('owned');
    expect(hero()).toBe(before);
    expect(within(screen.getByTestId('quest-items-panel')).getByRole('status')).toHaveTextContent(
      i18n.t('questItems.feedback.reward-recovered', { ns: 'inventory' }));
    expect(screen.getByTestId('quest-item-read-items/potion_of_life_q')).toHaveTextContent(
      i18n.t('questItems.read', { ns: 'inventory' }));
  });

  it('does not offer repair from claimed flags alone or before Claim', () => {
    const jade = seedQuest();
    const quest = loadQuests().find(row => row.id === jade.sourceQuestId);
    if (!quest) throw new Error('Missing Golden Bird quest');
    useMapStore.setState({ questProgress: { [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) } } });
    const view = mount(<QuestItemsPanel />);
    expect(screen.queryByTestId(`quest-reward-recover-${QUEST}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('quest-item-read-items/potion_of_life_q')).not.toBeInTheDocument();
    view.unmount();
    completeDeliveries();
    mount(<QuestItemsPanel />);
    expect(screen.queryByTestId(`quest-reward-recover-${QUEST}`)).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]).toBeUndefined();
  });

  it('keeps the Potion and Life unchanged on loading and a rollback failure, then permits a real retry', () => {
    completeDeliveries(); expect(claimQuestReward(QUEST)).toBe('ok');
    mount(<QuestItemsPanel />);
    const read = screen.getByTestId('quest-item-read-items/potion_of_life_q');
    const before = hero();
    act(() => { useHydrationStore.getState().setStatus('loading'); });
    fireEvent.click(read);
    expect(within(screen.getByTestId('quest-items-panel')).getByRole('status')).toHaveTextContent(
      i18n.t('questItems.feedback.not-ready', { ns: 'inventory' }));
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    const setter = vi.spyOn(useInventoryStore, 'setState').mockImplementation(() => { throw new Error('Injected ledger setter failure'); });
    try {
      fireEvent.click(read);
      expect(within(screen.getByTestId('quest-items-panel')).getByRole('status')).toHaveTextContent(
        i18n.t('questItems.feedback.life-restoration-failed', { ns: 'inventory' }));
    } finally { setter.mockRestore(); }
    expect(hero()).toEqual(before);
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('owned');
    fireEvent.click(read);
    expect(hero().derivedStats.lifeMax).toBe(before.derivedStats.lifeMax + 20);
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('consumed');
  });

  it.each(['backpack', 'picker'])('updates %s equipment previews when the actual Potion is read', surface => {
    completeDeliveries(); expect(claimQuestReward(QUEST)).toBe('ok');
    const candidate: Item = { id: 'golden-preview-helm', baseId: 'items/base/helm-cap', rarity: 'normal',
      level: 1, ilvl: 1, identified: true, equipped: false };
    useInventoryStore.getState().addItem(candidate);
    if (surface === 'backpack') {
      mount(<InventoryScreen />);
      fireEvent.click(screen.getByTestId(`inv-item-${candidate.id}`));
    } else mount(<EquipPicker slot="head" onClose={() => undefined} />);
    const lifeCell = () => {
      const table = screen.getByTestId('stat-compare-table');
      const row = within(table).getByRole('rowheader', {
        name: i18n.t('equipFlow.compare.stat.lifeMax', { ns: 'inventory' })
      }).closest('tr');
      if (!row) throw new Error('Missing Life preview row');
      const cell = row.querySelector('td:last-child');
      if (!cell) throw new Error('Missing candidate Life cell');
      return cell;
    };
    expect(lifeCell()).toHaveTextContent(String(hero().derivedStats.lifeMax));
    act(() => { expect(readQuestItem(POTION_SOURCE)).toBe('ok'); });
    expect(lifeCell()).toHaveTextContent(String(hero().derivedStats.lifeMax));
  });
});

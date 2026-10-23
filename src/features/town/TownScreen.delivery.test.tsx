import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { recoverQuestTool } from '@/features/quests/interactObject';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { releaseWaveRestore, reserveWaveRestore } from '@/stores/waveTransitionGuard';
import { TownScreen } from './TownScreen';

const hydration = useHydrationStore.getState();

function recoveredItem(itemId: string) {
  const item = loadQuestItems().find(row => row.id === itemId);
  if (item?.kind !== 'delivery') throw new Error('Missing authored delivery item');
  const quest = loadQuests().find(row => row.id === item.sourceQuestId);
  const fetch = quest?.objectives.find(row => row.id === item.sourceObjectiveId);
  const give = quest?.objectives.find(row => row.id === item.consumeObjectiveId);
  if (!quest || typeof fetch?.areaId !== 'string' || give?.type !== 'give' || typeof give.npcId !== 'string') {
    throw new Error('Missing authored delivery objectives');
  }
  useMapStore.setState({ currentAct: 3, currentSubAreaId: fetch.areaId,
    clearedSubAreas: ['areas/act2-tomb-of-tal-rasha', fetch.areaId],
    questProgress: { [quest.id]: { id: quest.id, status: 'inProgress',
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) } } });
  const source = questItemSource(item);
  expect(recoverQuestTool(source)).toBe('ok');
  useMapStore.getState().setCurrentLocation(3, 'areas/act3-town');
  return { item, quest, source, npcId: give.npcId };
}

function rewards() {
  const { backpack, stash, equipped, currencies } = useInventoryStore.getState();
  return { player: usePlayerStore.getState().player, backpack, stash, equipped, currencies };
}

function renderTown() {
  return render(<I18nextProvider i18n={i18n}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TownScreen /><QuestItemsPanel />
    </MemoryRouter>
  </I18nextProvider>);
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  for (const domain of [useInventoryStore, useMapStore, useCombatStore, usePlayerStore]) domain.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Delivery visitor', 'sorceress'));
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const domain of [useInventoryStore, useMapStore, useCombatStore, usePlayerStore]) domain.getState().reset();
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Town item delivery %s', locale => {
  describe.each(['quest/gidbinn', 'quest/lam_esens_tome'])('%s', itemId => {
    it('talks without giving, then consumes the exact item once without paying the quest reward', async () => {
      await i18n.changeLanguage(locale);
      const { item, quest, source, npcId } = recoveredItem(itemId);
      const before = rewards(), ledger = useInventoryStore.getState().questItems;
      renderTown();
      fireEvent.click(screen.getByTestId(`town-npc-${npcId.replace('npc/', '')}`));
      expect(useInventoryStore.getState().questItems).toBe(ledger);
      expect(useMapStore.getState().questProgress[quest.id]?.objectives[item.consumeObjectiveId]).toBe(false);
      expect(rewards()).toEqual(before);
      const panel = screen.getByTestId('quest-deliveries');
      const name = i18n.t(item.nameKey);
      expect(panel).toHaveTextContent(name);
      expect(panel).toHaveTextContent(i18n.t(item.descKey));
      expect(panel).toHaveTextContent(i18n.t('delivery.consumes', { ns: 'town', item: name }));
      const give = within(panel).getByRole('button', { name: i18n.t('delivery.give', { ns: 'town', item: name }) });
      expect(give).toBeEnabled();
      expect(give).toHaveAttribute('type', 'button');
      expect(give).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      fireEvent.click(give);
      expect(give).toBeDisabled();
      expect(give.parentElement).toHaveTextContent(i18n.t('delivery.consumed', { ns: 'town' }));
      expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'consumed' });
      expect(useMapStore.getState().questProgress[quest.id]?.status).toBe('completed');
      expect(useMapStore.getState().questProgress[quest.id]?.rewardClaimed).not.toBe(true);
      expect(rewards()).toEqual(before);
      const inventory = screen.getByTestId('quest-items-panel');
      expect(inventory).toHaveTextContent(i18n.t('questItems.delivered', { ns: 'inventory' }));
      expect(inventory).not.toHaveTextContent(i18n.t('questItems.inserted', { ns: 'inventory' }));
      expect(panel.textContent).not.toMatch(/questItems\.|quest\/|delivery\.|undefined/);
      fireEvent.click(screen.getByTestId('town-conversation-close'));
      fireEvent.click(screen.getByTestId(`town-npc-${npcId.replace('npc/', '')}`));
      expect(screen.getByTestId(`quest-give-${itemId}`)).toBeDisabled();
      fireEvent.click(screen.getByTestId(`quest-give-${itemId}`));
      expect(rewards()).toEqual(before);
    });

    it('offers no delivery for this item at the wrong NPC and hides the conversation when the act changes', async () => {
      await i18n.changeLanguage(locale);
      const { source, npcId } = recoveredItem(itemId);
      renderTown();
      fireEvent.click(screen.getByTestId('town-npc-cain'));
      expect(screen.queryByTestId(`quest-give-${itemId}`)).not.toBeInTheDocument();
      expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
      fireEvent.click(screen.getByTestId(`town-npc-${npcId.replace('npc/', '')}`));
      expect(screen.getByTestId('quest-deliveries')).toBeVisible();
      act(() => { useMapStore.getState().setCurrentLocation(2, 'areas/act2-town'); });
      expect(screen.queryByTestId('quest-deliveries')).not.toBeInTheDocument();
      expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
      expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
    });

    it('shows localized loading, guarded and rollback failures without consuming or paying', async () => {
      await i18n.changeLanguage(locale);
      const { source, npcId } = recoveredItem(itemId);
      renderTown();
      fireEvent.click(screen.getByTestId(`town-npc-${npcId.replace('npc/', '')}`));
      const give = screen.getByTestId(`quest-give-${itemId}`);
      const before = rewards(), progress = useMapStore.getState().questProgress;
      act(() => { useHydrationStore.getState().setStatus('loading'); });
      fireEvent.click(give);
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.not-ready', { ns: 'quests' }));
      act(() => { useHydrationStore.getState().setStatus('ready'); });
      const restore = reserveWaveRestore();
      try {
        fireEvent.click(give);
        expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.busy', { ns: 'quests' }));
      } finally { releaseWaveRestore(restore); }
      const setter = vi.spyOn(useInventoryStore, 'setState').mockImplementation(() => { throw new Error('Injected setter failure'); });
      try {
        fireEvent.click(give);
        expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('areaObjects.feedback.restoration-failed', { ns: 'quests' }));
      } finally { setter.mockRestore(); }
      expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
      expect(useMapStore.getState().questProgress).toEqual(progress);
      expect(rewards()).toEqual(before);
      // A different NPC conversation cannot retain this item's failure feedback.
      fireEvent.click(screen.getByTestId('town-npc-cain'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId(`town-npc-${npcId.replace('npc/', '')}`));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId(`quest-give-${itemId}`)).toBeEnabled();
    });
  });
});

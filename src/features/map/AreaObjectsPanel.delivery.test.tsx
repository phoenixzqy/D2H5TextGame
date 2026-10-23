import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { AreaObjectsPanel } from './AreaObjectsPanel';

const hydration = useHydrationStore.getState();
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  for (const domain of [useInventoryStore, useMapStore, useCombatStore, usePlayerStore]) domain.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Delivery explorer', 'sorceress'));
});
afterEach(() => {
  for (const domain of [useInventoryStore, useMapStore, useCombatStore, usePlayerStore]) domain.getState().reset();
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Field delivery items %s', locale => {
  it.each(['quest/gidbinn', 'quest/lam_esens_tome'])('recovers %s only after clearing, then displays its delivered receipt', async itemId => {
    await i18n.changeLanguage(locale);
    const item = loadQuestItems().find(row => row.id === itemId);
    if (item?.kind !== 'delivery') throw new Error('Missing authored delivery item');
    const quest = loadQuests().find(row => row.id === item.sourceQuestId);
    const fetch = quest?.objectives.find(row => row.id === item.sourceObjectiveId);
    const give = quest?.objectives.find(row => row.id === item.consumeObjectiveId);
    if (!quest || typeof fetch?.areaId !== 'string' || typeof give?.npcId !== 'string') throw new Error('Missing delivery objective');
    const areaId = fetch.areaId, npcId = give.npcId, source = questItemSource(item);
    useMapStore.setState({ currentAct: 3, currentSubAreaId: areaId,
      clearedSubAreas: ['areas/act2-tomb-of-tal-rasha'], questProgress: {
        [quest.id]: { id: quest.id, status: 'inProgress',
          objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) }
      } });
    render(<I18nextProvider i18n={i18n}><AreaObjectsPanel act={3} areaId={areaId} onClose={() => undefined} /></I18nextProvider>);
    const panel = screen.getByTestId('area-object-panel');
    expect(panel).toHaveTextContent(i18n.t(item.nameKey));
    expect(panel).toHaveTextContent(i18n.t(item.descKey));
    expect(panel).toHaveTextContent(i18n.t('areaObjects.delivery.unavailable', { ns: 'quests' }));
    const recover = within(panel).getByRole('button', { name: i18n.t('areaObjects.recover', { ns: 'quests' }) });
    expect(recover).toBeDisabled();
    act(() => { useMapStore.getState().markCleared(areaId); });
    // Clearing only unlocks recovery; it never gives the bound item automatically.
    expect(useInventoryStore.getState().questItems[source]).toBeUndefined();
    expect(recover).toBeEnabled();
    fireEvent.click(recover);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'owned' });
    expect(recover).toBeDisabled();
    expect(panel).toHaveTextContent(i18n.t('areaObjects.delivery.owned', { ns: 'quests' }));
    act(() => {
      useMapStore.getState().setCurrentLocation(3, 'areas/act3-town');
      expect(giveQuestItem(source, npcId)).toBe('ok');
      useMapStore.getState().setCurrentLocation(3, areaId);
    });
    expect(panel).toHaveTextContent(i18n.t('areaObjects.delivery.consumed', { ns: 'quests' }));
    expect(recover).toBeDisabled();
    expect(panel).not.toHaveTextContent(i18n.t('areaObjects.orifice.consumed', { ns: 'quests' }));
    expect(panel.textContent).not.toMatch(/questItems\.|quest\/|areaObjects\.|undefined/);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import document from '@/data/quests/main.json';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/persistence';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { recoverQuestTool, questToolStatus, assembleQuestItem, questAssemblyStatus } from './interactObject';
import { eligibleQuestObjective } from './questTransaction';

const questId = 'quests/act2-horadric-staff';
const hydrationBefore = useHydrationStore.getState();
const quest = document.quests.find(row => row.id === questId);
if (!quest) throw new Error('Missing canonical Staff quest');
const source = (id: string) => `${questId}#objective:${id}`;

function reset(): void {
  useMapStore.getState().reset(); usePlayerStore.getState().reset();
  useInventoryStore.getState().reset(); useCombatStore.getState().reset();
}

beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Stage fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 2, clearedSubAreas: ['areas/act1-catacombs'] });
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } });
  Object.defineProperty(quest, 'objectiveStages', { configurable: true, enumerable: true,
    value: [['obj-cube', 'obj-shaft', 'obj-amulet'], ['obj-transmute']] });
});
afterEach(() => {
  Reflect.deleteProperty(quest, 'objectiveStages'); reset();
  useHydrationStore.setState(hydrationBefore);
});

describe('shared staged quest actions', () => {
  it('recovers actual peer items in reverse display order, then assembles only with every real input', () => {
    const player = usePlayerStore.getState().player;
    const locations = [['obj-amulet', 'areas/act2-lost-city'],
      ['obj-shaft', 'areas/act2-far-oasis'], ['obj-cube', 'areas/act2-dry-hills']] as const;
    const staffSource = source('obj-transmute');
    for (const [objectiveId, areaId] of locations) {
      expect(questAssemblyStatus(staffSource)).toBe('unavailable');
      expect(assembleQuestItem(staffSource)).toBe('not-eligible');
      useMapStore.getState().setCurrentLocation(2, areaId);
      expect(questToolStatus(source(objectiveId))).toBe('ready');
      expect(recoverQuestTool(source(objectiveId))).toBe('ok');
      expect(recoverQuestTool(source(objectiveId))).toBe('already-owned');
      expect(validateQuestItemLedger(useInventoryStore.getState().questItems,
        useMapStore.getState().questProgress)).toEqual(useInventoryStore.getState().questItems);
    }
    expect(questAssemblyStatus(staffSource)).toBe('ready');
    expect(assembleQuestItem(staffSource)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({
      [source('obj-cube')]: { itemId: 'quest/horadric_cube', state: 'owned' },
      [source('obj-shaft')]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
      [source('obj-amulet')]: { itemId: 'quest/viper_amulet', state: 'consumed' },
      [staffSource]: { itemId: 'quest/horadric_staff', state: 'owned' }
    });
    expect(useMapStore.getState().questProgress[questId]).toMatchObject({ status: 'completed', rewardClaimed: false });
    expect(usePlayerStore.getState().player).toBe(player);
    expect(assembleQuestItem(staffSource)).toBe('already-owned');
  });

  it('never treats completed peer flags as actual inputs or permits unknown objective actions', () => {
    useMapStore.getState().updateQuestProgress(questId, {
      objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': false }
    });
    const definition = loadQuests().find(row => row.id === questId);
    if (!definition) throw new Error('Missing validated Staff quest');
    expect(eligibleQuestObjective(definition, 'obj-transmute')).toBe(true);
    expect(eligibleQuestObjective(definition, 'missing')).toBe(false);
    expect(questAssemblyStatus(source('obj-transmute'))).toBe('unavailable');
    expect(assembleQuestItem(source('obj-transmute'))).toBe('not-eligible');
    expect(useInventoryStore.getState().questItems).toEqual({});
  });
});

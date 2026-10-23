import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/persistence';
import { claimQuestReward, canClaim } from './claimReward';
import { executeQuestAction, questActionStatus } from './questActions';
import { recoverQuestTool, questToolStatus } from './interactObject';

const FORGE = 'quests/act4-hellforge', IZUAL = 'quests/act4-fallen-angel', DIABLO = 'quests/act4-terrors-end';
const HAMMER = `${FORGE}#objective:obj-kill-hephasto`, PROOF = `${FORGE}#action:hephasto-victory`;
const SHATTER = `${FORGE}#action:shatter-soulstone`;
const actions = { isActUnlocked: useMapStore.getState().isActUnlocked };
beforeEach(() => {
  useMapStore.getState().reset(); useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Act IV fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 4, currentSubAreaId: 'areas/act4-river-of-flame', isActUnlocked: () => true });
});
afterEach(() => { vi.restoreAllMocks(); useMapStore.setState(actions); });

describe('Act IV main contracts', () => {
  it('uses canonical identities and closed level-bound caches', () => {
    const quests = loadQuests();
    expect(quests.find(q => q.id === FORGE)?.rewards).toEqual({ xp: 7000, gemShards: 3,
      lootTable: { tableId: 'loot/hellforge-runes', ilvl: 56, picks: 1 } });
    expect(quests.find(q => q.id === DIABLO)?.rewards?.lootTable).toEqual({ tableId: 'loot/diablo-q', ilvl: 61, picks: 5 });
    const hammer = loadQuestItems().find(item => item.id === 'quest/hellforge_hammer');
    expect(hammer && questItemSource(hammer)).toBe(HAMMER);
  });
  it.each([IZUAL, DIABLO])('refuses historical completed flags without new qualified proof for %s', id => {
    const quest = loadQuests().find(q => q.id === id);
    if (!quest) throw new Error('Missing quest');
    useMapStore.setState({ questProgress: { [id]: { id, status: 'completed', rewardClaimed: false,
      objectives: Object.fromEntries(quest.objectives.map(o => [o.id, true])) } } });
    expect(canClaim(id)).toBe(false); expect(claimQuestReward(id)).toBe('not-completed');
  });
  it('requires qualified proof before explicit hammer recovery and real inputs before Shatter', () => {
    useMapStore.setState({ questProgress: { [FORGE]: { id: FORGE, status: 'inProgress',
      objectives: { 'obj-kill-hephasto': true, 'obj-shatter': false } } } });
    expect(questToolStatus(HAMMER)).toBe('unavailable'); expect(recoverQuestTool(HAMMER)).toBe('not-eligible');
    useMapStore.setState({ questReceipts: { [PROOF]: true } });
    expect(questToolStatus(HAMMER)).toBe('ready'); expect(recoverQuestTool(HAMMER)).toBe('ok');
    expect(questActionStatus(SHATTER)).toBe('unavailable'); expect(executeQuestAction(SHATTER)).toBe('not-eligible');
  });
});

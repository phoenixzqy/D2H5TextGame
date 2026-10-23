import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { questToolStatus, recoverQuestTool } from './interactObject';
import { giveQuestItem, questDeliveryStatus } from './questDelivery';
import { canClaim, claimQuestReward } from './claimReward';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { xpTotal } from '@/engine/progression/xp';

const questId = 'quests/act3-lam-esens-tome';
const source = `${questId}#objective:obj-find-tome`;
function reset(): void {
  useMapStore.getState().reset(); useInventoryStore.getState().reset();
  usePlayerStore.getState().reset(); useCombatStore.getState().reset();
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Delivery fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 3, currentSubAreaId: 'areas/act3-kurast-bazaar',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-find-tome': false, 'obj-deliver': false } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

function recoverTome(): void {
  useMapStore.getState().markCleared('areas/act3-kurast-bazaar');
  expect(recoverQuestTool(source)).toBe('ok');
}

function requirePlayer() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Delivery fixture requires a player');
  return player;
}

describe('actual Act III recovery and delivery', () => {
  it('binds the real Tome to its canonical source and requires an area clear before recovery', () => {
    const definition = loadQuestItems().find(item => questItemSource(item) === source);
    expect(definition?.id).toBe('quest/lam_esens_tome');
    expect(questToolStatus(source)).toBe('unavailable');
    expect(recoverQuestTool(source)).toBe('not-eligible');
    useMapStore.getState().markCleared('areas/act3-kurast-bazaar');
    const before = usePlayerStore.getState().player;
    expect(questToolStatus(source)).toBe('ready');
    expect(recoverQuestTool(source)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId: 'quest/lam_esens_tome', state: 'owned' } });
    expect(useMapStore.getState().questProgress[questId]).toMatchObject({ status: 'inProgress',
      objectives: { 'obj-find-tome': true, 'obj-deliver': false } });
    expect(usePlayerStore.getState().player).toBe(before);
    expect(recoverQuestTool(source)).toBe('already-owned');
  });

  it('never substitutes an NPC conversation for a real hand-in', () => {
    const quest = loadQuests().find(row => row.id === questId);
    expect(quest?.objectives.find(row => row.id === 'obj-deliver')?.type).toBe('give');
    useMapStore.getState().updateQuestProgress(questId, { objectives: { 'obj-find-tome': true, 'obj-deliver': false } });
    useMapStore.getState().recordNpcTalk('npc/alkor');
    expect(useMapStore.getState().questProgress[questId]?.objectives['obj-deliver']).toBe(false);
  });

  it('requires a real consumed hand-in before claiming a historically completed unclaimed row', () => {
    useMapStore.getState().updateQuestProgress(questId, { status: 'completed', rewardClaimed: false,
      objectives: { 'obj-find-tome': true, 'obj-deliver': true } });
    const before = usePlayerStore.getState().player;
    expect(canClaim(questId)).toBe(false);
    expect(claimQuestReward(questId)).toBe('not-completed');
    expect(usePlayerStore.getState().player).toBe(before);
    recoverTome();
    expect(giveQuestItem(source, 'npc/alkor')).toBe('ok');
    expect(canClaim(questId)).toBe(true);
  });

  it('gives one actual Tome, then claims exact XP and five unspent points separately and only once', () => {
    recoverTome();
    const player = requirePlayer();
    // High-level constructed fixture isolates the five-point wallet from level-up points.
    usePlayerStore.getState().setPlayer({ ...player, level: 50, experience: 0, experienceToNextLevel: 1_000_000 });
    const before = requirePlayer();
    expect(questDeliveryStatus(source, 'npc/alkor')).toBe('ready');
    expect(giveQuestItem(source, 'npc/ormus')).toBe('not-eligible');
    expect(giveQuestItem(source, 'npc/alkor')).toBe('ok');
    expect(usePlayerStore.getState().player).toBe(before);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId: 'quest/lam_esens_tome', state: 'consumed' });
    expect(useMapStore.getState().questProgress[questId]).toMatchObject({ status: 'completed', rewardClaimed: false });
    expect(giveQuestItem(source, 'npc/alkor')).toBe('already-consumed');
    expect(claimQuestReward(questId)).toBe('ok');
    const claimed = requirePlayer();
    expect((xpTotal(claimed.level) + claimed.experience) - (xpTotal(before.level) + before.experience)).toBe(6000);
    expect(claimed.statPoints - before.statPoints).toBe(5);
    expect(claimQuestReward(questId)).toBe('already-claimed');
    expect(usePlayerStore.getState().player).toBe(claimed);
  });

  it('refuses flags, lookalike sources, wrong act and missing clear without changing state', () => {
    useMapStore.getState().updateQuestProgress(questId, { objectives: { 'obj-find-tome': true, 'obj-deliver': false } });
    const before = useMapStore.getState().questProgress;
    expect(giveQuestItem(source, 'npc/alkor')).toBe('not-eligible');
    expect(useMapStore.getState().questProgress).toBe(before);
    useInventoryStore.setState({ questItems: { wrong: { itemId: 'quest/lam_esens_tome', state: 'owned' } } });
    expect(giveQuestItem(source, 'npc/alkor')).toBe('not-eligible');
    useInventoryStore.setState({ questItems: {} });
    recoverTome();
    useMapStore.setState({ currentAct: 2 });
    expect(giveQuestItem(source, 'npc/alkor')).toBe('not-eligible');
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
  });

  it('restores consumption and progress after publication mutates then throws, retaining unrelated state', () => {
    recoverTome();
    const items = useInventoryStore.getState().questItems;
    const progress = useMapStore.getState().questProgress[questId];
    const original = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      original(...args);
      useMapStore.getState().discoverArea('unrelated-observer-write');
      expect(giveQuestItem(source, 'npc/alkor')).toBe('claim-in-progress');
      throw new Error('after publication');
    });
    expect(giveQuestItem(source, 'npc/alkor')).toBe('grant-failed');
    expect(useInventoryStore.getState().questItems).toBe(items);
    expect(useMapStore.getState().questProgress[questId]).toBe(progress);
    expect(useMapStore.getState().discoveredAreas).toContain('unrelated-observer-write');
    expect(giveQuestItem(source, 'npc/alkor')).toBe('ok');
  });

  it('validates consumed sources and preserves explicit legacy repair without reopening Claim', () => {
    useMapStore.getState().updateQuestProgress(questId, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-find-tome': true, 'obj-deliver': true } });
    recoverTome();
    expect(giveQuestItem(source, 'npc/alkor')).toBe('ok');
    expect(useMapStore.getState().questProgress[questId]?.rewardClaimed).toBe(true);
    const ledger = useInventoryStore.getState().questItems;
    expect(validateQuestItemLedger(ledger, useMapStore.getState().questProgress)).toEqual(ledger);
    const malformed = { [questId]: { id: questId, status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-find-tome': true, 'obj-deliver': false } } };
    expect(() => validateQuestItemLedger(ledger, malformed)).toThrow(/hand-in/);
    expect(claimQuestReward(questId)).toBe('already-claimed');
  });
});

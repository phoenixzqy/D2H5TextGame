import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { loadTownNpcs } from '@/data/loaders/towns';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useCombatStore } from './combatStore';
import { useFormationStore } from './formationStore';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';

import { useHydrationStore } from './persistence';

let hydrationBefore = useHydrationStore.getState();
const QUEST = 'quests/act1-den-of-evil';
const AREA = 'areas/act1-den-of-evil';
function track(clear = false): void {
  useMapStore.getState().updateQuestProgress(QUEST, {
    status: 'inProgress', objectives: { 'obj-clear-den': clear, 'obj-return': false }
  });
}
function rewards() {
  return structuredClone({
    player: usePlayerStore.getState().player,
    inventory: {
      backpack: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies
    },
    mercs: useMercStore.getState().ownedMercs
  });
}
function reset(): void {
  abortSubAreaRun();
  useMapStore.getState().reset();
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
  useMercStore.getState().reset();
  useCombatStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(() => {
  hydrationBefore = useHydrationStore.getState();
  reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  reset(); vi.restoreAllMocks();
  useHydrationStore.setState({ status: hydrationBefore.status, error: hydrationBefore.error });
});

describe('ordered current-town quest talk events', () => {
  it('projects authored Act-I through Act-IV NPCs without fallback in missing acts', () => {
    expect(loadTownNpcs(1).map((npc) => npc.id)).toEqual([
      'npc/akara', 'npc/charsi', 'npc/gheed', 'npc/kashya', 'npc/warriv'
    ]);
    expect(loadTownNpcs(2)).toEqual([{ id: 'npc/atma', portraitId: 'atma', nameKey: 'town.npc.atma' }]);
    expect(loadTownNpcs(3).map((npc) => npc.id)).toEqual([
      'npc/alkor', 'npc/asheara', 'npc/cain', 'npc/hratli', 'npc/meshif', 'npc/ormus'
    ]);
    expect(loadTownNpcs(4).map((npc) => npc.id)).toEqual(['npc/cain', 'npc/halbu', 'npc/jamella', 'npc/tyrael']);
    for (const act of [0, 5, 6, NaN]) expect(loadTownNpcs(act)).toEqual([]);
  });
  it('cannot bank return credit before clearing and grants nothing until explicit claim', () => {
    const hero = createMockPlayer('Quest talk', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...hero, comboOrder: [] });
    // Imported wiring gear, not earned combat strength or a balance sample.
    // L1 attack floors 22.5 + 99978; defense includes the cap's own 7.
    const cap: Item = {
      id: 'talk-fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
      identified: true, equipped: false, affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
        ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
      ]) }]
    };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
    const equipped = usePlayerStore.getState().player;
    if (!equipped) throw new Error('Missing equipped fixture player');
    // Equip recomputation preserves resources, so restore this fixture's intended HP/MP.
    usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
      ...equipped.derivedStats, life: 1_000_000, mana: hero.derivedStats.mana
    } });
    track();
    const early = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(early);
    const run = startSubAreaRun({ subAreaId: AREA, act: 1, runSeed: 7, challengeOrdinal: 0 });
    if (!run) throw new Error('Missing Den run');
    for (let wave = 1; wave <= run.totalWaves; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      const eventCount = useCombatStore.getState().recordedEvents.length;
      for (let n = 0; n < eventCount; n++) useCombatStore.getState().advanceEvent();
      expect(advanceWaveOrFinish()).toBe(wave === run.totalWaves ? 'victory' : 'next-wave');
    }
    expect(useMapStore.getState().questProgress[QUEST]?.status).toBe('inProgress');
    const before = rewards();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState().questProgress[QUEST]).toEqual({
      id: QUEST, status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true }
    });
    expect(rewards()).toEqual(before);
    expect(canClaim(QUEST)).toBe(true);
    const completed = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(completed);
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing player');
    const cumulative = xpTotal(player.level) + player.experience;
    const expected = awardXp(cumulative, 500);
    expect(claimQuestReward(QUEST)).toBe('ok');
    const after = usePlayerStore.getState().player;
    if (!after) throw new Error('Missing player after claim');
    expect(xpTotal(after.level) + after.experience).toBe(cumulative + 500);
    expect(after.skillPoints).toBe(player.skillPoints + expected.skillPointsGranted + 1);
    expect(after.statPoints).toBe(player.statPoints + expected.statPointsGranted);
    expect(useInventoryStore.getState().currencies).toEqual(before.inventory.currencies);
    expect(useInventoryStore.getState().backpack).toEqual(before.inventory.backpack);
    const claimed = useMapStore.getState();
    const paid = rewards();
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(claimed);
    expect(rewards()).toEqual(paid);
  });

  it.each(['akara', 'npc/charsi', 'npc/missing', '', 'npc/AKARA'])('ignores wrong/noncanonical NPC %s', (npc) => {
    track(true);
    const before = useMapStore.getState();
    useMapStore.getState().recordNpcTalk(npc);
    expect(useMapStore.getState()).toBe(before);
  });

  it('ignores untracked progress and the same NPC in another act', () => {
    const empty = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(empty);
    track(true);
    useMapStore.getState().setCurrentLocation(2, 'areas/act2-rocky-waste');
    const before = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(before);
  });

  it.each(['locked', 'available', 'completed'] as const)('ignores %s quests without changing claim state', (status) => {
    track(true);
    useMapStore.getState().updateQuestProgress(QUEST, { status, rewardClaimed: false });
    const before = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(before);
  });

  it('does not revisit a claimed in-progress record', () => {
    track(true);
    useMapStore.getState().updateQuestProgress(QUEST, { rewardClaimed: true });
    const before = useMapStore.getState();
    useMapStore.getState().recordNpcTalk('npc/akara');
    expect(useMapStore.getState()).toBe(before);
  });

  it('publishes one atomic update, preserves unrelated flags and does not cascade talk stages', () => {
    const fixture: quests.QuestDef = {
      id: 'quests/test', name: 'test', description: 'test', type: 'main', actId: 'acts/act1',
      objectives: [
        { id: 'first', type: 'talk', npcId: 'npc/akara', description: 'test' },
        { id: 'second', type: 'talk', npcId: 'npc/akara', description: 'test' }
      ]
    };
    vi.spyOn(quests, 'loadQuests').mockReturnValue([fixture, { ...fixture, id: 'quests/wrong-act', actId: 'acts/act2' }]);
    useMapStore.getState().updateQuestProgress(fixture.id, {
      status: 'inProgress', objectives: { first: false, second: false, preserved: true }, rewardClaimed: false
    });
    useMapStore.getState().updateQuestProgress('quests/wrong-act', { status: 'inProgress', objectives: {} });
    const wrongAct = useMapStore.getState().questProgress['quests/wrong-act'];
    const publish = vi.fn();
    const unsubscribe = useMapStore.subscribe(publish);
    try {
      useMapStore.getState().recordNpcTalk('npc/akara');
      expect(publish).toHaveBeenCalledTimes(1);
      expect(useMapStore.getState().questProgress[fixture.id]).toEqual({
        id: fixture.id, status: 'inProgress', rewardClaimed: false,
        objectives: { first: true, second: false, preserved: true }
      });
      expect(useMapStore.getState().questProgress['quests/wrong-act']).toBe(wrongAct);
      useMapStore.getState().recordNpcTalk('npc/akara');
      expect(publish).toHaveBeenCalledTimes(2);
      expect(useMapStore.getState().questProgress[fixture.id]?.status).toBe('completed');
      const before = useMapStore.getState();
      useMapStore.getState().recordNpcTalk('npc/akara');
      expect(publish).toHaveBeenCalledTimes(2);
      expect(useMapStore.getState()).toBe(before);
    } finally { unsubscribe(); }
  });
});

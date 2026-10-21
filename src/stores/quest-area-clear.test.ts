import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';

const QUEST = 'quests/act1-den-of-evil';
const AREA = 'areas/act1-den-of-evil';
const stores = [
  useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore
] as const;

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}

function track(): void {
  useMapStore.getState().updateQuestProgress(QUEST, {
    status: 'inProgress', objectives: { 'obj-clear-den': false, 'obj-return': false }
  });
}

function start(attack = 100_000): number {
  const player = createMockPlayer('QuestWiring', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: [] });
  // Imported wiring gear, not an earned character or a balance sample. L1
  // attack floors 22.5 + this modifier; the cap adds 7 defense itself.
  const cap: Item = {
    id: 'clear-fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
      ['statMods.attack', attack - 22], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const equipped = usePlayerStore.getState().player;
  if (!equipped) throw new Error('Missing equipped fixture player');
  // Equipping preserves current HP/MP; only this fixture receives the intended refill.
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: player.derivedStats.mana
  } });
  const handle = startSubAreaRun({ subAreaId: AREA, act: 1, runSeed: 7, challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing Den run');
  expect(handle.runId).toBe(AREA);
  return handle.totalWaves;
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

function questProgress() {
  return useMapStore.getState().questProgress[QUEST];
}

function rewardSnapshot() {
  return structuredClone({
    player: usePlayerStore.getState().player,
    inventory: useInventoryStore.getState().backpack,
    currencies: useInventoryStore.getState().currencies,
    mercs: useMercStore.getState().ownedMercs
  });
}

beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});

afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});

describe('Den clear objective from qualified production runs', () => {
  it('uses the canonical playable Den area in the authored objective', () => {
    const quest = loadQuests().find((entry) => entry.id === QUEST);
    expect(quest?.objectives.find((objective) => objective.id === 'obj-clear-den')?.areaId).toBe(AREA);
  });

  it('advances only the clear objective once after the last real win, without completing or claiming', () => {
    track();
    const total = start();
    const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
    expect(total).toBeGreaterThan(1);
    for (let wave = 1; wave <= total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      expect(advanceWaveOrFinish()).toBe('idle');
      expect(questProgress()?.objectives['obj-clear-den']).toBe(false);
      expect(clear).not.toHaveBeenCalled();
      drain();
      expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(AREA);
    expect(questProgress()).toEqual({
      id: QUEST, status: 'inProgress',
      objectives: { 'obj-clear-den': true, 'obj-return': false }
    });
    expect(canClaim(QUEST)).toBe(false);
    const rewards = rewardSnapshot();
    expect(claimQuestReward(QUEST)).toBe('not-completed');
    expect(rewardSnapshot()).toEqual(rewards);
    const map = useMapStore.getState();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState()).toBe(map);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('a real surviving draw cannot emit a clear or advance the objective', () => {
    track();
    start(0);
    const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
    expect(useCombatStore.getState().outcome?.winner).toBeNull();
    expect(useCombatStore.getState().outcome?.finalPlayerTeam[0]?.life).toBeGreaterThan(0);
    drain();
    expect(advanceWaveOrFinish()).toBe('defeat');
    expect(clear).not.toHaveBeenCalled();
    expect(questProgress()?.objectives).toEqual({ 'obj-clear-den': false, 'obj-return': false });
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  });

  it('a real replay advances a newly tracked quest even when the area was already cleared', () => {
    useMapStore.getState().markCleared(AREA);
    expect(questProgress()).toBeUndefined();
    track();
    const total = start();
    for (let wave = 1; wave <= total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain();
      expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(questProgress()?.objectives['obj-clear-den']).toBe(true);
    expect(questProgress()?.status).toBe('inProgress');
    expect(useMapStore.getState().clearedSubAreas).toEqual([AREA]);
  });
});

describe('atomic clear-objective updates', () => {
  it('publishes area and matching objective together, preserves other flags, and grants nothing', () => {
    track();
    useMapStore.getState().updateQuestProgress(QUEST, { rewardClaimed: false });
    useMapStore.getState().updateQuestProgress('unrelated', {
      status: 'inProgress', objectives: { other: false }, rewardClaimed: true
    });
    const unrelated = useMapStore.getState().questProgress.unrelated;
    const rewards = rewardSnapshot();
    const updates: unknown[] = [];
    const unsubscribe = useMapStore.subscribe((state) => updates.push({
      areas: state.clearedSubAreas, progress: state.questProgress[QUEST]
    }));
    try {
      useMapStore.getState().markCleared(AREA);
      expect(updates).toEqual([{
        areas: [AREA], progress: {
          id: QUEST, status: 'inProgress', rewardClaimed: false,
          objectives: { 'obj-clear-den': true, 'obj-return': false }
        }
      }]);
      expect(useMapStore.getState().questProgress.unrelated).toBe(unrelated);
      expect(rewardSnapshot()).toEqual(rewards);
      const map = useMapStore.getState();
      useMapStore.getState().markCleared(AREA);
      expect(useMapStore.getState()).toBe(map);
      expect(updates).toHaveLength(1);
    } finally {
      unsubscribe();
    }
  });

  it.each(['locked', 'available', 'completed'] as const)('does not advance a %s quest or reset its claim flag', (status) => {
    useMapStore.getState().updateQuestProgress(QUEST, {
      status, objectives: { 'obj-clear-den': false, 'obj-return': false }, rewardClaimed: true
    });
    const before = questProgress();
    useMapStore.getState().markCleared(AREA);
    expect(questProgress()).toBe(before);
  });

  it('does not match a different area or manufacture untracked quest progress', () => {
    useMapStore.getState().markCleared(AREA);
    expect(useMapStore.getState().questProgress).toEqual({});
    track();
    const before = questProgress();
    useMapStore.getState().markCleared('areas/act1-blood-moor');
    expect(questProgress()).toBe(before);
  });

  it('completes only when every authored objective is true, while preserving claim state and rewards', () => {
    track();
    // Controlled state for the completion predicate; this does not prove NPC talk wiring.
    useMapStore.getState().updateQuestProgress(QUEST, {
      objectives: { 'obj-return': true, preserved: true }, rewardClaimed: false
    });
    const before = rewardSnapshot();
    useMapStore.getState().markCleared(AREA);
    expect(questProgress()).toEqual({
      id: QUEST, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-return': true, preserved: true, 'obj-clear-den': true }
    });
    expect(rewardSnapshot()).toEqual(before);
  });
});

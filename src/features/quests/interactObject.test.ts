import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import * as persistence from '@/stores/persistence';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save';
import { CURRENT_SAVE_VERSION } from '@/engine/types/save';
import { claimQuestReward } from './claimReward';
import { interactWithAreaObject, travelToAreaObjects } from './interactObject';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing interaction fixture');
  return value;
}

const questId = 'quests/act2-arcane-sanctuary';
const areaId = 'areas/act2-arcane-sanctuary';
const targetId = 'objects/horazon_journal';
const hydrationBefore = persistence.useHydrationStore.getState();
function reset() {
  abortSubAreaRun();
  useMapStore.getState().reset(); usePlayerStore.getState().reset();
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useCombatStore.getState().reset();
}
function data() {
  return [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore].map(store =>
    Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function')));
}
beforeEach(() => {
  reset(); persistence.useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Journal diagnostic', 'sorceress'));
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'], currentAct: 2, currentSubAreaId: areaId });
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress',
    objectives: { 'obj-find-summoner': true, 'obj-read-journal': false } });
});
afterEach(() => {
  reset(); vi.restoreAllMocks();
  persistence.useHydrationStore.setState(hydrationBefore);
});

describe('explicit area-object actions', () => {
  it('travels without combat or reading, then reads once and grants only on explicit Claim', () => {
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    const flags = useMapStore.getState().questProgress;
    const combat = useCombatStore.getState();
    expect(travelToAreaObjects(2, areaId)).toBe('ok');
    expect(useMapStore.getState().currentSubAreaId).toBe(areaId);
    expect(useMapStore.getState().questProgress).toBe(flags);
    expect(useCombatStore.getState()).toBe(combat);
    const player = required(usePlayerStore.getState().player);
    const inventory = useInventoryStore.getState();
    expect(interactWithAreaObject(targetId)).toBe('ok');
    expect(useMapStore.getState().questProgress[questId]?.status).toBe('completed');
    expect(usePlayerStore.getState().player).toBe(player);
    expect(useInventoryStore.getState()).toBe(inventory);
    const read = data();
    expect(interactWithAreaObject(targetId)).toBe('already-read');
    expect(data()).toEqual(read);
    const total = xpTotal(player.level) + player.experience;
    const growth = awardXp(total, 7000);
    expect(claimQuestReward(questId)).toBe('ok');
    const after = required(usePlayerStore.getState().player);
    expect(xpTotal(after.level) + after.experience).toBe(total + 7000);
    expect(after.skillPoints).toBe(player.skillPoints + growth.skillPointsGranted + 1);
    const paid = data();
    expect(claimQuestReward(questId)).toBe('already-claimed');
    expect(interactWithAreaObject(targetId)).toBe('already-read');
    expect(data()).toEqual(paid);
    expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
  });

  it('round-trips kill-only/read/claimed objective receipts under the current save version', () => {
    for (const stage of ['kill', 'read', 'claimed']) {
      if (stage === 'read') expect(interactWithAreaObject(targetId)).toBe('ok');
      if (stage === 'claimed') expect(claimQuestReward(questId)).toBe('ok');
      const saved = required(persistence.snapshotStores());
      expect(saved.version).toBe(CURRENT_SAVE_VERSION);
      expect(decodeSave(toJsonSafe(saved))).toEqual(saved);
    }
  });

  it.each(['idle', 'loading', 'error'] as const)('refuses %s hydration without changes', status => {
    persistence.useHydrationStore.getState().setStatus(status);
    const before = data();
    expect(interactWithAreaObject(targetId)).toBe('not-ready');
    expect(travelToAreaObjects(2, areaId)).toBe('not-ready');
    expect(data()).toEqual(before);
  });

  it('refuses save replacement, absent hero and locked acts without changes', () => {
    const replacing = vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    let before = data();
    expect(interactWithAreaObject(targetId)).toBe('not-ready');
    expect(data()).toEqual(before);
    replacing.mockRestore();
    usePlayerStore.getState().reset(); before = data();
    expect(travelToAreaObjects(2, areaId)).toBe('no-player');
    expect(interactWithAreaObject(targetId)).toBe('no-player');
    expect(data()).toEqual(before);
    usePlayerStore.getState().setPlayer(createMockPlayer('Diagnostic', 'sorceress'));
    useMapStore.setState({ clearedSubAreas: [] }); before = data();
    expect(travelToAreaObjects(2, areaId)).toBe('locked-area');
    expect(interactWithAreaObject(targetId)).toBe('locked-area');
    expect(data()).toEqual(before);
  });

  it('refuses early/untracked/wrong-target/location events and never banks progress', () => {
    useMapStore.getState().updateQuestProgress(questId, { objectives: {} });
    let before = data();
    expect(interactWithAreaObject(targetId)).toBe('not-eligible');
    expect(data()).toEqual(before);
    useMapStore.getState().updateQuestProgress(questId, { objectives: { 'obj-find-summoner': true } });
    expect(interactWithAreaObject('objects/other')).toBe('not-eligible');
    useMapStore.getState().setCurrentLocation(1, areaId); before = data();
    expect(interactWithAreaObject(targetId)).toBe('unknown-area');
    expect(data()).toEqual(before);
    expect(travelToAreaObjects(1, areaId)).toBe('unknown-area');
    expect(travelToAreaObjects(2, 'areas/missing')).toBe('unknown-area');
  });

  it('accepts the known saved combat alias without needing a transient kill receipt', () => {
    useMapStore.getState().setCurrentLocation(2, 'a2-arcane-sanctuary');
    expect(interactWithAreaObject(targetId)).toBe('ok');
  });

  it('refuses an active run even while its playback is no longer inCombat', () => {
    const run = startSubAreaRun({ subAreaId: areaId, act: 2, runSeed: 7, challengeOrdinal: 0 });
    expect(run).toBeTruthy();
    useCombatStore.setState({ inCombat: false });
    const before = data();
    expect(interactWithAreaObject(targetId)).toBe('combat-active');
    expect(travelToAreaObjects(2, areaId)).toBe('combat-active');
    expect(data()).toEqual(before);
  });

  it('refuses wave and restore ownership before any action mutation', () => {
    const wave = beginWaveTransition(true);
    try {
      const before = data();
      expect(() => interactWithAreaObject(targetId)).toThrow('waveBusy');
      expect(() => travelToAreaObjects(2, areaId)).toThrow('waveBusy');
      expect(data()).toEqual(before);
    } finally { endWaveTransition(wave); }
    const restore = reserveWaveRestore();
    try {
      const before = data();
      expect(() => interactWithAreaObject(targetId)).toThrow('restorePending');
      expect(() => travelToAreaObjects(2, areaId)).toThrow('restorePending');
      expect(data()).toEqual(before);
    } finally { releaseWaveRestore(restore); }
  });
});

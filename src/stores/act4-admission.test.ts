/** Constructed battle fixtures verify receipt authority, not earned campaign pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuests } from '@/data/loaders/quests';
import { ACT4_ENCOUNTERS } from '@/engine/map/act4-admission';
import { interactWithAreaObject } from '@/features/quests/interactObject';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing fixture'); return value; }
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore]) store.getState().reset();
}
function drain(): void { useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); }); }
function reachFinal(areaId: string): void {
  const total = required(startSubAreaRun({ subAreaId: areaId, act: 4, runSeed: 7, challengeOrdinal: 0 })).totalWaves;
  for (let wave = 1; wave < total; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
}
function finish(): void { drain(); expect(advanceWaveOrFinish()).toBe('victory'); }
function track(id: string): void {
  const quest = required(loadQuests().find(row => row.id === id));
  useMapStore.getState().updateQuestProgress(id, { status: 'inProgress', rewardClaimed: false,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
}
function seals(): void {
  useMapStore.getState().setCurrentLocation(4, 'areas/act4-chaos-sanctuary');
  expect(interactWithAreaObject('objects/diablo_seal_2')).toBe('not-eligible');
  for (const number of [1, 2, 3]) expect(interactWithAreaObject(`objects/diablo_seal_${String(number)}`)).toBe('ok');
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Act IV constructed fixture', 'sorceress'), comboOrder: [] });
  const gear = { id: 'fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 4, clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate'] });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe.each(ACT4_ENCOUNTERS)('Act IV accepted settlement $questId', contract => {
  it('requires final accepted playback; retains proof through duplicate refusal', () => {
    track(contract.questId); if (contract.prerequisites.length) seals();
    reachFinal(contract.areaId); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
    finish(); const map = useMapStore.getState();
    expect(map.questProgress[contract.questId]?.objectives[contract.objectiveId]).toBe(true);
    expect(map.questReceipts[contract.proof]).toBe(true);
    expect(map.questProgress[contract.questId]?.rewardClaimed).toBe(false);
    expect(map.questProgress[contract.questId]?.status).toBe(contract.questId === 'quests/act4-hellforge' ? 'inProgress' : 'completed');
    expect(advanceWaveOrFinish()).toBe('idle'); expect(useMapStore.getState().questReceipts).toBe(map.questReceipts);
  });
  it('does not bank early kills or trust generic source metadata; requires a new victory', () => {
    reachFinal(contract.areaId); finish(); expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
    if (contract.prerequisites.length) expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
    useCombatStore.getState().endCombat(); track(contract.questId); if (contract.prerequisites.length) seals();
    const before = useMapStore.getState().questProgress[contract.questId];
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act4', areaId: contract.areaId,
      archetypeIds: [...contract.members], source: contract.source });
    useMapStore.getState().recordBossKill({ actId: 'acts/act4', areaId: contract.areaId,
      bossArchetypeId: required(contract.members[0]), source: contract.source });
    expect(useMapStore.getState().questProgress[contract.questId]).toBe(before);
    expect(advanceWaveOrFinish()).toBe('idle');
    reachFinal(contract.areaId); finish(); expect(useMapStore.getState().questReceipts[contract.proof]).toBe(true);
  });
  it.each([true, false])('preserves original bound source present=%s through replay', present => {
    track(contract.questId); if (contract.prerequisites.length) seals();
    const total = required(startSubAreaRun({ subAreaId: contract.areaId, act: 4, runSeed: 7, challengeOrdinal: 0 })).totalWaves;
    const final = required(required(combatRunLifecycle.activeRun).plan.waves[total - 1]), source = final.source;
    if (!present) Object.assign(final, { source: undefined });
    for (let wave = 1; wave < total; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
    Object.assign(final, { source: present ? undefined : source });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    finish(); expect(useMapStore.getState().questReceipts[contract.proof]).toBe(present ? true : undefined);
  });
  it('does not accept a stale pre-replay outcome', () => {
    track(contract.questId); if (contract.prerequisites.length) seals(); reachFinal(contract.areaId);
    const before = useCombatStore.getState(); refreshActivePlayerCombatConfig({ replayCurrentWave: true }); drain();
    useCombatStore.setState({ outcome: before.outcome, recordedEvents: before.recordedEvents });
    expect(advanceWaveOrFinish).toThrow(); expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
  });
});

it('keeps early tracked Diablo clear/unlock independent from the serial seals and requires another victory', () => {
  const contract = required(ACT4_ENCOUNTERS[2]); track(contract.questId); reachFinal(contract.areaId); finish();
  expect(useMapStore.getState().clearedSubAreas).toContain(contract.areaId); expect(useMapStore.getState().isActUnlocked(5)).toBe(true);
  expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined(); useCombatStore.getState().endCombat();
  seals(); expect(useMapStore.getState().questProgress[contract.questId]?.objectives[contract.objectiveId]).toBe(false);
  reachFinal(contract.areaId); finish(); expect(useMapStore.getState().questReceipts[contract.proof]).toBe(true);
});

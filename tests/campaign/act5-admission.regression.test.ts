/** Native admission/plan inspection with constructed access; no played or earned combat. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import * as combatEngine from '@/engine/combat';
import * as replay from '@/engine/map/replay-profile';
import { ACT5_RUNTIME, EVE_QUEST } from '@/engine/map/act5-admission';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import * as playback from '../sim/production/earned-playback';
import { startCampaignQuest } from './actions';
import { startCampaignAdmission } from './admission';

const throne = 'areas/act5-throne-of-destruction';
const prefixClears = ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
  'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'];
let restores: (() => void)[];

beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('A5 native plan', 'sorceress').ok).toBe(true);
});

afterEach(() => {
  abortSubAreaRun(); useCombatStore.getState().endCombat();
  vi.restoreAllMocks(); for (const restore of restores) restore();
});

it('automatically admits the exact eight native Throne waves with immutable Normal binding', () => {
  useMapStore.setState({ clearedSubAreas: prefixClears });
  startCampaignQuest(EVE_QUEST, () => undefined);
  const native = vi.spyOn(playback, 'startEarnedRun');
  const planner = vi.spyOn(combatEngine, 'resolveChallengeWavePlan');
  const bind = vi.spyOn(replay, 'applyReplayProfileToPlan');
  const { handle, location } = startCampaignAdmission(5, throne);
  expect(location).toBe('a5-throne-of-destruction');
  expect(native).toHaveBeenCalledTimes(1);
  expect(native).toHaveBeenCalledWith({ act: 5, subAreaId: location, mode: 'manual' });
  expect(Object.keys(native.mock.calls[0]?.[0] ?? {}).sort()).toEqual(['act', 'mode', 'subAreaId']);
  expect(planner).toHaveBeenCalledTimes(1);
  expect(planner.mock.calls[0]?.[0]).toMatchObject({ subArea: { id: throne },
    questSourceProjection: 'act5-throne', mode: 'manual', challengeOrdinal: 0 });
  expect(bind).toHaveBeenCalledTimes(1); expect(bind.mock.calls[0]?.[1]).toBe('normal');
  const result = bind.mock.results[0]; assert.ok(result?.type === 'return');
  const plan = result.value;
  expect(plan).toMatchObject({ subAreaId: throne, questSourceProjection: 'act5-throne',
    replayProfileId: 'normal', mode: 'manual' });
  expect(Object.getOwnPropertyDescriptor(plan, 'replayProfileId')).toEqual({ value: 'normal',
    enumerable: true, writable: false, configurable: false });
  expect(handle.totalWaves).toBe(8); expect(plan.waves).toHaveLength(8);
  expect(ACT5_RUNTIME.throneWaves).toHaveLength(7);
  for (const [index, manifest] of ACT5_RUNTIME.throneWaves.entries()) {
    const wave = plan.waves[index]; assert.ok(wave);
    expect(wave.id).toBe(manifest.waveId); expect(wave.waveTier).toBe('elite');
    expect(wave.source).toEqual({ kind: 'wave', waveId: manifest.waveId, encounterIds: manifest.encounterIds });
    expect(wave.spawns.map(member => ({ archetypeId: member.archetypeId,
      tier: member.tier, encounterId: member.encounterId }))).toEqual(manifest.members);
    expect(wave.spawns.every(member => member.chapterBoss === undefined)).toBe(true);
  }
  const finale = plan.waves[7]; assert.ok(finale);
  expect(finale.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act5.baal' });
  expect(finale).toMatchObject({ waveTier: 'boss', lootTable: 'loot/act5-boss',
    presentation: { isActBoss: true } });
  expect(finale.spawns).toHaveLength(1);
  expect(finale.spawns[0]).toMatchObject({ archetypeId: 'monsters/act5.baal', tier: 'chapter-boss',
    chapterBoss: { archetypeId: 'monsters/act5.baal' } });
  expect(finale.spawns[0]?.encounterId).toBeUndefined();
  expect(plan.waves.filter(wave => wave.source?.kind === 'chapterBoss')).toHaveLength(1);
  expect(plan.waves.some(wave => wave.source?.kind === 'bossEncounter' || wave.id === 'w8')).toBe(false);
  expect(handle.challengeOrdinal).toBe(0); expect(hasActiveSubAreaRun()).toBe(true);
  expect(useMapStore.getState()).toMatchObject({ currentAct: 5, currentSubAreaId: location,
    selectedDifficulty: 'normal', questReceipts: {} });
  expect(Object.keys(useMapStore.getState().questProgress)).toEqual([EVE_QUEST]);
});

it('does not project or start Eve from Act V access alone', () => {
  useMapStore.setState({ clearedSubAreas: prefixClears });
  const planner = vi.spyOn(combatEngine, 'resolveChallengeWavePlan');
  const bind = vi.spyOn(replay, 'applyReplayProfileToPlan');
  startCampaignAdmission(5, throne);
  expect(planner.mock.calls[0]?.[0].questSourceProjection).toBeUndefined();
  const result = bind.mock.results[0]; assert.ok(result?.type === 'return');
  expect(result.value.questSourceProjection).toBeUndefined();
  expect(useMapStore.getState().questProgress).toEqual({}); expect(useMapStore.getState().questReceipts).toEqual({});
});

it.each([[5, throne, false], [4, throne, true], [5, 'areas/act4-chaos-sanctuary', true],
  [5, 'areas/act5-unknown', true]] as const)(
  'refuses locked/mismatched Act V admission %s / %s before native writes', (act, area, unlocked) => {
  if (unlocked) useMapStore.setState({ clearedSubAreas: prefixClears });
  const before = observeEarnedState(), native = vi.spyOn(playback, 'startEarnedRun');
  expect(() => startCampaignAdmission(act, area)).toThrow(unlocked ? 'mismatch' : 'locked');
  expect(native).not.toHaveBeenCalled(); expect(observeEarnedState()).toEqual(before);
  expect(hasActiveSubAreaRun()).toBe(false);
});

it('retains the original native ordinal stream when the next admission is the eight-wave suffix', () => {
  const first = startCampaignAdmission(1, 'areas/act1-blood-moor'); expect(first.handle.challengeOrdinal).toBe(0);
  // Only test-owned active combat is abandoned; these are constructed access/admission observations.
  abortSubAreaRun(); useCombatStore.getState().endCombat();
  useMapStore.setState({ clearedSubAreas: prefixClears }); startCampaignQuest(EVE_QUEST, () => undefined);
  const planner = vi.spyOn(combatEngine, 'resolveChallengeWavePlan');
  const second = startCampaignAdmission(5, throne);
  expect(second.handle.challengeOrdinal).toBe(1); expect(second.handle.totalWaves).toBe(8);
  expect(planner.mock.calls[0]?.[0].challengeOrdinal).toBe(1);
  expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 2, nightmare: 0, hell: 0 });
});

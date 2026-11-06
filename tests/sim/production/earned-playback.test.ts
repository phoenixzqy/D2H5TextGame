import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import * as receipts from '@/stores/recordedWaveReceipt';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState, observeStore } from './earned-state';
import { playEarnedWave, startEarnedRun } from './earned-playback';
import { observeP15Wave } from '../contracts/p15-wave-observation';
import { decodeObservation, encodeObservation } from '../contracts/observation-codec';

// Constructed Act IV input only. No protected saves or campaign acceptance runs.
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  resetEarnedStores(); resetRegistry(); loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun(); resetRegistry(); loadDefaultSkills();
  for (const restore of restores) restore();
});

function arrange() {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Diagnostic recovery', 'barbarian'), level: 50,
    comboOrder: ['skills-barbarian-find-potion'], skillLevels: { 'skills-barbarian-find-potion': 20 } });
  const cap = { id: 'diagnostic-input-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 10000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  return startEarnedRun({ act: 4, subAreaId: 'areas/act4-outer-steppes', runSeed: 19, challengeOrdinal: 0 });
}

it('captures exact native input for two successive waves with real Find Potion recovery', () => {
  const handle = arrange();
  expect(handle.totalWaves).toBeGreaterThan(2);
  for (let index = 0; index < 2; index++) {
    const binding = receipts.inspectRecordedWaves().currentPublished?.binding;
    if (!binding) throw new Error('Missing native fixture binding');
    const expected = structuredClone(binding.engineInput);
    expect(expected.findPotion).toEqual([{ sourceHeroId: expected.playerTeam[0]?.id, rank: 20 }]);
    const wave = playEarnedWave(handle, index);
    expect(wave).toHaveProperty('engineInput', expected);
    expect(Reflect.get(wave, 'engineInput')).not.toBe(binding.engineInput);
    expect(wave.opening.recordedEvents.some(event =>
      event.kind === 'action' && event.skillId === 'barbarian.find_potion')).toBe(true);
    expect(wave.advanceResult).toBe('next-wave');
    const observed = observeP15Wave(wave);
    expect(observed).toHaveProperty('engineInput', expected);
    expect(decodeObservation(JSON.parse(JSON.stringify(encodeObservation(observed))) as unknown))
      .toStrictEqual(observed);
  }
});

it.each(['missing', 'pending', 'events', 'outcome', 'wave', 'area'] as const)(
  'refuses %s binding before playback or awards', mismatch => {
    const handle = arrange();
    const holder = receipts.inspectRecordedWaves();
    if (!holder.currentPublished) throw new Error('Missing native fixture receipt');
    let index = 0;
    if (mismatch === 'missing') receipts.abandonRecordedWaves();
    if (mismatch === 'pending') vi.spyOn(receipts, 'inspectRecordedWaves')
      .mockReturnValue({ ...holder, pending: holder.currentPublished });
    if (mismatch === 'events') useCombatStore.setState({ recordedEvents: [...useCombatStore.getState().recordedEvents] });
    if (mismatch === 'outcome') useCombatStore.setState({ outcome: structuredClone(useCombatStore.getState().outcome) });
    if (mismatch === 'wave') { index = 1; useCombatStore.setState({ currentWave: 2 }); }
    if (mismatch === 'area') { handle.runId = 'mismatched-area'; useCombatStore.setState({ subAreaRunId: handle.runId }); }
    const combat = observeStore(useCombatStore), earned = observeEarnedState();
    expect(() => playEarnedWave(handle, index)).toThrow('Invalid earned wave binding');
    expect(observeStore(useCombatStore)).toStrictEqual(combat);
    expect(observeEarnedState()).toStrictEqual(earned);
  });

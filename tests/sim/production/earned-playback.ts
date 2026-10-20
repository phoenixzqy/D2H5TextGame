import type { KillRewards } from '@/engine/loot/award';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun,
  startSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { earnedDelta, observeEarnedState, observeStore } from './earned-state';

export type EarnedRunHandle = NonNullable<ReturnType<typeof startSubAreaRun>>;

/** Start with the native caller options; acquisition deliberately omits runSeed. */
export function startEarnedRun(options: Parameters<typeof startSubAreaRun>[0]): EarnedRunHandle {
  const handle = startSubAreaRun(options);
  if (!handle || !Number.isInteger(handle.totalWaves) || handle.totalWaves < 1 ||
    !hasActiveSubAreaRun()) throw new Error('Production did not start a bounded earned run');
  return structuredClone(handle);
}

function rewardDelta(before: KillRewards, after: KillRewards): KillRewards {
  if (after.items.length < before.items.length) throw new Error('Production reward list shrank during award');
  return structuredClone({
    items: after.items.slice(before.items.length),
    runeShards: after.runeShards - before.runeShards,
    runes: after.runes - before.runes, gems: after.gems - before.gems,
    wishstones: after.wishstones - before.wishstones
  });
}

/** Drain exactly the installed native recording, then settle it once. No carry writes. */
export function playEarnedWave(handle: EarnedRunHandle, index: number) {
  const opening = observeStore(useCombatStore);
  if (!hasActiveSubAreaRun() || !opening.inCombat || opening.isPaused ||
    opening.currentWave !== index + 1 || opening.totalWaves !== handle.totalWaves ||
    opening.subAreaRunId !== handle.runId || opening.eventCursor !== 0 ||
    opening.playbackComplete || !opening.outcome) throw new Error('Invalid earned wave opening');
  const end = opening.recordedEvents.at(-1);
  if (!end || end.kind !== 'end' || !Number.isFinite(end.simClockMs) || end.simClockMs < 0)
    throw new Error('Missing actual terminal end event');
  for (let step = 0; step < opening.recordedEvents.length; step++) {
    const cursor = useCombatStore.getState().eventCursor;
    useCombatStore.getState().advanceEvent();
    if (useCombatStore.getState().eventCursor !== cursor + 1)
      throw new Error('Earned playback cursor did not progress one event');
  }
  const played = observeStore(useCombatStore);
  if (!played.playbackComplete || played.eventCursor !== opening.recordedEvents.length)
    throw new Error('Earned playback failed to complete');
  const beforeAward = observeEarnedState();
  const advanceResult = advanceWaveOrFinish(); // Sole settlement call for this attempted wave.
  const afterAward = observeEarnedState();
  const afterAdvance = observeStore(useCombatStore);
  if (advanceResult === 'next-wave') {
    if (index + 1 >= handle.totalWaves || !hasActiveSubAreaRun() ||
      afterAdvance.currentWave !== index + 2 || afterAdvance.eventCursor !== 0 ||
      afterAdvance.playbackComplete) throw new Error('Invalid earned next-wave progression');
  } else if ((advanceResult !== 'victory' && advanceResult !== 'defeat') || hasActiveSubAreaRun()) {
    throw new Error('Production earned run did not terminate or advance');
  }
  return {
    index, opening, played, beforeAward, afterAward, afterAdvance, advanceResult,
    terminalSimClockMs: end.simClockMs,
    rawRewardDelta: rewardDelta(played.runRewards, afterAdvance.runRewards),
    actualDelta: earnedDelta(beforeAward, afterAward)
  };
}
export type EarnedWave = ReturnType<typeof playEarnedWave>;

/** Preserve the already computed next wave, then use the UI's native flee sequence. */
export function abandonEarnedNextWave() {
  const opening = observeStore(useCombatStore);
  if (!hasActiveSubAreaRun() || opening.currentWave !== 2 ||
    opening.eventCursor !== 0 || opening.playbackComplete || !opening.outcome)
    throw new Error('Cannot abandon an uninstalled earned preparation W2');
  const beforeFlee = observeEarnedState();
  abortSubAreaRun();
  useMetaStore.getState().setIdleTarget(undefined);
  setIdleEliteMisses(0);
  useCombatStore.getState().endCombat();
  return {
    opening, beforeFlee, afterFlee: observeEarnedState(), afterFleeCombat: observeStore(useCombatStore),
    activeAfterFlee: hasActiveSubAreaRun(), pityAfterFlee: getIdleEliteMisses()
  };
}

/** Attempt ordinary target waves only until the first native terminal result. */
export function playEarnedTarget(handle: EarnedRunHandle) {
  const waves: EarnedWave[] = [];
  for (let index = 0; index < handle.totalWaves; index++) {
    const wave = playEarnedWave(handle, index);
    waves.push(wave);
    if (wave.advanceResult !== 'next-wave') break;
  }
  const last = waves.at(-1);
  if (!last || (last.advanceResult !== 'victory' && last.advanceResult !== 'defeat'))
    throw new Error('Earned target exhausted waves without terminal result');
  return {
    handle, waves, terminalAdvance: last.advanceResult,
    carryCoverage: waves.some(wave => wave.advanceResult === 'next-wave')
      ? 'exercised' as const : 'unexercised' as const,
    rawRunRewards: observeStore(useCombatStore).runRewards
  };
}

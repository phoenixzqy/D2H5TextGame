import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { subAreas } from '@/data/index';
import { decodeSave } from '@/engine/save/validate';
import { snapshotStores } from '@/stores/persistence';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { isP15CompleteVictory, observeP15Wave } from '../contracts/p15-wave-observation';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, restoreEarnedSave } from './earned-state';
import { playEarnedWave, startEarnedRun, type EarnedRunHandle, type EarnedWave } from './earned-playback';
import { parseCheckpointFixture } from './checkpoint-fixture';

const classes = Object.values(import.meta.glob<{ id: string }>('../../../src/data/classes/*.json', {
  eager: true, import: 'default'
}));

function observeCheckpointWave(handle: EarnedRunHandle, native: EarnedWave) {
  const observed = observeP15Wave(native);
  const waveSeed = (handle.runSeed ^ ((native.index + 1) * 0x9e3779b1)) >>> 0;
  assert.equal(native.engineInput.seed, waveSeed, 'Native checkpoint battle seed drift');
  return structuredClone({
    ...observed,
    streams: {
      planSeed: handle.runSeed,
      enemyGenerationSeed: waveSeed,
      battleSeed: native.engineInput.seed,
      rewardSeed: (handle.runSeed ^ 0x9e3779b1 ^ native.index) >>> 0,
      findItemRewardSeed: (handle.runSeed ^ 0x46494e44 ^ native.index) >>> 0
    },
    enemyContexts: native.opening.enemyTeam.map(enemy => ({
      id: enemy.id, level: enemy.level, tier: enemy.tier
    }))
  });
}
export type CheckpointWave = ReturnType<typeof observeCheckpointWave>;

/**
 * One full native area attempt from authenticated saved state in a dedicated,
 * quiescent service realm. No training, respec, gear or resource override occurs.
 * This is a diagnostic sample, never a campaign successor or balance signoff.
 * Stores, clock, selection and pity are restored even if the consumer throws;
 * process-global item/run IDs retain their production monotonic allocation.
 */
export function runCheckpointAttempt(
  fixtureInput: unknown,
  sourceJsonBytes: Uint8Array,
  onWave?: (wave: CheckpointWave) => void
) {
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat)
    throw new Error('Checkpoint attempt requires a quiescent caller');
  const fixture = parseCheckpointFixture(fixtureInput, { classes, areas: subAreas });
  assert.equal(createHash('sha256').update(sourceJsonBytes).digest('hex'),
    fixture.checkpoint.sha256, 'Checkpoint source SHA256 mismatch');
  const source = decodeSave(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceJsonBytes)) as unknown);
  assert.equal(source.player.class, fixture.build.classId, 'Checkpoint class mismatch');
  assert.equal(source.player.level, fixture.build.level, 'Checkpoint level mismatch');
  assert.equal(source.map.selectedDifficulty, fixture.scenario.difficulty, 'Checkpoint selected difficulty mismatch');
  assert.ok(fixture.clockEpochMs >= source.timestamp, 'Checkpoint clock precedes saved state');
  const areaId = fixture.scenario.subAreaId; // Parser requires an exact canonical area.
  if (fixture.scenario.mode === 'idle') {
    const clears = fixture.scenario.difficulty === 'normal' ? source.map.clearedSubAreas
      : fixture.scenario.difficulty === 'nightmare' ? source.map.nightmareClearedSubAreas
        : source.map.hellClearedSubAreas;
    const legacyAlias = areaId.replace(/^areas\/act([1-5])-/, 'a$1-');
    assert.ok(clears.includes(areaId) || clears.includes(legacyAlias), 'Checkpoint idle area is not cleared');
  }

  const restorers = captureEarnedRestorers();
  const selection = useIronGolemSelectionStore.getState();
  const now = Date.now, pity = getIdleEliteMisses();
  const started = performance.now();
  let failed = false, originalFailure: unknown;
  const cleanupErrors: unknown[] = [];
  let result: ReturnType<typeof attempt> | undefined;

  function attempt() {
    Date.now = () => fixture.clockEpochMs;
    useIronGolemSelectionStore.setState({ selection: null });
    restoreEarnedSave(source, fixture.clockEpochMs);
    setIdleEliteMisses(fixture.scenario.idleEliteMisses);
    const startingSave = snapshotStores();
    assert.ok(startingSave);
    assert.deepEqual(startingSave, { ...source, timestamp: fixture.clockEpochMs },
      'Checkpoint hydration changed saved domains');
    const map = useMapStore.getState();
    assert.ok(map.isActUnlocked(fixture.scenario.act), 'Checkpoint act is locked');
    map.setCurrentLocation(fixture.scenario.act, areaId);
    const before = observeEarnedState();
    const handle = startEarnedRun({
      act: fixture.scenario.act, subAreaId: areaId, mode: fixture.scenario.mode,
      runSeed: fixture.sample.seed, challengeOrdinal: fixture.scenario.challengeOrdinal
    });
    const active = combatRunLifecycle.activeRun;
    assert.ok(active, 'Checkpoint native run disappeared before plan capture');
    assert.equal(active.seed, handle.runSeed, 'Checkpoint native plan seed drift');
    const plan = structuredClone(active.plan);
    assert.equal(plan.subAreaId, areaId, 'Checkpoint native plan area drift');
    assert.equal(plan.waves.length, handle.totalWaves, 'Checkpoint native plan length drift');
    const waves: CheckpointWave[] = [];
    for (let index = 0; index < handle.totalWaves; index++) {
      const observed = observeCheckpointWave(handle, playEarnedWave(handle, index));
      waves.push(observed);
      onWave?.(structuredClone(observed));
      if (observed.advanceResult !== 'next-wave') break;
    }
    const last = waves.at(-1);
    assert.ok(last && (last.advanceResult === 'victory' || last.advanceResult === 'defeat'));
    assert.equal(hasActiveSubAreaRun(), false);
    const finalSave = snapshotStores();
    assert.ok(finalSave);
    return {
      scope: { directService: true, campaignSuccessor: false, balanceAcceptance: false } as const,
      allocator: { scope: 'process-global', resetPerformed: false } as const,
      fixture, startingSave, finalSave, handle, plan, waves,
      completeVictory: isP15CompleteVictory(waves, handle.totalWaves),
      unreachedWaveCount: handle.totalWaves - waves.length,
      actualDelta: earnedDelta(before, observeEarnedState()),
      logicalMs: waves.reduce((sum, wave) => sum + wave.metrics.logicalMs, 0),
      wallSeconds: (performance.now() - started) / 1000
    };
  }

  try { result = attempt(); }
  catch (error) { failed = true; originalFailure = error; }
  finally {
    for (const restore of [() => { abortSubAreaRun(); }, ...restorers,
      () => { useIronGolemSelectionStore.setState(selection, true); },
      () => { setIdleEliteMisses(pity); }, () => { Date.now = now; }]) {
      try { restore(); } catch (error) { cleanupErrors.push(error); }
    }
  }
  if (cleanupErrors.length) throw new AggregateError(
    failed ? [originalFailure, ...cleanupErrors] : cleanupErrors,
    'Checkpoint cleanup failed; original errors retained'
  );
  if (failed) throw originalFailure;
  assert.ok(result);
  return result;
}
export type CheckpointAttempt = ReturnType<typeof runCheckpointAttempt>;

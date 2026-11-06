import { observeP15Wave, isP15CompleteVictory, type P15Wave } from '../contracts/p15-wave-observation';
export { observeP15Wave, isP15CompleteVictory, type P15Wave } from '../contracts/p15-wave-observation';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { decodeSave } from '@/engine/save/validate';
import type { SaveCurrent } from '@/engine/types/save';
import { snapshotStores } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import {
  captureEarnedRestorers,
  earnedDelta,
  observeEarnedState,
  restoreEarnedSave
} from './earned-state';
import { startEarnedRun, playEarnedWave } from './earned-playback';
import { hashObservation } from './earned-report';
import { semanticItem } from './adapter';
import { P15_POLICY as policy, type P15Build } from './p15-build-screen-policy';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Authenticate both original byte streams before current production decoding. */
export function loadP15Source(): SaveCurrent {
  const compressed = readFileSync(new URL(`../../../${policy.source}`, import.meta.url));
  assert.equal(digest(compressed), policy.gzipSha256, 'P15 gzip input drift');
  const raw = gunzipSync(compressed);
  assert.equal(digest(raw), policy.rawSha256, 'P15 raw input drift');
  return decodeSave(JSON.parse(raw.toString('utf8')) as unknown);
}

/** Dedicated simulation realm only: restore every captured store/method even on failure. */
export function withP15Realm<T>(action: (source: SaveCurrent) => T): T {
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat)
    throw new Error('P15 requires a quiescent caller');
  const source = loadP15Source(),
    restorers = captureEarnedRestorers();
  const now = Date.now,
    pity = getIdleEliteMisses();
  let result: T | undefined,
    failed = false,
    originalFailure: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    Date.now = () => policy.clockEpochMs;
    restoreEarnedSave(source, policy.clockEpochMs);
    setIdleEliteMisses(0);
    assert.deepEqual(snapshotStores(), source, 'P15 hydration changed saved domains');
    result = action(source);
  } catch (error) {
    failed = true;
    originalFailure = error;
  } finally {
    try {
      abortSubAreaRun();
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const restore of restorers) {
      try {
        restore();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      setIdleEliteMisses(pity);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      Date.now = now;
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length)
    throw new AggregateError(
      failed ? [originalFailure, ...cleanupErrors] : cleanupErrors,
      'P15 cleanup failed; original errors retained'
    );
  if (failed) throw originalFailure;
  return result as T;
}

/** Move to unlocked Act V, pay the native reset, allocate legal ranks and verify exact conservation. */
export function prepareP15Build(build: P15Build) {
  const before = observeEarnedState(),
    player = before.player.player;
  assert.ok(player && player.class === 'sorceress' && player.level === 35);
  assert.equal(player.skillPoints, 0);
  assert.equal(player.respecsRemaining?.skill, 0);
  const wishstones = before.inventory.currencies.wishstone;
  assert.ok(wishstones !== undefined);
  assert.equal(wishstones, 25859);
  assert.ok(useMapStore.getState().isActUnlocked(5));
  useMapStore.getState().setCurrentLocation(5, policy.location);
  const request = prepareTownRespec('npc/malah', 'skill');
  assert.equal(request.kind, 'ok');
  assert.equal(request.refund, 48);
  assert.equal(request.cost, 5);
  assert.equal(executeTownRespec(request.request), 'ok');
  assert.equal(usePlayerStore.getState().player?.skillPoints, 48);
  const ranks = policy.builds[build].ranks;
  const journal: { skill: string; result: string }[] = [];
  for (const [skill, rank] of ranks)
    for (let point = 0; point < rank; point++) {
      const result = usePlayerStore.getState().allocateSkillPoint(skill);
      journal.push({ skill, result });
      assert.equal(result, 'ok', `P15 allocation ${skill}`);
    }
  usePlayerStore.getState().setComboOrder([...policy.builds[build].priority]);
  const after = observeEarnedState();
  const expected = {
    ...before,
    map: { ...before.map, currentAct: 5, currentSubAreaId: policy.location },
    inventory: {
      ...before.inventory,
      currencies: { ...before.inventory.currencies, wishstone: wishstones - 5 }
    },
    player: {
      ...before.player,
      player: {
        ...player,
        skills: [],
        skillLevels: Object.fromEntries(ranks),
        comboOrder: [...policy.builds[build].priority]
      }
    }
  };
  assert.deepEqual(after, expected, 'P15 setup changed an unrelated field or resource');
  return {
    build,
    refund: request.refund,
    cost: request.cost,
    pointsSpent: journal.length,
    beforeHash: hashObservation(before),
    preparedHash: hashObservation(after),
    journal,
    sourceResources: { life: player.derivedStats.life, mana: player.derivedStats.mana },
    move: { from: [before.map.currentAct, before.map.currentSubAreaId], to: [5, policy.location] }
  };
}

/** One frozen full attempt; settle each wave once and discard large repeated inventory observations. */
export function runP15Attempt(buildInput: string, seed: number, onWave?: (wave: P15Wave) => void) {
  if (
    (buildInput !== 'cold' && buildInput !== 'fire') ||
    !(policy.seeds as readonly number[]).includes(seed)
  )
    throw new Error('Invalid P15 policy or seed');
  const build = buildInput,
    started = performance.now();
  return withP15Realm(() => {
    const preparation = prepareP15Build(build),
      before = observeEarnedState();
    const handle = startEarnedRun({
      act: 5,
      subAreaId: policy.area,
      mode: 'manual',
      runSeed: seed,
      challengeOrdinal: policy.challengeOrdinal
    });
    const waves: P15Wave[] = [];
    for (let index = 0; index < handle.totalWaves; index++) {
      const observed = observeP15Wave(playEarnedWave(handle, index));
      waves.push(observed);
      onWave?.(observed);
      if (observed.advanceResult !== 'next-wave') break;
    }
    const last = waves.at(-1);
    assert.ok(last && (last.advanceResult === 'victory' || last.advanceResult === 'defeat'));
    assert.equal(hasActiveSubAreaRun(), false);
    return {
      build,
      seed,
      preparation,
      handle,
      waves,
      completeVictory: isP15CompleteVictory(waves, handle.totalWaves),
      unreachedWaveCount: handle.totalWaves - waves.length,
      actualDelta: earnedDelta(before, observeEarnedState()),
      logicalMs: waves.reduce((sum, wave) => sum + wave.metrics.logicalMs, 0),
      wallSeconds: (performance.now() - started) / 1000
    };
  });
}
export type P15Attempt = ReturnType<typeof runP15Attempt>;

/** Raw combat equality and reward semantics are separate; omit only top-level new Item.id. */
export function compareP15Attempts(first: P15Attempt, second: P15Attempt) {
  assert.equal(first.build, second.build);
  assert.equal(first.seed, second.seed);
  const recording = (attempt: P15Attempt) =>
    attempt.waves.map((wave) => ({
      ...(wave.engineInput !== undefined ? { engineInput: wave.engineInput } : {}),
      initialPlayerTeam: wave.initialPlayerTeam,
      initialEnemyTeam: wave.initialEnemyTeam,
      events: wave.events,
      outcome: wave.outcome,
      advanceResult: wave.advanceResult,
      metrics: wave.metrics
    }));
  const rewards = (attempt: P15Attempt, semantic: boolean) =>
    attempt.waves.map((wave) => ({
      raw: {
        ...wave.rawRewardDelta,
        items: wave.rawRewardDelta.items.map((item) => (semantic ? semanticItem(item) : item))
      },
      actual: {
        ...wave.actualDelta,
        addedItems: wave.actualDelta.addedItems.map((item) =>
          semantic ? semanticItem(item) : item
        )
      }
    }));
  return {
    build: first.build,
    seed: first.seed,
    preparationEqual: hashObservation(first.preparation) === hashObservation(second.preparation),
    rawRecordingsEqual: hashObservation(recording(first)) === hashObservation(recording(second)),
    rawRewardsEqual:
      hashObservation(rewards(first, false)) === hashObservation(rewards(second, false)),
    semanticRewardsIgnoringOnlyTopLevelItemIdEqual:
      hashObservation(rewards(first, true)) === hashObservation(rewards(second, true))
  };
}

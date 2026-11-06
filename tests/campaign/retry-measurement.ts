import assert from 'node:assert/strict';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import type { WavePlan } from '@/engine/combat';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { hashSeed } from '@/engine/rng';
import { observeEarnedState, earnedDelta, type EarnedState } from '../sim/production/earned-state';
import { observeP15Wave, isP15CompleteVictory, type P15Wave } from '../sim/contracts/p15-wave-observation';
import { startCampaignAdmission } from './admission';
import { growCampaignBuild, equipCampaignGear, returnCampaignToMap, type CampaignRecord } from './actions';
import { installCampaignOnlineClock } from './online-clock';
import { playCampaignQuestWave, type CampaignQuestSettlement } from './quest-settlement';
import { assertCampaignSettlement } from './settlement';
import type { CampaignProfile } from './policy';

export interface CampaignRetryRequest {
  readonly act: number;
  readonly area: string;
  readonly timestamp: number;
  readonly maximumAttempts: number;
  /** Freeze this policy before evaluating any of the sequence's outcomes. */
  readonly adaptation: { readonly profile: CampaignProfile; readonly equipment: 'unchanged' | 'monotone' };
}
interface RetryAttempt {
  number: number;
  timestamp: number;
  ordinal: number;
  seed: number;
  totalWaves: number;
  plan: WavePlan;
  entry: EarnedState;
  waves: P15Wave[];
  after: EarnedState;
  won: boolean;
}

/**
 * Measure one contiguous native whole-area sequence, stopping at victory or its
 * frozen attempt budget. Never restores stores, selects seeds or refills actors.
 * The optional journal receives committed waves before diagnostic assertions;
 * callers retain it and the live successor if an unexpected native error throws.
 * Snapshot the full declared policy before observing outcomes. Journal consumers
 * receive detached records and cannot alter later adaptation or private results.
 * Each attempt retains the installed native plan before playback, including
 * waves never reached after defeat; admission journals receive a detached copy.
 * Time is combat-only, with no claim about calibrated player decision time.
 */
export function measureCampaignRetries(request: CampaignRetryRequest,
  record: CampaignRecord = () => undefined) {
  const policy = { version: 1 as const, request: structuredClone(request) };
  const { act, area, timestamp, maximumAttempts, adaptation } = policy.request;
  const publish: CampaignRecord = row => { record(structuredClone(row)); };
  assert.ok(Number.isInteger(maximumAttempts) && maximumAttempts >= 1 && maximumAttempts <= 3,
    'Retry attempt budget must be 1–3');
  assert.ok(Number.isInteger(act) && act >= 1 && act <= 5, 'Invalid retry act');
  assert.equal(resolveSubArea(act, area)?.id, area, 'Retry act/area mismatch');
  assert.equal(useMapStore.getState().isActUnlocked(act), true, 'Retry act locked');
  assert.equal(useMapStore.getState().selectedDifficulty, 'normal', 'Normal retry sequence required');
  assert.equal(usePlayerStore.getState().player?.class, adaptation.profile.classId, 'Retry class mismatch');
  assert.ok(['unchanged', 'monotone'].includes(adaptation.equipment), 'Invalid retry gear policy');
  const { strength, dexterity, vitality, energy } = adaptation.profile.statsPerLevel;
  const stats = [strength, dexterity, vitality, energy];
  assert.ok(stats.length === 4 && stats.every(n => Number.isSafeInteger(n) && n >= 0) &&
    stats.reduce((sum, n) => sum + n, 0) === 5, 'Retry stat policy must spend five-point bundles');
  assert.equal(hasActiveSubAreaRun() || useCombatStore.getState().inCombat, false,
    'Retry measurement requires quiescent combat');
  const before = observeEarnedState(), clock = installCampaignOnlineClock(timestamp);
  const attempts: RetryAttempt[] = [];
  const adaptations: { before: EarnedState; after: EarnedState; records: Readonly<Record<string, unknown>>[] }[] = [];
  const questSettlements: CampaignQuestSettlement[] = [];
  let combatMs = 0;
  try {
    publish({ kind: 'retry-policy', policy });
    for (let number = 1; number <= maximumAttempts; number++) {
      if (number > 1) {
        const change = { before: observeEarnedState(), after: observeEarnedState(),
          records: [] as Readonly<Record<string, unknown>>[] };
        adaptations.push(change);
        const retain: CampaignRecord = row => { change.records.push(structuredClone(row)); publish(row); };
        growCampaignBuild(adaptation.profile, retain);
        if (adaptation.equipment === 'monotone') equipCampaignGear(retain, adaptation.profile);
        change.after = observeEarnedState();
        publish({ kind: 'retry-adaptation', number, ...change });
      }
      const entry = observeEarnedState(), ordinal = entry.map.challengeOrdinals.normal;
      const admittedAt = clock.now();
      const { handle } = startCampaignAdmission(act, area);
      const active = combatRunLifecycle.activeRun;
      assert.ok(active, 'Retry native run disappeared before plan capture');
      assert.equal(active.seed, handle.runSeed, 'Retry native plan seed drift');
      const plan = structuredClone(active.plan);
      assert.equal(plan.subAreaId, area, 'Retry native plan area drift');
      assert.equal(plan.waves.length, handle.totalWaves, 'Retry native plan length drift');
      const attempt: RetryAttempt = { number, timestamp: admittedAt, ordinal,
        seed: hashSeed(`${area}|${String(admittedAt)}`), totalWaves: handle.totalWaves,
        plan, entry, waves: [], after: observeEarnedState(), won: false };
      attempts.push(attempt);
      publish({ kind: 'retry-admission', act, area, ...attempt, handle });
      assert.equal(useMapStore.getState().challengeOrdinals.normal, (ordinal + 1) % 360360,
        'Retry admission did not consume exactly one native ordinal');
      for (let index = 0; index < handle.totalWaves; index++) {
        const wave = playCampaignQuestWave(handle,
          { act, area, ordinal, index, actionIndex: number - 1 }, questSettlements,
          native => {
            const observed = observeP15Wave(native);
            attempt.waves.push(observed);
            combatMs += native.terminalSimClockMs;
            clock.advance(native.terminalSimClockMs);
            publish({ kind: 'retry-wave', number, ordinal, timestamp: clock.now(), wave: observed });
          },
          (delta, cause) => { publish({ kind: 'retry-native-error', number, ordinal, index,
            delta, error: cause instanceof Error ? cause.message : String(cause) }); });
        assertCampaignSettlement({ ...wave, won: attempt.waves.at(-1)?.metrics.outcome === 'victory' });
        if (wave.advanceResult !== 'next-wave') break;
      }
      attempt.won = isP15CompleteVictory(attempt.waves, handle.totalWaves);
      returnCampaignToMap();
      attempt.after = observeEarnedState();
      publish({ kind: 'retry-terminal', number, won: attempt.won, after: attempt.after });
      if (attempt.won) break;
    }
    const after = observeEarnedState();
    return { policy, before, after, attempts, adaptations, questSettlements,
      firstAttemptWon: attempts[0]?.won === true, withinAttemptsWon: attempts.some(a => a.won),
      combatMs, finishedAt: clock.now(), actualDelta: earnedDelta(before, after),
      timeBasis: 'combat-only;menu-decision-time-uncalibrated' as const };
  } finally { clock.dispose(); }
}

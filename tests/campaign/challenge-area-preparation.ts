import assert from 'node:assert/strict';
import { challengeEnemyLevelRange } from '@/engine/combat/sub-area-run';
import { levelForXp, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { listSubAreasForAct, resolveSubArea } from '@/stores/subAreaResolver';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { growCampaignBuild, equipCampaignGear, returnCampaignToMap, type CampaignRecord } from './actions';
import type { CampaignProfile, CampaignWave, TrainingCurseRecovery } from './policy';
import { trainingCurseRecovery } from './training-draw-recovery';
import { CampaignStop } from './route';

const safeFarm = { act: 1, area: 'areas/act1-dark-wood' };
const limits = { training: 600, perArea: 200, consecutiveNonwins: 3, totalNonwins: 10, routeAttempts: 3 } as const;
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
const totalXp = () => xpTotal(hero().level) + hero().experience;
const ordinal = () => useMapStore.getState().challengeOrdinals.normal;
type FailureStatus = 'budget' | 'nonwin' | 'technical';

export interface ChallengeAreaAttempt {
  kind: 'training' | 'route'; entryArea: string; targetLevel: number; act: number; area: string;
  ordinal: number; nextOrdinal: number; fromLevel: number; terminalLevel: number;
  fromXp: number; terminalXp: number; outcome: 'victory' | 'nonwin' | 'interrupted';
  failureStatus: FailureStatus | null;
  trainingRecovery?: TrainingCurseRecovery;
}
export type ChallengePreparationMode = 'challenge-prepared-act3-v1' | 'challenge-prepared-act4-v1' | 'challenge-prepared-act5-v1';
export interface ChallengeAreaPreparation<M extends ChallengePreparationMode = ChallengePreparationMode> {
  readonly mode: M; readonly startOrdinal: number;
  readonly fromXp: number; readonly initialCleared: string[];
  readonly trainingFallbackPolicy?: 'ranked-cleared-v1';
  /** Prospective route-first measurement; absence preserves historical preparation. */
  readonly entryPolicy?: 'route-first-v1';
  nextOrdinal: number; attempts: ChallengeAreaAttempt[]; completed: boolean;
  failureStatus: FailureStatus | null; failure: string | null;
  continuations?: ChallengeWallContinuation[];
  /** Complete direct-route history authenticated against the caller's frozen parent evidence. */
  readonly unpreparedRoutePrefix?: number;
}
export type UnpreparedRouteHistory = Pick<ChallengeAreaPreparation,
  'startOrdinal' | 'fromXp' | 'initialCleared' | 'attempts'>;
/** Authenticated by the caller against the immutable parent report, plan and readback. */
export interface ChallengeWallContinuation {
  afterAttempt: number; nextOrdinal: number; terminalXp: number; abandonedWaveIndex: number;
  maxAdmissions: number; maxCombatMs: number; combatMs: number; maxWallMs: number; wallMs: number;
}

function validateTrainingFallbackPolicy(policy: unknown): void {
  assert.ok(policy === undefined || policy === 'ranked-cleared-v1', 'Unknown training fallback policy');
}

function validateEntryPolicy(policy: unknown): void {
  assert.ok(policy === undefined || policy === 'route-first-v1', 'Unknown entry policy');
}

/** Share bounded challenge preparation; native quest routes retain their own actions. */
export function createChallengeAreaController<const A extends 3 | 4 | 5>(act: A,
  areas: readonly string[], prerequisiteQuest: string) {
  const modes = { 3: 'challenge-prepared-act3-v1', 4: 'challenge-prepared-act4-v1', 5: 'challenge-prepared-act5-v1' } as const;
  const mode = modes[act];
  const label = ({ 3: 'Act III', 4: 'Act IV', 5: 'Act V' } as const)[act];
  type State = ChallengeAreaPreparation<typeof mode>;
  /** Seed-independent full challenge projection; this never admits or inspects combat. */
  function preparationTarget(area: string): number {
    assert.ok(areas.some(id => id === area), `Unknown prepared ${label} area`);
    const definition = resolveSubArea(act, area);
    assert.ok(definition?.id === area && definition.actId === `acts/act${String(act)}`);
    return challengeEnemyLevelRange(definition).max;
  }
  /** Highest complete challenge maximum within the two-level margin among prior clears. */
  function trainingSource(level: number, cleared: readonly string[]): { act: number; area: string } | null {
    const eligible = Array.from({ length: act }, (_value, index) => index + 1).flatMap(act => listSubAreasForAct(act)
      .filter(area => cleared.includes(area.id))
      .map(area => ({ act, area: area.id, maximum: challengeEnemyLevelRange(area).max })))
      .filter(area => area.maximum <= level - 2)
      .sort((a, b) => b.maximum - a.maximum || a.area.localeCompare(b.area));
    const selected = eligible[0];
    return selected ? { act: selected.act, area: selected.area } : null;
  }
  /** Fresh act custody only; a continuation cannot silently reset spent budgets. */
  function createState(options: Pick<State, 'trainingFallbackPolicy' | 'entryPolicy'> = {}): State {
    validateTrainingFallbackPolicy(options.trainingFallbackPolicy);
    validateEntryPolicy(options.entryPolicy);
    const map = useMapStore.getState();
    assert.ok(map.isActUnlocked(act) && map.questProgress[prerequisiteQuest]?.rewardClaimed,
      `${label} preparation requires the earned prerequisite claim`);
    for (const rows of [map.questProgress, map.questReceipts, useInventoryStore.getState().questItems])
      assert.ok(!Object.getOwnPropertyNames(rows).some(id => id.startsWith(`quests/act${String(act)}-`)),
        `${label} preparation requires a fresh quest boundary`);
    assert.ok(!map.clearedSubAreas.some(id => id.startsWith(`areas/act${String(act)}-`) || id.startsWith(`a${String(act)}-`)),
      `${label} preparation requires a fresh clear boundary`);
    assert.ok(map.clearedSubAreas.includes(safeFarm.area), `${label} preparation requires a cleared safe farm`);
    assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat, 'Preparation requires a settled native run');
    return { mode, startOrdinal: ordinal(), nextOrdinal: ordinal(),
      fromXp: totalXp(), initialCleared: [...map.clearedSubAreas], attempts: [], completed: false,
      trainingFallbackPolicy: options.trainingFallbackPolicy ?? 'ranked-cleared-v1',
      ...(options.entryPolicy ? { entryPolicy: options.entryPolicy } : {}),
      failureStatus: null, failure: null };
  }

  /** Adopt settled direct-route history once; failed admissions retain their retry cost. */
  function createFromUnpreparedRoute(history: UnpreparedRouteHistory, waves: readonly CampaignWave[]): State {
    assert.ok(history.attempts.length > 0, 'Unprepared route history is empty');
    const map = useMapStore.getState();
    assert.ok(map.isActUnlocked(act) && map.questProgress[prerequisiteQuest]?.rewardClaimed,
      `${label} preparation requires the earned prerequisite claim`);
    assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat,
      'Preparation requires a settled native run');
    const state: State = { ...structuredClone(history), mode, nextOrdinal: ordinal(),
      unpreparedRoutePrefix: history.attempts.length, trainingFallbackPolicy: 'ranked-cleared-v1',
      completed: false, failureStatus: null, failure: null };
    audit(state, waves);
    const last = state.attempts.at(-1); assert.ok(last);
    assert.equal(totalXp(), last.terminalXp, 'Preparation XP custody changed');
    const cleared = new Set([...state.initialCleared,
      ...state.attempts.filter(row => row.outcome === 'victory').map(row => row.area)]);
    assert.deepEqual([...map.clearedSubAreas].sort(), [...cleared].sort(), 'Preparation clear custody changed');
    return state;
  }

  /** Resume only a proven wall stop; the admitted unplayed training suffix earns nothing. */
  function resume(parent: State,
    waves: readonly CampaignWave[], proof: ChallengeWallContinuation): State {
    audit(parent, waves);
    assert.ok(!parent.completed && parent.failureStatus === 'budget', 'Only a wall-budget stop can continue');
    assert.ok(!(parent.continuations ?? []).some(row => row.afterAttempt === parent.attempts.length),
      'Continuation boundary already consumed');
    assert.equal(proof.afterAttempt, parent.attempts.length);
    assert.equal(parent.nextOrdinal, ordinal(), 'Continuation ordinal custody changed');
    const last = parent.attempts.at(-1); assert.ok(last);
    assert.equal(totalXp(), last.terminalXp, 'Continuation XP custody changed');
    const cleared = new Set([...parent.initialCleared,
      ...parent.attempts.filter(row => row.outcome === 'victory').map(row => row.area)]);
    assert.deepEqual([...useMapStore.getState().clearedSubAreas].sort(), [...cleared].sort(),
      'Continuation clear custody changed');
    assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat,
      'Continuation requires a restored native checkpoint without transient combat');
    const state = structuredClone(parent);
    state.continuations = [...(state.continuations ?? []), structuredClone(proof)];
    state.failureStatus = null; state.failure = null;
    audit(state, waves);
    return state;
  }

  /** Prepare one ordered route entry; the native quest runner still owns every quest action. */
  function enterArea(profile: CampaignProfile, record: CampaignRecord,
    enter: (act: number, area: string, phase: 'farm' | 'route', trainingRecovery?: TrainingCurseRecovery) => void,
    state: State, area: string, waves: readonly CampaignWave[] = []): void {
    assert.equal(state.mode, mode);
    validateTrainingFallbackPolicy(state.trainingFallbackPolicy);
    validateEntryPolicy(state.entryPolicy);
    const routeFirst = state.entryPolicy === 'route-first-v1';
    assert.ok(!routeFirst || state.unpreparedRoutePrefix === undefined, 'Route-first cannot adopt historical routes');
    assert.ok(!state.completed && state.failureStatus === null && state.failure === null, 'Preparation is terminal');
    assert.equal(state.nextOrdinal, ordinal(), 'Preparation ordinal custody changed');
    const completed = state.attempts.filter(row => row.kind === 'route' && row.outcome === 'victory').length;
    assert.equal(area, areas[completed], `Prepared ${label} entry out of order`);
    if (!routeFirst) assert.equal(profile.recoveryTrainingPolicy, 'cleared-level-margin-v1');
    const targetLevel = preparationTarget(area);
    const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
    const nonwin: { last: CampaignStop | null } = { last: null };
    const attempt = (sourceAct: number, source: string, kind: ChallengeAreaAttempt['kind'],
      trainingRecovery?: TrainingCurseRecovery, recoveryLevel?: number) => {
      const row: ChallengeAreaAttempt = { kind, entryArea: area, targetLevel: recoveryLevel ?? targetLevel, act: sourceAct, area: source,
        ordinal: ordinal(), nextOrdinal: ordinal(), fromLevel: hero().level, terminalLevel: hero().level,
        fromXp: totalXp(), terminalXp: totalXp(), outcome: 'interrupted', failureStatus: null,
        ...(trainingRecovery ? { trainingRecovery } : {}) };
      state.attempts.push(row);
      const phase = kind === 'route' ? 'route' : 'farm';
      try {
        enter(sourceAct, source, phase, trainingRecovery);
        assert.equal(ordinal(), row.ordinal + 1, 'Preparation requires exactly one native admission');
        assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat, 'Admission did not settle');
        assert.ok(useMapStore.getState().clearedSubAreas.includes(source), 'Victory did not retain an actual clear');
        row.outcome = 'victory';
      } catch (error) {
        row.failureStatus = error instanceof CampaignStop && error.status === 'budget' ? 'budget' : 'technical';
        if (!(error instanceof CampaignStop) || error.status !== 'nonwin' ||
          error.settledNonwin?.area !== source || error.settledNonwin.phase !== phase ||
          error.settledNonwin.ordinal !== row.ordinal) throw error;
        assert.equal(ordinal(), row.ordinal + 1, 'Nonwin requires exactly one native admission');
        assert.ok(!hasActiveSubAreaRun(), 'Nonwin did not settle its native run');
        row.outcome = 'nonwin'; row.failureStatus = 'nonwin';
        nonwin.last = error;
        returnCampaignToMap();
      } finally {
        row.nextOrdinal = ordinal(); row.terminalXp = totalXp(); row.terminalLevel = hero().level;
        state.nextOrdinal = ordinal(); record({ kind: `act${String(act)}-area-prepared-attempt`, attempt: row });
      }
      return row;
    };
    let training = state.attempts.filter(row => row.kind === 'training').length;
    let nonwins = state.attempts.filter(row => row.kind === 'training' && row.outcome === 'nonwin').length;
    let consecutiveNonwins = 0;
    for (const row of state.attempts.filter(row => row.kind === 'training' && row.outcome !== 'interrupted').reverse()) {
      if (row.outcome !== 'nonwin') break;
      consecutiveNonwins++;
    }
    const priorClear = [...state.attempts].reverse().find(row => row.kind === 'route' && row.outcome === 'victory');
    const currentArea = state.attempts.filter(row => !priorClear || row.ordinal > priorClear.ordinal);
    let areaTraining = currentArea.filter(row => row.kind === 'training').length;
    let fallback = currentArea.reduce((active, row) => row.kind !== 'training' ? active :
      row.outcome === 'nonwin' ? true : row.trainingRecovery ? false : active, false);
    const rankedFallback = state.trainingFallbackPolicy === 'ranked-cleared-v1';
    const failedSources = new Set<string>();
    for (const row of currentArea.filter(row => row.kind === 'training')) {
      if (row.outcome === 'nonwin') failedSources.add(row.area);
      else if (row.trainingRecovery && row.outcome === 'victory') failedSources.delete(row.area);
    }
    const train = (trainingTarget: number) => {
      if (routeFirst && trainingTarget > preparationTarget(areas.at(-1) ?? ''))
        throw new CampaignStop('budget', `${label} route-first recovery level ceiling reached`);
      while (hero().level < trainingTarget) {
        if (training >= limits.training) throw new CampaignStop('budget', `${label} total training bound reached`);
        if (areaTraining >= limits.perArea) throw new CampaignStop('budget', `${label} area training bound reached`);
        const cleared = useMapStore.getState().clearedSubAreas;
        boundary();
        const previousAttempt = state.attempts.at(-1), previousWave = waves.at(-1);
        const preferred = trainingSource(hero().level, rankedFallback
          ? cleared.filter(id => !failedSources.has(id) || id === previousAttempt?.area) : cleared);
        const recovery = preferred && previousAttempt?.kind === 'training' &&
          previousAttempt.entryArea === area && previousAttempt.ordinal === previousWave?.ordinal
          ? trainingCurseRecovery(profile, hero().skillLevels ?? {}, preferred.area, ordinal(), previousWave,
            previousAttempt.trainingRecovery) : undefined;
        if (recovery) fallback = false;
        const source = recovery ? preferred : trainingSource(hero().level,
          rankedFallback ? cleared.filter(id => !failedSources.has(id))
            : fallback ? cleared.filter(id => id === safeFarm.area) : cleared);
        if (!source) throw new CampaignStop('budget', `No cleared lower-level ${label} training area`);
        training++; areaTraining++;
        const trained = attempt(source.act, source.area, 'training', recovery, trainingTarget);
        if (trained.outcome === 'nonwin') {
          nonwins++; consecutiveNonwins++; fallback = true; failedSources.add(trained.area);
        } else {
          consecutiveNonwins = 0;
          if (trained.trainingRecovery) failedSources.delete(trained.area);
        }
        if (nonwins >= limits.totalNonwins || consecutiveNonwins >= limits.consecutiveNonwins)
          throw new CampaignStop('nonwin', `${label} shared training nonwin bound reached`);
      }
    };
    try {
      const spentRouteAttempts = currentArea.filter(row => row.kind === 'route').length;
      const lastRoute = currentArea.filter(row => row.kind === 'route').at(-1);
      let recoveryLevel = routeFirst && lastRoute?.outcome === 'nonwin' ? lastRoute.terminalLevel + 1 : undefined;
      if (!routeFirst) train(targetLevel);
      for (let number = spentRouteAttempts + 1; number <= limits.routeAttempts; number++) {
        if (routeFirst && recoveryLevel !== undefined) train(recoveryLevel);
        boundary();
        if (!routeFirst) assert.ok(hero().level >= targetLevel, `Underlevel prepared ${label} entry`);
        const result = attempt(act, area, 'route');
        if (result.outcome === 'victory') {
          state.completed = completed + 1 === areas.length;
          return;
        }
        if (number === limits.routeAttempts) { assert.ok(nonwin.last); throw nonwin.last; }
        if (routeFirst) recoveryLevel = result.terminalLevel + 1;
        record({ kind: `act${String(act)}-area-prepared-retry`, area, failedOrdinal: result.ordinal,
          nextOrdinal: ordinal(), nextAttempt: number + 1, maximumRouteAttempts: limits.routeAttempts });
      }
    } catch (error) {
      state.failureStatus = error instanceof CampaignStop ? error.status : 'technical'; state.failure = String(error);
      throw error;
    } finally { state.nextOrdinal = ordinal(); }
  }

  /** Derive sources, levels, retry limits and wave ownership from retained admission custody. */
  function audit(state: State, waves: readonly CampaignWave[]) {
    assert.equal(state.mode, mode);
    validateTrainingFallbackPolicy(state.trainingFallbackPolicy);
    validateEntryPolicy(state.entryPolicy);
    const routeFirst = state.entryPolicy === 'route-first-v1';
    assert.ok(!routeFirst || state.unpreparedRoutePrefix === undefined, 'Route-first cannot adopt historical routes');
    const rankedFallback = state.trainingFallbackPolicy === 'ranked-cleared-v1';
    const failedSources = new Set<string>();
    assert.ok(Number.isSafeInteger(state.startOrdinal) && state.startOrdinal >= 0);
    assert.ok(Number.isSafeInteger(state.fromXp) && state.fromXp >= 0);
    assert.equal(state.failureStatus === null, state.failure === null);
    const unprepared = state.unpreparedRoutePrefix ?? 0;
    assert.ok(Number.isSafeInteger(unprepared) && unprepared >= 0 && unprepared <= state.attempts.length);
    if (state.unpreparedRoutePrefix !== undefined) assert.ok(unprepared > 0, 'Unprepared prefix is empty');
    assert.ok(state.initialCleared.includes(safeFarm.area));
    assert.ok(!state.initialCleared.some(id => id.startsWith(`areas/act${String(act)}-`) || id.startsWith(`a${String(act)}-`)));
    const cleared = new Set(state.initialCleared), nonwinOrdinals: number[] = [];
    let next = state.startOrdinal, previousXp = state.fromXp, route = 0, routeAttempts = 0;
    let trainingAdmissions = 0, areaTraining = 0, trainingNonwins = 0, consecutiveNonwins = 0, xp = 0;
    let fallback = false, stopped = false, ownedWaves = 0;
    let preparedRouteAttempted = false;
    let recoveryLevel: number | undefined;
    let combatMs = 0;
    let carriedBudget: ChallengeWallContinuation | undefined;
    let previousTraining: { attempt: ChallengeAreaAttempt; last: CampaignWave } | undefined;
    const markers = new Map<number, ChallengeWallContinuation>();
    for (const marker of state.continuations ?? []) {
      assert.ok(Number.isSafeInteger(marker.afterAttempt) && marker.afterAttempt > 0 && marker.afterAttempt <= state.attempts.length);
      assert.ok(!markers.has(marker.afterAttempt), 'Duplicate continuation boundary');
      const previous = [...markers.values()].at(-1);
      if (previous) {
        assert.ok(marker.afterAttempt > previous.afterAttempt, 'Continuation order changed');
        assert.equal(marker.maxAdmissions, previous.maxAdmissions);
        assert.equal(marker.maxCombatMs, previous.maxCombatMs);
        assert.equal(marker.maxWallMs, previous.maxWallMs);
      }
      markers.set(marker.afterAttempt, marker);
    }
    for (const [index, row] of state.attempts.entries()) {
      assert.ok(!stopped, 'Continuation after a terminal prepared attempt');
      if (index < unprepared)
        assert.ok(row.kind === 'route' && row.outcome !== 'interrupted', 'Unprepared prefix requires settled route admissions');
      const area = areas[route]; assert.ok(area, 'Admission after the prepared route');
      assert.equal(row.entryArea, area);
      assert.equal(row.targetLevel, routeFirst && row.kind === 'training' ? recoveryLevel : preparationTarget(area));
      assert.equal(row.ordinal, next, 'Prepared admission gap/overlap');
      assert.ok(row.nextOrdinal === next || row.nextOrdinal === next + 1, 'Prepared admission span mismatch');
      if (carriedBudget && row.nextOrdinal > next) {
        assert.ok(next - state.startOrdinal < carriedBudget.maxAdmissions, 'Carried admission bound exhausted');
        assert.ok(combatMs < carriedBudget.maxCombatMs, 'Carried combat bound exhausted');
      }
      next = row.nextOrdinal;
      for (const value of [row.fromXp, row.terminalXp]) assert.ok(Number.isSafeInteger(value) && value >= 0);
      assert.ok(row.fromXp >= previousXp, 'Prepared XP went backwards between actions');
      assert.equal(row.fromLevel, levelForXp(row.fromXp)); assert.equal(row.terminalLevel, levelForXp(row.terminalXp));
      const rows = waves.filter(wave => wave.ordinal === row.ordinal && wave.ordinal < row.nextOrdinal);
      ownedWaves += rows.length;
      assert.ok(rows.every(wave => wave.area === row.area && wave.phase === (row.kind === 'route' ? 'route' : 'farm')));
      assert.deepEqual(rows.map(wave => wave.index), rows.map((_wave, waveIndex) => waveIndex));
      for (const wave of rows) assert.ok(Number.isSafeInteger(wave.xp) && wave.xp >= 0);
      for (const wave of rows) {
        assert.ok(Number.isFinite(wave.logicalMs) && wave.logicalMs >= 0);
        if (carriedBudget) assert.ok(combatMs < carriedBudget.maxCombatMs, 'Wave after carried combat bound');
        combatMs += wave.logicalMs;
      }
      assert.equal(row.terminalXp, row.fromXp + rows.reduce((sum, wave) => sum + wave.xp, 0));
      previousXp = row.terminalXp; xp += row.terminalXp - row.fromXp;
      for (const wave of rows.slice(0, -1))
        assert.ok(wave.outcome === 'victory' && wave.advance === 'next-wave' && wave.heroLife > 0);
      const last = rows.at(-1);
      if (row.outcome === 'interrupted') {
        stopped = true;
        assert.ok(row.failureStatus === 'budget' || row.failureStatus === 'technical');
        if (last) assert.ok(last.outcome === 'victory' && last.advance === 'next-wave' && last.heroLife > 0);
      } else {
        assert.equal(row.nextOrdinal, row.ordinal + 1); assert.ok(last);
        if (row.outcome === 'victory') {
          assert.equal(row.failureStatus, null);
          assert.ok(last.outcome === 'victory' && last.advance === 'victory' && last.heroLife > 0);
        } else {
          assert.equal(row.outcome, 'nonwin'); assert.equal(row.failureStatus, 'nonwin');
          assert.ok(last.outcome !== 'victory' && last.advance === 'defeat');
          assert.equal(last.xp, 0); assert.equal(last.items, 0); nonwinOrdinals.push(row.ordinal);
        }
      }
      if (row.kind === 'training') {
        if (routeFirst) {
          assert.ok(recoveryLevel !== undefined && routeAttempts > 0 && routeAttempts < limits.routeAttempts,
            'Route-first training requires a settled route loss and remaining retry');
          assert.ok(row.targetLevel <= preparationTarget(areas.at(-1) ?? ''), 'Route-first recovery ceiling exceeded');
        } else assert.ok(routeAttempts === 0 || (unprepared > 0 && !preparedRouteAttempted),
          'Training inserted between prepared route retries');
        assert.ok(row.fromLevel < row.targetLevel && cleared.has(row.area), 'Training requires a prior clear and unearned target');
        if (row.trainingRecovery) {
          const recovery = row.trainingRecovery, prior = previousTraining; assert.ok(prior);
          assert.equal(recovery.policy, 'learned-offensive-curse-v1');
          assert.equal(recovery.area, row.area);
          assert.equal(prior.attempt.entryArea, row.entryArea);
          assert.equal(prior.attempt.area, row.area);
          assert.equal(prior.attempt.ordinal + 1, row.ordinal);
          assert.ok(prior.last.heroLife > 0);
          if (prior.attempt.trainingRecovery) {
            assert.equal(prior.attempt.outcome, 'victory');
            assert.deepEqual(recovery, prior.attempt.trainingRecovery);
          } else {
            assert.equal(prior.attempt.outcome, 'nonwin');
            assert.ok(prior.last.outcome === 'draw' && prior.last.advance === 'defeat');
            assert.equal(recovery.triggerOrdinal, prior.attempt.ordinal);
          }
          assert.deepEqual({ act: row.act, area: row.area }, trainingSource(row.fromLevel, rankedFallback
            ? [...cleared].filter(id => !failedSources.has(id) || id === prior.attempt.area) : [...cleared]));
          fallback = false;
        }
        const source = trainingSource(row.fromLevel, rankedFallback
          ? [...cleared].filter(id => !failedSources.has(id) || (row.trainingRecovery && id === row.area))
          : [...cleared].filter(id => !fallback || id === safeFarm.area));
        assert.deepEqual({ act: row.act, area: row.area }, source, 'Undeclared prepared training source');
        areaTraining++; trainingAdmissions++;
        assert.ok(areaTraining <= limits.perArea && trainingAdmissions <= limits.training);
        if (row.outcome === 'nonwin') {
          trainingNonwins++; consecutiveNonwins++; fallback = true; failedSources.add(row.area);
        } else if (row.outcome === 'victory') {
          consecutiveNonwins = 0;
          if (row.trainingRecovery) failedSources.delete(row.area);
        }
        assert.ok(trainingNonwins <= limits.totalNonwins && consecutiveNonwins <= limits.consecutiveNonwins);
        if (trainingNonwins === limits.totalNonwins || consecutiveNonwins === limits.consecutiveNonwins) stopped = true;
        previousTraining = last ? { attempt: row, last } : undefined;
      } else {
        assert.equal(row.trainingRecovery, undefined, 'Training recovery cannot authorize a route');
        previousTraining = undefined;
        assert.equal(row.kind, 'route'); assert.equal(row.act, act); assert.equal(row.area, area);
        if (index >= unprepared) {
          if (routeFirst) {
            assert.ok(recoveryLevel === undefined || recoveryLevel <= preparationTarget(areas.at(-1) ?? ''),
              'Route-first recovery ceiling exceeded');
            assert.ok(recoveryLevel === undefined || row.fromLevel >= recoveryLevel,
              'Route-first retry requires earned recovery');
          } else assert.ok(row.fromLevel >= row.targetLevel, 'Underlevel prepared area entry');
          preparedRouteAttempted = true;
        }
        routeAttempts++; assert.ok(routeAttempts <= limits.routeAttempts, 'Prepared route attempt bound exceeded');
        if (row.outcome === 'victory') {
          route++; routeAttempts = 0; areaTraining = 0; fallback = false; failedSources.clear();
          recoveryLevel = undefined;
        }
        else if (routeAttempts === limits.routeAttempts) stopped = true;
        else if (routeFirst && row.outcome === 'nonwin') recoveryLevel = row.terminalLevel + 1;
      }
      if (row.outcome === 'victory') cleared.add(row.area);
      if (index + 1 === unprepared) {
        assert.ok(!stopped && route < areas.length, 'Unprepared route is complete or exhausted');
      }
      const marker = markers.get(index + 1);
      if (marker) {
        assert.ok(row.kind === 'training' && row.outcome === 'interrupted' && row.failureStatus === 'budget',
          'Continuation requires budget-interrupted training');
        assert.ok(last && last.outcome === 'victory' && last.advance === 'next-wave' && last.heroLife > 0);
        assert.equal(row.nextOrdinal, row.ordinal + 1, 'Interrupted training must retain its spent admission');
        assert.equal(marker.nextOrdinal, row.nextOrdinal); assert.equal(marker.terminalXp, row.terminalXp);
        assert.equal(marker.abandonedWaveIndex, rows.length, 'Abandoned suffix cannot be settled or rewarded');
        for (const value of [marker.maxAdmissions, marker.maxCombatMs, marker.combatMs, marker.maxWallMs, marker.wallMs])
          assert.ok(Number.isFinite(value) && value >= 0);
        assert.ok(Number.isSafeInteger(marker.maxAdmissions) && marker.maxAdmissions > next - state.startOrdinal,
          'Continuation admission bound exhausted');
        assert.ok(Math.abs(marker.combatMs - combatMs) <= Math.max(1e-6, combatMs * 1e-12), 'Continuation combat custody changed');
        assert.ok(marker.combatMs < marker.maxCombatMs, 'Continuation combat bound exhausted');
        assert.ok(marker.maxWallMs > 0 && marker.wallMs >= marker.maxWallMs, 'Wall stop not proven');
        assert.ok(trainingAdmissions < limits.training && areaTraining < limits.perArea &&
          trainingNonwins < limits.totalNonwins && consecutiveNonwins < limits.consecutiveNonwins,
        'Continuation gameplay bound exhausted');
        stopped = false;
        carriedBudget = marker;
      }
      if (stopped) assert.equal(index, state.attempts.length - 1);
    }
    assert.equal(state.nextOrdinal, next);
    assert.equal(waves.filter(wave => wave.ordinal >= state.startOrdinal && wave.ordinal < state.nextOrdinal).length,
      ownedWaves, 'Unowned prepared wave');
    assert.equal(state.completed, route === areas.length && state.failureStatus === null);
    if (!state.completed) assert.ok(state.failureStatus !== null || markers.has(state.attempts.length) ||
      (unprepared > 0 && state.attempts.length === unprepared));
    return { completed: state.completed, admissions: next - state.startOrdinal, trainingAdmissions, trainingNonwins,
      routeAreas: route, xp, nonwinOrdinals };
  }

  return { areas, preparationTarget, trainingSource, createState, createFromUnpreparedRoute, resume, enterArea, audit };
}

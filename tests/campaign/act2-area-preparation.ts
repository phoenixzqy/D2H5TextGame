import assert from 'node:assert/strict';
import { challengeEnemyLevelRange, resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { levelForXp, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { listSubAreasForAct, resolveSubArea } from '@/stores/subAreaResolver';
import type { CampaignProfile, CampaignWave } from './policy';
import { growCampaignBuild, equipCampaignGear, returnCampaignToMap, type CampaignRecord } from './actions';
import { assertActTwoResumePrefix, resumeActTwoAfterCube, runActTwo } from './act2-route';
import type { CampaignQuestEntry, createCampaignQuestActions } from './quest-actions';
import { CampaignStop } from './route';

const areas = ['areas/act2-rocky-waste', 'areas/act2-dry-hills', 'areas/act2-far-oasis',
  'areas/act2-lost-city', 'areas/act2-arcane-sanctuary', 'areas/act2-tomb-of-tal-rasha'] as const;
const safeFarm = { act: 1, area: 'areas/act1-dark-wood' };
const startingFarm = (startRoute: number) => {
  if (startRoute === 0) return safeFarm;
  const area = areas[startRoute - 1]; assert.ok(area);
  return { act: 2, area };
};
const limits = { training: 600, perArea: 200, consecutiveNonwins: 3, totalNonwins: 10 } as const;
const preparationModes = ['area-prepared-act2-v1', 'area-prepared-retry-act2-v1',
  'challenge-prepared-act2-v1', 'route-first-act2-v1'] as const;
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
const totalXp = () => xpTotal(hero().level) + hero().experience;
const ordinal = () => useMapStore.getState().challengeOrdinals.normal;
/** Select from prior clears using complete challenge levels, without admitting or inspecting combat. */
export function actTwoTrainingSource(level: number, cleared: readonly string[]): { act: number; area: string } | null {
  const eligible = [1, 2].flatMap(act => listSubAreasForAct(act)
    .filter(area => cleared.includes(area.id))
    .map(area => ({ act, area: area.id, maximum: challengeEnemyLevelRange(area).max })))
    .filter(area => area.maximum <= level - 2)
    .sort((a, b) => b.maximum - a.maximum || a.area.localeCompare(b.area));
  const selected = eligible[0];
  return selected ? { act: selected.act, area: selected.area } : null;
}
/** Structural level projection only: no admission, combat, rewards or outcome inspection. */
export function actTwoPreparationTarget(area: string, mode: ActTwoAreaPreparation['mode']): number {
  const definition = resolveSubArea(2, area);
  assert.ok(definition && definition.id === area && definition.actId === 'acts/act2');
  if (mode !== 'challenge-prepared-act2-v1' && mode !== 'route-first-act2-v1') return definition.areaLevel;
  const authored = definition.waves.filter(wave => wave.type !== 'boss');
  assert.ok(authored.length > 0 && authored.every(wave => (wave.encounters?.length ?? 0) > 0),
    'Challenge level preparation requires complete authored encounters');
  const fallbackArchetypeId = authored[0]?.encounters?.[0]?.monsters[0]?.archetypeId;
  assert.ok(fallbackArchetypeId);
  const plan = resolveChallengeWavePlan({ subArea: definition, fallbackArchetypeId,
    fallbackLevel: definition.areaLevel, seed: 0, challengeOrdinal: 0, mode: 'manual' });
  const levels = plan.waves.flatMap(wave => wave.spawns.map(spawn => spawn.level));
  assert.ok(levels.length > 0 && levels.every(level => Number.isSafeInteger(level) && level > 0));
  return Math.max(...levels);
}
const routeAttemptLimit = (mode: ActTwoAreaPreparation['mode']) => mode === 'area-prepared-act2-v1' ? 1 : 3;
type FailureStatus = 'nonwin' | 'budget' | 'technical';

export interface ActTwoAreaAttempt {
  kind: 'route' | 'training';
  entryArea: string;
  targetLevel: number;
  act: number;
  area: string;
  ordinal: number;
  nextOrdinal: number;
  fromLevel: number;
  terminalLevel: number;
  fromXp: number;
  terminalXp: number;
  outcome: 'victory' | 'nonwin' | 'interrupted';
  failureStatus: FailureStatus | null;
}
/** Settled attempts immediately preceding a checkpoint; never new admission income. */
export interface ActTwoRouteCarry {
  attempts: ActTwoAreaAttempt[];
  waves: CampaignWave[];
}
/** Retained diagnostic evidence; the saved game owns all previously settled income. */
export interface ActTwoTrainingCarry {
  preparation: ActTwoAreaPreparation;
  waves: CampaignWave[];
}
interface ActTwoTrainingContinuation {
  routeIndex: number;
  terminalXp: number;
  cleared: string[];
  trainingAdmissions: number;
  trainingNonwins: number;
  consecutiveNonwins: number;
  perArea: Record<string, number>;
  farm: { act: number; area: string };
  fallback: boolean;
  routeFirstRecovery?: { routeAttempts: number; targetLevel: number };
}
export interface ActTwoAreaPreparationAudit {
  completed: boolean;
  admissions: number;
  carriedRouteAttempts: number;
  trainingAdmissions: number;
  trainingNonwins: number;
  routeAreas: number;
  xp: number;
  nonwinOrdinals: number[];
  continuation: ActTwoTrainingContinuation;
}
export interface ActTwoAreaPreparation {
  readonly mode: typeof preparationModes[number];
  readonly startOrdinal: number;
  readonly fromXp: number;
  readonly initialCleared: string[];
  trainingPolicy?: 'cleared-level-margin-v1';
  resumePrefixLength?: 7 | 10 | 16 | 20;
  priorRoute?: ActTwoRouteCarry;
  priorTraining?: ActTwoTrainingCarry;
  nextOrdinal: number;
  attempts: ActTwoAreaAttempt[];
  completed: boolean;
  failureStatus: FailureStatus | null;
  failure: string | null;
}

/** Reserve custody before any native allocation, equipment action or admission. */
export function createActTwoAreaPreparation(mode: ActTwoAreaPreparation['mode'] = 'area-prepared-act2-v1'): ActTwoAreaPreparation {
  assert.ok(preparationModes.includes(mode), 'Invalid area preparation mode');
  return { mode, startOrdinal: ordinal(), nextOrdinal: ordinal(), fromXp: totalXp(),
    ...(mode === 'route-first-act2-v1' ? { trainingPolicy: 'cleared-level-margin-v1' as const } : {}),
    initialCleared: [...useMapStore.getState().clearedSubAreas], attempts: [], completed: false,
    failureStatus: null, failure: null };
}

/** Reuse the full preparation audit for the retained span before allowing a remaining retry. */
function auditRouteCarry(state: ActTwoAreaPreparation, prior: ActTwoRouteCarry | undefined): number {
  if (!prior) return 0;
  assert.ok(prior.attempts.length > 0 && prior.attempts.length < routeAttemptLimit(state.mode),
    'Carried route attempts are empty or exhausted');
  const first = prior.attempts[0], last = prior.attempts.at(-1); assert.ok(first && last);
  assert.equal(last.nextOrdinal, state.startOrdinal, 'Carried retry does not precede the checkpoint');
  assert.equal(last.terminalXp, state.fromXp, 'Carried retry XP does not match the checkpoint');
  assert.ok(prior.waves.every(wave => wave.ordinal >= first.ordinal && wave.ordinal < state.startOrdinal),
    'Unowned carried wave outside the checkpoint span');
  for (const [index, row] of prior.attempts.entries()) {
    assert.equal(row.kind, 'route'); assert.equal(row.outcome, 'nonwin');
    if (index > 0) assert.equal(row.fromXp, prior.attempts[index - 1]?.terminalXp);
  }
  const retainedState = { ...state }; delete retainedState.priorRoute;
  auditActTwoAreaPreparation({ ...retainedState, startOrdinal: first.ordinal, fromXp: first.fromXp,
    nextOrdinal: state.startOrdinal, attempts: prior.attempts,
    completed: false, failureStatus: 'nonwin', failure: 'Retained settled route nonwin' }, prior.waves);
  return prior.attempts.length;
}

/** Restore limits only from a contiguous, independently audited training checkpoint. */
function auditTrainingCarry(state: ActTwoAreaPreparation, startRoute: number,
  prior: ActTwoTrainingCarry | undefined): ActTwoTrainingContinuation | undefined {
  if (!prior) return undefined;
  assert.equal(state.priorRoute, undefined, 'Training and route carry are exclusive');
  const previous = prior.preparation, last = previous.attempts.at(-1);
  assert.equal(previous.mode, state.mode, 'Carried preparation mode changed');
  assert.equal(previous.trainingPolicy, state.trainingPolicy, 'Carried training policy changed');
  assert.equal(previous.completed, false);
  assert.equal(previous.failureStatus, 'budget', 'Only budget-stopped training may continue');
  assert.ok(last && last.kind === 'training', 'Training carry requires a retained training attempt');
  assert.equal(previous.nextOrdinal, state.startOrdinal, 'Carried training ordinal discontinuity');
  assert.ok(prior.waves.every(wave => wave.ordinal >= previous.startOrdinal && wave.ordinal < previous.nextOrdinal),
    'Unowned carried training wave');
  assert.ok(previous.attempts.every(attempt => attempt.nextOrdinal === attempt.ordinal ||
    prior.waves.some(wave => wave.ordinal === attempt.ordinal)), 'Carried admission has no retained settled wave');
  const checked = auditActTwoAreaPreparation(previous, prior.waves).continuation;
  assert.equal(checked.routeIndex, startRoute, 'Carried training quest boundary mismatch');
  assert.equal(checked.terminalXp, state.fromXp, 'Carried training XP discontinuity');
  assert.deepEqual(new Set(checked.cleared), new Set(state.initialCleared), 'Carried training clears changed');
  return checked;
}

/** Execute the declared entry/recovery policy; native callbacks own settlement and global bounds. */
export function runAreaPreparedActTwo(profile: CampaignProfile, record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm' | 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, state: ActTwoAreaPreparation,
  prefix: readonly CampaignQuestEntry[] = [], priorRoute?: ActTwoRouteCarry,
  priorTraining?: ActTwoTrainingCarry): void {
  assert.equal(state.startOrdinal, ordinal()); assert.equal(state.attempts.length, 0);
  assert.equal(state.fromXp, totalXp());
  assert.deepEqual(state.initialCleared, useMapStore.getState().clearedSubAreas);
  assert.equal(state.resumePrefixLength, undefined, 'Preparation state already has suffix custody');
  assert.equal(state.priorRoute, undefined, 'Preparation state already has retry custody');
  assert.equal(state.priorTraining, undefined, 'Preparation state already has training custody');
  assert.ok(!priorRoute || !priorTraining, 'Training and route carry are exclusive');
  if (prefix.length) assertActTwoResumePrefix(actions, prefix);
  const startRoute = prefix.length === 20 ? 5 : prefix.length === 16 ? 4 : prefix.length === 10 ? 3 : prefix.length === 7 ? 2 : 0;
  for (const area of areas.slice(0, startRoute))
    assert.ok(state.initialCleared.includes(area), 'Prepared suffix requires preceding area clears');
  const resumePrefixLength = prefix.length === 7 || prefix.length === 10 || prefix.length === 16 || prefix.length === 20 ? prefix.length : undefined;
  const routeFirst = state.mode === 'route-first-act2-v1';
  const trainingPolicy = routeFirst ? 'cleared-level-margin-v1' : profile.recoveryTrainingPolicy;
  const resumedState = { ...state };
  if (resumePrefixLength) resumedState.resumePrefixLength = resumePrefixLength;
  if (trainingPolicy) resumedState.trainingPolicy = trainingPolicy;
  const carriedTraining = auditTrainingCarry(resumedState, startRoute, priorTraining);
  const carriedRouteAttempts = auditRouteCarry(resumedState, priorRoute);
  if (trainingPolicy) state.trainingPolicy = trainingPolicy;
  assert.ok(useMapStore.getState().isActUnlocked(2) && (routeFirst || hero().level >= 14));
  assert.ok(state.initialCleared.includes(safeFarm.area), 'Prepared Act II requires a previously cleared safe farm');
  if (resumePrefixLength) state.resumePrefixLength = resumePrefixLength;
  if (priorTraining) {
    state.priorTraining = structuredClone(priorTraining);
    record({ kind: 'act2-area-prepared-carried-training', continuation: carriedTraining,
      nextOrdinal: ordinal() });
  }
  if (priorRoute) {
    state.priorRoute = structuredClone(priorRoute);
    record({ kind: 'act2-area-prepared-carried-retries', priorRoute: state.priorRoute,
      nextOrdinal: ordinal(), remainingAttempts: routeAttemptLimit(state.mode) - carriedRouteAttempts });
  }
  let farm = carriedTraining?.farm ?? startingFarm(startRoute);
  let training = carriedTraining?.trainingAdmissions ?? 0;
  let nonwins = carriedTraining?.trainingNonwins ?? 0;
  let consecutiveNonwins = carriedTraining?.consecutiveNonwins ?? 0;
  let fallback = carriedTraining?.fallback ?? false;
  const maximumRouteAttempts = routeAttemptLimit(state.mode);
  const target = (area: string) => actTwoPreparationTarget(area, state.mode);
  const boundary = () => { growCampaignBuild(profile, record); equipCampaignGear(record, profile); };
  const attempt = (act: number, area: string, kind: ActTwoAreaAttempt['kind'], entryArea: string,
    targetLevel = target(entryArea)) => {
    const row: ActTwoAreaAttempt = { kind, entryArea, targetLevel, act, area,
      ordinal: ordinal(), nextOrdinal: ordinal(), fromLevel: hero().level, terminalLevel: hero().level,
      fromXp: totalXp(), terminalXp: totalXp(), outcome: 'interrupted', failureStatus: null };
    state.attempts.push(row);
    try {
      enter(act, area, kind === 'route' ? 'route' : 'farm');
      assert.equal(ordinal(), row.ordinal + 1, 'Prepared attempt requires exactly one native admission');
      row.outcome = 'victory';
    } catch (error) {
      row.failureStatus = error instanceof CampaignStop ? error.status : 'technical';
      if (!(error instanceof CampaignStop) || error.status !== 'nonwin' ||
        error.settledNonwin?.area !== area || error.settledNonwin.ordinal !== row.ordinal ||
        error.settledNonwin.phase !== (kind === 'route' ? 'route' : 'farm')) throw error;
      assert.equal(ordinal(), row.ordinal + 1, 'Prepared nonwin requires exactly one native admission');
      row.outcome = 'nonwin';
      if (kind === 'route') throw error;
      returnCampaignToMap();
    } finally {
      row.nextOrdinal = ordinal(); row.terminalLevel = hero().level; row.terminalXp = totalXp();
      state.nextOrdinal = ordinal(); record({ kind: 'act2-area-prepared-attempt', attempt: row });
    }
    return row;
  };
  const entry = (area: string) => {
    let areaTraining = carriedTraining?.perArea[area] ?? 0;
    const used = area === areas[startRoute]
      ? carriedTraining?.routeFirstRecovery?.routeAttempts ?? carriedRouteAttempts : 0;
    let recoveryLevel = area === areas[startRoute] ? carriedTraining?.routeFirstRecovery?.targetLevel ??
      (routeFirst && priorRoute ? (priorRoute.attempts.at(-1)?.terminalLevel ?? 0) + 1 : undefined) : undefined;
    const trainTo = (targetLevel: number) => {
      if (routeFirst && targetLevel > 32) throw new CampaignStop('budget', 'Act II recovery level ceiling reached');
      while (hero().level < targetLevel) {
        if (training >= limits.training) throw new CampaignStop('budget', 'Act II total training bound reached');
        if (areaTraining >= limits.perArea) throw new CampaignStop('budget', 'Act II area training bound reached');
        if (state.trainingPolicy === 'cleared-level-margin-v1') {
          const cleared = useMapStore.getState().clearedSubAreas;
          const selected = actTwoTrainingSource(hero().level,
            fallback ? cleared.filter(id => id === safeFarm.area) : cleared);
          if (!selected) throw new CampaignStop('budget', 'No cleared lower-level Act II training area');
          farm = selected;
        }
        assert.ok(useMapStore.getState().clearedSubAreas.includes(farm.area), 'Prepared training source has not cleared');
        boundary(); training++; areaTraining++;
        const trained = attempt(farm.act, farm.area, 'training', area, targetLevel);
        if (trained.outcome === 'nonwin') {
          nonwins++; consecutiveNonwins++; farm = safeFarm; fallback = true;
          if (nonwins >= limits.totalNonwins || consecutiveNonwins >= limits.consecutiveNonwins)
            throw new CampaignStop('nonwin', 'Act II shared training nonwin bound reached');
        } else consecutiveNonwins = 0;
      }
    };
    if (!routeFirst) trainTo(target(area));
    for (let number = used + 1; number <= maximumRouteAttempts; number++) {
      if (routeFirst && recoveryLevel !== undefined) trainTo(recoveryLevel);
      boundary();
      if (!routeFirst) assert.ok(hero().level >= target(area), 'Authored area entry level has not been earned');
      try { attempt(2, area, 'route', area); break; }
      catch (error) {
        const last = state.attempts.at(-1);
        if (!(error instanceof CampaignStop) || error.status !== 'nonwin' || number === maximumRouteAttempts ||
          last?.kind !== 'route' || last.outcome !== 'nonwin' || last.area !== area ||
          error.settledNonwin?.phase !== 'route' || error.settledNonwin.area !== area ||
          error.settledNonwin.ordinal !== last.ordinal) throw error;
        returnCampaignToMap();
        if (routeFirst) recoveryLevel = last.terminalLevel + 1;
        record({ kind: 'act2-area-prepared-retry', area, failedOrdinal: last.ordinal,
          nextOrdinal: ordinal(), nextAttempt: number + 1, maximumRouteAttempts,
          ...(routeFirst ? { recoveryLevel } : {}) });
      }
    }
    farm = { act: 2, area }; fallback = false; boundary();
  };
  try {
    const preparedActions = { ...actions, visit: (area: string, act = 2) => {
      if (area === areas[1] || area === areas[3]) entry(area);
      actions.visit(area, act);
    } };
    if (prefix.length) resumeActTwoAfterCube(profile, record, area => { entry(area); }, preparedActions, prefix, boundary);
    else {
      entry(areas[0]);
      runActTwo(profile, record, area => { entry(area); }, preparedActions, boundary);
    }
    state.completed = true;
  } catch (error) {
    state.failureStatus = error instanceof CampaignStop ? error.status : 'technical'; state.failure = String(error);
    throw error;
  } finally { state.nextOrdinal = ordinal(); }
}

/** Reconcile the entire admission span independently, including shared limits and safer-farm fallback. */
export function auditActTwoAreaPreparation(state: ActTwoAreaPreparation,
  waves: readonly CampaignWave[]): ActTwoAreaPreparationAudit {
  assert.ok(preparationModes.includes(state.mode));
  assert.ok([undefined, 'cleared-level-margin-v1'].includes(state.trainingPolicy));
  const routeFirst = state.mode === 'route-first-act2-v1';
  if (routeFirst) assert.equal(state.trainingPolicy, 'cleared-level-margin-v1');
  const maximumRouteAttempts = routeAttemptLimit(state.mode);
  const target = (area: string) => actTwoPreparationTarget(area, state.mode);
  assert.ok(state.initialCleared.includes(safeFarm.area));
  assert.ok(Number.isSafeInteger(state.startOrdinal) && state.startOrdinal >= 0);
  assert.equal(state.failureStatus === null, state.failure === null);
  assert.ok([undefined, 7, 10, 16, 20].includes(state.resumePrefixLength));
  const startRoute = state.resumePrefixLength === 20 ? 5 : state.resumePrefixLength === 16 ? 4 : state.resumePrefixLength === 10 ? 3 : state.resumePrefixLength === 7 ? 2 : 0;
  for (const area of areas.slice(0, startRoute))
    assert.ok(state.initialCleared.includes(area), 'Prepared suffix requires preceding area clears');
  const carriedTraining = auditTrainingCarry(state, startRoute, state.priorTraining);
  const cleared = new Set(state.initialCleared), nonwinOrdinals: number[] = [];
  const perArea = new Map<string, number>(Object.entries(carriedTraining?.perArea ?? {}));
  let farm = carriedTraining?.farm ?? startingFarm(startRoute);
  let next = state.startOrdinal, previousXp = state.fromXp, route = startRoute;
  let trainingAdmissions = 0, trainingNonwins = 0, xp = 0;
  let consecutiveNonwins = carriedTraining?.consecutiveNonwins ?? 0;
  const priorAdmissions = carriedTraining?.trainingAdmissions ?? 0;
  const priorNonwins = carriedTraining?.trainingNonwins ?? 0;
  const carriedRouteAttempts = auditRouteCarry(state, state.priorRoute);
  let routeAttempts = carriedTraining?.routeFirstRecovery?.routeAttempts ?? carriedRouteAttempts;
  let recoveryLevel = carriedTraining?.routeFirstRecovery?.targetLevel ??
    (routeFirst && state.priorRoute ? (state.priorRoute.attempts.at(-1)?.terminalLevel ?? 0) + 1 : undefined);
  let fallback = carriedTraining?.fallback ?? false;
  let stopped = false;
  for (const [index, row] of state.attempts.entries()) {
    assert.ok(!stopped, 'Continuation after a terminal prepared attempt');
    const entryArea = areas[route]; assert.ok(entryArea, 'Admission after the six-area route');
    assert.equal(row.entryArea, entryArea);
    assert.equal(row.targetLevel, routeFirst && row.kind === 'training' ? recoveryLevel : target(entryArea));
    assert.equal(row.ordinal, next, 'Prepared admission gap/overlap');
    assert.ok(row.nextOrdinal === next || row.nextOrdinal === next + 1, 'Prepared admission span mismatch');
    next = row.nextOrdinal;
    for (const value of [row.fromXp, row.terminalXp]) assert.ok(Number.isSafeInteger(value) && value >= 0);
    assert.ok(row.fromXp >= previousXp, 'Prepared XP went backwards between actions');
    assert.equal(row.fromLevel, levelForXp(row.fromXp)); assert.equal(row.terminalLevel, levelForXp(row.terminalXp));
    const trainingSource = state.trainingPolicy === 'cleared-level-margin-v1'
      ? actTwoTrainingSource(row.fromLevel, [...cleared].filter(id => !fallback || id === safeFarm.area)) : farm;
    const rows = waves.filter(wave => wave.ordinal === row.ordinal && wave.ordinal < row.nextOrdinal);
    assert.ok(rows.every(wave => wave.area === row.area && wave.phase === (row.kind === 'route' ? 'route' : 'farm')));
    assert.deepEqual(rows.map(wave => wave.index), rows.map((_wave, waveIndex) => waveIndex));
    for (const wave of rows) assert.ok(Number.isSafeInteger(wave.xp) && wave.xp >= 0);
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
        assert.ok(routeAttempts > 0 && routeAttempts < maximumRouteAttempts && recoveryLevel !== undefined,
          'Route-first training requires a settled route nonwin with a remaining retry');
        assert.ok(recoveryLevel <= 32, 'Route-first recovery level ceiling exceeded');
      } else assert.equal(routeAttempts, 0, 'Training inserted between route retries');
      assert.ok(row.fromLevel < row.targetLevel && cleared.has(row.area), 'Training requires a cleared source and unearned target');
      assert.ok(trainingSource, 'Training requires an eligible recovery source');
      assert.deepEqual({ act: row.act, area: row.area }, trainingSource, 'Undeclared prepared training source');
      farm = trainingSource;
      const count = (perArea.get(entryArea) ?? 0) + 1; perArea.set(entryArea, count); trainingAdmissions++;
      assert.ok(count <= limits.perArea && trainingAdmissions + priorAdmissions <= limits.training);
      if (row.outcome === 'nonwin') { trainingNonwins++; consecutiveNonwins++; farm = safeFarm; fallback = true; }
      else if (row.outcome === 'victory') consecutiveNonwins = 0;
      assert.ok(trainingNonwins + priorNonwins <= limits.totalNonwins && consecutiveNonwins <= limits.consecutiveNonwins);
      if (trainingNonwins + priorNonwins === limits.totalNonwins || consecutiveNonwins === limits.consecutiveNonwins) stopped = true;
    } else {
      assert.equal(row.kind, 'route'); assert.equal(row.act, 2); assert.equal(row.area, entryArea);
      routeAttempts++; assert.ok(routeAttempts <= maximumRouteAttempts, 'Prepared route attempt bound exceeded');
      if (routeFirst) assert.ok(recoveryLevel === undefined || row.fromLevel >= recoveryLevel,
        'Route-first retry requires its earned recovery level');
      else assert.ok(row.fromLevel >= row.targetLevel, 'Underlevel prepared area entry');
      if (row.outcome === 'victory') {
        route++; routeAttempts = 0; recoveryLevel = undefined; farm = { act: 2, area: row.area }; fallback = false;
      }
      else if (row.outcome === 'interrupted' || routeAttempts === maximumRouteAttempts) stopped = true;
      else if (routeFirst) recoveryLevel = row.terminalLevel + 1;
    }
    if (row.outcome === 'victory') cleared.add(row.area);
    if (stopped) assert.equal(index, state.attempts.length - 1);
  }
  assert.equal(state.nextOrdinal, next);
  const observed = waves.filter(wave => wave.ordinal >= state.startOrdinal && wave.ordinal < state.nextOrdinal);
  assert.equal(observed.length, state.attempts.reduce((sum, row) => sum + waves.filter(wave =>
    wave.ordinal === row.ordinal && wave.ordinal < row.nextOrdinal).length, 0), 'Unowned prepared wave');
  assert.equal(state.completed, route === areas.length && state.failureStatus === null);
  if (!state.completed) assert.ok(state.failureStatus !== null);
  return { completed: state.completed, admissions: next - state.startOrdinal, carriedRouteAttempts, trainingAdmissions, trainingNonwins,
    routeAreas: route - startRoute, xp, nonwinOrdinals,
    continuation: { routeIndex: route, terminalXp: previousXp, cleared: [...cleared],
      trainingAdmissions: trainingAdmissions + priorAdmissions, trainingNonwins: trainingNonwins + priorNonwins,
      consecutiveNonwins, perArea: Object.fromEntries(perArea), farm, fallback,
      ...(routeFirst && recoveryLevel !== undefined ? { routeFirstRecovery: { routeAttempts, targetLevel: recoveryLevel } } : {}) } };
}

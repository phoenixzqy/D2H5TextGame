import { fileURLToPath } from 'node:url';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { getAllocatedSkillLevel, getSkillRequiredLevel, getSkillsForClass,
  skillIdAliases } from '@/stores/skillsHelpers';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState, observeStore } from './earned-state';
import { collectSourceState } from './provenance';
import { assertEarnedSourceStable } from './earned-measurement';
import { startEarnedRun, playEarnedWave } from './earned-playback';
import type { EarnedState, EarnedCombatState } from './earned-state';
import type { EarnedRunHandle, EarnedWave } from './earned-playback';
import type { SourceState } from './provenance';

export interface RestoredModeOptions {
  readonly mode: 'manual' | 'idle';
  readonly idleEliteMisses: 0 | 11;
}
export interface ModeBaselineAction {
  readonly kind: 'hire-merc' | 'allocate-skill' | 'set-combo';
  readonly before: EarnedState;
  readonly after: EarnedState;
  readonly result: { readonly ok: boolean; readonly reason?: string; readonly productionResult?: unknown };
}
export interface RestoredModeAttempt {
  readonly baselineTag: 'restored-test-baseline-v1';
  readonly options: RestoredModeOptions;
  readonly clockEpochMs: number;
  readonly scope: { readonly synthetic: true; readonly uiEligible: false;
    readonly syntheticClear: false; readonly routingExercised: false };
  readonly status: 'completed' | 'baseline-refused';
  readonly refusal: { readonly actionIndex: number; readonly reason: string } | null;
  readonly created: EarnedState;
  readonly actions: readonly ModeBaselineAction[];
  readonly baseline: EarnedState;
  readonly baselineCombat: EarnedCombatState;
  readonly baselinePity: number;
  readonly handle: EarnedRunHandle | null;
  readonly waves: readonly (EarnedWave & { readonly pityBefore: number; readonly pityAfter: number })[];
  readonly terminal: EarnedState;
  readonly terminalCombat: EarnedCombatState;
  readonly terminalPity: number;
  readonly sourceBefore: SourceState;
  readonly sourceAfter: SourceState;
  readonly timings: { readonly logicalSimSeconds: number; readonly uiDelayHintSeconds: number;
    readonly wallSeconds: number };
}
function parseOptions(input: unknown): RestoredModeOptions {
  if (typeof input !== 'object' || input === null || Object.getPrototypeOf(input) !== Object.prototype)
    throw new Error('Invalid restored mode options');
  const fields = Object.getOwnPropertyDescriptors(input);
  if (Reflect.ownKeys(input).length !== 2 || !fields.mode || !fields.idleEliteMisses ||
    !('value' in fields.mode) || !('value' in fields.idleEliteMisses) ||
    (fields.mode.value !== 'manual' && fields.mode.value !== 'idle') ||
    (fields.idleEliteMisses.value !== 0 && fields.idleEliteMisses.value !== 11))
    throw new Error('Invalid restored mode options');
  return { mode: fields.mode.value as RestoredModeOptions['mode'],
    idleEliteMisses: fields.idleEliteMisses.value as RestoredModeOptions['idleEliteMisses'] };
}

const CLOCK = 1792497600000;
const AREA = 'areas/act1-blood-moor';
const FIRE = 'skills-sorceress-fire-bolt';
const MERC = 'mercs/act1-rogue-inner-sight';
type ModeObservation = Omit<RestoredModeAttempt, 'sourceBefore' | 'sourceAfter' | 'timings'> & {
  timings: Omit<RestoredModeAttempt['timings'], 'wallSeconds'>;
};

function executeMode(options: RestoredModeOptions): ModeObservation {
  usePlayerStore.getState().setPlayer(createMockPlayer('Restored mode diagnostic', 'sorceress'));
  const created = observeEarnedState();
  useMapStore.getState().setCurrentLocation(1, AREA);
  setIdleEliteMisses(options.idleEliteMisses);
  const actions: ModeBaselineAction[] = [];
  let refusal: RestoredModeAttempt['refusal'] = null;
  function action(kind: ModeBaselineAction['kind'], apply: () => ModeBaselineAction['result']) {
    const before = observeEarnedState();
    const result = apply();
    actions.push({ kind, before, result: structuredClone(result), after: observeEarnedState() });
    if (!result.ok) refusal = { actionIndex: actions.length - 1, reason: result.reason ?? 'baseline-refused' };
  }
  action('hire-merc', () => {
    const act = loadMercHireRoster().find(entry => entry.mercs.some(merc => merc.id === MERC));
    const def = act?.mercs.find(merc => merc.id === MERC);
    if (!act || !def) throw new Error('Missing restored baseline merc definition');
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Restored baseline lost player');
    if (player.level < act.unlockReqLevel) return { ok: false, reason: 'hire-act-locked' };
    const result = useMercStore.getState().hireMerc(def);
    return { ...result, productionResult: result };
  });
  if (!refusal) action('allocate-skill', () => {
    const result = usePlayerStore.getState().allocateSkillPoint(FIRE);
    return result === 'ok' ? { ok: true, productionResult: result }
      : { ok: false, reason: result, productionResult: result };
  });
  if (!refusal) action('set-combo', () => {
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Restored baseline lost player');
    const aliases = skillIdAliases(FIRE);
    const skill = getSkillsForClass(player.class).find(entry => aliases.includes(entry.id));
    if (!skill || skill.trigger !== 'active' || player.level < getSkillRequiredLevel(skill) ||
      getAllocatedSkillLevel(player.skillLevels ?? {}, skill.id) < 1)
      return { ok: false, reason: 'combo-unavailable' };
    usePlayerStore.getState().setComboOrder([FIRE]);
    return { ok: true };
  });
  const baseline = observeEarnedState();
  const baselineCombat = observeStore(useCombatStore);
  const baselinePity = getIdleEliteMisses();
  let handle: EarnedRunHandle | null = null;
  const waves: (EarnedWave & { pityBefore: number; pityAfter: number })[] = [];
  if (!refusal) {
    handle = startEarnedRun({ act: 1, subAreaId: AREA, mode: options.mode,
      runSeed: 2330410254, challengeOrdinal: 0 });
    if (handle.totalWaves !== 3) throw new Error('Restored Blood Moor diagnostic requires exactly three native waves');
    for (let index = 0; index < handle.totalWaves; index++) {
      const pityBefore = getIdleEliteMisses();
      const wave = playEarnedWave(handle, index);
      waves.push({ ...wave, pityBefore, pityAfter: getIdleEliteMisses() });
      if (wave.advanceResult !== 'next-wave') break;
    }
    const last = waves.at(-1);
    if (!last || (last.advanceResult !== 'victory' && last.advanceResult !== 'defeat'))
      throw new Error('Restored mode did not reach a native terminal result');
  }
  return { baselineTag: 'restored-test-baseline-v1', options, clockEpochMs: CLOCK,
    scope: { synthetic: true, uiEligible: false, syntheticClear: false, routingExercised: false },
    status: refusal ? 'baseline-refused' : 'completed', refusal, created, actions, baseline, baselineCombat,
    baselinePity, handle, waves, terminal: observeEarnedState(),
    terminalCombat: observeStore(useCombatStore), terminalPity: getIdleEliteMisses(),
    timings: {
      logicalSimSeconds: waves.reduce((sum, wave) => sum + wave.terminalSimClockMs / 1000, 0),
      uiDelayHintSeconds: waves.reduce((sum, wave) => sum + wave.opening.recordedEvents
        .reduce((n, event) => n + event.uiDelayMs / 1000, 0), 0)
    } };
}

/**
 * Observe one closed, synthetic direct-service run; no earned UI eligibility is claimed.
 * Restores all seven caller stores/methods, clock and pity, preserving original errors.
 * Does not initialize persistence or reset process-global identity/ordinal allocators.
 */
export function runRestoredModeOnce(input: unknown): RestoredModeAttempt {
  const options = parseOptions(input);
  if (hasActiveSubAreaRun()) throw new Error('Cannot observe mode with an active production run');
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const sourceBefore = collectSourceState(root);
  const restorers = captureEarnedRestorers();
  const originalNow = Date.now;
  const originalPity = getIdleEliteMisses();
  const wallStart = performance.now();
  let observation: ModeObservation | undefined;
  let sourceAfter: SourceState | undefined;
  let failed = false; let failure: unknown;
  const errors: unknown[] = [];
  try {
    Date.now = () => CLOCK;
    resetEarnedStores();
    setIdleEliteMisses(0);
    observation = executeMode(options);
  } catch (error) { failed = true; failure = error; }
  finally {
    try { abortSubAreaRun(); } catch (error) { errors.push(error); }
    for (const restore of restorers) {
      try { restore(); } catch (error) { errors.push(error); }
    }
    try { setIdleEliteMisses(originalPity); } catch (error) { errors.push(error); }
    try { Date.now = originalNow; } catch (error) { errors.push(error); }
    try {
      sourceAfter = collectSourceState(root);
      assertEarnedSourceStable(sourceBefore, sourceAfter);
    } catch (error) { errors.push(error); }
  }
  if (errors.length) {
    if (!failed && errors.length === 1) throw errors[0];
    throw new AggregateError(failed ? [failure, ...errors] : errors, 'Restored mode cleanup/source verification failed');
  }
  if (failed) throw failure;
  if (!observation || !sourceAfter) throw new Error('Missing restored mode observation');
  return { ...observation, sourceBefore, sourceAfter,
    timings: { ...observation.timings, wallSeconds: (performance.now() - wallStart) / 1000 } };
}

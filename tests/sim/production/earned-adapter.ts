import { fileURLToPath } from 'node:url';
import { itemBases, skills, subAreas } from '@/data/index';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { getAllocatedSkillLevel, getSkillRequiredLevel, getSkillsForClass,
  skillIdAliases } from '@/stores/skillsHelpers';
import { parseEarnedFixture, type EarnedAction, type EarnedFixture } from './earned-fixture';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores,
  selectEarnedBackpackItem, type EarnedState } from './earned-state';
import { abandonEarnedNextWave, playEarnedTarget, playEarnedWave, startEarnedRun,
  type EarnedRunHandle, type EarnedWave } from './earned-playback';
import { assertSourceStable, collectSourceState, type SourceState } from './provenance';

const classes = Object.values(import.meta.glob<{ id: string }>(
  '../../../src/data/classes/*.json', { eager: true, import: 'default' }));

interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly productionResult?: unknown;
  readonly steps?: readonly string[];
  readonly itemId?: string;
}
interface FarmAttempt {
  readonly handle: EarnedRunHandle;
  readonly waves: readonly EarnedWave[];
  readonly abandoned: ReturnType<typeof abandonEarnedNextWave> | null;
}
interface ActionObservation {
  readonly index: number;
  readonly action: EarnedAction;
  readonly before: EarnedState;
  readonly after: EarnedState;
  readonly result: ActionResult;
  readonly farms: readonly FarmAttempt[];
}

function applyAction(action: Exclude<EarnedAction, { kind: 'farm-first-waves' }>, journal: readonly Item[]): ActionResult {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Earned action lost production player');
  switch (action.kind) {
    case 'hire-merc': {
      const act = loadMercHireRoster().find(entry => entry.mercs.some(merc => merc.id === action.mercId));
      const def = act?.mercs.find(merc => merc.id === action.mercId);
      if (!act || !def) throw new Error('Validated hire-roster entry disappeared');
      if (player.level < act.unlockReqLevel) return { ok: false, reason: 'hire-act-locked' };
      const result = useMercStore.getState().hireMerc(def);
      return result.ok ? { ok: true, productionResult: result }
        : { ok: false, reason: result.reason ?? 'hire-refused', productionResult: result };
    }
    case 'allocate-skill': {
      const steps: string[] = [];
      for (let point = 0; point < action.points; point++) {
        const result = usePlayerStore.getState().allocateSkillPoint(action.skillId);
        steps.push(result);
        if (result !== 'ok') return { ok: false, reason: result, productionResult: result, steps };
      }
      return { ok: true, productionResult: 'ok', steps };
    }
    case 'set-combo': {
      const templates = getSkillsForClass(player.class);
      for (const id of action.skillIds) {
        const aliases = skillIdAliases(id);
        const skill = templates.find(entry => aliases.includes(entry.id));
        if (!skill || skill.trigger !== 'active' || player.level < getSkillRequiredLevel(skill) ||
          getAllocatedSkillLevel(player.skillLevels ?? {}, skill.id) < 1)
          return { ok: false, reason: 'combo-unavailable' };
      }
      usePlayerStore.getState().setComboOrder([...action.skillIds]);
      return { ok: true };
    }
    case 'allocate-stats': {
      const result = usePlayerStore.getState().allocateStatPoints(action.deltas, player);
      return result === 'ok' ? { ok: true, productionResult: result }
        : { ok: false, reason: result, productionResult: result };
    }
    case 'equip-earned': {
      const item = selectEarnedBackpackItem(action.selector, action.slot, journal,
        useInventoryStore.getState().backpack);
      if (!item) return { ok: false, reason: 'earned-item-unavailable' };
      const result = action.owner === 'hero'
        ? useInventoryStore.getState().equipItem(item)
        : useMercStore.getState().equipOnMerc(action.mercId, action.slot, item);
      return result.ok ? { ok: true, productionResult: result, itemId: item.id }
        : { ok: false, reason: result.reason, productionResult: result, itemId: item.id };
    }
    case 'accept-quest': {
      const quest = loadQuests().find(entry => entry.id === action.questId);
      if (!quest) throw new Error('Validated quest disappeared');
      const map = useMapStore.getState();
      const status = map.questProgress[quest.id]?.status ??
        (quest.prerequisites?.some(id => map.questProgress[id]?.status !== 'completed') ? 'locked' : 'available');
      if (status !== 'available') return { ok: false, reason: 'quest-unavailable' };
      map.updateQuestProgress(quest.id, { status: 'inProgress',
        objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) });
      return { ok: true };
    }
    case 'checkpoint': return { ok: true };
  }
}

function executeRecipe(fixture: EarnedFixture, targetSeed: number) {
  usePlayerStore.getState().setPlayer(createMockPlayer(fixture.origin.name, fixture.origin.classId));
  const created = observeEarnedState();
  const actions: ActionObservation[] = [];
  const checkpoints: { id: string; state: EarnedState }[] = [];
  const acquisitionJournal: Item[] = [];
  let preTarget: EarnedState | null = null;
  let target: ReturnType<typeof playEarnedTarget> | null = null;
  const finish = (status: 'completed' | 'action-refused' | 'preparation-nonwin',
    refusal: { actionIndex: number; reason: string } | null = null) => {
    const attemptedWaves = [...actions.flatMap(action => action.farms.flatMap(farm => farm.waves)),
      ...(target?.waves ?? [])];
    return { status, refusal, created, actions, checkpoints, acquisitionJournal, preTarget, target,
      terminal: observeEarnedState(), timings: {
        logicalSimSeconds: attemptedWaves.reduce((sum, wave) => sum + wave.terminalSimClockMs / 1000, 0),
        uiDelayHintSeconds: attemptedWaves.reduce((sum, wave) => sum + wave.opening.recordedEvents
          .reduce((n, event) => n + event.uiDelayMs / 1000, 0), 0)
      } };
  };
  for (const [index, action] of fixture.actions.entries()) {
    const before = observeEarnedState();
    const farms: FarmAttempt[] = [];
    let result: ActionResult;
    if (action.kind === 'farm-first-waves') {
      result = { ok: true };
      for (let ordinal = 0; ordinal < action.count; ordinal++) {
        useMapStore.getState().setCurrentLocation(1, action.subAreaId);
        setIdleEliteMisses(0);
        const handle = startEarnedRun({ act: 1, subAreaId: action.subAreaId, mode: 'manual',
          challengeOrdinal: ordinal }); // No acquisition runSeed override.
        const wave = playEarnedWave(handle, 0);
        const addedIds = new Set(wave.actualDelta.addedItems.map(item => item.id));
        acquisitionJournal.push(...structuredClone(wave.rawRewardDelta.items.filter(item => addedIds.has(item.id))));
        const heroId = wave.beforeAward.player.player?.id;
        const wonAlive = wave.opening.outcome?.winner === 'player' &&
          wave.opening.outcome.finalPlayerTeam.some(unit => unit.id === heroId && unit.life > 0);
        if (!wonAlive) {
          farms.push({ handle, waves: [wave], abandoned: null });
          result = { ok: false, reason: 'preparation-nonwin' };
          break;
        }
        if (wave.advanceResult !== 'next-wave') throw new Error('Preparation W1 did not install W2');
        farms.push({ handle, waves: [wave], abandoned: abandonEarnedNextWave() });
      }
    } else {
      result = applyAction(action, acquisitionJournal);
    }
    const after = observeEarnedState();
    actions.push({ index, action: structuredClone(action), before, after, result, farms });
    if (!result.ok) return finish(result.reason === 'preparation-nonwin'
      ? 'preparation-nonwin' : 'action-refused', { actionIndex: index, reason: result.reason ?? 'action-refused' });
    if (action.kind === 'checkpoint') checkpoints.push({ id: action.id, state: observeEarnedState() });
  }
  preTarget = observeEarnedState();
  useMapStore.getState().setCurrentLocation(fixture.scenario.act, fixture.scenario.subAreaId);
  setIdleEliteMisses(fixture.scenario.idleEliteMisses);
  target = playEarnedTarget(startEarnedRun({ act: fixture.scenario.act, subAreaId: fixture.scenario.subAreaId,
    mode: fixture.scenario.mode, runSeed: targetSeed, challengeOrdinal: fixture.scenario.challengeOrdinal }));
  return finish('completed');
}

/**
 * Execute exactly one bounded recipe in a dedicated Node simulation realm.
 * Expected action refusals retain partial evidence; structural/source/cleanup
 * errors throw. Caller stores/methods, clock and pity are always restored.
 * This does not initialize persistence or reset process-global identity counters.
 */
export function runEarnedRecipeOnce(input: unknown, options: { targetSeed: number; repetition: 1 | 2 }) {
  if (hasActiveSubAreaRun()) throw new Error('Cannot execute earned recipe with an active production run');
  const fixture = parseEarnedFixture(input, { classes, areas: subAreas, skills,
    mercs: loadMercHireRoster().flatMap(act => act.mercs),
    bases: itemBases.flatMap(({ id, slot }) => slot === null ? [] : [{ id, slot }]), quests: loadQuests() });
  if (!fixture.seeds.includes(options.targetSeed) || (options.repetition !== 1 && options.repetition !== 2))
    throw new Error('Invalid earned target seed or repetition');
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const sourceBefore = collectSourceState(root);
  const restorers = captureEarnedRestorers();
  const originalPity = getIdleEliteMisses();
  const originalNow = Date.now;
  const wallStart = performance.now();
  let attempt: ReturnType<typeof executeRecipe> | undefined;
  let sourceAfter: SourceState | undefined;
  let failed = false;
  let failure: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    Date.now = () => fixture.clockEpochMs;
    resetEarnedStores(); // Includes meta; anchor is now the frozen production clock.
    setIdleEliteMisses(0);
    attempt = executeRecipe(fixture, options.targetSeed);
  } catch (error) { failed = true; failure = error; }
  finally {
    try { abortSubAreaRun(); } catch (error) { cleanupErrors.push(error); }
    for (const restore of restorers) {
      try { restore(); } catch (error) { cleanupErrors.push(error); }
    }
    try { setIdleEliteMisses(originalPity); } catch (error) { cleanupErrors.push(error); }
    try { Date.now = originalNow; } catch (error) { cleanupErrors.push(error); }
    try {
      sourceAfter = collectSourceState(root);
      assertSourceStable(sourceBefore, sourceAfter);
    } catch (error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length > 0) {
    if (!failed && cleanupErrors.length === 1) throw cleanupErrors[0];
    throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors,
      'Earned recipe cleanup/source verification failed');
  }
  if (failed) throw failure;
  if (!attempt || !sourceAfter) throw new Error('Earned attempt did not produce complete evidence');
  return { fixture, targetSeed: options.targetSeed, repetition: options.repetition,
    sourceBefore, sourceAfter, ...attempt,
    timings: { ...attempt.timings, wallSeconds: (performance.now() - wallStart) / 1000 } };
}
export type EarnedAttempt = ReturnType<typeof runEarnedRecipeOnce>;

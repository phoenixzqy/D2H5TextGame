import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { StoreApi } from 'zustand';
import { subAreas } from '@/data/index';
import { createMockPlayer, CHARACTER_CLASSES } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import type { CombatUnit, CombatSide } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { WavePresentation } from '@/engine/combat';
import type { KillRewards } from '@/engine/loot/award';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore, type RecordedBattleOutcome } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  hasActiveSubAreaRun,
  startSubAreaRun
} from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { canonicalJson, parseFixture, type FreshFixture, type RunProvenance } from './fixture';
import { buildRunProvenance, collectSourceState, type SourceState } from './provenance';

const classes = Object.values(
  import.meta.glob<{ id: string }>('../../../src/data/classes/*.json', {
    eager: true,
    import: 'default'
  })
);
type AdvanceResult = ReturnType<typeof advanceWaveOrFinish>;
interface ProgressSnapshot {
  readonly inventory: {
    readonly backpack: readonly Item[];
    readonly stash: readonly Item[];
    readonly equipped: Readonly<Record<string, Item | null>>;
  };
  readonly currencies: Readonly<Record<string, number>>;
  readonly xp: { readonly level: number; readonly intoLevel: number; readonly cumulative: number };
  readonly map: Pick<
    ReturnType<typeof useMapStore.getState>,
    'currentAct' | 'currentSubAreaId' | 'discoveredAreas' | 'clearedSubAreas' | 'questProgress'
  >;
}
export interface ProgressDelta {
  readonly before: ProgressSnapshot;
  readonly after: ProgressSnapshot;
  readonly addedItems: readonly Item[];
  readonly removedItemIds: readonly string[];
  readonly currencies: Readonly<Record<string, number>>;
  readonly xp: number;
  readonly addedClears: readonly string[];
}
export interface MeasuredWave {
  readonly waveIndex: number;
  readonly presentation: WavePresentation | null;
  readonly initialPlayerTeam: readonly CombatUnit[];
  readonly initialEnemyTeam: readonly CombatUnit[];
  readonly events: readonly RecordedBattleEvent[];
  readonly outcome: RecordedBattleOutcome;
  readonly terminalSimClockMs: number;
  readonly eventCount: number;
  readonly eventHash: string;
  readonly eventHashAlgorithm: 'sha256-canonical-json-v1';
  readonly advanceResult: AdvanceResult;
  readonly planSeed: number;
  readonly enemyGenerationSeed: number;
  readonly battleSeed: number;
  readonly rewardSeed: number;
  /** Observed award deltas, independent of winner eligibility; no private-call instrumentation. */
  readonly rewardApplied: boolean;
  readonly slainEnemyIds: readonly string[];
  readonly rawRewardDelta: KillRewards;
  readonly actualDelta: ProgressDelta;
  readonly productionRunVictory: boolean;
  readonly productionMarkedClear: boolean;
  readonly diagnostics: readonly string[];
}
export interface MeasuredRun {
  readonly seed: number;
  readonly repetition: number;
  readonly initialPlayer: Player;
  readonly totalExpectedWaves: number;
  readonly waves: readonly MeasuredWave[];
  readonly productionTerminalStatus: AdvanceResult;
  readonly productionRunVictory: boolean;
  readonly productionMarkedClear: boolean;
  readonly allExpectedWavesWonByPlayer: boolean;
  readonly rawRunRewards: KillRewards;
  readonly actualDelta: ProgressDelta;
  readonly logicalSimSeconds: number;
  readonly uiDelayHintSeconds: number;
  readonly wallSeconds: number;
  readonly diagnostics: readonly string[];
}
export interface RepeatComparison {
  readonly seed: number;
  readonly rawWaveRecordingsEqual: boolean;
  readonly rawRewardsEqual: boolean;
  readonly semanticRewardsIgnoringOnlyTopLevelItemIdEqual: boolean;
  readonly itemIdentityAssessment: 'equal' | 'different' | 'unexercised';
  readonly rewardPathCoverage: 'exercised' | 'unexercised';
  readonly fullRawReplayEqual: boolean;
}
export interface FreshMeasurementReport {
  readonly reportVersion: 1;
  readonly fixture: FreshFixture;
  readonly provenance: RunProvenance;
  readonly sourceState: SourceState;
  readonly itemAllocator: {
    readonly scope: 'process-global';
    readonly resetPerformed: false;
    readonly initialSequence: 'not-observed';
  };
  readonly idleComparison: { readonly eligible: false; readonly reason: string };
  readonly scope: string;
  readonly rewardObservationPolicy: 'actual-progression-and-raw-reward-deltas-v1';
  readonly runs: readonly MeasuredRun[];
  readonly comparisons: readonly RepeatComparison[];
}

/** Compare reward meaning while retaining every field except top-level Item.id. */
export function semanticItem(item: Item): Omit<Item, 'id'> {
  const { id: _id, ...rest } = item;
  return rest;
}

/** SHA-256 over UTF-8 canonical JSON of every raw event, including timing and identities. */
export function hashRecordedEvents(events: readonly RecordedBattleEvent[]): string {
  return createHash('sha256').update(canonicalJson(events)).digest('hex');
}

/** Observe awarded values without hiding anomalies behind a player-winner eligibility test. */
export function hasObservedAward(delta: ProgressDelta, rewards: KillRewards): boolean {
  return (
    delta.xp > 0 ||
    delta.addedItems.length > 0 ||
    Object.values(delta.currencies).some((amount) => amount > 0) ||
    rewards.items.length > 0 ||
    [rewards.runeShards, rewards.runes, rewards.gems, rewards.wishstones].some(
      (amount) => amount > 0
    )
  );
}

/** A null winner has no available end reason; detect progression without inventing one. */
export function diagnoseNonwinningAdvance(
  winner: CombatSide | null,
  result: AdvanceResult,
  markedClear: boolean
): string[] {
  return winner !== 'player' && (result === 'next-wave' || result === 'victory' || markedClear)
    ? ['non-player-wave-advanced']
    : [];
}

function snapshotStore<S extends object>(
  store: Pick<StoreApi<S>, 'getState' | 'setState'>
): () => void {
  const original = store.getState();
  const data = structuredClone(
    Object.fromEntries(Object.entries(original).filter(([, value]) => typeof value !== 'function'))
  );
  return () => {
    store.setState({ ...original, ...data }, true);
  };
}
function resetFreshStores(): void {
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useMercStore.getState().reset();
  useFormationStore.getState().reset();
  useCombatStore.getState().reset();
  setIdleEliteMisses(0);
}
function progress(): ProgressSnapshot {
  const inventory = useInventoryStore.getState();
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Measurement lost production player');
  const map = useMapStore.getState();
  return structuredClone({
    inventory: {
      backpack: inventory.backpack,
      stash: inventory.stash,
      equipped: inventory.equipped
    },
    currencies: inventory.currencies,
    xp: {
      level: player.level,
      intoLevel: player.experience,
      cumulative: xpTotal(player.level) + player.experience
    },
    map: {
      currentAct: map.currentAct,
      currentSubAreaId: map.currentSubAreaId,
      discoveredAreas: map.discoveredAreas,
      clearedSubAreas: map.clearedSubAreas,
      questProgress: map.questProgress
    }
  });
}
function inventoryItems(snapshot: ProgressSnapshot): readonly Item[] {
  return [
    ...snapshot.inventory.backpack,
    ...snapshot.inventory.stash,
    ...Object.values(snapshot.inventory.equipped).filter((item): item is Item => item !== null)
  ];
}
function difference(before: ProgressSnapshot, after: ProgressSnapshot): ProgressDelta {
  const previousItems = inventoryItems(before);
  const nextItems = inventoryItems(after);
  return {
    before,
    after,
    addedItems: nextItems.filter(
      (item) => !previousItems.some((previous) => previous.id === item.id)
    ),
    removedItemIds: previousItems
      .filter((item) => !nextItems.some((next) => next.id === item.id))
      .map((item) => item.id),
    currencies: Object.fromEntries(
      [...new Set([...Object.keys(before.currencies), ...Object.keys(after.currencies)])]
        .sort()
        .map((id) => [id, (after.currencies[id] ?? 0) - (before.currencies[id] ?? 0)])
    ),
    xp: after.xp.cumulative - before.xp.cumulative,
    addedClears: after.map.clearedSubAreas.filter((id) => !before.map.clearedSubAreas.includes(id))
  };
}
function rewardDifference(before: KillRewards, after: KillRewards): KillRewards {
  return structuredClone({
    items: after.items.slice(before.items.length),
    runeShards: after.runeShards - before.runeShards,
    runes: after.runes - before.runes,
    gems: after.gems - before.gems,
    wishstones: after.wishstones - before.wishstones
  });
}
function measureOnce(fixture: FreshFixture, seed: number, repetition: number): MeasuredRun {
  const wallStart = performance.now();
  resetFreshStores();
  const cls = CHARACTER_CLASSES.find((id) => id === fixture.origin.classId);
  if (!cls) throw new Error('Production class has no creation implementation');
  const player = createMockPlayer(fixture.origin.name, cls);
  const initialPlayer = structuredClone(player);
  usePlayerStore.getState().setPlayer(player);
  useMapStore.getState().setCurrentLocation(fixture.scenario.act, fixture.scenario.subAreaId);
  const initialProgress = progress();
  const handle = startSubAreaRun({
    subAreaId: fixture.scenario.subAreaId,
    act: fixture.scenario.act,
    mode: fixture.scenario.mode,
    runSeed: seed,
    challengeOrdinal: fixture.scenario.challengeOrdinal
  });
  if (!handle || !Number.isInteger(handle.totalWaves) || handle.totalWaves < 1)
    throw new Error('Production did not start a bounded run');
  const waves: MeasuredWave[] = [];
  let terminal: AdvanceResult = 'idle';
  for (let waveIndex = 0; waveIndex < handle.totalWaves; waveIndex++) {
    const state = useCombatStore.getState();
    if (
      state.currentWave !== waveIndex + 1 ||
      state.totalWaves !== handle.totalWaves ||
      state.eventCursor !== 0
    )
      throw new Error('Invalid production wave progression');
    const captured = structuredClone({
      initialPlayerTeam: state.playerTeam,
      initialEnemyTeam: state.enemyTeam,
      events: state.recordedEvents,
      outcome: state.outcome,
      presentation: state.currentWavePresentation
    });
    if (!captured.outcome) throw new Error('Missing production outcome');
    const end = captured.events.at(-1);
    if (!end || end.kind !== 'end') throw new Error('Missing actual terminal end event');
    for (let count = 0; !useCombatStore.getState().playbackComplete; count++) {
      if (count >= captured.events.length)
        throw new Error('Playback exceeded recorded event count');
      const previousCursor = useCombatStore.getState().eventCursor;
      useCombatStore.getState().advanceEvent();
      if (useCombatStore.getState().eventCursor <= previousCursor)
        throw new Error('Playback cursor did not progress');
    }
    const before = progress();
    const previousRewards = structuredClone(useCombatStore.getState().runRewards);
    const advanceResult = advanceWaveOrFinish(); // Exactly one finalization per recorded wave.
    const after = progress();
    const actualDelta = difference(before, after);
    const rawRewardDelta = rewardDifference(previousRewards, useCombatStore.getState().runRewards);
    const productionRunVictory = useCombatStore.getState().runVictory;
    const productionMarkedClear = useMapStore.getState().isCleared(fixture.scenario.subAreaId);
    const slainEnemyIds = captured.outcome.finalEnemyTeam
      .filter((unit) => unit.life <= 0 && inferKind(unit) !== 'summon')
      .map((unit) => unit.id);
    const rewardApplied = hasObservedAward(actualDelta, rawRewardDelta);
    const waveSeed = (handle.runSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0;
    waves.push({
      ...captured,
      outcome: captured.outcome,
      waveIndex,
      terminalSimClockMs: end.simClockMs,
      eventCount: captured.events.length,
      eventHash: hashRecordedEvents(captured.events),
      eventHashAlgorithm: 'sha256-canonical-json-v1',
      advanceResult,
      planSeed: handle.runSeed,
      enemyGenerationSeed: waveSeed,
      battleSeed: waveSeed,
      rewardSeed: (handle.runSeed ^ 0x9e3779b1 ^ waveIndex) >>> 0,
      rewardApplied,
      slainEnemyIds,
      rawRewardDelta,
      actualDelta,
      productionRunVictory,
      productionMarkedClear,
      diagnostics: [
        ...diagnoseNonwinningAdvance(captured.outcome.winner, advanceResult, productionMarkedClear),
        ...(captured.outcome.winner !== 'player' && rewardApplied
          ? ['non-player-wave-awarded-rewards']
          : [])
      ]
    });
    terminal = advanceResult;
    if (advanceResult === 'next-wave') {
      if (
        waveIndex + 1 >= handle.totalWaves ||
        !hasActiveSubAreaRun() ||
        useCombatStore.getState().currentWave !== waveIndex + 2
      )
        throw new Error('Invalid next-wave progression');
    } else {
      if ((advanceResult !== 'victory' && advanceResult !== 'defeat') || hasActiveSubAreaRun())
        throw new Error('Production run failed to terminate');
      break;
    }
  }
  return {
    seed,
    repetition,
    initialPlayer,
    totalExpectedWaves: handle.totalWaves,
    waves,
    productionTerminalStatus: terminal,
    productionRunVictory: useCombatStore.getState().runVictory,
    productionMarkedClear: useMapStore.getState().isCleared(fixture.scenario.subAreaId),
    allExpectedWavesWonByPlayer:
      waves.length === handle.totalWaves && waves.every((wave) => wave.outcome.winner === 'player'),
    rawRunRewards: structuredClone(useCombatStore.getState().runRewards),
    actualDelta: difference(initialProgress, progress()),
    logicalSimSeconds: waves.reduce((sum, wave) => sum + wave.terminalSimClockMs / 1000, 0),
    uiDelayHintSeconds: waves.reduce(
      (sum, wave) => sum + wave.events.reduce((n, event) => n + event.uiDelayMs / 1000, 0),
      0
    ),
    wallSeconds: (performance.now() - wallStart) / 1000,
    diagnostics: waves.flatMap((wave) => wave.diagnostics)
  };
}
const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
/** Explicitly separate raw battle replay, raw reward identity, and id-only reward semantics. */
export function compareRepetitions(first: MeasuredRun, second: MeasuredRun): RepeatComparison {
  const rawWaveRecordingsEqual = sameJson(
    first.waves.map(({ initialPlayerTeam, initialEnemyTeam, events, outcome, presentation }) => ({
      initialPlayerTeam,
      initialEnemyTeam,
      events,
      outcome,
      presentation
    })),
    second.waves.map(({ initialPlayerTeam, initialEnemyTeam, events, outcome, presentation }) => ({
      initialPlayerTeam,
      initialEnemyTeam,
      events,
      outcome,
      presentation
    }))
  );
  const rawRewardsEqual = sameJson(first.rawRunRewards, second.rawRunRewards);
  const semantic = (rewards: KillRewards) => ({
    ...rewards,
    items: rewards.items.map(semanticItem)
  });
  const hasItems = first.rawRunRewards.items.length + second.rawRunRewards.items.length > 0;
  return {
    seed: first.seed,
    rawWaveRecordingsEqual,
    rawRewardsEqual,
    semanticRewardsIgnoringOnlyTopLevelItemIdEqual: sameJson(
      semantic(first.rawRunRewards),
      semantic(second.rawRunRewards)
    ),
    itemIdentityAssessment: hasItems
      ? sameJson(first.rawRunRewards.items, second.rawRunRewards.items)
        ? 'equal'
        : 'different'
      : 'unexercised',
    rewardPathCoverage: [...first.waves, ...second.waves].some((wave) =>
      hasObservedAward(wave.actualDelta, wave.rawRewardDelta)
    )
      ? 'exercised'
      : 'unexercised',
    fullRawReplayEqual: sameJson(replayContent(first), replayContent(second))
  };
}
function replayContent(run: MeasuredRun): Omit<MeasuredRun, 'wallSeconds' | 'repetition'> {
  const { wallSeconds: _wall, repetition: _repetition, ...content } = run;
  return content;
}

/**
 * Run exactly two fresh, unmodified production creations for each bounded recipe seed.
 * Temporarily declares adapter readiness without initializing persistence, then
 * restores the caller's exact hydration state alongside its gameplay domains.
 */
export function runFreshMeasurement(input: unknown): FreshMeasurementReport {
  if (hasActiveSubAreaRun())
    throw new Error('Cannot measure with an active production sub-area run');
  const fixture = parseFixture(input, { classes, areas: subAreas });
  if (fixture.seeds.length > 8) throw new Error('Screening measurement permits at most 8 seeds');
  const sourceState = collectSourceState(fileURLToPath(new URL('../../../', import.meta.url)));
  const provenance = buildRunProvenance(sourceState, fixture);
  const restore = [
    snapshotStore(usePlayerStore),
    snapshotStore(useInventoryStore),
    snapshotStore(useMapStore),
    snapshotStore(useMercStore),
    snapshotStore(useFormationStore),
    snapshotStore(useCombatStore),
    snapshotStore(useHydrationStore)
  ];
  const originalPity = getIdleEliteMisses();
  const originalNow = Date.now;
  const runs: MeasuredRun[] = [];
  const comparisons: RepeatComparison[] = [];
  const cleanupErrors: unknown[] = [];
  let report: FreshMeasurementReport | undefined;
  let failed = false;
  let failure: unknown;
  try {
    useHydrationStore.getState().setStatus('ready');
    Date.now = () => fixture.clockEpochMs;
    for (const seed of fixture.seeds) {
      const first = measureOnce(fixture, seed, 0);
      const second = measureOnce(fixture, seed, 1);
      runs.push(first, second);
      comparisons.push(compareRepetitions(first, second));
    }
    report = {
      reportVersion: 1,
      fixture,
      provenance,
      sourceState,
      itemAllocator: {
        scope: 'process-global',
        resetPerformed: false,
        initialSequence: 'not-observed'
      },
      idleComparison: {
        eligible: false,
        reason:
          'Fresh manual recipe has no previously earned clear; idle and dormant assumed-kill useIdleTicker are not measured.'
      },
      scope:
        'Bounded fresh manual production screening; no campaign, pacing or full P02 acceptance.',
      runs,
      comparisons,
      rewardObservationPolicy: 'actual-progression-and-raw-reward-deltas-v1'
    };
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    try {
      abortSubAreaRun();
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const restoreStore of restore) {
      try {
        restoreStore();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      setIdleEliteMisses(originalPity);
    } catch (error) {
      cleanupErrors.push(error);
    }
    Date.now = originalNow;
  }
  if (cleanupErrors.length > 0)
    throw new AggregateError(
      failed ? [failure, ...cleanupErrors] : cleanupErrors,
      'Measurement store cleanup failed'
    );
  if (failed) throw failure;
  if (!report) throw new Error('Measurement did not produce a report');
  return report;
}

import type { Item } from '@/engine/types/items';
import type { KillRewards } from '@/engine/loot/award';
import type { RestoredModeAttempt } from './mode-adapter';
import { observationJson } from './earned-report';
import { sourceIdentity } from './earned-comparison';
export interface ModeWaveComparison {
  readonly position: number;
  readonly firstIndex: number | null;
  readonly secondIndex: number | null;
  readonly combatInputsEqual: boolean | null;
  readonly rawBattleOutputsEqual: boolean | null;
  readonly presentationEqual: boolean | null;
  readonly determinism: 'matched' | 'mismatch' | 'different-inputs' | 'unpaired';
}
type Coverage = 'exercised' | 'unexercised';
export interface RestoredModeComparison {
  readonly sourceIdentityEqual: boolean;
  readonly restoredBaselineEqual: boolean;
  readonly runIdentityEqual: boolean;
  readonly waveComparisons: readonly ModeWaveComparison[];
  readonly rawCombatObservationsEqual: boolean;
  readonly rawPityObservationsEqual: boolean;
  readonly rawRewardsEqual: boolean;
  readonly semanticRewardsIgnoringOnlyTopLevelItemIdEqual: boolean;
  readonly rawDomainObservationsEqual: boolean;
  readonly logicalUiTimingsEqual: boolean;
  readonly fullRawObservationEqual: boolean;
  readonly itemIdentityAssessment: 'equal' | 'different' | 'unexercised';
  readonly battlePathCoverage: { readonly first: Coverage; readonly second: Coverage };
  readonly rewardPathCoverage: { readonly first: Coverage; readonly second: Coverage };
}
const equal = (a: unknown, b: unknown) => observationJson(a) === observationJson(b);
type Wave = RestoredModeAttempt['waves'][number];
function baseline(a: RestoredModeAttempt) {
  return { tag: a.baselineTag, clock: a.clockEpochMs, scope: a.scope,
    requestedPity: a.options.idleEliteMisses, created: a.created, actions: a.actions,
    baseline: a.baseline, combat: a.baselineCombat, pity: a.baselinePity };
}
function outputs(w: Wave) {
  return { events: w.opening.recordedEvents, outcome: w.opening.outcome, log: w.opening.log,
    played: { playerTeam: w.played.playerTeam, enemyTeam: w.played.enemyTeam,
      eventCursor: w.played.eventCursor, playbackComplete: w.played.playbackComplete, log: w.played.log },
    advanceResult: w.advanceResult, terminalSimClockMs: w.terminalSimClockMs };
}
function presentation(w: Wave) {
  return [w.opening, w.afterAdvance].map(c => ({ currentWave: c.currentWave, totalWaves: c.totalWaves,
    presentation: c.currentWavePresentation, names: c.unitNameMap }));
}
function compareWaves(a: RestoredModeAttempt, b: RestoredModeAttempt): ModeWaveComparison[] {
  return Array.from({ length: Math.max(a.waves.length, b.waves.length) }, (_, position) => {
    const x = a.waves[position]; const y = b.waves[position];
    const indices = { position, firstIndex: x?.index ?? null, secondIndex: y?.index ?? null };
    if (!x || !y || x.index !== y.index || !a.handle || !b.handle) return { ...indices,
      combatInputsEqual: null, rawBattleOutputsEqual: null, presentationEqual: null, determinism: 'unpaired' };
    const input = (w: Wave, runSeed: number) => ({
      seed: (runSeed ^ ((w.index + 1) * 0x9e3779b1)) >>> 0,
      playerTeam: w.opening.playerTeam, enemyTeam: w.opening.enemyTeam });
    const combatInputsEqual = equal(input(x, a.handle.runSeed), input(y, b.handle.runSeed));
    const rawBattleOutputsEqual = equal(outputs(x), outputs(y));
    return { ...indices, combatInputsEqual, rawBattleOutputsEqual,
      presentationEqual: equal(presentation(x), presentation(y)),
      determinism: !combatInputsEqual ? 'different-inputs' : rawBattleOutputsEqual ? 'matched' : 'mismatch' };
  });
}
function combat(a: RestoredModeAttempt) {
  return { baseline: a.baselineCombat, terminal: a.terminalCombat,
    waves: a.waves.map(w => ({ index: w.index, opening: w.opening, played: w.played, afterAdvance: w.afterAdvance })) };
}
function pity(a: RestoredModeAttempt) {
  return { baseline: a.baselinePity, terminal: a.terminalPity,
    waves: a.waves.map(w => ({ index: w.index, before: w.pityBefore, after: w.pityAfter })) };
}
function domains(a: RestoredModeAttempt) {
  return { status: a.status, refusal: a.refusal, created: a.created, actions: a.actions,
    baseline: a.baseline, terminal: a.terminal,
    waves: a.waves.map(w => ({ index: w.index, beforeAward: w.beforeAward, afterAward: w.afterAward })) };
}
function timing(a: RestoredModeAttempt) {
  return { logical: a.timings.logicalSimSeconds, ui: a.timings.uiDelayHintSeconds };
}
function item(value: Item, semantic: boolean) {
  if (!semantic) return value;
  const { id: _originalId, ...content } = value;
  return content; // Only this known Item's own id; nested IDs remain significant.
}
function reward(value: KillRewards, semantic: boolean) {
  return { ...value, items: value.items.map(i => item(i, semantic)) };
}
function rewards(a: RestoredModeAttempt, semantic: boolean) {
  return { waves: a.waves.map(w => ({ index: w.index,
    rawRewardDelta: reward(w.rawRewardDelta, semantic),
    actualDelta: { ...w.actualDelta, addedItems: w.actualDelta.addedItems.map(i => item(i, semantic)) } })),
    terminalRunRewards: reward(a.terminalCombat.runRewards, semantic) };
}
function itemIds(a: RestoredModeAttempt): string[] {
  return [...a.waves.flatMap(w => [...w.rawRewardDelta.items, ...w.actualDelta.addedItems]),
    ...a.terminalCombat.runRewards.items].map(i => i.id);
}
function rawAward(value: KillRewards): boolean {
  return value.items.length > 0 || [value.runeShards, value.runes, value.gems, value.wishstones].some(n => n !== 0);
}
function rewardCoverage(a: RestoredModeAttempt): Coverage {
  const changed = rawAward(a.terminalCombat.runRewards) || a.waves.some(w => {
    const d = w.actualDelta;
    return rawAward(w.rawRewardDelta) || d.xp !== 0 || Object.values(d.mercXp).some(n => n !== 0) ||
      Object.values(d.currencies).some(n => n !== 0) || d.addedItems.length > 0 ||
      d.removedItemIds.length > 0 || d.addedClears.length > 0;
  });
  return changed ? 'exercised' : 'unexercised';
}
/**
 * Compare exact restored observations; matching seeded inputs require matching outputs.
 * Planner divergence and missing waves remain explicit. No state or identity is normalized.
 */
export function compareRestoredModes(first: RestoredModeAttempt, second: RestoredModeAttempt): RestoredModeComparison {
  const identity = sourceIdentity(first.sourceBefore);
  const firstIds = itemIds(first); const secondIds = itemIds(second);
  return {
    sourceIdentityEqual: [first.sourceAfter, second.sourceBefore, second.sourceAfter]
      .every(s => equal(identity, sourceIdentity(s))),
    restoredBaselineEqual: equal(baseline(first), baseline(second)),
    runIdentityEqual: equal(first.handle, second.handle), waveComparisons: compareWaves(first, second),
    rawCombatObservationsEqual: equal(combat(first), combat(second)),
    rawPityObservationsEqual: equal(pity(first), pity(second)),
    rawRewardsEqual: equal(rewards(first, false), rewards(second, false)),
    semanticRewardsIgnoringOnlyTopLevelItemIdEqual: equal(rewards(first, true), rewards(second, true)),
    rawDomainObservationsEqual: equal(domains(first), domains(second)),
    logicalUiTimingsEqual: equal(timing(first), timing(second)),
    fullRawObservationEqual: equal(first, second),
    itemIdentityAssessment: firstIds.length === 0 && secondIds.length === 0 ? 'unexercised'
      : equal(firstIds, secondIds) ? 'equal' : 'different',
    battlePathCoverage: { first: first.waves.length ? 'exercised' : 'unexercised',
      second: second.waves.length ? 'exercised' : 'unexercised' },
    rewardPathCoverage: { first: rewardCoverage(first), second: rewardCoverage(second) }
  };
}

import type { Item } from '@/engine/types/items';
import type { KillRewards } from '@/engine/loot/award';
import type { EarnedAttempt } from './earned-adapter';
import type { EarnedWave } from './earned-playback';
import type { EarnedCombatState } from './earned-state';
import type { SourceState } from './provenance';
import { observationJson } from './earned-report';

const equal = (first: unknown, second: unknown) => observationJson(first) === observationJson(second);

/** Exact v2 source/tool identity; dirty-worktree metadata is retained separately. */
export function sourceIdentity(source: SourceState) {
  return { sourceSha: source.sourceSha, sourceTreeHash: source.sourceTreeHash,
    dataHash: source.dataHash, nodeVersion: source.nodeVersion, vitestVersion: source.vitestVersion,
    manifest: source.manifest, collectionPolicy: source.collectionPolicy };
}
function attemptedWaves(attempt: EarnedAttempt): EarnedWave[] {
  return [...attempt.actions.flatMap(action => action.farms.flatMap(farm => farm.waves)),
    ...(attempt.target?.waves ?? [])];
}
function installedRecording(opening: EarnedCombatState) {
  return { playerTeam: opening.playerTeam, enemyTeam: opening.enemyTeam,
    currentWave: opening.currentWave, totalWaves: opening.totalWaves,
    currentWavePresentation: opening.currentWavePresentation, unitNameMap: opening.unitNameMap,
    recordedEvents: opening.recordedEvents, outcome: opening.outcome, log: opening.log };
}
function recording(wave: EarnedWave) {
  return { index: wave.index, opening: installedRecording(wave.opening),
    played: { playerTeam: wave.played.playerTeam, enemyTeam: wave.played.enemyTeam,
      eventCursor: wave.played.eventCursor, playbackComplete: wave.played.playbackComplete },
    advanceResult: wave.advanceResult,
    terminalSimClockMs: wave.terminalSimClockMs };
}
function recordings(attempt: EarnedAttempt) {
  return { preparations: attempt.actions.map(action => action.farms.map(farm =>
    ({ handle: farm.handle, waves: farm.waves.map(recording) }))),
  target: attempt.target === null ? null : { handle: attempt.target.handle,
    waves: attempt.target.waves.map(recording), terminalAdvance: attempt.target.terminalAdvance } };
}
function abandoned(attempt: EarnedAttempt) {
  return attempt.actions.map(action => action.farms.map(farm => farm.abandoned === null ? null
    : { handle: farm.handle, opening: installedRecording(farm.abandoned.opening) }));
}
function rewardItem(item: Item, semantic: boolean) {
  if (!semantic) return item;
  const { id: _originalId, ...content } = item;
  return content; // Deliberately shallow: all nested IDs remain original data.
}
function reward(reward: KillRewards, semantic: boolean) {
  return { ...reward, items: reward.items.map(item => rewardItem(item, semantic)) };
}
function waveReward(wave: EarnedWave, semantic: boolean) {
  return { rawRewardDelta: reward(wave.rawRewardDelta, semantic),
    actualDelta: { ...wave.actualDelta,
      addedItems: wave.actualDelta.addedItems.map(item => rewardItem(item, semantic)) } };
}
function rewards(attempt: EarnedAttempt, semantic: boolean) {
  return { preparations: attempt.actions.map(action => action.farms.map(farm =>
    farm.waves.map(wave => waveReward(wave, semantic)))),
  target: attempt.target === null ? null : {
    waves: attempt.target.waves.map(wave => waveReward(wave, semantic)),
    rawRunRewards: reward(attempt.target.rawRunRewards, semantic) },
  acquisitionJournal: attempt.acquisitionJournal.map(item => rewardItem(item, semantic)) };
}
function waveDomain(wave: EarnedWave) {
  return { beforeAward: wave.beforeAward, afterAward: wave.afterAward };
}
function domains(attempt: EarnedAttempt) {
  return { status: attempt.status, refusal: attempt.refusal, created: attempt.created,
    actions: attempt.actions.map(action => ({ ...action,
      farms: action.farms.map(farm => ({ handle: farm.handle, waves: farm.waves.map(waveDomain),
        abandoned: farm.abandoned === null ? null : { beforeFlee: farm.abandoned.beforeFlee,
          afterFlee: farm.abandoned.afterFlee } })) })),
    checkpoints: attempt.checkpoints, preTarget: attempt.preTarget, terminal: attempt.terminal,
    target: attempt.target === null ? null : { handle: attempt.target.handle,
      waves: attempt.target.waves.map(waveDomain), terminalAdvance: attempt.target.terminalAdvance,
      carryCoverage: attempt.target.carryCoverage } };
}
function fullReplay(attempt: EarnedAttempt) {
  const { repetition: _repetition, sourceBefore: _before, sourceAfter: _after,
    timings: { wallSeconds: _wall, ...timings }, ...remaining } = attempt;
  return { ...remaining, timings };
}
function itemIds(attempt: EarnedAttempt): string[] {
  return [...attempt.acquisitionJournal, ...(attempt.target?.waves.flatMap(wave => wave.actualDelta.addedItems) ?? [])]
    .map(item => item.id);
}
function rawRewardChanged(raw: KillRewards): boolean {
  return raw.items.length > 0 || [raw.runeShards, raw.runes, raw.gems, raw.wishstones].some(n => n !== 0);
}
function rewardCoverage(attempt: EarnedAttempt): 'exercised' | 'unexercised' {
  const changed = attemptedWaves(attempt).some(wave => {
    const delta = wave.actualDelta;
    return delta.xp !== 0 || Object.values(delta.mercXp).some(n => n !== 0) ||
      Object.values(delta.currencies).some(n => n !== 0) || delta.addedItems.length > 0 ||
      delta.removedItemIds.length > 0 || delta.addedClears.length > 0 || rawRewardChanged(wave.rawRewardDelta);
  }) || (attempt.target !== null && rawRewardChanged(attempt.target.rawRunRewards));
  return changed ? 'exercised' : 'unexercised';
}

/** Compare complete native values; only the named semantic reward projection omits Item.id. */
export function compareEarnedAttempts(first: EarnedAttempt, second: EarnedAttempt) {
  const identity = sourceIdentity(first.sourceBefore);
  const firstIds = itemIds(first); const secondIds = itemIds(second);
  const itemIdentityAssessment: 'equal' | 'different' | 'unexercised' =
    firstIds.length === 0 && secondIds.length === 0 ? 'unexercised'
      : equal(firstIds, secondIds) ? 'equal' : 'different';
  return {
    sourceIdentityEqual: [first.sourceAfter, second.sourceBefore, second.sourceAfter]
      .every(source => equal(identity, sourceIdentity(source))),
    rawWaveRecordingsEqual: equal(recordings(first), recordings(second)),
    rawAbandonedRecordingsEqual: equal(abandoned(first), abandoned(second)),
    rawRewardsEqual: equal(rewards(first, false), rewards(second, false)),
    semanticRewardsIgnoringOnlyTopLevelItemIdEqual: equal(rewards(first, true), rewards(second, true)),
    rawDomainObservationsEqual: equal(domains(first), domains(second)),
    fullRawReplayEqual: equal(fullReplay(first), fullReplay(second)),
    itemIdentityAssessment,
    rewardPathCoverage: { first: rewardCoverage(first), second: rewardCoverage(second) }
  };
}

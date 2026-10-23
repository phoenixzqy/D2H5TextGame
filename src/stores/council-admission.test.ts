/** Constructed power fixture proves settlement wiring, never earned campaign balance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as wavePlans from '@/engine/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';
import { snapshotStores } from './persistence';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save';
import { claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { withoutV17Fields } from '../../tests/helpers/save-fixtures';

const QUEST = 'quests/act3-khalims-will';
const SOURCE = `${QUEST}#action:council-victory`;
const AREA = 'areas/act3-travincal';
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Council fixture');
  return value;
}
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore]) store.getState().reset();
}
function track(): void {
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } });
}
function start(options: Parameters<typeof startSubAreaRun>[0] = {}): number {
  const player = createMockPlayer('Council constructed fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: [] });
  const item = { id: 'council-fixture-cap', baseId: 'items/base/helm-cap', socketCapacity: 0, rarity: 'rare' as const,
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(item);
  expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
  return required(startSubAreaRun({ subAreaId: AREA, act: 3, runSeed: 7, challengeOrdinal: 0, ...options })).totalWaves;
}
function drain(): void {
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function reachCouncil(options: Parameters<typeof startSubAreaRun>[0] = {}): void {
  const total = start(options);
  for (let wave = 1; wave < total; wave++) {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  }
}
function settleAll(options: Parameters<typeof startSubAreaRun>[0] = {}): void {
  const total = start(options);
  for (let wave = 1; wave <= total; wave++) {
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    drain();
    expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
  }
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('Council accepted settlement action proof', () => {
  it('records one finite proof only after a tracked original three-member Council victory', () => {
    track();
    settleAll();
    expect(useMapStore.getState().questReceipts).toEqual({ [SOURCE]: true });
    expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-flail']).toBe(false);
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(useMapStore.getState().clearedSubAreas).toContain(AREA);
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questReceipts).toEqual({ [SOURCE]: true });
  });

  it('never banks an untracked win or mints proof from direct optional kill context/clear flags', () => {
    settleAll();
    expect(useMapStore.getState().questReceipts).toEqual({});
    track();
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act3', areaId: AREA,
      archetypeIds: Array.from({ length: 3 }, () => 'monsters/act3.infector'),
      source: { kind: 'bossEncounter', encounterId: 'act3-travincal-council' } });
    useMapStore.getState().markCleared(AREA);
    expect(useMapStore.getState().questReceipts).toEqual({});
    settleAll();
    expect(useMapStore.getState().questReceipts).toEqual({ [SOURCE]: true });
  });

  it('uses pre-event tracking even when a synchronous income observer starts Khalim', () => {
    reachCouncil();
    const grant = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementationOnce(amount => {
      const result = grant(amount); track(); return result;
    });
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[QUEST]?.status).toBe('inProgress');
    expect(useMapStore.getState().questReceipts).toEqual({});
  });

  it('requires explicit new historical recovery, retaining old claimed history and paying no quest XP', () => {
    track();
    const row = required(useMapStore.getState().questProgress[QUEST]);
    const claimed = { ...row, status: 'completed' as const, rewardClaimed: true,
      objectives: Object.fromEntries(Object.keys(row.objectives).map(id => [id, true])) };
    useMapStore.getState().updateQuestProgress(QUEST, claimed);
    settleAll();
    expect(useMapStore.getState().questReceipts).toEqual({});
    settleAll({ questRecovery: 'khalims-council' });
    expect(useMapStore.getState().questReceipts).toEqual({ [SOURCE]: true });
    expect(useMapStore.getState().questProgress[QUEST]).toEqual(claimed);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(useInventoryStore.getState().questItems).toEqual({});
  });

  it.each(['missing-member', 'replaced-member', 'summoned-member', 'partial', 'hero-dead', 'draw', 'defeat'] as const)(
    'refuses proof for an accepted or losing %s outcome', kind => {
      track(); reachCouncil();
      const outcome = required(useCombatStore.getState().outcome);
      const first = required(outcome.finalEnemyTeam[0]);
      if (kind === 'missing-member') Object.assign(outcome, { finalEnemyTeam: outcome.finalEnemyTeam.slice(1) });
      if (kind === 'replaced-member') Object.assign(outcome, { finalEnemyTeam: [{ ...first, id: 'replacement' }, ...outcome.finalEnemyTeam.slice(1)] });
      if (kind === 'summoned-member') Object.assign(outcome, { finalEnemyTeam: [{ ...first, kind: 'summon' }, ...outcome.finalEnemyTeam.slice(1)] });
      if (kind === 'partial') Object.assign(outcome, { finalEnemyTeam: [{ ...first, life: 1 }, ...outcome.finalEnemyTeam.slice(1)] });
      if (kind === 'hero-dead') Object.assign(outcome, { finalPlayerTeam: outcome.finalPlayerTeam.map(unit => ({ ...unit, life: 0 })) });
      if (kind === 'draw' || kind === 'defeat') Object.assign(outcome, { winner: kind === 'draw' ? 'draw' : 'enemy' });
      drain(); advanceWaveOrFinish();
      expect(useMapStore.getState().questReceipts).toEqual({});
    });

  it('rejects a stale outcome before any Council proof or settlement write', () => {
    track(); reachCouncil(); drain();
    useCombatStore.setState({ outcome: { ...required(useCombatStore.getState().outcome) } });
    const before = useMapStore.getState();
    expect(advanceWaveOrFinish).toThrow('bindingMismatch');
    expect(useMapStore.getState()).toBe(before);
    expect(useMapStore.getState().questReceipts).toEqual({});
  });

  it.each([true, false])('replay retains the original captured Council provenance=%s', captured => {
    track();
    if (!captured) {
      const resolve = wavePlans.resolveChallengeWavePlan;
      vi.spyOn(wavePlans, 'resolveChallengeWavePlan').mockImplementationOnce(input => {
        const plan = resolve(input);
        return { ...plan, waves: plan.waves.map(wave => wave.source?.kind === 'bossEncounter'
          ? { ...wave, source: { kind: 'bossEncounter', encounterId: 'lookalike-council' } } : wave) };
      });
    }
    reachCouncil();
    const run = required(combatRunLifecycle.activeRun);
    const wave = required(run.plan.waves[run.waveIdx]);
    Object.assign(wave, { source: { kind: 'bossEncounter',
      encounterId: captured ? 'lookalike-council' : 'act3-travincal-council' } });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questReceipts).toEqual(captured ? { [SOURCE]: true } : {});
  });

  it('rolls back a mutate-then-throw receipt, preserves unrelated journal writes, and refuses nested transitions/Read/Claim', () => {
    track(); reachCouncil(); drain();
    const publish = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      publish(...args);
      expect(claimQuestReward(QUEST)).toBe('claim-in-progress');
      expect(readQuestItem('missing')).toBe('claim-in-progress');
      expect(advanceWaveOrFinish).toThrow('waveBusy');
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', { status: 'available' });
      throw new Error('Council publication failed after write');
    });
    expect(advanceWaveOrFinish).toThrow('Council publication failed after write');
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(useMapStore.getState().questProgress['quests/act1-den-of-evil']?.status).toBe('available');
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  });

  it('never publishes proof when an earlier terminal-clear observer fails', () => {
    track(); reachCouncil(); drain();
    vi.spyOn(useMapStore.getState(), 'markCleared').mockImplementationOnce(() => { throw new Error('clear failed'); });
    expect(advanceWaveOrFinish).toThrow('clear failed');
    expect(useMapStore.getState().questReceipts).toEqual({});
  });

  it('retains no proof when the receipt publisher fails before its write', () => {
    track(); reachCouncil(); drain();
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => { throw new Error('before receipt write'); });
    expect(advanceWaveOrFinish).toThrow('before receipt write');
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  });

  it('reports failed restoration explicitly and retains the shared lock through the restore attempt', () => {
    track(); reachCouncil(); drain();
    const publish = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState')
      .mockImplementationOnce((...args) => { publish(...args); throw new Error('publish failed'); })
      .mockImplementationOnce(() => {
        expect(claimQuestReward(QUEST)).toBe('claim-in-progress');
        expect(readQuestItem('missing')).toBe('claim-in-progress');
        throw new Error('restore failed');
      });
    let failure: unknown;
    try { advanceWaveOrFinish(); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(AggregateError);
    if (!(failure instanceof AggregateError)) throw new Error('Expected restoration AggregateError');
    expect(failure.errors).toHaveLength(1);
    expect(failure.message).toBe('Council proof restoration failed');
    // Restoration failed: the API must not promise that publication was undone.
    expect(useMapStore.getState().questReceipts).toEqual({ [SOURCE]: true });
  });

  it('roundtrips only actual finite Council proof; frozen14 rejects the future field and migration infers none', () => {
    track(); settleAll();
    const saved = required(snapshotStores());
    expect(decodeSave(toJsonSafe(saved)).map.questReceipts).toEqual({ [SOURCE]: true });
    const historical = withoutV17Fields(saved);
    const json = toJsonSafe(historical) as Record<string, unknown>;
    expect(() => decodeSave({ ...json, version: 14 })).toThrow(/historical/);
    const { questReceipts: _receipts, ...map } = historical.map;
    expect(decodeSave({ ...historical, version: 14, map }).map.questReceipts).toEqual({});
  });
});

/**
 * Constructed Countess settlement regressions.
 * Valid native fixtures enter/play back first; faults are synchronous publication observers,
 * never imported malformed saves. No earned gameplay or historical replay is claimed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuests } from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, exportCurrentSave, useHydrationStore } from '@/stores/persistence';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { assertWaveSnapshotAllowed, WaveGuardError } from '@/stores/waveTransitionGuard';
import type { Item } from '@/engine/types/items';

const QUEST = 'quests/act1-forgotten-tower';
const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const PROOF = `${QUEST}#action:countess-victory`;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore,
  useMercStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Countess transaction fixture');
  return value;
}
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function data(state: object) {
  return Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== 'function'));
}
function snapshot() {
  return structuredClone({
    player: data(usePlayerStore.getState()), inventory: data(useInventoryStore.getState()),
    map: data(useMapStore.getState()), combat: data(useCombatStore.getState()),
    merc: data(useMercStore.getState()), meta: data(useMetaStore.getState()),
    formation: data(useFormationStore.getState()), run: combatRunLifecycle.activeRun
  });
}
function addMerc(definitionId: string) {
  const definition = required(loadMercPool().pool.find(row => row.id === definitionId));
  const merc = createMercFromDef(definition);
  useMercStore.getState().addMerc(merc);
  return merc.id;
}
function ready() {
  // Exercise the explicit selected quest encounter at the runtime boundary.
  const options = { act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, questEncounter: ENCOUNTER };
  const entered = required(startSubAreaRun(options as Parameters<typeof startSubAreaRun>[0]));
  expect(entered.totalWaves).toBe(1);
  const run = required(combatRunLifecycle.activeRun), wave = required(run.plan.waves[0]);
  expect(wave.source).toEqual({ kind: 'questEncounter', encounterId: ENCOUNTER });
  expect(wave.spawns).toEqual([{ archetypeId: 'monsters/act1.the-countess', encounterId: ENCOUNTER,
    tier: 'boss', level: 13, index: 0 }]);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
  return run;
}
function thrownBySettlement(): unknown {
  let thrown: unknown;
  try { advanceWaveOrFinish(); } catch (error) { thrown = error; }
  expect(thrown).toBeDefined();
  return thrown;
}
function failedReceiptIsClosed(error: unknown) {
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress)
    .toMatchObject({ phase: 'settlementFailed', failure: { error } });
  const before = snapshot(), holder = inspectRecordedWaves();
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
  expect(snapshot()).toEqual(before);
  expect(inspectRecordedWaves()).toBe(holder);
  expect(assertWaveSnapshotAllowed).not.toThrow();
}
function expectOwnedLocks() {
  // Both supported quest exclusion surfaces are safe; do not require a wrapper implementation.
  let result: ReturnType<typeof claimQuestReward> | undefined, failure: unknown;
  try { result = claimQuestReward(QUEST); } catch (error) { failure = error; }
  if (failure === undefined) expect(result).toBe('claim-in-progress');
  else { expect(failure).toBeInstanceOf(WaveGuardError); expect(failure).toMatchObject({ code: 'questBusy' }); }
  expect(advanceWaveOrFinish).toThrow('waveBusy');
  expect(assertWaveSnapshotAllowed).toThrow('waveBusy');
  expect(exportCurrentSave).toThrow();
}
function errorTree(root: unknown): unknown[] {
  const seen = new Set<unknown>();
  const visit = (value: unknown) => {
    if (seen.has(value)) return;
    seen.add(value);
    if (value instanceof AggregateError) for (const child of value.errors) visit(child);
    if (value instanceof Error && Object.hasOwn(value, 'cause')) visit(value.cause);
  };
  visit(root);
  return [...seen];
}


beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Countess transaction fixture', 'sorceress'), comboOrder: [] });
  const gear: Item = { id: 'countess-transaction-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const quest = required(loadQuests().find(row => row.id === QUEST));
  useMapStore.setState({ currentAct: 1, currentSubAreaId: AREA, clearedSubAreas: [] });
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
});
afterEach(() => {
  for (const stop of stops.splice(0).reverse()) stop();
  vi.restoreAllMocks(); reset();
});

describe('Countess native recipient output provenance', () => {
  it('removes a newly grown merc output renamed by a throwing observer before restoring the original recipient', () => {
    const recipientId = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipientId);
    const initial = useMercStore.getState().getMercProgress(recipientId);
    useMercStore.setState(state => ({ mercProgress: { ...state.mercProgress,
      [recipientId]: { ...initial, experience: initial.experienceToNextLevel - 1 } } }));
    ready();
    const before = snapshot();
    const originalLevel = required(useMercStore.getState().ownedMercs.find(row => row.id === recipientId)).level;
    const cause = new Error('Countess grown recipient renamed during native publication');
    let fired = false;
    stops.push(useMercStore.subscribe(state => {
      if (fired) return;
      const output = state.ownedMercs.find(row => row.id === recipientId);
      if (!output || output.level <= originalLevel) return;
      fired = true; expectOwnedLocks();
      Object.assign(output, { id: 'countess-renamed-grown-output' });
      throw cause;
    }));
    const error = thrownBySettlement();
    expect(fired).toBe(true); expect(errorTree(error)).toContain(cause);
    expect(useMercStore.getState().ownedMercs.some(row => row.id === 'countess-renamed-grown-output')).toBe(false);
    expect(snapshot()).toEqual(before);
    failedReceiptIsClosed(error);
  });
});

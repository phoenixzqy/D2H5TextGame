/** Constructed equipped hero; real authored plans, native combat and receipt lifecycle.
 * This verifies quest capability, not earned campaign balance or pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as engine from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ORMUS } from '@/engine/map/ormus-quest';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, startSubAreaRun, refreshActivePlayerCombatConfig, advanceWaveOrFinish } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { prepareOrmusAdvance } from './ormusRunAuthority';
import { inspectRecordedWaves, prepareRecordedWave } from './recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition } from './waveTransitionGuard';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function arrange(locked = false) {
  const hero = createMockPlayer('Ormus capability', 'necromancer');
  usePlayerStore.getState().setPlayer({ ...hero, level: 32, comboOrder: locked ? ['necromancer.iron_golem'] : [],
    skillLevels: locked ? { 'necromancer.iron_golem': 1, 'necromancer.blood_golem': 1 } : {} });
  const cap = { id: 'ormus-capability-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 1_000_000],
        ['statMods.attack', 1_000_000], ['statMods.attackSpeed', 200]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 3, currentSubAreaId: ORMUS.area,
    questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'inProgress', rewardClaimed: false, objectives: {} } } });
}
function start(mode: 'manual' | 'idle' = 'manual', subAreaId: string = ORMUS.area) {
  expect(startSubAreaRun({ subAreaId, act: 3, mode, runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const issued = inspectRecordedWaves().currentPublished;
  if (!issued) throw new Error('Missing published native wave');
  return issued.binding;
}
function prepared(binding: ReturnType<typeof start>) {
  const map = useMapStore.getState();
  return prepareOrmusAdvance(binding, map.questProgress, map.questReceipts);
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function reachLast() {
  while (useCombatStore.getState().currentWave < useCombatStore.getState().totalWaves) {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(ORMUS.proof);
  }
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('Ormus ordinary native run wiring', () => {
  it('carries the exact native witness into the published first-wave receipt without earning early proof', () => {
    arrange(); const binding = start();
    expect(binding.recording.outcome.winner).toBe('player');
    expect(binding).toHaveProperty('ormusWitness');
    expect(prepared(binding)?.final).toBe(false);
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(ORMUS.proof);
    expect(useMapStore.getState().questProgress[ORMUS.quest]?.objectives).toEqual({});
  });
  it.each(['idle', 'claimed', 'different-area'] as const)('does not issue a witness for %s', source => {
    arrange();
    if (source === 'claimed') useMapStore.setState({ questProgress: {
      [ORMUS.quest]: { id: ORMUS.quest, status: 'completed', rewardClaimed: true, objectives: {} } } });
    const binding = start(source === 'idle' ? 'idle' : 'manual',
      source === 'different-area' ? 'areas/act3-spider-forest' : ORMUS.area);
    expect(binding).not.toHaveProperty('ormusWitness');
    expect(prepared(binding)).toBeUndefined();
  });
  it('rejects a copied witness before preparing another receipt', () => {
    arrange(); const binding = start();
    const witness = binding.ormusWitness;
    if (!witness) throw new Error('Missing native Ormus witness');
    const lease = beginWaveTransition(true);
    try { expect(() => prepareRecordedWave({ ...binding, ...{ ormusWitness: { ...witness } } }, lease)).toThrow('bindingMismatch'); }
    finally { endWaveTransition(lease); }
    expect(inspectRecordedWaves().pending).toBeNull();
  });
  it.each([false, true])('permanently disqualifies explicit replay (locked=%s)', locked => {
    arrange(locked); const original = start();
    expect(original.publication.ironGolemReplayLocked).toBe(locked);
    expect(prepared(original)).toBeDefined();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const replay = inspectRecordedWaves().currentPublished?.binding;
    if (!replay) throw new Error('Missing replay receipt');
    expect(replay).not.toHaveProperty('ormusWitness');
    expect(prepared(original)).toBeUndefined();
    expect(prepared(replay)).toBeUndefined();
  });
  it('keeps the original run disqualified when replay staging fails', () => {
    arrange(); const original = start(); expect(prepared(original)).toBeDefined();
    vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('Replay staging failed'); });
    expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow('Replay staging failed');
    expect(inspectRecordedWaves().currentPublished?.binding).toBe(original);
    expect(prepared(original)).toBeUndefined();
  });
});

describe('Ormus accepted full native clear settlement', () => {
  it.each([false, true])('earns only the full ordered clear and resets legacy Talk (legacy=%s)', legacy => {
    arrange();
    if (legacy) useMapStore.setState({ questProgress: { [ORMUS.quest]: {
      id: ORMUS.quest, status: 'completed', rewardClaimed: false,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } } } });
    start(); reachLast(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questReceipts[ORMUS.proof]).toBe(true);
    expect(useMapStore.getState().questProgress[ORMUS.quest]).toMatchObject({ status: 'inProgress', rewardClaimed: false,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: false } });
    const paid = usePlayerStore.getState().player;
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(usePlayerStore.getState().player).toBe(paid);
  });
  it.each([false, true])('never earns proof after replay even if all waves finish (locked=%s)', locked => {
    arrange(locked); start(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    reachLast(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(ORMUS.proof);
  });
  it('retains accepted sequence when the next native staging fails', () => {
    arrange(); start(); drain();
    vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('Next staging failed'); });
    expect(() => advanceWaveOrFinish()).toThrow('Next staging failed');
    const paid = usePlayerStore.getState().player;
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('awaitingNextWave');
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(usePlayerStore.getState().player).toBe(paid);
    reachLast(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questReceipts[ORMUS.proof]).toBe(true);
  });
  it.each(['row-in-place', 'row-replaced', 'proof', 'run', 'cursor', 'outcome'] as const)(
    'refuses callback %s mutation and restores participating row values and hidden sequence', target => {
      arrange(); const binding = start(); drain();
      const row = useMapStore.getState().questProgress[ORMUS.quest];
      if (!row) throw new Error('Missing pre-settlement quest');
      const before = structuredClone(row);
      const originalRun = combatRunLifecycle.activeRun, player = usePlayerStore.getState().player;
      const unsubscribe = usePlayerStore.subscribe(() => {
        unsubscribe();
        const map = useMapStore.getState();
        if (target === 'row-in-place') {
          const row = map.questProgress[ORMUS.quest];
          if (!row) throw new Error('Missing callback row');
          row.objectives[ORMUS.talk] = true;
        }
        if (target === 'row-replaced') useMapStore.setState({ questProgress: { ...map.questProgress,
          [ORMUS.quest]: structuredClone(before) } });
        if (target === 'proof') useMapStore.setState({ questReceipts: { ...map.questReceipts, [ORMUS.proof]: true } });
        if (target === 'run') combatRunLifecycle.activeRun = null;
        if (target === 'cursor' && originalRun) originalRun.waveIdx++;
        if (target === 'outcome') useCombatStore.setState({ outcome: { ...binding.recording.outcome } });
        useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
          observer: { id: 'observer', status: 'inProgress', objectives: {} } } }));
      });
      try { expect(() => advanceWaveOrFinish()).toThrow(); } finally { unsubscribe(); }
      expect(useMapStore.getState().questProgress[ORMUS.quest]).toEqual(before);
      expect(useMapStore.getState().questReceipts).not.toHaveProperty(ORMUS.proof);
      expect(useMapStore.getState().questProgress).toHaveProperty('observer');
      expect(usePlayerStore.getState().player).toEqual(player);
      expect(combatRunLifecycle.activeRun).toBe(originalRun);
      expect(prepared(binding)).toBeDefined();
      expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
      expect(() => advanceWaveOrFinish()).toThrow();
    });
  it.each(['silent', 'throw', 'mutate-row', 'mutate-proof', 'mutate-outcome', 'mutate-plan'] as const)(
    'rolls back final publication %s failure without retaining proof or income', fault => {
      arrange(); start(); reachLast(); drain();
      const before = structuredClone({ row: useMapStore.getState().questProgress[ORMUS.quest],
        player: usePlayerStore.getState().player, inventory: { backpack: useInventoryStore.getState().backpack } });
      const set = useMapStore.setState;
      let faulted = false;
      vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
        if (faulted) { set(...args); return; }
        const current = useMapStore.getState(), update = args[0];
        const next = typeof update === 'function' ? update(current) : update;
        if (next.questReceipts?.[ORMUS.proof] !== true) { set(...args); return; }
        faulted = true;
        if (fault === 'silent') return;
        set(...args);
        if (fault === 'throw') throw new Error('Final publication failed');
        if (fault === 'mutate-row') {
          const row = useMapStore.getState().questProgress[ORMUS.quest];
          if (row) row.objectives[ORMUS.talk] = true;
        }
        if (fault === 'mutate-proof') Reflect.deleteProperty(useMapStore.getState().questReceipts, ORMUS.proof);
        if (fault === 'mutate-outcome') {
          const hero = useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.kind === 'hero');
          if (hero) Object.assign(hero, { life: 0 });
        }
        if (fault === 'mutate-plan') {
          const wave = combatRunLifecycle.activeRun?.plan.waves[0];
          if (wave) Object.assign(wave, { id: 'observer-replacement' });
        }
      });
      expect(() => advanceWaveOrFinish()).toThrow();
      expect(faulted).toBe(true);
      expect(useMapStore.getState().questProgress[ORMUS.quest]).toEqual(before.row);
      expect(useMapStore.getState().questReceipts).not.toHaveProperty(ORMUS.proof);
      expect(usePlayerStore.getState().player).toEqual(before.player);
      expect(useInventoryStore.getState().backpack).toEqual(before.inventory.backpack);
      expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
    });
});

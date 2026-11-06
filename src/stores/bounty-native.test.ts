/** Constructed equipped hero; actual authored plans/native combat/receipt lifecycle.
 * This proves a bounty capability, not earned campaign balance or pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as engine from '@/engine/combat/combat';
import { ACT_GATE_BOSS_SUB_AREAS } from '@/engine/map/unlock';
import { REGIONAL_BOUNTY_DOMAIN, type RegionalBountyDefinition } from '@/engine/map/regional-bounties';
import { captureBountyAuthority } from '@/features/quests/bountyContract';
import { acceptRegionalBounty, regionalBountyStatus } from '@/features/quests/bountyQuestActions';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, startSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { prepareBountyAdvance } from './bountyRunAuthority';
import { inspectRecordedWaves, prepareRecordedWave } from './recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition } from './waveTransitionGuard';
import { useCombatStore, usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useFormationStore, useMetaStore } from './index';
import { useHydrationStore, __resetPersistenceForTests } from './persistence';

const first = REGIONAL_BOUNTY_DOMAIN[0];
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function arrange(definition: RegionalBountyDefinition = first) {
  const hero = createMockPlayer('Bounty capability', 'necromancer');
  usePlayerStore.getState().setPlayer({ ...hero, level: 32, comboOrder: [], skillLevels: {} });
  const cap = { id: 'bounty-capability-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 1_000_000],
        ['statMods.attack', 1_000_000], ['statMods.attackSpeed', 200]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: Number(definition.actId.slice(-1)) as 1 | 2 | 3 | 4 | 5, currentSubAreaId: definition.area, selectedDifficulty: 'normal',
    clearedSubAreas: Object.values(ACT_GATE_BOSS_SUB_AREAS) });
}
function start(options: Parameters<typeof startSubAreaRun>[0] = { runSeed: 7, challengeOrdinal: 0 }) {
  const started = startSubAreaRun(options); expect(started).toBeTruthy();
  const binding = inspectRecordedWaves().currentPublished?.binding;
  if (!binding) throw new Error('Missing public bounty receipt');
  return { started, binding };
}
function prepared(binding: ReturnType<typeof start>['binding']) {
  const map = useMapStore.getState(); return prepareBountyAdvance(binding, map.questProgress, map.bounties);
}
function reachLast() {
  while (useCombatStore.getState().currentWave < useCombatStore.getState().totalWaves) {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
  }
}
function drain() {
  const combat = useCombatStore.getState();
  combat.recordedEvents.forEach(() => { combat.advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('regional bounty actual native full-clear source', () => {
  it('credits an accepted cycle only after the actual complete consecutive Normal manual cull', () => {
    arrange(); expect(captureBountyAuthority()).toHaveLength(5);
    expect(acceptRegionalBounty(first.quest)).toBe('ok');
    expect(regionalBountyStatus(first.quest)).toBe('active');
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(0);
    while (useCombatStore.getState().currentWave < useCombatStore.getState().totalWaves) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
      expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
    }
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().clearedSubAreas).toContain(first.area);
    expect(regionalBountyStatus(first.quest)).toBe('completed');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 1 });
    expect(useInventoryStore.getState().currencies['gem-shard'] ?? 0).toBe(0);
  });
  it('refuses an extraneous native enemy body instead of treating copied defeated bodies as a canonical cull', () => {
    arrange(); expect(acceptRegionalBounty(first.quest)).toBe('ok');
    const real = engine.runBattleRecorded; let injected = false;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementation((input, carry) => {
      const recorded = real(input, carry), original = recorded.result.enemyTeam[0];
      if (!original) throw new Error('Missing actual native bounty enemy'); injected = true;
      return { ...recorded, result: { ...recorded.result, enemyTeam: [...recorded.result.enemyTeam,
        { ...original, id: `${original.id}-extraneous-body`, life: 0 }] } };
    });
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    while (useCombatStore.getState().currentWave < useCombatStore.getState().totalWaves) {
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
    drain(); expect(advanceWaveOrFinish()).toBe('victory'); expect(injected).toBe(true);
    expect(regionalBountyStatus(first.quest)).toBe('active');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
  });
});


describe('regional bounty native authority and rollback controls', () => {
  it.each(REGIONAL_BOUNTY_DOMAIN)('admits the actual $key canonical first wave for its own accepted tuple', definition => {
    arrange(definition); expect(acceptRegionalBounty(definition.quest)).toBe('ok');
    const { binding } = start(); expect(binding.bountyWitness).toBeDefined();
    expect(prepared(binding)?.definition).toEqual(definition);
  });
  it.each(['idle', 'nightmare', 'hell', 'unaccepted', 'different-area'] as const)('does not issue from %s public source', mode => {
    arrange(); if (mode !== 'unaccepted') expect(acceptRegionalBounty(first.quest)).toBe('ok');
    if (mode === 'nightmare' || mode === 'hell') {
      useMapStore.setState({ selectedDifficulty: mode });
      expect(() => startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toThrow();
      expect(combatRunLifecycle.activeRun).toBeNull(); return;
    }
    const { binding } = start({ runSeed: 7, challengeOrdinal: 0, mode: mode === 'idle' ? 'idle' : 'manual',
      ...(mode === 'different-area' ? { subAreaId: 'areas/act1-cold-plains' } : {}) });
    expect(binding.bountyWitness).toBeUndefined(); expect(prepared(binding)).toBeUndefined();
  });
  it('uses the existing default ordinal wrap and explicit override without treating them as cycle authority', () => {
    arrange(); acceptRegionalBounty(first.quest);
    useMapStore.setState({ challengeOrdinals: { normal: 360359, nightmare: 0, hell: 0 } });
    const last = start({ runSeed: 7 }); expect(last.started?.challengeOrdinal).toBe(360359); expect(prepared(last.binding)).toBeDefined();
    expect(useMapStore.getState().challengeOrdinals.normal).toBe(0); abortSubAreaRun(); useCombatStore.getState().reset();
    const wrapped = start({ runSeed: 7 }); expect(wrapped.started?.challengeOrdinal).toBe(0); expect(prepared(wrapped.binding)).toBeDefined();
    expect(useMapStore.getState().challengeOrdinals.normal).toBe(1); abortSubAreaRun(); useCombatStore.getState().reset();
    const explicit = start({ runSeed: 7, challengeOrdinal: 0 }); expect(explicit.started?.challengeOrdinal).toBe(0); expect(prepared(explicit.binding)).toBeDefined();
    expect(useMapStore.getState().challengeOrdinals.normal).toBe(1);
  });
  it('rejects copied private witness at the real receipt admission seam', () => {
    arrange(); acceptRegionalBounty(first.quest); const { binding } = start();
    const witness = binding.bountyWitness;
    if (!witness) throw new Error('Missing bounty native witness');
    const lease = beginWaveTransition(true);
    try { expect(() => prepareRecordedWave({ ...binding, bountyWitness: { ...witness } }, lease)).toThrow('bindingMismatch'); }
    finally { endWaveTransition(lease); }
    expect(inspectRecordedWaves().pending).toBeNull();
  });
  it.each([false, true])('permanently disqualifies explicit replay even when staging fails=%s', failed => {
    arrange(); acceptRegionalBounty(first.quest); const { binding } = start(); expect(prepared(binding)).toBeDefined();
    if (failed) {
      vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('Replay staging failed'); });
      expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow('Replay staging failed');
    } else refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(prepared(binding)).toBeUndefined(); reachLast(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(regionalBountyStatus(first.quest)).toBe('active');
  });
  it('retains accepted earlier waves across next-stage failure without paying the wave twice', () => {
    arrange(); acceptRegionalBounty(first.quest); start(); drain();
    vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('Next staging failed'); });
    expect(() => advanceWaveOrFinish()).toThrow('Next staging failed');
    const paid = usePlayerStore.getState().player;
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('awaitingNextWave');
    expect(advanceWaveOrFinish()).toBe('next-wave'); expect(usePlayerStore.getState().player).toBe(paid);
    reachLast(); drain(); expect(advanceWaveOrFinish()).toBe('victory'); expect(regionalBountyStatus(first.quest)).toBe('completed');
  });
  it.each(['row-in-place', 'row-replaced', 'entry-in-place', 'entry-replaced', 'run', 'cursor', 'outcome'] as const)(
    'restores owned row/entry/cursor after native income observer %s mutation', target => {
      arrange(); acceptRegionalBounty(first.quest); const { binding } = start(); drain();
      const map = useMapStore.getState(), originalRow = map.questProgress[first.quest], originalEntry = map.bounties[first.quest];
      if (!originalRow || !originalEntry) throw new Error('Missing accepted bounty fixture');
      const before = structuredClone({ row: originalRow, entry: originalEntry }), run = combatRunLifecycle.activeRun;
      const player = usePlayerStore.getState().player, other = REGIONAL_BOUNTY_DOMAIN[1];
      const unsubscribe = usePlayerStore.subscribe(() => {
        unsubscribe(); const map = useMapStore.getState();
        if (target === 'row-in-place') Reflect.set(originalRow.objectives, first.objective, true);
        if (target === 'row-replaced') useMapStore.setState({ questProgress: { ...map.questProgress, [first.quest]: structuredClone(before.row) } });
        if (target === 'entry-in-place') Object.assign(originalEntry, { claims: 1, victoryOrdinal: 1 });
        if (target === 'entry-replaced') useMapStore.setState({ bounties: { ...map.bounties, [first.quest]: structuredClone(before.entry) } });
        if (target === 'run') combatRunLifecycle.activeRun = null;
        if (target === 'cursor' && run) run.waveIdx++;
        if (target === 'outcome') useCombatStore.setState({ outcome: { ...binding.recording.outcome } });
        useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [other.quest]: {
          id: other.quest, status: 'inProgress', rewardClaimed: false, objectives: { [other.objective]: false } } },
        bounties: { ...state.bounties, [other.quest]: { claims: 0, victoryOrdinal: 0 } } }));
      });
      try { expect(() => advanceWaveOrFinish()).toThrow(); } finally { unsubscribe(); }
      expect(useMapStore.getState().questProgress[first.quest]).toEqual(before.row);
      expect(useMapStore.getState().bounties[first.quest]).toEqual(before.entry);
      expect(regionalBountyStatus(other.quest)).toBe('active'); expect(usePlayerStore.getState().player).toEqual(player);
      expect(combatRunLifecycle.activeRun).toBe(run); expect(prepared(binding)).toBeDefined();
      expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
      expect(() => advanceWaveOrFinish()).toThrow();
    });
  it.each(['noop', 'throw', 'row', 'entry', 'outcome', 'plan'] as const)('restores final source publication %s failure', fault => {
    arrange(); acceptRegionalBounty(first.quest); start(); reachLast(); drain();
    const map = useMapStore.getState(), before = structuredClone({ row: map.questProgress[first.quest], entry: map.bounties[first.quest],
      hero: usePlayerStore.getState().player, backpack: useInventoryStore.getState().backpack });
    const set = useMapStore.setState; let fired = false;
    vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
      const current = useMapStore.getState(), update = args[0], next = typeof update === 'function' ? update(current) : update;
      if (fired || next.bounties?.[first.quest]?.victoryOrdinal !== 1) { set(...args); return; }
      fired = true; if (fault === 'noop') return; set(...args);
      if (fault === 'throw') throw new Error('Bounty final publication observer');
      if (fault === 'row') Reflect.set(useMapStore.getState().questProgress[first.quest]?.objectives ?? {}, first.objective, false);
      if (fault === 'entry') Object.assign(useMapStore.getState().bounties[first.quest] ?? {}, { victoryOrdinal: 0 });
      if (fault === 'outcome') Object.assign(useCombatStore.getState().outcome?.finalPlayerTeam[0] ?? {}, { life: 0 });
      if (fault === 'plan') Object.assign(combatRunLifecycle.activeRun?.plan.waves[0] ?? {}, { id: 'foreign-plan' });
    });
    expect(() => advanceWaveOrFinish()).toThrow(); expect(fired).toBe(true);
    expect(useMapStore.getState().questProgress[first.quest]).toEqual(before.row);
    expect(useMapStore.getState().bounties[first.quest]).toEqual(before.entry);
    expect(usePlayerStore.getState().player).toEqual(before.hero); expect(useInventoryStore.getState().backpack).toEqual(before.backpack);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import type { CombatUnit } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import { xpTotal } from '@/engine/progression/xp';
import { getAllocatedSkillLevel } from '@/stores/skillsHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import * as production from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import * as identity from './provenance';
import type { EarnedAction, EarnedFixture } from './earned-fixture';
import { runEarnedRecipeOnce } from './earned-adapter';
import { selectEarnedBackpackItem } from './earned-state';

const FIRE = 'skills-sorceress-fire-bolt';
const MERC = 'mercs/act1-rogue-inner-sight';
const DEN = 'areas/act1-den-of-evil';
const QUEST = 'quests/act1-den-of-evil';
const CLOCK = 1792497600000;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useFormationStore, useCombatStore, useMetaStore] as const;
const farm: EarnedAction = { kind: 'farm-first-waves',
  subAreaId: 'areas/act1-blood-moor', count: 1, firstChallengeOrdinal: 0 };
const tiny: EarnedFixture = {
  fixtureVersion: 2, id: 'earned-adapter-tiny',
  origin: { kind: 'new-character', classId: 'sorceress', name: 'Tiny Earned',
    policy: 'production-creation-defaults' },
  clockEpochMs: CLOCK, seeds: [1], acquisitionSeedPolicy: 'production-clock',
  actions: [
    { kind: 'hire-merc', mercId: MERC },
    { kind: 'allocate-skill', skillId: FIRE, points: 1 },
    { kind: 'set-combo', skillIds: [FIRE] }, farm,
    { kind: 'checkpoint', id: 'earned-after-one' },
    { kind: 'allocate-stats', deltas: { strength: 0, dexterity: 0, vitality: 5, energy: 0 } },
    { kind: 'accept-quest', questId: QUEST },
    { kind: 'checkpoint', id: 'ready' }
  ],
  scenario: { act: 1, subAreaId: DEN, mode: 'manual', challengeOrdinal: 1,
    idleEliteMisses: 0 }, mercPolicy: 'recipe-actions', summonPolicy: 'production-default'
};
const options = { targetSeed: 1, repetition: 1 as const };
function recipe(actions: readonly EarnedAction[]): EarnedFixture {
  return { ...structuredClone(tiny), actions: [...actions, farm] };
}
function data(value: object): object {
  return structuredClone(Object.fromEntries(Object.entries(value)
    .filter(([, field]) => typeof field !== 'function')));
}
function callerState() { return stores.map(store => data(store.getState())); }
function playerXp(player: { level: number; experience: number }) {
  return xpTotal(player.level) + player.experience;
}
function required<T>(value: T | null | undefined): T {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  if (value === null || value === undefined) throw new Error('Missing observed evidence');
  return value;
}

// Compare only native carry rules; no battle, reward, resource or status injection.
function assertCarry(previous: readonly CombatUnit[], next: readonly CombatUnit[], elapsed: number) {
  const living = previous.filter(unit => inferKind(unit) !== 'summon' && unit.life > 0);
  expect(next.map(unit => unit.id)).toEqual(living.map(unit => unit.id));
  for (const unit of living) {
    const carried = required(next.find(candidate => candidate.id === unit.id));
    expect(carried.life).toBe(Math.min(unit.life, carried.stats.lifeMax));
    expect(carried.mana).toBe(Math.min(unit.mana, carried.stats.manaMax));
    expect(carried.statuses).toEqual(unit.statuses
      .filter(status => status.expiresAtMs === undefined || status.expiresAtMs > elapsed)
      .map(status => ({ ...status,
      ...(status.appliedAtMs === undefined ? {} : { appliedAtMs: status.appliedAtMs - elapsed }),
      ...(status.expiresAtMs === undefined ? {} : { expiresAtMs: status.expiresAtMs - elapsed })
    })));
    expect(carried.activeBuffIds).toEqual(unit.activeBuffIds);
    // Raw fields are retained. Effective scheduler cooldown timers reset per battle.
    expect(carried.cooldowns).toEqual(unit.cooldowns);
    if (carried.mana < carried.stats.manaMax) {
      expect(carried.manaRegenCarry ?? 0).toBe(unit.manaRegenCarry ?? 0);
      expect(carried.manaRegenCompensation ?? 0).toBe(unit.manaRegenCompensation ?? 0);
    }
  }
}

beforeEach(() => {
  production.abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  setIdleEliteMisses(0);
});
afterEach(() => {
  vi.restoreAllMocks();
  production.abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  setIdleEliteMisses(0);
  useHydrationStore.getState().setStatus('idle');
});

describe('isolated fresh earned production adapter', () => {
  it('temporarily becomes ready for a real recipe and restores its loading caller', () => {
    useHydrationStore.getState().setStatus('loading', 'earned-loading-marker');
    const hydration = useHydrationStore.getState();
    const observed = new Set<string>();
    const advance = useCombatStore.getState().advanceEvent;
    vi.spyOn(useCombatStore.getState(), 'advanceEvent').mockImplementation(() => {
      observed.add(useHydrationStore.getState().status);
      advance();
    });
    const result = runEarnedRecipeOnce(tiny, options);
    expect(result.status).toBe('completed');
    expect(observed).toEqual(new Set(['ready']));
    expect(useHydrationStore.getState()).toEqual(hydration);
  });

  it('earns one real W1 award, abandons installed W2 and attempts only the fixed Den seed', () => {
    const original = structuredClone(tiny);
    // Caller sentinels prove isolation only; they must never enter earned gameplay.
    usePlayerStore.getState().setPlayer(createMockPlayer('Caller sentinel', 'barbarian'));
    useInventoryStore.getState().addCurrency('gold', 543);
    useMapStore.getState().setCurrentLocation(3, 'caller-area');
    useFormationStore.getState().setPlayerPosition({ row: 2, col: 2 });
    useMetaStore.getState().updateIdleState({ lastOnline: CLOCK, activeMultiplier: 9,
      multiplierSecondsRemaining: 1000, idleTarget: 'caller-idle' });
    useMetaStore.getState().updateGachaState({ currency: 777, pityCounter: 41 });
    useCombatStore.getState().addLogEntry({ type: 'system', actorId: 'caller',
      actorName: 'Caller', message: 'caller-log' });
    setIdleEliteMisses(17);
    const before = callerState();
    const methods = stores.map(store => store.getState().reset);
    const now = Date.now;
    const result = runEarnedRecipeOnce(tiny, options);
    expect(result.status).toBe('completed');
    expect(result.fixture).toEqual(original);
    expect(tiny).toEqual(original);
    expect(result.targetSeed).toBe(1);
    expect(result.repetition).toBe(1);
    expect(callerState()).toEqual(before);
    expect(stores.map(store => store.getState().reset)).toEqual(methods);
    expect(Date.now).toBe(now);
    expect(getIdleEliteMisses()).toBe(17);
    expect(production.hasActiveSubAreaRun()).toBe(false);
    expect(result.sourceAfter.sourceTreeHash).toBe(result.sourceBefore.sourceTreeHash);
    expect(result.sourceAfter.dataHash).toBe(result.sourceBefore.dataHash);
    expect(result.created.player.player).toEqual(createAtFrozenClock());
    expect(result.created.meta.idleBonusAnchor).toBe(CLOCK);
    expect(result.created.meta.idleState.activeMultiplier).toBe(1);
    expect(result.created.meta.gachaState.currency).toBe(0);
    expect(result.created.inventory.backpack).toEqual([]);
    expect(result.created.merc.ownedMercs).toEqual([]);
    expect(result.actions.map(entry => entry.action)).toEqual(tiny.actions);
    expect(result.actions.every(entry => entry.result.ok)).toBe(true);
    expect(result.actions[0]?.result.productionResult).toEqual({ ok: true, mercId: MERC });
    expect(result.actions[0]?.after.merc.ownedMercs[0]?.level).toBe(3); // Act gate L1, merc reqLevel3.
    expect(result.actions[1]?.result.steps).toEqual(['ok']);
    expect(result.actions[2]?.after.player.player?.comboOrder).toEqual([FIRE]);
    const acquisition = required(result.actions[3]?.farms[0]);
    expect(result.actions[3]?.farms).toHaveLength(1);
    expect(acquisition.handle).toMatchObject({ runId: 'areas/act1-blood-moor',
      totalWaves: 3, runSeed: 2330410254, challengeOrdinal: 0 });
    expect(acquisition.waves).toHaveLength(1);
    const first = required(acquisition.waves[0]);
    expect(first.opening.currentWave).toBe(1);
    expect(first.opening.eventCursor).toBe(0);
    expect(first.opening.playbackComplete).toBe(false);
    expect(first.opening.enemyTeam).toHaveLength(8);
    expect(first.opening.enemyTeam.filter(unit => (/^enemy-act1\.fallen-/u).test(unit.id))).toHaveLength(6);
    expect(first.opening.enemyTeam.filter(unit => (/^enemy-act1\.quill-rat-/u).test(unit.id))).toHaveLength(2);
    expect(first.opening.enemyTeam.every(unit => unit.level === 2 && unit.tier === 'trash')).toBe(true);
    expect(first.opening.outcome?.winner).toBe('player'); // Honest source prediction, no fallback.
    expect(first.played.eventCursor).toBe(first.opening.recordedEvents.length);
    expect(first.played.playbackComplete).toBe(true);
    expect(first.played.playerTeam).toEqual(first.opening.outcome?.finalPlayerTeam);
    expect(first.played.recordedEvents).toEqual(first.opening.recordedEvents);
    expect(first.opening.recordedEvents.at(-1)).toMatchObject({ kind: 'end',
      simClockMs: first.terminalSimClockMs });
    expect(first.advanceResult).toBe('next-wave');
    expect(first.actualDelta.xp).toBe(160);
    expect(first.actualDelta.mercXp[MERC]).toBe(120);
    const earned = required(result.checkpoints.find(point => point.id === 'earned-after-one'));
    const earnedPlayer = required(earned.state.player.player);
    expect(earnedPlayer).toMatchObject({ level: 2, experience: 60, experienceToNextLevel: 565,
      statPoints: 5, skillPoints: 1, derivedStats: {
        life: 120, lifeMax: 128, mana: 102, manaMax: 106, attack: 24, defense: 23, magicResist: 0 } });
    expect(earned.state.merc.mercProgress[MERC]).toEqual({ experience: 120, experienceToNextLevel: 304 });
    expect(first.afterAward).toEqual(earned.state);
    expect(first.actualDelta.addedItems).toEqual(first.rawRewardDelta.items);
    expect(result.acquisitionJournal).toEqual(first.rawRewardDelta.items);
    expect(earned.state.inventory.backpack).toEqual(first.rawRewardDelta.items);
    expect(first.actualDelta.currencies['rune-shard'] ?? 0)
      .toBe(first.rawRewardDelta.runeShards);
    expect(first.actualDelta.currencies['gem-shard'] ?? 0).toBe(0);
    expect(first.actualDelta.materials).toEqual(first.rawRewardDelta.materials);
    expect(first.actualDelta.currencies.wishstone ?? 0).toBe(first.rawRewardDelta.wishstones);
    expect(playerXp(required(first.afterAward.player.player)) -
      playerXp(required(first.beforeAward.player.player))).toBe(160);
    const abandoned = required(acquisition.abandoned);
    expect(abandoned.opening.currentWave).toBe(2);
    expect(abandoned.opening.enemyTeam).toHaveLength(9);
    expect(abandoned.opening.eventCursor).toBe(0);
    expect(abandoned.opening.playbackComplete).toBe(false);
    expect(abandoned.opening.runRewards.items).toEqual(first.rawRewardDelta.items);
    expect(abandoned.afterFlee).toEqual(abandoned.beforeFlee);
    expect(abandoned.activeAfterFlee).toBe(false);
    expect(abandoned.pityAfterFlee).toBe(0);
    expect(abandoned.afterFlee.meta.idleState.idleTarget).toBeUndefined();
    expect(abandoned.afterFlee.map.clearedSubAreas).toEqual([]);
    expect(abandoned.afterFleeCombat.inCombat).toBe(false);
    expect(abandoned.afterFleeCombat.eventCursor).toBe(0);
    assertCarry(required(first.opening.outcome).finalPlayerTeam,
      abandoned.opening.playerTeam, first.terminalSimClockMs);
    const ready = required(result.checkpoints.find(point => point.id === 'ready'));
    expect(ready.state.player.player).toMatchObject({ statPoints: 0, coreStats: { vitality: 15 },
      derivedStats: { life: 120, lifeMax: 138, mana: 102, manaMax: 106 } });
    expect(ready.state.map.questProgress[QUEST]).toEqual({ id: QUEST, status: 'inProgress',
      objectives: { 'obj-clear-den': false, 'obj-return': false } });
    expect(ready.state).toEqual(result.preTarget);
    const target = required(result.target);
    expect(target.handle).toMatchObject({ runId: DEN, runSeed: 1, challengeOrdinal: 1 });
    expect(target.waves.length).toBeGreaterThanOrEqual(1);
    expect(target.waves.length).toBeLessThanOrEqual(target.handle.totalWaves);
    let failed = false;
    for (const [index, wave] of target.waves.entries()) {
      expect(failed).toBe(false); // No attempted wave after a genuine nonwin.
      expect(wave.opening.currentWave).toBe(index + 1);
      expect(wave.played.eventCursor).toBe(wave.opening.recordedEvents.length);
      expect(wave.played.playbackComplete).toBe(true);
      expect(wave.opening.recordedEvents.at(-1)?.kind).toBe('end');
      const outcome = required(wave.opening.outcome);
      if (outcome.winner !== 'player' || !outcome.finalPlayerTeam.some(unit =>
        unit.id === result.created.player.player?.id && unit.life > 0)) {
        failed = true;
        expect(wave.advanceResult).toBe('defeat');
        expect(wave.afterAward).toEqual(wave.beforeAward);
        expect(wave.actualDelta.xp).toBe(0);
        expect(wave.rawRewardDelta.items).toEqual([]);
        expect(Object.values(wave.actualDelta.currencies).every(value => value === 0)).toBe(true);
      }
      if (wave.advanceResult === 'next-wave') {
        assertCarry(outcome.finalPlayerTeam, wave.afterAdvance.playerTeam, wave.terminalSimClockMs);
        expect(wave.afterAdvance.currentWave).toBe(index + 2);
      }
    }
    const last = required(target.waves.at(-1));
    expect(target.terminalAdvance).toBe(last.advanceResult);
    expect(['victory', 'defeat']).toContain(target.terminalAdvance);
    expect(target.carryCoverage).toBe(target.waves.some(wave => wave.advanceResult === 'next-wave')
      ? 'exercised' : 'unexercised');
    expect(result.terminal).toEqual(last.afterAward);
    expect(result.timings.logicalSimSeconds).toBe(
      [first, ...target.waves].reduce((sum, wave) => sum + wave.terminalSimClockMs / 1000, 0));
    expect(result.timings.uiDelayHintSeconds).toBe([first, ...target.waves].reduce((sum, wave) =>
      sum + wave.opening.recordedEvents.reduce((n, event) => n + event.uiDelayMs / 1000, 0), 0));
    expect(result.timings.wallSeconds).toBeGreaterThan(0);
    expect(result.timings.wallSeconds).toBeLessThan(30);
    // Independently cloned observations must survive caller and report mutations.
    const earnedCopy = structuredClone(earned.state);
    ready.state.inventory.backpack.splice(0);
    expect(earned.state).toEqual(earnedCopy);
  });

  it.each([
    { title: 'unknown target seed', input: tiny, opts: { targetSeed: 2, repetition: 1 as const } },
    { title: 'invalid repetition', input: tiny, opts: { targetSeed: 1, repetition: 3 as 1 } },
    { title: 'malformed fixture', input: { ...tiny, state: {} }, opts: options }
  ])('rejects $title before any store mutation', ({ input, opts }) => {
    useHydrationStore.getState().setStatus('error', 'earned-invalid-marker');
    const hydration = useHydrationStore.getState();
    const before = callerState();
    const now = Date.now;
    expect(() => runEarnedRecipeOnce(input, opts)).toThrow();
    expect(useHydrationStore.getState()).toBe(hydration);
    expect(callerState()).toEqual(before);
    expect(Date.now).toBe(now);
  });

  it('rejects an active caller run without aborting, advancing or resetting it', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Active caller', 'sorceress'));
    useHydrationStore.getState().setStatus('ready');
    production.startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 6, challengeOrdinal: 0 });
    useHydrationStore.getState().setStatus('error', 'earned-active-marker');
    const hydration = useHydrationStore.getState();
    const before = callerState();
    const abort = vi.spyOn(production, 'abortSubAreaRun');
    expect(() => runEarnedRecipeOnce(tiny, options)).toThrow(/active/i);
    expect(callerState()).toEqual(before);
    expect(production.hasActiveSubAreaRun()).toBe(true);
    expect(abort).not.toHaveBeenCalled();
    expect(useHydrationStore.getState()).toBe(hydration);
  });

  it('preserves one spent point when the next skill point refuses and never farms', () => {
    const result = runEarnedRecipeOnce(recipe([
      { kind: 'allocate-skill', skillId: FIRE, points: 2 }
    ]), options);
    expect(result.status).toBe('action-refused');
    expect(result.refusal).toEqual({ actionIndex: 0, reason: 'no-points' });
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.result.steps).toEqual(['ok', 'no-points']);
    expect(getAllocatedSkillLevel(required(result.terminal.player.player).skillLevels ?? {}, FIRE)).toBe(1);
    expect(result.terminal.player.player?.skillPoints).toBe(0);
    expect(result.actions[0]?.farms).toEqual([]);
    expect(result.target).toBeNull();
    expect(usePlayerStore.getState().player).toBeNull();
  });

  it.each([
    { title: 'duplicate hire', actions: [{ kind: 'hire-merc', mercId: MERC },
      { kind: 'hire-merc', mercId: MERC }] as EarnedAction[], reason: 'already-owned', index: 1 },
    { title: 'locked act2 roster', actions: [{ kind: 'hire-merc', mercId: 'mercs/act2-prayer' }] as EarnedAction[],
      reason: 'hire-act-locked', index: 0 },
    { title: 'unlearned combo', actions: [{ kind: 'set-combo', skillIds: [FIRE] }] as EarnedAction[],
      reason: 'combo-unavailable', index: 0 },
    { title: 'level-locked combo', actions: [{ kind: 'set-combo',
      skillIds: ['skills-sorceress-frozen-orb'] }] as EarnedAction[], reason: 'combo-unavailable', index: 0 },
    { title: 'stat overspend', actions: [{ kind: 'allocate-stats', deltas: {
      strength: 0, dexterity: 0, vitality: 1, energy: 0 } }] as EarnedAction[],
      reason: 'insufficient-points', index: 0 },
    { title: 'missing earned hero gear', actions: [{ kind: 'equip-earned', owner: 'hero', slot: 'gloves',
      selector: { baseId: 'items/base/glove-leather', rarity: 'normal', defense: 5,
        selection: 'first-acquired' } }] as EarnedAction[], reason: 'earned-item-unavailable', index: 0 },
    { title: 'missing earned merc gear', actions: [{ kind: 'equip-earned', owner: 'merc', mercId: MERC,
      slot: 'boots', selector: { baseId: 'items/base/boot-leather', rarity: 'normal', defense: 3,
        selection: 'first-acquired' } }] as EarnedAction[], reason: 'earned-item-unavailable', index: 0 },
    { title: 'duplicate quest acceptance', actions: [{ kind: 'accept-quest', questId: QUEST },
      { kind: 'accept-quest', questId: QUEST }] as EarnedAction[], reason: 'quest-unavailable', index: 1 }
  ])('returns an honest $title refusal with full restoration', ({ actions, reason, index }) => {
    useMetaStore.getState().updateGachaState({ currency: 987 });
    const before = callerState();
    const result = runEarnedRecipeOnce(recipe(actions), options);
    expect(result.status).toBe('action-refused');
    expect(result.refusal).toEqual({ actionIndex: index, reason });
    expect(result.actions).toHaveLength(index + 1);
    expect(result.actions.at(-1)?.result.ok).toBe(false);
    expect(result.actions.every(entry => entry.farms.length === 0)).toBe(true);
    expect(result.target).toBeNull();
    expect(callerState()).toEqual(before);
  });

  it('restores all seven stores, pity and Date after a thrown real action boundary', () => {
    const failure = new Error('action sentinel');
    useHydrationStore.getState().setStatus('error', 'earned-action-marker');
    const hydration = useHydrationStore.getState();
    let observedStatus: string | undefined;
    vi.spyOn(usePlayerStore.getState(), 'allocateSkillPoint').mockImplementation(() => {
      observedStatus = useHydrationStore.getState().status;
      throw failure;
    });
    useMetaStore.getState().updateGachaState({ currency: 432 });
    setIdleEliteMisses(9);
    const before = callerState();
    const now = Date.now;
    let caught: unknown;
    try { runEarnedRecipeOnce(tiny, options); } catch (error) { caught = error; }
    expect(caught).toBe(failure);
    expect(observedStatus).toBe('ready');
    expect(useHydrationStore.getState()).toEqual(hydration);
    expect(callerState()).toEqual(before);
    expect(getIdleEliteMisses()).toBe(9);
    expect(Date.now).toBe(now);
    expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it('keeps the original error and attempts later cleanup after one restore fails', () => {
    const original = new Error('original action failure');
    const cleanup = new Error('map restore failure');
    useHydrationStore.getState().setStatus('error', 'earned-cleanup-marker');
    const hydration = useHydrationStore.getState();
    let observedStatus: string | undefined;
    vi.spyOn(usePlayerStore.getState(), 'allocateSkillPoint').mockImplementation(() => {
      observedStatus = useHydrationStore.getState().status;
      throw original;
    });
    useMetaStore.getState().updateGachaState({ currency: 765 });
    useFormationStore.getState().setPlayerPosition({ row: 2, col: 2 });
    const beforeMeta = data(useMetaStore.getState());
    const beforeFormation = data(useFormationStore.getState());
    const actualSet = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementation((state, replace) => {
      if (replace) throw cleanup;
      return actualSet(state, replace);
    });
    setIdleEliteMisses(23);
    const now = Date.now;
    const collect = identity.collectSourceState;
    let collections = 0;
    vi.spyOn(identity, 'collectSourceState').mockImplementation(root => {
      if (collections++ > 0) {
        expect(Date.now).toBe(now);
        expect(useHydrationStore.getState()).toEqual(hydration);
        expect(getIdleEliteMisses()).toBe(23);
        expect(data(useMetaStore.getState())).toEqual(beforeMeta);
        expect(data(useFormationStore.getState())).toEqual(beforeFormation);
        expect(production.hasActiveSubAreaRun()).toBe(false);
      }
      return collect(root);
    });
    let caught: unknown;
    try { runEarnedRecipeOnce(tiny, options); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toContain(original);
    expect((caught as AggregateError).errors).toContain(cleanup);
    expect((caught as AggregateError).errors).toHaveLength(2);
    expect((caught as AggregateError).errors[0]).toBe(original);
    expect((caught as AggregateError).errors[1]).toBe(cleanup);
    expect(observedStatus).toBe('ready');
    expect(useHydrationStore.getState()).toEqual(hydration);
    expect(collections).toBe(2);
    expect(data(useMetaStore.getState())).toEqual(beforeMeta);
    expect(data(useFormationStore.getState())).toEqual(beforeFormation);
    expect(getIdleEliteMisses()).toBe(23);
    expect(Date.now).toBe(now);
    expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it('retains an action error together with final source drift after restoring the caller', () => {
    const failure = new Error('action before source drift');
    vi.spyOn(usePlayerStore.getState(), 'allocateSkillPoint').mockImplementation(() => { throw failure; });
    const before = callerState();
    const now = Date.now;
    const collect = identity.collectSourceState;
    let calls = 0;
    vi.spyOn(identity, 'collectSourceState').mockImplementation(root => {
      const source = collect(root);
      if (calls++ === 0) return source;
      expect(callerState()).toEqual(before);
      expect(Date.now).toBe(now);
      return { ...source, dataHash: '0'.repeat(64) };
    });
    let caught: unknown;
    try { runEarnedRecipeOnce(tiny, options); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toContain(failure);
    expect((caught as AggregateError).errors.some((error: unknown) =>
      error instanceof Error && /drift/i.test(error.message))).toBe(true);
    expect(calls).toBe(2);
  });

  it('refuses source drift after restoration while preserving caller state', () => {
    const collect = identity.collectSourceState;
    let calls = 0;
    vi.spyOn(identity, 'collectSourceState').mockImplementation(root => {
      const source = collect(root);
      if (calls++ === 0) return source;
      expect(callerState()).toEqual(before);
      expect(Date.now).toBe(now);
      return { ...source, sourceTreeHash: 'f'.repeat(64) };
    });
    const before = callerState();
    const now = Date.now;
    expect(() => runEarnedRecipeOnce(recipe([{ kind: 'set-combo', skillIds: [FIRE] }]), options))
      .toThrow(/drift/i);
    expect(callerState()).toEqual(before);
    expect(Date.now).toBe(now);
    expect(calls).toBe(2);
  });

  it('rejects an idle finalization after completed real playback without retrying', () => {
    const advance = vi.spyOn(production, 'advanceWaveOrFinish').mockReturnValue('idle');
    const before = callerState();
    const now = Date.now;
    expect(() => runEarnedRecipeOnce(tiny, options)).toThrow();
    expect(advance).toHaveBeenCalledTimes(1);
    expect(callerState()).toEqual(before);
    expect(Date.now).toBe(now);
    expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it.each(['null-handle', 'stalled-cursor', 'missing-outcome', 'missing-end'] as const)(
    'throws and restores on structural production error: %s', fault => {
      if (fault === 'null-handle') vi.spyOn(production, 'startSubAreaRun').mockReturnValue(null);
      if (fault === 'stalled-cursor') vi.spyOn(useCombatStore.getState(), 'advanceEvent')
        .mockImplementation(() => undefined);
      if (fault === 'missing-outcome' || fault === 'missing-end') {
        const install = useCombatStore.getState().publishStagedRecordedBattle;
        vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementation(input => {
          install(input);
          if (fault === 'missing-outcome') useCombatStore.setState({ outcome: null });
          else useCombatStore.setState({ recordedEvents: input.recordedEvents.slice(0, -1) });
        });
      }
      const before = callerState();
      const now = Date.now;
      expect(() => runEarnedRecipeOnce(tiny, options)).toThrow();
      if (fault === 'missing-outcome' || fault === 'missing-end') {
        expect(useCombatStore.getState().publishStagedRecordedBattle).toHaveBeenCalledTimes(1);
      }
      expect(callerState()).toEqual(before);
      expect(Date.now).toBe(now);
      expect(production.hasActiveSubAreaRun()).toBe(false);
    });
});

function createAtFrozenClock() {
  const original = Date.now;
  try { Date.now = () => CLOCK; return createMockPlayer('Tiny Earned', 'sorceress'); }
  finally { Date.now = original; }
}

describe('synthetic pure item selection contracts — not earned gameplay evidence', () => {
  const selector = { baseId: 'items/base/glove-leather', rarity: 'normal' as const,
    defense: 5, selection: 'first-acquired' as const };
  const item = (id: string, defense = 5): Item => ({ id, baseId: selector.baseId,
    rarity: 'normal', level: 1, identified: true, equipped: false, baseRolls: { defense } });
  it('uses acquisition journal order even when an older displaced item is last in the backpack', () => {
    const old = item('old'); const newer = item('newer');
    expect(selectEarnedBackpackItem(selector, 'gloves', [old, newer], [newer, old])).toBe(old);
  });
  it('returns the current backpack object by earned ID and uses its current displayed defense', () => {
    const original = item('same-id', 4);
    const current = { ...original, baseRolls: { defense: 5 } };
    expect(selectEarnedBackpackItem(selector, 'gloves', [original], [current])).toBe(current);
    expect(selectEarnedBackpackItem({ ...selector, defense: 4 }, 'gloves', [original], [current]))
      .toBeUndefined();
  });
  it('uses catalog displayed defense when a normal earned item has no explicit roll', () => {
    const unrolled: Item = { id: 'synthetic-unrolled', baseId: selector.baseId,
      rarity: 'normal', level: 1, identified: true, equipped: false };
    expect(selectEarnedBackpackItem({ ...selector, defense: 4 }, 'gloves', [unrolled], [unrolled]))
      .toBe(unrolled); // Real catalog baseDefense4; no invented normal-item affix.
    expect(selectEarnedBackpackItem(selector, 'gloves', [unrolled], [unrolled])).toBeUndefined();
  });
  it('skips earlier earned items absent from backpack and ignores unearned lookalikes', () => {
    const gone = item('gone'); const earned = item('earned'); const injected = item('synthetic-unearned');
    expect(selectEarnedBackpackItem(selector, 'gloves', [gone, earned], [injected, earned])).toBe(earned);
    expect(selectEarnedBackpackItem(selector, 'gloves', [gone], [injected])).toBeUndefined();
  });
  it('matches displayed defense, exact base, rarity and slot with no fallback', () => {
    const wrongRoll = item('wrong-roll', 4);
    const correct = item('correct');
    const wrongRarity = { ...correct, id: 'rare', rarity: 'rare' as const };
    const wrongBase = { ...correct, id: 'boots', baseId: 'items/base/boot-leather' };
    const journal = [wrongRoll, wrongRarity, wrongBase, correct];
    expect(selectEarnedBackpackItem(selector, 'gloves', journal, journal)).toBe(correct);
    expect(selectEarnedBackpackItem(selector, 'boots', journal, journal)).toBeUndefined();
    expect(selectEarnedBackpackItem({ ...selector, defense: 999 }, 'gloves', journal, journal)).toBeUndefined();
  });
});


describe('tiny-derived positive earned equipment — fixed clock, seed and single farm', () => {
  it('equips original earned glove and boots on their declared owners before the target', () => {
    // D05 expands the TC pool. Retained discovery offset17 earns both original
    // glove5/boots3 in one real farm; the original tiny clock remains unchanged.
    const variant: EarnedFixture = { ...structuredClone(tiny), id: 'earned-adapter-tiny-equipped',
      clockEpochMs: CLOCK + 17,
      actions: [...structuredClone(tiny.actions),
        { kind: 'equip-earned', owner: 'hero', slot: 'gloves', selector: {
          baseId: 'items/base/glove-leather', rarity: 'normal', defense: 5, selection: 'first-acquired' } },
        { kind: 'equip-earned', owner: 'merc', mercId: MERC, slot: 'boots', selector: {
          baseId: 'items/base/boot-leather', rarity: 'normal', defense: 3, selection: 'first-acquired' } },
        { kind: 'checkpoint', id: 'equipped-ready' }]
    };
    const before = callerState();
    const now = Date.now;
    const methods = stores.map(store => store.getState().reset);
    const result = runEarnedRecipeOnce(variant, options);
    expect(result.actions[3]?.farms[0]?.handle).toMatchObject({ runSeed: 2330410292, challengeOrdinal: 0 });
    const hero = required(result.actions[tiny.actions.length]);
    expect(hero.result.ok).toBe(true);
    expect(hero.result.productionResult).toEqual({ ok: true });
    const glove = required(result.acquisitionJournal.find(item =>
      item.baseId === 'items/base/glove-leather' && item.rarity === 'normal' &&
      item.baseRolls?.defense === 5)); // Observed original normal roll; no ID substitution.
    expect(hero.result.itemId).toBe(glove.id);
    expect(hero.before.inventory.backpack).toContainEqual(glove);
    expect(hero.after.inventory.backpack).toEqual(hero.before.inventory.backpack.filter(item => item.id !== glove.id));
    expect(hero.after.inventory.equipped).toEqual({ ...hero.before.inventory.equipped,
      gloves: { ...glove, equipped: true } });
    expect(hero.after.player.player).toEqual({ ...required(hero.before.player.player),
      derivedStats: { ...required(hero.before.player.player).derivedStats, defense: 28 } });
    expect(hero.after.merc).toEqual(hero.before.merc);
    expect(hero.after.inventory.currencies).toEqual(hero.before.inventory.currencies);
    expect(hero.after.inventory.stash).toEqual(hero.before.inventory.stash);
    for (const key of ['map', 'formation', 'meta'] as const) expect(hero.after[key]).toEqual(hero.before[key]);
    const merc = required(result.actions[tiny.actions.length + 1]);
    expect(merc.result.ok).toBe(true);
    expect(merc.result.productionResult).toEqual({ ok: true });
    const boots = required(result.acquisitionJournal.find(item =>
      item.baseId === 'items/base/boot-leather' && item.rarity === 'normal' && item.baseRolls?.defense === 3));
    expect(merc.result.itemId).toBe(boots.id);
    expect(merc.before).toEqual(hero.after);
    expect(merc.before.inventory.backpack).toContainEqual(boots);
    expect(merc.after.inventory.backpack).toEqual(merc.before.inventory.backpack.filter(item => item.id !== boots.id));
    expect(merc.after.inventory.equipped).toEqual(hero.after.inventory.equipped);
    expect(merc.after.merc).toEqual({ ...merc.before.merc,
      mercEquipment: { ...merc.before.merc.mercEquipment, [MERC]: {
        ...merc.before.merc.mercEquipment[MERC], boots: { ...boots, equipped: true, equipSlot: 'boots' } } } });
    expect(merc.after.inventory.currencies).toEqual(merc.before.inventory.currencies);
    expect(merc.after.inventory.stash).toEqual(merc.before.inventory.stash);
    for (const key of ['player', 'map', 'formation', 'meta'] as const) expect(merc.after[key]).toEqual(merc.before[key]);
    expect(result.status).toBe('completed');
    expect(result.actions.every(action => action.result.ok)).toBe(true);
    expect(result.fixture).toEqual(variant);
    const ready = required(result.checkpoints.find(point => point.id === 'equipped-ready'));
    expect(ready.state).toEqual(merc.after);
    expect(ready.state).toEqual(result.preTarget);
    expect(ready.state.player.player?.derivedStats).toMatchObject({
      life: 120, lifeMax: 138, mana: 102, manaMax: 106, defense: 28, magicResist: 0 });
    expect(ready.state.merc.ownedMercs[0]?.derivedStats.defense).toBe(26);
    const opening = required(result.target?.waves[0]?.opening);
    expect(required(opening.playerTeam.find(unit => unit.id === ready.state.player.player?.id)).stats.defense).toBe(28);
    const projectedMerc = required(opening.playerTeam.find(unit => unit.id === `merc-${MERC}`));
    expect(projectedMerc.stats.defense).toBe(29);
    expect(projectedMerc.stats.magicResist).toBe(0);
    expect(callerState()).toEqual(before);
    expect(stores.map(store => store.getState().reset)).toEqual(methods);
    expect(Date.now).toBe(now);
    expect(getIdleEliteMisses()).toBe(0);
    expect(production.hasActiveSubAreaRun()).toBe(false);
    expect(result.sourceAfter.sourceTreeHash).toBe(result.sourceBefore.sourceTreeHash);
    expect(result.sourceAfter.dataHash).toBe(result.sourceBefore.dataHash);
  });
});

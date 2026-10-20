import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { xpTotal, xpForKill } from '@/engine/progression/xp';
import { inferKind } from '@/engine/combat/types';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import * as production from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import * as playback from './earned-playback';
import * as identity from './provenance';
import { encodeObservation } from './earned-report';
import { captureEarnedRestorers, observeEarnedState, observeStore } from './earned-state';
import { runRestoredModeOnce, type RestoredModeAttempt } from './mode-adapter';

const CLOCK = 1792497600000;
const FIRE = 'skills-sorceress-fire-bolt';
const MERC = 'mercs/act1-rogue-inner-sight';
const AREA = 'areas/act1-blood-moor';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useFormationStore, useCombatStore, useMetaStore] as const;
const normal = { mode: 'manual', idleEliteMisses: 0 } as const;
function caller() {
  return { domains: observeEarnedState(), combat: observeStore(useCombatStore),
    methods: stores.map(store => Object.entries(store.getState()).filter(([, v]) => typeof v === 'function')),
    pity: getIdleEliteMisses(), now: Date.now };
}
function sentinels() {
  vi.spyOn(Date, 'now').mockReturnValue(CLOCK - 2222);
  usePlayerStore.getState().setPlayer(createMockPlayer('Caller', 'barbarian'));
  useInventoryStore.getState().addCurrency('gold', 543);
  useMapStore.getState().setCurrentLocation(3, 'caller-area');
  useMercStore.setState({ mercProgress: { caller: { experience: 19, experienceToNextLevel: 29 } } });
  useFormationStore.getState().setPlayerPosition({ row: 2, col: 2 });
  useCombatStore.getState().addLogEntry({ type: 'system', actorId: 'caller', actorName: 'Caller', message: 'caller' });
  useMetaStore.getState().updateIdleState({ lastOnline: CLOCK - 1234, activeMultiplier: 9,
    multiplierSecondsRemaining: 1000, idleTarget: 'caller-idle' });
  useMetaStore.getState().updateGachaState({ currency: 777, pityCounter: 41 });
  setIdleEliteMisses(17);
}
function totalXp(player: { level: number; experience: number } | null) {
  if (!player) throw new Error('Missing observed player');
  return xpTotal(player.level) + player.experience;
}
function observe(input: unknown): RestoredModeAttempt {
  let result: RestoredModeAttempt | undefined;
  // This capability assertion executes even at the minimal throwing-boundary RED.
  expect(() => { result = runRestoredModeOnce(input); }).not.toThrow();
  if (!result) throw new Error('Missing mode observation');
  return result;
}
const assertionCounts: { name: string | undefined; assertions: number }[] = [];
let originalNow: typeof Date.now;
let restore: (() => void)[];
beforeEach(() => {
  production.abortSubAreaRun();
  originalNow = Date.now;
  restore = captureEarnedRestorers();
  for (const store of stores) store.getState().reset();
  setIdleEliteMisses(0);
});
afterEach(() => {
  const state = expect.getState();
  assertionCounts.push({ name: state.currentTestName, assertions: state.assertionCalls });
  vi.restoreAllMocks();
  Date.now = originalNow;
  production.abortSubAreaRun();
  for (const reset of restore) reset();
  setIdleEliteMisses(0);
});

afterAll(() => {
  const output = process.env.D2H5_MODE_ASSERT_OUT;
  if (output) identity.writeNewReport(root, output, assertionCounts);
});

function assertInstalledGuard(combat: RestoredModeAttempt['terminalCombat']) {
  if (combat.currentWave < 2) return;
  expect(combat.currentWavePresentation?.isForcedElite).toBe(true);
  const tier = combat.currentWave === 3 ? 'rare-elite' : 'champion';
  expect(combat.enemyTeam.some(unit => unit.tier === tier)).toBe(true);
}

describe('closed restored production modes', () => {
  it('retains four native mode/pity observations and restores every caller domain and method', () => {
    sentinels();
    const before = caller();
    let early = 0; let repeated = 0;
    const start = playback.startEarnedRun;
    vi.spyOn(playback, 'startEarnedRun').mockImplementation(options => {
      const handle = start(options);
      const state = caller();
      expect(production.advanceWaveOrFinish()).toBe('idle');
      expect(caller()).toEqual(state);
      early++;
      return handle;
    });
    const play = playback.playEarnedWave;
    vi.spyOn(playback, 'playEarnedWave').mockImplementation((handle, index) => {
      const wave = play(handle, index);
      if (wave.advanceResult !== 'next-wave') {
        const state = caller();
        expect(production.advanceWaveOrFinish()).toBe('idle');
        expect(caller()).toEqual(state);
        repeated++;
      }
      return wave;
    });
    const attempts: RestoredModeAttempt[] = [];
    for (const idleEliteMisses of [0, 11] as const) {
      for (const mode of ['manual', 'idle'] as const) {
        const options = { mode, idleEliteMisses };
        const result = observe(options);
        attempts.push(result);
        expect(caller()).toEqual(before);
        expect(production.hasActiveSubAreaRun()).toBe(false);
        expect(result.options).toEqual(options);
        expect(result.baselineTag).toBe('restored-test-baseline-v1');
        expect(result.scope).toEqual({ synthetic: true, uiEligible: false, syntheticClear: false, routingExercised: false });
        expect(result.clockEpochMs).toBe(CLOCK);
        expect(result.status).toBe('completed');
        expect(result.refusal).toBeNull();
        const now = Date.now;
        let created;
        try { Date.now = () => CLOCK; created = createMockPlayer('Restored mode diagnostic', 'sorceress'); }
        finally { Date.now = now; }
        expect(result.created.player.player).toEqual(created);
        expect(result.created.meta.idleBonusAnchor).toBe(CLOCK);
        expect(result.created.meta.idleState.activeMultiplier).toBe(1);
        expect(result.created.meta.idleState.idleTarget).toBeUndefined();
        expect(result.actions.map(action => action.kind)).toEqual(['hire-merc', 'allocate-skill', 'set-combo']);
        expect(result.actions.every(action => action.result.ok)).toBe(true);
        expect(result.actions[0]?.result.productionResult).toEqual({ ok: true, mercId: MERC });
        expect(result.actions[1]?.result.productionResult).toBe('ok');
        expect(result.baseline.player.player).toEqual({ ...created, skillPoints: 0, comboOrder: [FIRE],
          skillLevels: { ...created?.skillLevels, 'sorceress.fire_bolt': 1 } });
        expect(result.baseline.map.currentAct).toBe(1);
        expect(result.baseline.map.currentSubAreaId).toBe(AREA);
        expect(result.baseline.merc.fieldedMercId).toBe(MERC);
        expect(result.baseline.inventory.backpack).toEqual([]);
        expect(result.baseline.map.clearedSubAreas).toEqual([]);
        expect(result.baseline.map.questProgress).toEqual({});
        expect(result.baseline.meta.idleState.idleTarget).toBeUndefined();
        expect(result.baselinePity).toBe(idleEliteMisses);
        expect(result.baselineCombat.inCombat).toBe(false);
        expect(result.handle).toEqual({ runId: AREA, totalWaves: 3, runSeed: 2330410254, challengeOrdinal: 0 });
        expect(result.waves.length).toBeGreaterThanOrEqual(1);
        expect(result.waves.length).toBeLessThanOrEqual(3);
        expect(['victory', 'defeat']).toContain(result.waves.at(-1)?.advanceResult);
        let logical = 0; let ui = 0; let priorPity = idleEliteMisses as number;
        for (const [index, wave] of result.waves.entries()) {
          expect(wave.index).toBe(index);
          expect(wave.pityBefore).toBe(priorPity);
          priorPity = wave.pityAfter;
          expect(wave.opening.currentWave).toBe(index + 1);
          expect(wave.opening.eventCursor).toBe(0);
          expect(wave.played.eventCursor).toBe(wave.opening.recordedEvents.length);
          expect(wave.played.playbackComplete).toBe(true);
          expect(wave.played.recordedEvents).toEqual(wave.opening.recordedEvents);
          expect(wave.opening.recordedEvents.at(-1)).toMatchObject({ kind: 'end', simClockMs: wave.terminalSimClockMs });
          const outcome = wave.opening.outcome;
          if (!outcome) throw new Error('Missing native outcome');
          const qualified = outcome.winner === 'player' && outcome.finalPlayerTeam.some(unit =>
            unit.id === wave.beforeAward.player.player?.id && unit.life > 0);
          const xp = qualified ? outcome.finalEnemyTeam.filter(unit => unit.life <= 0 && inferKind(unit) !== 'summon')
            .reduce((sum, unit) => sum + xpForKill(unit.level), 0) : 0;
          expect(totalXp(wave.afterAward.player.player) - totalXp(wave.beforeAward.player.player)).toBe(xp);
          expect(wave.actualDelta.xp).toBe(xp);
          const oldIds = new Set(wave.beforeAward.inventory.backpack.map(item => item.id));
          expect(wave.actualDelta.addedItems).toEqual(wave.afterAward.inventory.backpack.filter(item => !oldIds.has(item.id)));
          expect(wave.actualDelta.removedItemIds).toEqual([]);
          const currencyKeys = new Set([...Object.keys(wave.beforeAward.inventory.currencies), ...Object.keys(wave.afterAward.inventory.currencies)]);
          expect(wave.actualDelta.currencies).toEqual(Object.fromEntries([...currencyKeys].map(id => [id,
            (wave.afterAward.inventory.currencies[id] ?? 0) - (wave.beforeAward.inventory.currencies[id] ?? 0)])));
          const mercTotal = (domain: typeof wave.beforeAward) => {
            const merc = domain.merc.ownedMercs.find(unit => unit.id === MERC);
            if (!merc) throw new Error('Missing native merc');
            let total = domain.merc.mercProgress[MERC]?.experience ?? 0;
            for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
            return total;
          };
          const mercXp = mercTotal(wave.afterAward) - mercTotal(wave.beforeAward);
          expect(mercXp).toBe(Math.floor(xp * 0.75));
          expect(wave.actualDelta.mercXp[MERC]).toBe(mercXp);
          expect(wave.actualDelta.addedItems).toEqual(wave.rawRewardDelta.items);
          expect(wave.actualDelta.currencies['rune-shard'] ?? 0).toBe(wave.rawRewardDelta.runeShards + wave.rawRewardDelta.runes);
          expect(wave.actualDelta.currencies['gem-shard'] ?? 0).toBe(wave.rawRewardDelta.gems);
          expect(wave.actualDelta.currencies.wishstone ?? 0).toBe(wave.rawRewardDelta.wishstones);
          if (!qualified) {
            expect(wave.advanceResult).toBe('defeat');
            expect(wave.afterAward).toEqual(wave.beforeAward);
            expect(wave.afterAdvance.runRewards).toEqual(wave.played.runRewards);
          }
          if (mode === 'manual') expect(wave.pityAfter).toBe(idleEliteMisses);
          else if (wave.opening.currentWavePresentation?.idleEliteMissesAfterWave !== undefined)
            expect(wave.pityAfter).toBe(wave.opening.currentWavePresentation.idleEliteMissesAfterWave);
          else expect(wave.pityAfter).toBe(wave.pityBefore);
          assertInstalledGuard(wave.opening);
          if (wave.advanceResult === 'next-wave') assertInstalledGuard(wave.afterAdvance);
          const next = result.waves[index + 1];
          if (next) {
            expect(wave.advanceResult).toBe('next-wave');
            const living = outcome.finalPlayerTeam.filter(unit => inferKind(unit) !== 'summon' && unit.life > 0);
            expect(next.opening.playerTeam.map(unit => unit.id)).toEqual(living.map(unit => unit.id));
            for (const unit of living) {
              const carried = next.opening.playerTeam.find(candidate => candidate.id === unit.id);
              expect(carried?.life).toBe(Math.min(unit.life, carried?.stats.lifeMax ?? 0));
              expect(carried?.mana).toBe(Math.min(unit.mana, carried?.stats.manaMax ?? 0));
            }
          }
          logical += wave.terminalSimClockMs / 1000;
          ui += wave.opening.recordedEvents.reduce((sum, event) => sum + event.uiDelayMs / 1000, 0);
        }
        if (mode === 'manual') {
          expect(result.waves[0]?.opening.currentWavePresentation?.kind).toBe('trash');
          expect(result.waves[0]?.opening.currentWavePresentation?.isIdleElite).toBeUndefined();
          expect(result.waves[0]?.opening.outcome?.winner).toBe('player');
          expect(result.waves[0]?.actualDelta.xp).toBe(160);
          expect(result.waves[0]?.actualDelta.mercXp[MERC]).toBe(120);
        }
        if (mode === 'idle' && idleEliteMisses === 11) {
          expect(result.waves[0]?.opening.enemyTeam.some(unit => unit.tier === 'rare-elite')).toBe(true);
          expect(result.waves[0]?.opening.currentWavePresentation).toMatchObject({ isIdleElite: true, idleEliteMissesAfterWave: 0 });
          expect(result.waves[0]?.pityAfter).toBe(0);
        }
        expect(result.terminalPity).toBe(priorPity);
        expect(result.terminal).toEqual(result.waves.at(-1)?.afterAward);
        expect(result.terminalCombat).toEqual(result.waves.at(-1)?.afterAdvance);
        expect(result.timings.logicalSimSeconds).toBe(logical);
        expect(result.timings.uiDelayHintSeconds).toBe(ui);
        expect(result.timings.wallSeconds).toBeGreaterThanOrEqual(0);
        expect(result.sourceAfter).toEqual(result.sourceBefore);
        for (const relative of ['tests/sim/production/mode-adapter.ts', 'tests/sim/production/mode-adapter.test.ts']) {
          const bytes = readFileSync(new URL(relative, new URL('../../../', import.meta.url)));
          expect(result.sourceBefore.manifest.find(entry => entry.path === relative)).toEqual({
            path: relative, byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
        }
      }
    }
    expect(early).toBe(4); expect(repeated).toBe(4);
    for (const offset of [0, 2]) {
      expect(attempts[offset]?.baseline).toEqual(attempts[offset + 1]?.baseline);
      expect(attempts[offset]?.baselineCombat).toEqual(attempts[offset + 1]?.baselineCombat);
    }
    const output = process.env.D2H5_MODE_TEST_OUT;
    if (output) identity.writeNewReport(root, output, encodeObservation({ attempts }));
  });

  it.each([undefined, {}, { mode: 'offline', idleEliteMisses: 0 },
    { mode: 'manual', idleEliteMisses: 1 }, { ...normal, seed: 1 }])('rejects invalid closed options %j before collection or mutation', input => {
    sentinels(); const before = caller();
    const collect = vi.spyOn(identity, 'collectSourceState');
    expect(() => runRestoredModeOnce(input)).toThrow(/options/i);
    expect(collect).not.toHaveBeenCalled();
    expect(caller()).toEqual(before);
  });

  it('rejects a pre-existing run without disturbing its recording or caller', () => {
    sentinels();
    production.startSubAreaRun({ act: 1, subAreaId: AREA, runSeed: 2330410254, challengeOrdinal: 0 });
    const before = caller();
    const collect = vi.spyOn(identity, 'collectSourceState');
    expect(() => runRestoredModeOnce(normal)).toThrow(/active production run/i);
    expect(collect).not.toHaveBeenCalled(); expect(caller()).toEqual(before);
    expect(production.hasActiveSubAreaRun()).toBe(true);
  });

  it.each(['hire', 'skill'] as const)('retains partial native %s refusal and restores the caller', kind => {
    sentinels();
    if (kind === 'hire') vi.spyOn(useMercStore.getState(), 'hireMerc').mockReturnValue({ ok: false, reason: 'already-owned' });
    else vi.spyOn(usePlayerStore.getState(), 'allocateSkillPoint').mockReturnValue('no-points');
    const before = caller();
    const result = observe(normal);
    expect(result.status).toBe('baseline-refused');
    expect(result.refusal).toEqual({ actionIndex: kind === 'hire' ? 0 : 1,
      reason: kind === 'hire' ? 'already-owned' : 'no-points' });
    expect(result.actions).toHaveLength(kind === 'hire' ? 1 : 2);
    expect(result.actions.at(-1)?.result.ok).toBe(false);
    expect(result.baseline).toEqual(result.actions.at(-1)?.after);
    expect(result.terminal).toEqual(result.baseline);
    expect(result.handle).toBeNull(); expect(result.waves).toEqual([]);
    expect(caller()).toEqual(before); expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it.each(['initialization', 'playback'] as const)('preserves the original %s error identity and restores all caller state', stage => {
    sentinels(); const error = new Error(stage);
    if (stage === 'initialization') vi.spyOn(usePlayerStore.getState(), 'setPlayer').mockImplementation(() => { throw error; });
    else vi.spyOn(useCombatStore.getState(), 'advanceEvent').mockImplementation(() => { throw error; });
    const before = caller();
    let caught: unknown;
    try { runRestoredModeOnce(normal); } catch (failure) { caught = failure; }
    expect(caught).toBe(error);
    expect(caller()).toEqual(before); expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it('aggregates cleanup failure after the original failure and still runs later restorers', () => {
    sentinels(); const original = new Error('primary'); const cleanup = new Error('cleanup');
    vi.spyOn(useCombatStore.getState(), 'advanceEvent').mockImplementation(() => { throw original; });
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => { throw cleanup; });
    const before = caller(); let caught: unknown;
    try { runRestoredModeOnce(normal); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    if (!(caught instanceof AggregateError)) throw new Error('Missing cleanup aggregate');
    expect(caught.errors).toHaveLength(2);
    expect(caught.errors[0]).toBe(original); expect(caught.errors[1]).toBe(cleanup);
    const after = caller();
    expect(after.domains.player).toEqual(before.domains.player);
    for (const key of ['map', 'merc', 'formation', 'meta'] as const) expect(after.domains[key]).toEqual(before.domains[key]);
    expect(after.combat).toEqual(before.combat); expect(after.methods).toEqual(before.methods);
    expect(after.now).toBe(before.now); expect(after.pity).toBe(before.pity);
    expect(production.hasActiveSubAreaRun()).toBe(false);
  });

  it.each(['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion', 'manifest', 'collectionPolicy'] as const)(
    'rejects synthetic %s drift after restoration', field => {
      sentinels(); const before = caller(); const collect = identity.collectSourceState;
      let calls = 0;
      vi.spyOn(identity, 'collectSourceState').mockImplementation(repo => {
        const state = collect(repo);
        if (++calls === 1) return state;
        if (field === 'manifest') return { ...state, manifest: state.manifest.slice(1) };
        if (field === 'collectionPolicy') return { ...state, collectionPolicy: { ...state.collectionPolicy, version: 'synthetic-drift' } } as unknown as identity.SourceState;
        return { ...state, [field]: 'synthetic-drift' };
      });
      expect(() => runRestoredModeOnce(normal)).toThrow(/source\/tool identity drift/i);
      expect(caller()).toEqual(before); expect(production.hasActiveSubAreaRun()).toBe(false);
    });
});

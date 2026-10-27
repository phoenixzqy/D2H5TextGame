import { beforeAll, expect, it } from 'vitest';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { observeEarnedState, observeStore } from './earned-state';
import { P15_POLICY } from './p15-build-screen-policy';
import {
  loadP15Source,
  prepareP15Build,
  runP15Attempt,
  withP15Realm,
  observeP15Wave,
  isP15CompleteVictory
} from './p15-build-screen';
import { startEarnedRun, playEarnedWave, type EarnedWave } from './earned-playback';

let nativeWave: EarnedWave;
beforeAll(() => {
  nativeWave = withP15Realm(() => {
    prepareP15Build('fire');
    const handle = startEarnedRun({
      act: 5,
      subAreaId: P15_POLICY.area,
      mode: 'manual',
      runSeed: 1,
      challengeOrdinal: P15_POLICY.challengeOrdinal
    });
    return playEarnedWave(handle, 0);
  });
}, 30_000);

it('does not count a mercenary team win with the original hero dead as a victory or TTK', () => {
  const wave = structuredClone(nativeWave);
  const outcome = wave.played.outcome;
  assert.ok(outcome);
  wave.played.outcome = {
    ...outcome,
    winner: 'player',
    finalPlayerTeam: outcome.finalPlayerTeam.map((unit) =>
      unit.kind === 'hero' ? { ...unit, life: 0 } : unit
    )
  };
  expect(outcome.finalPlayerTeam.some((unit) => unit.kind === 'merc' && unit.life > 0)).toBe(true);
  wave.advanceResult = 'defeat';
  const observed = observeP15Wave(wave);
  expect(observed.outcome.winner).toBe('player');
  expect(observed.metrics.heroDied).toBe(true);
  expect(observed.metrics.outcome).toBe('defeat');
  expect(observed.metrics.victoryOnlyTtkMs).toBeNull();
  expect(isP15CompleteVictory([observed], 1)).toBe(false);
});

it('requires final native victory even when all observed waves have living-hero team wins', () => {
  const wave = structuredClone(nativeWave);
  assert.ok(wave.played.outcome);
  wave.played.outcome = { ...wave.played.outcome, winner: 'player' };
  wave.advanceResult = 'victory';
  const won = observeP15Wave(wave);
  expect(won.metrics.outcome).toBe('victory');
  expect(won.metrics.victoryOnlyTtkMs).toBe(wave.terminalSimClockMs);
  expect(isP15CompleteVictory([won], 1)).toBe(true);
  expect(isP15CompleteVictory([{ ...won, advanceResult: 'defeat' }], 1)).toBe(false);
  expect(isP15CompleteVictory([{ ...won, advanceResult: 'next-wave' }], 1)).toBe(false);
  expect(isP15CompleteVictory([won], 2)).toBe(false);
});

it('retains engine draws separately from native defeat settlement and never awards draw TTK', () => {
  const observed = observeP15Wave(nativeWave);
  expect(observed.outcome.winner).toBeNull();
  expect(observed.advanceResult).toBe('defeat');
  expect(observed.metrics.outcome).toBe('draw');
  expect(observed.metrics.victoryOnlyTtkMs).toBeNull();
});

it.each(['cold', 'fire'] as const)(
  'pays for legal %s ranks without changing unrelated saved domains',
  (build) => {
    const caller = observeEarnedState();
    const method = usePlayerStore.getState().allocateSkillPoint;
    withP15Realm((source) => {
      expect(source.player.level).toBe(35);
      expect(source.player.respecsRemaining.skill).toBe(0);
      const before = observeEarnedState();
      const proof = prepareP15Build(build);
      const after = observeEarnedState();
      expect(proof).toMatchObject({ build, refund: 48, cost: 5, pointsSpent: 48 });
      expect(after.player.player?.skillPoints).toBe(0);
      expect(after.player.player?.skillLevels).toEqual(
        Object.fromEntries(P15_POLICY.builds[build].ranks)
      );
      expect(after.player.player?.comboOrder).toEqual(P15_POLICY.builds[build].priority);
      expect(after.player.player?.coreStats).toEqual(before.player.player?.coreStats);
      expect(after.player.player?.derivedStats.life).toBe(before.player.player?.derivedStats.life);
      expect(after.player.player?.derivedStats.mana).toBe(before.player.player?.derivedStats.mana);
      expect(after.player.player?.respecsRemaining).toEqual(before.player.player?.respecsRemaining);
      expect(after.inventory.currencies).toEqual({
        ...before.inventory.currencies,
        wishstone: 25854
      });
      expect(
        isDeepStrictEqual(
          { ...after.inventory, currencies: before.inventory.currencies },
          before.inventory
        )
      ).toBe(true);
      expect(after.merc).toEqual(before.merc);
      expect(after.formation).toEqual(before.formation);
      expect(after.meta).toEqual(before.meta);
      expect(after.map).toEqual({
        ...before.map,
        currentAct: 5,
        currentSubAreaId: P15_POLICY.location
      });
    });
    expect(isDeepStrictEqual(observeEarnedState(), caller)).toBe(true);
    expect(usePlayerStore.getState().allocateSkillPoint).toBe(method);
    expect(hasActiveSubAreaRun()).toBe(false);
  },
  30_000
);

it('restores methods, all stores, hydration, clock and pity after an action throws', () => {
  const caller = observeEarnedState(),
    combat = observeStore(useCombatStore);
  const hydration = useHydrationStore.getState().status,
    pity = getIdleEliteMisses(),
    now = Date.now;
  const failure = new Error('injected diagnostic failure');
  expect(() =>
    withP15Realm(() => {
      prepareP15Build('cold');
      setIdleEliteMisses(3);
      throw failure;
    })
  ).toThrow(failure);
  expect(isDeepStrictEqual(observeEarnedState(), caller)).toBe(true);
  expect(observeStore(useCombatStore)).toEqual(combat);
  expect(useHydrationStore.getState().status).toBe(hydration);
  expect(getIdleEliteMisses()).toBe(pity);
  expect(Date.now).toBe(now);
}, 30_000);

it('authenticates the immutable source and rejects unknown policies/seeds before mutation', () => {
  const source = loadP15Source();
  expect(source.player.experience).toBe(192311);
  const before = observeEarnedState();
  for (const [build, seed] of [
    ['unknown', 1],
    ['cold', 0],
    ['fire', 9],
    ['cold', NaN]
  ] as const) {
    expect(() => runP15Attempt(build, seed)).toThrow('Invalid P15');
  }
  expect(isDeepStrictEqual(observeEarnedState(), before)).toBe(true);
}, 30_000);

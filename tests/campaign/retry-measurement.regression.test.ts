/** Constructed native transport cases; these are not earned campaign balance samples. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import type { WavePlan } from '@/engine/combat';
import { hasActiveSubAreaRun, abortSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { measureCampaignRetries } from './retry-measurement';
import type { CampaignProfile } from './policy';

const timestamp = 1793304000000;
const profile: CampaignProfile = { classId: 'sorceress',
  targets: [{ id: 'sorceress.fire_bolt', rank: 20, level: 1 }],
  priority: ['sorceress.fire_bolt'],
  statsPerLevel: { strength: 0, dexterity: 0, vitality: 5, energy: 0 } };
let restores: (() => void)[], pity: number;
beforeEach(() => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Retry transport', 'sorceress').ok).toBe(true);
});
afterEach(() => { abortSubAreaRun(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

it('keeps three native losses, spends only the owned point after loss, and advances clock/counters', () => {
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  // Exercise the real period boundary without changing combat difficulty.
  useMapStore.setState({ challengeOrdinals: { ...useMapStore.getState().challengeOrdinals, normal: 360359 } });
  const before = observeEarnedState(), now = Date.now;
  const result = measureCampaignRetries({ act: 1, area: 'areas/act1-catacombs', timestamp,
    maximumAttempts: 3, adaptation: { profile, equipment: 'unchanged' } });
  expect(Date.now).toBe(now);
  expect(result.attempts).toHaveLength(3);
  expect(result.firstAttemptWon).toBe(false); expect(result.withinAttemptsWon).toBe(false);
  expect(result.attempts.map(a => a.ordinal)).toEqual([360359, 0, 1]);
  expect(useMapStore.getState().challengeOrdinals.normal).toBe(2);
  let elapsed = 0;
  for (const attempt of result.attempts) {
    expect(attempt.timestamp).toBe(timestamp + elapsed);
    expect(attempt.waves[0]?.index).toBe(0);
    expect(attempt.waves[0]?.metrics.heroEntryLife).toBe(attempt.entry.player.player?.derivedStats.lifeMax);
    expect(attempt.waves.at(-1)?.advanceResult).toBe('defeat');
    elapsed += attempt.waves.reduce((sum, w) => sum + Math.ceil(w.metrics.logicalMs), 0);
  }
  expect(result.finishedAt).toBe(timestamp + elapsed);
  expect(result.combatMs).toBe(result.attempts.flatMap(a => a.waves).reduce((sum, w) => sum + w.metrics.logicalMs, 0));
  expect(result.adaptations[0]?.before.player.player?.skillPoints).toBe(1);
  expect(result.adaptations[0]?.after.player.player?.skillPoints).toBe(0);
  expect(result.after.inventory.materials).toEqual(before.inventory.materials);
  expect(result.after.inventory.currencies).toEqual(before.inventory.currencies);
  expect(result.after.inventory.equipped).toEqual(before.inventory.equipped);
  expect(hasActiveSubAreaRun()).toBe(false);
  expect(observeEarnedState()).toEqual(result.after);
});

it('stops at a complete victory, retains income, and does not apply retry adaptation', () => {
  // Deliberately constructed power makes this a transport-only success control.
  const player = usePlayerStore.getState().player; assert.ok(player);
  usePlayerStore.setState({ player: { ...player, comboOrder: [],
    coreStats: { strength: 100000, dexterity: 100000, vitality: 100000, energy: 100000 } } });
  const result = measureCampaignRetries({ act: 1, area: 'areas/act1-blood-moor', timestamp,
    maximumAttempts: 3, adaptation: { profile, equipment: 'unchanged' } });
  expect(result.firstAttemptWon).toBe(true); expect(result.withinAttemptsWon).toBe(true);
  expect(result.attempts).toHaveLength(1); expect(result.adaptations).toEqual([]);
  expect(result.attempts[0]?.waves.at(-1)?.advanceResult).toBe('victory');
  expect(result.after.player.player?.experience).toBeGreaterThan(player.experience);
  expect(result.after.map.clearedSubAreas).toContain('areas/act1-blood-moor');
  expect(hasActiveSubAreaRun()).toBe(false);
});

it('rejects invalid requests before native state changes', () => {
  const before = observeEarnedState();
  expect(() => measureCampaignRetries({ act: 1, area: 'areas/act1-catacombs', timestamp,
    maximumAttempts: 0, adaptation: { profile, equipment: 'unchanged' } })).toThrow();
  expect(observeEarnedState()).toEqual(before);
});

it('[policy] preserves the declared build when its caller changes nested policy after a loss', () => {
  const mutable = { ...profile,
    targets: profile.targets.map(target => ({ ...target })),
    priority: [...profile.priority], statsPerLevel: { ...profile.statsPerLevel } };
  const request = { act: 1, area: 'areas/act1-catacombs', timestamp: timestamp + 41000,
    maximumAttempts: 2, adaptation: { profile: mutable, equipment: 'unchanged' as const } };
  const declared = structuredClone(request);
  const result = measureCampaignRetries(request, row => {
    if (row.kind === 'retry-policy') {
      const published = row.policy as { request: typeof request };
      const target = published.request.adaptation.profile.targets[0]; assert.ok(target);
      target.rank = 0;
    }
    if (row.kind === 'allocate-skill') {
      const target = row.target as { id: string; rank: number };
      target.id = 'tampered'; target.rank = 0;
    }
    if (row.kind === 'retry-adaptation') (row.records as unknown[]).length = 0;
    if (row.kind !== 'retry-wave') return;
    // Deliberately adversarial consumer: only the original declaration may
    // authorize adaptation; observed failure cannot rewrite this trial's build.
    const target = mutable.targets[0]; assert.ok(target);
    target.rank = 0;
    mutable.priority.length = 0;
    mutable.statsPerLevel.vitality = 0;
    mutable.statsPerLevel.energy = 5;
  });
  expect(result.attempts).toHaveLength(2);
  expect(result.withinAttemptsWon).toBe(false);
  expect(result.adaptations[0]?.before.player.player?.skillPoints).toBe(1);
  expect(result.adaptations[0]?.after.player.player?.skillPoints).toBe(0);
  expect(result.adaptations[0]?.records.find(row => row.kind === 'allocate-skill')?.target)
    .toEqual({ id: 'sorceress.fire_bolt', rank: 20, level: 1 });
  expect(result.attempts[1]?.entry.player.player?.comboOrder).toEqual(declared.adaptation.profile.priority);
  expect(result.policy).toEqual({ version: 1, request: declared });
  expect(request.adaptation.profile.targets[0]?.rank).toBe(0);
});

it('[policy] isolates recorded outcomes from journal mutation', () => {
  let edited = false;
  const result = measureCampaignRetries({ act: 1, area: 'areas/act1-catacombs',
    timestamp: timestamp + 42000, maximumAttempts: 1,
    adaptation: { profile, equipment: 'unchanged' } }, row => {
    if (row.kind !== 'retry-wave') return;
    const wave = row.wave as { metrics: { outcome: string } };
    expect(wave.metrics.outcome).toBe('defeat');
    wave.metrics.outcome = 'victory';
    edited = true;
  });
  expect(edited).toBe(true);
  expect(result.attempts).toHaveLength(1);
  expect(result.attempts[0]?.waves[0]?.metrics.outcome).toBe('defeat');
  expect(result.firstAttemptWon).toBe(false);
  expect(result.withinAttemptsWon).toBe(false);
  expect(hasActiveSubAreaRun()).toBe(false);
});

it('[policy] journals the complete declaration before admission and restores the clock if the consumer throws', () => {
  const before = observeEarnedState(), now = Date.now;
  const request = { act: 1, area: 'areas/act1-catacombs', timestamp: timestamp + 43000,
    maximumAttempts: 1, adaptation: { profile, equipment: 'unchanged' as const } };
  const failure = new Error('policy journal unavailable');
  const records: Readonly<Record<string, unknown>>[] = [];
  expect(() => measureCampaignRetries(request, row => {
    records.push(row);
    throw failure;
  })).toThrow(failure);
  expect(records).toEqual([{ kind: 'retry-policy', policy: { version: 1, request } }]);
  expect(Date.now).toBe(now);
  expect(observeEarnedState()).toEqual(before);
  expect(hasActiveSubAreaRun()).toBe(false);
});

it('[plan] retains unreached native plans for contiguous losses despite journal edits', () => {
  const native: { seed: number; plan: WavePlan }[] = [];
  const published: (WavePlan | undefined)[] = [];
  const result = measureCampaignRetries({ act: 1, area: 'areas/act1-catacombs',
    timestamp: timestamp + 51000, maximumAttempts: 2,
    adaptation: { profile, equipment: 'unchanged' } }, row => {
    if (row.kind !== 'retry-admission') return;
    const active = combatRunLifecycle.activeRun; assert.ok(active);
    const snapshot = structuredClone(active.plan);
    native.push({ seed: active.seed, plan: snapshot });
    published.push(structuredClone(row.plan as WavePlan | undefined));
    // An adversarial journal may edit its copy, including waves not yet played.
    const plan = row.plan as { subAreaId: string; waves: unknown[] } | undefined;
    if (plan) { plan.subAreaId = 'tampered'; plan.waves.length = 0; }
    expect(active.plan).toEqual(snapshot);
  });
  expect(result.attempts).toHaveLength(2);
  expect(native).toHaveLength(2);
  for (const [index, attempt] of result.attempts.entries()) {
    expect(attempt.won).toBe(false);
    expect(attempt.waves).toHaveLength(1);
    expect(attempt.waves[0]?.advanceResult).toBe('defeat');
    expect(attempt.plan).toEqual(native[index]?.plan);
    expect(published[index]).toEqual(native[index]?.plan);
    expect(attempt.plan.subAreaId).toBe('areas/act1-catacombs');
    expect(attempt.seed).toBe(native[index]?.seed);
    expect(attempt.plan.seed).toBe(attempt.seed);
    expect(attempt.plan.waves).toHaveLength(attempt.totalWaves);
    expect(attempt.plan.waves.length).toBeGreaterThan(attempt.waves.length);
  }
  const first = result.attempts[0]; assert.ok(first);
  expect(result.attempts[1]?.ordinal).toBe((first.ordinal + 1) % 360360);
  expect(result.withinAttemptsWon).toBe(false);
  expect(hasActiveSubAreaRun()).toBe(false);
});

it('[plan] preserves a winning plan after native disposal and stops before another admission', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  // Constructed transport power, never an earned progression/balance sample.
  usePlayerStore.setState({ player: { ...player, comboOrder: [],
    coreStats: { strength: 100000, dexterity: 100000, vitality: 100000, energy: 100000 } } });
  const native: WavePlan[] = [], published: (WavePlan | undefined)[] = [];
  const result = measureCampaignRetries({ act: 1, area: 'areas/act1-blood-moor',
    timestamp: timestamp + 52000, maximumAttempts: 3,
    adaptation: { profile, equipment: 'unchanged' } }, row => {
    if (row.kind !== 'retry-admission') return;
    const active = combatRunLifecycle.activeRun; assert.ok(active);
    native.push(structuredClone(active.plan));
    published.push(structuredClone(row.plan as WavePlan | undefined));
    const plan = row.plan as { waves: unknown[] } | undefined;
    if (plan) plan.waves.length = 0;
  });
  expect(result.attempts).toHaveLength(1);
  expect(native).toHaveLength(1);
  expect(result.firstAttemptWon).toBe(true);
  expect(result.adaptations).toEqual([]);
  expect(result.attempts[0]?.plan).toEqual(native[0]);
  expect(published[0]).toEqual(native[0]);
  const plan = native[0]; assert.ok(plan);
  expect(result.attempts[0]?.waves).toHaveLength(plan.waves.length);
  expect(result.after.map.challengeOrdinals.normal).toBe(result.before.map.challengeOrdinals.normal + 1);
  expect(combatRunLifecycle.activeRun).toBeNull();
});

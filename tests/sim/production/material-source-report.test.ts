import { afterEach, describe, expect, it, vi } from 'vitest';
import * as award from '@/engine/loot/award';
import * as drops from '@/engine/loot/drop-roller';
import * as currency from '@/engine/loot/orbs-and-currency';
import { createRng } from '@/engine/rng';
import { loadAwardPools } from '@/data/loaders/loot';
import { mergeMaterials, type MaterialLedger } from '@/engine/loot/materials';
import { createMaterialSourceJournal, observeMaterialSources, ordinaryMaterialContext,
  type MaterialControlContext } from './material-source-report';

afterEach(() => { vi.restoreAllMocks(); });

const input: award.KillRewardInput = { tier: 'boss', monsterLevel: 14,
  treasureClassId: 'loot/source-control', magicFind: 0, goldFind: 0, act: 1, difficulty: 'normal' };
function pools(gear = false): award.AwardDataPools {
  const native = loadAwardPools();
  return { ...native, treasureClasses: new Map([[input.treasureClassId, {
    id: input.treasureClassId, noDropChance: 0, numPicks: 1,
    picks: [gear ? { type: 'item', baseId: 'items/base/helm-cap', rarity: 'normal',
      weight: 1, qlvlMin: 1, qlvlMax: 99 } : { type: 'rune', itemId: 'runes/el',
      quantityMin: 2, quantityMax: 2, weight: 1, qlvlMin: 1, qlvlMax: 99 }]
  }]]) };
}
function fixture() {
  const capture = observeMaterialSources(() => award.rollKillRewards(input, pools(), createRng(42)));
  if (capture.execution.status !== 'returned') throw capture.execution.error;
  const context: MaterialControlContext = { receipt: {}, runId: 'constructed-source-control',
    areaId: 'constructed-area', waveIndex: 0, winner: 'player', unsupportedSources: [], expectedKills: [input] };
  const before: MaterialLedger = { 'runes/zod': 7 }; // Opening stock has unknown provenance, even if it is rare.
  return { context, capture, before, raw: capture.execution.value.materials,
    after: mergeMaterials(before, capture.execution.value.materials) };
}

describe('ordinary material source reconciliation', () => {
  it('separates actual TC and independent income, excluding opening stock and duplicate settlement', () => {
    const observed = fixture();
    const journal = createMaterialSourceJournal(observed.before);
    expect(journal.observe(observed)).toBe('accepted');
    const first = journal.snapshot();
    expect(first.accepted).toHaveLength(1);
    expect(first.accepted[0]?.treasureClass).toEqual({ 'runes/el': 2 });
    expect(first.accepted[0]?.independent).toEqual(observed.capture.kills[0]?.currency?.materials);
    expect(Object.values(first.accepted[0]!.independent).reduce((sum, n) => sum + n, 0)).toBe(2);
    expect(first.total).toEqual(observed.raw);
    expect(first.opening).toEqual({ materials: { 'runes/zod': 7 }, provenance: 'unknown' });
    expect(first.highRuneEarned).toBe(false);
    expect(first.activeHourAcceptance).toBe(false);
    expect(journal.observe({ ...observed, capture: observeMaterialSources(() => undefined),
      before: observed.after, after: observed.after, raw: {} })).toBe('duplicate');
    expect(journal.snapshot().total).toEqual(first.total);
    expect(journal.snapshot().duplicates).toBe(1);
  });

  it('accepts a measured zero payout without reclassifying the opening balance', () => {
    const context: MaterialControlContext = { receipt: {}, runId: 'zero', areaId: 'zero', waveIndex: 0,
      winner: 'player', unsupportedSources: [], expectedKills: [] };
    const journal = createMaterialSourceJournal({ 'runes/el': 3 });
    expect(journal.observe({ context, capture: observeMaterialSources(() => undefined), raw: {},
      before: { 'runes/el': 3 }, after: { 'runes/el': 3 } })).toBe('accepted');
    expect(journal.snapshot().total).toEqual({});
  });

  it.each(['raw-mismatch', 'inventory-mismatch', 'opening-drift', 'nonwin', 'find-item',
    'missing-call', 'duplicate-source', 'duplicate-payout', 'fusion', 'unsafe'] as const)
  ('stops at %s, preserves the accepted prefix and never resumes credit', fault => {
    const first = fixture(), journal = createMaterialSourceJournal(first.before);
    expect(journal.observe(first)).toBe('accepted');
    const next = fixture();
    next.before = first.after;
    next.after = mergeMaterials(next.before, next.raw);
    if (fault === 'raw-mismatch') next.raw = {};
    if (fault === 'inventory-mismatch') next.after = next.before;
    if (fault === 'opening-drift') next.before = {};
    if (fault === 'nonwin') next.context = { ...next.context, winner: 'enemy' };
    if (fault === 'find-item') next.context = { ...next.context, unsupportedSources: ['find-item'] };
    if (fault === 'missing-call') next.context = { ...next.context, expectedKills: [] };
    if (fault === 'duplicate-source') next.capture = first.capture;
    if (fault === 'duplicate-payout') next.context = first.context;
    if (fault === 'fusion') { next.raw = {}; next.after = { 'runes/zod': 6, 'runes/eld': 1 }; }
    if (fault === 'unsafe') next.raw = { 'runes/el': Number.MAX_SAFE_INTEGER + 1 };
    expect(journal.observe(next)).toBe('stopped');
    const stopped = journal.snapshot();
    expect(stopped.accepted).toHaveLength(1);
    expect(stopped.total).toEqual(first.raw);
    expect(stopped.failure?.reason).toBeTruthy();
    expect(stopped.failure?.observation).toBeDefined();
    expect(journal.observe(fixture())).toBe('stopped');
    expect(journal.snapshot()).toEqual(stopped);
  });

  it('retains the signed exact 3:1 fusion delta as a refusal, never as random income', () => {
    const observed = fixture(), journal = createMaterialSourceJournal({ 'runes/el': 3 });
    expect(journal.observe({ ...observed, before: { 'runes/el': 3 }, after: { 'runes/eld': 1 } })).toBe('stopped');
    expect(journal.snapshot().failure?.actualDelta).toEqual({ 'runes/el': -3, 'runes/eld': 1 });
    expect(journal.snapshot().total).toEqual({});
  });

  it.each(['per-kill', 'metadata', 'missing-source', 'overflow'] as const)
  ('refuses corrupted %s observations atomically', fault => {
    const observed = fixture(), journal = createMaterialSourceJournal(observed.before);
    const kill = observed.capture.kills[0]!;
    if (fault === 'per-kill') observed.capture = { ...observed.capture, kills: [{ ...kill,
      snapshot: { ...kill.snapshot, materials: {} } }] };
    if (fault === 'metadata') observed.context = { ...observed.context,
      expectedKills: [{ ...input, monsterLevel: input.monsterLevel + 1 }] };
    if (fault === 'missing-source') observed.capture = { ...observed.capture, kills: [{ ...kill, currency: null }] };
    if (fault === 'overflow') {
      observed.before = {}; observed.after = { 'runes/el': Number.MAX_SAFE_INTEGER }; observed.raw = observed.after;
      observed.capture = { ...observed.capture, kills: [{ ...kill,
        drops: { ...kill.drops!, snapshot: [{ kind: 'direct', currency: 'runes', itemId: 'runes/el',
          quantity: Number.MAX_SAFE_INTEGER, ilvl: 14 }] },
        currency: { ...kill.currency!, materials: { 'runes/el': 1 } },
        snapshot: { ...kill.snapshot, materials: observed.raw } }] };
      // Start from the matching zero inventory so this exercises source overflow, not opening drift.
      const emptyJournal = createMaterialSourceJournal({});
      expect(emptyJournal.observe(observed)).toBe('stopped');
      expect(emptyJournal.snapshot().failure?.reason).toMatch(/overflow/i);
      expect(emptyJournal.snapshot().total).toEqual({});
      return;
    }
    expect(journal.observe(observed)).toBe('stopped');
    expect(journal.snapshot().accepted).toEqual([]);
    expect(journal.snapshot().total).toEqual({});
    expect(journal.snapshot().failure?.reason).toMatch(/kill|source/i);
  });

  it('owns accepted snapshots even after callers mutate their observations and report copies', () => {
    const observed = fixture(), journal = createMaterialSourceJournal(observed.before);
    expect(journal.observe(observed)).toBe('accepted');
    const retained = journal.snapshot();
    observed.context = { ...observed.context, expectedKills: [] };
    Object.defineProperty(observed.capture.kills[0]!.input, 'monsterLevel', { value: 999 });
    Object.defineProperty(observed.capture.kills[0]!.snapshot.materials, 'runes/el', { value: 999 });
    const copy = journal.snapshot(); copy.accepted.length = 0;
    expect(journal.snapshot()).toEqual(retained);
  });

  it.each([{ 'runes/unknown': 1 }, { 'runes/el': -1 }, { 'runes/el': 0 }])
  ('refuses malformed opening stock %j', opening => {
    expect(() => createMaterialSourceJournal(opening)).toThrow(/material/i);
  });
});

describe('passthrough source observation', () => {
  it('preserves original arguments, return identities, RNG calls and item allocation without reset', () => {
    const data = pools(true), left = createRng(42), right = createRng(42);
    const traces = [left, right].map(rng => ({
      next: vi.spyOn(rng, 'next'), nextInt: vi.spyOn(rng, 'nextInt'), chance: vi.spyOn(rng, 'chance'),
      pick: vi.spyOn(rng, 'pick'), fork: vi.spyOn(rng, 'fork')
    }));
    const baseline = award.rollKillRewards(input, data, left);
    let returned: award.KillRewards | undefined;
    const capture = observeMaterialSources(() => { returned = award.rollKillRewards(input, data, right); return returned; });
    expect(capture.execution).toEqual({ status: 'returned', value: returned });
    const kill = capture.kills[0];
    expect(kill?.args[0]).toBe(input); expect(kill?.args[1]).toBe(data); expect(kill?.args[2]).toBe(right);
    expect(kill?.result).toBe(returned);
    expect(kill?.drops?.args[1]).toBe(right); expect(kill?.currency?.args[5]).toBe(right);
    expect(capture.issues).toEqual([]);
    expect(baseline.items).toHaveLength(1); expect(returned?.items).toHaveLength(1);
    // A semantic comparison omits only top-level Item.id; raw IDs stay available and distinct.
    const semantic = (bag: award.KillRewards) => ({ ...bag, items: bag.items.map(({ id: _id, ...item }) => item) });
    expect(semantic(returned!)).toEqual(semantic(baseline));
    const oldId = baseline.items[0]!.id, newId = returned!.items[0]!.id;
    expect(newId).not.toBe(oldId);
    expect(parseInt(newId.split('-').at(-1)!, 36)).toBe(parseInt(oldId.split('-').at(-1)!, 36) + 1);
    for (const method of ['next', 'nextInt', 'chance', 'pick', 'fork'] as const) {
      expect(traces[1]![method].mock.calls).toEqual(traces[0]![method].mock.calls);
      expect(traces[1]![method].mock.results).toEqual(traces[0]![method].mock.results);
    }
    const following = [left.next(), right.next()];
    expect(following[1]).toBe(following[0]);
    console.info(JSON.stringify({ observerNoninterference: { baselineItemIds: baseline.items.map(item => item.id),
      observedItemIds: returned!.items.map(item => item.id), comparison: 'semantic payload omits only Item.id', following,
      rng: traces.map(trace => Object.fromEntries(Object.entries(trace)
        .map(([method, spy]) => [method, { calls: spy.mock.calls, results: spy.mock.results }]))) } }));
  });

  it('handles a missing TC without inventing TC material calls', () => {
    const data = { ...pools(), treasureClasses: new Map() };
    const capture = observeMaterialSources(() => award.rollKillRewards(input, data, createRng(42)));
    expect(capture.kills[0]?.drops).toBeNull();
    expect(capture.kills[0]?.currency?.materials).toBeDefined();
    expect(capture.issues).toEqual([]);
    if (capture.execution.status !== 'returned') throw capture.execution.error;
    const journal = createMaterialSourceJournal({}), context = fixture().context;
    const raw = capture.execution.value.materials;
    expect(journal.observe({ context, capture, before: {}, after: raw, raw })).toBe('accepted');
    expect(journal.snapshot().accepted[0]?.treasureClass).toEqual({});
    expect(journal.snapshot().accepted[0]?.independent).toEqual(raw);
    expect(Object.values(raw).reduce((sum, n) => sum + n, 0)).toBe(2);
  });

  it('detects lexical batch calls instead of crediting orphan source results', () => {
    const capture = observeMaterialSources(() => award.rollBatchRewards([input], pools(), createRng(42)));
    expect(capture.kills).toEqual([]);
    expect(capture.issues).toContain('unscoped treasure-class call');
    expect(capture.issues).toContain('unscoped independent call');
    const observed = fixture(), journal = createMaterialSourceJournal(observed.before);
    expect(journal.observe({ ...observed, capture })).toBe('stopped');
    expect(journal.snapshot().total).toEqual({});
  });

  it('retains original exceptions and restores only owned observers in finally', () => {
    const originals = [award.rollKillRewards, drops.rollDrops, currency.rollCurrencyDrops];
    const failure = new Error('constructed action refusal', { cause: new TypeError('constructed underlying cause') });
    const capture = observeMaterialSources(() => { award.rollKillRewards(input, pools(), createRng(42)); throw failure; });
    expect(capture.execution).toEqual({ status: 'threw', error: failure });
    expect(capture.kills).toHaveLength(1);
    expect([award.rollKillRewards, drops.rollDrops, currency.rollCurrencyDrops]).toEqual(originals);
    const observed = fixture(), journal = createMaterialSourceJournal(observed.before);
    expect(journal.observe({ ...observed, capture })).toBe('stopped');
    expect(journal.snapshot().failure?.observation.executionError).toEqual({ name: 'Error',
      message: 'constructed action refusal', cause: { name: 'TypeError', message: 'constructed underlying cause', cause: null } });
  });

  it('refuses overlap and existing mocks without changing their ownership', () => {
    const original = award.rollKillRewards;
    const capture = observeMaterialSources(() => {
      expect(() => observeMaterialSources(() => undefined)).toThrow(/exclusive/);
      return award.rollKillRewards(input, pools(), createRng(42));
    });
    expect(capture.execution.status).toBe('returned');
    expect(award.rollKillRewards).toBe(original);
    const owned = vi.spyOn(drops, 'rollDrops');
    expect(() => observeMaterialSources(() => undefined)).toThrow(/exclusive/);
    expect(drops.rollDrops).toBe(owned);
    owned.mockRestore();
  });
});

it('reconciles a native zero-material wave, duplicate early advance and positive constructed direct grant', async () => {
  const { captureEarnedRestorers, resetEarnedStores } = await import('./earned-state');
  const { usePlayerStore } = await import('@/stores/playerStore');
  const { useInventoryStore } = await import('@/stores/inventoryStore');
  const { useCombatStore } = await import('@/stores/combatStore');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { startSubAreaRun, abortSubAreaRun, advanceWaveOrFinish, awardLootForVictory } = await import('@/stores/combatHelpers');
  const { inspectRecordedWaves } = await import('@/stores/recordedWaveReceipt');
  const { createMockPlayer } = await import('@/features/character/createMockPlayer');
  const { loadDefaultSkills, registerSkill } = await import('@/engine/skills/registry');
  const { materialRewardDelta } = await import('./material-delta');
  const restorers = captureEarnedRestorers();
  try {
    resetEarnedStores(); useHydrationStore.getState().setStatus('ready'); loadDefaultSkills();
    registerSkill({ id: 'fixture.source-control', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      cooldown: 1, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [1000000, 1000000] }] });
    const hero = createMockPlayer('Constructed source control', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.source-control'] });
    useInventoryStore.setState({ materials: { 'runes/zod': 7 } });
    const handle = startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 42 });
    expect(handle).toBeTruthy();
    const view = inspectRecordedWaves().currentPublished;
    if (!view) throw new Error('Missing native wave view');
    const context = ordinaryMaterialContext(view);
    expect(context.winner).toBe('player'); expect(context.unsupportedSources).toEqual([]);
    expect(context.receipt).toBe(view.installation?.settlement.identity);
    expect(ordinaryMaterialContext({ ...view, binding: { ...view.binding, findItemFinds: [{
      sourceHeroId: view.binding.heroId, corpseId: 'constructed-refusal-only', rank: 1 }] } }).unsupportedSources)
      .toContain('find-item');
    expect(ordinaryMaterialContext({ ...view, binding: { ...view.binding, candidateRun: {
      ...view.binding.candidateRun, plan: { ...view.binding.candidateRun.plan, questSourceProjection: 'act5-throne' }
    } } }).unsupportedSources).toContain('quest-projection');
    const recording = useCombatStore.getState().recordedEvents;
    for (let i = 0; i < recording.length; i++) useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().recordedEvents).toBe(recording);
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    const before = useInventoryStore.getState().materials, rawBefore = useCombatStore.getState().runRewards.materials;
    const journal = createMaterialSourceJournal(before);
    const capture = observeMaterialSources(advanceWaveOrFinish);
    expect(capture.execution).toMatchObject({ status: 'returned', value: 'next-wave' });
    const after = useInventoryStore.getState().materials, rawAfter = useCombatStore.getState().runRewards.materials;
    expect(journal.observe({ context, capture, before, after, raw: materialRewardDelta(rawBefore, rawAfter) })).toBe('accepted');
    expect(capture.kills).toHaveLength(context.expectedKills.length);
    expect(journal.snapshot().accepted[0]?.kills).toHaveLength(context.expectedKills.length);
    const duplicate = observeMaterialSources(advanceWaveOrFinish);
    expect(duplicate.execution).toEqual({ status: 'returned', value: 'idle' });
    expect(journal.observe({ context, capture: duplicate, before: after,
      after: useInventoryStore.getState().materials,
      raw: materialRewardDelta(rawAfter, useCombatStore.getState().runRewards.materials) })).toBe('duplicate');
    expect(journal.snapshot()).toMatchObject({ highRuneEarned: false, activeHourAcceptance: false, duplicates: 1, failure: null });
    console.info(JSON.stringify({ nativeOrdinaryMaterialControl: journal.snapshot() }));

    // Separate constructed direct native grant: positive inventory coverage, no recording/earned claim.
    abortSubAreaRun();
    const enemy = { ...view.binding.recording.outcome.finalEnemyTeam[0]!, tier: 'boss' as const };
    const directBefore = useInventoryStore.getState().materials, tc = context.expectedKills[0]!.treasureClassId;
    const directJournal = createMaterialSourceJournal(directBefore);
    const direct = observeMaterialSources(() => awardLootForVictory({ slainEnemies: [enemy], act: 1,
      treasureClassId: tc, replayProfileId: 'normal', seed: 42 }));
    if (direct.execution.status !== 'returned') throw direct.execution.error;
    const raw = direct.execution.value.materials;
    expect(Object.values(raw).reduce((sum, n) => sum + n, 0)).toBeGreaterThanOrEqual(2);
    const directContext: MaterialControlContext = { receipt: {}, runId: 'constructed-direct-grant',
      areaId: 'constructed-direct-grant', waveIndex: 0, winner: 'player', unsupportedSources: [],
      expectedKills: [{ tier: 'boss', monsterLevel: enemy.level, treasureClassId: tc, act: 1, difficulty: 'normal' }] };
    expect(directJournal.observe({ context: directContext, capture: direct, before: directBefore,
      after: useInventoryStore.getState().materials, raw })).toBe('accepted');
    expect(directJournal.snapshot().accepted[0]?.independent).toEqual(direct.kills[0]?.currency?.materials);
    console.info(JSON.stringify({ constructedDirectNativeGrant: directJournal.snapshot() }));
  } finally {
    abortSubAreaRun(); loadDefaultSkills();
    for (const restore of restorers.reverse()) restore();
  }
});

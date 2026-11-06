import { afterEach, expect, it, vi } from 'vitest';
import { rollKillRewards, type KillRewardInput } from '@/engine/loot/award';
import { createRng } from '@/engine/rng';
import { loadAwardPools } from '@/data/loaders/loot';
import { mergeMaterials } from '@/engine/loot/materials';
import { createMaterialSourceJournal, observeMaterialSources } from './material-source-report';
import { findItemMaterialContext, ordinaryMaterialContext } from './material-source-report';
import { fileURLToPath } from 'node:url';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

// Only durable I/O is replaced; native combat, search and settlement stay real.
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));

afterEach(() => { vi.restoreAllMocks(); });

const input: KillRewardInput = { tier: 'boss', monsterLevel: 14, act: 1,
  difficulty: 'normal', treasureClassId: 'constructed/search-materials', magicFind: 0, goldFind: 0 };

function searchFixture() {
  const native = loadAwardPools();
  const pools = { ...native, treasureClasses: new Map([[input.treasureClassId, {
    id: input.treasureClassId, noDropChance: 0, numPicks: 1, picks: [{ type: 'rune' as const,
      itemId: 'runes/el', quantityMin: 2, quantityMax: 2, weight: 1, qlvlMin: 1, qlvlMax: 99 }]
  }]]) };
  const capture = observeMaterialSources(() => [
    rollKillRewards(input, pools, createRng(42)),
    rollKillRewards(input, pools, createRng(43))
  ]);
  if (capture.execution.status !== 'returned') throw capture.execution.error;
  const [ordinary, search] = capture.execution.value;
  if (!ordinary || !search) throw new Error('Missing constructed reward bags');
  const raw = mergeMaterials(ordinary.materials, search.materials), before = { 'runes/zod': 7 };
  return { context: { receipt: {}, runId: 'constructed-search-materials', areaId: 'constructed',
    waveIndex: 0, winner: 'player', unsupportedSources: [], expectedKills: [input],
    expectedFindItemKills: [{ find: { sourceHeroId: 'hero', corpseId: 'original-monster', rank: 20 }, input }] },
  capture, raw, before, after: mergeMaterials(before, raw) };
}

it('accounts one successful search separately, without duplicating ordinary income or opening stock', () => {
  const observed = searchFixture(), journal = createMaterialSourceJournal(observed.before);
  expect(journal.observe(observed)).toBe('accepted');
  const report = journal.snapshot(), accepted = report.accepted[0];
  expect(accepted?.treasureClass).toEqual({ 'runes/el': 2 });
  expect(accepted?.independent).toEqual(observed.capture.kills[0]?.currency?.materials);
  expect(accepted?.findItem.treasureClass).toEqual({ 'runes/el': 2 });
  expect(accepted?.findItem.independent).toEqual(observed.capture.kills[1]?.currency?.materials);
  expect(accepted?.findItem.total).toEqual(observed.capture.kills[1]?.snapshot.materials);
  expect(report.total).toEqual(observed.raw);
  expect(report.total['runes/zod']).toBeUndefined();
  expect(report).toMatchObject({ highRuneEarned: false, activeHourAcceptance: false, failure: null });
  expect(journal.observe({ ...observed, capture: observeMaterialSources(() => undefined), raw: {},
    before: observed.after, after: observed.after })).toBe('duplicate');
  expect(journal.snapshot().total).toEqual(report.total);
});

it.each(['missing-search', 'extra-search', 'search-first-kill-bonus', 'search-metadata', 'nonwin'] as const)('refuses %s atomically without crediting its ordinary prefix', fault => {
  const observed = searchFixture(), journal = createMaterialSourceJournal(observed.before);
  if (fault === 'missing-search') observed.capture = { ...observed.capture, kills: observed.capture.kills.slice(0, 1) };
  if (fault === 'extra-search') observed.capture = { ...observed.capture, kills: [...observed.capture.kills, ...observed.capture.kills.slice(1)] };
  if (fault === 'search-first-kill-bonus' || fault === 'search-metadata') {
    observed.capture = { ...observed.capture, kills: observed.capture.kills.map((kill, index) => index === 0 ? kill : {
      ...kill, input: { ...kill.input, ...(fault === 'search-first-kill-bonus' ? { firstKillBonus: true } : { monsterLevel: 99 }) }
    }) };
  }
  if (fault === 'nonwin') observed.context.winner = 'enemy';
  expect(journal.observe(observed)).toBe('stopped');
  expect(journal.snapshot().accepted).toEqual([]);
  expect(journal.snapshot().total).toEqual({});
  expect(journal.snapshot().failure?.reason).toMatch(/kill|nonwin/i);
});

it('reconciles one native paid-search wave and validates original corpses before opting in', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.FIND_ITEM_MATERIAL_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const sourceState = collectSourceState(root);
  const { captureEarnedRestorers, resetEarnedStores } = await import('./earned-state');
  const { usePlayerStore } = await import('@/stores/playerStore');
  const { useInventoryStore } = await import('@/stores/inventoryStore');
  const { useCombatStore } = await import('@/stores/combatStore');
  const { useMapStore } = await import('@/stores/mapStore');
  const { useHydrationStore } = await import('@/stores/hydrationStore');
  const { startSubAreaRun, abortSubAreaRun, advanceWaveOrFinish } = await import('@/stores/combatHelpers');
  const { inspectRecordedWaves } = await import('@/stores/recordedWaveReceipt');
  const { createMockPlayer } = await import('@/features/character/createMockPlayer');
  const { loadDefaultSkills } = await import('@/engine/skills/registry');
  const { materialRewardDelta } = await import('./material-delta');
  const { toJsonSafe } = await import('@/engine/save');
  const restorers = captureEarnedRestorers();
  try {
    vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
    resetEarnedStores(); useHydrationStore.getState().setStatus('ready'); loadDefaultSkills();
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Constructed search accounting', 'barbarian'), level: 30,
      comboOrder: ['skills-barbarian-find-item'],
      skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 20 } });
    const cap = { id: 'constructed-search-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
      affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
        ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })).toBeTruthy();
    const view = inspectRecordedWaves().currentPublished;
    if (!view) throw new Error('Missing native paid-search view');
    const finds = view.binding.findItemFinds ?? [];
    expect(finds.length).toBeGreaterThan(0);
    expect(ordinaryMaterialContext(view).unsupportedSources).toContain('find-item');
    const context = findItemMaterialContext(view);
    expect(context.unsupportedSources).toEqual([]);
    expect(context.expectedFindItemKills?.map(row => row.find)).toEqual(finds);
    const first = finds[0];
    if (!first) throw new Error('Missing native successful find');
    for (const patch of [{ corpseId: 'forged' }, { sourceHeroId: 'other' }, { rank: 1 }]) {
      expect(() => findItemMaterialContext({ ...view, binding: { ...view.binding,
        findItemFinds: [{ ...first, ...patch }] } })).toThrow(/Find Item/);
    }
    expect(() => findItemMaterialContext({ ...view, binding: { ...view.binding,
      findItemFinds: [first, first] } })).toThrow(/Find Item/);
    expect(() => findItemMaterialContext({ ...view, binding: { ...view.binding, recording: {
      ...view.binding.recording, outcome: { ...view.binding.recording.outcome,
        finalEnemyTeam: view.binding.engineInput.enemyTeam }
    } } })).toThrow(/Find Item corpse/);
    expect(findItemMaterialContext({ ...view, binding: { ...view.binding, candidateRun: {
      ...view.binding.candidateRun, plan: { ...view.binding.candidateRun.plan, questSourceProjection: 'act5-throne' }
    } } }).unsupportedSources).toContain('quest-projection');
    const count = useCombatStore.getState().recordedEvents.length;
    for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    const before = useInventoryStore.getState().materials, rawBefore = useCombatStore.getState().runRewards.materials;
    const journal = createMaterialSourceJournal(before), capture = observeMaterialSources(advanceWaveOrFinish);
    expect(capture.execution).toEqual({ status: 'returned', value: 'next-wave' });
    const after = useInventoryStore.getState().materials;
    const raw = materialRewardDelta(rawBefore, useCombatStore.getState().runRewards.materials);
    expect(journal.observe({ context, capture, before, after, raw })).toBe('accepted');
    const split = context.expectedKills.length, ordinary = capture.kills.slice(0, split), searches = capture.kills.slice(split);
    expect(searches).toHaveLength(finds.length);
    expect(new Set(ordinary.map(kill => kill.args[2])).size).toBe(1);
    expect(new Set(searches.map(kill => kill.args[2])).size).toBe(1);
    expect(searches[0]?.args[2]).not.toBe(ordinary[0]?.args[2]);
    const accepted = journal.snapshot().accepted[0];
    expect(accepted?.findItem.total).toEqual(mergeMaterials(...searches.map(kill => kill.snapshot.materials)));
    expect(mergeMaterials(accepted?.treasureClass ?? {}, accepted?.independent ?? {}))
      .toEqual(mergeMaterials(...ordinary.map(kill => kill.snapshot.materials)));
    const duplicate = observeMaterialSources(advanceWaveOrFinish);
    expect(duplicate.execution).toEqual({ status: 'returned', value: 'idle' });
    expect(journal.observe({ context, capture: duplicate, before: after,
      after: useInventoryStore.getState().materials, raw: {} })).toBe('duplicate');
    assertSourceStable(sourceState, collectSourceState(root));
    if (output !== undefined) writeNewReport(root, output, toJsonSafe({ version: 1,
      scope: 'constructed-native-search-material-accounting', sourceState,
      input: view.binding.engineInput, outcome: view.binding.recording.outcome,
      events: view.binding.recording.events, finds, report: journal.snapshot(),
      costs: { constructedAdmissions: 1, settledWaves: 1, nextWaveStagedThenAborted: true },
      limitations: ['Constructed hero, gear and skill allocation; no earned or campaign credit.',
        'Materials only; no acquisition probability, encounter rate, affordability or pacing acceptance.'] }));
  } finally {
    abortSubAreaRun(); loadDefaultSkills();
    for (const restore of restorers.reverse()) restore();
  }
}, 30_000);

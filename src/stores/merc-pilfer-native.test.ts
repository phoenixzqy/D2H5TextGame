import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only durable I/O is replaced; native factories, simulation, receipts and loot remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as engine from '@/engine/combat/combat';
import * as loot from '@/engine/loot/award';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { MERC_PILFER_SKILL } from '@/engine/skills/merc-pilfer';
import * as staging from './recordedWaveStaging';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const PILFER = 'mskill-pilfer';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function owned() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/tavern-thief-pickpocket');
  if (!def) throw new Error('Missing native Pickpocket');
  return createMercFromDef(def, 'native');
}
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function published() {
  const issued = inspectRecordedWaves().currentPublished;
  if (!issued) throw new Error('Missing real published wave');
  return issued;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange(options: { fielded?: boolean; search?: boolean; lockedBoundary?: boolean;
  names?: (out: engine.RecordedBattleResult) => void;
  transform?: (out: engine.RecordedBattleResult) => void } = {}) {
  registerSkill({ id: 'fixture.pilfer-native-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100000, 100000], alwaysHits: true }
    ] });
  const hero = createMockPlayer('Synthetic Pilfer lifecycle', options.search ? 'barbarian' : 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, ...(options.search ? { level: 30,
    comboOrder: ['skills-barbarian-find-item'],
    skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 20 } }
    : { comboOrder: ['fixture.pilfer-native-finisher'] }) });
  // Imported survivors isolate native reward/lifecycle behavior, not earned campaign progression.
  const native = owned(), merc = { ...native, level: 30, derivedStats: { ...native.derivedStats,
    life: 10000, lifeMax: 10000, attackSpeed: 263, critChance: 0, goldFind: 500 } };
  useMercStore.getState().addMerc(merc);
  if (options.fielded !== false) useMercStore.getState().setFieldedMerc(merc.id);
  if (options.search) {
    const cap = { id: 'pilfer-search-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
      affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
        ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  }
  const simulate = engine.runBattleRecorded;
  let latest: engine.RecordedBattleResult | undefined;
  const simulation = vi.spyOn(engine, 'runBattleRecorded').mockImplementation((...args) => {
    latest = simulate(...args); options.transform?.(latest); return latest;
  });
  const stage = staging.stageRecordedWave;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementation(input => stage({ ...input,
    ...(options.lockedBoundary ? { ironGolemReplayLocked: true } : {}),
    resolveDisplayName: unit => {
      if (!latest) throw new Error('Missing native simulation before naming');
      options.names?.(latest);
      return input.resolveDisplayName(unit);
    } }));
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1,
    runSeed: options.search ? 19 : 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  const first = useCombatStore.getState(), issued = published();
  if (!latest) throw new Error('Missing actual engine result');
  return { merc, first, issued, out: latest, simulation };
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it.each([false, true])('captures primitive paid find before naming and ignores public edits (fielded%s)', fielded => {
  const { issued, first } = arrange({ fielded, names: out => {
    Object.assign(out.result, { mercPilferGoldFind: 999 });
  } });
  expect(issued.binding.mercPilferGoldFind).toBe(fielded ? 30 : undefined);
  expect(Object.isFrozen(issued.binding)).toBe(true);
  expect(() => Object.assign(issued.binding, { mercPilferGoldFind: 999 })).toThrow(TypeError);
  Object.assign(first.outcome ?? {}, { mercPilferGoldFind: 999 });
  for (const unit of first.playerTeam) Object.assign(unit, { mercPilferGoldFind: 999 });
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(generation.mock.calls.length).toBeGreaterThan(0);
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(fielded ? 30 : 0);
});

it.each([NaN, Infinity, -1, null, '30'])('rejects malformed engine find %s before naming or installation', value => {
  const names = vi.fn();
  expect(() => arrange({ transform: out => Object.assign(out.result, { mercPilferGoldFind: value }), names })).toThrow('Invalid native Pilfer find');
  expect(names).not.toHaveBeenCalled();
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
});

it.each(['loadout', 'level'] as const)('pays the issued wave but requires a fresh cast after losing/restoring %s', loss => {
  const { merc, issued } = arrange(), firstBefore = structuredClone(issued.binding.recording);
  useMercStore.setState({ ownedMercs: [{ ...merc, ...(loss === 'level' ? { level: 0 }
    : { signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }) }] });
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(30);
  const second = published();
  expect(second.binding).not.toHaveProperty('mercPilferGoldFind');
  expect(second.binding.engineInput.playerTeam.find(unit => unit.kind === 'merc')).not.toHaveProperty('mercPilferSource');
  expect(issued.binding.recording).toEqual(firstBefore);
  useMercStore.setState({ ownedMercs: [merc] }); generation.mockClear();
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(0);
  expect(published().binding.mercPilferGoldFind).toBe(30);
  expect(useCombatStore.getState().recordedEvents).toContainEqual(expect.objectContaining({
    kind: 'action', actor: `merc-${merc.id}`, skillId: PILFER }));
});

it('recompiles ordinary replay without old paid find and retains one payout identity', () => {
  const { merc, issued } = arrange(), identity = issued.installation?.settlement.identity;
  useMercStore.setState({ ownedMercs: [{ ...merc, signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }] });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(published().installation?.settlement.identity).toBe(identity);
  expect(published().binding).not.toHaveProperty('mercPilferGoldFind');
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(generation.mock.calls.length).toBeGreaterThan(0);
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(0);
  const inventory = useInventoryStore.getState(), count = generation.mock.calls.length;
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(generation).toHaveBeenCalledTimes(count);
});

it('keeps the exact paid modifier with a locked recording at the constructed replay-policy boundary', () => {
  // Force only lock metadata to exercise this branch; no native Iron Golem payment is claimed.
  const { merc, issued, simulation } = arrange({ lockedBoundary: true });
  useMercStore.setState({ ownedMercs: [{ ...merc, signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }] });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(simulation).toHaveBeenCalledTimes(1);
  expect(published().binding.recording).toBe(issued.binding.recording);
  expect(published().binding.mercPilferGoldFind).toBe(30);
  expect(published().installation?.settlement.identity).toBe(issued.installation?.settlement.identity);
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(30);
});

it('uses captured bare fielded qualification after owned removal and requires payment on a new run', () => {
  const { merc, issued } = arrange();
  useMercStore.setState({ ownedMercs: [{ ...merc, id: 'unrelated-bench' }], fieldedMercId: 'unrelated-bench' });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const next = published();
  expect(next.binding.engineInput.playerTeam.find(unit => unit.kind === 'merc')).toMatchObject({
    id: `merc-${merc.id}`, mercPilferSource: true, skillOrder: [PILFER] });
  expect(next.binding.mercPilferGoldFind).toBe(30);
  expect(issued.binding.mercPilferGoldFind).toBe(30);
  abortSubAreaRun(); useMercStore.setState({ ownedMercs: [merc], fieldedMercId: merc.id });
  registerSkill({ ...MERC_PILFER_SKILL });
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  expect(published().binding).not.toHaveProperty('mercPilferGoldFind');
});

it('applies the same wave modifier to native Find Item bonus bags without adding mercenary find stats', () => {
  const { out, issued } = arrange({ search: true });
  const finds = out.result.findItemFinds ?? [];
  expect(finds.length).toBeGreaterThan(0);
  expect(issued.binding.engineInput.playerTeam.find(unit => unit.kind === 'merc')?.stats.goldFind).toBe(500);
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const slain = out.result.enemyTeam.filter(unit => unit.life <= 0 && unit.kind !== 'summon');
  expect(generation).toHaveBeenCalledTimes(slain.length + finds.length);
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(30);
});

it.each(['flee', 'defeat'] as const)('never rewards paid Pilfer on %s', outcome => {
  const { out } = arrange(outcome === 'defeat' ? { transform: result => Object.assign(result.result, { winner: 'enemy' }) } : {});
  expect(out.result.mercPilferGoldFind).toBe(30);
  const inventory = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  const generation = vi.spyOn(loot, 'rollKillRewards');
  if (outcome === 'flee') abortSubAreaRun(); else drain();
  expect(advanceWaveOrFinish()).toBe(outcome === 'flee' ? 'idle' : 'defeat');
  expect(generation).not.toHaveBeenCalled();
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(usePlayerStore.getState().player).toBe(player);
});

it.each(['generation', 'inventory-observer'] as const)('rolls back native paid-find settlement after %s failure', failure => {
  arrange(); drain();
  const domains = [usePlayerStore, useMercStore, useInventoryStore, useMapStore] as const;
  const before = domains.map(store => store.getState()), error = new Error(`injected ${failure}`);
  const roll = loot.rollKillRewards, generation = vi.spyOn(loot, 'rollKillRewards');
  if (failure === 'generation') generation.mockImplementation((...args) => {
    if (generation.mock.calls.length === 2) throw error;
    return roll(...args);
  });
  let once = true;
  const stop = failure === 'inventory-observer' ? useInventoryStore.subscribe(() => {
    if (once) { once = false; throw error; }
  }) : () => undefined;
  try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
  domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(published().installation?.settlement.progress.phase).toBe('settlementFailed');
  const count = generation.mock.calls.length;
  expect(advanceWaveOrFinish).toThrow(new RecordedWaveAccessError('settlementFailed'));
  expect(generation).toHaveBeenCalledTimes(count);
});

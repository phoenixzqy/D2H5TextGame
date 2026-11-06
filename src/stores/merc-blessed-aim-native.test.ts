import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Durable I/O alone is replaced; native factories, simulation and wave receipts remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as engine from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { inspectRecordedWaves } from './recordedWaveReceipt';
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
function owned() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-blessed-aim');
  if (!def) throw new Error('Missing native Blessed Aim merc');
  return createMercFromDef(def, 'aim-native');
}
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function published() {
  const wave = inspectRecordedWaves().currentPublished;
  if (!wave) throw new Error('Missing native published wave');
  return wave;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange() {
  registerSkill({ id: 'fixture.aim-native-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100000, 100000], alwaysHits: true }
    ] });
  const hero = createMockPlayer('Synthetic Aim lifecycle', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.aim-native-finisher'] });
  // Imported survivors and synthetic finisher isolate configuration boundaries, not earned play.
  const native = owned(), merc = { ...native, level: 30, derivedStats: { ...native.derivedStats,
    life: 10000, lifeMax: 10000, attackSpeed: 263, critChance: 0 } };
  useMercStore.getState().addMerc(merc); useMercStore.getState().setFieldedMerc(merc.id);
  const simulate = engine.runBattleRecorded;
  const simulation = vi.spyOn(engine, 'runBattleRecorded').mockImplementation((...args) => simulate(...args));
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1,
    runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  return { merc, issued: published(), simulation };
}
function sourceInput() {
  return published().binding.engineInput.playerTeam.find(unit => unit.kind === 'merc');
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('projects only the original owned identity/bar at valid integer levels without mutating persistent stats', () => {
  const merc = owned(), before = structuredClone(merc);
  expect(mercToCombatUnit(merc)).toHaveProperty('mercBlessedAimAura', true);
  expect(mercToCombatUnit({ ...merc, id: 'mercs/act2-might#forged' })).not.toHaveProperty('mercBlessedAimAura');
  expect(mercToCombatUnit({ ...merc, signatureSkillId: 'mskill-jab', comboOrder: ['mskill-jab'] }))
    .not.toHaveProperty('mercBlessedAimAura');
  for (const level of [0, NaN, Infinity, 1.5]) expect(mercToCombatUnit({ ...merc, level }))
    .not.toHaveProperty('mercBlessedAimAura');
  expect(merc).toEqual(before);
  expect(merc).not.toHaveProperty('mercBlessedAimAura');
});

it.each(['bar', 'level'] as const)('refreshes lost/restored %s next wave without editing an issued recording', loss => {
  const { merc, issued } = arrange(), before = structuredClone(issued.binding.recording);
  expect(sourceInput()).toHaveProperty('mercBlessedAimAura', true);
  expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'action' &&
    event.skillId === 'aura-blessed-aim')).toBe(false);
  useMercStore.setState({ ownedMercs: [{ ...merc, ...(loss === 'level' ? { level: 0 }
    : { signatureSkillId: 'mskill-jab', comboOrder: ['mskill-jab'] }) }] });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(sourceInput()).not.toHaveProperty('mercBlessedAimAura');
  expect(issued.binding.recording).toEqual(before);
  useMercStore.setState({ ownedMercs: [merc] });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(sourceInput()).toHaveProperty('mercBlessedAimAura', true);
  expect(useMercStore.getState().ownedMercs).toEqual([merc]);
  expect(useMercStore.getState().ownedMercs[0]).not.toHaveProperty('mercBlessedAimAura');
});

it('rebuilds ordinary replay from current configuration while preserving payout identity', () => {
  const { merc, issued, simulation } = arrange(), original = structuredClone(issued.binding.recording);
  const identity = issued.installation?.settlement.identity;
  useMercStore.setState({ ownedMercs: [{ ...merc, signatureSkillId: 'mskill-jab', comboOrder: ['mskill-jab'] }] });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(simulation).toHaveBeenCalledTimes(2);
  expect(sourceInput()).not.toHaveProperty('mercBlessedAimAura');
  expect(published().installation?.settlement.identity).toBe(identity);
  expect(issued.binding.recording).toEqual(original);
  useMercStore.setState({ ownedMercs: [merc] });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(sourceInput()).toHaveProperty('mercBlessedAimAura', true);
  expect(published().installation?.settlement.identity).toBe(identity);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const inventory = useInventoryStore.getState();
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(inventory);
});

it('preserves captured bare fallback when the original owned merc leaves the roster', () => {
  const { merc } = arrange();
  useMercStore.setState({ ownedMercs: [{ ...merc, id: 'unrelated-bench' }], fieldedMercId: 'unrelated-bench' });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(sourceInput()).toMatchObject({ id: 'merc-' + merc.id, mercBlessedAimAura: true });
  expect(sourceInput()?.skillOrder).toContain('aura-blessed-aim');
});

it('starts a new run from current owned qualification without inheriting an old aura marker', () => {
  const { merc } = arrange();
  expect(sourceInput()).toHaveProperty('mercBlessedAimAura', true);
  abortSubAreaRun();
  useMercStore.setState({ ownedMercs: [{ ...merc, signatureSkillId: 'mskill-jab', comboOrder: ['mskill-jab'] }] });
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  expect(sourceInput()).not.toHaveProperty('mercBlessedAimAura');
  expect(usePlayerStore.getState().player).not.toHaveProperty('mercBlessedAimAura');
});

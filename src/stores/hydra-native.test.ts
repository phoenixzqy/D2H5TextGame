import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only persistence I/O is replaced; validation, projection, combat and wave transitions are real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun, resetIdleElitePity, playerToCombatUnit } from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing synthetic Hydra player');
  return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
/** Deliberately synthetic power establishes wave plumbing, not earned balance. */
function arrange() {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native Hydra', 'sorceress'), level: 30,
    comboOrder: ['skills-sorceress-hydra'], skillLevels: { 'skills-sorceress-inferno': 1,
      'skills-sorceress-blaze': 1, 'skills-sorceress-fire-wall': 1, 'skills-sorceress-hydra': 20,
      'skills-sorceress-fire-mastery': 20 } });
  const cap = { id: 'fixture-hydra-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState(), final = state.outcome?.finalPlayerTeam[0];
  expect(state.outcome?.winner).toBe('player');
  if (!final) throw new Error('Missing native Hydra outcome');
  expect(state.recordedEvents.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toHaveLength(1);
  expect(state.playerTeam.filter(u => u.summonTemplateId === 'hydra')).toEqual([]);
  return { final: structuredClone(final), events: structuredClone(state.recordedEvents),
    initial: structuredClone(state.playerTeam), elapsed: state.recordedEvents.at(-1)?.simClockMs ?? 0 };
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('rebuilds and pays from carried mana with the current learned rank, without changing issued events', () => {
  const before = arrange();
  usePlayerStore.setState({ player: { ...player(), skillLevels: { ...player().skillLevels,
    'skills-sorceress-hydra': 1, 'skills-sorceress-fire-mastery': 1 } } });
  expect(useCombatStore.getState().recordedEvents).toEqual(before.events);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const state = useCombatStore.getState(), hero = state.playerTeam[0];
  expect(hero?.hydraRank).toBe(1);
  expect([hero?.life, hero?.mana]).toEqual([before.final.life, before.final.mana]);
  expect(state.playerTeam.filter(u => u.summonTemplateId === 'hydra')).toEqual([]);
  const spawn = state.recordedEvents.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  expect(state.recordedEvents.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toHaveLength(1);
  if (spawn?.kind !== 'summon') throw new Error('Missing fresh paid body');
  expect(spawn).toMatchObject({ simClockMs: 0, unit: { life: 240, statuses: [],
    increasedDamagePct: { fire: 0.04 } } });
  expect(state.recordedEvents.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ target: hero?.id, mana: before.final.mana - 40, simClockMs: 0 })]);
  expect(state.recordedEvents.some(e => e.kind === 'damage' && e.source === spawn.unit.id && e.damageType === 'fire')).toBe(true);
  expect(before.initial[0]?.hydraRank).toBe(20);
  expect(before.events.find(e => e.kind === 'summon' && e.summonId === 'hydra')).toMatchObject({
    unit: { increasedDamagePct: { fire: 0.8 } } });
});

it.each(['unlearn', 'wrong-class', 'unselected'] as const)('does not prepare after next-wave %s invalidation', invalid => {
  const before = arrange();
  usePlayerStore.setState({ player: { ...player(),
    ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}),
    ...(invalid === 'unselected' ? { comboOrder: [] } : {}),
    skillLevels: { ...player().skillLevels, 'skills-sorceress-hydra': invalid === 'unlearn' ? 0 : 20 } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'summon' && e.summonId === 'hydra')).toBe(false);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'sorceress.hydra')).toBe(false);
  expect(before.events.some(e => e.kind === 'summon' && e.summonId === 'hydra')).toBe(true);
});

it('roundtrips configuration through import and starts a freshly paid body with no saved runtime state', async () => {
  arrange(); const save = snapshotStores(), expected = playerToCombatUnit(player());
  if (!save) throw new Error('Missing Hydra save');
  expect(JSON.stringify(toJsonSafe(save))).not.toMatch(/"hydraRank"|"hydras"|"summonTemplateId"|"statuses"/);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(expected.hydraRank).toBe(20);
  expect(expected.statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
  const state = useCombatStore.getState(), events = state.recordedEvents, initial = state.playerTeam[0];
  expect(initial?.mana).toBe(initial?.stats.manaMax);
  expect(initial?.mana).toBeGreaterThan(40);
  expect(events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toHaveLength(1);
  expect(events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ mana: (initial?.mana ?? 0) - 40, simClockMs: 0 })]);
});

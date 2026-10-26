import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only durable I/O is replaced; composition, combat, playback and settlement stay real.
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
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun, resetIdleElitePity } from './combatHelpers';
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
  if (!value) throw new Error('Missing synthetic ward player'); return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange() {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native ward', 'barbarian'), level: 30,
    comboOrder: ['skills-barbarian-grim-ward'], skillLevels: {
      'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 1, 'skills-barbarian-grim-ward': 20 } });
  const cap = { id: 'fixture-ward-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState(); expect(state.outcome?.winner).toBe('player');
  expect(state.recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward')).toBe(true);
  expect(state.recordedEvents.some(e => e.kind === 'status' && e.statusId === 'howl')).toBe(true);
  expect(inspectRecordedWaves().currentPublished?.binding.engineInput.grimWard).toEqual([{ sourceHeroId: player().id, rank: 20 }]);
  expect(state.outcome?.finalPlayerTeam[0]?.statuses.some(s => s.id === 'grim-ward')).toBe(false);
  return structuredClone(state.recordedEvents);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('recomposes next-wave rank and starts a new ward only after another genuine death', () => {
  const issued = arrange(); usePlayerStore.setState({ player: { ...player(), skillLevels: {
    ...player().skillLevels, 'skills-barbarian-grim-ward': 1 } } });
  expect(useCombatStore.getState().recordedEvents).toEqual(issued);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const events = useCombatStore.getState().recordedEvents;
  expect(inspectRecordedWaves().currentPublished?.binding.engineInput.grimWard).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  const cast = events.find(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward'); expect(cast).toBeDefined();
  expect(events.some(e => e.kind === 'death' && e.simClockMs < (cast?.simClockMs ?? 0))).toBe(true);
  expect(events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedGrimWard')).toMatchObject({ params: { duration: 6 } });
});

it.each(['unlearn', 'find-item', 'find-potion', 'wrong-class', 'unselected'] as const)('invalidates%s next wave', invalid => {
  arrange(); const levels = { ...player().skillLevels };
  levels[invalid === 'find-item' ? 'skills-barbarian-find-item' : invalid === 'find-potion'
    ? 'skills-barbarian-find-potion' : 'skills-barbarian-grim-ward'] = invalid === 'wrong-class' || invalid === 'unselected' ? 20 : 0;
  usePlayerStore.setState({ player: { ...player(), skillLevels: levels,
    ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}), ...(invalid === 'unselected' ? { comboOrder: [] } : {}) } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward')).toBe(false);
});

it('roundtrips learned configuration without a paid ward, timer or corpse supply', async () => {
  arrange(); const save = snapshotStores(); if (!save) throw new Error('Missing save');
  const text = JSON.stringify(toJsonSafe(save)); expect(text).not.toMatch(/"grimWard"|"grimWards"|"corpses"|"statuses"/);
  await importIntoStores(text); expect(player()).toEqual(save.player);
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward')).toBe(true);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.grim_ward' && e.simClockMs === 0)).toBe(false);
});

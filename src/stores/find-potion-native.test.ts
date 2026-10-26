import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only; native allocation, snapshots, battle, playback and wave advancement are real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import { composeFindPotion } from '@/engine/skills/find-potion';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
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
  if (!value) throw new Error('Missing synthetic recovery player'); return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange() {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native recovery', 'barbarian'), level: 30,
    comboOrder: ['skills-barbarian-find-potion'], skillLevels: { 'skills-barbarian-find-potion': 20 } });
  const cap = { id: 'fixture-recovery-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState();
  expect(state.outcome?.winner).toBe('player');
  expect(state.recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion')).toBe(true);
  const final = state.outcome?.finalPlayerTeam[0];
  if (!final) throw new Error('Missing recovery outcome');
  return { events: structuredClone(state.recordedEvents), final: structuredClone(final) };
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('recomposes current learned rank next wave and preserves issued events/carried pools', () => {
  const before = arrange();
  usePlayerStore.setState({ player: { ...player(), skillLevels: { 'skills-barbarian-find-potion': 1 } } });
  // A larger synthetic maximum makes the next recovery uncapped, distinguishing rank1 from stale20.
  const larger = { id: 'fixture-larger-recovery-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 1999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  useInventoryStore.getState().addItem(larger);
  expect(useInventoryStore.getState().equipItem(larger)).toEqual({ ok: true });
  expect(useCombatStore.getState().recordedEvents).toEqual(before.events);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const state = useCombatStore.getState(), hero = state.playerTeam[0];
  expect([hero?.life, hero?.mana]).toEqual([before.final.life, before.final.mana]);
  expect(composeFindPotion(player())?.rank).toBe(1);
  const casts = state.recordedEvents.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion');
  expect(casts.length).toBeGreaterThan(0);
  const first = casts[0]; if (!first) throw new Error('Missing next-wave recovery');
  expect(state.recordedEvents.find(e => e.kind === 'heal' && e.target === hero?.id && e.simClockMs === first.simClockMs))
    .toMatchObject({ amount: Math.floor((hero?.stats.lifeMax ?? 0) * .1) });
  expect(state.recordedEvents.some(e => e.kind === 'death' && e.simClockMs <= first.simClockMs)).toBe(true);
  expect(state.recordedEvents.filter(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion' && e.simClockMs === 0)).toEqual([]);
});

it.each(['unlearn', 'wrong-class', 'unselected'] as const)('skips after next-wave %s invalidation', invalid => {
  const before = arrange();
  usePlayerStore.setState({ player: { ...player(),
    ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}),
    ...(invalid === 'unselected' ? { comboOrder: [] } : {}),
    skillLevels: { 'skills-barbarian-find-potion': invalid === 'unlearn' ? 0 : 20 } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion')).toBe(false);
  expect(before.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion')).toBe(true);
});

it('roundtrips only learned configuration and starts without persistent corpse or paid state', async () => {
  arrange(); const save = snapshotStores(); if (!save) throw new Error('Missing recovery save');
  expect(JSON.stringify(toJsonSafe(save))).not.toMatch(/"findPotion"|"corpses"|"statuses"/);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(composeFindPotion(player())?.rank).toBe(20);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
  const events = useCombatStore.getState().recordedEvents;
  expect(events.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion' && e.simClockMs === 0)).toBe(false);
  expect(events.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_potion')).toBe(true);
});

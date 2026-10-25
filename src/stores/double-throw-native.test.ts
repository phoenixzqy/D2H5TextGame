import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  startSubAreaRun
} from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
] as const;
function reset() {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Barbarian');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({
    team: s.playerTeam,
    events: s.recordedEvents,
    outcome: s.outcome,
    cursor: s.eventCursor,
    rewards: s.runRewards
  });
}
/** Constructed level/pool/Attack equipment; native basic attacks, never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Native Barbarian passive fixture', 'barbarian');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: [],
    skillLevels: { 'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1 }
  });
  const cap: Item = {
    id: 'fixture-pool-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', 100]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!value) throw new Error('Missing native Double Throw outcome');
  return value;
}
it('freezes the current native wave, then uses learned Double Throw on the next wave', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(), baseStats = structuredClone(hero().stats), final = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-double-throw')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-barbarian-double-throw']);
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().skillLevels?.['barbarian.double_throw']).toBe(1);
  expect(hero().stats).toEqual(baseStats);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.double_throw')).toBe(true);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(true);
});
it('roundtrips learned rank and priority without saved combat payloads or a pool refill', async () => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-double-throw')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-barbarian-double-throw']);
  const expected = playerToCombatUnit(player()), save = snapshotStores();
  if (!save) throw new Error('Missing Double Throw save');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.double_throw')).toBe(true);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});

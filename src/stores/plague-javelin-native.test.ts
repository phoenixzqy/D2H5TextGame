import { beforeEach, afterEach, expect, it, vi } from 'vitest';
// Persistence I/O only; allocation, projection, combat and save validation remain real.
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, startSubAreaRun } from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const id = 'skills-amazon-plague-javelin', runtime = 'amazon.plague_javelin';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing native Amazon');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing wave hero');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    cursor: s.eventCursor, rewards: s.runRewards });
}
/** Constructed pools and Attack make transitions observable; this is not earned balance. */
function arrange() {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native Plague wave', 'amazon'),
    level: 30, skillPoints: 5, comboOrder: [], skillLevels: {} });
  const cap: Item = { id: 'plague-native-pool-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'synthetic-import', values: new Map([
      ['statMods.life', 999000], ['statMods.mana', 999000],
      ['statMods.attack', 1000], ['statMods.attackSpeed', 100]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
function learn() {
  const allocated = new Set<string>();
  function add(skillId: string) {
    if (allocated.has(skillId)) return;
    const row = rows.find(row => row.id === skillId);
    if (!row) throw new Error('Missing Amazon prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    expect(usePlayerStore.getState().allocateSkillPoint(skillId)).toBe('ok');
    allocated.add(skillId);
  }
  add(id); usePlayerStore.getState().setComboOrder([id]);
}
function drainAndAdvance() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(advanceWaveOrFinish()).toBe('next-wave');
}
function expectPaidCast() {
  const events = useCombatStore.getState().recordedEvents, unit = hero();
  const payments = events.filter(e => e.kind === 'mana' && e.reason === 'cast' && e.target === unit.id);
  expect(payments.length).toBeGreaterThan(0);
  for (const payment of payments) {
    if (payment.kind !== 'mana') throw new Error('Missing absolute mana');
    const previous = events.slice(0, events.indexOf(payment)).reverse()
      .find(e => e.kind === 'mana' && e.target === unit.id);
    expect((previous?.kind === 'mana' ? previous.mana : unit.mana) - payment.mana).toBeCloseTo(25, 7);
    expect(events.some(e => e.kind === 'action' && e.actor === unit.id &&
      e.skillId === runtime && e.simClockMs === payment.simClockMs)).toBe(true);
  }
  for (const status of ['poison', 'plague'])
    expect(events.some(e => e.kind === 'status' && e.statusId === status)).toBe(true);
}

it('freezes each recorded wave and captures newly allocated Plague rank only at the next wave', () => {
  arrange(); expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(), firstFinal = structuredClone(first.outcome?.finalPlayerTeam[0]);
  learn(); const expectedStats = structuredClone(playerToCombatUnit(player()).stats);
  expect(recording()).toEqual(first);
  drainAndAdvance();
  expect(hero().skillLevels?.[runtime]).toBe(1); expect(hero().stats).toEqual(expectedStats);
  expect([hero().life, hero().mana]).toEqual([firstFinal?.life, firstFinal?.mana]);
  expectPaidCast();
  const paid = recording(), paidFinal = structuredClone(paid.outcome?.finalPlayerTeam[0]);
  expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
  expect(recording()).toEqual(paid);
  drainAndAdvance();
  expect(hero().skillLevels?.[runtime]).toBe(2);
  expect([hero().life, hero().mana]).toEqual([paidFinal?.life, paidFinal?.mana]);
  expectPaidCast();
});

it('roundtrips legal Plague allocation and priority without serializing active Poison/Plague authority', async () => {
  arrange(); learn(); const expected = playerToCombatUnit(player());
  expect(startSubAreaRun({ subAreaId: 'a1-catacombs', runSeed: 7, challengeOrdinal: 0 })).toBeTruthy(); expectPaidCast();
  const events = useCombatStore.getState().recordedEvents;
  const index = events.findIndex(e => e.kind === 'status-state' &&
    e.statuses.some(s => s.id === 'plague'));
  expect(index).toBeGreaterThanOrEqual(0);
  for (let i = 0; i <= index; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().enemyTeam.some(u => u.statuses.some(s => s.id === 'plague'))).toBe(true);
  const save = snapshotStores(); if (!save) throw new Error('Missing native Plague save');
  const json = JSON.stringify(toJsonSafe(save)); expect(json).not.toContain('"dotPerStack"');
  await importIntoStores(json);
  const restored = snapshotStores(); if (!restored) throw new Error('Missing restored native Plague save');
  for (const domain of ['endgame', 'player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
    expect(toJsonSafe(restored[domain]), domain).toEqual(toJsonSafe(save[domain]));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(useCombatStore.getState().enemyTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ subAreaId: 'a1-catacombs', runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(hero().skillLevels?.[runtime]).toBe(1); expectPaidCast();
});

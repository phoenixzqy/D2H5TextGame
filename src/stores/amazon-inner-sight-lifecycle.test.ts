import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('@/stores/save-adapter', () => ({
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
} from '@/stores/combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from '@/stores/persistence';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';

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
  if (!value) throw new Error('Missing functional Amazon');
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
/** Constructed level/pool/Attack/critical equipment; never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic Inner Sight lifecycle fixture', 'amazon');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 12,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'inner-sight-fixture-pool-cap',
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
          ['statMods.attackSpeed', 100],
          ['statMods.critChance', 1000]
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
  if (!value) throw new Error('Missing native attack outcome');
  return value;
}
const dataId = 'skills-amazon-inner-sight',
  runtimeId = 'amazon.inner_sight';
function learn(rank = 1) {
  for (let point = 0; point < rank; point++)
    expect(usePlayerStore.getState().allocateSkillPoint(dataId)).toBe('ok');
  usePlayerStore.getState().setComboOrder([dataId]);
}
function assertPaidPacket() {
  const state = useCombatStore.getState();
  const cast = state.recordedEvents.find(
    (event) => event.kind === 'action' && event.skillId === runtimeId
  );
  expect(cast).toBeDefined();
  if (!cast) throw new Error('Missing native paid Inner Sight');
  expect(
    state.recordedEvents.some(
      (event) =>
        event.kind === 'mana' &&
        event.reason === 'cast' &&
        event.target === hero().id &&
        event.simClockMs === cast.simClockMs
    )
  ).toBe(true);
  const affected = state.recordedEvents.filter(
    (event) =>
      event.kind === 'status-state' &&
      event.simClockMs === cast.simClockMs &&
      event.statuses.some((status) => status.id === 'inner-sight')
  );
  expect(affected.length).toBeGreaterThan(0);
  for (const event of affected) {
    if (event.kind !== 'status-state') throw new Error('Missing status packet');
    expect(state.enemyTeam.some((enemy) => enemy.id === event.target)).toBe(true);
    expect(event.statuses.find((status) => status.id === 'inner-sight')).toMatchObject({
      sourceId: hero().id,
      stacks: 1,
      appliedAtMs: cast.simClockMs,
      expiresAtMs: cast.simClockMs + 8000,
      innerSight: { defenseReductionPct: 25 }
    });
  }
  expect(
    state.enemyTeam.every((enemy) => enemy.statuses.every((status) => status.id !== 'inner-sight'))
  ).toBe(true);
}
it('freezes the current wave and applies newly allocated Inner Sight only in later waves', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(),
    final = structuredClone(finalHero());
  learn();
  const expectedStats = structuredClone(playerToCombatUnit(player()).stats);
  expect(recording()).toEqual(first);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((event) => event.kind === 'action' && event.skillId === runtimeId)
  ).toBe(false);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().skillLevels?.[runtimeId]).toBe(1);
  expect(hero().stats).toEqual(expectedStats);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  assertPaidPacket();
  const paidRecording = recording(),
    paidFinal = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint(dataId)).toBe('ok');
  expect(recording()).toEqual(paidRecording);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().skillLevels?.[runtimeId]).toBe(2);
  expect([hero().life, hero().mana]).toEqual([paidFinal.life, paidFinal.mana]);
  assertPaidPacket();
});
it('roundtrips learned rank and priority while clearing transient combat packets', async () => {
  arrange();
  learn();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  assertPaidPacket();
  const save = snapshotStores();
  if (!save) throw new Error('Missing native Inner Sight save');
  const expected = playerToCombatUnit(player()),
    json = JSON.stringify(toJsonSafe(save));
  expect(json).not.toContain('"innerSight"');
  expect(json).not.toContain('"defenseReductionPct"');
  await importIntoStores(json);
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(useCombatStore.getState().enemyTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  assertPaidPacket();
});

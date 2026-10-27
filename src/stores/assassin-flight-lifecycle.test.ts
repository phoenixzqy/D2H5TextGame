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
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import rows from '@/data/skills/assassin.json';

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
  if (!value) throw new Error('Missing functional Assassin');
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
  const fresh = createMockPlayer('Constructed Flight lifecycle fixture', 'assassin');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 29,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'flight-fixture-pool-cap',
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

function learn(slug: string) {
  const learned = new Set<string>();
  function add(id: string) {
    if (learned.has(id)) return;
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing native Flight prerequisite');
    for (const dependency of row.prerequisites ?? []) add(dependency);
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
    learned.add(id);
  }
  add('skills-assassin-' + slug);
  usePlayerStore.getState().setComboOrder(['skills-assassin-' + slug]);
}

const alias = 'skills-assassin-dragon-flight', runtime = 'assassin.dragon_flight';
function assertFreshPaidWave(rank: number) {
  const state = useCombatStore.getState(), actor = hero();
  expect(actor.assassinMartialRanks).toEqual({ [runtime]: rank });
  const initial = state.recordedEvents.find(e => e.kind === 'status-state' && e.target === actor.id && e.initial);
  if (initial?.kind !== 'status-state') throw new Error('Missing native Flight initial observation');
  expect(initial.statuses.some(s => s.id === 'dragon-flight')).toBe(false);
  expect(state.recordedEvents.some(e => e.kind === 'action' && e.actor === actor.id && e.skillId === runtime)).toBe(true);
  expect(state.recordedEvents.some(e => e.kind === 'status-state' && e.target === actor.id &&
    e.statuses.some(s => s.id === 'dragon-flight'))).toBe(true);
  expect(state.recordedEvents.find(e => e.kind === 'mana' && e.target === actor.id && e.reason === 'cast'))
    .toMatchObject({ mana: actor.mana - 15 });
  expect(state.outcome?.winner).toBe('player');
}
it('refreshes native learned Flight next wave without editing recorded combat, and carries exact MP/CD', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  const first = recording(), firstFinal = structuredClone(finalHero());
  learn('dragon-flight');
  expect(recording()).toEqual(first); expect(hero().assassinMartialRanks).toEqual({});
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect([hero().life, hero().mana]).toEqual([firstFinal.life, firstFinal.mana]);
  assertFreshPaidWave(1);
  const second = recording(), secondFinal = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint(alias)).toBe('ok');
  expect(recording()).toEqual(second);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect([hero().life, hero().mana, hero().cooldowns]).toEqual([secondFinal.life, secondFinal.mana, secondFinal.cooldowns]);
  expect(hero().assassinMartialRanks).toEqual({ [runtime]: 2 });
  const initial = useCombatStore.getState().recordedEvents.find(e => e.kind === 'status-state' && e.target === hero().id && e.initial);
  expect(initial?.kind === 'status-state' && initial.statuses.some(s => s.id === 'dragon-flight')).toBe(false);
  abortSubAreaRun(); useCombatStore.getState().endCombat();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(hero().cooldowns).toEqual({}); assertFreshPaidWave(2);
});
it('imports the real learned setup, drops paid Flight and recorded combat, then requires fresh payment', async () => {
  arrange(); learn('dragon-flight');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy(); assertFreshPaidWave(1);
  const save = snapshotStores(); if (!save) throw new Error('Missing native Flight save');
  const expected = playerToCombatUnit(player()), json = JSON.stringify(toJsonSafe(save));
  for (const key of ['assassinMartialRanks', 'assassinFlights', 'dragon-flight', 'recordedEvents'])
    expect(json).not.toContain('"' + key + '"');
  await importIntoStores(json);
  expect(player()).toEqual(save.player); expect(playerToCombatUnit(player())).toEqual(expected);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(useCombatStore.getState().playerTeam).toEqual([]); expect(useCombatStore.getState().enemyTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy(); assertFreshPaidWave(1);
});
it('refuses active respec, clears combat on flee and removes Flight after actual town respec', () => {
  arrange(); learn('dragon-flight');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy(); assertFreshPaidWave(1);
  const before = recording(); expect(prepareTownRespec('npc/akara', 'skill').kind).toBe('combat-active');
  expect(recording()).toEqual(before);
  abortSubAreaRun(); useCombatStore.getState().endCombat(); expect(useCombatStore.getState().playerTeam).toEqual([]);
  const quote = prepareTownRespec('npc/akara', 'skill'); if (quote.kind !== 'ok') throw new Error(quote.kind);
  expect(executeTownRespec(quote.request)).toBe('ok'); expect(player().skillLevels).toEqual({});
  expect(player().comboOrder).toEqual([]); expect(playerToCombatUnit(player()).assassinMartialRanks).toEqual({});
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'status-state' &&
    e.statuses.some(s => s.id === 'dragon-flight'))).toBe(false);
  const actions = useCombatStore.getState().recordedEvents.filter(e => e.kind === 'action' && e.actor === hero().id);
  expect(actions.length).toBeGreaterThan(0); expect(actions.every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
});

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
  const fresh = createMockPlayer('Synthetic Valkyrie lifecycle fixture', 'amazon');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 12,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'valkyrie-fixture-pool-cap',
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
import rows from '@/data/skills/amazon.json';
const dataId = 'skills-amazon-valkyrie',
  runtimeId = 'amazon.valkyrie';
function learn() {
  const learned = new Set<string>();
  function add(id: string) {
    if (learned.has(id)) return;
    const source = rows.find((row) => row.id === id);
    if (!source) throw new Error('Missing Valkyrie prerequisite');
    for (const prerequisite of source.prerequisites ?? []) add(prerequisite);
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
    learned.add(id);
  }
  add(dataId);
  usePlayerStore.getState().setComboOrder([dataId]);
}
function assertPaidBody(rank: 1 | 2) {
  const state = useCombatStore.getState();
  const summons = state.recordedEvents.filter(
    (event) => event.kind === 'summon' && event.summonId === 'valkyrie'
  );
  expect(summons).toHaveLength(1);
  const event = summons[0];
  if (event?.kind !== 'summon') throw new Error('Missing actual paid Valkyrie');
  expect(event).toMatchObject({ owner: hero().id, simClockMs: 0 });
  expect(event.unit).toMatchObject({
    kind: 'summon',
    summonOwnerId: hero().id,
    summonTemplateId: 'valkyrie',
    life: rank === 1 ? 200 : 214,
    stats: {
      lifeMax: rank === 1 ? 200 : 214,
      attack: rank === 1 ? 40 : 43,
      defense: rank === 1 ? 20 : 22
    }
  });
  expect(
    state.recordedEvents.filter((event) => event.kind === 'mana' && event.reason === 'cast')
  ).toEqual([
    expect.objectContaining({ target: hero().id, mana: hero().mana - 25, simClockMs: 0 })
  ]);
  expect(
    state.recordedEvents.filter((event) => event.kind === 'action' && event.skillId === runtimeId)
  ).toEqual([expect.objectContaining({ actor: hero().id, simClockMs: 0 })]);
}
it('freezes the current wave and prepares newly allocated ranks from carried mana in later waves', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(),
    final = structuredClone(finalHero());
  learn();
  expect(recording()).toEqual(first);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((event) => event.kind === 'summon' && event.summonId === 'valkyrie')
  ).toBe(false);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().skillLevels?.[runtimeId]).toBe(1);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  assertPaidBody(1);
  const paid = recording(),
    paidFinal = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint(dataId)).toBe('ok');
  expect(recording()).toEqual(paid);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().skillLevels?.[runtimeId]).toBe(2);
  expect([hero().life, hero().mana]).toEqual([paidFinal.life, paidFinal.mana]);
  assertPaidBody(2);
});
it('saves rank and priority without serializing an owned combat body or its paid resources', async () => {
  arrange();
  learn();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  assertPaidBody(1);
  const save = snapshotStores();
  if (!save) throw new Error('Missing Valkyrie save');
  const expected = playerToCombatUnit(player()),
    json = JSON.stringify(toJsonSafe(save));
  expect(json).not.toContain('"summonTemplateId"');
  expect(json).not.toContain('"summonOwnerId"');
  await importIntoStores(json);
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  assertPaidBody(1);
});

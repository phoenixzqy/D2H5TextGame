import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only storage I/O is replaced; real save validation/import/projection is exercised.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { activeSorceressBuff, SORCERESS_BUFF_DEFINITIONS, type SorceressBuffId } from '@/engine/skills/sorceress-buffs';
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
  __resetPersistenceForTests();
  abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing diagnostic player');
  return value;
}
function drain() {
  const state = useCombatStore.getState(), count = state.recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
/** Synthetic native character/equipment and a diagnostic finisher; no earned-build claim. */
function arrange(id: SorceressBuffId) {
  registerSkill({ id: 'fixture.buff-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'cold', base: [100000, 100000] }] });
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native paid buff', 'sorceress'),
    level: 30, comboOrder: ['skills-sorceress-' + id, 'fixture.buff-finisher'], skillLevels: {
      'skills-sorceress-telekinesis': 1, 'skills-sorceress-fire-bolt': 1,
      'skills-sorceress-fire-ball': 1, ['skills-sorceress-' + id]: 20 } });
  const cap = { id: 'fixture-buff-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [], affixes: [{ affixId: 'synthetic-import',
      values: new Map([['statMods.life', 999880], ['statMods.mana', 1000],
        ['statMods.attack', 100], ['statMods.attackSpeed', 1000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState(), final = state.outcome?.finalPlayerTeam[0];
  expect(state.outcome?.winner).toBe('player');
  expect(state.playerTeam[0]?.statuses.find(s => s.id === id)).toBeUndefined();
  if (!final) throw new Error('Missing paid native wave');
  const elapsed = state.recordedEvents.at(-1)?.simClockMs ?? 0;
  expect(activeSorceressBuff(final, id, elapsed)?.rank).toBe(20);
  return { final: structuredClone(final), elapsed, events: structuredClone(state.recordedEvents) };
}
beforeEach(() => { mockSyntheticEntryPools(); reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });
for (const id of ['teleport', 'enchant'] as const) {
  it(`${id} roundtrips learned configuration while importing a fresh unpaid run`, async () => {
    arrange(id);
    const expected = playerToCombatUnit(player()), save = snapshotStores();
    if (!save) throw new Error('Missing paid-buff save');
    expect(JSON.stringify(toJsonSafe(save))).not.toMatch(/"sorceressBuff"|"statuses"|"activeBuffIds"/);
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(player()).toEqual(save.player);
    expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(expected.sorceressBuffRanks?.[id]).toBe(20);
    expect(expected.statuses).toEqual([]);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
    expect(useCombatStore.getState().recordedEvents).toEqual([]);
    expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
    const state = useCombatStore.getState();
    expect(state.playerTeam[0]?.statuses.find(s => s.id === id)).toBeUndefined();
    expect(state.recordedEvents.filter(e => e.kind === 'buff' && e.buffId === id)).toHaveLength(1);
    expect(state.recordedEvents.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });
  it.each([0, 1])(`${id} carries paid potency/remaining duration after allocation changes to rank%i`, rank => {
    const before = arrange(id), paid = activeSorceressBuff(before.final, id, before.elapsed);
    usePlayerStore.setState({ player: { ...player(), coreStats: { ...player().coreStats, strength: 999 },
      skillLevels: { ...player().skillLevels, ['skills-sorceress-' + id]: rank },
      comboOrder: ['fixture.buff-finisher'] } });
    expect(useCombatStore.getState().recordedEvents).toEqual(before.events);
    drain();
    expect(useCombatStore.getState().playerTeam[0]?.statuses.find(s => s.id === id)?.sorceressBuff).toEqual(paid);
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const state = useCombatStore.getState(), hero = state.playerTeam[0];
    if (!hero) throw new Error('Missing next-wave hero');
    expect(hero.sorceressBuffRanks?.[id]).toBe(rank);
    expect(activeSorceressBuff(hero, id, 0)).toEqual(paid);
    expect(hero.stats.attack).not.toBe(before.final.stats.attack);
    expect(hero.statuses.find(s => s.id === id)?.expiresAtMs)
      .toBe((before.final.statuses.find(s => s.id === id)?.expiresAtMs ?? 0) - before.elapsed);
    const status = hero.statuses.find(s => s.id === id);
    expect((status?.expiresAtMs ?? 0) - (status?.appliedAtMs ?? 0)).toBe(SORCERESS_BUFF_DEFINITIONS[id].durationMs);
    expect(state.recordedEvents.filter(e => e.kind === 'buff' && e.buffId === id)).toEqual([]);
  });
  it(`${id} starts a fresh native run unpaid after leaving the previous run`, () => {
    arrange(id); abortSubAreaRun(); useCombatStore.getState().endCombat();
    usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.buff-finisher'] } });
    expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
    const state = useCombatStore.getState();
    expect(state.playerTeam[0]?.statuses.find(s => s.id === id)).toBeUndefined();
    expect(state.outcome?.finalPlayerTeam[0]?.statuses.find(s => s.id === id)).toBeUndefined();
  });
}

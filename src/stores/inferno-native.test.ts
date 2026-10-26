import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only; import validation and all native combat paths remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
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
  if (!value) throw new Error('Missing diagnostic Inferno player');
  return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
/** Declared synthetic stats make a short native wave; this is not earned balance evidence. */
function arrange() {
  registerSkill({ id: 'fixture.inferno-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'cold', base: [100000, 100000] }] });
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native Inferno', 'sorceress'), level: 30,
    comboOrder: ['skills-sorceress-inferno', 'fixture.inferno-finisher'], skillLevels: { 'skills-sorceress-inferno': 20 } });
  const cap = { id: 'fixture-inferno-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attackSpeed', 1000], ['statMods.fireDamagePct', 10]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState(), final = state.outcome?.finalPlayerTeam[0];
  expect(state.outcome?.winner).toBe('player');
  if (!final) throw new Error('Missing native Inferno outcome');
  expect(final.statuses.find(s => s.id === 'inferno')?.periodicSpell).toEqual({ rank: 20 });
  expect(state.playerTeam[0]?.statuses.some(s => s.id === 'inferno')).toBe(false);
  return { final: structuredClone(final), events: structuredClone(state.recordedEvents),
    elapsed: state.recordedEvents.at(-1)?.simClockMs ?? 0 };
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('carries paid rank/phase and exact pools after positive reallocation and priority removal', () => {
  const before = arrange(), paid = before.final.statuses.find(s => s.id === 'inferno');
  usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.inferno-finisher'],
    skillLevels: { 'skills-sorceress-inferno': 1 } } });
  expect(useCombatStore.getState().recordedEvents).toEqual(before.events);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const state = useCombatStore.getState(), hero = state.playerTeam[0], carried = hero?.statuses.find(s => s.id === 'inferno');
  expect(hero?.periodicSpellRanks?.inferno).toBe(1);
  expect(carried?.periodicSpell).toEqual({ rank: 20 });
  expect(carried?.appliedAtMs).toBe((paid?.appliedAtMs ?? 0) - before.elapsed);
  expect(carried?.expiresAtMs).toBe((paid?.expiresAtMs ?? 0) - before.elapsed);
  expect([hero?.life, hero?.mana]).toEqual([before.final.life, before.final.mana]);
  expect(hero?.cooldowns).toEqual(before.final.cooldowns);
  expect(state.recordedEvents.filter(e => e.kind === 'buff' && e.buffId === 'inferno')).toEqual([]);
  expect(state.recordedEvents.filter(e => e.kind === 'damage' && e.source === player().id && e.simClockMs === 0)).toEqual([]);
  expect(state.recordedEvents.filter(e => e.kind === 'action' && e.actor === player().id &&
    e.simClockMs < (carried?.expiresAtMs ?? 0))).toEqual([]);
});

it.each(['unlearn', 'wrong-class'] as const)('strips paid carry after next-wave %s invalidation', invalid => {
  const before = arrange();
  usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.inferno-finisher'],
    ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}),
    skillLevels: { 'skills-sorceress-inferno': invalid === 'unlearn' ? 0 : 20 } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(useCombatStore.getState().playerTeam[0]?.statuses.some(s => s.id === 'inferno')).toBe(false);
  expect(before.final.statuses.find(s => s.id === 'inferno')?.periodicSpell).toEqual({ rank: 20 });
});

it('starts a fresh unselected run unpaid after leaving a channeled run', () => {
  arrange(); abortSubAreaRun(); useCombatStore.getState().endCombat();
  usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.inferno-finisher'] } });
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
  const state = useCombatStore.getState();
  expect(state.playerTeam[0]?.statuses.some(s => s.id === 'inferno')).toBe(false);
  expect(state.recordedEvents.some(e => e.kind === 'buff' && e.buffId === 'inferno')).toBe(false);
});

it('roundtrips learned configuration through real import while discarding combat-only channel state', async () => {
  arrange();
  const save = snapshotStores(), expected = playerToCombatUnit(player());
  if (!save) throw new Error('Missing Inferno save');
  expect(JSON.stringify(toJsonSafe(save))).not.toMatch(/"periodicSpell"|"periodicSpellRanks"|"statuses"/);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(expected.periodicSpellRanks?.inferno).toBe(20);
  expect(expected.statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
});

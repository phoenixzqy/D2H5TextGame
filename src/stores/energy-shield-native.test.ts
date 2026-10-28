import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  refreshActivePlayerCombatConfig,
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
  if (!value) throw new Error('Missing functional Sorceress');
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
/** Constructed level/MP/Attack equipment; native basic attacks, never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Native Energy Shield fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: [],
    skillLevels: { 'sorceress.telekinesis': 1, 'sorceress.teleport': 1, 'sorceress.energy_shield': 19 }
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
          ['statMods.defense', -1000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', -50]
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
  if (!value) throw new Error('Missing native Energy Shield outcome');
  return value;
}

it('learns at the next wave without rewriting the recording, preserves exact MP playback and replays original resources', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  expect(hero().energyShieldRank).toBe(19);
  const first = recording(), final = structuredClone(finalHero()), initialMana = hero().mana;
  expect(first.events.some(e => e.kind === 'mana' && e.reason === 'energy-shield')).toBe(true);
  expect(usePlayerStore.getState().allocateSkillPoint('skills-sorceress-energy-shield')).toBe('ok');
  expect(recording()).toEqual(first);
  // Advance real playback, including atomic timestamp batches. Visible MP follows the last consumed absolute event.
  for (let index = 0; index < first.events.length && !useCombatStore.getState().playbackComplete; index++) {
    useCombatStore.getState().advanceEvent();
    const state = useCombatStore.getState();
    const latest = state.recordedEvents.slice(0, state.eventCursor).filter(e => e.kind === 'mana' && e.target === player().id).at(-1);
    expect(hero().mana).toBe(latest?.kind === 'mana' ? latest.mana : initialMana);
  }
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(hero().mana).toBe(final.mana);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().energyShieldRank).toBe(20);
  expect([hero().life, hero().mana, hero().manaRegenExactCarry]).toEqual([final.life, final.mana, final.manaRegenExactCarry]);
  const second = recording();
  for (let repeat = 0; repeat < 2; repeat++) {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(second);
  }
});

it('composition reset removes transient authority on replay and next wave without a refill or duplicate income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const original = structuredClone(hero()), before = recording();
  // Pure reset helper verifies composition only, not payment at the town service.
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(before);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(hero().energyShieldRank).toBe(0);
  expect([hero().life, hero().mana, hero().manaRegenExactCarry])
    .toEqual([original.life, original.mana, original.manaRegenExactCarry]);
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.reason === 'energy-shield')).toBe(false);
  expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
  const refreshed = recording(), final = structuredClone(finalHero());
  refreshActivePlayerCombatConfig({ replayCurrentWave: true }); expect(recording()).toEqual(refreshed);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); expect(hero().energyShieldRank).toBe(0);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
});

it('roundtrips the allocation through validated save22 import without persisting shield authority or changing base stats', async () => {
  arrange();
  const expected = playerToCombatUnit(player()), save = snapshotStores();
  if (!save) throw new Error('Missing native save');
  expect(save.version).toBe(24);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.reason === 'energy-shield')).toBe(true);
  expect(JSON.stringify(toJsonSafe(snapshotStores()))).not.toContain('energyShieldRank');
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});

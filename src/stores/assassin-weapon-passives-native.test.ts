import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { registerSkill, resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig,
  startSubAreaRun } from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const FINISHER = 'fixture.assassin-passive-finisher';
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
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
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    cursor: s.eventCursor, rewards: s.runRewards });
}
/** Constructed equipment/level and synthetic finisher; never an earned-balance fixture. */
function arrange() {
  const fresh = createMockPlayer('Native Assassin passive fixture', 'assassin');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 12, skillPoints: 3,
    comboOrder: [FINISHER], skillLevels: {} });
  for (const slot of ['weapon', 'offhand'] as const) {
    const item: Item = { id: 'fixture-' + slot, baseId: 'items/base/wp1h-katar',
      rarity: 'normal', level: 1, identified: true, equipped: false, affixes: [], socketCapacity: 0 };
    useInventoryStore.getState().addItem(item);
    expect(useInventoryStore.getState().equipItem(item, slot)).toEqual({ ok: true });
  }
  const cap: Item = { id: 'fixture-pool-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 999000], ['statMods.mana', 999000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function learn() {
  for (const slug of ['claw-mastery', 'weapon-block', 'weapon-block']) {
    expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-' + slug)).toBe('ok');
  }
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});
it('native learning affects the next wave and respec replay removes bonuses without healing or income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const baseline = structuredClone(hero()), first = recording(), persisted = structuredClone(player().derivedStats);
  learn(); expect(recording()).toEqual(first); expect(player().derivedStats).toEqual(persisted);
  const final = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!final) throw new Error('Missing wave outcome');
  const length = first.events.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().stats.attack).toBeCloseTo(baseline.stats.attack * 1.025, 12);
  expect(hero().stats.critChance).toBeCloseTo(baseline.stats.critChance + .005, 12);
  expect(hero().stats.physDodge).toBeCloseTo(baseline.stats.physDodge + .02, 12);
  expect(hero().stats.magicDodge).toBeCloseTo(baseline.stats.magicDodge + .01, 12);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording(), pools = [hero().life, hero().mana];
  expect(resetSkillsForCompositionTest()).toBe('ok'); expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(hero().stats).toEqual(playerToCombatUnit(player()).stats);
  expect(hero().stats.attack).toBe(baseline.stats.attack);
  expect(hero().stats.physDodge).toBe(baseline.stats.physDodge);
  expect([hero().life, hero().mana]).toEqual(pools);
  expect(useCombatStore.getState().runRewards).toEqual(second.rewards);
  const replay = recording(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(replay);
});
it('roundtrips both real equipped claws and learned passives without persisting combat bonuses', async () => {
  arrange(); learn();
  const expected = playerToCombatUnit(player()), save = snapshotStores();
  if (!save) throw new Error('Missing snapshot');
  expect(save.player.derivedStats.attack).toBeLessThan(expected.stats.attack);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe('fixture-weapon');
  expect(useInventoryStore.getState().equipped.offhand?.id).toBe('fixture-offhand');
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});

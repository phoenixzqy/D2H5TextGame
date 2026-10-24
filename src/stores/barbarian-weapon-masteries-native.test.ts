import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
// Disk I/O only is faked; allocation, equipment, recordings and save validation are real.
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

const FINISHER = 'fixture.weapon-mastery-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const weapons = ['wp1h-short-sword', 'weapon-axe', 'weapon-mace',
  'wp2h-war-pike', 'weapon-spear', 'weapon-throwing-knife'];
const masterySlugs = ['sword', 'axe', 'mace', 'pole-arm', 'spear', 'throwing'];
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Barbarian');
  return value;
}
function currentHero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    cursor: s.eventCursor, rewards: s.runRewards });
}
function equip(index: number) {
  const item = useInventoryStore.getState().backpack.find(item => item.id === 'fixture-weapon-' + String(index));
  if (!item) throw new Error('Missing owned weapon');
  expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
}
/** Constructed eligibility and a synthetic battle finisher, never an earned campaign proof. */
function arrange(allocated = false) {
  const fresh = createMockPlayer('Native weapon-mastery fixture', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 6, comboOrder: [FINISHER],
    skillLevels: allocated ? { 'barbarian.sword_mastery': 2, 'barbarian.axe_mastery': 3, 'barbarian.mace_mastery': 4,
      'barbarian.pole_arm_mastery': 5, 'barbarian.spear_mastery': 6, 'barbarian.throwing_mastery': 7 } : {} });
  for (const [index, base] of weapons.entries()) {
    const item: Item = { id: 'fixture-weapon-' + String(index), baseId: 'items/base/' + base,
      rarity: 'normal', level: 1, socketCapacity: 0, identified: true, equipped: false, affixes: [] };
    useInventoryStore.getState().addItem(item);
  }
  const cap: Item = { id: 'fixture-mastery-life-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, socketCapacity: 0, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 999000], ['statMods.mana', 999000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function start() {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function nextWave() {
  const final = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!final) throw new Error('Missing original outcome');
  const length = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect([currentHero().life, currentHero().mana]).toEqual([final.life, final.mana]);
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

describe('native weapon-mastery lifecycle', () => {
  it('learns all six while unarmed; native sword/axe swaps affect only subsequent waves and carry original resources', () => {
    arrange(); start();
    const before = recording(), baseline = structuredClone(currentHero());
    for (const key of masterySlugs) {
      expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-' + key + '-mastery')).toBe('ok');
      expect(recording()).toEqual(before);
    }
    equip(0); expect(recording()).toEqual(before);
    nextWave();
    expect(currentHero().increasedDamagePct?.physical).toBe(0.03);
    expect(currentHero().stats.critChance).toBeCloseTo(baseline.stats.critChance + 0.005, 12);
    const second = recording(); equip(1); expect(recording()).toEqual(second);
    nextWave(); expect(currentHero().equippedWeapon?.weaponType).toBe('axe');
    expect(currentHero().increasedDamagePct?.physical).toBe(0.03);
    expect(player().skillPoints).toBe(0);
  });

  it('native respec removes mastery on replay without healing, extra rewards or repeated composition', () => {
    arrange(true); equip(2); start();
    const before = recording(), baseline = structuredClone(currentHero());
    expect(baseline.increasedDamagePct?.physical).toBe(0.12);
    expect(resetSkillsForCompositionTest()).toBe('ok'); expect(recording()).toEqual(before);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(currentHero().increasedDamagePct?.physical).toBeUndefined();
    expect(currentHero().stats).toEqual(playerToCombatUnit(player()).stats);
    expect([currentHero().life, currentHero().mana]).toEqual([baseline.life, baseline.mana]);
    expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
    const replayed = recording(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(replayed);
  });

  it.each([3, 4, 5])('native mastery %s applies next wave and resets on replay without healing or income', index => {
    arrange(); start();
    const first = recording(), baseline = structuredClone(currentHero());
    const slug = masterySlugs[index]; if (!slug) throw new Error('Missing mastery fixture identity');
    expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-' + slug + '-mastery')).toBe('ok');
    equip(index); expect(recording()).toEqual(first);
    nextWave();
    const learned = structuredClone(currentHero());
    expect(learned.increasedDamagePct?.physical).toBe(index === 5 ? 0.025 : 0.03);
    expect(learned.stats.critChance).toBeCloseTo(baseline.stats.critChance + (index === 5 ? 0 : 0.005), 12);
    expect(learned.stats.attackSpeed).toBeCloseTo(baseline.stats.attackSpeed * (index === 5 ? 1.01 : 1), 12);
    const second = recording();
    expect(resetSkillsForCompositionTest()).toBe('ok'); expect(recording()).toEqual(second);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(currentHero().increasedDamagePct?.physical).toBeUndefined();
    expect(currentHero().stats.attackSpeed).toBe(baseline.stats.attackSpeed);
    expect(currentHero().stats.critChance).toBe(baseline.stats.critChance);
    expect([currentHero().life, currentHero().mana]).toEqual([learned.life, learned.mana]);
    expect(useCombatStore.getState().runRewards).toEqual(second.rewards);
    const replay = recording(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(replay);
  });

  it.each([0, 1, 2, 3, 4, 5])('roundtrips real equipped weapon %s and allocation without persisting combat bonuses', async index => {
    arrange(true); equip(index);
    const expected = playerToCombatUnit(player());
    if (index === 5) expect(player().derivedStats.attackSpeed).toBeLessThan(expected.stats.attackSpeed);
    else expect(player().derivedStats.critChance).toBeLessThan(expected.stats.critChance);
    const save = snapshotStores(); if (!save) throw new Error('Missing snapshot');
    const persisted = structuredClone(save.player);
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(player()).toEqual(persisted);
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
  });
});

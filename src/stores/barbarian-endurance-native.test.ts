import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
// Disk I/O only is faked; real allocation, validation/import, recording and replay run.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { registerSkill, resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Player } from '@/engine/types/entities';
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

const FINISHER = 'fixture.barbarian-endurance-finisher';
const allocations = { 'barbarian.iron_skin': 1, 'barbarian.increased_stamina': 2,
  'barbarian.increased_speed': 2, 'barbarian.natural_resistance': 2 };
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const result = usePlayerStore.getState().player;
  if (!result) throw new Error('Missing constructed Barbarian');
  return result;
}
function currentHero() {
  const result = useCombatStore.getState().playerTeam[0];
  if (!result) throw new Error('Missing native Barbarian wave');
  return result;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    cursor: s.eventCursor, rewards: s.runRewards });
}
/** Constructed functional eligibility/gear, not earned progression or balance evidence. */
function arrange(ranks: NonNullable<Player['skillLevels']> = { 'barbarian.iron_skin': 1 }) {
  const fresh = createMockPlayer('Endurance native fixture', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillLevels: ranks,
    skillPoints: 3, comboOrder: [FINISHER] });
  const cap: Item = { id: 'fixture-endurance-native-cap', baseId: 'items/base/helm-cap',
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
function drain() {
  const length = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < length; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

describe('Barbarian endurance native allocation, recording, reset and persistence', () => {
  it('learns all three natively; only the next wave gains bonuses, with carried resources and no healing', () => {
    arrange(); start();
    const before = recording(), baseline = structuredClone(currentHero());
    for (const id of ['increased-stamina', 'increased-speed', 'natural-resistance']) {
      expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-' + id)).toBe('ok');
      expect(recording()).toEqual(before);
    }
    expect(player().skillPoints).toBe(0);
    const final = before.outcome?.finalPlayerTeam[0];
    if (!final) throw new Error('Missing original outcome');
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().stats.lifeMax).toBeCloseTo(baseline.stats.lifeMax * 1.03, 10);
    expect(currentHero().stats.attackSpeed).toBeCloseTo(baseline.stats.attackSpeed * 1.01, 12);
    expect(currentHero().stats.physDodge).toBeCloseTo(baseline.stats.physDodge + 0.005, 12);
    expect(currentHero().stats.magicDodge).toBeCloseTo(baseline.stats.magicDodge + 0.005, 12);
    expect(currentHero().stats.resistances.cold).toBe(baseline.stats.resistances.cold + 2);
    expect([currentHero().life, currentHero().mana, currentHero().manaRegenExactCarry])
      .toEqual([final.life, final.mana, final.manaRegenExactCarry]);
    expect(currentHero().life).toBeLessThan(currentHero().stats.lifeMax);
  });

  it('removes allocations by native reset and clamps original pools on deterministic replay without granting rewards', () => {
    arrange(allocations); start();
    const baseline = structuredClone(currentHero()), before = recording();
    expect(baseline.life).toBe(baseline.stats.lifeMax); // Real fresh-encounter entry policy.
    expect(resetSkillsForCompositionTest()).toBe('ok');
    expect(recording()).toEqual(before);
    const plain = playerToCombatUnit(player());
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(currentHero().stats).toEqual(plain.stats);
    expect(currentHero().life).toBe(plain.stats.lifeMax);
    expect(currentHero().mana).toBe(baseline.mana);
    expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
    const first = recording();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(first);
  });

  it('enforces ordinary prerequisite, unlock, point and cap failures atomically', () => {
    arrange({});
    for (const id of ['barbarian.increased_speed', 'barbarian.natural_resistance']) {
      const before = structuredClone(player());
      expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('prereq-missing');
      expect(player()).toEqual(before);
    }
    usePlayerStore.setState({ player: { ...player(), level: 11 } });
    expect(usePlayerStore.getState().allocateSkillPoint('barbarian.increased_stamina')).toBe('level-too-low');
    usePlayerStore.setState({ player: { ...player(), level: 30,
      skillLevels: { ...allocations, 'barbarian.increased_speed': 20 } } });
    expect(usePlayerStore.getState().allocateSkillPoint('barbarian.increased_speed')).toBe('maxed');
    usePlayerStore.setState({ player: { ...player(), skillPoints: 0 } });
    expect(usePlayerStore.getState().allocateSkillPoint('barbarian.increased_stamina')).toBe('no-points');
  });

  it('roundtrips validated serialization/import and recomposes once from persisted allocations', async () => {
    arrange(allocations);
    const expected = playerToCombatUnit(player());
    const save = snapshotStores(); if (!save) throw new Error('Missing snapshot');
    const persisted = structuredClone(save.player);
    expect(persisted.derivedStats.lifeMax).toBeLessThan(expected.stats.lifeMax);
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(player()).toEqual(persisted);
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
  });
});

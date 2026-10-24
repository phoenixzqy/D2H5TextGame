import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
// Only disk I/O is faked; real store allocation, equipment, serialization/import and waves run.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, playerToCombatUnit,
  refreshActivePlayerCombatConfig, resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const AUTHORED = 'skills-barbarian-iron-skin';
const CANONICAL = 'barbarian.iron_skin';
const FINISHER = 'fixture.iron-native-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing Iron Skin native fixture player');
  return current;
}
/** Synthetic configuration/resource projection retains the run; not public hero replacement. */
function configure(fields: Partial<Player>): void {
  usePlayerStore.setState({ player: { ...player(), ...fields } });
}
/** ImportedL18/points/gear and registered finisher are scaffolding, not earned progression. */
function arrange(ranks: NonNullable<Player['skillLevels']> = {}): Item {
  const fresh = createMockPlayer('IronNative', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 18, skillPoints: 2,
    skillLevels: ranks, comboOrder: [FINISHER] });
  // L18 naked defense71, cap7, flat99922 =>100000 before Iron Skin.
  // L18 life286/mana133 plus flat modifiers =>1000000/1000 maxima.
  const cap: Item = { id: 'fixture-iron-native-cap', baseId: 'items/base/helm-cap', socketCapacity: 0, rarity: 'rare',
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 999714], ['statMods.mana', 867], ['statMods.defense', 99922]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  configure({ derivedStats: { ...player().derivedStats, life: 900000, mana: 300 } });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  return cap;
}
function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    rewards: s.runRewards, cursor: s.eventCursor, complete: s.playbackComplete, paused: s.isPaused });
}
function currentHero() {
  const hero = useCombatStore.getState().playerTeam[0];
  if (!hero) throw new Error('Missing native wave input');
  return hero;
}
function finalHero() {
  const hero = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!hero) throw new Error('Missing native wave outcome');
  return hero;
}
const pools = (hero: ReturnType<typeof currentHero>) => [hero.life, hero.mana,
  hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
beforeEach(() => {
  mockSyntheticEntryPools(); reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });

describe('P07a04C native Iron Skin wave/replay/save boundaries', () => {
  it('applies real allocate/upgrade on next waves without rewriting recording or resource carry', () => {
    arrange(); start();
    expect(currentHero().stats.defense).toBe(100000);
    expect(pools(currentHero())).toEqual([900000, 300, 0, 0, '0']);
    const first = recording(), firstFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(player().skillLevels).toEqual({ [CANONICAL]: 1 });
    expect(player().skillPoints).toBe(1); expect(recording()).toEqual(first);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().stats.defense).toBe(104000);
    expect(pools(currentHero())).toEqual(pools(firstFinal));
    const second = recording(), secondFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(CANONICAL)).toBe('ok');
    expect(player().skillLevels).toEqual({ [CANONICAL]: 2 });
    expect(player().skillPoints).toBe(0); expect(recording()).toEqual(second);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().stats.defense).toBe(108000);
    expect(pools(currentHero())).toEqual(pools(secondFinal));
    expect(player().derivedStats.defense).toBe(100000);
    expect(firstFinal).toEqual(first.outcome?.finalPlayerTeam[0]);
  });

  it('rejects real allocation at17 and suppresses imported ranks below18 or on another class', () => {
    arrange({ [AUTHORED]: 20 }); configure({ level: 17 });
    expect(usePlayerStore.getState().allocateSkillPoint(CANONICAL)).toBe('level-too-low');
    expect(playerToCombatUnit(player()).stats.defense).toBe(99997);
    configure({ level: 18 }); expect(playerToCombatUnit(player()).stats.defense).toBe(180000);
    configure({ class: 'amazon' }); expect(playerToCombatUnit(player()).stats.defense).toBe(100000);
  });

  it('constructs a free reset input and removes Iron Skin next wave without refilling current pools', () => {
    arrange({ [CANONICAL]: 2 }); start();
    const before = recording(), final = structuredClone(finalHero());
    expect(resetSkillsForCompositionTest()).toBe('ok');
    expect(player().skillPoints).toBe(4); expect(player().skillLevels).toEqual({});
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().stats.defense).toBe(100000);
    expect(pools(currentHero())).toEqual(pools(final));
    expect(currentHero().manaRegenPerSecond).toBe(2);
  });

  it('takes ordinary equipment changes next wave and clamps to fresh maxima without rewriting the current record', () => {
    arrange({ [CANONICAL]: 20 }); start();
    const before = recording();
    expect(currentHero().stats.defense).toBe(180000);
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().stats.defense).toBeCloseTo(127.8, 12);
    expect(pools(currentHero())).toEqual([286, 133, 0, 0, '0']);
    expect(player().derivedStats.defense).toBe(71);
  });

  it('replays fresh ranks/gear over original pools and all carry baselines after clamp and restore', () => {
    const cap = arrange({ [CANONICAL]: 20 }); start(); drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const before = recording(), baseline = structuredClone(currentHero());
    const progress = structuredClone({ experience: player().experience,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards });
    expect(baseline.stats.defense).toBe(180000);
    expect(baseline.mana).toBeGreaterThan(133); expect(baseline.life).toBeGreaterThan(286);
    expect(baseline.manaRegenCarry).toBeGreaterThan(0);
    expect(baseline.manaRegenExactCarry).not.toBe('0');
    // Starting300 + at most8 MP orbs*50 + all60s recovery*2 <=820, before cast costs.
    // Positive seed7 carry remains an observed fixture guard, not a claimed campaign property.
    // Gear changes clamp authoritative pools; only these two fresh stat mirrors follow them.
    const expectedWithFreshMirrors = (life: number, mana: number) => {
      const mirror = (unit: typeof baseline) => unit.id === baseline.id
        ? { ...unit, stats: { ...unit.stats, life, mana } } : unit;
      return { ...before, team: before.team.map(mirror),
        outcome: before.outcome ? { ...before.outcome,
          finalPlayerTeam: before.outcome.finalPlayerTeam.map(mirror) } : before.outcome };
    };
    for (let repeat = 0; repeat < 2; repeat++) {
      configure({ skillLevels: {} }); refreshActivePlayerCombatConfig();
      expect(recording()).toEqual(repeat === 0 ? before : expectedWithFreshMirrors(286, 133));
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(currentHero().stats.defense).toBe(100000);
      expect(pools(currentHero())).toEqual(pools(baseline)); drain();
      configure({ skillLevels: { [CANONICAL]: 20 } });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(recording()).toEqual(repeat === 0 ? before : expectedWithFreshMirrors(286, 133));
      configure({ skillLevels: {} });
      expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(currentHero().stats.defense).toBe(71);
      expect(pools(currentHero())).toEqual([286, 133, 0, 0, '0']); drain();
      expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
      configure({ skillLevels: { [CANONICAL]: 20 } });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect([currentHero().stats.life, currentHero().stats.mana]).toEqual([286, 133]);
      expect([finalHero().stats.life, finalHero().stats.mana]).toEqual([286, 133]);
      expect(recording()).toEqual(expectedWithFreshMirrors(286, 133));
      expect(pools(currentHero())).toEqual(pools(baseline));
    }
    expect({ experience: player().experience, currencies: useInventoryStore.getState().currencies,
      rewards: useCombatStore.getState().runRewards }).toEqual(progress);
  });

  it('roundtrips real serialization/validated import with only allocated ranks persisted', async () => {
    arrange({ [CANONICAL]: 20 }); start();
    const save = snapshotStores(); if (!save) throw new Error('Missing native save snapshot');
    const before = structuredClone(save.player);
    expect(save.player.derivedStats.defense).toBe(100000);
    for (const key of ['ironSkin', 'manaRegenPerSecond', 'manaRegenCarry', 'manaRegenCompensation',
      'manaRegenExactCarry', 'frozenArmor', 'activeBuffIds', 'increasedDamagePct']) {
      expect(save.player).not.toHaveProperty(key);
    }
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(hasActiveSubAreaRun()).toBe(false); expect(useCombatStore.getState().playerTeam).toEqual([]);
    expect(player()).toEqual(before);
    const fresh = playerToCombatUnit(player());
    expect(fresh.stats.defense).toBe(180000); expect(player().derivedStats.defense).toBe(100000);
    expect(pools(fresh).slice(2)).toEqual([0, 0, '0']); expect(fresh.activeBuffIds).toEqual([]);
    // Browser disk/reload acceptance remains separate from this mocked disk boundary.
  });
});

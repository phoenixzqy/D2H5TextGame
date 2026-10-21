import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Only disk I/O is mocked. Imported L24, ranks, gear and finisher are scaffolding.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as combatEngine from '@/engine/combat/combat';
import type { CombatSnapshot } from '@/engine/combat/combat';
import { composeSkeletonMastery } from '@/engine/skills/skeleton-mastery';
import { getSkillsForClass } from './skillsHelpers';
import { toJsonSafe } from '@/engine/save';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, playerToCombatUnit, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
const AUTHORED = 'skills-necromancer-skeleton-mastery';
const CANONICAL = 'necromancer.skeleton_mastery';
const ACTIVE = 'necromancer.raise_skeleton';
const FINISHER = 'fixture.skeleton-native-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing Skeleton Mastery native fixture player');
  return current;
}
function configure(fields: Partial<Player>): void {
  usePlayerStore.getState().setPlayer({ ...player(), ...fields });
}
function arrange(rank = 20): Item {
  const fresh = createMockPlayer('SkeletonNative', 'necromancer');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 24, skillPoints: 2,
    skillLevels: { [ACTIVE]: 6, ...(rank > 0 ? { [CANONICAL]: rank } : {}) },
    comboOrder: [ACTIVE, FINISHER] });
  // Necromancer L24: life314/mana179/defense89. Cap base defense7.
  const cap: Item = { id: 'fixture-skeleton-native-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 999686], ['statMods.mana', 821], ['statMods.defense', 99904]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  configure({ derivedStats: { ...player().derivedStats, life: 900000, mana: 300 } });
  const converted = playerToCombatUnit(player());
  expect([converted.stats.lifeMax, converted.stats.manaMax, converted.stats.defense]).toEqual([1000000, 1000, 100000]);
  expect(converted.manaRegenPerSecond).toBe(5);
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

function expectFreshSummons(life: number, attack: number, defense: number): void {
  expect(useCombatStore.getState().playerTeam.filter(u => u.kind === 'summon' || u.summon)).toEqual([]);
  const created = useCombatStore.getState().recordedEvents.filter(e => e.kind === 'summon');
  expect(created.length).toBeGreaterThan(0);
  for (const event of created) {
    expect(event.summonId).toBe('skeleton');
    expect.soft(event.unit.life).toBeCloseTo(life, 12);
    expect.soft(event.unit.stats.life).toBeCloseTo(life, 12);
    expect.soft(event.unit.stats.lifeMax).toBeCloseTo(life, 12);
    expect.soft(event.unit.stats.attack).toBeCloseTo(attack, 12);
    expect.soft(event.unit.stats.defense).toBeCloseTo(defense, 12);
  }
}
function setMastery(rank: number): void {
  configure({ skillLevels: { [ACTIVE]: 6, ...(rank > 0 ? { [CANONICAL]: rank } : {}) } });
}
describe('P07a05C native Skeleton Mastery wave/replay/save boundaries', () => {
beforeEach(() => { reset(); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks(); });
  it('allocates and upgrades through real actions for fresh next-wave summons without changing current recordings or resource carry', () => {
    arrange(0); start();
    expectFreshSummons(162, 35, 19);
    expect(pools(currentHero())).toEqual([900000, 300, 0, 0, '0']);
    const first = recording(), firstFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(player().skillLevels).toEqual({ [ACTIVE]: 6, [CANONICAL]: 1 });
    expect(player().skillPoints).toBe(1); refreshActivePlayerCombatConfig();
    expect(recording()).toEqual(first);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expectFreshSummons(168.48, 35.7, 19.19);
    expect(pools(currentHero())).toEqual(pools(firstFinal));
    const second = recording(), secondFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint(CANONICAL)).toBe('ok');
    expect(player().skillLevels).toEqual({ [ACTIVE]: 6, [CANONICAL]: 2 });
    expect(player().skillPoints).toBe(0); refreshActivePlayerCombatConfig();
    expect(recording()).toEqual(second);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expectFreshSummons(174.96, 36.4, 19.38);
    expect(pools(currentHero())).toEqual(pools(secondFinal));
    expect(currentHero().stats.defense).toBe(100000);
    expect(player().derivedStats.defense).toBe(100000);
  });

  it('allows native allocation at the authored level-one unlock without adding a passive combo entry', () => {
    const fresh = createMockPlayer('SkeletonUnlock', 'necromancer');
    usePlayerStore.getState().setPlayer(fresh);
    expect(fresh.level).toBe(1);
    expect(usePlayerStore.getState().allocateSkillPoint(AUTHORED)).toBe('ok');
    expect(player().skillLevels).toEqual({ [ACTIVE]: 1, [CANONICAL]: 1 });
    expect(player().skillPoints).toBe(0);
    expect(player().comboOrder).toEqual([ACTIVE]);
  });

  it('pays real respec and removes both Mastery and active ranks next wave without refilling current pools', () => {
    arrange(2); start(); expectFreshSummons(174.96, 36.4, 19.38);
    const before = recording(), final = structuredClone(finalHero());
    useInventoryStore.getState().addCurrency('gold', 26000);
    expect(usePlayerStore.getState().respec({
      getGold: () => useInventoryStore.getState().currencies.gold ?? 0,
      spendGold: cost => useInventoryStore.getState().spendCurrency('gold', cost)
    })).toBe('ok');
    expect(useInventoryStore.getState().currencies.gold).toBe(2000);
    expect(player().skillPoints).toBe(10); expect(player().skillLevels).toEqual({});
    refreshActivePlayerCombatConfig(); expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    // Respec also removed Raise Skeleton6. Existing unallocated-active fallback is rank1.
    expectFreshSummons(112, 25, 14);
    expect(pools(currentHero())).toEqual(pools(final));
    expect(currentHero().manaRegenPerSecond).toBe(5);
  });

  it('uses equipment changes next wave and clamps only hero pools while preserving Mastery creation potency', () => {
    arrange(); start(); const before = recording();
    expectFreshSummons(291.6, 49, 22.8);
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    refreshActivePlayerCombatConfig(); expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expectFreshSummons(291.6, 49, 22.8);
    expect([currentHero().stats.lifeMax, currentHero().stats.manaMax, currentHero().stats.defense]).toEqual([314, 179, 89]);
    expect(pools(currentHero())).toEqual([314, 179, 0, 0, '0']);
    expect(player().derivedStats.defense).toBe(89);
  });

  it('replays changed Mastery and gear over original hero pools and all three carry baselines without drift or duplicate rewards', () => {
    const cap = arrange(); start(); drain();
    expect(advanceWaveOrFinish()).toBe('next-wave'); drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const before = recording(), baseline = structuredClone(currentHero());
    const progress = structuredClone({ experience: player().experience,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards });
    expectFreshSummons(291.6, 49, 22.8);
    // Approved two-wave capture: second final feeds this third-wave original baseline.
    // Compensation legitimately stays zero; both fractional carry representations are nonzero.
    expect(pools(baseline)).toEqual([1000000, 752, .5, 0, '0.5']);
    expect(baseline.manaRegenCarry).toBeGreaterThan(0);
    expect(baseline.manaRegenExactCarry).not.toBe('0');
    const expectedWithFreshMirrors = (life: number, mana: number) => {
      const mirror = (unit: typeof baseline) => unit.id === baseline.id
        ? { ...unit, stats: { ...unit.stats, life, mana } } : unit;
      return { ...before, team: before.team.map(mirror),
        outcome: before.outcome ? { ...before.outcome,
          finalPlayerTeam: before.outcome.finalPlayerTeam.map(mirror) } : before.outcome };
    };
    for (let repeat = 0; repeat < 2; repeat++) {
      setMastery(0); refreshActivePlayerCombatConfig();
      expect(recording()).toEqual(repeat === 0 ? before : expectedWithFreshMirrors(314, 179));
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expectFreshSummons(162, 35, 19); expect(pools(currentHero())).toEqual(pools(baseline)); drain();
      setMastery(20); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expectFreshSummons(291.6, 49, 22.8);
      expect(recording()).toEqual(repeat === 0 ? before : expectedWithFreshMirrors(314, 179));
      setMastery(0); expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expectFreshSummons(162, 35, 19); expect(currentHero().stats.defense).toBe(89);
      expect(pools(currentHero())).toEqual([314, 179, 0, 0, '0']); drain();
      expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
      setMastery(20); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expectFreshSummons(291.6, 49, 22.8);
      expect(recording()).toEqual(expectedWithFreshMirrors(314, 179));
      expect(pools(currentHero())).toEqual(pools(baseline));
    }
    expect({ experience: player().experience, currencies: useInventoryStore.getState().currencies,
      rewards: useCombatStore.getState().runRewards }).toEqual(progress);
  });

  it('roundtrips real serialization and validated import with allocations and equipment but no transient projection or summons', async () => {
    arrange(); start(); expectFreshSummons(291.6, 49, 22.8);
    const save = snapshotStores(); if (!save) throw new Error('Missing native save snapshot');
    const before = structuredClone(save.player), gear = structuredClone(save.inventory);
    expect(save.player.skillLevels).toEqual({ [ACTIVE]: 6, [CANONICAL]: 20 });
    expect(save.player.skillPoints).toBe(2); expect(save.player.derivedStats.defense).toBe(100000);
    for (const key of ['skeletonMastery', 'summonOwnerId', 'summonTemplateId', 'manaRegenPerSecond',
      'manaRegenCarry', 'manaRegenCompensation', 'manaRegenExactCarry', 'activeBuffIds']) {
      expect(save.player).not.toHaveProperty(key);
    }
    expect(save).not.toHaveProperty('combat'); expect(save).not.toHaveProperty('skeletonMastery');
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(hasActiveSubAreaRun()).toBe(false); expect(useCombatStore.getState().playerTeam).toEqual([]);
    expect(player()).toEqual(before); expect(snapshotStores()?.inventory).toEqual(gear);
    const fresh = playerToCombatUnit(player());
    expect(pools(fresh).slice(2)).toEqual([0, 0, '0']); expect(fresh.activeBuffIds).toEqual([]);
    expect(player()).not.toHaveProperty('skeletonMastery');
    start(); expectFreshSummons(291.6, 49, 22.8);
    expect(currentHero().stats.defense).toBe(100000); expect(player().derivedStats.defense).toBe(100000);
    // Browser disk/reload and earned campaign acceptance remain separate.
  });
});

interface ProjectedSnapshot extends CombatSnapshot {
  readonly skeletonMastery?: NonNullable<ReturnType<typeof composeSkeletonMastery>>;
}
function compositionPlayer(patch: Partial<Player> = {}): Player {
  return { ...createMockPlayer('SkeletonBoundary', 'necromancer'), id: 'hero', level: 24,
    comboOrder: [], skillLevels: { [CANONICAL]: 1 }, ...patch };
}
function resetComposition(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
describe('P07a05B actual native store wave wiring', () => {
  beforeEach(resetComposition);
  afterEach(() => { resetComposition(); vi.restoreAllMocks(); });
  it.each(['necromancer', 'sorceress'] as const)('passes authoritative eligibility for%s into real combat', classId => {
    const snapshots: ProjectedSnapshot[] = [];
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      snapshots.push(input); return original(input);
    });
    // Imported L24/gear and registered finisher are explicit integration scaffolding, not earned progress.
    const hero = compositionPlayer({ class: classId, comboOrder: ['necromancer.raise_skeleton', 'fixture.mastery-finisher'],
      skillLevels: { [CANONICAL]: 1, 'necromancer.raise_skeleton': 6 } });
    usePlayerStore.getState().setPlayer(hero);
    const cap: Item = { id: 'fixture-skeleton-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
        values: new Map([['statMods.life', 100000], ['statMods.defense', 10000], ['statMods.mana', 100]]) }] };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
    const configured = usePlayerStore.getState().player;
    if (!configured) throw new Error('Missing configured hero');
    usePlayerStore.getState().setPlayer({ ...configured,
      derivedStats: { ...configured.derivedStats, life: 10000, mana: 100 } });
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    registerSkill({ id: 'fixture.mastery-finisher', archetype: 'fixture', target: 'all-enemies',
      minLevel: 1, cooldown: 100, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [1000000, 1000000] }] });
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
    const input = snapshots[0]; if (!input) throw new Error('Missing actual native input');
    const eligible = classId === 'necromancer';
    expect(input.skeletonMastery).toEqual(eligible ? composeSkeletonMastery(hero) : undefined);
    if (eligible) expect(Object.isFrozen(input.skeletonMastery)).toBe(true);
    const spawned = useCombatStore.getState().recordedEvents.find(e => e.kind === 'summon');
    if (spawned?.kind !== 'summon') throw new Error('Missing native summon event');
    expect(spawned.unit.stats.lifeMax).toBeCloseTo(eligible ? 168.48 : 162, 12);
    expect(spawned.unit.stats.attack).toBeCloseTo(eligible ? 35.7 : 35, 12);
    expect(spawned.unit.stats.defense).toBeCloseTo(eligible ? 19.19 : 19, 12);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const { skeletonMastery: _projection, ...none } = input;
    const unboosted = original(none).events.find(e => e.kind === 'summon');
    if (unboosted?.kind !== 'summon') throw new Error('Missing actual unprojected control summon');
    expect(unboosted.unit.stats.lifeMax).toBe(162);
    expect(input.playerTeam.find(u => u.id === hero.id)).not.toHaveProperty('skeletonMastery');
    expect(usePlayerStore.getState().player).not.toHaveProperty('skeletonMastery');
    // This bounded pair proves wiring; next-wave/respec/replay/carry/save belong Stage C.
  });
});

describe('D06 corpse-summon adapter boundary before policy switch', () => {
  function eligible(cls: 'druid' | 'necromancer', name: string): Player {
    const canonical = `${cls}.${name}`;
    const fresh = createMockPlayer('ImportedPreparation', cls);
    const prerequisites = Object.fromEntries(getSkillsForClass(cls).map(skill => [skill.id, 1]));
    return { ...fresh, level: 30, comboOrder: [canonical],
      skillLevels: { ...prerequisites, [canonical]: 2 } };
  }
  beforeEach(() => {
    useInventoryStore.getState().reset();
    useFormationStore.getState().reset();
  });
  afterEach(() => {
    useInventoryStore.getState().reset();
    useFormationStore.getState().reset();
  });
  it('excludes scoped foreign-class skills while preserving every unrelated/excluded slot and rank', () => {
    const p = eligible('druid', 'raven');
    const skillLevels = { ...p.skillLevels, 'amazon.valkyrie': 20,
      'necromancer.raise_skeleton': 12, 'necromancer.iron_golem': 1, 'fixture.summon': 7 };
    const order = ['amazon.valkyrie', 'skills-amazon-valkyrie', 'necromancer.raise_skeleton',
      'skills-necromancer-raise-skeletal-mage', 'necromancer.revive', 'necromancer.iron_golem',
      'fixture.summon', 'druid.firestorm'];
    const before = structuredClone({ ...p, skillLevels, comboOrder: order });
    const result = playerToCombatUnit(before);
    expect(result.skillOrder).toEqual(order.slice(2));
    expect(result.skillLevels).toEqual(skillLevels);
    expect(before.skillLevels).toEqual(skillLevels);
    expect(before.comboOrder).toEqual(order);
  });

  it('keeps generic unrelated and excluded production behavior when the allocation map is absent', () => {
    const { skillLevels: _levels, ...rest } = eligible('necromancer', 'clay_golem');
    const result = playerToCombatUnit({ ...rest, comboOrder: ['necromancer.clay_golem',
      'necromancer.raise_skeleton', 'fixture.unrelated'] });
    expect(result.skillOrder).toEqual(['necromancer.raise_skeleton', 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({});
  });
});

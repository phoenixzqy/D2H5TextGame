import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as combatEngine from '@/engine/combat/combat';
import type { CombatSnapshot } from '@/engine/combat/combat';
import { composeSkeletonMastery, empowerSkeletonSummon, SKELETON_MASTERY_DEFINITION } from '@/engine/skills/skeleton-mastery';
import { buildSummon } from '@/engine/skills/summons';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit, resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const AUTHORED = 'skills-necromancer-skeleton-mastery'; const CANONICAL = 'necromancer.skeleton_mastery';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function player(patch: Partial<Player> = {}): Player {
  return { ...createMockPlayer('SkeletonBoundary', 'necromancer'), id: 'hero', level: 24,
    comboOrder: [], skillLevels: { [CANONICAL]: 1 }, ...patch };
}
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
beforeEach(reset);
afterEach(() => { reset(); vi.restoreAllMocks(); });

describe('P07a05B authoritative Skeleton Mastery composition', () => {
  it.each([AUTHORED, CANONICAL])('copies allocated%s at ranks1/20 and cap', alias => {
    for (const [rank, effective] of [[1, 1], [20, 20], [99, 20]] as const) {
      expect(composeSkeletonMastery(player({ skillLevels: { [alias]: rank } }))).toEqual({
        sourceHeroId: 'hero', rank: effective, maxRank: 20, summonLifePct: effective * .04,
        summonAttackPct: effective * .02, summonDefensePct: effective * .01 });
    }
  });
  it('uses both aliases MAX once, never their sum or order', () => {
    for (const skillLevels of [{ [AUTHORED]: 2, [CANONICAL]: 20 },
      { [CANONICAL]: 2, [AUTHORED]: 20 }, { [AUTHORED]: 20, [CANONICAL]: 20 }]) {
      expect(composeSkeletonMastery(player({ skillLevels }))?.rank).toBe(20);
    }
  });
  it.each(['sorceress', 'paladin', 'amazon', 'barbarian', 'druid', 'assassin'] as const)(
    'never grants imported Mastery to%s', classId => {
      expect(composeSkeletonMastery(player({ class: classId }))).toBeUndefined();
    });
  it.each([0, -1, NaN, Infinity, -Infinity])('rejects ineligible character level%s', level => {
    expect(composeSkeletonMastery(player({ level }))).toBeUndefined();
  });
  it('uses copied unlock including finite boundary values without inventing integer character levels', () => {
    const definition = { ...SKELETON_MASTERY_DEFINITION, requiredLevel: 9 };
    expect(composeSkeletonMastery(player({ level: 8 }), definition)).toBeUndefined();
    expect(composeSkeletonMastery(player({ level: 9 }), definition)?.rank).toBe(1);
    expect(composeSkeletonMastery(player({ level: 9.5 }), definition)?.rank).toBe(1);
    expect(composeSkeletonMastery(player({ level: 1 }))?.rank).toBe(1);
  });
  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true])(
    'ignores invalid allocation%s while retaining the valid other alias', invalid => {
      const skillLevels = { [AUTHORED]: invalid } as unknown as NonNullable<Player['skillLevels']>;
      expect(composeSkeletonMastery(player({ skillLevels }))).toBeUndefined();
      expect(composeSkeletonMastery(player({ skillLevels: { ...skillLevels, [CANONICAL]: 3 } }))?.rank).toBe(3);
    });
  it('does not infer allocation from combo, legacy skill or similar identities', () => {
    expect(composeSkeletonMastery(player({ skillLevels: {}, comboOrder: [CANONICAL] }))).toBeUndefined();
    expect(composeSkeletonMastery(player({ skillLevels: { 'necromancer.skeleton-mastery': 20 } }))).toBeUndefined();
  });
  it('copies distinct alternate tuning and zero without freezing/retaining caller references', () => {
    const hero = { id: 'hero', class: 'necromancer', level: 24, skillLevels: { [CANONICAL]: 2 } };
    const definition = { requiredLevel: 9, maxRank: 31,
      summonLifePctPerRank: .125, summonAttackPctPerRank: .375, summonDefensePctPerRank: .625 };
    const before = structuredClone({ hero, definition });
    const result = composeSkeletonMastery(hero, definition);
    expect(result).toEqual({ sourceHeroId: 'hero', rank: 2, maxRank: 31,
      summonLifePct: .25, summonAttackPct: .75, summonDefensePct: 1.25 });
    expect(Object.isFrozen(result)).toBe(true);
    expect({ hero, definition }).toEqual(before);
    expect(Object.isFrozen(hero)).toBe(false); expect(Object.isFrozen(hero.skillLevels)).toBe(false);
    expect(Object.isFrozen(definition)).toBe(false);
    hero.skillLevels[CANONICAL] = 20; hero.id = 'other'; definition.summonLifePctPerRank = 9;
    expect(result).toEqual({ sourceHeroId: 'hero', rank: 2, maxRank: 31,
      summonLifePct: .25, summonAttackPct: .75, summonDefensePct: 1.25 });
    if (!result) throw new Error('Expected eligible mastery projection');
    expect(Reflect.set(result, 'summonAttackPct', 99)).toBe(false);
    expect(composeSkeletonMastery(player(), { ...definition,
      summonLifePctPerRank: 0, summonAttackPctPerRank: 0, summonDefensePctPerRank: 0 }))
      .toMatchObject({ summonLifePct: 0, summonAttackPct: 0, summonDefensePct: 0 });
  });
});

function fresh() {
  const owner = playerToCombatUnit(player());
  const summon = buildSummon(owner, 'skeleton', { skillLevel: 6,
    statScaling: { lifeMax: 10, attack: 2, defense: 1 } });
  if (!summon) throw new Error('Missing fresh skeleton');
  const projection = composeSkeletonMastery(player());
  if (!projection) throw new Error('Missing eligible projection');
  return { owner, summon, projection };
}
describe('P07a05B narrow fresh-summon decorator boundary', () => {
  it('multiplies all three distinct values once while preserving every other field and input', () => {
    const { owner, summon } = fresh();
    const projection = composeSkeletonMastery(player({ skillLevels: { [CANONICAL]: 2 } }), {
      requiredLevel: 1, maxRank: 31, summonLifePctPerRank: .125,
      summonAttackPctPerRank: .375, summonDefensePctPerRank: .625 });
    const before = structuredClone({ owner, summon, projection });
    const actual = empowerSkeletonSummon(projection, owner, summon);
    expect([actual.life, actual.stats.life, actual.stats.lifeMax, actual.stats.attack, actual.stats.defense])
      .toEqual([202.5, 202.5, 202.5, 61.25, 42.75]);
    expect({ ...actual, life: summon.life, stats: { ...actual.stats, life: summon.stats.life,
      lifeMax: summon.stats.lifeMax, attack: summon.stats.attack, defense: summon.stats.defense } }).toEqual(summon);
    expect({ owner, summon, projection }).toEqual(before);
  });
  it.each([
    { id: 'other' }, { side: 'enemy' as const }, { kind: 'merc' as const }, { kind: 'summon' as const },
    { life: 0 }, { life: -1 }, { life: NaN }, { life: Infinity }, { life: -Infinity },
    { summon: true }, { ownerId: '' }, { ownerId: 'other' }, { summonOwnerId: '' }, { summonOwnerId: 'other' }
  ])('rejects ineligible current owner%j without modifying the fresh summon', fields => {
    const { owner, summon, projection } = fresh();
    expect(empowerSkeletonSummon(projection, { ...owner, ...fields }, summon)).toBe(summon);
  });
  it.each([
    { side: 'enemy' as const }, { kind: 'hero' as const }, { summon: false },
    { summonOwnerId: '' }, { summonOwnerId: 'other' }, { ownerId: '' }, { ownerId: 'other' },
    { summonTemplateId: 'Skeleton' }, { summonTemplateId: 'skeletal-mage' }, { summonTemplateId: 'revived' }
  ])('rejects inconsistent normalized fresh summon%j', fields => {
    const { owner, summon, projection } = fresh();
    expect(empowerSkeletonSummon(projection, owner, { ...summon, ...fields })).toEqual({ ...summon, ...fields });
  });
  it('accepts consistent legacy owner evidence but never affects a nonrecipient', () => {
    const { owner, summon, projection } = fresh();
    expect(empowerSkeletonSummon(projection, owner, { ...summon, ownerId: owner.id }).stats.lifeMax)
      .toBeCloseTo(168.48, 12);
    for (const template of ['revived', 'clay_golem', 'blood_golem', 'iron_golem', 'fire_golem',
      'valkyrie', 'raven', 'spirit_wolf', 'dire_wolf', 'grizzly', 'poison_creeper',
      'carrion_vine', 'solar_creeper', 'shadow_warrior', 'shadow_master']) {
      const other = buildSummon(owner, template);
      if (!other) throw new Error('Missing other template');
      expect(empowerSkeletonSummon(projection, owner, other)).toBe(other);
    }
    expect(empowerSkeletonSummon(undefined, owner, summon)).toBe(summon);
  });
});

interface ProjectedSnapshot extends CombatSnapshot {
  readonly skeletonMastery?: NonNullable<ReturnType<typeof composeSkeletonMastery>>;
}
describe('P07a05B actual native store wave wiring', () => {
  it.each(['necromancer', 'sorceress'] as const)('passes authoritative eligibility for%s into real combat', classId => {
    const snapshots: ProjectedSnapshot[] = [];
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      snapshots.push(input); return original(input);
    });
    // Imported L24/gear and registered finisher are explicit integration scaffolding, not earned progress.
    const hero = player({ class: classId, comboOrder: ['necromancer.raise_skeleton', 'fixture.mastery-finisher'],
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

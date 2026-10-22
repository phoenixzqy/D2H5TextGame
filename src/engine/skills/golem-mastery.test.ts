import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '../combat/combat';
import type { CombatUnit } from '../combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from './registry';
import necromancerSkills from '../../data/skills/necromancer.json';
import { composeGolemMastery, empowerGolemSummon, GOLEM_MASTERY_DEFINITION, resolveGolemMasteryDefinition,
  resolveGolemMasteryRank } from './golem-mastery';
import { buildSummon, getSummon, registerSummon } from './summons';

const AUTHORED = 'skills-necromancer-golem-mastery', CANONICAL = 'necromancer.golem_mastery';
const CLAY = 'necromancer.clay_golem';
const player = () => ({ id: 'hero', class: 'necromancer', level: 12,
  skillLevels: { [CANONICAL]: 1, [CLAY]: 1 } });
function authored() {
  const row = necromancerSkills.find(row => row.id === AUTHORED);
  if (!row) throw new Error('Missing authored Mastery');
  return structuredClone(row);
}

describe('Golem Mastery authoritative immutable tuning and allocation', () => {
  it('copies JSON primitives without retaining or freezing caller input', () => {
    const row = authored(), clay = necromancerSkills.find(row => row.id === 'skills-necromancer-clay-golem');
    const rows = [row, clay], before = structuredClone(rows);
    const definition = resolveGolemMasteryDefinition(rows);
    expect(definition).toEqual({ requiredLevel: 12, maxRank: 20, clayMaxRank: 20,
      golemLifePctPerRank: .06, golemAttackSpeedPerRank: 1 });
    expect(definition).toEqual(GOLEM_MASTERY_DEFINITION);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(rows).toEqual(before); expect(Object.isFrozen(row)).toBe(false);
    row.requiredLevel = 99;
    expect(definition.requiredLevel).toBe(12);
  });
  it.each([
    { requiredLevel: 0 }, { requiredLevel: 1.5 }, { maxLevel: Infinity }, { maxLevel: -1 },
    { prerequisites: [] }, { prerequisites: ['skills-necromancer-blood-golem'] },
    { passive: false }, { trigger: 'active' }, { target: 'single-enemy' }, { cooldown: 1 },
    { cost: { mana: 0 } }, { scaling: {} },
    ...[-1, NaN, Infinity, '1', null].flatMap(value => [
      { scaling: { passiveStatsPerLevel: { golemLifePct: value, golemAttackSpeed: 1 } } },
      { scaling: { passiveStatsPerLevel: { golemLifePct: .06, golemAttackSpeed: value } } }
    ]),
    { scaling: { passiveStatsPerLevel: { golemLifePct: .06 } } },
    { scaling: { passiveStatsPerLevel: { golemLifePct: .06, golemAttackSpeed: 1, summonAttackPct: .5 } } }
  ])('rejects malformed authored semantics %j', fields => {
    expect(() => resolveGolemMasteryDefinition(necromancerSkills.map(row =>
      row.id === AUTHORED ? { ...row, ...fields } : row))).toThrow(/Golem Mastery/);
  });
  it('requires exactly one authored identity and its Clay prerequisite', () => {
    for (const rows of [[], [authored()], [...necromancerSkills, authored()],
      necromancerSkills.filter(row => row.id !== AUTHORED)]) {
      expect(() => resolveGolemMasteryDefinition(rows)).toThrow(/Golem Mastery/);
    }
  });
  it('uses distinct alternate JSON tuning including zero without inventing a balance ceiling', () => {
    const rows = necromancerSkills.map(row => row.id === AUTHORED ? { ...row, requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: { golemLifePct: .125, golemAttackSpeed: 2.5 } } } : row);
    const definition = resolveGolemMasteryDefinition(rows);
    expect(composeGolemMastery({ ...player(), skillLevels: { [CLAY]: 1, [CANONICAL]: 2 } }, definition))
      .toMatchObject({ rank: 2, maxRank: 31, golemLifePct: .25, golemAttackSpeed: 5 });
    expect(composeGolemMastery(player(), { ...definition, golemLifePctPerRank: 0, golemAttackSpeedPerRank: 0 }))
      .toMatchObject({ golemLifePct: 0, golemAttackSpeed: 0 });
  });
  it('resolves exact aliases by maximum once and clamps only Mastery', () => {
    expect(resolveGolemMasteryRank({ [AUTHORED]: 2, [CANONICAL]: 99 })).toBe(20);
    expect(resolveGolemMasteryRank({ [CANONICAL]: 2, [AUTHORED]: 20 })).toBe(20);
    expect(resolveGolemMasteryRank({ 'necromancer.golem-mastery': 20 })).toBe(0);
    expect(resolveGolemMasteryRank()).toBe(0);
    for (const invalid of [0, -1, 1.5, NaN, Infinity]) {
      expect(resolveGolemMasteryRank({ [AUTHORED]: invalid })).toBe(0);
      expect(resolveGolemMasteryRank({ [AUTHORED]: invalid, [CANONICAL]: 3 })).toBe(3);
    }
  });
  it('requires real class, integral unlock, allocated Mastery and exact allocated Clay prerequisite', () => {
    for (const patch of [{ class: 'druid' }, { level: 11 }, { level: 12.5 }, { level: Infinity },
      { skillLevels: { [CANONICAL]: 20 } }, { skillLevels: { [CANONICAL]: 20, [CLAY]: 99 } },
      { skillLevels: { [CANONICAL]: 20, [CLAY]: 1.5 } }, { skillLevels: { [CLAY]: 1 } }]) {
      expect(composeGolemMastery({ ...player(), ...patch })).toBeUndefined();
    }
    const hero = player(), before = structuredClone(hero);
    const projection = composeGolemMastery(hero);
    expect(projection).toEqual({ sourceHeroId: 'hero', rank: 1, maxRank: 20,
      golemLifePct: .06, golemAttackSpeed: 1 });
    expect(Object.isFrozen(projection)).toBe(true); expect(hero).toEqual(before);
    hero.skillLevels[CANONICAL] = 20; hero.id = 'other';
    expect(projection).toMatchObject({ sourceHeroId: 'hero', rank: 1, golemLifePct: .06 });
    expect(composeGolemMastery({ ...player(), skillLevels: {
      [AUTHORED]: 99, 'skills-necromancer-clay-golem': 1 } })?.rank).toBe(20);
  });
});

interface ProjectedSnapshot extends CombatSnapshot {
  readonly golemMastery?: { readonly sourceHeroId: string; readonly rank: number; readonly maxRank: number;
    readonly golemLifePct: number; readonly golemAttackSpeed: number };
}
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000000, mana: 1000, stats: { life: 1000000, lifeMax: 1000000, mana: 1000, manaMax: 1000,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function input(template: string, masteryRank: number, summonRank = 1): ProjectedSnapshot {
  const skill = 'necromancer.' + template;
  return { seed: 7, playerTeam: [{ ...unit('hero'), skillOrder: [skill],
    skillLevels: { [skill]: summonRank, 'necromancer.blood_golem': template === 'blood_golem' ? summonRank : 1 } }],
    enemyTeam: [unit('target', 'enemy')],
    ...(masteryRank ? { golemMastery: { sourceHeroId: 'hero', rank: masteryRank, maxRank: 20,
      golemLifePct: masteryRank * .06, golemAttackSpeed: masteryRank } } : {}),
    ...(template === 'iron_golem' ? { ironGolem: { sourceHeroId: 'hero', sourceItemId: 'selected',
      life: 0, attack: 0, defense: 0 } } : {}) };
}
function record(snapshot: ProjectedSnapshot) {
  const before = structuredClone(snapshot);
  const out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  return out;
}
function summons(out: ReturnType<typeof record>) {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> => e.kind === 'summon');
}
function first(out: ReturnType<typeof record>): CombatUnit {
  const value = summons(out)[0]?.unit;
  if (!value) throw new Error('Expected prepared golem');
  return value;
}
const clayFactory = getSummon('clay_golem');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => {
  if (clayFactory) registerSummon('clay_golem', clayFactory);
  resetRegistry(); loadDefaultSkills();
});

describe('Golem Mastery actual battle preparation', () => {
  it.each([
    ['clay_golem', 233.2, 484, 56, 75, 24, 34],
    ['blood_golem', 190.8, 396, 71, 90, 34, 24],
    ['iron_golem', 275.6, 572, 61, 80, 36, 48],
    ['fire_golem', 254.4, 528, 66, 85, 42, 36]
  ] as const)('empowers fresh rank1 %s at Mastery1/20 without Attack/Defense bonuses',
  (template, hp1, hp20, speed1, speed20, attack, defense) => {
    for (const [rank, hp, speed] of [[1, hp1, speed1], [20, hp20, speed20]] as const) {
      const out = record(input(template, rank));
      expect(summons(out)).toHaveLength(1);
      const summon = first(out);
      for (const value of [summon.life, summon.stats.life, summon.stats.lifeMax]) expect(value).toBeCloseTo(hp, 12);
      expect([summon.stats.attackSpeed, summon.stats.attack, summon.stats.defense]).toEqual([speed, attack, defense]);
      expect(summons(out)[0]?.simClockMs).toBe(0);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
      expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toHaveLength(1);
    }
  });
  it.each([
    ['clay_golem', 1, 2000], ['clay_golem', 7, 2000], ['clay_golem', 8, 1996], ['clay_golem', 20, 1900],
    ['blood_golem', 1, 1932], ['blood_golem', 20, 1780],
    ['iron_golem', 1, 2000], ['iron_golem', 3, 1996], ['iron_golem', 20, 1860],
    ['fire_golem', 1, 1972], ['fire_golem', 20, 1820]
  ] as const)('schedules actual %s Mastery%s actions every %sms', (template, mastery, period) => {
    const out = record(input(template, mastery)), id = first(out).id;
    const times = out.events.filter(e => e.kind === 'action' && e.actor === id).map(e => e.simClockMs);
    expect(times.length).toBeGreaterThan(3);
    expect(times.slice(0, 4)).toEqual([period, period * 2, period * 3, period * 4]);
  });
  it('applies rank6 scaling, then item inheritance, then Mastery, preserving item Attack/Defense', () => {
    for (const [mastery, hp] of [[1, 373.65], [20, 775.5]] as const) {
      const snapshot = input('iron_golem', mastery, 6);
      const out = record({ ...snapshot, ironGolem: { sourceHeroId: 'hero', sourceItemId: 'selected',
        life: 12.5, attack: 3.25, defense: 4.5 } });
      const summon = first(out);
      expect(summon.stats.lifeMax).toBeCloseTo(hp, 12);
      expect([summon.stats.attack, summon.stats.defense]).toEqual([49.25, 67.5]);
      expect(out.result.ironGolemPreparation).toEqual({ sourceHeroId: 'hero', sourceItemId: 'selected',
        skillId: 'necromancer.iron_golem', spawnedUnitId: summon.id, paidMp: 35 });
    }
  });
  it('preserves damaged full preloads without payment, replacement, retrofit or life refill', () => {
    const snapshot = input('clay_golem', 20), hero = snapshot.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const built = buildSummon(hero, 'clay_golem');
    if (!built) throw new Error('Missing template');
    const preload = { ...built, id: 'preloaded', life: 13, gridPosition: { row: 0, col: 1 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const out = record({ ...snapshot, playerTeam: [hero, preload] });
    expect(summons(out)).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === preload.id)).toEqual(preload);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
  it('does not grant a free golem on poor, no-item, or terminal startup and preserves ordinary payment', () => {
    const normal = input('clay_golem', 1);
    const { ironGolem: omitted, ...withoutIron } = input('iron_golem', 20);
    void omitted;
    for (const snapshot of [
      { ...normal, playerTeam: normal.playerTeam.map(u => ({ ...u, mana: 0 })) },
      { ...normal, enemyTeam: [] },
      { ...normal, playerTeam: normal.playerTeam.map(u => ({ ...u, life: 0 })) },
      withoutIron
    ]) {
      const out = record(snapshot);
      expect(summons(out)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    }
    const baseline = record(input('blood_golem', 0)), empowered = record(input('blood_golem', 20));
    const paid = (out: ReturnType<typeof record>) => out.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
    expect(paid(empowered)).toEqual(paid(baseline));
    expect(empowered.result.playerTeam.find(u => u.id === 'hero')?.cooldowns)
      .toEqual(baseline.result.playerTeam.find(u => u.id === 'hero')?.cooldowns);
  });
  it('rejects overflowing transformed candidates before payment or registration', () => {
    if (!clayFactory) throw new Error('Missing factory');
    registerSummon('clay_golem', owner => {
      const fresh = clayFactory(owner);
      return { ...fresh, life: Number.MAX_VALUE, stats: { ...fresh.stats, life: Number.MAX_VALUE, lifeMax: Number.MAX_VALUE } };
    });
    const out = record(input('clay_golem', 20));
    expect(summons(out)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(1000);
  });
  it.each(['clay_golem', 'iron_golem'])('preserves full-preload %s death authority without refund or resummon', template => {
    const snapshot = input(template, 20), hero = snapshot.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const built = buildSummon(hero, template);
    if (!built) throw new Error('Missing template');
    const { ironGolem: omitted, ...withoutItem } = snapshot;
    void omitted;
    const preload = { ...built, id: 'dying-preload', life: 1, statuses: [
      { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1000 }
    ] };
    const out = record({ ...withoutItem, playerTeam: [{ ...hero, mana: 10 }, preload] });
    expect(summons(out)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'death' && e.target === preload.id)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && (e.reason === 'cast' || e.reason === 'summon-refund'))).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(10);
  });
  it('also decorates a fresh golem from the generic summon effect once', () => {
    const snapshot = input('clay_golem', 20), hero = snapshot.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    registerSkill({ id: 'fixture.mastery-golem', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 1, manaCost: 3, effects: [{ kind: 'summon', summonId: 'clay_golem', maxCount: 1 }] });
    const out = record({ ...snapshot, playerTeam: [{ ...hero, statuses: [], skillOrder: ['fixture.mastery-golem'] }] });
    expect(summons(out)).toHaveLength(1);
    expect(summons(out)[0]?.simClockMs).toBeGreaterThan(0);
    expect(first(out).stats.lifeMax).toBeCloseTo(484, 12);
    expect(first(out).stats.attackSpeed).toBe(75);
  });
});

describe('Golem Mastery fresh owner boundary and wave copy', () => {
  it('excludes malformed projections, owners, unrelated templates and damaged units', () => {
    const owner = unit('hero'), projection = composeGolemMastery(player());
    const fresh = buildSummon(owner, 'clay_golem');
    if (!projection || !fresh) throw new Error('Missing eligible fixture');
    for (const fields of [{ rank: 0 }, { rank: 1.5 }, { maxRank: 0 }, { rank: 21 },
      { golemLifePct: -1 }, { golemLifePct: Infinity }, { golemAttackSpeed: NaN }, { sourceHeroId: 'other' }]) {
      expect(empowerGolemSummon({ ...projection, ...fields }, owner, fresh)).toBe(fresh);
    }
    for (const fields of [{ id: 'other' }, { side: 'enemy' as const }, { kind: 'merc' as const },
      { life: 0 }, { life: NaN }, { summon: true }, { ownerId: '' }, { summonOwnerId: 'other' }]) {
      expect(empowerGolemSummon(projection, { ...owner, ...fields }, fresh)).toBe(fresh);
    }
    for (const fields of [{ summonOwnerId: 'other' }, { ownerId: '' }, { side: 'enemy' as const },
      { kind: 'hero' as const }, { summon: false }, { life: 13 }]) {
      const invalid = { ...fresh, ...fields };
      expect(empowerGolemSummon(projection, owner, invalid)).toBe(invalid);
    }
    for (const template of ['skeleton', 'skeletal_mage', 'revived', 'valkyrie', 'raven', 'spirit_wolf',
      'dire_wolf', 'grizzly', 'poison_creeper', 'carrion_vine', 'solar_creeper', 'shadow_warrior', 'shadow_master']) {
      const other = buildSummon(owner, template);
      if (!other) throw new Error('Missing nonrecipient template');
      expect(empowerGolemSummon(projection, owner, other)).toBe(other);
    }
    expect(empowerGolemSummon(undefined, owner, fresh)).toBe(fresh);
    const actual = empowerGolemSummon(projection, owner, fresh);
    expect(actual).toBeDefined();
    expect({ ...actual, life: fresh.life, stats: { ...actual?.stats, life: fresh.stats.life,
      lifeMax: fresh.stats.lifeMax, attackSpeed: fresh.stats.attackSpeed } }).toEqual(fresh);
  });
  it('copies primitive wave potency before a summon factory can mutate the caller projection', () => {
    if (!clayFactory) throw new Error('Missing factory');
    const snapshot = input('clay_golem', 1), projection = snapshot.golemMastery;
    if (!projection) throw new Error('Missing projection');
    registerSummon('clay_golem', owner => {
      Reflect.set(projection, 'golemLifePct', 9);
      Reflect.set(projection, 'golemAttackSpeed', 100);
      return clayFactory(owner);
    });
    const out = runBattleRecorded(snapshot);
    expect(first(out).stats.lifeMax).toBeCloseTo(233.2, 12);
    expect(first(out).stats.attackSpeed).toBe(56);
    expect(projection.golemLifePct).toBe(9);
  });
});

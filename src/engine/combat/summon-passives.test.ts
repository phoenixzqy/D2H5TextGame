import { beforeEach, expect, it } from 'vitest';
import { composeSummonPassives, empowerNecromancerSummon, type SummonPassiveProjection } from '../skills/summon-passives';
import { composeSkeletonMastery } from '../skills/skeleton-mastery';
import { composeGolemMastery } from '../skills/golem-mastery';
import { buildSummon } from '../skills/summons';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { resolveDamage } from './damage';
import { createRng } from '../rng';
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing summon fixture'); return value; }
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 10000, mana: 1000, stats: { life: 10000, lifeMax: 10000, mana: 1000, manaMax: 1000,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
const pairs = [
  ['necromancer.raise_skeleton', 'skeleton'], ['necromancer.raise_skeletal_mage', 'skeletal_mage'],
  ['necromancer.clay_golem', 'clay_golem'], ['necromancer.blood_golem', 'blood_golem'],
  ['necromancer.iron_golem', 'iron_golem'], ['necromancer.fire_golem', 'fire_golem'], ['necromancer.revive', 'revived'],
] as const;
function input(id: string, rank: number): CombatSnapshot {
  const skillLevels = { [id]: 1, 'necromancer.clay_golem': 1, 'necromancer.golem_mastery': rank,
    'necromancer.blood_golem': 1, 'necromancer.skeleton_mastery': rank,
    'necromancer.summon_mastery': rank, 'necromancer.summon_resist': rank };
  const hero = { id: 'hero', class: 'necromancer', level: 30, skillLevels };
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillLevels, skillOrder: [id] }],
    enemyTeam: [unit('target', 'enemy')], skeletonMastery: required(composeSkeletonMastery(hero)),
    golemMastery: required(composeGolemMastery(hero)), summonPassives: required(composeSummonPassives(hero)),
    ...(id === 'necromancer.iron_golem' ? { ironGolem: { sourceHeroId: 'hero', sourceItemId: 'metal', life: 12.5, attack: 3.25, defense: 4.5 } } : {}) };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(result);
  return result;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each(pairs.flatMap(([id, template]) => [1, 20].map(rank => ({ id, template, rank }))))(
  '$template combines global and local rank$rank once at real creation with one unchanged payment', ({ id, template, rank }) => {
    const snapshot = input(id, rank), result = record(snapshot);
    const skill = required(getSkill(id)), effect = skill.effects[0];
    if (effect?.kind !== 'summon') throw new Error('Missing actual summon effect');
    const baseline = required(buildSummon(required(snapshot.playerTeam[0]), template, { skillLevel: 1, statScaling: effect.statScaling }));
    const iron = template === 'iron_golem';
    const life = baseline.stats.lifeMax + (iron ? 12.5 : 0), attack = baseline.stats.attack + (iron ? 3.25 : 0);
    const skeleton = ['skeleton', 'skeletal_mage'].includes(template), golem = template.endsWith('_golem');
    const events = result.events.filter(e => e.kind === 'summon');
    expect(events).toHaveLength(1);
    const summon = required(events[0]);
    expect(summon.simClockMs).toBe(0);
    expect(summon.unit.stats.lifeMax).toBeCloseTo(life * (1 + rank * (.05 + (skeleton ? .04 : golem ? .06 : 0))), 10);
    expect(summon.unit.stats.attack).toBeCloseTo(attack * (1 + rank * (.02 + (skeleton ? .02 : 0))), 10);
    expect(summon.unit.stats.defense).toBeCloseTo((baseline.stats.defense + (iron ? 4.5 : 0)) * (1 + (skeleton ? rank * .01 : 0)), 10);
    expect(summon.unit.stats.attackSpeed).toBe(baseline.stats.attackSpeed + (golem ? rank : 0));
    for (const type of ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const)
      expect(summon.unit.stats.resistances[type]).toBe(baseline.stats.resistances[type] + rank * 2);
    expect(summon.unit.life).toBe(summon.unit.stats.lifeMax);
    const controlInput = { ...snapshot }; delete controlInput.summonPassives;
    const control = record(controlInput);
    expect(result.events.filter(e => e.kind === 'mana')).toEqual(control.events.filter(e => e.kind === 'mana'));
    expect(summon.unit.id).toBe(control.events.find(e => e.kind === 'summon')?.unit.id);
    expect(result.result.ironGolemPreparation).toEqual(control.result.ironGolemPreparation);
  });
it('covers the ordinary in-battle summon path as well as startup preparation', () => {
  registerSkill({ id: 'fixture.ordinary-revive', archetype: 'fixture', minLevel: 1, cooldown: 99, manaCost: 7,
    target: 'summon', effects: [{ kind: 'summon', summonId: 'revived', maxCount: 1 }] });
  const snapshot = input('fixture.ordinary-revive', 20), hero = required(snapshot.playerTeam[0]);
  const out = record({ ...snapshot, playerTeam: [{ ...hero, statuses: [] }] });
  expect(out.events.find(e => e.kind === 'summon')?.unit.stats).toMatchObject({ lifeMax: 300, attack: 39.2 });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});
it('leaves preloaded damaged summons intact and fills only the missing cap', () => {
  const snapshot = input('necromancer.raise_skeleton', 20), hero = required(snapshot.playerTeam[0]);
  const preloaded = { ...required(buildSummon(hero, 'skeleton')), id: 'carried', life: 13,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const out = record({ ...snapshot, playerTeam: [hero, preloaded] });
  expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(0);
  expect(out.result.playerTeam.find(u => u.id === preloaded.id)).toMatchObject({ life: 13, stats: preloaded.stats });
});
it('rejects insufficient preparation MP and arithmetic overflow before payment', () => {
  const snapshot = input('necromancer.clay_golem', 1), hero = required(snapshot.playerTeam[0]);
  for (const patch of [{ playerTeam: [{ ...hero, mana: 0 }] },
    { summonPassives: { ...required(snapshot.summonPassives), lifePct: Number.MAX_VALUE } }]) {
    const out = record({ ...snapshot, ...patch });
    expect(out.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  }
});
it('excludes foreign, enemy, malformed, dead and other-template recipients', () => {
  const snapshot = input('necromancer.clay_golem', 1), owner = required(snapshot.playerTeam[0]);
  const global = required(snapshot.summonPassives), fresh = required(buildSummon(owner, 'clay_golem'));
  for (const patch of [{ sourceHeroId: 'other' }, { masteryRank: NaN }, { resistRank: -1 }, { lifePct: Infinity },
    { resistAllBonus: -2 }, { masteryRank: 0, lifePct: 1 }]) {
    expect(empowerNecromancerSummon(owner, fresh, undefined, undefined, { ...global, ...patch })).toEqual(fresh);
  }
  for (const patch of [{ id: 'foreign' }, { side: 'enemy' as const }, { kind: 'merc' as const },
    { summon: true }, { ownerId: 'other' }, { life: 0 }]) {
    expect(empowerNecromancerSummon({ ...owner, ...patch }, fresh, undefined, undefined, global)).toEqual(fresh);
  }
  for (const template of ['raven', 'valkyrie', 'shadow_master', 'minion']) {
    const other = required(buildSummon(owner, template));
    expect(empowerNecromancerSummon(owner, other, undefined, undefined, global)).toEqual(other);
  }
  const damaged = { ...fresh, life: 13 };
  expect(empowerNecromancerSummon(owner, damaged, undefined, undefined, global)).toEqual(damaged);
  expect(empowerNecromancerSummon(owner, damaged, snapshot.skeletonMastery, snapshot.golemMastery, global)).toEqual(damaged);
  const invalid = { ...global, resistRank: '20' } as unknown as SummonPassiveProjection;
  expect(empowerNecromancerSummon(owner, fresh, undefined, undefined, invalid)).toEqual(fresh);
});

it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const)(
  'feeds actual %s resistance into mitigation at cap rank', type => {
    const snapshot = input('necromancer.clay_golem', 20);
    const stats = required(record(snapshot).events.find(e => e.kind === 'summon')).unit.stats;
    const hit = resolveDamage({ baseMin: 100, baseMax: 100, flatBonus: 0, increasedPct: 0,
      comboMult: 1, type, critChance: 0, critMult: 1.5, defenderResistances: stats.resistances,
      defenderArmor: 0, defenderMagicResist: 0, defenderDodge: 0, hitChance: 1 }, createRng(7));
    expect(hit.final).toBe(type === 'physical' ? 50 : 60);
  });

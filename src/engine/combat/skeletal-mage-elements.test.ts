import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import * as summonModule from '../skills/summons';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const MAGE = 'necromancer.raise_skeletal_mage';
const ALIAS = 'skills-necromancer-raise-skeletal-mage';
const CYCLE = ['fire', 'cold', 'lightning', 'poison'] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Mage fixture');
  return value;
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000000, mana: 1000, stats: { life: 1000000, lifeMax: 1000000, mana: 1000, manaMax: 1000,
      attack: 1, defense: 12, magicResist: 5, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 25, cold: 25, lightning: 25, arcane: 0, poison: 25 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function input(rank = 6): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillOrder: [MAGE], skillLevels: { [MAGE]: rank } }],
    enemyTeam: [unit('target', 'enemy')] };
}
function heroChange(snapshot: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot {
  return { ...snapshot, playerTeam: [{ ...required(snapshot.playerTeam[0]), ...fields }, ...snapshot.playerTeam.slice(1)] };
}
function targetChange(snapshot: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot {
  return { ...snapshot, enemyTeam: [{ ...required(snapshot.enemyTeam[0]), ...fields }] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot);
  const out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  for (const target of snapshot.enemyTeam) {
    const total = out.events.reduce((sum, e) => sum + (e.kind === 'damage' && e.target === target.id ? e.amount : 0), 0);
    expect(out.result.enemyTeam.find(u => u.id === target.id)?.life).toBe(Math.max(0, target.life - total));
  }
  return out;
}
type Recording = ReturnType<typeof runBattleRecorded>;
function spawned(out: Recording, owner = 'hero') {
  return out.events.filter(e => e.kind === 'summon' && e.owner === owner).map(e => {
    if (e.kind !== 'summon') throw new Error('Expected summon event');
    return e.unit;
  });
}
function damage(out: Recording, id: string) {
  return out.events.filter(e => e.kind === 'damage' && e.source === id).map(e => {
    if (e.kind !== 'damage') throw new Error('Expected damage event');
    return e;
  });
}
function expectTypes(out: Recording, units: readonly CombatUnit[], expected: readonly string[]) {
  expect(units).toHaveLength(expected.length);
  units.forEach((u, index) => {
    const hits = damage(out, u.id);
    expect(hits.length).toBeGreaterThan(0);
    expect([...new Set(hits.map(e => e.damageType))]).toEqual([expected[index]]);
  });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D06 fresh Mage elemental basic bolts', () => {
  it.each([
    [1, 1, 88, 30, .08, ['fire']],
    [6, 4, 123, 45, .09, ['fire', 'cold', 'lightning', 'poison']],
    [20, 8, 221, 87, .118, ['fire', 'cold', 'lightning', 'poison', 'fire', 'cold', 'lightning', 'poison']]
  ] as const)('rank%i preserves cap%i, paid stats and literal fresh cycle', (rank, cap, life, attack, dodge, types) => {
    const out = record(input(rank)), fresh = spawned(out);
    expectTypes(out, fresh, types);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 978, simClockMs: 0 })
    ]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: MAGE, simClockMs: 0 })
    ]);
    expect(fresh).toHaveLength(cap);
    for (const mage of fresh) {
      expect(mage).toMatchObject({ life, stats: { lifeMax: life, attack, defense: 10, magicDodge: dodge } });
      const actions = out.events.filter(e => e.kind === 'action' && e.actor === mage.id);
      expect(actions.map(e => e.simClockMs)).toEqual(Array.from({ length: 30 }, (_, i) => 1940 * (i + 1)));
      expect(actions.every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
      expect(damage(out, mage.id).every(e => e.target === 'target')).toBe(true);
      expect(mage).not.toHaveProperty('basicAttackElement');
      expect(mage).not.toHaveProperty('summonBasicAttackElements');
    }
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(out.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 60000 });
  });

  it.each([[2, ['fire', 'cold']], [3, ['fire', 'cold', 'lightning']]] as const)(
    'rank%i registers the literal short fresh prefix', (rank, expected) => {
      const out = record(input(rank));
      expectTypes(out, spawned(out), expected);
    });

  it('pays exactly22MP once for the complete rank6 batch', () => {
    const out = record(heroChange(input(), { mana: 22 }));
    expectTypes(out, spawned(out), CYCLE);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ mana: 0, simClockMs: 0 })
    ]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });

  it('retains paid Frozen Armor retaliation for each elemental basic hit', () => {
    const out = record(targetChange(input(), { frozenArmor: { rank: 1, defensePct: .2 } }));
    expectTypes(out, spawned(out), CYCLE);
    for (const mage of spawned(out)) {
      const first = out.events.findIndex(e => e.kind === 'damage' && e.source === mage.id && !e.dodged);
      expect(first).toBeGreaterThanOrEqual(0);
      expect(out.events[first + 1]).toMatchObject({ kind: 'status', target: mage.id, statusId: 'chill',
        simClockMs: required(out.events[first]).simClockMs });
    }
  });

  it('does not physically shatter a frozen target already below20% life', () => {
    const base = input(), target = required(base.enemyTeam[0]);
    const out = record(targetChange(base, { life: 1000, statuses: [...target.statuses,
      { id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: -1 }] }));
    const hits = spawned(out).flatMap(u => damage(out, u.id)).filter(e => !e.dodged);
    expect(new Set(hits.map(e => e.damageType))).toEqual(new Set(CYCLE));
    expect(hits.every(e => e.amount <= 45)).toBe(true);
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  });

  it.each([
    [1, 10, 17], [6, 21, 28], [20, 53, 60]
  ])('rank%i uses Defense for fire/poison and Magic Resistance for cold/lightning', (rank, armor, magic) => {
    const out = record(input(rank));
    for (const u of spawned(out)) {
      const hits = damage(out, u.id).filter(e => !e.dodged && !e.crit);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every(e => e.amount === (e.damageType === 'fire' || e.damageType === 'poison' ? armor : magic))).toBe(true);
    }
  });

  it('retains default crit and floors Mastery attack once before shared damage', () => {
    const out = record(input());
    const crits = spawned(out).flatMap(u => damage(out, u.id)).filter(e => e.crit);
    expect(crits.length).toBeGreaterThan(0);
    expect(crits.every(e => e.amount === (e.damageType === 'fire' || e.damageType === 'poison' ? 38 : 45))).toBe(true);
    for (const [rank, attack, armor, magic] of [[1, 45.9, 21, 28], [20, 62.99999999999999, 34, 41]] as const) {
      const enhanced = record({ ...input(), skeletonMastery: { sourceHeroId: 'hero', rank, maxRank: 20,
        summonLifePct: rank * .04, summonAttackPct: rank * .02, summonDefensePct: rank * .01 } });
      for (const u of spawned(enhanced)) {
        expect(u.stats.attack).toBeCloseTo(attack, 12);
        if (rank === 20) {
          expect(u.stats.attack).toBe(62.99999999999999);
          expect(u.stats.attack).toBeLessThan(63);
          expect(Math.floor(u.stats.attack)).toBe(62);
        }
        const hits = damage(enhanced, u.id).filter(e => !e.dodged && !e.crit);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every(e => e.amount === (e.damageType === 'fire' || e.damageType === 'poison' ? armor : magic))).toBe(true);
      }
    }
  });

  it.each([[0, 33, 40], [75, 1, 6], [95, 1, 6], [-100, 78, 85], [-200, 78, 85]])(
    'uses live resistance clamp for raw%i', (raw, armor, magic) => {
      const base = input(), target = required(base.enemyTeam[0]);
      const out = record(targetChange(base, { stats: { ...target.stats,
        resistances: { physical: 0, fire: raw, cold: raw, lightning: raw, arcane: 0, poison: raw } } }));
      for (const u of spawned(out)) {
        const hits = damage(out, u.id).filter(e => !e.dodged && !e.crit);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every(e => e.amount === (e.damageType === 'fire' || e.damageType === 'poison' ? armor : magic))).toBe(true);
      }
    });

  it.each([[50, 20, 19, 26], [25, 40, 39, 46]])('applies explicit resistance penalty %i minus%i', (raw, penalty, armor, magic) => {
    const base = input(), target = required(base.enemyTeam[0]);
    const out = record(targetChange(base, { resistPenalty: penalty, stats: { ...target.stats,
      resistances: { physical: 0, fire: raw, cold: raw, lightning: raw, arcane: 0, poison: raw } } }));
    for (const u of spawned(out)) {
      const hits = damage(out, u.id).filter(e => !e.dodged && !e.crit);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every(e => e.amount === (e.damageType === 'fire' || e.damageType === 'poison' ? armor : magic))).toBe(true);
    }
  });

  it.each([4, 5] as const)('Act%i alone does not invent a resistance penalty', act => {
    expect(record({ ...input(), act })).toEqual(record(input()));
  });

  it('uses magical dodge for all four types without consulting physical dodge', () => {
    const base = input(), target = required(base.enemyTeam[0]);
    const a = record(base), b = record(targetChange(base, { stats: { ...target.stats, physDodge: 1 } }));
    expect(a.events).toEqual(b.events);
    const c = record(targetChange(base, { stats: { ...target.stats, magicDodge: 1 } }));
    for (const mage of spawned(a)) {
      const first = damage(a, mage.id), last = damage(c, mage.id);
      expect(last).toHaveLength(30);
      expect(last.filter(e => e.dodged).length).toBeGreaterThan(first.filter(e => e.dodged).length);
    }
  });

  it.each([['chill', 'lightning', 38], ['ignite', 'poison', 26], ['paralyze', 'fire', 28]] as const)(
    'uses the existing %s combo on %s', (status, element, amount) => {
      const base = input(), target = required(base.enemyTeam[0]);
      const out = record(targetChange(base, { statuses: [...target.statuses,
        { id: status, sourceId: 'fixture', stacks: 1, remaining: -1 }] }));
      const mage = required(spawned(out)[CYCLE.indexOf(element)]);
      const hits = damage(out, mage.id).filter(e => !e.dodged && !e.crit);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every(e => e.amount === amount)).toBe(true);
    });
});

describe('D06 battle-local Mage registration authority', () => {
  it('restarts at fire after preloads, dead reserved IDs and unrelated registrations', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const old = { ...required(buildSummon(hero, 'skeletal_mage')), id: 'old-mage', basicAttackElement: 'poison', summonBasicAttackElements: CYCLE, stats: {
      ...required(buildSummon(hero, 'skeletal_mage')).stats, attack: 3 } };
    const dead = { ...old, id: 'hero-summon-skeletal_mage-2', life: 0 };
    const out = record({ ...base, playerTeam: [{ ...hero, skillOrder: ['necromancer.raise_skeleton', MAGE],
      skillLevels: { [MAGE]: 6, 'necromancer.raise_skeleton': 1 } }, old, dead] });
    const fresh = spawned(out).filter(u => u.summonTemplateId === 'skeletal_mage');
    expect(fresh.map(u => u.id)).toEqual(['hero-summon-skeletal_mage-3', 'hero-summon-skeletal_mage-4', 'hero-summon-skeletal_mage-5']);
    expectTypes(out, fresh, ['fire', 'cold', 'lightning']);
    expectTypes(out, [old], ['physical']);
    expect(damage(out, dead.id)).toEqual([]);
    expectTypes(out, spawned(out).filter(u => u.summonTemplateId === 'skeleton'), ['physical']);
  });

  it('starts each owner and repeated battle from local index0 independently of seed', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const pair = { ...base, playerTeam: [hero, { ...hero, id: 'other' }] };
    const a = record(pair);
    for (const owner of ['hero', 'other']) expectTypes(a, spawned(a, owner), CYCLE);
    const b = record({ ...pair, seed: 991 });
    for (const owner of ['hero', 'other']) expectTypes(b, spawned(b, owner), CYCLE);
    record(input(1));
    expect(record(pair)).toEqual(a);
    expect(record(pair)).toEqual(a);
  });

  it.each([
    ['missing', undefined], ['fractional', { [MAGE]: 1.5 }], ['fractional over-cap', { [MAGE]: 20.5 }],
    ['fractional canonical wins', { [MAGE]: 1.5, [ALIAS]: 6 }]
  ] as const)('keeps generic prepared attacks physical for %s allocation', (_name, skillLevels) => {
    const base = input(), hero = required(base.playerTeam[0]);
    const { skillLevels: _levels, ...unlearned } = hero;
    const out = record({ ...base, playerTeam: [skillLevels ? { ...hero, skillLevels } : unlearned] });
    const fresh = spawned(out);
    expect(fresh.length).toBeGreaterThan(0);
    expectTypes(out, fresh, fresh.map(() => 'physical'));
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it('preserves existing over-cap rank21 batch refusal without payment', () => {
    const out = record(input(21));
    expect(spawned(out)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it.each([
    { [ALIAS]: 6 }, { [MAGE]: 6, [ALIAS]: 1.5 }, { [MAGE]: 0, [ALIAS]: 6 }
  ])('uses the selected canonical-first positive allocation %j', skillLevels => {
    const out = record(heroChange(input(), { skillOrder: [ALIAS, MAGE, ALIAS], skillLevels }));
    expectTypes(out, spawned(out), CYCLE);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it.each([{ kind: 'merc' }, { summon: true }, { ownerId: 'foreign' }, { summonOwnerId: 'foreign' },
    { level: 30.5 }, { life: Infinity }] as const)('rejects elemental owner provenance %j without rewriting generic preparation', fields => {
    const out = record(heroChange(input(), fields));
    const fresh = spawned(out);
    expect(fresh).toHaveLength(4);
    expectTypes(out, fresh, fresh.map(() => 'physical'));
  });

  it('keeps enemy canonical preparation and synthetic same-template summons physical', () => {
    const base = input(), hero = required(base.playerTeam[0]), foe = required(base.enemyTeam[0]);
    const enemy = record({ ...base, playerTeam: [{ ...hero, skillOrder: [] }],
      enemyTeam: [{ ...foe, skillOrder: [MAGE], skillLevels: { [MAGE]: 6 } }] });
    expectTypes(enemy, spawned(enemy, 'target'), ['physical', 'physical', 'physical', 'physical']);
    registerSkill({ ...required(getSkill(MAGE)), id: 'fixture.mage', archetype: 'fixture' });
    const synthetic = record(heroChange(base, { skillOrder: ['fixture.mage'], skillLevels: { 'fixture.mage': 6 } }));
    expectTypes(synthetic, spawned(synthetic), ['physical']);
    expect(synthetic.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it('does not grant authority through a canonical ID with a foreign archetype', () => {
    registerSkill({ ...required(getSkill(MAGE)), archetype: 'fixture' });
    const out = record(input());
    expectTypes(out, spawned(out), ['physical', 'physical', 'physical', 'physical']);
  });

  it.each([
    ['side', { side: 'enemy' }], ['kind', { kind: 'hero' }],
    ['template', { summonTemplateId: 'skeleton' }], ['mandatory owner', { summonOwnerId: 'foreign' }],
    ['summon marker', { summon: false }], ['optional owner', { ownerId: 'foreign' }]
  ] as const)('checks each returned %s marker without shifting its batch index', (_name, fields) => {
    const realBuild = summonModule.buildSummon;
    let calls = 0;
    const spy = vi.spyOn(summonModule, 'buildSummon').mockImplementation((owner, template, options) => {
      const candidate = realBuild(owner, template, options);
      if (!candidate) return candidate;
      return ++calls % 4 === 1 ? { ...candidate, ...fields } : candidate;
    });
    try {
      const out = record(input()), fresh = spawned(out);
      expect(fresh[0]).toMatchObject(fields);
      expectTypes(out, fresh, ['physical', 'cold', 'lightning', 'poison']);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    } finally { spy.mockRestore(); }
  });

  it('accepts absent optional owner markers on real fresh registrations', () => {
    const out = record(input()), fresh = spawned(out);
    for (const mage of fresh) expect(mage).not.toHaveProperty('ownerId');
    expectTypes(out, fresh, CYCLE);
  });

  it('adds no RNG draw versus the same rank1 generic preparation', () => {
    const base = input(1), hero = required(base.playerTeam[0]);
    const { skillLevels: _levels, ...unlearned } = hero;
    const explicit = record(base), generic = record({ ...base, playerTeam: [unlearned] });
    const trace = (out: Recording) => out.events.map(e => e.kind === 'damage'
      ? { kind: e.kind, source: e.source, target: e.target, crit: e.crit, dodged: e.dodged,
          simClockMs: e.simClockMs, uiDelayMs: e.uiDelayMs }
      : e);
    expectTypes(explicit, spawned(explicit), ['fire']);
    expectTypes(generic, spawned(generic), ['physical']);
    expect(trace(explicit)).toEqual(trace(generic));
  });

  it('never grants authority to a rejected late-invalid batch or a poor startup', () => {
    const factory = required(getSummon('skeletal_mage'));
    let calls = 0;
    try {
      registerSummon('skeletal_mage', owner => {
        const candidate = factory(owner);
        return ++calls % 2 === 0 ? { ...candidate, stats: { ...candidate.stats, attack: NaN } } : candidate;
      });
      const out = record(input());
      expect(spawned(out)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    } finally { registerSummon('skeletal_mage', factory); }
    const poor = record(heroChange(input(), { mana: 21, manaRegenPerSecond: 10 }));
    expect(spawned(poor)).toEqual([]);
    expect(poor.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(poor.result.playerTeam[0]?.mana).toBeGreaterThan(22);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import monsters from '../../data/monsters/act1.json';
import monsterSchema from '../../data/schema/monster.schema.json';
import { GameDataValidationError, validateGameData } from '../../data/loader';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { MonsterDef } from '../types/monsters';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit, MonsterTier } from './types';

const schema = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
function definition(slug: string): MonsterDef {
  const row: unknown = monsters.find(m => m.id === `monsters/act1.${slug}`);
  if (!schema(row)) throw new Error('Invalid production monster fixture');
  return row;
}
const legacy: MonsterDef = { ...definition('fallen-shaman') };
Reflect.deleteProperty(legacy, 'attack');
Reflect.deleteProperty(legacy, 'attackGrowth');
function authored(attack: unknown = [13, 13], attackGrowth: unknown = [2, 2]): MonsterDef {
  return { ...legacy, attack, attackGrowth } as MonsterDef;
}
function unit(def = authored(), level = 17, tier: MonsterTier = 'trash'): CombatUnit {
  return buildMonsterUnit({ def, level, tier, rng: createRng(7), id: 'shaman' });
}
function player(): CombatUnit {
  const template = unit(legacy);
  return { ...template, id: 'hero', kind: 'hero', side: 'player', life: 100_000,
    mana: 0, skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...template.stats, attack: 0, life: 100_000, lifeMax: 100_000, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
}
function record(enemy: CombatUnit, seed = 13) {
  const input: CombatSnapshot = { seed, act: 1, playerTeam: [player()], enemyTeam: [enemy] };
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(output);
  return output;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('authored monster attack progression', () => {
  it.each([
    ['fallen', 20, 5], ['carver', 33.6, 5.25], ['quill-rat', 17, 4.25],
    ['zombie', 18, 4.5], ['dark-archer', 35.2, 5.5], ['tainted', 32, 5],
    ['bone-warrior', 35.2, 5.5], ['fallen-shaman', 13, 2],
    ['carver-shaman', 13, 2], ['devilkin-shaman', 13, 2]
  ])('loads the approved %s attack and growth from production JSON', (slug, base, growth) => {
    expect(definition(String(slug))).toMatchObject({ attack: [base, base], attackGrowth: [growth, growth] });
  });

  it.each<[MonsterTier, number, number, number]>([
    ['trash', 13, 35, 45], ['elite', 17, 46, 59], ['rare-minion', 14, 39, 50],
    ['champion', 20, 53, 68], ['rare-elite', 20, 53, 68], ['boss', 21, 56, 72],
    ['chapter-boss', 13, 35, 45]
  ])('builds literal Shaman oracles for %s at L1/L12/L17', (tier, ...expected) => {
    expect([1, 12, 17].map(level => unit(definition('fallen-shaman'), level, tier).stats.attack)).toEqual(expected);
  });

  it.each(['carver-shaman', 'devilkin-shaman'])('resolves %s across its allowed spawn tiers', slug => {
    const def = definition(slug);
    expect(def.canBeBoss).toBe(false);
    expect(def.canBeElite).toBe(true);
    const oracles: [MonsterTier, number[]][] = [
      ['trash', [13, 35, 45]], ['elite', [17, 46, 59]], ['rare-minion', [14, 39, 50]],
      ['champion', [20, 53, 68]], ['rare-elite', [20, 53, 68]]
    ];
    for (const [tier, expected] of oracles) {
      expect([1, 12, 17].map(level => unit(def, level, tier).stats.attack)).toEqual(expected);
    }
  });

  it('rounds fractional endpoints only after level growth and tier multiplication', () => {
    const enemy = unit(authored([13.2, 16.4], [2.1, 3.25]), 2, 'elite');
    expect(Reflect.get(enemy, 'attackRange')).toEqual([20, 26]);
    expect(enemy.stats.attack).toBe(23);
    expect(Object.isFrozen(Reflect.get(enemy, 'attackRange'))).toBe(true);
  });
  it('clamps the growth level offset at zero', () => {
    expect(Reflect.get(unit(authored(), 0), 'attackRange')).toEqual([13, 13]);
  });
  it.each([0, 7.25, 91])('keeps exact Attack override %s as ordinary damage instead of the authored range', attack => {
    const enemy = buildMonsterUnit({ def: authored([13, 19], [2, 3]), level: 17,
      tier: 'boss', rng: createRng(1), statOverrides: { attack } });
    expect(enemy.stats.attack).toBe(attack);
    expect(Reflect.get(enemy, 'attackRange')).toEqual([attack, attack]);
  });
  it('leaves life/ID and the next spawn RNG draw identical to the legacy factory', () => {
    const left = createRng(837), right = createRng(837);
    const a = buildMonsterUnit({ def: legacy, level: 17, tier: 'champion', rng: left });
    const b = buildMonsterUnit({ def: authored([13, 19], [2, 3]), level: 17, tier: 'champion', rng: right });
    expect([b.id, b.life, b.stats.defense, b.stats.magicResist, b.skillOrder])
      .toEqual([a.id, a.life, a.stats.defense, a.stats.magicResist, a.skillOrder]);
    expect(right.next()).toBe(left.next());
  });
  it('retains the complete legacy output for definitions without attack metadata', () => {
    const enemy = unit(legacy);
    expect(enemy.stats.attack).toBe(112);
    expect(Reflect.get(enemy, 'attackRange')).toBeUndefined();
    expect(record({ ...enemy, skillOrder: [] })).toEqual(record({ ...unit(legacy), skillOrder: [] }));
  });

  it.each(['fallen-shaman', 'carver-shaman', 'devilkin-shaman'])(
    'uses %s resolved ordinary damage without adding scalar Attack a second time', slug => {
    const enemy = unit(definition(slug));
    const output = record({ ...enemy, skillOrder: [], stats: { ...enemy.stats, critChance: 0 } });
    const hits = output.events.filter(e => e.kind === 'damage' && e.source === 'shaman' && !e.dodged);
    expect(hits.length).toBeGreaterThan(5);
    expect(hits.every(e => e.kind === 'damage' && e.amount === 45)).toBe(true);
  });
  it('rolls the resolved ordinary range through the existing damage pipeline', () => {
    const enemy = unit(authored([13, 19], [2, 3]));
    const output = record({ ...enemy, skillOrder: [], stats: { ...enemy.stats, critChance: 0 } });
    const hits = output.events.filter(e => e.kind === 'damage' && e.source === 'shaman' && !e.dodged);
    const amounts = hits.map(e => e.kind === 'damage' ? e.amount : 0);
    expect(amounts.length).toBeGreaterThan(5);
    expect(amounts.every(value => value >= 45 && value <= 67)).toBe(true);
    expect(new Set(amounts).size).toBeGreaterThan(1);
  });
  it('keeps point-range combat RNG neutral relative to the equivalent scalar fallback', () => {
    const enemy = unit(authored());
    const equivalent = { ...enemy, stats: { ...enemy.stats, attack: 45 }, skillOrder: [] };
    const scalar = { ...equivalent }; Reflect.deleteProperty(scalar, 'attackRange');
    expect(record(equivalent).events).toEqual(record(scalar).events);
  });
  it.each(['fallen-shaman', 'carver-shaman', 'devilkin-shaman'])(
    'preserves %s active Fire Bolt formulas and RNG at the same attack cadence', slug => {
    const skill = getSkill('monster-fire-bolt');
    if (!skill) throw new Error('Missing Fire Bolt');
    registerSkill({ ...skill, id: 'fixture.continuous-fire-bolt', cooldown: 1 });
    const def = definition(slug), old = { ...def };
    Reflect.deleteProperty(old, 'attack'); Reflect.deleteProperty(old, 'attackGrowth');
    const a = unit(old), b = unit(def);
    const prepare = (enemy: CombatUnit) => ({ ...enemy, skillOrder: ['fixture.continuous-fire-bolt'] });
    const before = record(prepare(a)), after = record(prepare(b));
    expect(after.events.filter(e => e.kind === 'action' && e.actor === 'shaman')
      .every(e => e.kind === 'action' && e.skillId === 'fixture.continuous-fire-bolt')).toBe(true);
    expect(after.events).toEqual(before.events);
  });
  it('keeps Blood Raven fixed ordinary arrows above resolved Attack and exact stat overrides', () => {
    const def = { ...definition('blood-raven'), attack: [900, 900] as const, attackGrowth: [100, 100] as const };
    const enemy = buildMonsterUnit({ def, level: 17, tier: 'boss', rng: createRng(7), id: 'shaman',
      statOverrides: { attack: 999 }, skillOrderOverride: [] });
    const output = record({ ...enemy, stats: { ...enemy.stats, critChance: 0 } });
    const hits = output.events.filter(e => e.kind === 'damage' && e.source === 'shaman' && !e.dodged);
    expect(hits.length).toBeGreaterThan(5);
    expect(hits.every(e => e.kind === 'damage' && e.amount >= 30 && e.amount <= 50)).toBe(true);
  });
});

describe('monster attack validation boundaries', () => {
  it('accepts paired finite fractional and zero ranges in central and standalone strict schema consumers', () => {
    for (const def of [authored(), authored([0, 0.5], [0, 0.25]), legacy]) {
      expect(schema(def)).toBe(true);
      expect(() => validateGameData(monsterSchema.$id, def)).not.toThrow();
    }
  });
  const invalid = [
    { attack: [13, 13] }, { attackGrowth: [2, 2] },
    ...['attack', 'attackGrowth'].flatMap(field => [
      null, '13', [], [1], [1, 2, 3], [-1, 2], [3, 2], [NaN, 2], [1, Infinity], [1, -Infinity], ['1', 2]
    ].map(value => ({ attack: [13, 13], attackGrowth: [2, 2], [field]: value })))
  ];
  it.each(invalid)('rejects invalid authored progression at central and direct factory boundaries: %j', fields => {
    const def = { ...legacy, ...fields } as unknown as MonsterDef;
    expect(() => validateGameData(monsterSchema.$id, def)).toThrow(GameDataValidationError);
    const rng = createRng(9), control = createRng(9);
    expect(() => buildMonsterUnit({ def, level: 17, tier: 'trash', rng })).toThrow(/attack/i);
    expect(rng.next()).toBe(control.next());
  });
});

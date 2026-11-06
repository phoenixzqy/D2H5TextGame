import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import * as rngModule from '@/engine/rng';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const pool = loadMercPool().pool;
const stats = { life: 100000, lifeMax: 100000, mana: 1000, manaMax: 1000, attack: 100,
  defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 0 };
function merc(id: string, stars: number): CombatUnit {
  const def = pool.find(row => row.id === id);
  if (!def) throw new Error('Missing native merc');
  const owned = { ...createMercFromDef(def), level: 30 };
  return { ...mercToCombatUnit(owned, undefined, {}, stars), stats, life: stats.lifeMax,
    mana: stats.manaMax, skillOrder: [def.signatureSkillId] };
}
function other(id: string, side: 'player' | 'enemy', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    stats, life: 90000, mana: 1000, statuses: [hold], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, ...patch };
}
function record(id: string, stars: number, hero: Partial<CombatUnit> = {}, enemy: Partial<CombatUnit> = {}) {
  const m = merc(id, stars);
  const snapshot = { seed: 5, maxRounds: 3, playerTeam: [other('hero', 'player', hero), m],
    enemyTeam: [other('enemy', 'enemy', enemy)] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  return out;
}
function hit(id: string, side: 'player' | 'enemy', type: 'physical' | 'cold' = 'physical') {
  registerSkill({ id, archetype: 'fixture', target: side === 'player' ? 'single-enemy' : 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100], alwaysHits: true }] });
  return { skillOrder: [id], statuses: [] };
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

it.each(pool.map(def => [def.id, def.signatureSkillId]))('projects exactly the native signature for %s', (id, skillId) => {
  expect(merc(id, 5).mercSignature).toEqual({ skillId, rank: 6 });
  expect(merc(id, 0).mercSignature).toBeUndefined();
});

const direct = pool.filter(def => ['mskill-fire-ball', 'mskill-glacial-spike', 'mskill-charged-bolt',
  'mskill-pierce-arrow', 'mskill-fire-arrow', 'mskill-cold-arrow', 'mskill-basic-arrow',
  'mskill-telekinesis', 'mskill-pierce-thrust', 'mskill-chop', 'mskill-pilfer',
  'mskill-basic-swing', 'mskill-smite'].includes(def.signatureSkillId));
it.each(direct.map(def => [def.id]))('increases actual signature damage independently of stat growth for %s', id => {
  const amount = (stars: number) => record(id, stars).events.flatMap(event =>
    event.kind === 'damage' && event.source === 'merc-' + id && event.amount > 0 ? [event.amount] : [])[0];
  expect(amount(5)).toBeGreaterThan(amount(0) ?? Infinity);
});

it.each([
  ['mercs/act2-might', 'physical'], ['mercs/act2-holy-freeze', 'cold'],
  ['mercs/act1-rogue-inner-sight', 'physical']
] as const)('increases real party damage from %s', (id, type) => {
  const hero = hit('fixture.hero', 'player', type);
  const enemy = id.includes('inner-sight') ? { stats: { ...stats, defense: 80 } } : {};
  const amount = (stars: number) => record(id, stars, hero, enemy).events.flatMap(event =>
    event.kind === 'damage' && event.source === 'hero' && event.simClockMs > 2000 ? [event.amount] : [])[0];
  expect(amount(5)).toBeGreaterThan(amount(0) ?? Infinity);
});
it('increases actual Prayer pulses without changing their cadence', () => {
  const heals = (stars: number) => record('mercs/act2-prayer', stars).events.filter(e => e.kind === 'heal' && e.target === 'hero');
  expect(heals(0)[0]).toMatchObject({ amount: 5, simClockMs: 1000 });
  expect(heals(5)[0]).toMatchObject({ amount: 8, simClockMs: 1000 });
});
it('increases real Holy Fire pulses', () => {
  const damage = (stars: number) => record('mercs/act4-paladin-holy-fire', stars).events.find(e => e.kind === 'damage');
  expect(damage(0)).toMatchObject({ amount: 8, simClockMs: 1000 });
  expect(damage(5)).toMatchObject({ amount: 13, simClockMs: 1000 });
});
it('captures stronger paid Frozen Armor', () => {
  const paid = (stars: number) => record('mercs/act3-iron-wolf-frozen-armor', stars).result.playerTeam[1]?.mercFrozenArmor;
  expect(paid(0)).toEqual({ defense: 120 }); expect(paid(5)).toEqual({ defense: 192 });
});
it('increases paid Minor Heal', () => {
  const heal = (stars: number) => record('mercs/tavern-acolyte-priestess', stars).events.find(e => e.kind === 'heal');
  const base = heal(0), upgraded = heal(5);
  expect(upgraded?.kind === 'heal' ? upgraded.amount : 0).toBeGreaterThan(base?.kind === 'heal' ? base.amount : Infinity);
});
it('captures stronger Pilfer currency find', () => {
  expect(record('mercs/tavern-thief-pickpocket', 0).result.mercPilferGoldFind).toBe(30);
  expect(record('mercs/tavern-thief-pickpocket', 5).result.mercPilferGoldFind).toBe(48);
});
it('increases Battle Orders capacity without applying star stats to the hero', () => {
  const capacity = (stars: number) => record('mercs/act5-barbarian-battle-orders', stars).result.playerTeam[0]?.stats;
  expect(capacity(0)?.lifeMax).toBe(130000); expect(capacity(5)?.lifeMax).toBe(148000);
  expect(capacity(5)?.manaMax).toBe(1480);
});
it('increases Defiance mitigation and Thorns reflection in actual hits', () => {
  const enemy = hit('fixture.enemy', 'enemy');
  const hero = { stats: { ...stats, defense: 40 } };
  const damage = (stars: number) => record('mercs/act2-defiance', stars, hero, enemy).events.find(e => e.kind === 'damage' && e.target === 'hero');
  const plain = damage(0), upgraded = damage(5);
  expect(upgraded?.kind === 'damage' ? upgraded.amount : Infinity).toBeLessThan(plain?.kind === 'damage' ? plain.amount : 0);
  const reflected = (stars: number) => record('mercs/act2-thorns', stars, {}, enemy).events.find(e => e.kind === 'damage' && e.source === 'hero');
  expect(reflected(0)).toMatchObject({ damageType: 'thorns', amount: 100 });
  expect(reflected(5)).toMatchObject({ damageType: 'thorns', amount: 160 });
});
it('extends paid War Cry control rather than changing its cooldown', () => {
  const status = (stars: number) => record('mercs/act5-barbarian-war-cry', stars, {}, { statuses: [] }).events.flatMap(e =>
    e.kind === 'status-state' ? e.statuses.filter(s => s.id === 'stun' && s.sourceId.includes('mercs/act5')) : [])[0];
  const duration = (stars: number) => {
    const paid = status(stars);
    return paid?.expiresAtMs !== undefined && paid.appliedAtMs !== undefined ? paid.expiresAtMs - paid.appliedAtMs : 0;
  };
  expect(duration(0)).toBe(6000); expect(duration(5)).toBeCloseTo(9600, 12);
});

it('reduces actual Blessed Aim weapon miss thresholds while preserving target stats', () => {
  const real = rngModule.createRng;
  const thresholds = (stars: number) => {
    const values: number[] = [];
    const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
      const rng = real(seed);
      return { ...rng, chance: probability => { values.push(probability); return rng.chance(probability); } };
    });
    try {
      record('mercs/act2-blessed-aim', stars,
        { statuses: [], basicAttack: { damageType: 'physical', damage: [100, 100] }, basicAttackDelivery: 'melee' },
        { stats: { ...stats, physDodge: .6 } });
      return values;
    } finally { spy.mockRestore(); }
  };
  // Existing accuracy combines the .15 base miss and .6 physical dodge before Aim.
  expect(thresholds(0).some(value => Math.abs(value - .475) < 1e-12)).toBe(true);
  expect(thresholds(5).some(value => Math.abs(value - .61) < 1e-12)).toBe(true);
});
it('captures independent paid Inner Sight potency on the finite status', () => {
  const out = record('mercs/act1-rogue-inner-sight', 5);
  const paid = out.events.flatMap(e => e.kind === 'status-state' ? e.statuses.filter(s => s.id === 'merc-inner-sight') : [])[0];
  expect(paid?.innerSight).toEqual({ defenseReductionPct: 40 });
});

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as boneArmor from '../skills/bone-armor';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs });
function fixture() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act3-iron-wolf-frozen-armor');
  if (!def) throw new Error('Missing native Iron Wolf Armor');
  const native = mercToCombatUnit(createMercFromDef(def, 'armor-supplemental'));
  const merc: CombatUnit = { ...native, life: 10000, mana: 1000000, statuses: [hold(401)],
    stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 1000000, manaMax: 1000000,
      attack: 1, attackSpeed: 263, defense: 20, magicResist: 0, critChance: 0,
      critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const attacker: CombatUnit = { ...merc, id: 'attacker', name: 'attacker', kind: 'monster',
    side: 'enemy', level: 99, skillOrder: [], cooldowns: {}, activeBuffIds: [],
    statuses: [hold(1701), { id: 'poison', sourceId: 'fixture', stacks: 1,
      remaining: -1, dotPerStack: 500, damageType: 'poison' }], life: 1000,
    basicAttackDelivery: 'melee', attackRange: [300, 300],
    stats: { ...merc.stats, life: 1000, lifeMax: 1000, attack: 300, attackSpeed: 100, defense: 0 } };
  return { merc, attacker };
}
function snapshot(merc: CombatUnit, attacker: CombatUnit): CombatSnapshot {
  const opponent: CombatUnit = { ...merc, id: 'qualification-opponent', kind: 'hero', side: 'player',
    statuses: [hold()], skillOrder: [] };
  return merc.side === 'enemy'
    ? { seed: 7, playerTeam: [opponent], enemyTeam: [merc, attacker] }
    : { seed: 7, playerTeam: [merc], enemyTeam: [attacker] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function incoming(out: ReturnType<typeof record>) {
  return out.events.filter(event => event.kind === 'damage' && event.source === 'attacker');
}
function chills(out: ReturnType<typeof record>) {
  return out.events.filter(event => event.kind === 'status' && event.target === 'attacker' && event.statusId === 'chill');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('pays one ordinary action, publishes actual CD6, and normalizes bare markers', () => {
  const { merc, attacker } = fixture();
  const out = record(snapshot({ ...merc, activeBuffIds: ['unrelated', 'mskill-frozen-armor',
    'frozen_armor', 'frozen_armor'] }, attacker));
  expect(out.events.filter(event => event.kind === 'action' && event.actor === merc.id)).toEqual([
    expect.objectContaining({ skillId: 'mskill-frozen-armor', simClockMs: 400 })]);
  expect(out.result.playerTeam[0]?.activeBuffIds).toEqual(['unrelated', 'frozen_armor']);
  expect(out.result.playerTeam[0]?.cooldowns['mskill-frozen-armor']).toBe(4400);
  expect(out.result.playerTeam[0]?.mana).toBe(1000000);
  expect(out.result.playerTeam[0]?.stats).toEqual(merc.stats);
});

it.each([
  { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
  { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
  { side: 'enemy' as const }, { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 }
])('never grants paid potency to an ineligible factory body %j', patch => {
  const { merc, attacker } = fixture(), out = record(snapshot({ ...merc, ...patch }, attacker));
  const body = [...out.result.playerTeam, ...out.result.enemyTeam].find(unit => unit.id === merc.id);
  expect(body).toBeDefined();
  expect(body).not.toHaveProperty('mercFrozenArmor');
  if (patch.side === 'enemy') expect(out.events).toContainEqual(
    expect.objectContaining({ kind: 'action', actor: merc.id, skillId: null, simClockMs: 400 }));
  expect(out.events.some(event => event.kind === 'action' && event.actor === merc.id &&
    event.skillId === 'mskill-frozen-armor')).toBe(false);
});

it('rejects a custom same-ID native replacement before ordinary payment', () => {
  const skill = getSkill('mskill-frozen-armor');
  if (!skill) throw new Error('Missing native Armor');
  registerSkill({ ...skill });
  const { merc, attacker } = fixture(), out = record(snapshot(merc, attacker));
  expect(out.result.playerTeam[0]).not.toHaveProperty('mercFrozenArmor');
  expect(out.events.some(event => event.kind === 'action' && event.skillId === skill.id)).toBe(false);
});

it.each(['melee', 'ranged', 'spell', 'none', undefined] as const)(
  'uses whole basic delivery %s independently of basicHit', delivery => {
    const { merc, attacker } = fixture();
    const { basicAttackDelivery: _previous, ...body } = attacker;
    const out = record(snapshot(merc, { ...body, ...(delivery ? { basicAttackDelivery: delivery } : {}) }));
    expect(incoming(out)).toEqual([expect.objectContaining({ amount: 160, dodged: false, simClockMs: 1700 })]);
    expect(chills(out)).toHaveLength(delivery === 'melee' ? 1 : 0);
  });

it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'keeps a classified constructed melee body contact independent of its %s element', damageType => {
    const { merc, attacker } = fixture(), out = record(snapshot(merc,
      { ...attacker, basicAttack: { damageType, damage: [300, 300] } }));
    expect(incoming(out)).toEqual([expect.objectContaining({ damageType, amount: ['cold', 'lightning', 'arcane'].includes(damageType) ? 300 : 160 })]);
    expect(chills(out)).toHaveLength(1);
  });

it('does not react to a missed whole strike', () => {
  const { merc, attacker } = fixture(), out = record({ ...snapshot(
    { ...merc, stats: { ...merc.stats, physDodge: 1 } }, attacker), seed: 4 });
  expect(incoming(out)).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  expect(chills(out)).toEqual([]);
});

it('uses the positive prebarrier amount at the barrier settlement seam', () => {
  const { merc, attacker } = fixture(), ordinary = boneArmor.absorbBoneArmor;
  // Native personal barriers are hero-only. This seam checks reaction placement,
  // and does not claim that a native mercenary can acquire Bone Armor.
  vi.spyOn(boneArmor, 'absorbBoneArmor').mockImplementation((unit, amount) =>
    unit.id === merc.id ? { unit, damage: 0, absorbed: amount } : ordinary(unit, amount));
  const out = record(snapshot(merc, attacker));
  expect(incoming(out)).toEqual([expect.objectContaining({ amount: 0, absorbed: 160 })]);
  expect(chills(out)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(10000);
});

it('retains the pre-hit wearer reaction after a lethal wearer hit', () => {
  const { merc, attacker } = fixture(), out = record(snapshot({ ...merc, life: 1 }, attacker));
  expect(incoming(out)).toEqual([expect.objectContaining({ amount: 160 })]);
  expect(chills(out)).toHaveLength(1);
  const damageIndex = out.events.findIndex(event => event.kind === 'damage' && event.source === attacker.id);
  const chillIndex = out.events.findIndex(event => event.kind === 'status' && event.statusId === 'chill');
  const deathIndex = out.events.findIndex(event => event.kind === 'death' && event.target === merc.id);
  expect(damageIndex).toBeLessThan(chillIndex);
  expect(chillIndex).toBeLessThan(deathIndex);
});

it.each(['mskill-jab', 'monster.weak_melee', 'monster.whirlwind'])(
  'resolves native melee %s at actual skill dispatch', skillId => {
    const { merc, attacker } = fixture(), out = record(snapshot(merc,
      { ...attacker, skillOrder: [skillId], basicAttackDelivery: 'ranged' }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: attacker.id, skillId }));
    expect(incoming(out).some(event => event.kind === 'damage' && event.amount > 0)).toBe(true);
    expect(chills(out)).toHaveLength(incoming(out).length);
  });

it.each(['mskill-basic-arrow', 'mskill-fire-arrow', 'mskill-cold-arrow', 'monster.lightning_bolt'])(
  'keeps native ranged/spell %s noncontact even on a melee body', skillId => {
    const { merc, attacker } = fixture();
    const body = skillId === 'monster.lightning_bolt' ? { ...attacker, life: 1500,
      stats: { ...attacker.stats, life: 1500, lifeMax: 1500 } } : attacker;
    const out = record(snapshot(merc, { ...body, skillOrder: [skillId] }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: attacker.id, skillId }));
    expect(incoming(out).some(event => event.kind === 'damage' && event.amount > 0)).toBe(true);
    expect(chills(out)).toEqual([]);
  });

it('keeps a replaced same-ID melee skill unknown at dispatch', () => {
  const original = getSkill('monster.weak_melee');
  if (!original) throw new Error('Missing native melee skill');
  registerSkill({ ...original });
  const { merc, attacker } = fixture(), out = record(snapshot(merc,
    { ...attacker, skillOrder: [original.id] }));
  expect(incoming(out).some(event => event.kind === 'damage' && event.amount > 0)).toBe(true);
  expect(chills(out)).toEqual([]);
});

it('keeps already paid capture after a custom registry replacement', () => {
  const { merc, attacker } = fixture(), first = record(snapshot(merc, attacker));
  const paid = first.result.playerTeam[0], skill = getSkill('mskill-frozen-armor');
  if (!paid || !skill) throw new Error('Missing actual paid Armor');
  expect(paid).toHaveProperty('mercFrozenArmor', { defense: 120 });
  registerSkill({ ...skill, cooldown: 1 });
  const out = record(snapshot({ ...paid, statuses: [hold()], life: 10000 }, attacker));
  expect(incoming(out)).toEqual([expect.objectContaining({ amount: 160 })]);
  expect(chills(out)).toHaveLength(1);
  expect(out.events.some(event => event.kind === 'action' && event.actor === merc.id)).toBe(false);
  expect(out.result.playerTeam[0]).toHaveProperty('mercFrozenArmor', { defense: 120 });
});

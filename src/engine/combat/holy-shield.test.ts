import { afterEach, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { payHolyShield } from '../skills/holy-shield';
import { payCycloneArmor } from '../skills/cyclone-armor';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: at });
const poison: ActiveStatus = { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 10,
  appliedAtMs: 0, expiresAtMs: 10000, dotPerStack: 10, damageType: 'poison' };
function unit(id: string, side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 100, statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }, ...patch };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), r = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(r);
  expect(runBattle(input)).toEqual(r.result); return r;
}
function incoming(type: DamageType) {
  registerSkill({ id: 'fixture.holy-shield-hit', archetype: 'fixture', target: 'single-enemy',
    cooldown: 100, minLevel: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  const hero = payHolyShield(unit('hero', 'player', { holyShieldRank: 20, statuses: [hold()] }));
  return { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', {
    skillOrder: ['fixture.holy-shield-hit'], statuses: [hold(1701)] })] };
}
function periodic(patch: Partial<CombatUnit> = {}, boundaries: readonly number[] = []) {
  const hero = payHolyShield(unit('hero', 'player', { holyShieldRank: 20, ...patch }));
  const statuses = [hold(), poison, ...boundaries.map(at => ({ ...hold(), id: 'fixture-boundary',
    expiresAtMs: at }))];
  return record({ seed: 7, playerTeam: [{ ...hero, statuses: patch.statuses ?? statuses }],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'applies paid one actual %s reduction without base-stat changes', type => {
    const input = incoming(type), r = record(input);
    expect(r.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: type, amount: 60, holyShieldAbsorbed: 40 })]);
    expect(r.result.playerTeam[0]).toMatchObject({ life: 940, mana: 100 });
    expect(r.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  });

it('does not re-mitigate preexisting poison, and finds the exact floor-aware lethal instant', () => {
  expect(periodic().result.playerTeam[0]?.life).toBe(940);
  const r = periodic({ life: 4 });
  expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 600 });
  expect(r.result.playerTeam[0]?.life).toBe(0);
});
it('does not change periodic rounding when irrelevant clock boundaries are added', () => {
  const plain = periodic({ holyShieldRank: 1 }), divided = periodic({ holyShieldRank: 1 },
    [50, 100, 200, 333, 500, 700, 999, 1001, 1900, 3900, 4001, 5500]);
  expect(plain.result.playerTeam[0]?.life).toBe(902);
  expect(divided.result.playerTeam[0]?.life).toBe(902);
  for (const r of [plain, divided]) expect(r.events.reduce((n, e) =>
    n + (e.kind === 'dot' ? e.holyShieldAbsorbed ?? 0 : 0), 0)).toBe(2);
});
it('starts the periodic quota at the real paid cast, without retroactive absorption', () => {
  const hero = unit('hero', 'player', { holyShieldRank: 20, skillOrder: ['paladin.holy_shield'],
    skillLevels: { 'paladin.holy_shield': 20 }, statuses: [hold(1701), poison] });
  const r = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(r.result.playerTeam[0]).toMatchObject({ life: 933, mana: 69 });
  expect(r.events.reduce((n, e) => n + (e.kind === 'dot' ? e.holyShieldAbsorbed ?? 0 : 0), 0)).toBe(33);
});
it('shares exact lethal prediction with trusted synthetic Energy Shield and Bone Armor', () => {
  const bone: ActiveStatus = { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1,
    boneArmor: { rank: 1, remaining: 12 } };
  const r = periodic({ life: 1, mana: 3, energyShieldRank: 20, statuses: [hold(), poison, bone] });
  expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 2600 });
  expect(r.events.filter(e => e.kind === 'dot')).toEqual([
    expect.objectContaining({ simClockMs: 1700, amount: 0, absorbed: 8, holyShieldAbsorbed: 6 }),
    expect.objectContaining({ simClockMs: 2600, amount: 1, absorbed: 4, holyShieldAbsorbed: 4 })]);
});
it('keeps Shatter lethal and reports Holy Shield separately from Bone Armor', () => {
  const input = incoming('physical'), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing paid Holy Shield fixture');
  const r = record({ ...input, playerTeam: [{ ...hero, life: 100,
    statuses: [{ id: 'freeze', sourceId: 'enemy', stacks: 1, remaining: -1 }] }] });
  expect(r.result.winner).toBe('enemy'); expect(r.result.playerTeam[0]?.life).toBe(0);
  expect(r.events.find(e => e.kind === 'damage')).toMatchObject({ amount: 101, holyShieldAbsorbed: 66 });
});
it('reduces reflected Thorns after actual HP loss, without recursive reflection', () => {
  const hero = payHolyShield(unit('hero', 'player', { holyShieldRank: 20, statuses: [hold(1701)] }));
  const r = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', {
    statuses: [hold()], physicalReflectionPct: 1 })] });
  expect(r.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ target: 'enemy', amount: 100 }),
    expect.objectContaining({ target: 'hero', damageType: 'thorns', amount: 60, holyShieldAbsorbed: 40 })]);
  expect(r.result.playerTeam[0]?.life).toBe(940);
});
it('never recasts an active paid armor and refuses contradictory registry overrides before payment', () => {
  const paid = payHolyShield(unit('hero', 'player', { holyShieldRank: 20,
    skillOrder: ['paladin.holy_shield'], skillLevels: { 'paladin.holy_shield': 20 }, statuses: [hold(1701)] }));
  const r = record({ seed: 7, playerTeam: [paid], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana')).toEqual([]);
  const skill = getSkill('paladin.holy_shield');
  if (!skill) throw new Error('Missing registered Holy Shield');
  registerSkill({ ...skill, manaCost: 0 });
  const { holyShield, ...unpaid } = paid; void holyShield;
  const denied = record({ seed: 7, playerTeam: [{ ...unpaid, activeBuffIds: [] }],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(denied.events.filter(e => e.kind === 'buff' || e.kind === 'mana')).toEqual([]);
  expect(denied.result.playerTeam[0]?.holyShield).toBeUndefined();
});

it.each([{ mana: 34, cooldowns: {} }, { mana: 100, cooldowns: { 'skills-paladin-holy-shield': 100000 } }])(
  'refuses an unaffordable or cooling native cast without payment or power', patch => {
    const hero = unit('hero', 'player', { holyShieldRank: 1, skillOrder: ['paladin.holy_shield'],
      skillLevels: { 'paladin.holy_shield': 1 }, statuses: [hold(1701)], ...patch });
    const r = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
    expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana')).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(patch.mana);
    expect(r.result.playerTeam[0]?.holyShield).toBeUndefined();
  });
it('does not absorb a dodge or add RNG draws to the ordinary direct-damage path', () => {
  const input = incoming('fire'), paid = input.playerTeam[0];
  if (!paid) throw new Error('Missing paid fixture');
  const { holyShield, ...unpaid } = paid; void holyShield;
  const plain = record({ ...input, playerTeam: [{ ...unpaid, activeBuffIds: [] }] });
  const defended = record(input);
  const signature = (r: typeof plain) => r.events.flatMap(e => e.kind === 'damage'
    ? [[e.source, e.target, e.crit, e.dodged, e.simClockMs]] : []);
  expect(signature(defended)).toEqual(signature(plain));
  const missed = record({ ...input, seed: 123456789,
    playerTeam: [{ ...paid, stats: { ...paid.stats, magicDodge: 1 } }] });
  expect(missed.events.find(e => e.kind === 'damage')).toMatchObject({ dodged: true, amount: 0 });
  expect(missed.events.some(e => e.kind === 'damage' && e.holyShieldAbsorbed !== undefined)).toBe(false);
  expect(missed.result.playerTeam[0]?.life).toBe(1000);
});
it.each([1699, 1700, 1701])('honors the exact carried cooldown expiry at %ims', expires => {
  const hero = unit('hero', 'player', { holyShieldRank: 1, skillOrder: ['paladin.holy_shield'],
    skillLevels: { 'paladin.holy_shield': 1 }, statuses: [hold(1701)],
    cooldowns: { 'skills-paladin-holy-shield': expires } });
  const r = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(r.events.filter(e => e.kind === 'buff')).toHaveLength(expires <= 1700 ? 1 : 0);
  expect(r.result.playerTeam[0]?.mana).toBe(expires <= 1700 ? 65 : 100);
  expect(r.result.playerTeam[0]?.holyShield?.rank).toBe(expires <= 1700 ? 1 : undefined);
});

it('keeps successive Cyclone/Holy periodic reductions invariant under extra boundaries', () => {
  const paid = payCycloneArmor(payHolyShield(unit('hero', 'player', {
    holyShieldRank: 20, cycloneArmorRank: 1 })));
  for (const times of [[], [50, 100, 200, 333, 500, 999, 1001, 5500, 9999]]) {
    const hero = { ...paid, statuses: [hold(), poison, ...times.map(expiresAtMs => ({
      ...hold(), id: 'irrelevant-boundary', expiresAtMs }))] };
    const r = record({ seed: 7, playerTeam: [hero],
      enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
    expect(r.result.playerTeam[0]?.life).toBe(941);
    expect(r.events.reduce((n, e) => n + (e.kind === 'dot' ? e.cycloneAbsorbed ?? 0 : 0), 0)).toBe(2);
    expect(r.events.reduce((n, e) => n + (e.kind === 'dot' ? e.holyShieldAbsorbed ?? 0 : 0), 0)).toBe(39);
  }
});

it('takes the paid Holy baseline after existing Cyclone reduction without retroactive credit', () => {
  const hero = payCycloneArmor(unit('hero', 'player', { holyShieldRank: 20, cycloneArmorRank: 1,
    skillOrder: ['paladin.holy_shield'], skillLevels: { 'paladin.holy_shield': 20 },
    statuses: [hold(1701), poison] }));
  const r = record({ seed: 7, playerTeam: [hero],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(r.result.playerTeam[0]).toMatchObject({ life: 934, mana: 69 });
  expect(r.events.reduce((n, e) => n + (e.kind === 'dot' ? e.holyShieldAbsorbed ?? 0 : 0), 0)).toBe(32);
});

it('refuses extra contradictory registered effects before taking mana', () => {
  const skill = getSkill('paladin.holy_shield');
  if (!skill) throw new Error('Missing registered Holy Shield');
  registerSkill({ ...skill, effects: [{ kind: 'buff', id: 'holy-shield', duration: -1,
    holyShield: true, cycloneArmor: true }] });
  const r = record({ seed: 7, playerTeam: [unit('hero', 'player', { holyShieldRank: 20,
    skillOrder: ['paladin.holy_shield'], statuses: [hold(1701)] })],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
  expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana')).toEqual([]);
  expect(r.result.playerTeam[0]?.mana).toBe(100);
  expect(r.result.playerTeam[0]?.holyShield).toBeUndefined();
});

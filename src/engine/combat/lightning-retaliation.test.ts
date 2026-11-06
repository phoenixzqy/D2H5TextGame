import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as rngModule from '../rng';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageEffect } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: at });
const tuning = { chance: 0.25, damage: [40, 60] as const };
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 100, stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
      attack: 10, defense: 0, magicResist: 0, attackSpeed: 263, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function fixture(effect?: Partial<DamageEffect>): CombatSnapshot {
  if (effect) registerSkill({ id: 'fixture.direct-hit', archetype: 'fixture', target: 'single-enemy',
    cooldown: 100, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'fire', base: [20, 20], ...effect }] });
  return { seed: 7, maxRounds: 1,
    playerTeam: [{ ...unit('hero', 'player'), statuses: [hold(401)],
      skillOrder: effect ? ['fixture.direct-hit'] : [] }],
    enemyTeam: [{ ...unit('carrier', 'enemy'), lightningRetaliation: tuning }] };
}
/** Control only RNG outcomes; real damage, statuses, scheduling and settlement remain. */
function control(procDraw = 0, endpoint: 'min' | 'max' = 'min') {
  const rng = rngModule.createRng(7);
  const chance = vi.spyOn(rng, 'chance').mockImplementation(p => p === 0.25 ? procDraw < p : p > 0.05);
  vi.spyOn(rng, 'nextInt').mockImplementation((lo, hi) => endpoint === 'min' ? lo : hi);
  vi.spyOn(rngModule, 'createRng').mockReturnValue(rng);
  return chance;
}
function bolts(out: ReturnType<typeof runBattleRecorded>) {
  return out.events.filter(e => e.kind === 'damage' && e.source === 'carrier' && e.damageType === 'lightning');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it.each(['basic', 'spell', 'projectile', 'mixed'] as const)('retaliates once after a landed %s strike without an action or payment', kind => {
  const input = fixture(kind === 'basic' ? undefined : kind === 'projectile' ? { projectileFlightMs: 200 }
    : kind === 'mixed' ? { damageType: 'physical', components: [
      { damageType: 'physical', weight: 1 }, { damageType: 'cold', weight: 1 }] } : {});
  const before = structuredClone(input), chance = control();
  const out = runBattleRecorded(input);
  expect(bolts(out)).toEqual([expect.objectContaining({ target: 'hero', amount: 40, crit: false, dodged: false,
    simClockMs: kind === 'projectile' ? 600 : 400 })]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ actor: 'hero' })]);
  expect(out.events.filter(e => e.kind === 'mana')).toEqual([]);
  expect(out.result.enemyTeam[0]?.mana).toBe(100);
  expect(input).toEqual(before);
});

it.each([[0.249999, 1], [0.25, 0], [0.999999, 0]])('uses one authored 25%% roll at draw %s', (draw, count) => {
  const input = fixture(), chance = control(draw);
  expect(bolts(runBattleRecorded(input))).toHaveLength(count);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toHaveLength(1);
});

it.each(['min', 'max'] as const)('uses the %s authored bolt endpoint with ordinary resistance and crit', endpoint => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  control(0, endpoint);
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
    stats: { ...hero.stats, resistances: { ...hero.stats.resistances, lightning: 50 } } }],
    enemyTeam: [{ ...carrier, stats: { ...carrier.stats, attack: 999999, critChance: 1 } }] });
  expect(bolts(out)).toEqual([expect.objectContaining({ amount: endpoint === 'min' ? 40 : 60, crit: true })]);
});

it('lets the bolt consume the attacker shield without removing HP', () => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  const shield = (sourceId: string): ActiveStatus => ({ id: 'bone-armor', sourceId, stacks: 1, remaining: -1,
    boneArmor: { rank: 20, remaining: 100 } });
  control();
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [...hero.statuses, shield('hero')] }],
    enemyTeam: [carrier] });
  expect(out.events.filter(e => e.kind === 'damage')).toMatchObject([
    { source: 'hero', amount: 10 }, { source: 'carrier', amount: 0, absorbed: 40 }]);
  expect(out.result.playerTeam[0]?.life).toBe(1000);
  expect(out.result.enemyTeam[0]?.life).toBe(990);
});

it.each(['miss', 'zero', 'lethal', 'thorns-kill'] as const)('does not roll or retaliate after %s', boundary => {
  const input = fixture();
  const hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  const chance = control();
  const out = runBattleRecorded({ ...input,
    playerTeam: [{ ...hero, ...(boundary === 'thorns-kill' ? { life: 1 } : {}) }],
    enemyTeam: [{ ...carrier, ...(boundary === 'lethal' ? { life: 1, tier: 'champion' as const } : {}),
      ...(boundary === 'zero' ? { damageImmunities: ['physical' as const] } : {}),
      ...(boundary === 'thorns-kill' ? { physicalReflectionPct: 1 } : {}),
      stats: { ...carrier.stats, physDodge: boundary === 'miss' ? 1 : 0 } }] });
  expect(bolts(out)).toEqual([]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toEqual([]);
  if (boundary === 'thorns-kill') expect(out.result.playerTeam[0]?.life).toBe(0);
});

it.each([{ ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'template' },
  { summon: true }, { kind: 'summon' as const }, { life: 0 }])('does not grant original enemy authority to %j', patch => {
  const input = fixture(), carrier = input.enemyTeam[0];
  if (!carrier) throw new Error('Missing fixture');
  const chance = control();
  expect(bolts(runBattleRecorded({ ...input, enemyTeam: [{ ...carrier, ...patch }] }))).toEqual([]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toEqual([]);
});

it('does not retaliate on periodic damage or a duplicate ID replaced by a plain body', () => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  const chance = control();
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [hold()] }],
    enemyTeam: [{ ...carrier, statuses: [hold(), { id: 'poison', sourceId: 'hero', stacks: 1,
      remaining: -1, dotPerStack: 10, damageType: 'poison' }] }] });
  expect(out.events.some(e => e.kind === 'dot' && e.target === 'carrier')).toBe(true);
  expect(bolts(out)).toEqual([]);
  expect(bolts(runBattleRecorded({ ...input, enemyTeam: [carrier, unit('carrier', 'enemy')] }))).toEqual([]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toEqual([]);
});

it('ignores a fabricated Conversion marker and prevents Frozen Armor reacting to the bolt', () => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  control();
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, frozenArmor: { rank: 1, defensePct: 0.03 },
    activeBuffIds: ['frozen-armor'] }], enemyTeam: [{ ...carrier, statuses: [...carrier.statuses,
      { id: 'converted', sourceId: 'hero', stacks: 1, remaining: -1 }] }] });
  expect(bolts(out)).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'chill')).toEqual([]);
});

it('preserves deterministic native RNG, plain/recorded parity and caller input', () => {
  const input = fixture(), before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
});

it('does not retaliate against a paid cold armor counterattack', () => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  const chance = control();
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [hold()],
    coldArmorRanks: { 'shiver-armor': 1, 'chilling-armor': 0 },
    coldArmors: { 'shiver-armor': { sourceId: 'hero', rank: 1 } }, activeBuffIds: ['shiver-armor'] }],
    enemyTeam: [{ ...carrier, statuses: [hold(401)] }] });
  expect(out.events.filter(e => e.kind === 'damage')).toMatchObject([
    { source: 'carrier', target: 'hero', damageType: 'physical' },
    { source: 'hero', target: 'carrier', damageType: 'cold' }]);
  expect(bolts(out)).toEqual([]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toEqual([]);
});

it('suppresses hostile retaliation while authentic Conversion is paid and active', () => {
  const input = fixture(), hero = input.playerTeam[0], carrier = input.enemyTeam[0];
  if (!hero || !carrier) throw new Error('Missing fixture');
  registerSkill({ id: 'fixture.hostile-area', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'fire', base: [20, 20] }] });
  control();
  const other = unit('other', 'enemy');
  const out = runBattleRecorded({ ...input,
    playerTeam: [{ ...hero, conversionRank: 1, mana: 25, skillLevels: { 'paladin.conversion': 1 },
      skillOrder: ['paladin.conversion'], statuses: [hold(501)], stats: { ...hero.stats, attackSpeed: 250 } }],
    enemyTeam: [carrier, { ...other, skillOrder: ['fixture.hostile-area'], statuses: [hold(1301)],
      stats: { ...other.stats, attackSpeed: 150 } }] });
  expect(out.events.find(e => e.kind === 'status' && e.target === 'carrier' && e.statusId === 'converted'))
    .toMatchObject({ simClockMs: 500 });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'other' && e.target === 'carrier'))
    .toMatchObject({ simClockMs: 1300, amount: 20 });
  expect(bolts(out).filter(e => e.simClockMs >= 1300)).toEqual([]);
});

it('retaliates only to the direct strike while preserving all secondary impact bolts', () => {
  const input = fixture({ onHitBolts: { count: 3, targetMode: 'original',
    damage: { min: 10, max: 10, perRank: 0 } } });
  const before = structuredClone(input), chance = control();
  const out = runBattleRecorded(input);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject([
    { damageType: 'fire', amount: 20 },
    { damageType: 'lightning', amount: 10 },
    { damageType: 'lightning', amount: 10 },
    { damageType: 'lightning', amount: 10 }
  ]);
  expect(bolts(out)).toEqual([expect.objectContaining({ target: 'hero', amount: 40 })]);
  expect(chance.mock.calls.filter(([p]) => p === 0.25)).toHaveLength(1);
  expect(out.result.enemyTeam[0]?.life).toBe(950);
  expect(out.result.playerTeam[0]?.life).toBe(960);
  expect(out.events.filter(e => e.kind === 'action')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana')).toEqual([]);
  expect(input).toEqual(before);
});

import { afterEach, expect, it } from 'vitest';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { registerSkill, resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';

import { payCycloneArmor } from '@/engine/skills/cyclone-armor';
import { payHolyShield } from '@/engine/skills/holy-shield';

const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], fields: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 30, tier: 'trash', life: 1000, mana: 0,
    stats: { life: 1000, lifeMax: 1000, mana: 0, manaMax: 0, attack: 10,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...fields };
}
function shield(remaining = 40, rank = 1): ActiveStatus {
  return { id: 'bone-wall', sourceId: 'hero', stacks: 1, remaining: 6, appliedAtMs: 0, expiresAtMs: 6000,
    boneWall: { rank, remaining } } as ActiveStatus;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
  'absorbs mitigated %s damage, consumes once, and records actual HP damage', damageType => {
    registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy',
      cooldown: 100, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType, base: [60, 60] }] });
    const hero = unit('hero', 'player', { statuses: [hold, shield()] });
    const input = { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { skillOrder: ['fixture.hit'] })] };
    const before = structuredClone(input), r = runBattleRecorded(input);
    const first = r.events.find(e => e.kind === 'damage' && e.target === 'hero' && !e.dodged);
    expect(first).toMatchObject({ amount: 20, wallAbsorbed: 40 });
    expect(r.result.playerTeam[0]?.statuses.some(s => s.id === 'bone-wall')).toBe(false);
    expect(r.events.filter(e => e.kind === 'damage' && e.target === 'hero')
      .reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0))
      .toBe(1000 - (r.result.playerTeam[0]?.life ?? 0));
    expect(runBattleRecorded(input)).toEqual(r);
    expect(input).toEqual(before);
  });

it('includes shield capacity in the exact periodic lethal boundary', () => {
  const poison: ActiveStatus = { id: 'poison', sourceId: 'enemy', stacks: 1,
    remaining: 10, appliedAtMs: 0, expiresAtMs: 10_000, dotPerStack: 10, damageType: 'poison' };
  const input = { seed: 7, playerTeam: [unit('hero', 'player', { life: 1, statuses: [hold, shield(), poison] })],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold] })] };
  const r = runBattleRecorded(input);
  expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 4100 });
  const dots = r.events.filter(e => e.kind === 'dot');
  expect(dots.reduce((sum, e) => sum + e.amount, 0)).toBe(1);
  expect(dots.reduce((sum, e) => sum + (e.wallAbsorbed ?? 0), 0)).toBe(40);
  expect(r.result.winner).toBe('enemy');
});

it('absorbs after ordinary mitigation and preserves landed-hit statuses', () => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy',
    cooldown: 100, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [40, 40], applyStatus: { id: 'poison', dotPctOfDamage: 0.1 } }] });
  const hero = unit('hero', 'player', { stats: { ...unit('hero', 'player').stats, defense: 20 },
    statuses: [hold, shield(230, 20)] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero],
    enemyTeam: [unit('enemy', 'enemy', { skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  expect(r.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 0, wallAbsorbed: 20 });
  expect(r.events.some(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'poison')).toBe(true);
  expect(r.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + (e.wallAbsorbed ?? 0), 0)).toBe(8);
  expect(r.result.playerTeam[0]?.life).toBe(998);
  expect(r.result.playerTeam[0]?.statuses.some(s => s.id === 'bone-wall')).toBe(false);
});

it('exhausts shield and life together on a valid Shatter execution', () => {
  const hero = unit('hero', 'player', { life: 100, statuses: [shield(230, 20),
    { id: 'freeze', sourceId: 'enemy', stacks: 1, remaining: -1 }] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')] });
  expect(r.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 100, wallAbsorbed: 230 });
  expect(r.result.playerTeam[0]?.life).toBe(0);
  expect(r.result.winner).toBe('enemy');
});

it('reflects only actual lost HP and absorbs RNG-free thorns through the same pool', () => {
  const hero = unit('hero', 'player', { statuses: [shield()], physicalReflectionPct: 1,
    stats: { ...unit('hero', 'player').stats, attack: 20 } });
  const enemy = unit('enemy', 'enemy', { physicalReflectionPct: 1,
    statuses: [hold] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  const reflection = r.events.find(e => e.kind === 'damage' && e.damageType === 'thorns');
  expect(reflection).toMatchObject({ target: 'hero', amount: 0, wallAbsorbed: 20 });
  // A reflected hit is never recursively reflected.
  expect(r.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns' && e.source === 'hero')).toHaveLength(0);
});

it('does not shift the combat RNG stream when a fully absorbing shield is added', () => {
  const hero = unit('hero', 'player', { statuses: [hold] });
  const enemy = unit('enemy', 'enemy', { statuses: [{ ...hold, appliedAtMs: 5101 }] });
  const snapshot = { seed: 77, playerTeam: [hero], enemyTeam: [enemy] };
  const plain = runBattleRecorded(snapshot), armored = runBattleRecorded({ ...snapshot,
    playerTeam: [{ ...hero, statuses: [hold, shield(230, 20)] }] });
  const signature = (r: typeof plain) => r.events.flatMap(e => e.kind === 'damage'
    ? [[e.source, e.target, e.crit, e.dodged, e.simClockMs]] : []);
  expect(signature(armored)).toEqual(signature(plain));
});

it('settles percentage reductions, Wall, Energy Shield and Bone Armor in that order', () => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'fire', base: [200, 200] }] });
  const hero = payHolyShield(payCycloneArmor(unit('hero', 'player', { mana: 100,
    stats: { ...unit('hero', 'player').stats, manaMax: 100 }, energyShieldRank: 20,
    cycloneArmorRank: 20, holyShieldRank: 20, statuses: [hold, shield(),
      { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 1, remaining: 12 } }] })));
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy',
    { skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  expect(out.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 0,
    cycloneAbsorbed: 80, holyShieldAbsorbed: 32, wallAbsorbed: 40, absorbed: 4 });
  expect(out.result.playerTeam[0]?.mana).toBe(96);
  expect(out.result.playerTeam[0]?.statuses.find(s => s.id === 'bone-armor')?.boneArmor?.remaining).toBe(8);
});
it('does not charge MP early for periodic HP that Wall absorbed before expiry', () => {
  const poison: ActiveStatus = { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 12,
    appliedAtMs: 0, expiresAtMs: 12000, dotPerStack: .5, damageType: 'poison' };
  const boundaries: ActiveStatus[] = [2000, 4000, 6000, 8000, 10000, 12000].map(at => ({
    id: 'diagnostic-boundary-' + String(at), sourceId: 'fixture', stacks: 1, remaining: 1,
    appliedAtMs: at, expiresAtMs: at + 1 }));
  const hero = unit('hero', 'player', { mana: 10, energyShieldRank: 20,
    stats: { ...unit('hero', 'player').stats, manaMax: 10 }, statuses: [hold, poison,
      { ...shield(), appliedAtMs: 500, expiresAtMs: 6500 }, ...boundaries] });
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold] })] };
  const out = runBattleRecorded(input);
  expect(out.events.find(e => e.kind === 'dot' && e.target === 'hero' && e.simClockMs === 8000)).toMatchObject({ amount: 1 });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'energy-shield')).toEqual([
    expect.objectContaining({ simClockMs: 10000, mana: 9 })]);
  expect(out.result.playerTeam[0]?.life).toBe(998);
});
it.each([1700, 1700.001])('settles a direct hit against the exclusive carried expiry %f', expiresAtMs => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'fire', base: [60, 60] }] });
  const hero = unit('hero', 'player', { statuses: [hold,
    { ...shield(), appliedAtMs: expiresAtMs - 6000, expiresAtMs }] });
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy',
    { skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  expect(out.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject(
    expiresAtMs === 1700 ? { simClockMs: 1700, amount: 60 } : { simClockMs: 1700, amount: 20, wallAbsorbed: 40 });
});

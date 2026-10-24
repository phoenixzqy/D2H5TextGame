import { afterEach, expect, it } from 'vitest';
import { runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { registerSkill, resetRegistry, loadDefaultSkills } from '../skills/registry';

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
function shield(remaining = 12, rank = 1): ActiveStatus {
  return { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1,
    boneArmor: { rank, remaining } } as ActiveStatus;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
  'absorbs mitigated %s damage, consumes once, and records actual HP damage', damageType => {
    registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy',
      cooldown: 100, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType, base: [20, 20] }] });
    const hero = unit('hero', 'player', { statuses: [hold, shield()] });
    const input = { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { skillOrder: ['fixture.hit'] })] };
    const before = structuredClone(input), r = runBattleRecorded(input);
    const first = r.events.find(e => e.kind === 'damage' && e.target === 'hero' && !e.dodged);
    expect(first).toMatchObject({ amount: 8, absorbed: 12 });
    expect(r.result.playerTeam[0]?.statuses.some(s => s.id === 'bone-armor')).toBe(false);
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
  expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 1300 });
  expect(r.events.filter(e => e.kind === 'dot')).toEqual([
    expect.objectContaining({ target: 'hero', amount: 1, absorbed: 12, simClockMs: 1300 })
  ]);
  expect(r.result.winner).toBe('enemy');
});

it('keeps a partially spent pool and never consumes it on misses', () => {
  const hero = unit('hero', 'player', { statuses: [hold, shield(240, 20)] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  const hit = r.events.find(e => e.kind === 'damage' && e.target === 'hero');
  expect(hit).toMatchObject({ amount: 0, absorbed: 10 });
  expect(r.result.playerTeam[0]?.statuses.find(s => s.id === 'bone-armor'))
    .toMatchObject({ boneArmor: { rank: 20, remaining: 230 } });
  // Seed7's first hit roll is below the existing5% minimum hit chance even at100% dodge.
  const missed = runBattleRecorded({ seed: 123456789, playerTeam: [{ ...hero, stats: { ...hero.stats, physDodge: 1 } }],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  expect(missed.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ dodged: true, amount: 0 });
  expect(missed.result.playerTeam[0]?.statuses.find(s => s.id === 'bone-armor'))
    .toMatchObject({ boneArmor: { remaining: 240 } });
});

it('absorbs after ordinary mitigation and preserves landed-hit statuses', () => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy',
    cooldown: 100, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [40, 40], applyStatus: { id: 'poison', dotPctOfDamage: 0.1 } }] });
  const hero = unit('hero', 'player', { stats: { ...unit('hero', 'player').stats, defense: 20 },
    statuses: [hold, shield(240, 20)] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero],
    enemyTeam: [unit('enemy', 'enemy', { skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] });
  expect(r.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 0, absorbed: 20 });
  expect(r.events.some(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'poison')).toBe(true);
  expect(r.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + (e.absorbed ?? 0), 0)).toBe(10);
  expect(r.result.playerTeam[0]?.life).toBe(1000);
  expect(r.result.playerTeam[0]?.statuses.find(s => s.id === 'bone-armor')).toMatchObject({ boneArmor: { remaining: 210 } });
});

it('exhausts shield and life together on a valid Shatter execution', () => {
  const hero = unit('hero', 'player', { life: 100, statuses: [shield(240, 20),
    { id: 'freeze', sourceId: 'enemy', stacks: 1, remaining: -1 }] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')] });
  expect(r.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 100, absorbed: 240 });
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
  expect(reflection).toMatchObject({ target: 'hero', amount: 8, absorbed: 12 });
  // A reflected hit is never recursively reflected.
  expect(r.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns' && e.source === 'hero')).toHaveLength(0);
});

it('does not shift the combat RNG stream when a fully absorbing shield is added', () => {
  const hero = unit('hero', 'player', { statuses: [hold] });
  const enemy = unit('enemy', 'enemy', { statuses: [{ ...hold, appliedAtMs: 5101 }] });
  const snapshot = { seed: 77, playerTeam: [hero], enemyTeam: [enemy] };
  const plain = runBattleRecorded(snapshot), armored = runBattleRecorded({ ...snapshot,
    playerTeam: [{ ...hero, statuses: [hold, shield(240, 20)] }] });
  const signature = (r: typeof plain) => r.events.flatMap(e => e.kind === 'damage'
    ? [[e.source, e.target, e.crit, e.dodged, e.simClockMs]] : []);
  expect(signature(armored)).toEqual(signature(plain));
});

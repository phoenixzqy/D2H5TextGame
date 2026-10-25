import { afterEach, expect, it } from 'vitest';
import { runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], fields: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 100, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }, ...fields };
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
const poison: ActiveStatus = { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 10,
  appliedAtMs: 0, expiresAtMs: 10_000, dotPerStack: 10, damageType: 'poison' };
function periodic(hero: Partial<CombatUnit>, boundaries: readonly number[] = []) {
  const statuses = [hold, poison, ...boundaries.map(expiresAtMs => ({ ...hold, id: 'fixture-boundary',
    appliedAtMs: 0, expiresAtMs, remaining: expiresAtMs / 1000 }))];
  return runBattleRecorded({ seed: 7, playerTeam: [unit('hero', 'player', { energyShieldRank: 20, statuses, ...hero })],
    enemyTeam: [unit('enemy', 'enemy', { statuses: [hold] })] });
}

it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'diverts already-mitigated %s damage with absolute MP transport and unchanged seeded replay', damageType => {
    registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
    const hero = unit('hero', 'player', { energyShieldRank: 20, statuses: [hold] });
    const input = { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', {
      skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] };
    const before = structuredClone(input), r = runBattleRecorded(input);
    const firstIndex = r.events.findIndex(e => e.kind === 'damage' && e.target === 'hero');
    expect(r.events[firstIndex]).toMatchObject({ amount: 40, damageType });
    expect(r.events[firstIndex + 1]).toMatchObject({ kind: 'mana', target: 'hero', mana: 40, reason: 'energy-shield' });
    expect(r.result.playerTeam[0]).toMatchObject({ life: 960, mana: 40 });
    expect(runBattleRecorded(input)).toEqual(r); expect(input).toEqual(before);
  });

it('pays after mitigation, preserves hit status potency, and pays nothing on a dodge', () => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
      applyStatus: { id: 'poison', dotPctOfDamage: .1 } }] });
  const hero = unit('hero', 'player', { energyShieldRank: 20, statuses: [hold],
    stats: { ...unit('hero', 'player').stats, defense: 40 } });
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', {
    skillOrder: ['fixture.hit'], statuses: [{ ...hold, appliedAtMs: 1701 }] })] };
  const r = runBattleRecorded(input);
  expect(r.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 24 });
  expect(r.events.find(e => e.kind === 'mana' && e.reason === 'energy-shield')).toMatchObject({ mana: 64 });
  expect(r.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'poison' && s.dotPerStack === 6))).toBe(true);
  const missed = runBattleRecorded({ ...input, seed: 123456789,
    playerTeam: [{ ...hero, stats: { ...hero.stats, physDodge: 1 } }] });
  expect(missed.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ dodged: true, amount: 0 });
  expect(missed.events.some(e => e.kind === 'mana' && e.reason === 'energy-shield')).toBe(false);
});

it.each([{ life: 4, mana: 100, death: 800 }, { life: 4, mana: 2, death: 600 },
  { life: 1, mana: 0, death: 100 }, { life: 1, mana: 100, death: 100 }])(
  'finds the exact periodic lethal instant for $life HP / $mana MP without borrowing recovery', ({ life, mana, death }) => {
    const r = periodic({ life, mana, manaRegenPerSecond: 100 });
    // At8 damage, floor(8×.6)=4: four HP is lethal at800ms, before the continuous estimate1000ms.
    expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: death });
    expect(r.events.some(e => e.kind === 'mana' && e.reason === 'regeneration')).toBe(false);
  });

it('uses one cumulative periodic quota across extra status/action boundaries', () => {
  const a = periodic({ manaRegenPerSecond: 0 });
  const b = periodic({ manaRegenPerSecond: 0 }, [50, 100, 200, 300, 333, 500, 700, 900, 999]);
  expect(a.result.playerTeam[0]?.life).toBe(960); expect(a.result.playerTeam[0]?.mana).toBe(40);
  expect(b.result.playerTeam[0]?.life).toBe(a.result.playerTeam[0]?.life);
  expect(b.result.playerTeam[0]?.mana).toBe(a.result.playerTeam[0]?.mana);
  const c = periodic({ life: 4, mana: 2 }, [50, 100, 200, 300, 333, 500]);
  expect(c.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 600 });
});

it('spends shield MP before a trusted synthetic Bone Armor pool and shares the resulting lethal predicate', () => {
  const bone: ActiveStatus = { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1,
    boneArmor: { rank: 1, remaining: 12 } };
  const r = periodic({ life: 1, mana: 3, statuses: [hold, poison, bone] });
  expect(r.events.find(e => e.kind === 'death' && e.target === 'hero')).toMatchObject({ simClockMs: 1600 });
  expect(r.events.find(e => e.kind === 'mana' && e.reason === 'energy-shield')).toMatchObject({ mana: 0, simClockMs: 1600 });
  expect(r.events.find(e => e.kind === 'dot')).toMatchObject({ amount: 1, absorbed: 12, simClockMs: 1600 });
});

it('keeps Shatter lethal even with finite mana and a trusted synthetic Bone Armor pool', () => {
  const hero = unit('hero', 'player', { life: 100, energyShieldRank: 20,
    statuses: [{ id: 'freeze', sourceId: 'enemy', stacks: 1, remaining: -1 },
      { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')] });
  expect(r.result.winner).toBe('enemy'); expect(r.result.playerTeam[0]?.life).toBe(0);
  expect(r.events.find(e => e.kind === 'mana' && e.reason === 'energy-shield')).toMatchObject({ mana: 0 });
});

it('reflects actual HP loss, pays reflected thorns from mana, and never recursively reflects', () => {
  const hero = unit('hero', 'player', { energyShieldRank: 20, physicalReflectionPct: 1 });
  const enemy = unit('enemy', 'enemy', { statuses: [hold], physicalReflectionPct: 1 });
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  expect(r.events.find(e => e.kind === 'damage' && e.damageType === 'thorns')).toMatchObject({ target: 'hero', amount: 40 });
  expect(r.events.find(e => e.kind === 'mana' && e.reason === 'energy-shield')).toMatchObject({ mana: 40 });
  expect(r.events.some(e => e.kind === 'damage' && e.damageType === 'thorns' && e.source === 'hero')).toBe(false);
});

it('preserves the RNG signature and unaffected full-mana recovery carry', () => {
  const hero = unit('hero', 'player', { statuses: [hold], manaRegenExactCarry: '0.25', manaRegenCarry: .25 });
  const enemy = unit('enemy', 'enemy', { statuses: [{ ...hold, appliedAtMs: 5101 }] });
  const input = { seed: 77, playerTeam: [hero], enemyTeam: [enemy] };
  const plain = runBattleRecorded(input), shield = runBattleRecorded({ ...input, playerTeam: [{ ...hero, energyShieldRank: 20 }] });
  const signature = (r: typeof plain) => r.events.flatMap(e => e.kind === 'damage'
    ? [[e.source, e.target, e.crit, e.dodged, e.simClockMs]] : []);
  expect(signature(shield)).toEqual(signature(plain));
  expect(plain.result.playerTeam[0]?.manaRegenExactCarry).toBe('0.25');
  expect(plain.events.some(e => e.kind === 'mana' && e.reason === 'energy-shield')).toBe(false);
});

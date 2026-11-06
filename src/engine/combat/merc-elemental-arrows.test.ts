import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const realRng = rngModule.createRng;
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-arrow',
  stacks: 1, remaining: -1, appliedAtMs });
function native(name: string): CombatUnit {
  const def = loadMercPool().pool.find(row => row.id === `mercs/${name}`);
  if (!def) throw new Error('Missing native merc');
  return mercToCombatUnit(createMercFromDef(def, 'arrow-combat'));
}
function actor(element = 'fire'): CombatUnit {
  const unit = native(`act1-rogue-${element}`);
  return { ...unit, life: 1000000, mana: 1000000, statuses: [hold(401)],
    stats: { ...unit.stats, life: 1000000, lifeMax: 1000000, mana: 1000000, manaMax: 1000000,
      attack: 10, attackSpeed: 263, critChance: 0, critDamage: 2,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function target(id: string, row: number, col: number): CombatUnit {
  return { ...actor(), id, kind: 'monster', side: 'enemy', skillOrder: [], skillLevels: {},
    statuses: [hold()], gridPosition: { row, col } };
}
function snapshot(unit = actor()): CombatSnapshot {
  return { seed: 7, playerTeam: [unit], enemyTeam: [target('a', 1, 1), target('b', 1, 0),
    target('c', 1, 2), target('d', 0, 1), target('diagonal', 0, 0)] };
}
function record(input: CombatSnapshot) {
  const probabilities: number[] = [];
  const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = realRng(seed);
    return { ...rng, chance: probability => { probabilities.push(probability); return rng.chance(probability); } };
  });
  try {
    const before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    return { ...out, probabilities };
  } finally { spy.mockRestore(); }
}
const hits = (out: ReturnType<typeof record>, source = actor().id) => out.events.flatMap(event =>
  event.kind === 'damage' && event.source === source ? [event] : []);
const amounts = (out: ReturnType<typeof record>) => hits(out).map(event => event.amount);
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('uses one physical-dodge primary, independent magical-dodge splashes and no extra base rolls', () => {
  const input = snapshot(), out = record(input);
  expect(amounts(out)).toEqual([32, 16, 16, 16]);
  expect(out.probabilities).toEqual([.85, 0, 1, .85, 0, 1, .85, 0, 1]);
  expect(hits(out).map(event => event.target)).toEqual(['a', 'a', 'b', 'c']);
});

it('keeps Fire additive source increases single-applied on primary and splash', () => {
  const out = record(snapshot({ ...actor(), increasedDamagePct: { physical: .5, fire: .5 } }));
  expect(amounts(out)).toEqual([48, 24, 24, 24]);
});

it('retains odd unrounded splash payloads until the secondary critical and mitigation', () => {
  const unit = actor(), out = record({ ...snapshot({ ...unit,
    stats: { ...unit.stats, attack: 11, critChance: 1 } }), seed: 7 });
  // Base22 + Attack11 =33: primary66+33. Independent splash16.5*2 =33.
  expect(amounts(out)).toEqual([66, 33, 33, 33]);
  expect(hits(out).every(event => event.crit)).toBe(true);
});

it('rolls secondary criticals independently instead of copying the carrier critical', () => {
  const unit = actor(), out = record(snapshot({ ...unit, stats: { ...unit.stats, critChance: .5 } }));
  expect(hits(out).slice(0, 3).map(event => [event.amount, event.crit]))
    .toEqual([[32, false], [16, false], [32, true]]);
});

it.each(['fire', 'cold'])('mitigates each %s component with its own defenses and resistances', element => {
  const input = snapshot(actor(element));
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(unit => ({ ...unit,
    stats: { ...unit.stats, defense: 6, magicResist: 4,
      resistances: { ...unit.stats.resistances, physical: 25, fire: 50, cold: 50 } } })) });
  expect(hits(out, input.playerTeam[0]?.id).slice(0, 2).map(event => event.amount))
    .toEqual(element === 'fire' ? [18, 2] : [6, 4]);
});

it('shares Cold Attack exactly once and floors each odd half after criticals', () => {
  const unit = actor('cold'), input = snapshot({ ...unit, stats: { ...unit.stats, attack: 11, critChance: 1 } });
  const out = record({ ...input, seed: 19 });
  expect(hits(out, unit.id).map(event => event.amount)).toEqual([37, 37]);
});

it('misses the entire primary together without splash or Burn', () => {
  const out = record({ ...snapshot(), seed: 4 });
  expect(amounts(out)).toEqual([0, 0]);
  expect(out.probabilities).toEqual([.85]);
  expect(out.events.some(event => event.kind === 'status' && event.statusId === 'burn')).toBe(false);
});

it('retains the original splash center after a lethal primary', () => {
  const input = snapshot(), first = input.enemyTeam[0];
  if (!first) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...first, life: 1 }, ...input.enemyTeam.slice(1)] });
  expect(hits(out).map(event => event.target)).toEqual(['a', 'a', 'b', 'c']);
  expect(out.events.filter(event => event.kind === 'death' && event.target === 'a')).toHaveLength(1);
});

it('triggers splash on an absorbed landed carrier', () => {
  const input = snapshot(), out = record({ seed: input.seed,
    enemyTeam: input.playerTeam.map(unit => ({ ...unit, side: 'enemy' })),
    playerTeam: input.enemyTeam.map((unit, index) => ({ ...unit, side: 'player',
      ...(index === 0 ? { kind: 'hero', level: 20, statuses: [...unit.statuses, {
        id: 'bone-armor', sourceId: unit.id, stacks: 1, remaining: -1,
        boneArmor: { rank: 20, remaining: 240 } }] } : {}) })) });
  // Enemy target selection consumes one seeded draw: base36 + Attack10 =46.
  expect(amounts(out)).toEqual([0, 0, 23, 23]);
  expect(hits(out).slice(0, 2).map(event => event.absorbed)).toEqual([46, 23]);
});

it('suppresses remaining auxiliary damage when ordinary reflection kills the source', () => {
  const input = snapshot({ ...actor(), life: 1 });
  const out = record({ ...input, enemyTeam: input.enemyTeam.map((unit, index) =>
    index === 0 ? { ...unit, physicalReflectionPct: 1 } : unit) });
  expect(amounts(out)).toEqual([32, 16]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
});

it('uses hostile insertion order and the cross without refilling beyond two captures', () => {
  const input = snapshot(), out = record({ ...input, enemyTeam: input.enemyTeam.map(unit =>
    unit.id === 'd' ? { ...unit, kind: 'summon', summon: true, ownerId: 'hostile-owner' } : unit) });
  // The later summon cannot displace the original primary or expand its two splash captures.
  expect(hits(out).map(event => event.target)).toEqual(['a', 'a', 'b', 'c']);
});

it('applies canonical Fire Burn rate per second, then expires it at3000ms', () => {
  const out = record(snapshot());
  const state = out.events.find(event => event.kind === 'status-state' &&
    event.target === 'b' && event.simClockMs === 400);
  if (!state || state.kind !== 'status-state') throw new Error('Missing Fire status state');
  expect(state.statuses).toContainEqual(expect.objectContaining({ id: 'ignite', dotPerStack: 1,
    appliedAtMs: 400, expiresAtMs: 3400 }));
  expect(out.events.flatMap(event => event.kind === 'dot' && event.target === 'b' ? [event.amount] : [])
    .reduce((sum, amount) => sum + amount, 0)).toBe(3);
});

it('uses Aim only for the authenticated primary, retaining ordinary splash accuracy', () => {
  const input = snapshot(), aim = native('act2-blessed-aim');
  const out = record({ ...input, playerTeam: [...input.playerTeam, { ...aim, statuses: [hold()] }] });
  expect(out.probabilities.filter(p => p > 0 && p < 1)).toEqual([.895, .85, .85]);
  const skill = getSkill('mskill-fire-arrow');
  if (!skill) throw new Error('Missing native Fire');
  expect(getSkillDamageDelivery(skill)).toBe('ranged');
});

it.each([7, 3])('rolls one Cold proc with real seed%i and preserves canonical expiry', seed => {
  const unit = actor('cold'), out = record({ ...snapshot(unit), seed });
  expect(out.probabilities).toEqual([.85, 0, .3]);
  expect(out.events.filter(event => event.kind === 'status' && event.statusId === 'chill')).toHaveLength(seed === 3 ? 1 : 0);
  if (seed === 3) {
    const state = out.events.find(event => event.kind === 'status-state' &&
      event.target === 'a' && event.simClockMs === 400);
    if (!state || state.kind !== 'status-state') throw new Error('Missing Cold status state');
    expect(state.statuses).toContainEqual(expect.objectContaining({ id: 'chill', expiresAtMs: 2400 }));
  }
});

it.each([undefined, { row: -1, col: 1 }])('normalizes missing or invalid center %j before capturing splash', gridPosition => {
  const input = snapshot();
  const out = record({ ...input, enemyTeam: input.enemyTeam.map((unit, index) => {
    if (index !== 0) return unit;
    const { gridPosition: _old, ...body } = unit;
    return { ...body, ...(gridPosition ? { gridPosition } : {}) };
  }) });
  expect(amounts(out)).toEqual([32, 16, 16, 16]);
  expect(out.result.enemyTeam[0]?.gridPosition).toEqual({ row: 1, col: 1 });
});

it('keeps a distant valid center outside every other body cross', () => {
  const input = snapshot(), out = record({ ...input, enemyTeam: input.enemyTeam.map((unit, index) =>
    index === 0 ? { ...unit, gridPosition: { row: 9, col: 9 } } : unit) });
  expect(amounts(out)).toEqual([32, 16]);
});

it('uses magical dodge for splash while the whole primary uses physical dodge', () => {
  const input = snapshot(), out = record({ ...input, enemyTeam: input.enemyTeam.map(unit => ({
    ...unit, stats: { ...unit.stats, magicDodge: 1 } })) });
  expect(amounts(out)).toEqual([32, 16, 0, 0]);
  expect(out.probabilities.filter(p => p > 0 && p < 1)).toEqual([.85, .05, .05]);
});

it('excludes initially dead and friendly bodies from the captured cross', () => {
  const input = snapshot(), out = record({ ...input,
    playerTeam: [...input.playerTeam, { ...target('friendly', 1, 0), side: 'player' }],
    enemyTeam: input.enemyTeam.map(unit => unit.id === 'b' ? { ...unit, life: 0 } : unit) });
  expect(hits(out).map(event => event.target)).toEqual(['a', 'a', 'c', 'd']);
});

it('keeps separately paid Enchant Fire out of authored arrow Burn and splash budgets', () => {
  const unit = actor(), hero: CombatUnit = { ...unit, kind: 'hero', level: 30,
    skillOrder: ['sorceress.enchant', 'mskill-fire-arrow'],
    skillLevels: { 'sorceress.enchant': 20, 'mskill-fire-arrow': 1 },
    sorceressBuffRanks: { teleport: 0, enchant: 20 }, statuses: [hold(801)],
    stats: { ...unit.stats, attack: 1000 } };
  const out = record(snapshot(hero));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'buff', buffId: 'enchant', simClockMs: 400 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana', reason: 'cast', mana: 999981 }));
  expect(amounts(out)).toEqual([1022, 511, 400, 511, 511]);
  const burns = out.events.flatMap(event => event.kind === 'status-state' && event.target === 'a'
    ? event.statuses.filter(status => status.id === 'ignite') : []);
  expect(burns).toContainEqual(expect.objectContaining({ stacks: 1, dotPerStack: 51,
    appliedAtMs: 800, expiresAtMs: 3800 }));
  expect(burns.every(status => status.stacks === 1 && status.dotPerStack === 51)).toBe(true);
});

it.each(['fire', 'cold'])('keeps actual paid mercenary Armor noncontact for the native %s arrow', element => {
  const body = native('act3-iron-wolf-frozen-armor'), template = actor();
  const wearer: CombatUnit = { ...body, life: 1000000, mana: 1000000,
    gridPosition: { row: 1, col: 1 }, statuses: [hold(401)],
    stats: { ...template.stats, defense: 0 } };
  const shooter = { ...actor(element), side: 'enemy' as const };
  const out = record({ seed: 7, playerTeam: [wearer,
    { ...target('armor-neighbor', 1, 0), side: 'player' }], enemyTeam: [shooter] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: wearer.id,
    skillId: 'mskill-frozen-armor', simClockMs: 400 }));
  expect(out.result.playerTeam[0]).toHaveProperty('mercFrozenArmor', { defense: 120 });
  expect(hits(out, shooter.id).some(event => event.target === wearer.id && event.amount > 0)).toBe(true);
  expect(out.events.some(event => event.kind === 'status' && event.target === shooter.id && event.statusId === 'chill')).toBe(false);
});

it('changes actual Cold target cadence until its2000ms expiry without mutating speed', () => {
  const input = snapshot(actor('cold')), first = input.enemyTeam[0];
  if (!first) throw new Error('Missing target');
  const out = record({ ...input, seed: 3, enemyTeam: [{ ...first, statuses: [],
    stats: { ...first.stats, attackSpeed: 100 } }, ...input.enemyTeam.slice(1)] });
  const times = out.events.flatMap(event => event.kind === 'action' && event.actor === 'a' ? [event.simClockMs] : []);
  expect(times[0]).toBeCloseTo(32800 / 17, 8);
  expect(times[1]).toBeCloseTo(3700, 8);
  expect(times[2]).toBeCloseTo(5400, 8);
  expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
});

it.each(['fire', 'cold'])('replays native %s deterministically and rebuilds fresh projection state', element => {
  const input = snapshot(actor(element)), { probabilities: _probabilities, ...out } = record(input);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  resetRegistry(); loadDefaultSkills();
  expect(runBattleRecorded(snapshot(actor(element)))).toEqual(out);
});

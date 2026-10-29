import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as rngModule from '../rng';
import { loadDefaultSkills, registerSkill } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import { paidDamageCurse } from './damage-curse-definition';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'] = 'player', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 0,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('source', 'player', { kind: 'merc', mercHolyFireAura: true,
    skillOrder: ['mskill-holy-fire'], ...patch });
}
function snapshot(merc = source(), target = unit('target', 'enemy')): CombatSnapshot {
  return { seed: 7, playerTeam: [unit('hero'), merc], enemyTeam: [target] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events
  .filter(event => event.kind === 'damage').filter(event => event.source === 'source');
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); loadDefaultSkills(); });

it('pulses at full seconds through the inclusive deadline without actions, Burn or payment', () => {
  const out = record(snapshot());
  expect(hits(out).map(event => [event.simClockMs, event.amount, event.damageType, event.crit, event.dodged]))
    .toEqual(Array.from({ length: 60 }, (_, i) => [(i + 1) * 1000, 8, 'fire', false, false]));
  expect(out.events.some(event => event.kind === 'action' || event.kind === 'mana' || event.kind === 'status')).toBe(false);
  expect(out.result.enemyTeam[0]?.life).toBe(99520);
  expect(out.result.playerTeam[1]?.cooldowns).toEqual({});
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
});

it.each(['stun', 'freeze'])('keeps native cadence while the living source is %s', id => {
  expect(hits(record(snapshot(source({ statuses: [{ ...hold, id }] }))))).toHaveLength(60);
});

it.each([
  { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
  { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
  { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { life: Infinity },
  { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 }
])('refuses an ineligible marked source %j', patch => {
  expect(hits(record(snapshot(source(patch))))).toEqual([]);
});

it('does not infer authority from a forged bar or visual aura markers', () => {
  const { mercHolyFireAura: _marker, ...merc } = source();
  const out = record(snapshot({ ...merc, activeBuffIds: ['mskill-holy-fire', 'holy-fire'],
    statuses: [hold, { id: 'mskill-holy-fire', sourceId: 'source', stacks: 1, remaining: -1 }] }));
  expect(hits(out)).toEqual([]);
});

it.each([1, 20])('ignores Attack, critical overflow, dodges and rank%i for ambient damage', rank => {
  for (const attack of [0, 10000]) {
    const merc = source({ skillLevels: { 'mskill-holy-fire': rank },
      stats: { ...source().stats, attack, critChance: 2, critDamage: 100 } });
    const target = unit('target', 'enemy', { stats: { ...unit('target').stats, physDodge: 1, magicDodge: 1 } });
    expect(hits(record(snapshot(merc, target)))[0]).toMatchObject({ amount: 8, crit: false, dodged: false });
  }
});

it.each([0, 9999])('uses Defense3 rather than MR%i for Fire', magicResist => {
  const target = unit('target', 'enemy', { stats: { ...unit('target').stats, defense: 3, magicResist } });
  expect(hits(record(snapshot(source(), target)))[0]).toMatchObject({ amount: 5 });
});

it.each([{ resist: 50, defense: 1, amount: 3 }, { resist: 75, defense: 100, amount: 1 }])(
  'applies Fire resistance before Defense and the minimum floor: $amount', row => {
    const target = unit('target', 'enemy', { stats: { ...unit('target').stats, defense: row.defense,
      resistances: { ...unit('target').stats.resistances, fire: row.resist } } });
    expect(hits(record(snapshot(source(), target)))[0]).toMatchObject({ amount: row.amount });
  });

it('adds personal, selected player aura and native Fire Mastery increases through ordinary mitigation', () => {
  const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.holy-fire', skillLevels: { 'paladin.holy-fire': 20 } }, 'source');
  if (!statAura) throw new Error('Missing selected player Holy Fire');
  const target = unit('target', 'enemy', { stats: { ...unit('target').stats, defense: 3,
    resistances: { ...unit('target').stats.resistances, fire: 25 } } });
  const input = snapshot(source({ increasedDamagePct: { fire: .25 } }), target);
  const out = record({ ...input, statAura, playerTeam: [...input.playerTeam,
    unit('mastery', 'player', { kind: 'merc', mercFireMastery: true })] });
  // floor(8 * (1 + .25 + .60 + .25) * .75 - 3) =9.
  expect(hits(out)[0]).toMatchObject({ amount: 9, simClockMs: 1000 });
  expect(out.events.filter(event => event.kind === 'damage').some(event => event.source === 'hero')).toBe(true);
});

it('retains the ordinary cross-element combo multiplier', () => {
  const target = unit('target', 'enemy', { statuses: [hold,
    { id: 'paralyze', sourceId: 'fixture', stacks: 1, remaining: -1 }] });
  expect(hits(record(snapshot(source(), target)))[0]).toMatchObject({ amount: 9 });
});

it.each(['trash', 'boss', 'chapter-boss'] as const)('damages a living $0 and hostile summon while excluding dead and allied bodies', tier => {
  const input = snapshot();
  const out = record({ ...input, playerTeam: [...input.playerTeam, unit('ally', 'player', { kind: 'merc' })],
    enemyTeam: [unit('target', 'enemy', { tier }), unit('minion', 'enemy', { kind: 'summon', summon: true, ownerId: 'target' }),
      unit('dead', 'enemy', { life: 0 })] });
  expect(hits(out).filter(event => event.simClockMs === 1000).map(event => [event.target, event.amount]))
    .toEqual([['target', 8], ['minion', 8]]);
  expect(hits(out).some(event => event.target === 'dead' || event.target === 'ally')).toBe(false);
});

it('uses one source in registration order and takes over only at a later global boundary', () => {
  const first = source({ life: 2, statuses: [hold,
    { id: 'poison', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] });
  const input = snapshot(first), out = record({ ...input, playerTeam: [...input.playerTeam, source({ id: 'duplicate' })] });
  const damage = out.events.filter(event => event.kind === 'damage');
  expect(damage.filter(event => event.simClockMs <= 2000).map(event => [event.source, event.amount, event.simClockMs]))
    .toEqual([['source', 8, 1000], ['duplicate', 8, 2000]]);
  expect(damage).toHaveLength(60);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: 2000 }));
});

it('does not multiply an aura with duplicate eligible sources', () => {
  const input = snapshot(), out = record({ ...input, playerTeam: [...input.playerTeam, source({ id: 'duplicate' })] });
  expect(hits(out)).toHaveLength(60);
  expect(out.events.filter(event => event.kind === 'damage').some(event => event.source === 'duplicate')).toBe(false);
});

it.each([1, 2])('settles periodic source death at $0s before its tied aura pulse', life => {
  const out = record(snapshot(source({ life, statuses: [hold,
    { id: 'poison', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] })));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: life * 1000 }));
  expect(hits(out).map(event => event.simClockMs)).toEqual(life === 1 ? [] : [1000]);
});

it('settles a target death once and immediately finishes before future pulses or tied actions', () => {
  const out = record(snapshot(source(), unit('target', 'enemy', { life: 8, statuses: [] })));
  expect(hits(out)).toEqual([expect.objectContaining({ amount: 8, simClockMs: 1000 })]);
  expect(out.events.filter(event => event.kind === 'death' && event.target === 'target')).toHaveLength(1);
  expect(out.events.some(event => event.kind === 'action')).toBe(false);
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 1000 });
});

it('lets a selected player pulse finish combat before native Holy Fire', () => {
  const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.holy-shock', skillLevels: { 'paladin.holy-shock': 1 } });
  if (!statAura) throw new Error('Missing selected player Holy Shock');
  const out = record({ ...snapshot(source(), unit('target', 'enemy', { life: 20 })), statAura });
  expect(hits(out)).toEqual([]);
  expect(out.events.filter(event => event.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', target: 'target', amount: 20, damageType: 'lightning', simClockMs: 1000 })]);
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 1000 });
});

it('settles native Prayer before Holy Fire on the same boundary', () => {
  const input = snapshot(source({ life: 1 })), out = record({ ...input, playerTeam: [...input.playerTeam,
    unit('prayer', 'player', { kind: 'merc', mercPrayerAura: true })] });
  const heal = out.events.findIndex(event => event.kind === 'heal' && event.target === 'source' &&
    event.amount === 5 && event.simClockMs === 1000);
  const hit = out.events.findIndex(event => event.kind === 'damage' && event.source === 'source' && event.simClockMs === 1000);
  expect(heal).toBeGreaterThan(-1); expect(hit).toBeGreaterThan(heal);
});

it('pulses before a tied action kills the source and withdraws at later boundaries', () => {
  registerSkill({ id: 'fixture.holy-fire-kill', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: 'physical', base: [10, 10], alwaysHits: true }] });
  const target = unit('target', 'enemy', { statuses: [], skillOrder: ['fixture.holy-fire-kill'],
    stats: { ...unit('target').stats, attackSpeed: 0 } });
  const out = record(snapshot(source({ life: 1 }), target));
  expect(hits(out).map(event => event.simClockMs)).toEqual([1000, 2000]);
  const hit = out.events.findIndex(event => event.kind === 'damage' && event.source === 'source' && event.simClockMs === 2000);
  const death = out.events.findIndex(event => event.kind === 'death' && event.target === 'source' && event.simClockMs === 2000);
  expect(hit).toBeGreaterThan(-1); expect(death).toBeGreaterThan(hit);
});

it('preserves downstream paid Frozen Armor Chill without inheriting an attack payload', () => {
  const target = unit('target', 'enemy', { frozenArmor: { rank: 1, defensePct: .2 } });
  const out = record(snapshot(source(), target));
  expect(hits(out)[0]).toMatchObject({ amount: 8, simClockMs: 1000 });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: 'source', statusId: 'chill', simClockMs: 1000 }));
  expect(out.events.filter(event => event.kind === 'status').some(event => event.statusId === 'burn')).toBe(false);
});

it('retains finite paid Life Tap healing from actual HP removed', () => {
  const target = unit('target', 'enemy', { statuses: [hold,
    { id: 'life-tap', sourceId: 'paid-caster', stacks: 1, remaining: 3,
      appliedAtMs: 0, expiresAtMs: 3000, damageCurse: paidDamageCurse('life-tap') }] });
  const out = record(snapshot(source({ life: 100 }), target));
  expect(out.events.filter(event => event.kind === 'heal').filter(event => event.target === 'source')
    .map(event => [event.simClockMs, event.amount])).toEqual([[1000, 2], [2000, 2]]);
  expect(out.result.playerTeam.find(actor => actor.id === 'source')?.life).toBe(104);
});

it('adds no main RNG draws in an isolated surviving held topology', () => {
  const random = rngModule.createRng(7), expectedTail = rngModule.createRng(7).next();
  const next = vi.spyOn(random, 'next'), nextInt = vi.spyOn(random, 'nextInt'), chance = vi.spyOn(random, 'chance');
  vi.spyOn(rngModule, 'createRng').mockReturnValueOnce(random);
  const input = snapshot(), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(hits(out)).toHaveLength(60);
  expect(next).not.toHaveBeenCalled(); expect(nextInt).not.toHaveBeenCalled(); expect(chance).not.toHaveBeenCalled();
  expect(random.next()).toBe(expectedTail);
});

it('rebuilds the next wave deadline from zero and leaves no clock on carried units', () => {
  const first = record(snapshot()), merc = first.result.playerTeam.find(actor => actor.id === 'source');
  if (!merc) throw new Error('Missing carried mercenary');
  expect(merc).not.toHaveProperty('nextMercHolyFireAtMs');
  expect(hits(record(snapshot(merc)))[0]).toMatchObject({ simClockMs: 1000, amount: 8 });
  const without = { ...snapshot(), playerTeam: [unit('hero')] };
  expect(hits(record(without))).toEqual([]);
});

it('keeps the actual passive bar while ordinary basic attacks remain eligible', () => {
  const merc = source({ statuses: [{ ...hold, appliedAtMs: 1701 }],
    basicAttack: { damageType: 'physical', damage: [10, 10] } });
  const out = record(snapshot(merc));
  expect(out.events.filter(event => event.kind === 'action').map(event => [event.actor, event.skillId, event.simClockMs]))
    .toEqual([['source', null, 1700]]);
  expect(hits(out).filter(event => event.damageType === 'fire')).toHaveLength(60);
  expect(out.result.playerTeam.find(actor => actor.id === 'source')?.mana).toBe(0);
});

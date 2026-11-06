import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const aura = { damage: 15, intervalMs: 5000, chillDurationMs: 2000 };
const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 32, tier: 'trash',
    life: 100000, mana: 0,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 0,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('source', 'enemy', { frostAura: aura, ...patch });
}
function record(enemy = source(), hero = unit('hero', 'player')) {
  const input: CombatSnapshot = { seed: 13, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events
  .filter(event => event.kind === 'damage').filter(event => event.source === 'source' && event.damageType === 'cold');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['stun', 'freeze'])('pulses at five-second boundaries while the source is %s without actions or payment', id => {
  const out = record(source({ statuses: [{ ...hold, id }] }));
  expect(hits(out).map(event => [event.simClockMs, event.amount, event.crit, event.dodged]))
    .toEqual(Array.from({ length: 12 }, (_, i) => [(i + 1) * 5000, 15, false, false]));
  expect(out.events.some(event => event.kind === 'action' || event.kind === 'mana')).toBe(false);
  expect(out.result.playerTeam[0]?.life).toBe(99820);
  expect(out.result.enemyTeam[0]?.cooldowns).toEqual({});
  const statuses = out.events.filter(event => event.kind === 'status').filter(event => event.target === 'hero');
  expect(statuses.map(event => [event.simClockMs, event.statusId]))
    .toEqual(Array.from({ length: 12 }, (_, i) => [(i + 1) * 5000, 'chill']));
  expect(out.events.flatMap(event => event.kind === 'status-state' && event.target === 'hero'
    ? event.statuses : []).find(status => status.id === 'chill')?.expiresAtMs).toBe(7000);
});

it('uses magical mitigation and cold resistance without dodge, crit or Attack scaling', () => {
  const enemy = source({ stats: { ...source().stats, attack: 10000, critChance: 2, critDamage: 100 } });
  const target = unit('hero', 'player');
  const out = record(enemy, { ...target, stats: { ...target.stats, magicResist: 2,
    physDodge: 1, magicDodge: 1, resistances: { ...target.stats.resistances, cold: 50 } } });
  expect(hits(out)).toHaveLength(12);
  expect(hits(out)[0]).toMatchObject({ amount: 5, crit: false, dodged: false });
});

it.each([
  { kind: 'hero' as const }, { kind: 'merc' as const }, { kind: 'summon' as const },
  { side: 'player' as const }, { summon: true }, { ownerId: 'other' },
  { summonOwnerId: 'other' }, { summonTemplateId: 'minion' }, { life: 0 },
  { life: NaN }, { life: Infinity },
  { frostAura: { ...aura, intervalMs: 0 } }, { frostAura: { ...aura, damage: NaN } }
])('does not pulse from an ineligible original source %j', patch => {
  expect(hits(record(source(patch)))).toEqual([]);
});

it('settles a lethal pulse once and ends before further targets or deadlines', () => {
  const target = unit('hero', 'player', { life: 15 });
  const out = record(source(), target);
  expect(hits(out)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.events.filter(event => event.kind === 'death' && event.target === 'hero')).toHaveLength(1);
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: 'enemy', simClockMs: 5000 });
});

it('does not infer a passive from an active skill or visual status marker', () => {
  const out = record(unit('source', 'enemy', { skillOrder: ['monster-frost-aura'],
    activeBuffIds: ['monster-frost-aura'], statuses: [hold,
      { ...hold, id: 'monster-frost-aura' }] }));
  expect(hits(out)).toEqual([]);
});

it.each([5, 10])('settles source death at %is before its tied pulse, while another enemy survives', life => {
  const input: CombatSnapshot = { seed: 13, playerTeam: [unit('hero', 'player')],
    enemyTeam: [source({ life, statuses: [hold,
      { id: 'poison', sourceId: 'hero', stacks: 1, remaining: -1, dotPerStack: 1 }] }), unit('other', 'enemy')] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(hits(out).map(event => event.simClockMs)).toEqual(life === 5 ? [] : [5000]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: life * 1000 }));
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
});

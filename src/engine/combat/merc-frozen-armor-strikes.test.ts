import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import * as damage from './damage';
import * as random from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { paidBattleCry } from './warcry-definition';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs });
function native(id = 'mercs/act3-iron-wolf-frozen-armor', suffix = 'strikes'): CombatUnit {
  const def = loadMercPool().pool.find(row => row.id === id);
  if (!def) throw new Error('Missing native mercenary');
  const body = mercToCombatUnit(createMercFromDef(def, suffix));
  return { ...body, life: 10000, mana: 1000000, statuses: [hold(401)],
    stats: { ...body.stats, life: 10000, lifeMax: 10000, mana: 1000000, manaMax: 1000000,
      attack: 1, defense: 20, magicResist: 0, attackSpeed: 263, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function input(skill?: string, count = 1): CombatSnapshot {
  const merc = native(), attacker: CombatUnit = { ...merc, id: 'attacker', side: 'enemy', kind: 'monster', level: 99,
    statuses: [hold(1701), { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 500 }],
    life: 1000, attackRange: [300, 300], basicAttackDelivery: 'melee', skillOrder: skill ? [skill] : [],
    stats: { ...merc.stats, life: 1000, lifeMax: 1000, attack: 300, defense: 0, attackSpeed: 100 } };
  return { seed: 7, playerTeam: Array.from({ length: count }, (_, i) => ({ ...native(undefined, String(i)),
    gridPosition: { row: 0, col: i } })), enemyTeam: [attacker] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  for (const body of snapshot.playerTeam) expect(out.result.playerTeam.find(unit => unit.id === body.id)?.stats).toEqual(body.stats);
  return out;
}
const chills = (out: ReturnType<typeof runBattleRecorded>) => out.events.filter(event =>
  event.kind === 'status' && event.target === 'attacker' && event.statusId === 'chill');
function chillSources(out: ReturnType<typeof runBattleRecorded>): string[] {
  return chills(out).map(event => {
    const observation = out.events[out.events.indexOf(event) + 1];
    if (observation?.kind !== 'status-state' || observation.target !== 'attacker') {
      throw new Error('Missing immediate attacker status observation');
    }
    const status = observation.statuses.find(row => row.id === 'chill');
    if (!status) throw new Error('Missing observed Chill source');
    return status.sourceId;
  });
}
type DamageEvent = Extract<ReturnType<typeof runBattleRecorded>['events'][number], { kind: 'damage' }>;
function present<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture event or recording');
  return value;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events.filter((event): event is DamageEvent =>
  event.kind === 'damage' && event.source === 'attacker');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('adds flat personal Defense before percentage Defense, Melt, Inner Sight and Battle Cry, retaining fractions', () => {
  const snapshot = input(), merc = snapshot.playerTeam[0];
  if (!merc) throw new Error('Missing wearer');
  const support = { ...native('mercs/act2-defiance'), statuses: [hold()] };
  const out = record({ ...snapshot, playerTeam: [{ ...merc, stats: { ...merc.stats, defense: 21 },
    statuses: [...merc.statuses, { ...hold(), id: 'armor-melt' }, { ...hold(), id: 'merc-inner-sight' },
      { ...hold(1000), id: 'battle-cry', remaining: 1, expiresAtMs: 2000, battleCry: paidBattleCry(1) }] }, support] });
  // floor(300*1.25 - (21+120)*1.30*.70*.75*.50) = 326; no intermediate floor.
  expect(hits(out).find(event => event.target === merc.id)).toMatchObject({ amount: 326, simClockMs: 1700 });
  expect(out.result.playerTeam[1]).not.toHaveProperty('mercFrozenArmor');
});

it('treats weighted Power Strike components and released bolts as one melee contact', () => {
  const out = record(input('amazon.power_strike'));
  expect(hits(out)).toHaveLength(4); // physical/lightning carrier plus two released lightning bolts.
  expect(hits(out).some(event => event.amount > 0)).toBe(true);
  expect(chillSources(out)).toEqual([out.result.playerTeam[0]?.id]);
  const damageIndices = hits(out).map(event => out.events.indexOf(event));
  const chillIndex = out.events.indexOf(present(chills(out)[0]));
  expect(damageIndices[1]).toBeLessThan(chillIndex);
  expect(chillIndex).toBeLessThan(present(damageIndices[2]));
});

it('contacts every direct recipient of native area melee', () => {
  const out = record(input('monster.whirlwind', 2));
  expect(hits(out)).toHaveLength(2);
  expect(hits(out).every(event => !event.dodged)).toBe(true);
  // Canonical nonstacking Chill refresh retains its first source.
  expect(chillSources(out)).toEqual([out.result.playerTeam[0]?.id, out.result.playerTeam[0]?.id]);
});

it.each([0, 1])('reacts from native area recipient %s independently when the other wearer is unqualified', qualified => {
  const snapshot = input('monster.whirlwind', 2);
  const out = record({ ...snapshot, playerTeam: snapshot.playerTeam.map((unit, index) =>
    index === qualified ? unit : { ...unit, skillOrder: [], statuses: [hold()] }) });
  expect(hits(out)).toHaveLength(2);
  expect(hits(out).every(event => !event.dodged)).toBe(true);
  expect(hits(out).map(event => event.target))
    .toEqual(snapshot.playerTeam.map(unit => unit.id));
  expect(chillSources(out)).toEqual([snapshot.playerTeam[qualified]?.id]);
});

it.each(['landed', 'missed', 'lethal'] as const)('binds native Lightning Strike contact to its original primary after a %s hit', mode => {
  const snapshot = input('amazon.lightning_strike', 2), first = snapshot.playerTeam[0];
  if (!first) throw new Error('Missing primary');
  const out = record({ ...snapshot, seed: mode === 'missed' ? 4 : 7,
    playerTeam: [{ ...first, life: mode === 'lethal' ? 1 : first.life,
      stats: { ...first.stats, magicDodge: mode === 'missed' ? 1 : 0 } }, ...snapshot.playerTeam.slice(1)] });
  expect(hits(out)).toHaveLength(2);
  expect(hits(out)[0]).toMatchObject({ target: first.id, dodged: mode === 'missed' });
  expect(hits(out)[1]).toMatchObject({ dodged: false });
  expect(chillSources(out)).toEqual(mode === 'missed' ? [] : [first.id]);
  if (mode === 'lethal') {
    const chillIndex = out.events.indexOf(present(chills(out)[0]));
    expect(chillIndex).toBeGreaterThan(out.events.indexOf(present(hits(out)[0])));
    expect(chillIndex).toBeLessThan(out.events.findIndex(event => event.kind === 'death' && event.target === first.id));
    expect(chillIndex).toBeLessThan(out.events.indexOf(present(hits(out)[1])));
  }
});

it('does not contact on landed zero damage at the controlled mitigation seam', () => {
  // Native mitigation floors landed damage to one; this double checks the explicit positive guard.
  vi.spyOn(damage, 'resolveDamage').mockReturnValue({ hit: true, dodged: false, crit: false,
    raw: 0, mitigated: 0, final: 0, effectiveResistPct: 0 });
  const out = record(input());
  expect(hits(out)).toEqual([expect.objectContaining({ amount: 0, dodged: false })]);
  expect(chills(out)).toEqual([]);
});

it('adds no RNG draws for paid melee Chill in the same topology', () => {
  const snapshot = input(), enemy = snapshot.enemyTeam[0];
  if (!enemy) throw new Error('Missing attacker');
  const { basicAttackDelivery: _delivery, ...unknown } = enemy;
  const results: ReturnType<typeof runBattleRecorded>[] = [], calls: unknown[][] = [], tails: number[] = [];
  for (const enemyTeam of [[enemy], [unknown]]) {
    const rng = random.createRng(7), chance = vi.spyOn(rng, 'chance');
    vi.spyOn(random, 'createRng').mockReturnValueOnce(rng);
    results.push(runBattleRecorded({ ...snapshot, enemyTeam }));
    calls.push(chance.mock.calls); tails.push(rng.next()); vi.restoreAllMocks();
  }
  expect(chills(present(results[0]))).toHaveLength(1);
  expect(chills(present(results[1]))).toEqual([]);
  expect(calls[0]).toEqual(calls[1]);
  expect(tails[0]).toBe(tails[1]);
});

import { expect, it } from 'vitest';
import { runBattleRecorded, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { getSkill, registerSkill } from '../skills/registry';
import { createRng } from '../rng';
import { PlagueTracker } from './plague';
import { activeStatusView, applyStatus } from './status';

const id = 'amazon.plague_javelin';
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'hold', stacks: 1,
  remaining: -1, appliedAtMs: at });
function unit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return { id: 'target', name: 'Target', side: 'enemy', kind: 'monster', level: 60,
    tier: 'trash', life: 10000, mana: 1000,
    stats: { life: 10000, lifeMax: 10000, mana: 1000, manaMax: 1000, attack: 20,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    enraged: false, summonedAdds: false, gridPosition: { row: 1, col: 1 }, ...overrides };
}
const poison = (stacks = 10, rate = 8): ActiveStatus => ({ id: 'poison', sourceId: 'old',
  stacks, remaining: 5, dotPerStack: rate, damageType: 'poison', appliedAtMs: 1700, expiresAtMs: 6700 });
function battle(sources: CombatUnit[], options: { seed?: number; mana?: number; holdAt?: number; casters?: number } = {}) {
  const input = { seed: options.seed ?? 7, playerTeam: Array.from({ length: options.casters ?? 1 }, (_, index) =>
    unit({ id: index === 0 ? 'hero' : `hero-${String(index)}`, side: 'player', kind: 'hero',
    mana: options.mana ?? 1000, skillOrder: [id], skillLevels: { [id]: 1 },
    statuses: [hold(options.holdAt ?? 1701)], manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 })),
  enemyTeam: [...sources, unit({ id: 'recipient', gridPosition: { row: 2, col: 1 } })] };
  const before = structuredClone(input), recording = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recording);
  return recording;
}
const triggers = (events: readonly RecordedBattleEvent[]) => events.filter(e =>
  e.kind === 'message' && e.messageKey === 'combat:epidemic.triggered');

it.each([[10, 10, 400, 1], [9, 5, 200, 0]])(
  'pre-cast Poison%s spreads%s stacks for%sHP with%s Epidemic', (stacks, spread, damage, count) => {
    const out = battle([unit({ id: 'source', life: 1, statuses: [hold(), poison(stacks)] })]);
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'recipient' &&
      e.statuses.some(s => s.id === 'poison' && s.stacks === spread && s.dotPerStack === 8 &&
        s.appliedAtMs === 1700 && s.expiresAtMs === 6700))).toBe(true);
    expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(10000 - damage);
    expect(triggers(out.events)).toHaveLength(count);
  });
it('later periodic death retains the paid cast authority and captured Poison rate', () => {
  const out = battle([unit({ id: 'source', life: 200, statuses: [hold(), poison()] })]);
  const death = out.events.find(e => e.kind === 'death' && e.target === 'source');
  expect(death?.simClockMs).toBeGreaterThan(1700);
  expect(triggers(out.events)).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'recipient' &&
    e.statuses.some(s => s.id === 'poison' && s.stacks === 10 && s.dotPerStack === 8))).toBe(true);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9600);
});
it('one area cast permits only one Epidemic across separate target deaths', () => {
  const out = battle([
    unit({ id: 'first', life: 1, statuses: [hold(), poison()] }),
    unit({ id: 'second', life: 200, gridPosition: { row: 1, col: 2 }, statuses: [hold(), poison()] })
  ]);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.dodged)).toEqual([false, false]);
  expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['first', 'second']);
  expect(triggers(out.events)).toHaveLength(1);
});

it('distinct paid casts have independent allowances on a refreshed active marker', () => {
  const out = battle([
    unit({ id: 'first', life: 1, statuses: [hold(), poison()] }),
    unit({ id: 'second', life: 200, gridPosition: { row: 1, col: 2 }, statuses: [hold(), poison()] })
  ], { casters: 2 });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === id)).toHaveLength(2);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.dodged)).toEqual([false, false, false]);
  expect(triggers(out.events)).toHaveLength(2);
  expect(out.result.playerTeam.map(u => u.mana)).toEqual([975, 975]);
});

it.each([
  ['future', { ...poison(), appliedAtMs: 1701, expiresAtMs: 6701 }],
  ['expired', { ...poison(), appliedAtMs: 0, expiresAtMs: 0 }]
])('a %s ten-stack record cannot qualify a paid cast', (_name, status) => {
  const out = battle([unit({ id: 'source', life: 1, statuses: [hold(), status] })]);
  expect(triggers(out.events)).toHaveLength(0);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'recipient' &&
    e.statuses.some(s => s.id === 'poison' && s.stacks === 1 && s.dotPerStack === 1))).toBe(true);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9995);
});

it('a missed paid cast cannot turn the subsequent Poison death into Epidemic', () => {
  const out = battle([unit({ id: 'source', life: 1, statuses: [hold(), poison()] })], { seed: 41 });
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.dodged)).toEqual([true]);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'plague')).toBe(false);
  expect(triggers(out.events)).toHaveLength(0);
  expect(out.result.playerTeam[0]?.mana).toBe(975);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9800);
});

it('failed payment leaves the death spread ordinary', () => {
  const out = battle([unit({ id: 'source', life: 1, statuses: [hold(), poison()] })], { mana: 24 });
  expect(out.events.filter(e => e.kind === 'action').map(e => e.skillId)).toEqual([null]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(triggers(out.events)).toHaveLength(0);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9800);
});

it('the lethal final interval keeps an expiring qualified marker for death settlement', () => {
  // Seed7 rolls31; Poison10 multiplies the direct hit by2.5, rounded down to77.
  const out = battle([unit({ id: 'source', life: 477, statuses: [hold(), poison()] })]);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([77]);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'source')?.simClockMs).toBe(6700);
  expect(triggers(out.events)).toHaveLength(1);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9600);
});

it('a marker that expires before a later Poison death loses Epidemic authority', () => {
  const out = battle([unit({ id: 'source', life: 500, statuses: [hold(), { ...poison(), expiresAtMs: 9000 }] })]);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'source')?.simClockMs).toBeGreaterThan(6700);
  expect(triggers(out.events)).toHaveLength(0);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9800);
});

it('a previous battle status observation cannot carry paid Epidemic authority into a fresh battle', () => {
  const previous = battle([unit({ id: 'source', life: 200, statuses: [hold(), poison()] })]);
  const observed = previous.events.find((event): event is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
    event.kind === 'status-state' && event.target === 'source' && event.statuses.some(s => s.id === 'plague'));
  expect(observed).toBeDefined();
  const fresh = battle([unit({ id: 'source', life: 1, statuses: [...(observed?.statuses ?? [])] })], { holdAt: 0 });
  expect(fresh.events.filter(e => e.kind === 'action')).toEqual([]);
  expect(triggers(fresh.events)).toHaveLength(0);
  expect(fresh.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9800);
});

it('a later paid cast by the same caster gets its own allowance after the first was spent', () => {
  const out = battle([
    unit({ id: 'first', life: 1, statuses: [hold(), poison()] }),
    unit({ id: 'second', life: 500, gridPosition: { row: 1, col: 2 }, statuses: [hold(), poison()] })
  ], { holdAt: 5101 });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === id).map(e => e.simClockMs)).toEqual([1700, 5100]);
  expect(triggers(out.events)).toHaveLength(2);
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'mana' }> =>
    e.kind === 'mana' && e.reason === 'cast').map(e => e.mana)).toEqual([975, 950]);
});

it('extra hits of one cast cannot recapture nine-to-ten Poison as pre-cast maximum', () => {
  const original = getSkill(id);
  if (!original) throw new Error('Missing authored Plague skill');
  registerSkill({ ...original, effects: original.effects.map(effect => effect.kind === 'damage'
    ? { ...effect, hitSequence: { strikes: 3, targetMode: 'each-original' } } : effect) });
  try {
    const out = battle([unit({ id: 'source', life: 300, statuses: [hold(), poison(9)] })]);
    expect(out.events.filter(e => e.kind === 'damage').map(e => e.dodged)).toEqual([false, false, false]);
    expect(triggers(out.events)).toHaveLength(0);
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'recipient' &&
      e.statuses.some(s => s.id === 'poison' && s.stacks === 5 && s.dotPerStack === 8))).toBe(true);
    expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9800);
  } finally {
    registerSkill(original);
  }
});

it('captured Epidemic survives the caster death while the party remains alive', () => {
  const input = { seed: 7, playerTeam: [
    unit({ id: 'hero', side: 'player', kind: 'hero' }),
    unit({ id: 'caster', side: 'player', kind: 'merc', life: 1,
      skillOrder: [id], skillLevels: { [id]: 1 }, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
      statuses: [hold(1701), { ...poison(1, 1), appliedAtMs: 1701, expiresAtMs: 6701 }] })
  ], enemyTeam: [unit({ id: 'source', life: 200, statuses: [hold(), poison()] }),
    unit({ id: 'recipient', gridPosition: { row: 2, col: 1 } })] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  const deaths = out.events.filter(e => e.kind === 'death');
  expect(deaths.map(e => e.target)).toEqual(['caster', 'source']);
  expect(triggers(out.events)).toHaveLength(1);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9600);
});

it('replacing an expired marker with an unqualified cast cannot revive the old allowance', () => {
  const effects = getSkill(id)?.effects;
  if (!effects) throw new Error('Missing authored Plague effects');
  const tracker = new PlagueTracker(), rng = createRng(7);
  let target = unit({ statuses: [{ ...poison(), appliedAtMs: 1000, expiresAtMs: 20000 }] });
  const first = tracker.prepare(effects, [target], 1000)[0];
  if (first?.kind !== 'damage') throw new Error('Missing prepared damage');
  target = applyStatus(target, { id: 'plague', sourceId: 'hero', simClockMs: 1000 }, rng);
  tracker.mark(first, target, 1000);
  // The actual lifecycle expires; this new cast starts below maximum and replaces the marker.
  target = { ...activeStatusView(target, 7000), statuses: [
    { ...poison(9), appliedAtMs: 1000, expiresAtMs: 20000 }] };
  const replacement = tracker.prepare(effects, [target], 7000)[0];
  if (replacement?.kind !== 'damage') throw new Error('Missing replacement damage');
  target = applyStatus(target, { id: 'plague', sourceId: 'hero', simClockMs: 7000 }, rng);
  tracker.mark(replacement, target, 7000);
  expect(tracker.consume({ ...activeStatusView(target, 7100), life: 0 })).toBe(false);
});

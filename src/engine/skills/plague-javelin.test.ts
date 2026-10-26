import { expect, it } from 'vitest';
import { getSkill } from '@/engine/skills/registry';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import { spreadPlague, dotDamageThisTick } from '@/engine/combat/status';
import { createRng } from '@/engine/rng';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';

const skillId = 'amazon.plague_javelin';
function unit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: 'target', name: 'Target', side: 'enemy', kind: 'monster', level: 60,
    tier: 'trash', life: 10000, mana: 1000,
    stats: { life: 10000, lifeMax: 10000, mana: 1000, manaMax: 1000, attack: 20,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    enraged: false, summonedAdds: false, gridPosition: { row: 1, col: 1 },
    ...overrides
  };
}
const hold = (at: number): ActiveStatus => ({ id: 'stun', stacks: 1, remaining: -1,
  sourceId: 'diagnostic-hold', appliedAtMs: at });
function cast(rank: number, seed = 7, mana = 1000) {
  const input = { seed, playerTeam: [unit({ id: 'hero', name: 'Amazon', side: 'player', kind: 'hero',
    mana, skillOrder: [skillId], skillLevels: { [skillId]: rank }, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 })],
  enemyTeam: [unit({ statuses: [hold(0)] })] };
  const before = structuredClone(input), recording = runBattleRecorded(input);
  expect(input).toEqual(before);
  return recording;
}

it('registers both authored statuses with exactly one damaging payload', () => {
  expect(getSkill(skillId)).toMatchObject({ manaCost: 25, cooldown: 2, aoeShape: 'line-3',
    effects: [{ kind: 'damage', damageType: 'poison', base: [30, 50], perRank: [3, 3],
      applyStatuses: [{ id: 'poison', stacksOnApply: 3, dotPctOfDamage: .05 }, { id: 'plague' }] }] });
});

it.each([[1, 31, 15], [20, 88, 60]])('paid rank%s applies Poison plus a rate-less Plague without duplicate damage',
  (rank, direct, periodic) => {
    const out = cast(rank);
    expect(out.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([direct]);
    expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['poison', 'plague']);
    const observations = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
      e.kind === 'status-state' && e.target === 'target');
    expect(observations.some(e => e.statuses.some(s => s.id === 'poison' && s.stacks === 3 &&
      s.dotPerStack === Math.floor(direct * .05)))).toBe(true);
    expect(observations.some(e => e.statuses.some(s => s.id === 'plague' && s.dotPerStack === undefined))).toBe(true);
    expect(out.events.filter(e => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(periodic);
    expect(out.result.enemyTeam[0]?.life).toBe(10000 - direct - periodic);
    expect(out.result.playerTeam[0]?.mana).toBe(975);
    expect(cast(rank)).toEqual(out);
  });

it('a missed actual cast spends mana without either status or periodic damage', () => {
  const out = cast(1, 41);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([0]);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(975);
});
it('unaffordable casts do not apply either payload', () => {
  const out = cast(1, 7, 24);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(24);
});

const poison: ActiveStatus = { id: 'poison', stacks: 6, remaining: 5,
  sourceId: 'poison-owner', dotPerStack: 8, damageType: 'poison' };
const plague: ActiveStatus = { id: 'plague', stacks: 1, remaining: 5, sourceId: 'plague-owner' };
it.each([[poison, plague], [plague, poison]])('spread uses one Poison record for stacks and potency, regardless of record order %#',
  (...statuses) => {
    const source = unit({ id: 'source', statuses }), targets = [unit({ id: 'a' }), unit({ id: 'b' })];
    const before = structuredClone({ source, targets });
    const result = spreadPlague(source, targets, .5, createRng(7), 1000);
    for (const recipient of result) {
      expect(recipient.statuses).toEqual([{ id: 'poison', stacks: 3, remaining: 5, sourceId: 'source',
        dotPerStack: 8, damageType: 'poison', appliedAtMs: 1000, expiresAtMs: 6000 }]);
      expect(dotDamageThisTick(recipient).total).toBe(24);
    }
    expect({ source, targets }).toEqual(before);
  });
it.each(['poison', 'plague'])('preserves standalone %s death payloads', id => {
  const source = unit({ statuses: [{ ...poison, id }] });
  const result = spreadPlague(source, [unit()], .5, createRng(7), 1000);
  expect(result[0]?.statuses[0]).toMatchObject({ id: 'poison', stacks: 3, dotPerStack: 8,
    appliedAtMs: 1000, expiresAtMs: 6000 });
});

it('actual paid kill spreads half the total Poison with its captured rate to a living off-line neighbor', () => {
  const source = unit({ id: 'source', life: 1, statuses: [hold(0),
    { ...poison, appliedAtMs: 1700, expiresAtMs: 6700 }, plague] });
  const recipient = unit({ id: 'recipient', gridPosition: { row: 2, col: 1 }, statuses: [hold(0)] });
  const input = { seed: 7, playerTeam: [unit({ id: 'hero', side: 'player', kind: 'hero',
    skillOrder: [skillId], skillLevels: { [skillId]: 1 }, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 })], enemyTeam: [source, recipient] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['source']);
  expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toContain('source');
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'recipient' &&
    e.statuses.some(s => s.id === 'poison' && s.stacks === 4 && s.dotPerStack === 8 &&
      s.sourceId === 'source' && s.appliedAtMs === 1700 && s.expiresAtMs === 6700))).toBe(true);
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> =>
    e.kind === 'dot' && e.target === 'recipient')
    .reduce((n, e) => n + e.amount, 0)).toBe(160);
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(9840);
});

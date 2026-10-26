import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
function fixture(slug: string, rank = 1, seed = 7): CombatSnapshot {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(value => value.id === id);
    if (!row) throw new Error('Missing Necromancer prerequisite');
    for (const ancestor of row.prerequisites ?? []) add(ancestor);
    levels[id] = 1;
  }
  const id = 'skills-necromancer-' + slug; add(id); levels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic direct bone/poison', 'necromancer'),
    id: 'hero', level: 30, skillLevels: levels, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: 12 }, (_, i): CombatUnit => ({
    ...hero, id: 'target-' + String(i), side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }],
    gridPosition: { row: Math.floor(i / 3), col: i % 3 }
  })) };
}

function initialPoison(stacks: number, extra: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id: 'poison', sourceId: 'earlier-caster', stacks, remaining: 3,
    appliedAtMs: 0, expiresAtMs: 3000, dotPerStack: 1, damageType: 'poison', ...extra };
}
function withPoison(status: ActiveStatus): CombatSnapshot {
  const input = fixture('poison-nova', 20);
  return { ...input, enemyTeam: input.enemyTeam.slice(0, 1).map(unit => ({
    ...unit, statuses: [...unit.statuses, status]
  })) };
}
function paidHit(out: ReturnType<typeof runBattleRecorded>) {
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing actual paid Nova hit');
  expect(hit.dodged).toBe(false); expect(hit.simClockMs).toBe(1700);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.poison_nova')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.mana).toBe(75);
  return hit;
}
function totalDot(events: readonly RecordedBattleEvent[]) {
  return events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'target-0' ? e.amount : 0), 0);
}
function appliedPoison(out: ReturnType<typeof runBattleRecorded>) {
  const event = out.events.find(e => e.kind === 'status-state' && e.target === 'target-0' && e.simClockMs === 1700 &&
    e.statuses.some(s => s.id === 'poison' && s.expiresAtMs === 6700));
  if (!event || event.kind !== 'status-state') throw new Error('Missing paid Poison status observation');
  return event.statuses.find(s => s.id === 'poison');
}
for (const stacks of [1, 8, 9, 10]) {
  it(`paid Nova adds two to existing ${String(stacks)} Poison stacks within cap and preserves original damaging identity`, () => {
    const input = withPoison(initialPoison(stacks)), before = structuredClone(input);
    const out = runBattleRecorded(input), hit = paidHit(out), count = Math.min(10, stacks + 2);
    expect(appliedPoison(out)).toMatchObject({ stacks: count, dotPerStack: 1, sourceId: 'earlier-caster',
      damageType: 'poison', appliedAtMs: 0, expiresAtMs: 6700 });
    const expected = Math.floor(stacks * 1.7 + count * 5);
    expect(totalDot(out.events)).toBe(expected);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - hit.amount - expected);
    expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  });
}
it('paid Nova promotes a marker without retroactive DoT or resetting its original start clock', () => {
  const marker = initialPoison(8);
  Reflect.deleteProperty(marker, 'dotPerStack');
  Reflect.deleteProperty(marker, 'damageType');
  const input = withPoison(marker);
  const out = runBattleRecorded(input), hit = paidHit(out), rate = Math.max(1, Math.floor(hit.amount * .05));
  expect(appliedPoison(out)).toMatchObject({ stacks: 10, dotPerStack: rate, sourceId: 'hero',
    damageType: 'poison', appliedAtMs: 0, expiresAtMs: 6700 });
  expect(out.events.filter(e => e.kind === 'dot' && e.simClockMs <= 1700)).toEqual([]);
  expect(totalDot(out.events)).toBe(10 * rate * 5);
  expect(out.result.enemyTeam[0]?.life).toBe(2000 - hit.amount - 10 * rate * 5);
});
it('Poison expiring exactly at the native cast closes old damage before fresh Nova stacks', () => {
  const out = runBattleRecorded(withPoison(initialPoison(9, { expiresAtMs: 1700 }))), hit = paidHit(out);
  const rate = Math.max(1, Math.floor(hit.amount * .05));
  expect(appliedPoison(out)).toMatchObject({ stacks: 2, dotPerStack: rate, sourceId: 'hero',
    damageType: 'poison', appliedAtMs: 1700, expiresAtMs: 6700 });
  const expected = Math.floor(9 * 1.7 + 2 * rate * 5);
  expect(totalDot(out.events)).toBe(expected);
  expect(out.result.enemyTeam[0]?.life).toBe(2000 - hit.amount - expected);
});
it('Nova refresh preserves an indefinite legacy damaging Poison and caps its stacks', () => {
  const indefinite = initialPoison(9);
  Reflect.deleteProperty(indefinite, 'expiresAtMs');
  const out = runBattleRecorded(withPoison(indefinite));
  const hit = paidHit(out);
  const states = out.events.filter(e => e.kind === 'status-state' && e.target === 'target-0' && e.simClockMs === 1700);
  expect(states.some(e => e.kind === 'status-state' && e.statuses.some(s => s.id === 'poison' &&
    s.stacks === 10 && s.expiresAtMs === undefined && s.dotPerStack === 1 && s.sourceId === 'earlier-caster'))).toBe(true);
  const expected = Math.floor(9 * 1.7 + 10 * ((out.events.at(-1)?.simClockMs ?? 0) - 1700) / 1000);
  expect(totalDot(out.events)).toBe(expected);
  expect(out.result.enemyTeam[0]?.life).toBe(2000 - hit.amount - expected);
});

for (const { seed, expectedMisses, finalStacks } of [
  { seed: 7, expectedMisses: 0, finalStacks: 10 },
  { seed: 19, expectedMisses: 1, finalStacks: 2 }
]) {
  it(`repeated paid Nova caps/refreshes original potency and misses permit expiry, seed${String(seed)}`, () => {
    const input = fixture('poison-nova', 20, seed);
    const snapshot = { ...input,
      playerTeam: input.playerTeam.map(unit => ({ ...unit, mana: 200,
        stats: { ...unit.stats, manaMax: 200 },
        statuses: [{ id: 'stun', sourceId: 'hold-after-eight-casts', stacks: 1, remaining: -1, appliedAtMs: 25501 }] })),
      enemyTeam: input.enemyTeam.slice(0, 1).map(unit => ({ ...unit, life: 1000000,
        stats: { ...unit.stats, lifeMax: 1000000 } })) };
    const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    const actions = out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.poison_nova');
    expect(actions.map(e => e.simClockMs)).toEqual(Array.from({ length: 8 }, (_, i) => 1700 + 3400 * i));
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(8);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    let stacks = 0, rate = 0, expiry = 0, applied = 0, cursor = 0, integral = 0, misses = 0, peak = 0;
    for (const action of actions) {
      const time = action.simClockMs;
      integral += stacks * rate * Math.max(0, Math.min(time, expiry) - cursor);
      cursor = time;
      if (time >= expiry) { stacks = 0; rate = 0; }
      const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === time);
      if (!hit || hit.kind !== 'damage') throw new Error('Missing scheduled Nova damage attempt');
      const states = out.events.filter(e => e.kind === 'status-state' && e.target === 'target-0' && e.simClockMs === time);
      if (hit.dodged) {
        misses++;
        expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'poison' && e.simClockMs === time)).toEqual([]);
      } else {
        if (stacks === 0) { rate = Math.max(1, Math.floor(hit.amount * .05)); applied = time; }
        stacks = Math.min(10, stacks + 2); peak = Math.max(peak, stacks); expiry = time + 5000;
        expect(states.some(e => e.kind === 'status-state' && e.statuses.some(s => s.id === 'poison' &&
          s.stacks === stacks && s.dotPerStack === rate && s.appliedAtMs === applied &&
          s.expiresAtMs === expiry && s.sourceId === 'hero' && s.damageType === 'poison'))).toBe(true);
      }
    }
    expect(peak).toBe(10);
    expect(stacks).toBe(finalStacks);
    integral += stacks * rate * Math.max(0, expiry - cursor);
    expect(totalDot(out.events)).toBe(Math.floor(integral / 1000));
    const direct = out.events.reduce((sum, e) => sum + (e.kind === 'damage' && e.target === 'target-0' ? e.amount : 0), 0);
    expect(out.result.enemyTeam[0]?.life).toBe(1000000 - direct - Math.floor(integral / 1000));
    expect(misses).toBe(expectedMisses);
    expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out);
  });
}

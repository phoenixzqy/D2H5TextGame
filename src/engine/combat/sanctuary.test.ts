import { beforeEach, describe, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { monsters } from '../../data';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 10000, mana: 100, stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function input(rank = 1): CombatSnapshot {
  return { seed: 42, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold] }],
    enemyTeam: [{ ...unit('undead', 'enemy'), undead: true }], statAura: {
      selectedAuraId: 'paladin.sanctuary', sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
      bonuses: { arcaneDamagePct: .03 * rank }, sanctuary: { intervalMs: 2000, damage: 20, repulseDurationMs: 500 } } };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out);
  for (const current of [...out.result.playerTeam, ...out.result.enemyTeam]) {
    const original = [...snapshot.playerTeam, ...snapshot.enemyTeam].find(u => u.id === current.id);
    if (original) expect(current.stats).toEqual(original.stats);
    expect(current).not.toHaveProperty('statAura');
  }
  return out;
}
const pulses = (out: ReturnType<typeof record>) => out.events.filter(e => e.kind === 'damage' && e.source === 'hero');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Sanctuary undead damage and no-movement repulsion', () => {
  it.each([1, 20])('pulses rank%i through the inclusive deadline while source is controlled, with actual HP loss and no resource cost', rank => {
    const out = record(input(rank)), damage = pulses(out), amount = rank === 1 ? 20 : 32;
    expect(damage.map(e => e.simClockMs)).toEqual(Array.from({ length: 30 }, (_, i) => (i + 1) * 2000));
    for (const event of damage) expect(event).toMatchObject({ amount, damageType: 'arcane', crit: false, dodged: false });
    expect(out.result.enemyTeam[0]?.life).toBe(10000 - amount * 30);
    expect(out.events.some(e => e.kind === 'mana' || e.kind === 'action' && e.actor === 'hero')).toBe(false);
  });
  it('uses explicit living enemy identity in registration order, including marked reinforcements, while ignoring names and allied identity', () => {
    const marked = { ...unit('renamed', 'enemy'), undead: true as const, name: 'Fallen' };
    const unmarked = { ...unit('monsters/act1.zombie', 'enemy'), name: 'Undead Skeleton' };
    const add = { ...marked, id: 'reinforcement', kind: 'summon' as const, summon: true, ownerId: 'spawner' };
    const ally = { ...unit('merc', 'player'), kind: 'merc' as const, undead: true as const, statuses: [hold] };
    const out = record({ ...input(), playerTeam: [{ ...unit('hero', 'player'), statuses: [hold] }, ally],
      enemyTeam: [marked, unmarked, add, { ...marked, id: 'already-dead', life: 0 }] });
    expect(pulses(out).filter(e => e.simClockMs === 2000).map(e => e.kind === 'damage' ? e.target : ''))
      .toEqual(['renamed', 'reinforcement']);
    expect(out.events.some(e => e.kind === 'status' && e.target === unmarked.id)).toBe(false);
  });
  it.each(['trash', 'boss', 'chapter-boss'] as const)('applies actual timed canonical Stun on %s with existing boss duration scaling', tier => {
    const out = record({ ...input(), enemyTeam: [{ ...unit('undead', 'enemy'), tier, undead: true }] });
    const observation = out.events.find(e => e.kind === 'status-state' && e.target === 'undead' && e.simClockMs === 2000 && e.statuses.some(s => s.id === 'stun'));
    expect(observation).toMatchObject({ statuses: [expect.objectContaining({ id: 'stun', sourceId: 'hero',
      appliedAtMs: 2000, expiresAtMs: tier === 'trash' ? 2500 : 2250 })] });
  });
  it('changes actual action eligibility during repulsion and restores it after exact expiry', () => {
    const snapshot = input(), aura = snapshot.statAura;
    if (!aura) throw new Error('Missing Sanctuary fixture projection');
    const out = record({ ...snapshot, statAura: { ...aura, sanctuary: { intervalMs: 3000, damage: 20, repulseDurationMs: 500 } } });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'undead' && e.simClockMs <= 5100).map(e => e.simClockMs)).toEqual([1700, 5100]);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'undead', simClockMs: 3400 }));
  });
  it('uses source arcane increases and ordinary magical mitigation without crit or dodge rolls', () => {
    const hero = { ...unit('hero', 'player'), statuses: [hold], increasedDamagePct: { arcane: .5 } };
    const enemy = { ...unit('undead', 'enemy'), undead: true as const, stats: { ...unit('undead', 'enemy').stats,
      defense: 99999, magicResist: 7, magicDodge: 1, resistances: { ...unit('undead', 'enemy').stats.resistances, arcane: 50 } } };
    expect(pulses(record({ ...input(), playerTeam: [hero], enemyTeam: [enemy] }))[0]).toMatchObject({ amount: 8, crit: false, dodged: false });
  });
  it('settles source periodic death before a tied pulse and never resurrects or schedules later damage', () => {
    const hero = { ...unit('hero', 'player'), life: 2, statuses: [hold,
      { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] };
    const out = record({ ...input(), playerTeam: [hero], enemyTeam: [{ ...unit('undead', 'enemy'), undead: true, statuses: [hold] }] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 2000 }));
    expect(pulses(out)).toEqual([]); expect(out.events.at(-1)).toMatchObject({ winner: 'enemy', simClockMs: 2000 });
  });
  it('closes a pulse kill exactly once before repulsion and ends before tied enemy actions', () => {
    const enemy = { ...unit('undead', 'enemy'), undead: true as const, life: 1, stats: { ...unit('undead', 'enemy').stats, attackSpeed: 0 } };
    const out = record({ ...input(), enemyTeam: [enemy] });
    expect(out.result.enemyTeam[0]?.life).toBe(0);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'undead')).toHaveLength(1);
    expect(out.events.some(e => e.kind === 'status' && e.target === 'undead')).toBe(false);
    expect(out.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 2000 });
  });
  it('rejects malformed target identity and forged or dead sources without interpreting names', () => {
    for (const undead of [undefined, false, 'true', 1, null]) {
      const enemy = { ...unit('undead', 'enemy'), undead } as unknown as CombatUnit;
      expect(pulses(record({ ...input(), enemyTeam: [enemy] }))).toEqual([]);
    }
    for (const patch of [{ life: 0 }, { kind: 'merc' as const }, { summon: true }, { ownerId: 'other' }, { summonOwnerId: 'other' }]) {
      const hero = { ...unit('hero', 'player'), statuses: [hold], ...patch };
      expect(pulses(record({ ...input(), playerTeam: [hero] }))).toEqual([]);
    }
  });
  it('does not consume extra RNG when only an already controlled marked target receives pulses', () => {
    const snapshot = { ...input(), enemyTeam: [{ ...unit('undead', 'enemy'), undead: true as const, statuses: [hold] }, unit('ordinary', 'enemy')] };
    const { statAura: _aura, ...control } = snapshot;
    const out = record(snapshot), without = record(control);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'ordinary'))
      .toEqual(without.events.filter(e => e.kind === 'damage' && e.source === 'ordinary'));
  });
  it('receives factory-authored undead identity on an actual enemy summon admitted after wave start', () => {
    const zombie = monsters.find(monster => monster.id === 'monsters/act1.zombie');
    if (!zombie) throw new Error('Missing production zombie');
    registerSkill({ id: 'fixture.undead-admit', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 60, manaCost: 0, effects: [{ kind: 'summon', summonId: 'authored-zombie', maxCount: 1, monsterDef: zombie }] });
    const owner = { ...unit('spawner', 'enemy'), skillOrder: ['fixture.undead-admit'] };
    const out = record({ ...input(), enemyTeam: [owner] });
    const spawned = out.result.enemyTeam.find(enemy => enemy.summonOwnerId === 'spawner');
    expect(spawned).toMatchObject({ undead: true, kind: 'summon', summon: true, monsterArchetypeId: zombie.id });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'hero', target: spawned?.id, simClockMs: 2000 }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: spawned?.id, statusId: 'stun', simClockMs: 2000 }));
    expect(pulses(out).every(event => event.kind === 'damage' && event.target === spawned?.id)).toBe(true);
  });
  it.each([1, 20])('grants rank%i Arcane scaling to the original merc on non-undead targets while bench remains baseline', rank => {
    registerSkill({ id: 'fixture.sanctuary-arcane', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      cooldown: 1, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [100, 100] }] });
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const, skillOrder: ['fixture.sanctuary-arcane'] };
    const bench = { ...merc, id: 'bench' };
    const out = record({ ...input(rank), playerTeam: [{ ...unit('hero', 'player'), statuses: [hold] }, merc, bench],
      enemyTeam: [unit('ordinary', 'enemy')] });
    const hit = (id: string) => out.events.find(e => e.kind === 'damage' && e.source === id && e.amount > 0);
    expect(hit('merc')).toMatchObject({ amount: rank === 1 ? 103 : 160 });
    expect(hit('bench')).toMatchObject({ amount: 100 });
    expect(pulses(out)).toEqual([]);
  });
});

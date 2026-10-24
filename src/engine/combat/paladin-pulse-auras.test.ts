import { beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

type PulseId = 'paladin.holy-fire' | 'paladin.holy-shock';
interface PulseSnapshot extends CombatSnapshot {
  readonly statAura: {
    readonly selectedAuraId: PulseId; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly bonuses: { readonly fireDamagePct?: number; readonly lightningDamagePct?: number };
    readonly pulse: { readonly intervalMs: number; readonly damage: number; readonly damageType: 'fire' | 'lightning';
      readonly burn?: { readonly durationMs: number; readonly dotPctOfDamage: number } };
  };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function input(id: PulseId, rank = 1): PulseSnapshot {
  const hero = { ...unit('hero', 'player'), statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  return { seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')],
    statAura: { selectedAuraId: id, sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
      bonuses: id === 'paladin.holy-fire' ? { fireDamagePct: .03 * rank } : { lightningDamagePct: .03 * rank },
      pulse: { intervalMs: 1000, damage: 20, damageType: id === 'paladin.holy-fire' ? 'fire' : 'lightning',
        ...(id === 'paladin.holy-fire' ? { burn: { durationMs: 3000, dotPctOfDamage: .1 } } : {}) } } };
}
function record(snapshot: PulseSnapshot) {
  const before = structuredClone(snapshot), result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out.stats).toEqual([...snapshot.playerTeam, ...snapshot.enemyTeam].find(u => u.id === out.id)?.stats);
    expect(out).not.toHaveProperty('statAura');
  }
  return result;
}
function source(snapshot: PulseSnapshot): CombatUnit {
  const hero = snapshot.playerTeam[0]; if (!hero) throw new Error('Missing source'); return hero;
}
function target(snapshot: PulseSnapshot): CombatUnit {
  const enemy = snapshot.enemyTeam[0]; if (!enemy) throw new Error('Missing enemy'); return enemy;
}
const pulses = (snapshot: PulseSnapshot) => record(snapshot).events.filter(e => e.kind === 'damage' && e.source === 'hero');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Holy Fire and Holy Shock automatic pulses', () => {
  it.each(['paladin.holy-fire', 'paladin.holy-shock'] as const)('pulses %s on exact seconds through the inclusive deadline while the hero is stunned', id => {
    for (const rank of [1, 20]) {
      const snapshot = input(id, rank), r = record(snapshot), damage = pulses(snapshot);
      expect(damage.map(e => e.simClockMs)).toEqual(Array.from({ length: 60 }, (_, i) => (i + 1) * 1000));
      expect(damage.every(e => e.kind === 'damage' && e.amount === (rank === 1 ? 20 : 32) && !e.crit && !e.dodged)).toBe(true);
      expect(r.events.some(e => e.kind === 'action' && e.actor === 'hero')).toBe(false);
      expect(r.events.some(e => e.kind === 'mana')).toBe(false);
      expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
    }
  });
  it('creates real source-owned canonical Burn, cumulative HP loss and capped stacks', () => {
    const r = record(input('paladin.holy-fire'));
    const observed = r.events.filter(e => e.kind === 'status-state' && e.target === 'enemy' && e.simClockMs === 1000);
    expect(observed).toContainEqual(expect.objectContaining({ statuses: [expect.objectContaining({
      id: 'ignite', sourceId: 'hero', stacks: 1, appliedAtMs: 1000, expiresAtMs: 4000, dotPerStack: 2 })] }));
    expect(r.events.filter(e => e.kind === 'dot' && e.target === 'enemy' && e.simClockMs <= 6000)
      .reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(30);
    expect(r.result.enemyTeam[0]?.statuses.find(s => s.id === 'ignite')?.stacks).toBe(5);
    const actualDamage = r.events.filter(e => (e.kind === 'damage' || e.kind === 'dot') && e.target === 'enemy')
      .reduce((sum, e) => sum + (e.kind === 'damage' || e.kind === 'dot' ? e.amount : 0), 0);
    expect(r.result.enemyTeam[0]?.life).toBe(100000 - actualDamage);
  });
  it.each(['paladin.holy-fire', 'paladin.holy-shock'] as const)('uses %s increases, combos and mitigation without dodge/crit or extra damage RNG', id => {
    const snapshot = input(id), hero = source(snapshot), enemy = target(snapshot), type = snapshot.statAura.pulse.damageType;
    const r = record({ ...snapshot, playerTeam: [{ ...hero, stats: { ...hero.stats, critChance: 1 }, increasedDamagePct: { [type]: .5 } }],
      enemyTeam: [{ ...enemy, stats: { ...enemy.stats, defense: 3, magicResist: 7, physDodge: 1, magicDodge: 1,
        resistances: { ...enemy.stats.resistances, [type]: 50 } },
        statuses: [{ id: type === 'fire' ? 'paralyze' : 'chill', sourceId: 'combo', stacks: 1, remaining: -1 }] }] });
    expect(r.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: type === 'fire' ? 15 : 12, crit: false, dodged: false });
    const { statAura: _projection, ...control } = snapshot;
    expect(record(snapshot).events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual(runBattleRecorded(control).events.filter(e => e.kind === 'damage' && e.source === 'enemy'));
  });
  it.each(['stun', 'freeze'])('settles source periodic death before a due pulse despite source %s', id => {
    const snapshot = input('paladin.holy-fire'), hero = source(snapshot);
    const r = record({ ...snapshot, playerTeam: [{ ...hero, life: 1, statuses: [
      { id, sourceId: 'control', stacks: 1, remaining: -1 },
      { id: 'poison', sourceId: 'poison', stacks: 1, remaining: -1, dotPerStack: 1 }] }] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 1000 }));
    expect(r.events.some(e => e.kind === 'damage')).toBe(false);
    expect(r.events.at(-1)).toMatchObject({ winner: 'enemy', simClockMs: 1000 });
  });
  it('pulses all living enemies in registration order and ends on pulse victory without a tied enemy action', () => {
    const snapshot = input('paladin.holy-shock');
    const enemies = ['one', 'two'].map(id => ({ ...unit(id, 'enemy'), life: 20, stats: { ...unit(id, 'enemy').stats, attackSpeed: 0 } }));
    const r = record({ ...snapshot, statAura: { ...snapshot.statAura, pulse: { ...snapshot.statAura.pulse, intervalMs: 2000 } }, enemyTeam: enemies });
    expect(r.events.flatMap(e => e.kind === 'damage' ? [[e.target, e.simClockMs]] : []))
      .toEqual([['one', 2000], ['two', 2000]]);
    expect(r.events.flatMap(e => e.kind === 'death' ? [e.target] : [])).toEqual(['one', 'two']);
    expect(r.events.some(e => e.kind === 'action')).toBe(false);
    expect(r.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 2000 });
  });
  it('uses alternate copied tuning and never frontloads at wave entry', () => {
    const snapshot = input('paladin.holy-shock'), r = record({ ...snapshot, statAura: { ...snapshot.statAura,
      pulse: { intervalMs: 1500, damage: 40, damageType: 'lightning' } } });
    const hits = r.events.filter(e => e.kind === 'damage' && e.source === 'hero').slice(0, 3);
    expect(hits).toHaveLength(3);
    for (const [i, simClockMs] of [1500, 3000, 4500].entries()) {
      expect(hits[i]).toMatchObject({ amount: 41, simClockMs });
    }
  });
  it('keeps pulsing through source Freeze and stops at the actual action cap without future catch-up', () => {
    const snapshot = input('paladin.holy-shock'), hero = source(snapshot);
    const fast = (u: CombatUnit): CombatUnit => ({ ...u, stats: { ...u.stats, attack: 1, attackSpeed: 263 } });
    const r = record({ ...snapshot, playerTeam: [fast({ ...hero,
      statuses: [{ id: 'freeze', sourceId: 'control', stacks: 1, remaining: -1 }] }),
      ...Array.from({ length: 7 }, (_, i) => fast({ ...unit(`ally-${String(i)}`, 'player'), kind: 'merc' }))],
      enemyTeam: [fast(target(snapshot))] });
    const end = r.events.at(-1)?.simClockMs;
    expect(end).toBeDefined();
    expect(end).toBeLessThan(60000);
    const damage = r.events.filter(e => e.kind === 'damage' && e.source === 'hero');
    expect(damage.length).toBeGreaterThan(0);
    expect(damage.map(e => e.simClockMs)).toEqual(Array.from({ length: Math.floor((end ?? 0) / 1000) }, (_, i) => (i + 1) * 1000));
    expect(r.events.some(e => e.kind === 'action' && e.actor === 'hero')).toBe(false);
  });
  it('rejects invalid copied pulse potency rather than trusting direct-engine metadata', () => {
    const snapshot = input('paladin.holy-shock');
    for (const pulse of [{ intervalMs: 0, damage: 20, damageType: 'lightning' as const },
      { intervalMs: 1000, damage: NaN, damageType: 'lightning' as const },
      { intervalMs: 1000, damage: 20, damageType: 'fire' as const }]) {
      expect(pulses({ ...snapshot, statAura: { ...snapshot.statAura, pulse } })).toEqual([]);
    }
  });
});

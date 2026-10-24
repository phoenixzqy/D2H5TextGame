import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as damage from './damage';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DamageType } from '../types/attributes';

type EnemyAuraId = 'paladin.holy-freeze' | 'paladin.conviction';
interface EnemySnapshot extends CombatSnapshot {
  readonly statAura: {
    readonly selectedAuraId: EnemyAuraId; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly enemyResistReductionPct?: number;
    readonly bonuses: Readonly<Partial<Record<'coldDamagePct' | 'physDodgePct' | 'elementalDamagePct' | 'arcaneDamagePct', number>>>;
  };
}
function unit(id: string, side: CombatUnit['side'], speed = 100): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: speed, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function input(id: EnemyAuraId, rank = 20): EnemySnapshot {
  return { seed: 7, playerTeam: [unit('hero', 'player')], enemyTeam: [unit('enemy', 'enemy')],
    statAura: { selectedAuraId: id, sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
      ...(id === 'paladin.conviction' ? { enemyResistReductionPct: 25 } : {}),
      bonuses: id === 'paladin.holy-freeze' ? { coldDamagePct: .03 * rank, physDodgePct: .005 * rank }
        : { elementalDamagePct: .02 * rank, arcaneDamagePct: .01 * rank } } };
}
function record(snapshot: EnemySnapshot) {
  const before = structuredClone(snapshot), result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out.stats).toEqual([...snapshot.playerTeam, ...snapshot.enemyTeam].find(u => u.id === out.id)?.stats);
    expect(out).not.toHaveProperty('statAura');
  }
  return result;
}
function hero(snapshot: EnemySnapshot): CombatUnit {
  const value = snapshot.playerTeam[0]; if (!value) throw new Error('Missing source hero'); return value;
}
function enemy(snapshot: EnemySnapshot): CombatUnit {
  const value = snapshot.enemyTeam[0]; if (!value) throw new Error('Missing enemy'); return value;
}
const hits = (snapshot: EnemySnapshot, source = 'hero') => record(snapshot).events
  .filter(e => e.kind === 'damage' && e.source === source && !e.dodged);
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected player Holy Freeze enemy effect', () => {
  it.each([1, 20])('derives one source-owned Chill and actual cadence at rank%s, with no merc marker or raw mutation', rank => {
    const snapshot = input('paladin.holy-freeze', rank), r = record(snapshot);
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'enemy').slice(0, 3)
      .map(e => e.simClockMs)).toEqual([2000, 4000, 6000]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', initial: true,
      statuses: [expect.objectContaining({ id: 'chill', sourceId: 'hero' })] }));
    expect(r.events.some(e => e.kind === 'action' && e.skillId === 'paladin.holy_freeze')).toBe(false);
    expect(r.result.enemyTeam[0]?.statuses).toEqual([]);
    expect(r.result.playerTeam[0]).not.toHaveProperty('holyFreezeAura');
  });
  it('does not multiply ordinary and mercenary Chill, and keeps the merc cold bonus separate', () => {
    const snapshot = input('paladin.holy-freeze');
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const, holyFreezeAura: true as const };
    const actor = { ...hero(snapshot), basicAttack: { damageType: 'cold' as const, damage: [100, 100] as const } };
    const target = { ...enemy(snapshot), stats: { ...enemy(snapshot).stats, attackSpeed: 200 },
      statuses: [{ id: 'chill', stacks: 1, sourceId: 'spell', remaining: -1, appliedAtMs: 0, expiresAtMs: 2500 }] };
    const combined = { ...snapshot, playerTeam: [actor, merc], enemyTeam: [target] };
    const r = record(combined);
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'enemy').slice(0, 3)
      .map(e => e.simClockMs)).toEqual([1700, 3400, 5100]);
    expect(hits(combined)[0]).toMatchObject({ amount: 180 });
    expect(r.events.filter(e => e.kind === 'status-state' && e.target === 'enemy')
      .every(e => e.kind === 'status-state' && e.statuses.filter(s => s.id === 'chill').length === 1)).toBe(true);
    expect(hits({ ...snapshot, playerTeam: [actor] })[0]).toMatchObject({ amount: 160 });
  });
  it('retains player Chill and cadence after the mercenary aura source dies', () => {
    const snapshot = input('paladin.holy-freeze');
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const, holyFreezeAura: true as const, life: 1,
      statuses: [{ id: 'poison', stacks: 1, sourceId: 'fixture', remaining: -1, dotPerStack: 1 }] };
    const r = record({ ...snapshot, playerTeam: [...snapshot.playerTeam, merc] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc', simClockMs: 1000 }));
    expect(r.events.find(e => e.kind === 'action' && e.actor === 'enemy')?.simClockMs).toBe(2000);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', simClockMs: 1000,
      statuses: [expect.objectContaining({ id: 'chill', sourceId: 'hero' })] }));
  });
  it.each(['stun', 'freeze'])('keeps the source aura during %s and withdraws derived Chill at lethal periodic settlement', id => {
    const snapshot = input('paladin.holy-freeze');
    const disabled = { ...hero(snapshot), statuses: [{ id, stacks: 1, sourceId: 'fixture', remaining: -1 }] };
    expect(record({ ...snapshot, playerTeam: [disabled] }).events
      .find(e => e.kind === 'action' && e.actor === 'enemy')?.simClockMs).toBe(2000);
    const dying = { ...hero(snapshot), life: 1, statuses: [
      { id: 'poison', stacks: 1, sourceId: 'fixture', remaining: -1, dotPerStack: 1 }] };
    const r = record({ ...snapshot, playerTeam: [dying] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 1000 }));
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', statuses: [], simClockMs: 1000 }));
    expect(r.events.some(e => e.kind === 'action' && e.simClockMs >= 1000)).toBe(false);
  });
  it('uses actual physical dodge for only the hero and originally fielded merc', () => {
    const snapshot = input('paladin.holy-freeze'), target = enemy(snapshot);
    const resolution = vi.spyOn(damage, 'resolveDamage');
    try {
      for (const kind of ['hero', 'merc', 'summon'] as const) {
        resolution.mockClear();
        const recipient = { ...unit(kind === 'hero' ? 'hero' : kind === 'merc' ? 'merc' : 'summon', 'player'), kind,
          stats: { ...unit('recipient', 'player').stats, magicResist: 123 },
          ...(kind === 'summon' ? { summon: true, summonOwnerId: 'hero' } : {}) };
        const team = kind === 'hero' ? [recipient] : [hero(snapshot), recipient];
        const r = record({ ...snapshot, playerTeam: team, enemyTeam: [target] });
        const incoming = r.events.filter(e => e.kind === 'damage' && e.target === recipient.id);
        expect(incoming.length).toBeGreaterThan(0);
        // Misses share the dodged event flag; inspect the real resolver's numeric input.
        const inputs = resolution.mock.calls.map(([value]) => value).filter(value => value.defenderMagicResist === 123);
        expect(inputs.length).toBeGreaterThan(0);
        expect(inputs.every(value => value.defenderDodge === (kind === 'summon' ? 0 : .1))).toBe(true);
      }
    } finally { resolution.mockRestore(); }
  });
});

describe('selected player Conviction enemy resistance reduction', () => {
  it.each([
    ['physical', 75], ['fire', 105], ['cold', 105], ['lightning', 105], ['arcane', 90], ['poison', 75]
  ] as const)('reduces actual %s resistance before mitigation and preserves raw stats', (damageType, amount) => {
    const snapshot = input('paladin.conviction'), target = enemy(snapshot);
    const resistances = { physical: 50, fire: 50, cold: 50, lightning: 50, arcane: 50, poison: 50 };
    const actor = { ...hero(snapshot), basicAttack: { damageType, damage: [100, 100] as const } };
    const test = { ...snapshot, playerTeam: [actor], enemyTeam: [{ ...target, stats: { ...target.stats, resistances } }] };
    expect(hits(test)[0]).toMatchObject({ damageType, amount });
    expect(hits(test, 'enemy')[0]).toMatchObject({ amount: 100 });
  });
  it('adds to Cold Mastery penetration and preserves the lower resistance clamp', () => {
    const snapshot = input('paladin.conviction', 1);
    const actor = { ...hero(snapshot), coldResistanceReductionPct: 25,
      basicAttack: { damageType: 'cold' as const, damage: [100, 100] as const } };
    expect(hits({ ...snapshot, playerTeam: [actor] })[0]).toMatchObject({ amount: 153 });
    expect(hits({ ...snapshot, playerTeam: [{ ...actor, coldResistanceReductionPct: 200 }] })[0])
      .toMatchObject({ amount: 204 });
  });
  it('adds to Amplify Damage before physical mitigation', () => {
    const snapshot = input('paladin.conviction'), target = enemy(snapshot);
    const cursed = { ...target, stats: { ...target.stats, resistances: { ...target.stats.resistances, physical: 50 } },
      statuses: [{ id: 'amplify-damage', sourceId: 'curse', stacks: 1, remaining: -1, physicalResistReductionPct: 20 }] };
    expect(hits({ ...snapshot, enemyTeam: [cursed] })[0]).toMatchObject({ amount: 95 });
  });
  it('keeps Conviction active through source control and grants damage bonuses to the original mercenary', () => {
    const snapshot = input('paladin.conviction');
    const controlled = { ...hero(snapshot), statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const,
      basicAttack: { damageType: 'arcane' as const, damage: [100, 100] as const } };
    expect(hits({ ...snapshot, playerTeam: [controlled, merc] }, 'merc')[0]).toMatchObject({ amount: 150 });
  });
  it('exposes the enemy debuff to summons without granting them the recipient damage bonus', () => {
    const snapshot = input('paladin.conviction');
    const summon = { ...unit('summon', 'player', 200), kind: 'summon' as const, summon: true, summonOwnerId: 'hero',
      basicAttack: { damageType: 'fire' as const, damage: [100, 100] as const } };
    const r = { ...snapshot, playerTeam: [...snapshot.playerTeam, summon] };
    expect(hits(r, 'summon')[0]).toMatchObject({ amount: 125 });
  });
  it.each([0, -25, 100])('uses copied JSON resistance tuning%s rather than an engine constant', enemyResistReductionPct => {
    const snapshot = input('paladin.conviction', 1);
    const test = { ...snapshot, statAura: { ...snapshot.statAura, enemyResistReductionPct },
      playerTeam: [{ ...hero(snapshot), basicAttack: { damageType: 'poison' as DamageType, damage: [100, 100] as const } }] };
    expect(hits(test)[0]).toMatchObject({ amount: enemyResistReductionPct < 0 ? 100 : 100 + enemyResistReductionPct });
  });
});

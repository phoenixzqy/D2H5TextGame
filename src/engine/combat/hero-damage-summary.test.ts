import { describe, expect, it } from 'vitest';
import type { BattleEvent } from './combat';
import type { CombatUnit } from './types';
import { summarizeHeroDamage } from './hero-damage-summary';

const hero: CombatUnit = {
  id: 'hero', name: 'Hero', side: 'player', kind: 'hero', level: 1, tier: 'trash', life: 0, mana: 0,
  stats: { life: 0, lifeMax: 10, mana: 0, manaMax: 0, attack: 1, attackSpeed: 100, defense: 0,
    magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
  statuses: [], cooldowns: {}, activeBuffIds: [], skillOrder: [], enraged: false
};
const end: BattleEvent = { kind: 'end', winner: 'enemy' };
const hit = (type: string, amount: number, target = hero.id): Extract<BattleEvent, { kind: 'damage' }> => ({
  kind: 'damage', source: 'enemy', target, damageType: type, amount, crit: false, dodged: false
});

describe('recorded final-wave hero damage', () => {
  it('counts positive post-defense amounts once, including self-damage and overkill, without changing input', () => {
    const events: BattleEvent[] = [
      { ...hit('physical', 11), absorbed: 100, cycloneAbsorbed: 20, holyShieldAbsorbed: 30, wallAbsorbed: 40 },
      hit('physical', 9), { ...hit('true', 3), source: hero.id },
      { ...hit('physical', 1000), dodged: true }, hit('fire', 0), hit('cold', -3),
      hit('lightning', NaN), hit('arcane', Infinity),
      { kind: 'heal', target: hero.id, amount: 99 }, { kind: 'death', target: hero.id }, end
    ];
    const before = structuredClone({ events, hero });
    expect(summarizeHeroDamage(events, [hero])).toEqual({
      byType: [{ type: 'physical', amount: 20 }, { type: 'true', amount: 3 }], total: 23
    });
    expect({ events, hero }).toEqual(before);
  });

  it('preserves all known direct types and combines unknown direct types without leaking raw keys', () => {
    const types = ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns', 'true'];
    const events = [...types.map(type => hit(type, 2)), hit('unknown', 3), hit('dot', 4), hit('other', 5), end];
    expect(summarizeHeroDamage(events, [hero])).toEqual({
      byType: [...types.map(type => ({ type, amount: 2 })), { type: 'other', amount: 12 }], total: 28
    });
  });

  it('keeps periodic amounts pooled regardless of typed/raw provenance, absorbed amounts or missing history', () => {
    const events: BattleEvent[] = [hit('fire', 2), {
      kind: 'dot', target: hero.id, amount: 3, absorbed: 20, cycloneAbsorbed: 7, holyShieldAbsorbed: 5, wallAbsorbed: 9,
      provenance: { fromMs: 0, toMs: 1000, rawAmount: 44, carryInHpMs: 900, carryOutHpMs: 100,
        contributions: [
          { source: 'enemy', statusId: 'poison', damageType: 'poison', hpMs: 18800 },
          { source: 'enemy', statusId: 'ignite', damageType: 'fire', hpMs: 24400 }
        ] }
    }, { kind: 'dot', target: hero.id, amount: 4 }, { kind: 'dot', target: hero.id, amount: 0 }, end];
    expect(summarizeHeroDamage(events, [hero])).toEqual({
      byType: [{ type: 'fire', amount: 2 }, { type: 'dot', amount: 7 }], total: 9
    });
  });

  it('excludes mercenaries, summons, enemy heroes and enemy targets while supporting legacy hero inference', () => {
    const { kind, ...legacyBody } = hero;
    expect(kind).toBe('hero');
    const merc = { ...hero, id: 'merc-fixture', kind: 'merc' as const };
    const summon = { ...legacyBody, id: 'player-summon', summonOwnerId: hero.id };
    const enemy = { ...hero, id: 'enemy-hero', side: 'enemy' as const };
    const legacy = { ...legacyBody, id: 'player-fixture' };
    const team = [merc, summon, enemy, legacy];
    const events = [...team.map(unit => hit('physical', unit === legacy ? 7 : 1000, unit.id)), end];
    expect(summarizeHeroDamage(events, team)).toEqual({ byType: [{ type: 'physical', amount: 7 }], total: 7 });
    expect(summarizeHeroDamage(events, team.slice(0, 3))).toBeNull();
  });

  it('distinguishes a valid no-damage wave from missing hero or missing terminal recording', () => {
    expect(summarizeHeroDamage([end], [hero])).toEqual({ byType: [], total: 0 });
    expect(summarizeHeroDamage([hit('physical', 0), end], [hero])).toEqual({ byType: [], total: 0 });
    expect(summarizeHeroDamage([], [hero])).toBeNull();
    expect(summarizeHeroDamage([hit('physical', 5)], [hero])).toBeNull();
    expect(summarizeHeroDamage([hit('physical', 5), end], [])).toBeNull();
  });

  it('uses the entire supplied wave recording even when its visible log would have truncated early damage', () => {
    const events: BattleEvent[] = [hit('cold', 17), ...Array.from({ length: 250 }, (): BattleEvent => ({
      kind: 'action', actor: hero.id, skillId: null
    })), hit('cold', 3), end];
    expect(summarizeHeroDamage(events, [hero])).toEqual({ byType: [{ type: 'cold', amount: 20 }], total: 20 });
  });
});

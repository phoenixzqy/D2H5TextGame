import { beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const beasts = [
  { template: 'spirit_wolf', slug: 'summon_spirit_wolf', rank: 10, cap: 5, cost: 13,
    attack: 818, hit: 58, rankOneHit: 1 },
  { template: 'dire_wolf', slug: 'summon_dire_wolf', rank: 10, cap: 5, cost: 18,
    attack: 1051, hit: 178, rankOneHit: 94 },
  { template: 'grizzly', slug: 'summon_grizzly', rank: 20, cap: 1, cost: 30,
    attack: 1720, hit: 522, rankOneHit: 278 }
] as const;

function fixture(beast: typeof beasts[number], rank: number, defense = 363): CombatSnapshot {
  const skill = 'druid.' + beast.slug;
  const hero: CombatUnit = {
    id: 'hero', name: 'Isolated beast owner', side: 'player', kind: 'hero',
    level: 49, tier: 'trash', life: 10000, mana: 100,
    stats: {
      life: 10000, lifeMax: 10000, mana: 100, manaMax: 100,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 0,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [{ id: 'stun', sourceId: 'fixture-isolation', stacks: 1, remaining: -1 }],
    skillOrder: [skill], skillLevels: { [skill]: rank },
    druidSummonRanks: { [beast.template]: rank },
    activeBuffIds: [], cooldowns: {}, enraged: false
  };
  const target: CombatUnit = {
    ...hero, id: 'target', name: 'Isolated armored target', kind: 'monster', side: 'enemy',
    life: 1000000, skillOrder: [], skillLevels: {}, druidSummonRanks: {},
    stats: { ...hero.stats, life: 1000000, lifeMax: 1000000, defense,
      resistances: { ...hero.stats.resistances, physical: 50 } }
  };
  return {
    seed: 7, maxRounds: 2, playerTeam: [hero], enemyTeam: [target],
    druidAllyAuras: { sourceHeroId: hero.id, oakRank: 1, heartRank: 1 }
  };
}

beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe.each(beasts)('$template invested native damage', (beast) => {
  it('pays one capped batch and improves actual noncritical hits through late armor', () => {
    const input = fixture(beast, beast.rank), before = structuredClone(input);
    const out = runBattleRecorded(input);
    const spawns = out.events.filter(event => event.kind === 'summon');
    expect(spawns).toHaveLength(beast.cap);
    for (const event of spawns) {
      expect(event.unit).toMatchObject({ summonOwnerId: 'hero', summonTemplateId: beast.template });
      expect(event.unit.stats.attack).toBe(beast.attack);
    }
    expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - beast.cost, simClockMs: 0 })
    ]);
    const sources = new Set(spawns.map(event => event.unit.id));
    const hits = out.events.filter(event => event.kind === 'damage' &&
      sources.has(event.source) && !event.dodged && !event.crit);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) expect(hit).toMatchObject({ target: 'target', damageType: 'physical', amount: beast.hit });
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(out);
  });

  it('preserves rank-one damage against the same target', () => {
    const out = runBattleRecorded(fixture(beast, 1));
    const spawns = out.events.filter(event => event.kind === 'summon');
    expect(spawns).toHaveLength(1);
    const source = spawns[0]?.unit.id;
    const hit = out.events.find(event => event.kind === 'damage' &&
      event.source === source && !event.dodged && !event.crit);
    expect(hit).toMatchObject({ amount: beast.rankOneHit });
  });

  it('retains the damage floor against overwhelming armor', () => {
    const out = runBattleRecorded(fixture(beast, beast.rank, 100000));
    const hit = out.events.find(event => event.kind === 'damage' && !event.dodged && !event.crit);
    expect(hit).toMatchObject({ amount: 1 });
  });
});

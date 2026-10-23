import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import wordSchema from '@/data/schema/runeword.schema.json';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '../types/items';
import type { Mercenary } from '../types/entities';
import { deriveStats } from './stats';
import { deriveEquippedPlayerStats } from './equipped-stats';
import { deriveEquippedMercStats } from './merc-equipment-stats';
import { resolveDamage } from '../combat/damage';
import type { CombatUnit } from '../combat/types';
import { buildSummon } from '../skills/summons';
import { createRng } from '../rng';

const coreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20 };
function exile(): Item {
  return { id: 'exile-control', baseId: 'items/base/sh-monarch', rarity: 'runeword',
    runewordId: 'runewords/exile', level: 60, socketCapacity: 4,
    socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })),
    baseRolls: { defense: 64 }, identified: true, equipped: false };
}
function hero() {
  return { coreStats, derivedStats: { ...deriveStats(coreStats, 60), life: 43, mana: 27 } };
}
function merc(): Mercenary {
  return { id: 'exile-merc', name: 'Exile control', type: 'mercenary', team: 'player',
    level: 60, coreStats, derivedStats: { ...hero().derivedStats, defense: 91.25 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true,
    turnOrder: 0, archetype: 'front', rarity: 'R', classId: 'rogue', equipment: [] };
}

describe('approved Exile grant composition', () => {
  it('authenticates rank and tuning through a closed authored schema', () => {
    const word = socketRunewords.find(row => row.id === 'runewords/exile');
    expect(word).toHaveProperty('grants', [{ id: 'aura-defiance', rank: 5, defensePct: .20 }]);
    const check = new Ajv2020({ strict: true }).compile(wordSchema);
    const grant = { id: 'aura-defiance', rank: 5, defensePct: .20 };
    expect(check({ ...word, grants: [grant] })).toBe(true);
    for (const invalid of [{ ...grant, defensePct: -1 }, { ...grant, defensePct: 2 },
      { ...grant, rank: 0 }, { ...grant, rank: 1.5 }, { ...grant, id: 'unknown' },
      { ...grant, arbitrary: true }, { id: grant.id, rank: grant.rank }]) {
      expect(check({ ...word, grants: [invalid] })).toBe(false);
    }
  });
  it('multiplies the complete ordinary hero defense once and preserves fractions and resources', () => {
    const owner = hero(), gear = { offhand: exile() };
    const before = structuredClone({ owner, gear });
    const stats = deriveEquippedPlayerStats(owner, 60, gear);
    // L60 naked197 + persisted shield64 + authored Exile220 =481; grant×1.20.
    expect(stats.defense).toBeCloseTo(577.2, 12);
    expect(stats).toMatchObject({ life: 43, mana: 27 });
    expect(deriveEquippedPlayerStats({ ...owner, derivedStats: stats }, 60, gear)).toEqual(stats);
    expect({ owner, gear }).toEqual(before);
  });
  it('removes the grant with the source and never learns or persists a grant cache', () => {
    const owner = hero();
    const equipped = deriveEquippedPlayerStats(owner, 60, { offhand: exile() });
    const removed = deriveEquippedPlayerStats({ ...owner, derivedStats: equipped }, 60, {});
    expect(removed).toEqual(owner.derivedStats);
    expect(Object.keys(equipped).sort()).toEqual(Object.keys(owner.derivedStats).sort());
  });
  it('multiplies the saved merc baseline plus flat gear delta, rather than multiplying G−B alone', () => {
    const owner = merc(), gear = { offhand: exile() };
    const before = structuredClone(owner);
    const stats = deriveEquippedMercStats(owner, gear);
    // Saved91.25 + persisted shield64 + Exile220 =375.25; grant×1.20.
    expect(stats.defense).toBeCloseTo(450.3, 12);
    expect(stats).toMatchObject({ life: 43, mana: 27 });
    expect(deriveEquippedMercStats(owner, gear)).toEqual(stats);
    expect(deriveEquippedMercStats(owner, {})).toEqual(before.derivedStats);
    expect(owner).toEqual(before);
  });
  it('retains exact canonical socket validation before applying any claimed grant', () => {
    const wrongOrder = { ...exile(), socketContents: [...(exile().socketContents ?? [])].reverse() };
    expect(() => deriveEquippedPlayerStats(hero(), 60, { offhand: wrongOrder })).toThrow(/runeword/);
    expect(() => deriveEquippedMercStats(merc(), { offhand: wrongOrder })).toThrow(/runeword/);
  });
  it('keeps the equipped defense grant on the owner without inheriting it into summons', () => {
    const bareStats = hero().derivedStats;
    const owner: CombatUnit = { id: 'exile-owner', name: 'Exile owner', side: 'player',
      level: 60, tier: 'trash', stats: bareStats, life: 43, mana: 27,
      statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
      enraged: false, summonedAdds: false, kind: 'hero' };
    const geared = { ...owner, stats: deriveEquippedPlayerStats(hero(), 60, { offhand: exile() }) };
    const before = structuredClone(geared);
    expect(geared.stats.defense).toBeCloseTo(577.2, 12);
    for (const template of ['skeleton', 'clay_golem', 'valkyrie']) {
      const bareSummon = buildSummon(owner, template);
      const gearedSummon = buildSummon(geared, template);
      expect(bareSummon).toBeDefined();
      expect(gearedSummon).toEqual(bareSummon);
    }
    expect(geared).toEqual(before);
  });
  it('reduces actual landed physical damage through the existing fractional mitigation pipeline', () => {
    const stats = deriveEquippedPlayerStats(hero(), 60, { offhand: exile() });
    const input = { baseMin: 1000, baseMax: 1000, flatBonus: 0, increasedPct: 0,
      comboMult: 1, type: 'physical' as const, critChance: 0, critMult: 2,
      defenderResistances: stats.resistances, defenderMagicResist: stats.magicResist,
      defenderDodge: 0, ignoreDodge: true, defenderArmor: stats.defense };
    const actual = resolveDamage(input, createRng(7));
    expect(actual).toMatchObject({ hit: true, crit: false, final: 422 });
    expect(resolveDamage({ ...input, defenderArmor: 481 }, createRng(7)).final).toBe(519);
    expect(resolveDamage(input, createRng(7))).toEqual(actual);
  });
});

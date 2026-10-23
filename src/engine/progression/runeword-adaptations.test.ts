import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import schema from '@/data/schema/runeword.schema.json';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '../types/items';
import type { Mercenary } from '../types/entities';
import { deriveStats } from './stats';
import { deriveEquippedPlayerStats } from './equipped-stats';
import { deriveEquippedMercStats } from './merc-equipment-stats';

const expected = {
  leaf: { id: 'skill-fire-bolt', rank: 3, skillId: 'sorceress.fire_bolt', increasedDamagePct: { fire: .12 } },
  infinity: { id: 'aura-conviction', rank: 5, increasedDamagePct: { fire: .10, cold: .10, lightning: .10, poison: .10, arcane: .05 } },
  beast: { id: 'skill-lycanthropy', rank: 5, lifePct: .15, attackSpeedPct: .05 },
  bramble: { id: 'aura-thorns-aura', rank: 5, reflectionPct: .20 },
  'last-wish': { id: 'skill-fade', rank: 5, allResistance: 10, magicDodge: .025 },
  phoenix: { id: 'aura-redemption', rank: 1, skillId: 'item.redemption', manaRegenPct: .10 },
  dream: { id: 'aura-holy-shock', rank: 5, increasedDamagePct: { lightning: .15 } },
  'hand-of-justice': { id: 'skill-blaze', rank: 5, skillId: 'sorceress.blaze' },
  death: { id: 'skill-chain-lightning', rank: 5, skillId: 'sorceress.chain_lightning' }
};
const coreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20 };
const owner = { coreStats, derivedStats: { ...deriveStats(coreStats, 60), life: 43, mana: 27 } };
function wordItem(word: string, baseId: string): Item {
  const data = socketRunewords.find(row => row.id === `runewords/${word}`);
  if (!data) throw new Error(`Missing runeword ${word}`);
  return { id: word, baseId, runewordId: data.id, rarity: 'runeword', level: 70,
    socketCapacity: data.sockets, identified: true, equipped: false,
    socketContents: data.runes.map(id => ({ kind: 'rune', id })) };
}
function merc(): Mercenary {
  return { id: 'grant-merc', name: 'Grant control', type: 'mercenary', team: 'player',
    level: 60, coreStats, derivedStats: { ...owner.derivedStats, lifeMax: 701.25, attackSpeed: 133.5 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true,
    turnOrder: 0, archetype: 'front', rarity: 'R', classId: 'rogue', equipment: [] };
}

describe('reviewed D10 runeword adaptations', () => {
  const check = new Ajv2020({ strict: true }).compile(schema);
  it.each(Object.entries(expected))('authors a closed %s adaptation rather than an inert marker', (id, grant) => {
    const data = socketRunewords.find(row => row.id === `runewords/${id}`);
    if (!data) throw new Error(`Missing runeword ${id}`);
    expect(data).toHaveProperty('grants', [grant]);
    expect(check(data)).toBe(true);
    expect(check({ ...data, grants: [{ ...grant, extra: true }] })).toBe(false);
    expect(check({ ...data, grants: [{ ...grant, rank: 0 }] })).toBe(false);
  });
  it('applies Beast after complete flat life/speed, without rounding, healing or compounding', () => {
    const beast = wordItem('beast', 'items/base/wp2h-thunder-maul');
    // Lum's +10 Energy and Beast's +40 Strength leave ordinary Life612 and AS120.
    const stats = deriveEquippedPlayerStats(owner, 60, { weapon: beast });
    expect(stats.lifeMax).toBeCloseTo(612 * 1.15, 12);
    expect(stats.attackSpeed).toBe(126);
    expect(stats).toMatchObject({ life: 43, mana: 27 });
    expect(deriveEquippedPlayerStats({ ...owner, derivedStats: stats }, 60, { weapon: beast })).toEqual(stats);
    expect(deriveEquippedPlayerStats({ ...owner, derivedStats: stats }, 60, {})).toEqual(owner.derivedStats);
    const input = merc(), before = structuredClone(input);
    const projected = deriveEquippedMercStats(input, { weapon: beast });
    expect(projected.lifeMax).toBeCloseTo(701.25 * 1.15, 12);
    expect(projected.attackSpeed).toBeCloseTo(133.5 * 1.05, 12);
    expect(projected).toMatchObject({ life: 43, mana: 27 });
    expect(deriveEquippedMercStats(input, {})).toEqual(before.derivedStats);
    expect(input).toEqual(before);
  });
  it('adds Fade after ordinary resistance/dodge for either bearer and clears on removal', () => {
    const wish = wordItem('last-wish', 'items/base/wp1h-legend-sword');
    const input = merc();
    for (const stats of [deriveEquippedPlayerStats(owner, 60, { weapon: wish }),
      deriveEquippedMercStats(input, { weapon: wish })]) {
      expect(stats.resistances).toEqual({ physical: 10, fire: 10, cold: 10, lightning: 10, poison: 10, arcane: 10 });
      expect(stats.magicDodge).toBeCloseTo(.075, 12);
      expect(stats).toMatchObject({ life: 43, mana: 27 });
    }
    expect(deriveEquippedPlayerStats(owner, 60, {})).toEqual(owner.derivedStats);
    expect(deriveEquippedMercStats(input, {})).toEqual(input.derivedStats);
  });
});

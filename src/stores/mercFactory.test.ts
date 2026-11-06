import { beforeEach, describe, expect, it } from 'vitest';
import { loadMercPool, type MercDef } from '@/data/loaders/mercs';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import type { Item } from '@/engine/types/items';
import { createMercFromDef } from './mercFactory';
import { mercXpForLevel, useMercStore } from './mercStore';

function telekinesis(): MercDef {
  const def = loadMercPool().pool.find(candidate => candidate.id === 'mercs/act3-iron-wolf-telekinesis');
  if (!def) throw new Error('Missing real Telekinesis Iron Wolf');
  return def;
}

beforeEach(() => { useMercStore.getState().reset(); });

describe('new paid mercenary natural baseline', () => {
  it('scales the observed late-game Iron Wolf from L1 with full initial resources', () => {
    const def = telekinesis(), before = structuredClone(def);
    const merc = createMercFromDef(def, 'paid', 70);
    expect(merc.id).toBe(`${def.id}#paid`);
    expect(merc.level).toBe(70);
    expect(merc.coreStats).toEqual({ strength: 81, dexterity: 83, vitality: 16, energy: 300 });
    expect(merc.derivedStats).toEqual({ life: 546, lifeMax: 546, mana: 701, manaMax: 701,
      attack: 189, defense: 227, magicResist: 0, attackSpeed: 183, critChance: .05,
      critDamage: 2, physDodge: .21600000000000003, magicDodge: .05, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } });
    expect(merc.comboOrder).toEqual(['mskill-telekinesis']);
    expect(merc.equipment).toEqual([]);
    expect(repairMercenaryGrowth(merc)).toBe(merc);
    expect(def).toEqual(before);
  });

  it('uses the exact L1 baseline even for a catalog entry requiring level16', () => {
    const merc = createMercFromDef(telekinesis(), undefined, 1);
    expect(merc.level).toBe(1);
    expect(merc.coreStats).toEqual({ strength: 12, dexterity: 14, vitality: 16, energy: 24 });
    expect(merc.derivedStats).toMatchObject({ life: 132, lifeMax: 132, mana: 86, manaMax: 86,
      attack: 17, defense: 20, attackSpeed: 114, physDodge: .078 });
  });

  it('preserves the separate catalog factory default without changing historical starting stats', () => {
    const merc = createMercFromDef(telekinesis());
    expect(merc.level).toBe(16);
    expect(merc.coreStats).toEqual({ strength: 12, dexterity: 14, vitality: 16, energy: 24 });
    expect(merc.derivedStats).toMatchObject({ life: 252, lifeMax: 252, mana: 146, manaMax: 146,
      attack: 47, defense: 65, attackSpeed: 114, physDodge: .078 });
  });

  it('continues through real XP without repeating initial growth, stars or equipment', () => {
    const merc = createMercFromDef(telekinesis(), undefined, 70);
    useMercStore.getState().addMerc(merc);
    const sword: Item = { id: 'paid-recruit-gear', baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, identified: true, equipped: true, baseRolls: { attack: 7 } };
    const equipment = { weapon: sword };
    const before = structuredClone(merc);
    expect(deriveEquippedMercStats(merc, equipment, 1).attack).toBeCloseTo(211.12, 12);
    expect(deriveEquippedMercStats(merc, equipment, 1).attack).toBeCloseTo(211.12, 12);
    expect(merc).toEqual(before);
    useMercStore.getState().addExperience(merc.id, mercXpForLevel(70) + 7);
    const grown = useMercStore.getState().ownedMercs[0];
    expect(grown?.level).toBe(71);
    expect(grown?.coreStats).toEqual({ strength: 82, dexterity: 84, vitality: 16, energy: 304 });
    expect(grown?.derivedStats).toMatchObject({ life: 552, lifeMax: 552, mana: 701, manaMax: 708,
      attack: 192, defense: 230, attackSpeed: 184 });
    expect(useMercStore.getState().mercProgress[merc.id]).toEqual({ experience: 7, experienceToNextLevel: mercXpForLevel(71) });
    expect(grown).toBeDefined();
    if (!grown) throw new Error('Missing grown recruit');
    expect(deriveEquippedMercStats(grown, equipment, 1).attack).toBeCloseTo(214.36, 12);
    expect(deriveEquippedMercStats(grown, {}).attack).toBe(192);
  });
});

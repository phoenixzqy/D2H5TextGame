import { describe, expect, it } from 'vitest';
import type { AffixRoll, Item, SetDef, SetPieceDef, UniqueItemDef } from '../types/items';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from './equipment-mods';

function item(id: string, baseId: string, affixes: AffixRoll[] = []): Item {
  return { id, baseId, rarity: 'magic', level: 1, identified: true, equipped: false, affixes };
}

function affix(values: readonly (readonly [string, number])[]): AffixRoll {
  return { affixId: 'test-affix', values: new Map(values) };
}

describe('aggregateEquipmentMods', () => {
  it('sums base implicit defense and rolled affix values', () => {
    const mods = aggregateEquipmentMods({
      head: item('helm', 'items/base/helm-cap', [
        affix([
          ['coreStats.vitality', 3],
          ['statMods.life', 12],
          ['resistances.fire', 7]
        ])
      ]),
      boots: null
    });

    expect(mods).toEqual({ vitality: 3, life: 12, defense: 7, fireRes: 7 });
  });

  it('adapts equipment mods to existing derived-stat formulas', () => {
    const mods = aggregateEquipmentMods({
      weapon: item('sword', 'items/base/wp1h-short-sword', [affix([['statMods.attackSpeed', 5]])])
    });

    expect(applyEquipmentCoreMods({ strength: 1, dexterity: 2, vitality: 3, energy: 4 }, mods)).toEqual({
      strength: 1,
      dexterity: 2,
      vitality: 3,
      energy: 4
    });
    expect(equipmentModsToDerivedModifiers(mods)).toMatchObject({ flatAttack: 8, attackSpeedBonus: 5 });
  });

  it('applies unique definition stats and persisted stat rolls', () => {
    const unique: UniqueItemDef = {
      id: 'items/unique/pelta-lunata',
      name: 'items.unique.pelta-lunata.name',
      baseId: 'items/base/sh-buckler',
      reqLevel: 2,
      stats: { statMods: { defense: { roll: 'pelta-defense', min: 20, max: 30 } }, resistances: { fire: 10 } }
    };
    const mods = aggregateEquipmentMods(
      {
        offhand: {
          ...item('pelta', 'items/base/sh-buckler'),
          rarity: 'unique',
          uniqueId: unique.id,
          statRolls: { 'pelta-defense': 27 }
        }
      },
      { uniques: [unique], setPieces: [], sets: [] }
    );
    expect(mods).toMatchObject({ defense: 33, fireRes: 10 });
  });

  it('applies set piece stats plus cumulative set bonuses without duplicate-piece counting', () => {
    const pieces: SetPieceDef[] = [
      { id: 'sets/angelic-raiment/ring', setId: 'sets/angelic-raiment', name: 'items.setPiece.angelic-raiment.ring', baseId: 'items/base/ring-iron', reqLevel: 12, stats: { statMods: { life: 20 } } },
      { id: 'sets/angelic-raiment/amulet', setId: 'sets/angelic-raiment', name: 'items.setPiece.angelic-raiment.amulet', baseId: 'items/base/amu-tin', reqLevel: 12, stats: { statMods: { mana: 15 } } }
    ];
    const angelic: SetDef = {
      id: 'sets/angelic-raiment',
      name: 'items.set.angelic-raiment',
      items: pieces.map((piece) => piece.id),
      pieces,
      bonuses: {
        '2': { coreStats: { strength: 10 } },
        '3': { statMods: { attack: 99 } }
      }
    };
    const [ring, amuletPiece] = pieces;
    if (!ring || !amuletPiece) throw new Error('test fixture missing set pieces');
    const mods = aggregateEquipmentMods(
      {
        'ring-left': { ...item('ring-a', 'items/base/ring-iron'), rarity: 'set', setId: angelic.id, setPieceId: ring.id },
        'ring-right': { ...item('ring-b', 'items/base/ring-iron'), rarity: 'set', setId: angelic.id, setPieceId: ring.id },
        amulet: { ...item('amulet', 'items/base/amu-tin'), rarity: 'set', setId: angelic.id, setPieceId: amuletPiece.id }
      },
      { uniques: [], setPieces: pieces, sets: [angelic] }
    );
    expect(mods).toMatchObject({ life: 40, mana: 15, strength: 10 });
    expect(mods.attack).toBeUndefined();
  });
});

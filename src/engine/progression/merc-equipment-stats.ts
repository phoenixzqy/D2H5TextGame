import type { DerivedStats, Resistances } from '../types/attributes';
import type { Mercenary } from '../types/entities';
import type { Item } from '../types/items';
import {
  aggregateEquipmentMods,
  applyEquipmentCoreMods,
  equipmentModsToDerivedModifiers
} from './equipment-mods';
import { deriveStats } from './stats';

/**
 * Project canonical equipment over an owned mercenary's unequipped saved stats.
 * Growth does not rederive every saved stat, so only the shared formula's gear
 * delta is added. The projection never changes the persistent mercenary.
 */
export function deriveEquippedMercStats(
  merc: Mercenary,
  equipment: Readonly<Record<string, Item | null>>
): DerivedStats {
  const saved = merc.derivedStats;
  const mods = aggregateEquipmentMods(equipment);
  const bare = deriveStats(merc.coreStats, merc.level);
  const geared = deriveStats(
    applyEquipmentCoreMods(merc.coreStats, mods),
    merc.level,
    equipmentModsToDerivedModifiers(mods)
  );
  const scalar = (key: Exclude<keyof DerivedStats, 'resistances'>): number => {
    const delta = geared[key] - bare[key];
    return delta === 0 ? saved[key] : saved[key] + delta;
  };
  const resistance = (key: keyof Resistances): number => {
    const delta = geared.resistances[key] - bare.resistances[key];
    return delta === 0 ? saved.resistances[key] : saved.resistances[key] + delta;
  };
  const lifeMax = scalar('lifeMax') * (1 + (mods.lifePct ?? 0));
  const manaMax = scalar('manaMax');

  return {
    life: lifeMax === saved.lifeMax ? saved.life : Math.min(saved.life, lifeMax),
    lifeMax,
    mana: manaMax === saved.manaMax ? saved.mana : Math.min(saved.mana, manaMax),
    manaMax,
    attack: scalar('attack'),
    defense: scalar('defense') * (1 + (mods.defensePct ?? 0)),
    // Apply the signed gear value before clamping; deriveStats clamps negatives.
    magicResist: Math.max(0, Math.floor(saved.magicResist + (mods.magicResist ?? 0))),
    attackSpeed: (geared.attackSpeed === bare.attackSpeed
      ? saved.attackSpeed
      : Math.max(1, scalar('attackSpeed'))) * (1 + (mods.attackSpeedPct ?? 0)),
    critChance: scalar('critChance'),
    critDamage: scalar('critDamage'),
    physDodge: scalar('physDodge'),
    magicDodge: scalar('magicDodge'),
    magicFind: scalar('magicFind'),
    goldFind: scalar('goldFind'),
    resistances: {
      fire: resistance('fire'),
      cold: resistance('cold'),
      lightning: resistance('lightning'),
      poison: resistance('poison'),
      arcane: resistance('arcane'),
      physical: resistance('physical')
    }
  };
}

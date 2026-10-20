/** Canonical player equipment composition shared by progression and compatibility. */
import type { Player } from '../types/entities';
import type { Item } from '../types/items';
import type { DerivedStats } from '../types/attributes';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from './equipment-mods';
import { deriveStats } from './stats';

/** Shared gear composition; resource pools never heal during recomputation. */
export function deriveEquippedPlayerStats(
  player: Player,
  level: number,
  equipped: Readonly<Record<string, Item | null>>
): DerivedStats {
  const equipmentMods = aggregateEquipmentMods(equipped);
  const coreWithEquipment = applyEquipmentCoreMods(player.coreStats, equipmentMods);
  const fresh = deriveStats(
    coreWithEquipment,
    level,
    equipmentModsToDerivedModifiers(equipmentMods)
  );
  return {
    ...fresh,
    life: Math.min(fresh.lifeMax, player.derivedStats.life),
    mana: Math.min(fresh.manaMax, player.derivedStats.mana)
  };
}

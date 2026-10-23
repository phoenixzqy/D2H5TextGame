/** Canonical player equipment composition shared by progression and compatibility. */
import type { Player } from '../types/entities';
import type { Item } from '../types/items';
import type { DerivedStats } from '../types/attributes';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from './equipment-mods';
import { deriveStats } from './stats';
import { hasTaintedSunEntitlement, resolveQuestResistanceBonus, type QuestProgressContext } from './quest-resistance';

/** Shared gear composition; resource pools never heal during recomputation. */
export function deriveEquippedPlayerStats(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  equipped: Readonly<Record<string, Item | null>>,
  questProgress: QuestProgressContext = {}
): DerivedStats {
  const equipmentMods = aggregateEquipmentMods(equipped);
  const coreWithEquipment = applyEquipmentCoreMods(player.coreStats, equipmentMods);
  const fresh = deriveStats(
    coreWithEquipment,
    level,
    equipmentModsToDerivedModifiers(equipmentMods)
  );
  const resistances = { ...fresh.resistances };
  if (hasTaintedSunEntitlement(questProgress)) {
    const bonus = resolveQuestResistanceBonus(questProgress);
    for (const key of ['fire', 'cold'] as const) {
      const base = resistances[key];
      const total = base + bonus[key];
      if (!Number.isFinite(base) || !Number.isFinite(total)
        || Math.abs(base) > Number.MAX_SAFE_INTEGER - bonus[key]
        || Math.abs(total) > Number.MAX_SAFE_INTEGER
        || (bonus[key] > 0 && total <= base)) {
        throw new Error('Unsafe quest resistance arithmetic');
      }
      resistances[key] = total;
    }
  }
  return {
    ...fresh,
    resistances,
    life: Math.min(fresh.lifeMax, player.derivedStats.life),
    mana: Math.min(fresh.manaMax, player.derivedStats.mana)
  };
}

import { aggregateNonSocketEquipmentMods } from '../progression/equipment-mods';
import { prepareEquipmentStatComposition } from '../progression/equipped-stats';
import type { DerivedStats } from '../types/attributes';
import type { SaveV16 } from '../types/save';
import type { HistoricalItem } from './historical-items';

/** Recompose v16→17 gear removal under the pre-socket contract, without new word effects or grants. */
export function deriveHistoricalV16PlayerStats(
  save: SaveV16,
  equipped: Readonly<Record<string, HistoricalItem | null>>
): DerivedStats {
  const compose = prepareEquipmentStatComposition(save.player, save.player.level,
    save.map.questProgress, save.inventory.questItems, save.map.questReceipts, {});
  return compose(aggregateNonSocketEquipmentMods(equipped));
}

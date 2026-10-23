/** Canonical player equipment composition shared by progression and compatibility. */
import type { Player } from '../types/entities';
import type { Item } from '../types/items';
import type { DerivedStats } from '../types/attributes';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from './equipment-mods';
import { deriveStats } from './stats';
import { resolveAct5ResistanceBonus, resolveQuestResistanceBonus, type QuestProgressContext } from './quest-resistance';
import { resolveQuestLifeBonus } from './quest-life';
import type { QuestItemLedger, QuestActionReceipts } from '../types/save';

/** Shared gear composition; resource pools never heal during recomputation. */
export function deriveEquippedPlayerStats(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  equipped: Readonly<Record<string, Item | null>>,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {}
): DerivedStats {
  return prepareEquippedPlayerStats(player, level, questProgress, questItems, questReceipts)(equipped);
}

/**
 * Prepare one immutable player/quest snapshot for repeated loadout comparisons.
 * Entitlements are independent of gear; every candidate still recomputes its
 * equipment, caps, safe arithmetic and preserved current resource pools.
 */
export function prepareEquippedPlayerStats(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {}
): (equipped: Readonly<Record<string, Item | null>>) => DerivedStats {
  const lifeBonus = resolveQuestLifeBonus(questProgress, questItems);
  const allResistance = resolveAct5ResistanceBonus(questProgress, questItems, questReceipts);
  const sun = resolveQuestResistanceBonus(questProgress);
  const bonus = { fire: sun.fire + allResistance, cold: sun.cold + allResistance, lightning: allResistance,
    poison: allResistance, arcane: allResistance, physical: allResistance };
  return equipped => {
    const equipmentMods = aggregateEquipmentMods(equipped);
    const coreWithEquipment = applyEquipmentCoreMods(player.coreStats, equipmentMods);
    const fresh = deriveStats(
      coreWithEquipment,
      level,
      equipmentModsToDerivedModifiers(equipmentMods)
    );
    const lifeMax = fresh.lifeMax + lifeBonus;
    if (lifeBonus > 0 && (!Number.isFinite(lifeMax) || Math.abs(lifeMax) > Number.MAX_SAFE_INTEGER ||
      lifeMax <= fresh.lifeMax)) throw new Error('Unsafe quest Life arithmetic');
    const resistances = { ...fresh.resistances };
    {
      for (const key of ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const) {
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
      lifeMax,
      resistances,
      life: Math.min(lifeMax, player.derivedStats.life),
      mana: Math.min(fresh.manaMax, player.derivedStats.mana)
    };
  };
}

import type { AnyaQuestDomain } from '../map/anya-quest';
/** Canonical player equipment composition shared by progression and compatibility. */
import type { Player } from '../types/entities';
import type { Item } from '../types/items';
import type { DerivedStats } from '../types/attributes';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers, type EquipmentMods } from './equipment-mods';
import { CORE_STAT_HARD_CAP, deriveStats, effectiveStatValue } from './stats';
import { resolveAct5ResistanceBonus, resolveQuestResistanceBonus, type QuestProgressContext } from './quest-resistance';
import { resolveQuestLifeBonus } from './quest-life';
import type { QuestItemLedger, QuestActionReceipts } from '../types/save';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import type { CountedQuestDomain } from '../map/counted-quest';
import { resolveQuestVitalityBonus } from './quest-vitality';

/** Only omitted authority uses live definitions; supplied historical absence disables future bonuses. */
export interface QuestStatCompositionAuthority {
  readonly countedSources?: readonly CountedQuestDomain[];
  readonly anya?: AnyaQuestDomain;
}

/** Raw allocation and the distinct sheet/formula contributions of hero Vitality. */
export interface PlayerVitalityComposition {
  readonly raw: number;
  readonly equipment: number;
  readonly ordinarySheet: number;
  readonly ordinaryContribution: number;
  readonly elixir: number;
  readonly sheet: number;
  readonly formula: number;
}

/** One canonical result for effective sheets, previews and derived-stat consumers. */
export interface PlayerStatComposition {
  readonly derivedStats: DerivedStats;
  readonly vitality: PlayerVitalityComposition;
}

/** Compose a hero loadout and its effective-stat view from the same immutable preparation. */
export function composeEquippedPlayerStats(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  equipped: Readonly<Record<string, Item | null>>,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {},
  authority?: QuestStatCompositionAuthority
): PlayerStatComposition {
  return preparePlayerStatComposition(player, level, questProgress, questItems, questReceipts, authority)(
    aggregateEquipmentMods(equipped));
}

/** Shared gear composition; resource pools never heal during recomputation. */
export function deriveEquippedPlayerStats(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  equipped: Readonly<Record<string, Item | null>>,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {},
  authority?: QuestStatCompositionAuthority
): DerivedStats {
  return composeEquippedPlayerStats(player, level, equipped, questProgress, questItems, questReceipts, authority).derivedStats;
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
  questReceipts: QuestActionReceipts = {},
  authority?: QuestStatCompositionAuthority
): (equipped: Readonly<Record<string, Item | null>>) => DerivedStats {
  const compose = prepareEquipmentStatComposition(player, level, questProgress, questItems, questReceipts, authority);
  return equipped => compose(aggregateEquipmentMods(equipped));
}

/** Prepare gear-independent entitlements once; compose each supplied equipment modifier bag afresh. */
export function prepareEquipmentStatComposition(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {},
  authority?: QuestStatCompositionAuthority
): (equipmentMods: EquipmentMods) => DerivedStats {
  const compose = preparePlayerStatComposition(player, level, questProgress, questItems, questReceipts, authority);
  return equipmentMods => compose(equipmentMods).derivedStats;
}

/** Pin raw cores, resource pools and entitlements once; each candidate composes its own equipment afresh. */
export function preparePlayerStatComposition(
  player: Pick<Player, 'coreStats' | 'derivedStats'>,
  level: number,
  questProgress: QuestProgressContext = {},
  questItems: QuestItemLedger = {},
  questReceipts: QuestActionReceipts = {},
  authority?: QuestStatCompositionAuthority
): (equipmentMods: EquipmentMods) => PlayerStatComposition {
  const coreStats = { ...player.coreStats };
  const resources = { life: player.derivedStats.life, mana: player.derivedStats.mana };
  const lifeBonus = resolveQuestLifeBonus(questProgress, questItems);
  const elixir = resolveQuestVitalityBonus(questProgress, questItems,
    authority === undefined ? loadCountedQuestItems() : authority.countedSources ?? []);
  const allResistance = resolveAct5ResistanceBonus(questProgress, questItems, questReceipts, authority);
  const sun = resolveQuestResistanceBonus(questProgress);
  const bonus = { fire: sun.fire + allResistance, cold: sun.cold + allResistance, lightning: allResistance,
    poison: allResistance, arcane: allResistance, physical: allResistance };
  return equipmentMods => {
    const coreWithEquipment = applyEquipmentCoreMods(coreStats, equipmentMods);
    const ordinaryContribution = effectiveStatValue(coreWithEquipment.vitality);
    const ordinarySheet = Math.min(CORE_STAT_HARD_CAP, coreWithEquipment.vitality);
    const vitality: PlayerVitalityComposition = { raw: coreStats.vitality,
      equipment: equipmentMods.vitality ?? 0, ordinarySheet, ordinaryContribution,
      elixir, sheet: ordinarySheet + elixir, formula: ordinaryContribution + elixir };
    const fresh = deriveStats(
      coreWithEquipment,
      level,
      { ...equipmentModsToDerivedModifiers(equipmentMods), postSoftcapVitality: elixir }
    );
    const ordinaryLifeMax = fresh.lifeMax + lifeBonus;
    if (lifeBonus > 0 && (!Number.isFinite(ordinaryLifeMax) || Math.abs(ordinaryLifeMax) > Number.MAX_SAFE_INTEGER ||
      ordinaryLifeMax <= fresh.lifeMax)) throw new Error('Unsafe quest Life arithmetic');
    const lifeMax = ordinaryLifeMax * (1 + (equipmentMods.lifePct ?? 0));
    if (elixir > 0) {
      const ordinaryBaseLife = Math.floor(100 + Math.max(0, level - 1) * 8 +
        ordinaryContribution * 2 + (equipmentMods.life ?? 0));
      const inputs = [vitality.raw, vitality.equipment, coreWithEquipment.vitality, vitality.ordinarySheet,
        vitality.ordinaryContribution, vitality.elixir, vitality.sheet, vitality.formula];
      if (inputs.some(value => !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) ||
        !Number.isSafeInteger(fresh.lifeMax) || fresh.lifeMax - ordinaryBaseLife !== 2 * elixir ||
        !Number.isFinite(lifeMax) || lifeMax < 0 || lifeMax > Number.MAX_SAFE_INTEGER) {
        throw new Error('Unsafe quest Vitality arithmetic');
      }
    }
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
    return { vitality, derivedStats: {
      ...fresh,
      defense: fresh.defense * (1 + (equipmentMods.defensePct ?? 0)),
      attackSpeed: fresh.attackSpeed * (1 + (equipmentMods.attackSpeedPct ?? 0)),
      lifeMax,
      resistances,
      life: Math.min(lifeMax, resources.life),
      mana: Math.min(fresh.manaMax, resources.mana)
    } };
  };
}

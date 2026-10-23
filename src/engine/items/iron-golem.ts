import { loadAffixPool, loadItemBases, loadSetPieces, loadUniques } from '@/data/loaders/loot';
import { aggregateEquipmentMods, type EquipmentDefinitionPools } from '../progression/equipment-mods';
import type { Item, ItemBonusStats } from '../types/items';

/** The only item properties inherited by one-wave Iron Golem preparation. */
export interface IronGolemBonuses {
  readonly life: number;
  readonly attack: number;
  readonly defense: number;
}

/** Item-local refusals; live ownership and hero qualification belong to stores. */
export type IronGolemItemRefusal =
  | 'unidentified' | 'equipped' | 'ineligibleBase' | 'unsupportedRunes'
  | 'invalidDefinition' | 'invalidRolls';

/** A projection alone never authorizes inventory consumption. */
export type IronGolemItemProjection =
  | { readonly eligible: true; readonly bonuses: IronGolemBonuses }
  | { readonly eligible: false; readonly reason: IronGolemItemRefusal };

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// Match the equipment resolver's accepted paths, including legacy extra segments.
function contributes(path: string): boolean {
  const [group, stat] = path.split('.');
  return (group === 'statMods' && (stat === 'life' || stat === 'attack' || stat === 'defense'))
    || (group === 'damageBonus' && (stat === 'min' || stat === 'max' || stat === 'value' || stat === 'breakdown'));
}

function validDefinitionRolls(stats: ItemBonusStats | undefined, item: Item): boolean {
  const values = [stats?.statMods?.life, stats?.statMods?.attack, stats?.statMods?.defense,
    stats?.damageBonus?.min, stats?.damageBonus?.max, stats?.damageBonus?.value,
    ...Object.values(stats?.damageBonus?.breakdown ?? {})];
  for (const value of values) {
    if (value === undefined) continue;
    if (typeof value === 'number') {
      if (!nonnegative(value)) return false;
      continue;
    }
    if (!nonnegative(value.min) || !nonnegative(value.max) || value.max < value.min
      || typeof value.roll !== 'string' || !value.roll
      || (value.step !== undefined && (!nonnegative(value.step) || value.step === 0))) return false;
    // Presence matters: a malformed supplied roll must not become the min fallback.
    if (item.statRolls && Object.prototype.hasOwnProperty.call(item.statRolls, value.roll)) {
      const saved = item.statRolls[value.roll];
      if (!nonnegative(saved) || saved < value.min || saved > value.max) return false;
    }
  }
  return true;
}

/**
 * Resolve a single identified, unequipped metal item without mutation or RNG.
 * Uses the equipment resolver's production base/affix catalogs and shared
 * unique/piece definitions; all set thresholds are disabled. Wearing requirements
 * do not apply. Selection, container uniqueness and payment are caller concerns.
 */
export function projectIronGolemItem(
  item: Item,
  definitions: EquipmentDefinitionPools = {}
): IronGolemItemProjection {
  if (!item.identified) return { eligible: false, reason: 'unidentified' };
  if (item.equipped) return { eligible: false, reason: 'equipped' };
  const base = loadItemBases().get(item.baseId);
  if (!base || base.metal !== true || (base.type !== 'weapon' && base.type !== 'armor')) {
    return { eligible: false, reason: 'ineligibleBase' };
  }
  if (item.rarity === 'runeword' || item.runewordId !== undefined || (item.socketContents?.length ?? 0) > 0) {
    return { eligible: false, reason: 'unsupportedRunes' };
  }
  const pools = {
    uniques: definitions.uniques ?? loadUniques(),
    setPieces: definitions.setPieces ?? loadSetPieces(),
    sets: []
  };
  let validDefinition = false;
  let stats: ItemBonusStats | undefined;
  if (item.rarity === 'unique') {
    const matches = pools.uniques.filter((entry) => entry.id === item.uniqueId);
    stats = matches[0]?.stats;
    validDefinition = matches.length === 1 && matches[0]?.baseId === item.baseId
      && item.setPieceId === undefined && item.setId === undefined;
  } else if (item.rarity === 'set') {
    const matches = pools.setPieces.filter((entry) => entry.id === item.setPieceId);
    stats = matches[0]?.stats;
    validDefinition = matches.length === 1 && matches[0]?.baseId === item.baseId
      && item.uniqueId === undefined && (item.setId === undefined || item.setId === matches[0]?.setId);
  } else if (['normal', 'magic', 'rare'].includes(item.rarity)) {
    validDefinition = item.uniqueId === undefined && item.setId === undefined && item.setPieceId === undefined;
  }
  if (!validDefinition || ((item.affixes?.length ?? 0) > 0 && item.rarity !== 'magic' && item.rarity !== 'rare')) {
    return { eligible: false, reason: 'invalidDefinition' };
  }
  if ((base.baseDamage !== undefined && item.baseRolls !== undefined && Object.prototype.hasOwnProperty.call(item.baseRolls, 'attack') && !nonnegative(item.baseRolls.attack))
    || (base.baseDefense !== undefined && item.baseRolls !== undefined && Object.prototype.hasOwnProperty.call(item.baseRolls, 'defense') && !nonnegative(item.baseRolls.defense))
    || !validDefinitionRolls(stats, item)) {
    return { eligible: false, reason: 'invalidRolls' };
  }
  const affixes = new Map(loadAffixPool().map((entry) => [entry.id, entry]));
  for (const roll of item.affixes ?? []) {
    if ('values' in roll) {
      if (typeof roll.values.entries !== 'function') return { eligible: false, reason: 'invalidRolls' };
      for (const [path, value] of roll.values.entries()) {
        if (contributes(path) && !nonnegative(value)) return { eligible: false, reason: 'invalidRolls' };
      }
      continue;
    }
    const definition = affixes.get(roll.id);
    const tier = Number.isInteger(roll.tier) ? definition?.tiers[roll.tier] : undefined;
    if (!definition || !tier || (definition.appliesTo.length > 0 && !definition.appliesTo.includes(base.type))
      || !nonnegative(roll.rolledValue) || roll.rolledValue < tier.valueMin || roll.rolledValue > tier.valueMax) {
      return { eligible: false, reason: 'invalidRolls' };
    }
  }
  const mods = aggregateEquipmentMods({ selected: item }, pools);
  const bonuses = { life: mods.life ?? 0, attack: mods.attack ?? 0, defense: mods.defense ?? 0 };
  if (!Object.values(bonuses).every(nonnegative)) return { eligible: false, reason: 'invalidRolls' };
  return { eligible: true, bonuses };
}

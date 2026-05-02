/**
 * Equipment modifier aggregation.
 *
 * Turns equipped item instances into the stat delta vocabulary consumed by the
 * progression stat formulas. The function is deterministic and has no runtime
 * dependency on UI, stores, persistence, or RNG.
 *
 * @module engine/progression/equipment-mods
 */

import { loadAffixPool, loadItemBases, loadSetPieces, loadSets, loadUniques } from '@/data/loaders/loot';
import { computeStats } from '@/engine/items/computeStats';
import { resolveStatPackage } from '@/engine/items/statRolls';
import type { DerivedModifiers } from './stats';
import type { CoreStats, Resistances } from '../types/attributes';
import type { Item, SetDef, SetPieceDef, UniqueItemDef } from '../types/items';

/** Additive stat deltas contributed by equipped gear. */
export interface EquipmentMods {
  readonly strength?: number;
  readonly dexterity?: number;
  readonly vitality?: number;
  readonly energy?: number;
  readonly life?: number;
  readonly mana?: number;
  readonly attack?: number;
  readonly defense?: number;
  readonly attackSpeed?: number;
  readonly critChance?: number;
  readonly critDamage?: number;
  readonly physDodge?: number;
  readonly magicDodge?: number;
  readonly magicFind?: number;
  readonly goldFind?: number;
  readonly allRes?: number;
  readonly fireRes?: number;
  readonly coldRes?: number;
  readonly lightningRes?: number;
  readonly poisonRes?: number;
  readonly arcaneRes?: number;
  readonly physicalRes?: number;
}

type MutableEquipmentMods = Record<keyof EquipmentMods, number>;
type MutableDerivedModifiers = { -readonly [K in keyof DerivedModifiers]: DerivedModifiers[K] };

export interface EquipmentDefinitionPools {
  readonly uniques?: readonly UniqueItemDef[];
  readonly setPieces?: readonly SetPieceDef[];
  readonly sets?: readonly SetDef[];
}

const ZERO_MODS: MutableEquipmentMods = {
  strength: 0,
  dexterity: 0,
  vitality: 0,
  energy: 0,
  life: 0,
  mana: 0,
  attack: 0,
  defense: 0,
  attackSpeed: 0,
  critChance: 0,
  critDamage: 0,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  allRes: 0,
  fireRes: 0,
  coldRes: 0,
  lightningRes: 0,
  poisonRes: 0,
  arcaneRes: 0,
  physicalRes: 0
};

function add(mods: MutableEquipmentMods, key: keyof EquipmentMods, value: number): void {
  mods[key] += value;
}


const CORE_STAT_KEYS = new Set<keyof CoreStats>(['strength', 'dexterity', 'vitality', 'energy']);
const STAT_MOD_KEYS = new Set<keyof EquipmentMods>(['life','mana','attack','defense','attackSpeed','critChance','critDamage','physDodge','magicDodge','magicFind','goldFind']);
const RESIST_TO_MOD_KEY: Readonly<Record<keyof Resistances | 'all', keyof EquipmentMods>> = { fire: 'fireRes', cold: 'coldRes', lightning: 'lightningRes', poison: 'poisonRes', arcane: 'arcaneRes', physical: 'physicalRes', all: 'allRes' };

function addStatPathValue(mods: MutableEquipmentMods, path: string, value: number): void {
  const [group, stat] = path.split('.');
  if (!group || !stat) return;
  if (group === 'coreStats' && CORE_STAT_KEYS.has(stat as keyof CoreStats)) { add(mods, stat as keyof CoreStats, value); return; }
  if (group === 'resistances' && stat in RESIST_TO_MOD_KEY) { add(mods, RESIST_TO_MOD_KEY[stat as keyof Resistances | 'all'], value); return; }
  if (group === 'statMods' && STAT_MOD_KEYS.has(stat as keyof EquipmentMods)) { add(mods, stat as keyof EquipmentMods, value); return; }
  if (group === 'damageBonus' && (stat === 'value' || stat === 'min' || stat === 'max')) add(mods, 'attack', value);
  if (group === 'damageBonus' && stat === 'breakdown') add(mods, 'attack', value);
}

function addStatPackage(mods: MutableEquipmentMods, stats: Parameters<typeof resolveStatPackage>[0], statRolls?: Readonly<Record<string, number>>): void {
  for (const { path, value } of resolveStatPackage(stats, statRolls)) {
    addStatPathValue(mods, path, value);
  }
}

function compact(mods: MutableEquipmentMods): EquipmentMods {
  const out: Partial<MutableEquipmentMods> = {};
  for (const [key, value] of Object.entries(mods) as [keyof EquipmentMods, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

/**
 * Sum base implicit stats and rolled affix values from equipped items only.
 * Null equipment slots are ignored.
 */
export function aggregateEquipmentMods(
  equipped: Readonly<Record<string, Item | null>>,
  definitionPools: EquipmentDefinitionPools = {}
): EquipmentMods {
  const mods: MutableEquipmentMods = { ...ZERO_MODS };
  const bases = loadItemBases();
  const affixMap = new Map(loadAffixPool().map((affix) => [affix.id, affix]));
  const uniqueMap = new Map((definitionPools.uniques ?? loadUniques()).map((unique) => [unique.id, unique]));
  const setPieceMap = new Map((definitionPools.setPieces ?? loadSetPieces()).map((piece) => [piece.id, piece]));
  const setMap = new Map((definitionPools.sets ?? loadSets()).map((set) => [set.id, set]));
  const equippedSetPieces = new Map<string, Set<string>>();

  for (const item of Object.values(equipped)) {
    if (!item) continue;
    const itemStats = computeStats(item, bases.get(item.baseId), affixMap);
    add(mods, 'attack', itemStats.attack); add(mods, 'defense', itemStats.defense);
    add(mods, 'life', itemStats.life); add(mods, 'mana', itemStats.mana);
    add(mods, 'critChance', itemStats.critChance); add(mods, 'critDamage', itemStats.critDamage);
    add(mods, 'physDodge', itemStats.physDodge); add(mods, 'magicDodge', itemStats.magicDodge);
    add(mods, 'fireRes', itemStats.fireRes); add(mods, 'coldRes', itemStats.coldRes);
    add(mods, 'lightningRes', itemStats.lightningRes); add(mods, 'poisonRes', itemStats.poisonRes);
    add(mods, 'arcaneRes', itemStats.arcaneRes); add(mods, 'physicalRes', itemStats.physicalRes);
    for (const affix of item.affixes ?? []) {
      if (!('values' in affix)) continue;
      for (const [path, value] of affix.values.entries()) addStatPathValue(mods, path, value);
    }
    if (item.uniqueId) {
      addStatPackage(mods, uniqueMap.get(item.uniqueId)?.stats, item.statRolls);
    }
    if (item.setPieceId) {
      const piece = setPieceMap.get(item.setPieceId);
      addStatPackage(mods, piece?.stats, item.statRolls);
      const setId = piece?.setId ?? item.setId;
      if (setId) {
        const pieces = equippedSetPieces.get(setId) ?? new Set<string>();
        pieces.add(item.setPieceId);
        equippedSetPieces.set(setId, pieces);
      }
    }
  }

  for (const [setId, pieces] of equippedSetPieces.entries()) {
    const set = setMap.get(setId);
    if (!set) continue;
    const count = pieces.size;
    for (const [threshold, stats] of Object.entries(set.bonuses)) {
      if (Number(threshold) <= count) addStatPackage(mods, stats);
    }
  }

  return compact(mods);
}

/** Convert equipment deltas into the modifier bag accepted by deriveStats. */
export function equipmentModsToDerivedModifiers(mods: EquipmentMods): DerivedModifiers {
  const allRes = mods.allRes ?? 0;
  const resistances: Partial<Resistances> = {
    fire: allRes + (mods.fireRes ?? 0),
    cold: allRes + (mods.coldRes ?? 0),
    lightning: allRes + (mods.lightningRes ?? 0),
    poison: allRes + (mods.poisonRes ?? 0),
    arcane: allRes + (mods.arcaneRes ?? 0),
    physical: allRes + (mods.physicalRes ?? 0)
  };
  const out: Partial<MutableDerivedModifiers> = { resistances };
  if (mods.life !== undefined) out.flatLife = mods.life;
  if (mods.mana !== undefined) out.flatMana = mods.mana;
  if (mods.attack !== undefined) out.flatAttack = mods.attack;
  if (mods.defense !== undefined) out.flatDefense = mods.defense;
  if (mods.attackSpeed !== undefined) out.attackSpeedBonus = mods.attackSpeed;
  if (mods.critChance !== undefined) out.critChance = mods.critChance;
  if (mods.critDamage !== undefined) out.critDamage = mods.critDamage;
  if (mods.physDodge !== undefined) out.physDodge = mods.physDodge;
  if (mods.magicDodge !== undefined) out.magicDodge = mods.magicDodge;
  if (mods.magicFind !== undefined) out.magicFind = mods.magicFind;
  if (mods.goldFind !== undefined) out.goldFind = mods.goldFind;
  return out;
}

/** Apply equipment core-stat deltas to a player's base core stats. */
export function applyEquipmentCoreMods(core: CoreStats, mods: EquipmentMods): CoreStats {
  return {
    strength: core.strength + (mods.strength ?? 0),
    dexterity: core.dexterity + (mods.dexterity ?? 0),
    vitality: core.vitality + (mods.vitality ?? 0),
    energy: core.energy + (mods.energy ?? 0)
  };
}

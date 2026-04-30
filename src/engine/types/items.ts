/**
 * Item system types for the game engine
 * @module engine/types/items
 */

import type { DamageInfo, CoreStats } from './attributes';

/**
 * Item rarity enumeration
 */
export type Rarity =
  | 'normal'    // White
  | 'magic'     // Blue
  | 'rare'      // Yellow
  | 'unique'    // Gold (Unique)
  | 'set'       // Green (Set item)
  | 'runeword'; // Orange (Runeword)

/**
 * Equipment slot enumeration
 */
export type EquipmentSlot =
  | 'head'
  | 'chest'
  | 'gloves'
  | 'belt'
  | 'boots'
  | 'amulet'
  | 'ring-left'
  | 'ring-right'
  | 'weapon'
  | 'offhand'; // Shield or dual-wield weapon

/**
 * Item base type
 */
export type ItemBaseType =
  | 'weapon'
  | 'armor'
  | 'jewelry'
  | 'charm'
  | 'rune'
  | 'gem'
  | 'material';

export type ItemStatKey =
  | 'attack' | 'life' | 'mana' | 'defense' | 'critChance' | 'critDamage'
  | 'physDodge' | 'magicDodge' | 'fireRes' | 'coldRes' | 'lightningRes'
  | 'poisonRes' | 'arcaneRes' | 'physicalRes';

/**
 * Item base definition (the white item template)
 */
export interface ItemBase {
  readonly id: string;
  readonly name: string;
  readonly type: ItemBaseType;
  readonly slot: EquipmentSlot | null;
  
  /** Base damage (for weapons) */
  readonly baseDamage?: DamageInfo;
  
  /** Base defense (for armor) */
  readonly baseDefense?: number;
  
  /** Required level */
  readonly reqLevel: number;
  
  /** Required stats */
  readonly reqStats?: Partial<CoreStats>;
  
  /** Number of sockets (for runewords) */
  readonly sockets?: number;
  
  /** Can this base have random affixes? */
  readonly canHaveAffixes: boolean;

  /** Weapon subtype (sword/axe/mace/bow/...). Optional, for weapons only. */
  readonly weaponType?: string;

  /** Weapon handedness. Optional, for weapons only. */
  readonly handedness?: '1h' | '2h';

  /** Optional dev override for the icon URL. Resolvers prefer this when set. */
  readonly imagePath?: string;
}

/** A single item-level-gated value range for an affix. */
export interface AffixTier { readonly ilvlMin: number; readonly ilvlMax: number; readonly valueMin: number; readonly valueMax: number }

/** JSON-driven affix definition. */
export interface Affix {
  readonly id: string;
  readonly kind: 'prefix' | 'suffix';
  readonly appliesTo: readonly ItemBaseType[];
  readonly stat: ItemStatKey;
  readonly tiers: readonly AffixTier[];
  readonly rarityWeights: Readonly<Partial<Record<Rarity, number>>>;
  readonly i18nKey: string;
}

export interface RolledAffix { readonly id: string; readonly tier: number; readonly rolledValue: number }
export interface LegacyAffixRoll { readonly affixId: string; readonly values: ReadonlyMap<string, number> }
export type AffixRoll = RolledAffix | LegacyAffixRoll

/**
 * Item instance
 */
export interface Item {
  readonly id: string; // unique instance ID
  readonly baseId: string; // references ItemBase
  readonly rarity: Rarity;
  readonly level: number;
  readonly ilvl?: number;
  readonly baseRolls?: Partial<Record<ItemStatKey, number>>;
  readonly generatedName?: { readonly prefix?: string; readonly suffix?: string };
  
  /** Affixes (for magic/rare items) */
  readonly affixes?: readonly AffixRoll[];
  
  /** Unique ID (for unique items) */
  readonly uniqueId?: string;
  
  /** Set ID (for set items) */
  readonly setId?: string;
  
  /** Runeword ID (for runeword items) */
  readonly runewordId?: string;
  
  /** Socketed runes (if any) */
  readonly runes?: readonly string[]; // rune IDs
  
  /** Is this item identified? */
  readonly identified: boolean;
  
  /** Is this item equipped? */
  readonly equipped: boolean;
  
  /** Equipment slot (if equipped) */
  readonly equipSlot?: EquipmentSlot;
}

/**
 * Rune definition
 */
export interface Rune {
  readonly id: string;
  readonly name: string;
  readonly tier: number; // 1-33 in D2
  
  /** Effect when socketed in weapon */
  readonly weaponEffect?: Partial<Affix>;
  
  /** Effect when socketed in armor/helm */
  readonly armorEffect?: Partial<Affix>;
  
  /** Effect when socketed in shield */
  readonly shieldEffect?: Partial<Affix>;
}

/**
 * Runeword definition
 */
export interface RuneWord {
  readonly id: string;
  readonly name: string;
  
  /** Required rune sequence (in order) */
  readonly runes: readonly string[]; // rune IDs
  
  /** Required item base types */
  readonly allowedBases: readonly ItemBaseType[];
  
  /** Required number of sockets */
  readonly sockets: number;
  
  /** Granted stats */
  readonly stats: Partial<Affix>;
  
  /** Required level */
  readonly reqLevel: number;
}

/**
 * Set definition
 */
export interface SetDef {
  readonly id: string;
  readonly name: string;
  
  /** Item IDs in this set */
  readonly items: readonly string[];
  
  /** Set bonuses per pieces equipped */
  readonly bonuses: ReadonlyMap<number, Partial<Affix>>; // numPieces -> bonus
}

/**
 * Inventory system
 */
export interface Inventory {
  /** Main backpack */
  readonly backpack: readonly Item[];
  
  /** Stash (shared across characters) */
  readonly stash: readonly Item[];
  
  /** Equipped items by slot */
  readonly equipment: ReadonlyMap<EquipmentSlot, Item>;
  
  /** Max backpack size */
  readonly maxBackpack: number;
  
  /** Max stash size */
  readonly maxStash: number;
}


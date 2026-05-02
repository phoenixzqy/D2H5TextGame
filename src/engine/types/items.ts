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

/**
 * Weapon class enumeration (D2-canonical, v1).
 *
 * `claw` is intentionally excluded — Assassin is not part of the v1
 * roster. Drives skill eligibility (e.g. Bow Specialist requires
 * `bow|crossbow`) and any future weapon-class scaling/affix tables.
 *
 * Authoritative spec: GD-WEAPONTYPE-SPEC.
 */
export type WeaponType =
  | 'sword' | 'axe' | 'mace' | 'dagger' | 'spear' | 'polearm'
  | 'bow' | 'crossbow' | 'throwing'
  | 'staff' | 'wand' | 'scepter' | 'orb';

/**
 * One- vs. two-handed weapon classification.
 *
 * Drives the equip-slot mutex: a `twoHanded` weapon is mutually
 * exclusive with the offhand slot. Dual-wield (1H + 1H) is deferred
 * to a follow-up branch.
 */
export type Handedness = 'oneHanded' | 'twoHanded';

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

  /**
   * Weapon class. Required when `type === 'weapon'` (enforced by
   * `bases.json` JSON Schema). Optional on the interface so non-weapons
   * are unaffected.
   */
  readonly weaponType?: WeaponType;

  /**
   * One- vs. two-handed. Required when `type === 'weapon'` (enforced by
   * `bases.json` JSON Schema). Drives the 2H ↔ offhand mutex in
   * {@link import('../inventory/equipValidator').isTwoHanded}.
   */
  readonly handedness?: Handedness;
  
  /** Required level */
  readonly reqLevel: number;
  
  /** Required stats */
  readonly reqStats?: Partial<CoreStats>;
  
  /** Number of sockets (for runewords) */
  readonly sockets?: number;
  
  /** Can this base have random affixes? */
  readonly canHaveAffixes: boolean;
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

export type ItemStatRollValue =
  | number
  | {
      readonly roll: string;
      readonly min: number;
      readonly max: number;
      readonly step?: number;
    };

export type ItemDamageType = 'physical' | 'fire' | 'cold' | 'lightning' | 'arcane' | 'poison' | 'thorns';

export interface ItemBonusStats {
  readonly coreStats?: Partial<Record<keyof CoreStats, ItemStatRollValue>>;
  readonly resistances?: Partial<Record<'fire' | 'cold' | 'lightning' | 'poison' | 'arcane' | 'physical' | 'all', ItemStatRollValue>>;
  readonly statMods?: Partial<Record<
    | 'life'
    | 'mana'
    | 'attack'
    | 'defense'
    | 'attackSpeed'
    | 'critChance'
    | 'critDamage'
    | 'physDodge'
    | 'magicDodge'
    | 'magicFind'
    | 'goldFind',
    ItemStatRollValue
  >>;
  readonly grantsSkills?: readonly string[];
  readonly damageBonus?: {
    readonly min?: ItemStatRollValue;
    readonly max?: ItemStatRollValue;
    readonly value?: ItemStatRollValue;
    readonly breakdown?: Partial<Record<ItemDamageType, ItemStatRollValue>>;
  };
}

export interface UniqueItemDef {
  readonly id: string;
  readonly name: string;
  readonly baseId: string;
  readonly reqLevel: number;
  readonly qlvl?: number;
  readonly weight?: number;
  readonly stats?: ItemBonusStats;
  readonly flavor?: string;
}

export interface SetPieceDef {
  readonly id: string;
  readonly setId: string;
  readonly name: string;
  readonly baseId: string;
  readonly reqLevel: number;
  readonly qlvl?: number;
  readonly weight?: number;
  readonly stats?: ItemBonusStats;
  readonly flavor?: string;
}

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

  /** Set piece ID (for set items) */
  readonly setPieceId?: string;
  
  /** Runeword ID (for runeword items) */
  readonly runewordId?: string;
  
  /** Socketed runes (if any) */
  readonly runes?: readonly string[]; // rune IDs

  /** Persisted deterministic rolls for definition-backed stats. */
  readonly statRolls?: Readonly<Record<string, number>>;
  
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

  /** Concrete set-piece definitions that can drop and be equipped. */
  readonly pieces?: readonly SetPieceDef[];
  
  /** Set bonuses per pieces equipped */
  readonly bonuses: Readonly<Record<string, ItemBonusStats>>; // numPieces -> bonus
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


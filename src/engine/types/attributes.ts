/**
 * Core attribute types for the game engine
 * @module engine/types/attributes
 */

/**
 * Damage type enumeration
 * All elemental and physical damage types in the game
 */
export type DamageType =
  | 'physical'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'arcane'
  | 'poison'
  | 'thorns';

/**
 * Core character stats (primary attributes)
 * These are allocated by the player at level-up
 */
export interface CoreStats {
  readonly strength: number;
  readonly dexterity: number;
  readonly vitality: number;
  readonly energy: number;
}

/**
 * Resistances to various damage types
 * Values typically range from -100 to +75 (or higher with items)
 * Negative values increase damage taken
 */
export interface Resistances {
  readonly fire: number;
  readonly cold: number;
  readonly lightning: number;
  readonly poison: number;
  readonly arcane: number;
  readonly physical: number;
}

/**
 * Derived stats calculated from core stats, items, and buffs
 * These are never directly set; always computed
 */
export interface DerivedStats {
  readonly life: number;
  readonly lifeMax: number;
  readonly mana: number;
  readonly manaMax: number;
  
  /** Attack rating - influences hit chance */
  readonly attack: number;
  
  /** Defense rating - reduces enemy hit chance */
  readonly defense: number;
  
  /** Attack speed - determines turn order (higher = faster) */
  readonly attackSpeed: number;
  
  /** Critical hit chance (0-1, where 1 = 100%) */
  readonly critChance: number;
  
  /** Critical hit damage multiplier (e.g. 1.5 = 150% damage) */
  readonly critDamage: number;
  
  /** Physical dodge chance (0-1, where 1 = 100%) */
  readonly physDodge: number;
  
  /** Magical dodge chance (0-1, where 1 = 100%) */
  readonly magicDodge: number;
  
  /** Magic Find - increases chance of higher rarity drops (0-1000+%) */
  readonly magicFind: number;
  
  /** Gold Find - increases gold drops (0-1000+%) */
  readonly goldFind: number;
  
  /** All resistances */
  readonly resistances: Resistances;
}

/**
 * Damage range tuple [min, max]
 */
export type DamageRange = readonly [number, number];

/**
 * Damage breakdown by type
 * Used for attack damage, DoT, and buff modifications
 */
export interface DamageBreakdown {
  readonly physical?: number;
  readonly fire?: number;
  readonly cold?: number;
  readonly lightning?: number;
  readonly arcane?: number;
  readonly poison?: number;
  readonly thorns?: number;
}

/**
 * Complete damage info including range and breakdown
 */
export interface DamageInfo {
  readonly min: number;
  readonly max: number;
  readonly breakdown: DamageBreakdown;
}

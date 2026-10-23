/** Item payload through v18, including literal v16 quarantine. Append no live fields. */
import type { EquipmentSlot, Rarity, ItemStatKey, AffixRoll } from '../types/items';

export interface HistoricalItem {
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

  /** Own native-save capacity for weapon/armor; legacy fallback is migration-only. */
  readonly socketCapacity?: number;

  /** Text-only cosmetic identity; service entry checks the current character ID. */
  readonly personalizedBy?: { readonly characterId: string; readonly name: string };

  /** Persisted deterministic rolls for definition-backed stats. */
  readonly statRolls?: Readonly<Record<string, number>>;
  
  /** Is this item identified? */
  readonly identified: boolean;
  
  /** Is this item equipped? */
  readonly equipped: boolean;
  
  /** Equipment slot (if equipped) */
  readonly equipSlot?: EquipmentSlot;
}


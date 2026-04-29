/**
 * compareEquip — pure helpers for the equipment picker / comparison flyout.
 *
 * No React, no stores, no I/O beyond `loadItemBases()` (which reads JSON
 * synchronously and caches). Used by:
 *   - `inventoryStore.eligibleForSlot()` (slot filter + req gate)
 *   - `<EquipPicker>` modal (list with greyed-out ineligible rows)
 *   - `<ItemCompareTooltip>` (side-by-side stat deltas vs equipped)
 *
 * Comparison strategy: we *clone* the equipped record, drop the candidate
 * into the resolved target slot (handling 2H weapon → clears offhand, etc.
 * mirroring the live `equipItem` reducer), then re-run the same engine
 * pipeline `aggregateEquipmentMods → applyEquipmentCoreMods → deriveStats`
 * the player store uses on real equip. That guarantees deltas match what
 * the player will actually see *post-equip*.
 *
 * @module features/inventory/compareEquip
 */

import { loadItemBases } from '@/data/loaders/loot';
import {
  aggregateEquipmentMods,
  applyEquipmentCoreMods,
  equipmentModsToDerivedModifiers
} from '@/engine/progression/equipment-mods';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats, DerivedStats, Resistances } from '@/engine/types/attributes';
import type { EquipmentSlot, Item, ItemBase } from '@/engine/types/items';

/** Subset of `Player` fields needed for eligibility + comparison. */
export interface PlayerLike {
  readonly level: number;
  readonly coreStats: CoreStats;
  readonly derivedStats: DerivedStats;
}

export type EligibilityFailKind = 'level' | 'stat';

export interface EligibilityFail {
  readonly kind: EligibilityFailKind;
  readonly stat?: keyof CoreStats;
  readonly required: number;
  readonly current: number;
}

export interface EligibilityResult {
  readonly eligible: boolean;
  readonly reasons: readonly EligibilityFail[];
}

export type ComparableStatKey =
  | 'lifeMax'
  | 'manaMax'
  | 'attack'
  | 'defense'
  | 'attackSpeed'
  | 'critChance'
  | 'critDamage'
  | 'physDodge'
  | 'magicDodge';

export interface StatDelta {
  readonly current: number;
  readonly candidate: number;
  readonly delta: number;
}

export interface CompareResult {
  readonly current: Item | null;
  readonly candidate: Item;
  readonly slot: EquipmentSlot;
  readonly stats: Readonly<Record<ComparableStatKey, StatDelta>>;
  readonly resistances: Readonly<Record<keyof Resistances, StatDelta>>;
}

const COMPARABLE_KEYS: readonly ComparableStatKey[] = [
  'lifeMax',
  'manaMax',
  'attack',
  'defense',
  'attackSpeed',
  'critChance',
  'critDamage',
  'physDodge',
  'magicDodge'
];

const RESIST_KEYS: readonly (keyof Resistances)[] = [
  'fire',
  'cold',
  'lightning',
  'poison',
  'arcane',
  'physical'
];

export function slotMatches(itemSlot: EquipmentSlot | null | undefined, targetSlot: EquipmentSlot): boolean {
  if (!itemSlot) return false;
  if (targetSlot === 'ring-left' || targetSlot === 'ring-right') {
    return itemSlot === 'ring-left' || itemSlot === 'ring-right';
  }
  return itemSlot === targetSlot;
}

export function slotCandidates(
  backpack: readonly Item[],
  slot: EquipmentSlot,
  bases: ReadonlyMap<string, ItemBase> = loadItemBases()
): Item[] {
  return backpack.filter((it) => slotMatches(bases.get(it.baseId)?.slot ?? null, slot));
}

export function checkEligibility(
  item: Item,
  player: PlayerLike,
  bases: ReadonlyMap<string, ItemBase> = loadItemBases()
): EligibilityResult {
  const base = bases.get(item.baseId);
  if (!base) return { eligible: true, reasons: [] };

  const reasons: EligibilityFail[] = [];
  if (player.level < base.reqLevel) {
    reasons.push({ kind: 'level', required: base.reqLevel, current: player.level });
  }
  if (base.reqStats) {
    for (const key of Object.keys(base.reqStats) as (keyof CoreStats)[]) {
      const required = base.reqStats[key] ?? 0;
      const current = player.coreStats[key];
      if (current < required) {
        reasons.push({ kind: 'stat', stat: key, required, current });
      }
    }
  }
  return { eligible: reasons.length === 0, reasons };
}

function resolveTargetSlot(
  baseSlot: EquipmentSlot,
  targetSlot: EquipmentSlot,
  equipped: Readonly<Record<string, Item | null>>
): EquipmentSlot {
  if (baseSlot === 'ring-left' || baseSlot === 'ring-right') {
    if (targetSlot === 'ring-left' || targetSlot === 'ring-right') return targetSlot;
    if (!equipped['ring-left']) return 'ring-left';
    if (!equipped['ring-right']) return 'ring-right';
    return 'ring-left';
  }
  return baseSlot;
}

function isTwoHandedBase(base: ItemBase | undefined): boolean {
  if (!base || base.slot !== 'weapon') return false;
  return (
    base.id.includes('/wp2h-') ||
    base.id === 'items/base/weapon-bow' ||
    base.id === 'items/base/weapon-crossbow' ||
    base.id === 'items/base/weapon-polearm'
  );
}

function simulateEquip(
  equipped: Readonly<Record<string, Item | null>>,
  candidate: Item,
  targetSlot: EquipmentSlot,
  bases: ReadonlyMap<string, ItemBase>
): Record<string, Item | null> {
  const base = bases.get(candidate.baseId);
  const slot = base?.slot ?? targetSlot;
  const resolved = resolveTargetSlot(slot, targetSlot, equipped);
  const next: Record<string, Item | null> = { ...equipped, [resolved]: candidate };

  if (resolved === 'weapon' && isTwoHandedBase(base)) {
    next.offhand = null;
  }
  if (resolved === 'offhand') {
    const weapon = next.weapon;
    if (weapon && isTwoHandedBase(bases.get(weapon.baseId))) {
      next.weapon = null;
    }
  }
  return next;
}

function computeDerived(
  player: PlayerLike,
  equipped: Readonly<Record<string, Item | null>>
): DerivedStats {
  const mods = aggregateEquipmentMods(equipped);
  const core = applyEquipmentCoreMods(player.coreStats, mods);
  return deriveStats(core, player.level, equipmentModsToDerivedModifiers(mods));
}

export function compareEquip(
  player: PlayerLike,
  candidate: Item,
  slot: EquipmentSlot,
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReadonlyMap<string, ItemBase> = loadItemBases()
): CompareResult {
  const base = bases.get(candidate.baseId);
  const resolved = resolveTargetSlot(base?.slot ?? slot, slot, equipped);
  const current = equipped[resolved] ?? null;

  const currentDerived = computeDerived(player, equipped);
  const candidateEquipped = simulateEquip(equipped, candidate, slot, bases);
  const candidateDerived = computeDerived(player, candidateEquipped);

  const stats = {} as Record<ComparableStatKey, StatDelta>;
  for (const key of COMPARABLE_KEYS) {
    const c = currentDerived[key];
    const n = candidateDerived[key];
    stats[key] = { current: c, candidate: n, delta: n - c };
  }
  const resistances = {} as Record<keyof Resistances, StatDelta>;
  for (const key of RESIST_KEYS) {
    const c = currentDerived.resistances[key];
    const n = candidateDerived.resistances[key];
    resistances[key] = { current: c, candidate: n, delta: n - c };
  }

  return { current, candidate, slot: resolved, stats, resistances };
}
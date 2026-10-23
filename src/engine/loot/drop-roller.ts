/**
 * Drop roller — Treasure Class evaluation, MF curve, and rarity selection.
 *
 * Source: docs/design/drop-tables.md §3, §11; items-spec.md §11.
 *
 * MF curve:  effectiveMF = floor(MF / (MF + 250) * 600).
 *
 * @module engine/loot/drop-roller
 */

import type { Rng } from '../rng';
import type { Rarity } from '../types/items';
import type { MonsterTier } from '../combat/types';
import { materialEconomy, type MaterialProfile } from '../../data/loaders/materials';
import { MaterialRewardError, sampleMaterial } from './materials';

/** Effective magic find used in the rarity weight modulation. */
export function effectiveMagicFind(magicFind: number): number {
  if (magicFind <= 0) return 0;
  return Math.floor((magicFind / (magicFind + 250)) * 600);
}

/** Direct non-equipment rewards that can be selected by a treasure class. */
export type DirectDropCurrency = 'runes' | 'gems' | 'wishstones' | 'runeShards';

/** A single TC pick: an item base or direct reward with weight and level gating. */
export interface TcPick {
  readonly type?: 'item' | 'rune' | 'gem' | 'currency' | 'gold';
  readonly baseId?: string;
  readonly itemId?: string;
  readonly rarity?: Rarity;
  readonly weight: number;
  /** Min monster level required for this base. */
  readonly qlvlMin: number;
  /** Max monster level for this base. */
  readonly qlvlMax: number;
  readonly quantityMin?: number;
  readonly quantityMax?: number;
}

/** A treasure class — a list of picks plus how many independent picks to roll. */
export interface TreasureClass {
  readonly id: string;
  /** Authored acquisition profile for generic material picks in a cache. */
  readonly materialPoolId?: string;
  readonly picks: readonly TcPick[];
  /** How many items to attempt picking (default 1). */
  readonly numPicks?: number;
  /** Override "noDrop" chance per pick. */
  readonly noDropChance?: number;
}

/** Result of a single equipment drop roll. */
export interface ItemDropResult {
  readonly kind: 'item';
  readonly baseId: string;
  readonly rarity: Rarity;
  readonly ilvl: number;
}

/** Result of a single direct currency/material drop roll. */
export interface DirectDropResult {
  readonly kind: 'direct';
  readonly currency: DirectDropCurrency;
  readonly quantity: number;
  readonly itemId?: string;
  readonly ilvl: number;
}

/** Result of a single drop roll. */
export type DropResult = ItemDropResult | DirectDropResult;

/**
 * Pick one base id from a TC, deterministically using `rng`.
 * Bases whose qlvl band excludes `monsterLevel` are filtered out.
 * Returns `undefined` if nothing is eligible.
 */
export function pickTcBase(
  tc: TreasureClass,
  monsterLevel: number,
  rng: Rng
): string | undefined {
  return pickTcPick(tc, monsterLevel, rng)?.baseId;
}

/** Pick one treasure-class entry, preserving direct rewards and forced rarity. */
export function pickTcPick(
  tc: TreasureClass,
  monsterLevel: number,
  rng: Rng
): TcPick | undefined {
  return pickTcPickWithResidual(tc, monsterLevel, rng)?.pick;
}

function pickTcPickWithResidual(tc: TreasureClass, monsterLevel: number, rng: Rng):
  { readonly pick: TcPick; readonly unit: number } | undefined {
  const eligible = tc.picks.filter(
    (p) => monsterLevel >= p.qlvlMin && monsterLevel <= p.qlvlMax
  );
  if (eligible.some(p => !Number.isFinite(p.weight))) throw new MaterialRewardError('Invalid TC weight');
  const positive = eligible.filter(p => p.weight > 0);
  if (positive.length === 0) return undefined;
  const total = positive.reduce((s, p) => s + p.weight, 0);
  if (!Number.isFinite(total)) throw new MaterialRewardError('Invalid TC total');
  if (total <= 0) return undefined;
  let roll = rng.next() * total;
  for (const p of positive) {
    const unit = Math.min(1 - Number.EPSILON / 2, Math.max(0, roll / p.weight));
    roll -= p.weight;
    if (roll <= 0) return { pick: p, unit };
  }
  const pick = positive.at(-1);
  return pick ? { pick, unit: 1 - Number.EPSILON / 2 } : undefined;
}

/** Per-monster-tier multipliers from drop-tables.md §3. */
const TIER_RARITY_MULT: Readonly<
  Record<MonsterTier, { rare: number; set: number; unique: number }>
> = {
  trash: { rare: 1, set: 1, unique: 1 },
  elite: { rare: 1.5, set: 2, unique: 3 },
  'rare-minion': { rare: 1.5, set: 2, unique: 3 },
  champion: { rare: 4, set: 6, unique: 12 },
  'rare-elite': { rare: 4, set: 6, unique: 12 },
  boss: { rare: 4, set: 6, unique: 12 },
  'chapter-boss': { rare: 4, set: 6, unique: 12 }
};

const BASE_WEIGHTS = {
  white: 1000,
  magic: 300,
  rare: 80,
  set: 8,
  unique: 4
};

/**
 * Roll a rarity for a given (MF, tier) using the documented formula.
 */
export function rollRarity(
  magicFind: number,
  tier: MonsterTier,
  rng: Rng,
  magicFindMultiplier = 1
): Rarity {
  const eff = effectiveMagicFind(magicFind) * magicFindMultiplier;
  const mult = TIER_RARITY_MULT[tier];

  const weights = {
    white: Math.max(0, BASE_WEIGHTS.white * (1 - eff / 1200)),
    magic: BASE_WEIGHTS.magic * (1 + eff / 600),
    rare: BASE_WEIGHTS.rare * (1 + eff / 400) * mult.rare,
    set: BASE_WEIGHTS.set * (1 + eff / 200) * mult.set,
    unique: BASE_WEIGHTS.unique * (1 + eff / 180) * mult.unique
  };

  const total = weights.white + weights.magic + weights.rare + weights.set + weights.unique;
  let roll = rng.next() * total;

  // Walk in increasing rarity (white → unique).
  if ((roll -= weights.white) <= 0) return 'normal';
  if ((roll -= weights.magic) <= 0) return 'magic';
  if ((roll -= weights.rare) <= 0) return 'rare';
  if ((roll -= weights.set) <= 0) return 'set';
  return 'unique';
}

/** Per-tier default noDrop chance (Normal difficulty). */
const NO_DROP_CHANCE: Readonly<Record<MonsterTier, number>> = {
  trash: 0.6,
  elite: 0.12,
  'rare-minion': 0.12,
  champion: 0,
  'rare-elite': 0,
  boss: 0,
  'chapter-boss': 0
};

/** Per-tier default number of picks (drop-tables §3). */
const DEFAULT_PICKS: Readonly<Record<MonsterTier, number>> = {
  trash: 1,
  elite: 2,
  'rare-minion': 2,
  champion: 5,
  'rare-elite': 5,
  boss: 5,
  'chapter-boss': 5
};

/** Inputs for a full kill drop. */
export interface DropContext {
  readonly tc: TreasureClass;
  readonly tier: MonsterTier;
  readonly monsterLevel: number;
  readonly magicFind: number;
  /** Applied after the MF curve without further flooring; defaults to one. */
  readonly magicFindMultiplier?: number;
  /** Authoritative actual live act/difficulty; cache callers use table metadata. */
  readonly materialProfile?: MaterialProfile;
}

/**
 * Roll all drops for a slain monster: TC picks + rarity per pick.
 * Independent secondary rolls (rune-shards/runes/gems/wishstones) are handled
 * by {@link import('./orbs-and-currency').rollCurrencyDrops}.
 */
export function rollDrops(ctx: DropContext, rng: Rng): readonly DropResult[] {
  const picks = ctx.tc.numPicks ?? DEFAULT_PICKS[ctx.tier];
  const noDrop = ctx.tc.noDropChance ?? NO_DROP_CHANCE[ctx.tier];
  const results: DropResult[] = [];
  for (let i = 0; i < picks; i++) {
    if (rng.chance(noDrop)) continue;
    const selection = pickTcPickWithResidual(ctx.tc, ctx.monsterLevel, rng);
    if (!selection) continue;
    const { pick, unit } = selection;
    if ((pick.type ?? 'item') === 'item') {
      if (!pick.baseId) continue;
      const rarity = pick.rarity ?? rollRarity(ctx.magicFind, ctx.tier, rng, ctx.magicFindMultiplier);
      results.push({ kind: 'item', baseId: pick.baseId, rarity, ilvl: ctx.monsterLevel });
      continue;
    }
    const quantityMin = pick.quantityMin ?? 1;
    const quantityMax = pick.quantityMax ?? quantityMin;
    if (![quantityMin, quantityMax].every(count => Number.isSafeInteger(count) && count > 0) || quantityMax < quantityMin) {
      throw new MaterialRewardError('Invalid direct reward quantity');
    }
    const quantity = rng.nextInt(quantityMin, quantityMax);
    const currency =
      pick.type === 'rune'
        ? 'runes'
        : pick.type === 'gem'
          ? 'gems'
          : pick.itemId === 'currency/wishstone'
              ? 'wishstones'
              : 'runeShards';
    if (quantity > 0) {
      const result: DirectDropResult = { kind: 'direct', currency, quantity, ilvl: ctx.monsterLevel };
      if (Object.hasOwn(pick, 'itemId')) {
        if (typeof pick.itemId !== 'string' || pick.itemId.length === 0 ||
          (pick.type === 'currency' && pick.itemId !== 'currency/wishstone' && pick.itemId !== 'currency/rune-shard')) {
          throw new MaterialRewardError('Invalid explicit reward identity');
        }
        results.push({ ...result, itemId: pick.itemId });
      } else if (pick.type === 'rune' || pick.type === 'gem') {
        const authored = ctx.tc.materialPoolId && Object.hasOwn(materialEconomy.profiles, ctx.tc.materialPoolId)
          ? materialEconomy.profiles[ctx.tc.materialPoolId] : undefined;
        const profile = ctx.materialProfile ?? authored;
        if (!profile) throw new MaterialRewardError('Missing generic material profile');
        results.push({ ...result, itemId: sampleMaterial(pick.type, { ...profile, tier: ctx.tier }, unit) });
      } else {
        results.push(result);
      }
    }
  }
  return results;
}

/**
 * Kill-reward orchestrator.
 *
 * Given a slain monster's tier/level, the area's treasure-class id, and the
 * player's MF/GF, returns a complete reward bundle: rolled items, rune-shards, and
 * secondary currency drops (runes/gems/wishstones).
 *
 * This is the high-level entry point combat consumers should call on victory.
 * It is pure: all data is injected via {@link AwardDataPools}.
 *
 * @module engine/loot/award
 */

import defaultEliteConfigJson from '../../data/elite/elite-config.json';
import type { Rng } from '../rng';
import type { EliteConfigDef } from '../types/elite';
import type { Item, SetPieceDef, UniqueItemDef } from '../types/items';
import type { MonsterTier } from '../combat/types';
import { rollDrops, type DropResult, type TreasureClass } from './drop-roller';

const RARE_ELITE_MAGIC_FIND_BONUS = (defaultEliteConfigJson as EliteConfigDef).rareEliteMagicFindBonus;
import { rollCurrencyDrops, type Difficulty, type CurrencyDrops } from './orbs-and-currency';
import { rollItem, type ItemRollPools } from './rollItem';

/** Data pools required to award loot. */
export interface AwardDataPools extends ItemRollPools {
  readonly treasureClasses: ReadonlyMap<string, TreasureClass>;
  readonly uniques?: readonly UniqueItemDef[];
  readonly setPieces?: readonly SetPieceDef[];
}

/** Per-kill input. */
export interface KillRewardInput {
  readonly tier: MonsterTier;
  readonly monsterLevel: number;
  /** Treasure-class id (e.g. `loot/trash-act1`). */
  readonly treasureClassId: string;
  readonly magicFind: number;
  /** Applied to effective MF after the curve; defaults to one. */
  readonly magicFindMultiplier?: number;
  readonly goldFind: number;
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly difficulty?: Difficulty;
}

/** Output of a single kill. */
export interface KillRewards extends CurrencyDrops {
  readonly items: readonly Item[];
}

/** Empty rewards (used for unknown TCs to keep call sites simple). */
const EMPTY: KillRewards = { items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 0 };

/** Explicit generation context for one quest cache, independent of live combat/gear. */
export interface QuestTableRewardInput {
  readonly tableId: string;
  readonly ilvl: number;
  readonly picks: number;
}

/** Accept only the closed authored cache profile, including safe integer arithmetic. */
export function isQuestTableRewardInput(value: unknown): value is QuestTableRewardInput {
  if (typeof value !== 'object' || value === null || Object.keys(value).length !== 3 ||
    !Object.hasOwn(value, 'tableId') || !Object.hasOwn(value, 'ilvl') || !Object.hasOwn(value, 'picks') ||
    !('tableId' in value) || !('ilvl' in value) || !('picks' in value)) return false;
  return typeof value.tableId === 'string' && /^loot\/[a-z0-9][a-z0-9._-]*$/.test(value.tableId) &&
    typeof value.ilvl === 'number' && Number.isSafeInteger(value.ilvl) && value.ilvl > 0 &&
    typeof value.picks === 'number' && Number.isSafeInteger(value.picks) && value.picks > 0;
}

function materializeDrops(drops: readonly DropResult[], pools: AwardDataPools, rng: Rng):
  { rewards: KillRewards; complete: boolean } {
  const items: Item[] = [];
  let runeShards = 0, wishstones = 0, runes = 0, gems = 0;
  let complete = true;
  for (const drop of drops) {
    if (drop.kind === 'item') {
      const item = rollItem(drop, pools, rng);
      if (item) items.push(item);
      else complete = false;
    } else if (drop.currency === 'runeShards') runeShards += drop.quantity;
    else if (drop.currency === 'wishstones') wishstones += drop.quantity;
    else if (drop.currency === 'runes') runes += drop.quantity;
    else gems += drop.quantity;
  }
  return { rewards: { items, runeShards, wishstones, runes, gems }, complete };
}

/**
 * Roll only a quest's authored treasure class: replacement picks, noDrop0, MF0.
 * Unknown/empty/ineligible tables or incomplete materialization refuse the whole
 * bag. All selections precede materialization; exceptions propagate to the caller.
 * No independent kill income is rolled. Failed attempts may leave allocator gaps.
 */
export function rollQuestTableRewards(input: QuestTableRewardInput, pools: AwardDataPools, rng: Rng): KillRewards | undefined {
  if (!isQuestTableRewardInput(input)) return undefined;
  const tc = pools.treasureClasses.get(input.tableId);
  if (!tc) return undefined;
  const drops = rollDrops({ tc: { ...tc, numPicks: input.picks, noDropChance: 0 },
    tier: 'chapter-boss', monsterLevel: input.ilvl, magicFind: 0, magicFindMultiplier: 1 }, rng);
  if (drops.length !== input.picks) return undefined;
  const { rewards, complete } = materializeDrops(drops, pools, rng);
  if (!complete || ![rewards.runeShards, rewards.wishstones, rewards.runes, rewards.gems]
    .every(amount => Number.isSafeInteger(amount) && amount >= 0)) return undefined;
  return rewards;
}

/**
 * Roll the full reward set for a single kill. Items are materialised from the
 * area's treasure class; missing TCs return zero rewards.
 *
 * Determinism: same `rng` state + same inputs ⇒ identical output.
 */
export function rollKillRewards(
  input: KillRewardInput,
  pools: AwardDataPools,
  rng: Rng
): KillRewards {
  const tc = pools.treasureClasses.get(input.treasureClassId);
  if (!tc) {
    // Even without items, award the rune-shard baseline so the player isn't empty-handed.
    const cur = rollCurrencyDrops(
      input.monsterLevel,
      input.tier,
      input.act,
      input.difficulty ?? 'normal',
      input.goldFind,
      rng
    );
    return { items: [], ...cur };
  }

  const drops = rollDrops(
    {
      tc,
      tier: input.tier,
      monsterLevel: input.monsterLevel,
      magicFind: input.magicFind + (input.tier === 'rare-elite' ? RARE_ELITE_MAGIC_FIND_BONUS : 0),
      magicFindMultiplier: input.magicFindMultiplier ?? 1
    },
    rng
  );

  const direct = materializeDrops(drops, pools, rng).rewards;

  const cur = rollCurrencyDrops(
    input.monsterLevel,
    input.tier,
    input.act,
    input.difficulty ?? 'normal',
    input.goldFind,
    rng
  );

  return {
    items: direct.items,
    runeShards: cur.runeShards + direct.runeShards,
    wishstones: cur.wishstones + direct.wishstones,
    runes: cur.runes + direct.runes,
    gems: cur.gems + direct.gems
  };
}

/**
 * Roll rewards for a batch of kills, accumulating into a single bundle.
 * Convenience for end-of-fight loot summaries.
 */
export function rollBatchRewards(
  kills: readonly KillRewardInput[],
  pools: AwardDataPools,
  rng: Rng
): KillRewards {
  if (kills.length === 0) return EMPTY;
  const items: Item[] = [];
  let runeShards = 0;
  let wishstones = 0;
  let runes = 0;
  let gems = 0;
  for (const k of kills) {
    const r: KillRewards = rollKillRewards(k, pools, rng);
    items.push(...r.items);
    runeShards += r.runeShards;
    wishstones += r.wishstones;
    runes += r.runes;
    gems += r.gems;
  }
  return { items, runeShards, wishstones, runes, gems };
}

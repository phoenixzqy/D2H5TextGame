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

import type { Rng } from '../rng';
import type { Item } from '../types/items';
import type { MonsterTier } from '../combat/types';
import { rollDrops, type TreasureClass } from './drop-roller';
import { rollCurrencyDrops, type Difficulty, type CurrencyDrops } from './orbs-and-currency';
import { generateItem, type ItemDataPools } from './item-instance';

/** Data pools required to award loot. */
export interface AwardDataPools extends ItemDataPools {
  readonly treasureClasses: ReadonlyMap<string, TreasureClass>;
}

/** Per-kill input. */
export interface KillRewardInput {
  readonly tier: MonsterTier;
  readonly monsterLevel: number;
  /** Treasure-class id (e.g. `loot/trash-act1`). */
  readonly treasureClassId: string;
  readonly magicFind: number;
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
      magicFind: input.magicFind
    },
    rng
  );

  const items: Item[] = [];
  for (const d of drops) {
    const it = generateItem(d, pools, rng);
    if (it) items.push(it);
  }

  const cur = rollCurrencyDrops(
    input.monsterLevel,
    input.tier,
    input.act,
    input.difficulty ?? 'normal',
    input.goldFind,
    rng
  );

  return { items, ...cur };
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

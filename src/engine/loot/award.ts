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
import { rollDrops, type DropResult } from './drop-roller';
import { rollEquipmentGuarantees, type EquipmentGuaranteePools } from './equipment-guarantees';
import { chapterBossEquipmentTables, type ChapterBossEquipmentPolicy } from './chapter-boss-equipment';
import { rollChapterBossUnique, type ChapterBossUniquePolicy } from './chapter-boss-uniques';
import { rollChapterBossFirstKill, type ChapterBossFirstKillPolicy } from './chapter-boss-first-kills';
import { nonbossEquipmentTables, type NonbossLootPolicy } from './nonboss-equipment';
import { minibossEquipmentTables, type MinibossLootPolicy } from './miniboss-equipment';

const RARE_ELITE_MAGIC_FIND_BONUS = (defaultEliteConfigJson as EliteConfigDef).rareEliteMagicFindBonus;
import { rollCurrencyDrops, type Difficulty, type CurrencyDrops } from './orbs-and-currency';
import { rollItem } from './rollItem';
import { materialCatalog, materialEconomy, type ChapterBossMaterialBundle, type TreasureGoblinRewardPolicy } from '../../data/loaders/materials';
import { MaterialRewardError, mergeMaterials, type MaterialLedger } from './materials';
import { mergeRewards } from './reward-plan';

/** Data pools required to award loot. */
export interface AwardDataPools extends EquipmentGuaranteePools {
  readonly nonbossLoot?: NonbossLootPolicy;
  readonly minibossLoot?: MinibossLootPolicy;
  readonly chapterBossEquipment?: ChapterBossEquipmentPolicy;
  readonly chapterBossUniques?: ChapterBossUniquePolicy;
  readonly chapterBossFirstKills?: ChapterBossFirstKillPolicy;
  readonly uniques?: readonly UniqueItemDef[];
  readonly setPieces?: readonly SetPieceDef[];
}

/** Per-kill input. */
export interface KillRewardInput {
  /** Once-per-save/difficulty authority supplied only by accepted native boss settlement. */
  readonly firstKillBonus?: boolean;
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
const EMPTY: KillRewards = { items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 0, materials: {} };

/** Apply one authored gate to both kill-wishstone sources without rerolling loot. */
function applyWishstoneChance(rewards: KillRewards, rng: Rng, goblin?: TreasureGoblinRewardPolicy): KillRewards {
  if (rewards.wishstones === 0 && !goblin) return rewards;
  if (!rng.chance(materialEconomy.currencyRewards.wishstones.killChance)) return { ...rewards, wishstones: 0 };
  return goblin ? { ...rewards, wishstones: rng.nextInt(goblin.wishstoneQuantityMin, goblin.wishstoneQuantityMax) } : rewards;
}

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

function materializeDrops(drops: readonly DropResult[], pools: AwardDataPools, rng: Rng, strictRarity = false):
  { rewards: KillRewards; complete: boolean } {
  const items: Item[] = [];
  let runeShards = 0, wishstones = 0, runes = 0, gems = 0;
  let materials: MaterialLedger = {};
  let complete = true;
  for (const drop of drops) {
    if (drop.kind === 'item') {
      const item = rollItem(drop, pools, rng);
      if (item && (!strictRarity || item.rarity === drop.rarity)) items.push(item);
      else complete = false;
    } else if (drop.currency === 'runeShards') runeShards += drop.quantity;
    else if (drop.currency === 'wishstones') wishstones += drop.quantity;
    else {
      const kind = drop.currency === 'runes' ? 'rune' : 'gem';
      if (!drop.itemId || materialCatalog.get(drop.itemId)?.kind !== kind) {
        throw new MaterialRewardError('Unknown or mismatched concrete material');
      }
      materials = mergeMaterials(materials, { [drop.itemId]: drop.quantity });
      if (kind === 'rune') runes += drop.quantity;
      else gems += drop.quantity;
    }
  }
  return { rewards: mergeRewards({ items, runeShards, wishstones, runes, gems, materials }), complete };
}

/**
 * Roll only a quest's authored treasure class: replacement picks, noDrop0, MF0.
 * Unknown/empty/ineligible tables or incomplete materialization refuse the whole
 * bag. All selections precede materialization; material refusals return undefined,
 * while unrelated generation exceptions propagate to the caller.
 * No independent kill income is rolled. Failed attempts may leave allocator gaps.
 */
export function rollQuestTableRewards(input: QuestTableRewardInput, pools: AwardDataPools, rng: Rng): KillRewards | undefined {
  if (!isQuestTableRewardInput(input)) return undefined;
  const tc = pools.treasureClasses.get(input.tableId);
  if (!tc) return undefined;
  try {
    const drops = rollDrops({ tc: { ...tc, numPicks: input.picks, noDropChance: 0 },
      tier: 'chapter-boss', monsterLevel: input.ilvl, magicFind: 0, magicFindMultiplier: 1 }, rng);
    if (drops.length !== input.picks) return undefined;
    const { rewards, complete } = materializeDrops(drops, pools, rng, true);
    return complete ? rewards : undefined;
  } catch (cause) {
    if (cause instanceof MaterialRewardError) return undefined;
    throw cause;
  }
}

/**
 * Roll the full reward set for a single kill. Items are materialised from the
 * area's treasure class; a missing configured goblin source refuses its bundle,
 * while unknown ordinary tables retain baseline currency.
 *
 * Pass a separate per-kill wishstone RNG to preserve the equipment/material
 * stream. Otherwise the supplied loot RNG also provides the wish coin and,
 * for a successful goblin, its independent quantity draw before guarantees.
 * Authored equipment guarantees append after ordinary rewards and advance the
 * loot RNG for subsequent kills. Quest-table generation never applies them.
 * Determinism: same RNG states + same inputs ⇒ identical output.
 */
export function rollKillRewards(
  input: KillRewardInput,
  pools: AwardDataPools,
  rng: Rng,
  wishstoneRng: Rng = rng
): KillRewards {
  const nonbossTables = nonbossEquipmentTables(input, pools);
  const miniboss = minibossEquipmentTables(input, pools);
  const tc = pools.treasureClasses.get(input.treasureClassId);
  if (!tc) {
    if (input.treasureClassId === materialEconomy.treasureGoblin.treasureClassId) {
      throw new MaterialRewardError('Missing treasure-goblin equipment source');
    }
    // Even without items, award the rune-shard baseline so the player isn't empty-handed.
    const cur = rollCurrencyDrops(
      input.monsterLevel,
      input.tier,
      input.act,
      input.difficulty ?? 'normal',
      input.goldFind,
      rng
    );
    return applyWishstoneChance({ items: [], ...cur }, wishstoneRng);
  }

  // Goblin tables specify boss-tier loot even when the authored combatant is elite.
  // This local reward context never changes the enemy's combat stats or tier.
  if (input.treasureClassId === materialEconomy.treasureGoblin.treasureClassId) {
    input = { ...input, tier: 'boss' };
  }
  let materialBundle: ChapterBossMaterialBundle | undefined = input.tier === 'chapter-boss'
    ? materialEconomy.chapterBossMaterials[input.treasureClassId] : undefined;
  if (materialBundle && materialBundle.act !== input.act) {
    throw new MaterialRewardError('Mismatched chapter-boss material act');
  }
  let equipmentTables = miniboss?.tables ?? nonbossTables ?? chapterBossEquipmentTables(input, pools);
  let rewardPools = miniboss ? { ...pools,
    treasureClasses: new Map(pools.treasureClasses).set(miniboss.bonusSource.id, miniboss.bonusSource) } : pools;
  const rarityContext = miniboss ? { rarityMultipliers: miniboss.rarityMultipliers } : {};
  const goblin = materialEconomy.treasureGoblin;
  if (input.treasureClassId === goblin.treasureClassId) {
    const equipment = tc.picks.filter(pick => (pick.type ?? 'item') === 'item');
    if (!Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 || input.monsterLevel > goblin.terminalLevelCap ||
      equipment.length === 0 || equipment.some(pick => !pick.baseId || !Number.isFinite(pick.weight) || pick.weight <= 0 ||
        !Number.isSafeInteger(pick.qlvlMin) || pick.qlvlMin < 1 || !Number.isSafeInteger(pick.qlvlMax) ||
        pick.qlvlMax < pick.qlvlMin || pick.qlvlMax > goblin.terminalLevelCap)) {
      throw new MaterialRewardError('Invalid treasure-goblin equipment context');
    }
    const terminal = Math.max(...equipment.map(pick => pick.qlvlMax));
    const projected = { ...tc, numPicks: goblin.equipmentPicks, noDropChance: 0,
      picks: equipment.map(pick => ({ ...pick, qlvlMax: pick.qlvlMax === terminal ? goblin.terminalLevelCap : pick.qlvlMax })) };
    if (!projected.picks.some(pick => input.monsterLevel >= pick.qlvlMin && input.monsterLevel <= pick.qlvlMax)) {
      throw new MaterialRewardError('No eligible treasure-goblin equipment');
    }
    equipmentTables = [projected];
    rewardPools = { ...pools, treasureClasses: new Map(pools.treasureClasses).set(input.treasureClassId, projected) };
    materialBundle = { act: input.act,
      runePoolAct: Math.min(materialEconomy.actRuneCaps.length, input.act + goblin.runePoolActOffset) as KillRewardInput['act'],
      runeQuantityMin: goblin.runeQuantityMin, runeQuantityMax: goblin.runeQuantityMax,
      runeMinOrdinal: 1, runeMaxOrdinal: materialEconomy.runeOrder.length,
      gemQuantity: goblin.gemQuantityMin, gemQuantityMax: goblin.gemQuantityMax };
  }
  const drops = (equipmentTables ?? [materialBundle
    ? { ...tc, picks: tc.picks.filter(pick => pick.type !== 'rune' && pick.type !== 'gem') } : tc]).flatMap(table => rollDrops(
    {
      tc: table,
      tier: input.tier,
      monsterLevel: input.monsterLevel,
      magicFind: input.magicFind + (input.tier === 'rare-elite' ? RARE_ELITE_MAGIC_FIND_BONUS : 0),
      magicFindMultiplier: input.magicFindMultiplier ?? 1,
      ...rarityContext,
      materialProfile: { act: input.act, difficulty: input.difficulty ?? 'normal' }
    },
    rng
  ));

  const { rewards: direct, complete } = materializeDrops(drops, rewardPools, rng);
  if (!complete) throw new MaterialRewardError('Incomplete reward materialization');

  const cur = rollCurrencyDrops(
    input.monsterLevel,
    input.tier,
    input.act,
    input.difficulty ?? 'normal',
    input.goldFind,
    rng,
    materialBundle
  );

  const ordinary = applyWishstoneChance(mergeRewards(direct, { items: [], ...cur }), wishstoneRng,
    input.treasureClassId === goblin.treasureClassId ? goblin : undefined);
  const bonus = rollEquipmentGuarantees({ treasureClassId: input.treasureClassId,
    tier: input.tier, monsterLevel: input.monsterLevel, ...rarityContext,
    magicFind: input.magicFind + (input.tier === 'rare-elite' ? RARE_ELITE_MAGIC_FIND_BONUS : 0),
    magicFindMultiplier: input.magicFindMultiplier ?? 1
  }, rewardPools, rng);
  const uniques = rollChapterBossUnique(input, pools, rng);
  const firstKill = rollChapterBossFirstKill(input, pools, rng);
  const preceding = bonus.length === 0 && uniques.length === 0 ? ordinary : { ...ordinary, items: [...ordinary.items, ...bonus, ...uniques] };
  return firstKill.items.length === 0 && firstKill.runes === 0 ? preceding : mergeRewards(preceding, firstKill);
}

/**
 * Roll rewards for a batch of kills, accumulating into a single bundle.
 * Convenience for end-of-fight loot summaries.
 * A separate wishstone stream preserves the shared equipment/material stream
 * and advances continuously across calls, rather than reusing fork labels.
 */
export function rollBatchRewards(
  kills: readonly KillRewardInput[],
  pools: AwardDataPools,
  rng: Rng,
  wishstoneRng: Rng = rng
): KillRewards {
  if (kills.length === 0) return EMPTY;
  return mergeRewards(...kills.map(kill => rollKillRewards(kill, pools, rng, wishstoneRng)));
}

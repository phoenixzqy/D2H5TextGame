import type { MonsterTier } from '../combat/types';
import type { Rng } from '../rng';
import type { Item } from '../types/items';
import { rarityWeights, type TreasureClass } from './drop-roller';
import { MaterialRewardError } from './materials';
import { canRollItemRarity, rollItem, type ItemRollPools } from './rollItem';

/** A chance for one additional unique, optionally requiring a boosted rarity attempt. */
export interface ChapterBossUniqueRule {
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly chance: number;
  readonly rarityAttemptMultiplier?: number;
}
/** Validated optional rewards keyed by live boss treasure class. */
export type ChapterBossUniquePolicy = ReadonlyMap<string, ChapterBossUniqueRule>;
/** Actual live-kill context; reward level and MF use the current encounter. */
export interface ChapterBossUniqueInput {
  readonly act: number;
  readonly tier: MonsterTier;
  readonly treasureClassId: string;
  readonly monsterLevel: number;
  readonly magicFind: number;
  readonly magicFindMultiplier?: number;
}
/** Injected source tables, unique templates and optional policy. */
export interface ChapterBossUniquePools extends ItemRollPools {
  readonly treasureClasses: ReadonlyMap<string, TreasureClass>;
  readonly chapterBossUniques?: ChapterBossUniquePolicy;
}

/**
 * Roll a bounded optional unique after ordinary rewards. Only materializable,
 * level-eligible positive equipment sources participate; a successful bonus
 * with no unique source refuses the whole bag instead of awarding a rare.
 */
export function rollChapterBossUnique(input: ChapterBossUniqueInput, pools: ChapterBossUniquePools, rng: Rng): readonly Item[] {
  const rule = input.tier === 'chapter-boss' ? pools.chapterBossUniques?.get(input.treasureClassId) : undefined;
  if (!rule) return [];
  const multiplier = rule.rarityAttemptMultiplier;
  if (rule.act !== input.act || !Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 ||
    !Number.isFinite(rule.chance) || rule.chance < 0 || rule.chance > 1 ||
    (multiplier !== undefined && (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5))) {
    throw new MaterialRewardError('Invalid chapter-boss unique context or rule');
  }
  if (rule.chance === 0 || (rule.chance < 1 && !rng.chance(rule.chance))) return [];
  if (multiplier !== undefined) {
    const weights = rarityWeights(input.magicFind, input.tier, input.magicFindMultiplier);
    const other = weights.normal + weights.magic + weights.rare + weights.set;
    const total = other + weights.unique * multiplier;
    if (!Number.isFinite(total) || total <= 0) throw new MaterialRewardError('Invalid chapter-boss unique rarity weights');
    if (rng.next() * total <= other) return [];
  }
  return [rollBossTableUnique(input, pools, rng)];
}

/** Select and materialize one eligible unique using source-base and template weights. */
export function rollBossTableUnique(input: Pick<ChapterBossUniqueInput, 'treasureClassId' | 'monsterLevel'>,
  pools: ChapterBossUniquePools, rng: Rng): Item {
  const table = pools.treasureClasses.get(input.treasureClassId);
  if (!table) throw new MaterialRewardError('Missing chapter-boss unique source');
  const choices = table.picks.filter(pick => {
    if ((pick.type ?? 'item') !== 'item') return false;
    if (!Number.isFinite(pick.weight) || !Number.isSafeInteger(pick.qlvlMin) ||
      !Number.isSafeInteger(pick.qlvlMax) || pick.qlvlMin < 1 || pick.qlvlMax < pick.qlvlMin) {
      throw new MaterialRewardError('Invalid chapter-boss unique source');
    }
    return pick.weight > 0 && !!pick.baseId && input.monsterLevel >= pick.qlvlMin && input.monsterLevel <= pick.qlvlMax &&
      canRollItemRarity({ baseId: pick.baseId, rarity: 'unique', ilvl: input.monsterLevel }, pools);
  });
  const total = choices.reduce((sum, pick) => sum + pick.weight, 0);
  if (!Number.isFinite(total) || total <= 0) throw new MaterialRewardError('No materializable chapter-boss unique');
  let roll = rng.next() * total;
  const selected = choices.find(pick => (roll -= pick.weight) <= 0) ?? choices.at(-1);
  if (!selected?.baseId) throw new MaterialRewardError('Missing chapter-boss unique selection');
  const item = rollItem({ baseId: selected.baseId, rarity: 'unique', ilvl: input.monsterLevel }, pools, rng);
  if (!item || item.rarity !== 'unique' || !item.uniqueId) throw new MaterialRewardError('Incomplete chapter-boss unique materialization');
  return item;
}

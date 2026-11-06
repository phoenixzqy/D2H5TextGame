import type { MonsterTier } from '../combat/types';
import type { Rng } from '../rng';
import type { Item } from '../types/items';
import { rarityWeights, type RarityMultipliers, type TreasureClass } from './drop-roller';
import { MaterialRewardError } from './materials';
import { canRollItemRarity, rollItem, type ItemRollPools, type RollItemInput } from './rollItem';

/** Additional equipment group; set means set-or-unique, independently of ordinary picks. */
export interface EquipmentGuarantee {
  readonly sourceTableId: string;
  readonly minimumRarity: 'rare' | 'set';
  readonly count: number;
  readonly chance: number;
}

/** Validated authored groups keyed by the slain monster's treasure-class ID. */
export type EquipmentGuaranteePolicy = ReadonlyMap<string, readonly EquipmentGuarantee[]>;

/** Shared immutable data needed by live-kill equipment guarantees. */
export interface EquipmentGuaranteePools extends ItemRollPools {
  readonly treasureClasses: ReadonlyMap<string, TreasureClass>;
  readonly equipmentGuarantees?: EquipmentGuaranteePolicy;
}

/** Actual live-kill context; bonuses use the same effective MF and source level. */
export interface EquipmentGuaranteeInput {
  readonly treasureClassId: string;
  readonly monsterLevel: number;
  readonly tier: MonsterTier;
  readonly magicFind: number;
  readonly magicFindMultiplier?: number;
  /** Same local authored rarity context as the corresponding ordinary rolls. */
  readonly rarityMultipliers?: RarityMultipliers;
}

function candidates(rule: EquipmentGuarantee, input: EquipmentGuaranteeInput, pools: EquipmentGuaranteePools) {
  const table = pools.treasureClasses.get(rule.sourceTableId);
  if (!table) throw new MaterialRewardError('Missing guarantee equipment source');
  const weights = rarityWeights(input.magicFind, input.tier, input.magicFindMultiplier, input.rarityMultipliers);
  const choices: { readonly drop: RollItemInput; readonly weight: number }[] = [];
  for (const pick of table.picks) {
    if ((pick.type ?? 'item') !== 'item' || !pick.baseId ||
      input.monsterLevel < pick.qlvlMin || input.monsterLevel > pick.qlvlMax) continue;
    if (!Number.isFinite(pick.weight)) throw new MaterialRewardError('Invalid guarantee base weight');
    if (pick.weight <= 0) continue;
    const source = { baseId: pick.baseId, ilvl: input.monsterLevel };
    if (!canRollItemRarity({ ...source, rarity: 'rare' }, pools)) continue;
    const set = canRollItemRarity({ ...source, rarity: 'set' }, pools);
    const unique = canRollItemRarity({ ...source, rarity: 'unique' }, pools);
    // Missing templates downgrade to rare in the normal materializer. Preserve
    // that mass for rare+; exclude it entirely from a set/unique guarantee.
    const rareWeight = weights.rare + (set ? 0 : weights.set) + (unique ? 0 : weights.unique);
    for (const rarity of ['rare', 'set', 'unique'] as const) {
      if ((rarity === 'rare' && rule.minimumRarity === 'set') ||
        (rarity === 'set' && !set) || (rarity === 'unique' && !unique)) continue;
      const weight = pick.weight * (rarity === 'rare' ? rareWeight : weights[rarity]);
      if (weight > 0) choices.push({ drop: { ...source, rarity }, weight });
    }
  }
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  if (!Number.isFinite(total) || total <= 0) throw new MaterialRewardError('No materializable guaranteed equipment');
  return { choices, total };
}

/**
 * Roll only additional equipment with bounded conditional sampling. Every
 * configured item must materialize at its selected rarity; impossible groups
 * refuse the complete reward bag. No ordinary picks, currencies or caches here.
 */
export function rollEquipmentGuarantees(input: EquipmentGuaranteeInput, pools: EquipmentGuaranteePools, rng: Rng): readonly Item[] {
  const items: Item[] = [];
  for (const rule of pools.equipmentGuarantees?.get(input.treasureClassId) ?? []) {
    if (!Number.isSafeInteger(rule.count) || rule.count < 1 || rule.count > 3 ||
      !Number.isFinite(rule.chance) || rule.chance < 0 || rule.chance > 1) {
      throw new MaterialRewardError('Invalid equipment guarantee');
    }
    if (rule.chance === 0 || (rule.chance < 1 && !rng.chance(rule.chance))) continue;
    const { choices, total } = candidates(rule, input, pools);
    for (let count = 0; count < rule.count; count++) {
      let roll = rng.next() * total;
      const selected = choices.find(choice => (roll -= choice.weight) <= 0) ?? choices.at(-1);
      if (!selected) throw new MaterialRewardError('Missing guaranteed equipment selection');
      const item = rollItem(selected.drop, pools, rng);
      if (!item || item.rarity !== selected.drop.rarity) throw new MaterialRewardError('Incomplete guaranteed equipment materialization');
      items.push(item);
    }
  }
  return items;
}

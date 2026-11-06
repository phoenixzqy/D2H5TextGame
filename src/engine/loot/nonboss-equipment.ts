import type { MonsterTier } from '../combat/types';
import type { ItemBase } from '../types/items';
import type { TreasureClass } from './drop-roller';
import type { Difficulty } from './orbs-and-currency';
import { MaterialRewardError } from './materials';

/** Authored ordinary attempts and rarity weights for each supported nonboss tier. */
export interface NonbossTierLoot {
  readonly equipmentPicks: number;
  readonly minimumLevelOffset: number;
  readonly jewelryPicks: number;
  readonly noDrop: Readonly<Record<Difficulty, number>>;
  readonly rarityMultipliers: { readonly rare: number; readonly set: number; readonly unique: number };
}

/** Current act sources, with a finite extension only for terminal equipment. */
export interface NonbossActLoot {
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly tableIds: readonly string[];
  readonly equipmentSourceId: string;
  readonly jewelrySourceId: string;
  readonly terminalLevelCap: number;
}

/** Optional live policy; explicit cache generation never applies it. */
export interface NonbossLootPolicy {
  readonly tiers: Readonly<Record<'trash' | 'champion' | 'rare-elite', NonbossTierLoot>>;
  readonly acts: readonly NonbossActLoot[];
}

/** Prepare tier-specific sources before entropy is consumed or rewards published. */
export function nonbossEquipmentTables(
  input: { readonly treasureClassId: string; readonly act: number; readonly tier: MonsterTier;
    readonly monsterLevel: number; readonly difficulty?: Difficulty },
  pools: { readonly treasureClasses: ReadonlyMap<string, TreasureClass>; readonly bases: ReadonlyMap<string, ItemBase>;
    readonly nonbossLoot?: NonbossLootPolicy }
): readonly TreasureClass[] | undefined {
  if (!pools.nonbossLoot || (input.tier !== 'trash' && input.tier !== 'champion' && input.tier !== 'rare-elite')) return undefined;
  const row = pools.nonbossLoot.acts.find(row => row.tableIds.includes(input.treasureClassId));
  if (!row) return undefined;
  if (row.act !== input.act) throw new MaterialRewardError('Mismatched nonboss equipment act');
  if (!pools.treasureClasses.has(input.treasureClassId)) throw new MaterialRewardError('Missing nonboss loot table');
  if (!Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 || input.monsterLevel > row.terminalLevelCap) {
    throw new MaterialRewardError('Invalid nonboss equipment level');
  }
  const tier = pools.nonbossLoot.tiers[input.tier];
  const groups = [{ id: row.equipmentSourceId, count: tier.equipmentPicks, offset: tier.minimumLevelOffset,
    noDrop: tier.noDrop[input.difficulty ?? 'normal'], jewelry: false },
  ...(tier.jewelryPicks ? [{ id: row.jewelrySourceId, count: tier.jewelryPicks, offset: 0, noDrop: 0, jewelry: true }] : [])];
  return groups.map(group => {
    const source = pools.treasureClasses.get(group.id);
    if (!source) throw new MaterialRewardError('Missing nonboss equipment source');
    const equipment = source.picks.filter(pick => (pick.type ?? 'item') === 'item');
    if (!equipment.length || equipment.some(pick => !pick.baseId || !Number.isFinite(pick.weight) || pick.weight <= 0 ||
      !Number.isSafeInteger(pick.qlvlMin) || pick.qlvlMin < 1 || !Number.isSafeInteger(pick.qlvlMax) || pick.qlvlMax < pick.qlvlMin)) {
      throw new MaterialRewardError('Invalid nonboss equipment source');
    }
    if (group.jewelry && equipment.some(pick => !pick.baseId || pools.bases.get(pick.baseId)?.type !== 'jewelry')) {
      throw new MaterialRewardError('Invalid nonboss jewelry source');
    }
    const terminal = Math.max(...equipment.map(pick => pick.qlvlMax));
    if (terminal > row.terminalLevelCap) throw new MaterialRewardError('Truncated nonboss equipment source');
    const picks = equipment.map(pick => ({ ...pick, qlvlMin: pick.qlvlMin + group.offset,
      qlvlMax: pick.qlvlMax === terminal ? row.terminalLevelCap : pick.qlvlMax }));
    if (group.jewelry && !picks.some(pick => input.monsterLevel >= pick.qlvlMin && input.monsterLevel <= pick.qlvlMax)) {
      throw new MaterialRewardError('No eligible guaranteed jewelry');
    }
    return { id: source.id, numPicks: group.count, noDropChance: group.noDrop, picks };
  });
}

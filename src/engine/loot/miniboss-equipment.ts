import type { MonsterTier } from '../combat/types';
import type { ItemBase } from '../types/items';
import type { RarityMultipliers, TreasureClass } from './drop-roller';
import { MaterialRewardError } from './materials';

/** Ordinary sources and rarity context for actual-act live miniboss kills. */
export interface MinibossLootPolicy {
  readonly equipmentPicks: number;
  readonly minimumLevelOffset: number;
  readonly jewelryPicks: number;
  readonly rarityMultipliers: RarityMultipliers;
  readonly acts: readonly {
    readonly act: 1 | 2 | 3 | 4 | 5;
    readonly treasureClassId: string;
    readonly equipmentSourceId: string;
    readonly jewelrySourceId: string;
    readonly terminalLevelCap: number;
  }[];
}

/** Prepare all miniboss sources before drawing; combat and explicit caches keep their identity. */
export function minibossEquipmentTables(
  input: { readonly treasureClassId: string; readonly act: number; readonly tier: MonsterTier; readonly monsterLevel: number },
  pools: { readonly treasureClasses: ReadonlyMap<string, TreasureClass>; readonly bases: ReadonlyMap<string, ItemBase>;
    readonly minibossLoot?: MinibossLootPolicy }
): { readonly tables: readonly TreasureClass[]; readonly bonusSource: TreasureClass;
  readonly rarityMultipliers: RarityMultipliers } | undefined {
  const policy = pools.minibossLoot;
  if (!policy || input.tier !== 'boss') return undefined;
  const row = policy.acts.find(row => row.treasureClassId === input.treasureClassId);
  if (!row) return undefined;
  if (row.act !== input.act) throw new MaterialRewardError('Mismatched miniboss equipment act');
  if (!pools.treasureClasses.has(input.treasureClassId)) throw new MaterialRewardError('Missing miniboss loot table');
  if (!Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 || input.monsterLevel > row.terminalLevelCap) {
    throw new MaterialRewardError('Invalid miniboss equipment level');
  }
  const project = (id: string, count: number, jewelry: boolean): TreasureClass => {
    const source = pools.treasureClasses.get(id);
    if (!source) throw new MaterialRewardError('Missing miniboss equipment source');
    const equipment = source.picks.filter(pick => (pick.type ?? 'item') === 'item');
    if (!equipment.length || equipment.some(pick => !pick.baseId || !pools.bases.has(pick.baseId) ||
      !Number.isFinite(pick.weight) || pick.weight <= 0 || !Number.isSafeInteger(pick.qlvlMin) || pick.qlvlMin < 1 ||
      !Number.isSafeInteger(pick.qlvlMax) || pick.qlvlMax < pick.qlvlMin)) {
      throw new MaterialRewardError('Invalid miniboss equipment source');
    }
    if (jewelry && equipment.some(pick => !pick.baseId || pools.bases.get(pick.baseId)?.type !== 'jewelry')) {
      throw new MaterialRewardError('Invalid miniboss jewelry source');
    }
    const terminal = Math.max(...equipment.map(pick => pick.qlvlMax));
    if (terminal > row.terminalLevelCap) throw new MaterialRewardError('Truncated miniboss equipment source');
    return { id: source.id, numPicks: count, noDropChance: 0,
      picks: equipment.map(pick => ({ ...pick, qlvlMax: pick.qlvlMax === terminal ? row.terminalLevelCap : pick.qlvlMax })) };
  };
  const bonusSource = project(row.equipmentSourceId, policy.equipmentPicks, false);
  const ordinary = { ...bonusSource, picks: bonusSource.picks.map(pick => ({ ...pick,
    qlvlMin: pick.qlvlMin + policy.minimumLevelOffset })) };
  const jewelry = project(row.jewelrySourceId, policy.jewelryPicks, true);
  const tables = [ordinary, jewelry];
  if (tables.some(table => !table.picks.some(pick => input.monsterLevel >= pick.qlvlMin && input.monsterLevel <= pick.qlvlMax))) {
    throw new MaterialRewardError('No eligible miniboss equipment');
  }
  return { tables, bonusSource, rarityMultipliers: policy.rarityMultipliers };
}

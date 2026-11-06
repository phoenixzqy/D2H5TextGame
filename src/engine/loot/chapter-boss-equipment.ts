import type { MonsterTier } from '../combat/types';
import type { TreasureClass } from './drop-roller';
import { MaterialRewardError } from './materials';

/** Ordinary, noDrop0 replacement picks from an equipment-only source projection. */
export interface ChapterBossEquipmentGroup {
  readonly sourceTableId: string;
  readonly count: number;
  readonly minimumLevelOffset: number;
  readonly terminalLevelCap: number;
}

/** Act-bound live chapter-boss groups; quest caches never apply this policy. */
export interface ChapterBossEquipmentRule {
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly groups: readonly ChapterBossEquipmentGroup[];
}

/** Authored ordinary groups keyed by the boss's treasure-class ID. */
export type ChapterBossEquipmentPolicy = ReadonlyMap<string, ChapterBossEquipmentRule>;

/**
 * Prepare every configured source before rolling. Only the terminal equipment
 * band extends to the finite boss cap; expired earlier bands stay expired.
 * Actual monster level still controls eligibility and materialized item level.
 */
export function chapterBossEquipmentTables(
  input: { readonly treasureClassId: string; readonly act: number; readonly tier: MonsterTier; readonly monsterLevel: number },
  pools: { readonly treasureClasses: ReadonlyMap<string, TreasureClass>; readonly chapterBossEquipment?: ChapterBossEquipmentPolicy }
): readonly TreasureClass[] | undefined {
  const rule = input.tier === 'chapter-boss' ? pools.chapterBossEquipment?.get(input.treasureClassId) : undefined;
  if (!rule) return undefined;
  if (rule.act !== input.act) throw new MaterialRewardError('Mismatched chapter-boss equipment act');
  if (!Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 || rule.groups.length !== 2) {
    throw new MaterialRewardError('Invalid chapter-boss equipment context');
  }
  return rule.groups.map(group => {
    if (!Number.isSafeInteger(group.count) || group.count < 1 || group.count > 8 ||
      !Number.isSafeInteger(group.minimumLevelOffset) || group.minimumLevelOffset < 0 || group.minimumLevelOffset > 5 ||
      !Number.isSafeInteger(group.terminalLevelCap) || group.terminalLevelCap < 1 || group.terminalLevelCap > 200) {
      throw new MaterialRewardError('Invalid chapter-boss equipment group');
    }
    const source = pools.treasureClasses.get(group.sourceTableId);
    if (!source) throw new MaterialRewardError('Missing chapter-boss equipment source');
    const equipment = source.picks.filter(pick => (pick.type ?? 'item') === 'item');
    if (equipment.length === 0 || equipment.some(pick => !pick.baseId || !Number.isFinite(pick.weight) ||
      pick.weight <= 0 || !Number.isSafeInteger(pick.qlvlMin) || pick.qlvlMin < 1 ||
      !Number.isSafeInteger(pick.qlvlMax) || pick.qlvlMax < pick.qlvlMin)) {
      throw new MaterialRewardError('Invalid chapter-boss equipment source');
    }
    const terminal = Math.max(...equipment.map(pick => pick.qlvlMax));
    if (group.terminalLevelCap < terminal) throw new MaterialRewardError('Truncated chapter-boss equipment source');
    const picks = equipment.map(pick => ({ ...pick,
      qlvlMin: pick.qlvlMin + group.minimumLevelOffset,
      qlvlMax: pick.qlvlMax === terminal ? group.terminalLevelCap : pick.qlvlMax
    }));
    if (!picks.some(pick => input.monsterLevel >= pick.qlvlMin && input.monsterLevel <= pick.qlvlMax)) {
      throw new MaterialRewardError('No eligible chapter-boss equipment');
    }
    return { id: source.id, picks, numPicks: group.count, noDropChance: 0 };
  });
}

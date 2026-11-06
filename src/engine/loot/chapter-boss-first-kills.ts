import type { MonsterTier } from '../combat/types';
import type { Rng } from '../rng';
import type { KillRewards } from './award';
import type { Difficulty } from './orbs-and-currency';
import { MaterialRewardError, sampleMaterial, type RuneOrdinalBand } from './materials';
import { rollUniqueItem } from './rollItem';
import { rollBossTableUnique, type ChapterBossUniquePools } from './chapter-boss-uniques';

/** Authored identity and exact first-kill reward alternatives for one boss. */
export interface ChapterBossFirstKillRule {
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly areaId: string;
  readonly bossId: string;
  readonly randomUnique: 'any' | 'armor-or-weapon' | 'elite';
  readonly namedUnique?: { readonly id: string; readonly chance: number };
  readonly hellRune?: RuneOrdinalBand;
}
/** Boss bindings and explicit Elite-base classification. */
export interface ChapterBossFirstKillPolicy {
  readonly bosses: ReadonlyMap<string, ChapterBossFirstKillRule>;
  readonly eliteBaseIds: ReadonlySet<string>;
}
/** Injected source/template data with an independent first-kill policy. */
export interface ChapterBossFirstKillPools extends ChapterBossUniquePools {
  readonly chapterBossFirstKills?: ChapterBossFirstKillPolicy;
}
/** Pure reward input; native settlement owns first-kill eligibility. */
export interface ChapterBossFirstKillInput {
  readonly firstKillBonus?: boolean;
  readonly act: number;
  readonly tier: MonsterTier;
  readonly treasureClassId: string;
  readonly monsterLevel: number;
  readonly difficulty?: Difficulty;
}

/**
 * Append one exact or restricted unique and the configured Hell rune. Refuse an
 * impossible selected reward without a rare fallback; never mutate clear flags.
 */
export function rollChapterBossFirstKill(input: ChapterBossFirstKillInput,
  pools: ChapterBossFirstKillPools, rng: Rng): KillRewards {
  const empty: KillRewards = { items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 0, materials: {} };
  const policy = pools.chapterBossFirstKills;
  const rule = input.firstKillBonus === true && input.tier === 'chapter-boss'
    ? policy?.bosses.get(input.treasureClassId) : undefined;
  if (!rule || !policy) return empty;
  const named = rule.namedUnique;
  if (rule.act !== input.act || !Number.isSafeInteger(input.monsterLevel) || input.monsterLevel < 1 ||
    !['normal', 'nightmare', 'hell'].includes(input.difficulty ?? 'normal') ||
    !['any', 'armor-or-weapon', 'elite'].includes(rule.randomUnique) ||
    named && (!Number.isFinite(named.chance) || named.chance <= 0 || named.chance >= 1)) {
    throw new MaterialRewardError('Invalid chapter-boss first-kill context or rule');
  }
  const namedSelected = named && rng.chance(named.chance);
  const item = namedSelected
    ? rollUniqueItem({ uniqueId: named.id, ilvl: input.monsterLevel }, pools, rng)
    : rollBossTableUnique(input, { ...pools, uniques: (pools.uniques ?? []).filter(template => {
      if (template.id === named?.id) return false;
      const base = pools.bases.get(template.baseId);
      if (rule.randomUnique === 'armor-or-weapon') return base?.type === 'armor' || base?.type === 'weapon';
      return rule.randomUnique !== 'elite' || policy.eliteBaseIds.has(template.baseId);
    }) }, rng);
  if (!item || item.rarity !== 'unique' || !item.uniqueId) {
    throw new MaterialRewardError('Incomplete chapter-boss first-kill unique');
  }
  const rune = rule.hellRune && input.difficulty === 'hell' ? sampleMaterial('rune',
    { act: rule.act, tier: input.tier, difficulty: input.difficulty }, rng.next(), rule.hellRune) : undefined;
  return { ...empty, items: [item], ...(rune ? { runes: 1, materials: { [rune]: 1 } } : {}) };
}

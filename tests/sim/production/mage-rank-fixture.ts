import Ajv from 'ajv';
import classData from '@/data/classes/necromancer.json';
import skills from '@/data/skills/necromancer.json';
import type { CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { deriveStats, effectiveStatValue, totalSkillPoints, totalStatPoints } from '@/engine/progression/stats';
import { allocatePoint, pointsSpent, type SkillRanks } from '@/engine/progression/skill-tree';
import { composeHeroRecovery } from '@/engine/progression/warmth';
import { canonicalSkillIdFromData } from '@/engine/skills/dataCatalog';
import { buildMageBalanceFixture, mageJsonHash } from './mage-balance-fixture';

/** Closed rank family: ordinary unearned L32 versus the screen's authored early zone. */
export const MAGE_RANK_RECIPE = {
  version: 'mage-rank-family-v1', origin: 'unearned-imported-build',
  classId: 'necromancer', level: 32, skeletonRank: 1, masteryRank: 0,
  equipment: 'none', mercs: 'none', preloadedSummons: 'none',
  areaId: 'areas/act1-blood-moor', waveIndex: 0, mode: 'manual', challengeOrdinal: 0,
  idleEliteMisses: 0, planGenerationSeed: 7, enemyGenerationSeed: 991,
  seedStart: 0, seedCount: 1000
} as const;
export type MageRankRecipe = typeof MAGE_RANK_RECIPE & { readonly mageRank: number };
const validate = new Ajv({ strict: true }).compile<MageRankRecipe>({
  type: 'object', required: [...Object.keys(MAGE_RANK_RECIPE), 'mageRank'], additionalProperties: false,
  properties: { ...Object.fromEntries(Object.entries(MAGE_RANK_RECIPE).map(([key, value]) => [key, { const: value }])),
    mageRank: { type: 'integer', minimum: 1, maximum: 20 } }
});

/** Refuse custom stats, Mastery, seeds, gear or level inside this single audit family. */
export function parseMageRankRecipe(input: unknown): MageRankRecipe {
  if (!validate(input)) throw new Error('Invalid Mage rank recipe');
  return structuredClone(input);
}

export interface MageRankFixture {
  readonly recipe: MageRankRecipe;
  readonly snapshot: CombatSnapshot;
  readonly allocation: { readonly skillPointsSpent: number; readonly skillPointsUnspent: number; readonly statPointsUnspent: number };
  readonly hash: string;
}

/** Allocate through production rules; only the authored enemy encounter is reused from the screen. */
export function buildMageRankFixture(mageRank: number): MageRankFixture {
  const recipe = parseMageRankRecipe({ ...MAGE_RANK_RECIPE, mageRank });
  let ranks: SkillRanks = {};
  for (const [id, rank] of [['skills-necromancer-raise-skeleton', recipe.skeletonRank],
    ['skills-necromancer-raise-skeletal-mage', recipe.mageRank]] as const) {
    const source = skills.find(row => row.id === id);
    if (!source) throw new Error('Missing authored Mage rank skill');
    const node = { id: canonicalSkillIdFromData(source.id), minLevel: source.requiredLevel ?? source.minLevel,
      maxRank: source.maxLevel, prerequisites: (source.prerequisites ?? []).map(skillId => ({ skillId: canonicalSkillIdFromData(skillId), rank: 1 })) };
    for (let point = 0; point < rank; point++) ranks = allocatePoint(node, ranks, recipe.level);
  }
  const core = { ...classData.startingStats }, stats = deriveStats(core, recipe.level);
  const hero: CombatUnit = { id: 'player-mage-rank-audit', name: 'Unearned Mage rank audit', side: 'player', kind: 'hero',
    level: recipe.level, tier: 'trash', stats, life: stats.lifeMax, mana: stats.manaMax,
    ...composeHeroRecovery({ classId: recipe.classId, level: recipe.level, effectiveEnergy: effectiveStatValue(core.energy), skillLevels: ranks }),
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0', skillLevels: ranks,
    skillOrder: ['necromancer.raise_skeletal_mage'], equippedWeapon: {}, statuses: [], cooldowns: {},
    activeBuffIds: [], enraged: false, summonedAdds: false };
  // No L30 hero, allocation, summons or resource state is copied from the earlier fixture.
  const enemyTeam = buildMageBalanceFixture().snapshot.enemyTeam;
  const snapshot: CombatSnapshot = { seed: recipe.seedStart, act: 1, playerTeam: [hero], enemyTeam };
  const allocation = { skillPointsSpent: pointsSpent(ranks), skillPointsUnspent: totalSkillPoints(recipe.level) - pointsSpent(ranks),
    statPointsUnspent: totalStatPoints(recipe.level) };
  const value = { recipe, snapshot, allocation };
  return { ...value, hash: mageJsonHash(value) };
}

import Ajv from 'ajv';
import { createHash } from 'node:crypto';
import skills from '@/data/skills/necromancer.json';
import type { CombatSnapshot } from '@/engine/combat/combat';
import { allocatePoint, pointsSpent } from '@/engine/progression/skill-tree';
import { totalSkillPoints } from '@/engine/progression/stats';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture, type MageMasteryFixture } from './mage-mastery-fixture';

/** One closed, unearned composition; no encounter or outcome tuning knobs. */
export const MAGE_MIXED_RECIPE = {
  version: 'mage-mixed-army-v1', origin: 'unearned-imported-build',
  sourceHash: 'b9c2d4164de6da292d9b49062ef397a9a765b6f5c1401c07b252d949357b70bf',
  sourceBytesHash: 'a4264e6c7583ad35dcdc719131fb54ea8755aae5f5b9e39fd76bca8f76c684a5',
  skeletonRank: 6, mageRank: 6, masteryRank: 1
} as const;
export type MageMixedRecipe = typeof MAGE_MIXED_RECIPE;
const validate = new Ajv({ strict: true }).compile<MageMixedRecipe>({ const: MAGE_MIXED_RECIPE });

/** Refuse extra properties and every deviation from the approved composition. */
export function parseMageMixedRecipe(input: unknown): MageMixedRecipe {
  if (!validate(input)) throw new Error('Invalid Mage mixed recipe');
  return structuredClone(input);
}

export interface MageMixedFixture {
  readonly recipe: MageMixedRecipe;
  readonly source: { readonly hash: string; readonly sha256: string };
  readonly snapshot: CombatSnapshot;
  readonly allocation: MageMasteryFixture['allocation'];
  readonly overrides: readonly { readonly field: string; readonly before: unknown; readonly after: unknown }[];
  readonly hash: string;
}

function authoredFixture(recipe: MageMixedRecipe): Omit<MageMixedFixture, 'hash'> {
  const source = buildMageMasteryFixture(1);
  if (source.hash !== recipe.sourceHash || JSON.stringify(source).length + 1 !== 6270 ||
    createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex') !== recipe.sourceBytesHash) {
    throw new Error('Mage mixed source identity');
  }
  const hero = source.snapshot.playerTeam[0];
  const skill = skills.find(row => row.id === 'skills-necromancer-raise-skeleton');
  if (!hero?.skillLevels || !skill || (skill.prerequisites?.length ?? 0) > 0) throw new Error('Missing Mage mixed allocation source');
  let ranks = hero.skillLevels;
  const node = { id: 'necromancer.raise_skeleton', minLevel: skill.requiredLevel,
    maxRank: skill.maxLevel, prerequisites: [] };
  for (let rank = ranks[node.id] ?? 0; rank < recipe.skeletonRank; rank++) ranks = allocatePoint(node, ranks, hero.level);
  const skillOrder = ['necromancer.raise_skeleton', 'necromancer.raise_skeletal_mage'];
  const allocation = { ...source.allocation, skillPointsSpent: pointsSpent(ranks),
    skillPointsUnspent: totalSkillPoints(hero.level) - pointsSpent(ranks) };
  const snapshot = { ...source.snapshot, playerTeam: [{ ...hero, skillLevels: ranks, skillOrder }] };
  const overrides = [
    { field: 'snapshot.playerTeam.0.skillLevels.necromancer.raise_skeleton', before: hero.skillLevels[node.id], after: ranks[node.id] },
    { field: 'snapshot.playerTeam.0.skillOrder', before: hero.skillOrder, after: skillOrder },
    { field: 'allocation.skillPointsSpent', before: source.allocation.skillPointsSpent, after: allocation.skillPointsSpent },
    { field: 'allocation.skillPointsUnspent', before: source.allocation.skillPointsUnspent, after: allocation.skillPointsUnspent }
  ];
  return { recipe, source: { hash: source.hash, sha256: recipe.sourceBytesHash }, snapshot, allocation, overrides };
}

/** Allocate Skeleton points through production rules while preserving all other M1 fields. */
export function buildMageMixedFixture(input: unknown = MAGE_MIXED_RECIPE): MageMixedFixture {
  const value = authoredFixture(parseMageMixedRecipe(input));
  return { ...value, hash: mageJsonHash(value) };
}

/** Reconstruct the full expected object, including enemies and the changed-only inventory. */
export function assertMageMixedFixture(fixture: MageMixedFixture): void {
  const expected = buildMageMixedFixture(fixture.recipe);
  if (mageJsonHash(fixture) !== mageJsonHash(expected)) throw new Error('Mage mixed fixture mismatch');
}

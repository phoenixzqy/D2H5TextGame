import Ajv from 'ajv';
import classData from '@/data/classes/necromancer.json';
import skills from '@/data/skills/necromancer.json';
import areas from '@/data/maps/sub-areas/act2.json';
import monsters from '@/data/monsters/act2.json';
import type { CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { SubAreaDef } from '@/engine/types/maps';
import type { MonsterDef } from '@/engine/types/monsters';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import { deriveStats, effectiveStatValue, totalSkillPoints, totalStatPoints } from '@/engine/progression/stats';
import { allocatePoint, pointsSpent, type SkillRanks } from '@/engine/progression/skill-tree';
import { composeHeroRecovery } from '@/engine/progression/warmth';
import { composeSkeletonMastery } from '@/engine/skills/skeleton-mastery';
import { canonicalSkillIdFromData } from '@/engine/skills/dataCatalog';
import { mageJsonHash } from './mage-balance-fixture';

/** Closed unearned near-level family; enemy and build recipes never change to obtain wins. */
export const MAGE_MASTERY_RECIPE = {
  version: 'mage-mastery-family-v1', origin: 'unearned-imported-build',
  classId: 'necromancer', level: 26, skeletonRank: 1, mageRank: 6,
  equipment: 'none', mercs: 'none', preloadedSummons: 'none',
  areaId: 'areas/act2-arcane-sanctuary', waveIndex: 0, mode: 'manual', challengeOrdinal: 0,
  idleEliteMisses: 0, planGenerationSeed: 7, enemyGenerationSeed: 991, seedStart: 0, seedCount: 1000
} as const;
export type MageMasteryRecipe = typeof MAGE_MASTERY_RECIPE & { readonly masteryRank: 0 | 1 | 19 | 20 };
const validate = new Ajv({ strict: true }).compile<MageMasteryRecipe>({
  type: 'object', required: [...Object.keys(MAGE_MASTERY_RECIPE), 'masteryRank'], additionalProperties: false,
  properties: { ...Object.fromEntries(Object.entries(MAGE_MASTERY_RECIPE).map(([key, value]) => [key, { const: value }])),
    masteryRank: { type: 'integer', enum: [0, 1, 19, 20] } }
});

/** Refuse custom scenario knobs and ranks outside the reviewed Mastery boundary cells. */
export function parseMageMasteryRecipe(input: unknown): MageMasteryRecipe {
  if (!validate(input)) throw new Error('Invalid Mage Mastery recipe');
  return structuredClone(input);
}

function authoredHero(recipe: MageMasteryRecipe) {
  let ranks: SkillRanks = {};
  for (const [id, rank] of [['skills-necromancer-raise-skeleton', recipe.skeletonRank],
    ['skills-necromancer-raise-skeletal-mage', recipe.mageRank],
    ['skills-necromancer-skeleton-mastery', recipe.masteryRank]] as const) {
    const source = skills.find(row => row.id === id);
    if (!source) throw new Error('Missing authored Mage Mastery skill');
    const prerequisites = (source.prerequisites ?? []).map(skillId => ({ skillId: canonicalSkillIdFromData(skillId), rank: 1 }));
    const node = { id: canonicalSkillIdFromData(source.id), minLevel: source.requiredLevel ?? source.minLevel,
      maxRank: source.maxLevel, prerequisites };
    for (let point = 0; point < rank; point++) {
      if (prerequisites.some(prerequisite => (ranks[prerequisite.skillId] ?? 0) < prerequisite.rank)) {
        throw new Error('Missing authored Mage Mastery prerequisite');
      }
      ranks = allocatePoint(node, ranks, recipe.level);
    }
  }
  const core = { ...classData.startingStats }, stats = deriveStats(core, recipe.level);
  const hero: CombatUnit = { id: 'player-mage-mastery-audit', name: 'Unearned Mage Mastery audit', side: 'player', kind: 'hero',
    level: recipe.level, tier: 'trash', stats, life: stats.lifeMax, mana: stats.manaMax,
    ...composeHeroRecovery({ classId: recipe.classId, level: recipe.level, effectiveEnergy: effectiveStatValue(core.energy), skillLevels: ranks }),
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0', skillLevels: ranks,
    skillOrder: ['necromancer.raise_skeletal_mage'], equippedWeapon: {}, statuses: [], cooldowns: {},
    activeBuffIds: [], enraged: false, summonedAdds: false };
  const skeletonMastery = composeSkeletonMastery({ id: hero.id, class: recipe.classId, level: recipe.level, skillLevels: ranks });
  const allocation = { skillPointsSpent: pointsSpent(ranks), skillPointsUnspent: totalSkillPoints(recipe.level) - pointsSpent(ranks),
    statPointsUnspent: totalStatPoints(recipe.level) };
  return { hero, skeletonMastery, allocation };
}

export interface MageMasteryFixture {
  readonly recipe: MageMasteryRecipe;
  readonly snapshot: CombatSnapshot;
  readonly allocation: { readonly skillPointsSpent: number; readonly skillPointsUnspent: number; readonly statPointsUnspent: number };
  readonly hash: string;
}

/** Build only through production allocation, owner-bound passive composition and authored wave generation. */
export function buildMageMasteryFixture(masteryRank: number): MageMasteryFixture {
  const recipe = parseMageMasteryRecipe({ ...MAGE_MASTERY_RECIPE, masteryRank });
  const { hero, skeletonMastery, allocation } = authoredHero(recipe);
  const area = (areas as readonly SubAreaDef[]).find(row => row.id === recipe.areaId);
  const fallback = area?.waves?.[0]?.encounters?.[0]?.monsters[0]?.archetypeId;
  if (!area || !fallback) throw new Error('Missing authored Arcane Sanctuary encounter');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: fallback,
    fallbackLevel: area.areaLevel, seed: recipe.planGenerationSeed, mode: recipe.mode,
    challengeOrdinal: recipe.challengeOrdinal, idleEliteMisses: recipe.idleEliteMisses });
  const wave = plan.waves[recipe.waveIndex];
  if (!wave || wave.waveTier !== 'trash' || wave.spawns.some(spawn => spawn.tier !== 'trash')) {
    throw new Error('Mage Mastery family requires its authored ordinary first wave');
  }
  const rng = createRng(recipe.enemyGenerationSeed);
  const enemyTeam = wave.spawns.map(spawn => {
    const def = (monsters as unknown as readonly MonsterDef[]).find(row => row.id === spawn.archetypeId);
    if (!def) throw new Error('Missing exact Mage Mastery monster');
    return buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, rng, index: spawn.index });
  });
  const snapshot: CombatSnapshot = { seed: recipe.seedStart, act: 2, playerTeam: [hero], enemyTeam,
    ...(skeletonMastery ? { skeletonMastery } : {}) };
  const value = { recipe, snapshot, allocation };
  return { ...value, hash: mageJsonHash(value) };
}

/** Refuse rehashed hero/allocation/passive forgeries; the external manifest additionally binds all fixture bytes. */
export function assertMageMasteryFixture(fixture: MageMasteryFixture): void {
  const recipe = parseMageMasteryRecipe(fixture.recipe);
  if (fixture.hash !== mageJsonHash({ recipe, snapshot: fixture.snapshot, allocation: fixture.allocation })) throw new Error('Mage Mastery fixture hash');
  const expected = authoredHero(recipe);
  if (fixture.snapshot.act !== 2 || fixture.snapshot.seed !== 0 ||
    mageJsonHash(fixture.snapshot.playerTeam) !== mageJsonHash([expected.hero])) throw new Error('Mage Mastery authored hero mismatch');
  if (mageJsonHash(fixture.allocation) !== mageJsonHash(expected.allocation)) throw new Error('Mage Mastery allocation mismatch');
  if (mageJsonHash({ projection: fixture.snapshot.skeletonMastery }) !== mageJsonHash({ projection: expected.skeletonMastery })) {
    throw new Error('Mage Mastery projection mismatch');
  }
}

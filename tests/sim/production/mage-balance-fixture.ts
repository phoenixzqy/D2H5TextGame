import Ajv from 'ajv';
import classData from '@/data/classes/necromancer.json';
import skills from '@/data/skills/necromancer.json';
import areas from '@/data/maps/sub-areas/act1.json';
import monsters from '@/data/monsters/act1.json';
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
import { canonicalSkillIdFromData } from '@/engine/skills/dataCatalog';
import { canonicalJson, fingerprintEntries } from './fixture';

/** Closed unearned experiment, deliberately separate from FreshFixture v1. */
export const MAGE_SCREEN_RECIPE = {
  version: 'mage-direct-bolt-screen-v1', origin: 'unearned-imported-build',
  classId: 'necromancer', level: 30, mageRank: 6, skeletonRank: 1, masteryRank: 0,
  equipment: 'none', mercs: 'none', preloadedSummons: 'none',
  areaId: 'areas/act1-blood-moor', waveIndex: 0, mode: 'manual', challengeOrdinal: 0,
  idleEliteMisses: 0, planGenerationSeed: 7, enemyGenerationSeed: 991, combatSeeds: [7, 991]
} as const;
export type MageScreenRecipe = typeof MAGE_SCREEN_RECIPE;
const validate = new Ajv({ strict: true }).compile<MageScreenRecipe>({ const: MAGE_SCREEN_RECIPE });

/** Accept only the closed reviewed recipe; no injected ranks, equipment or combat stats. */
export function parseMageScreenRecipe(input: unknown): MageScreenRecipe {
  if (!validate(input)) throw new Error('Invalid Mage screen recipe');
  return structuredClone(input);
}

/** Hash finite JSON after normal JSON omission rules, including every remaining field. */
export function mageJsonHash(value: unknown): string {
  return fingerprintEntries([{ path: 'mage-screen.json',
    bytes: new TextEncoder().encode(canonicalJson(JSON.parse(JSON.stringify(value)) as unknown)) }]);
}

export interface MageBalanceFixture {
  readonly recipe: MageScreenRecipe;
  readonly snapshot: CombatSnapshot;
  readonly allocation: { readonly skillPointsSpent: number; readonly skillPointsUnspent: number; readonly statPointsUnspent: number };
  readonly hash: string;
}

/** Freeze one ordinary L30-versus-early-Blood-Moor encounter; neither earned nor on-zone. */
export function buildMageBalanceFixture(input: unknown = MAGE_SCREEN_RECIPE): MageBalanceFixture {
  const recipe = parseMageScreenRecipe(input);
  let ranks: SkillRanks = {};
  for (const [id, rank] of [['skills-necromancer-raise-skeleton', recipe.skeletonRank],
    ['skills-necromancer-raise-skeletal-mage', recipe.mageRank]] as const) {
    const source = skills.find(row => row.id === id);
    if (!source) throw new Error('Missing exact authored Mage allocation source');
    const prerequisites = (source.prerequisites ?? []).map(skillId => ({ skillId: canonicalSkillIdFromData(skillId), rank: 1 }));
    const node = { id: canonicalSkillIdFromData(source.id), minLevel: source.requiredLevel ?? source.minLevel,
      maxRank: source.maxLevel, prerequisites };
    for (let point = 0; point < rank; point++) {
      if (prerequisites.some(prerequisite => (ranks[prerequisite.skillId] ?? 0) < prerequisite.rank)) {
        throw new Error('Missing authored Mage allocation prerequisite');
      }
      ranks = allocatePoint(node, ranks, recipe.level);
    }
  }
  const core = { ...classData.startingStats };
  const stats = deriveStats(core, recipe.level);
  const hero: CombatUnit = {
    id: 'player-mage-balance-screen', name: 'Unearned Mage balance screen', side: 'player', kind: 'hero',
    level: recipe.level, tier: 'trash', stats, life: stats.lifeMax, mana: stats.manaMax,
    ...composeHeroRecovery({ classId: recipe.classId, level: recipe.level,
      effectiveEnergy: effectiveStatValue(core.energy), skillLevels: ranks }),
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0',
    skillLevels: ranks, skillOrder: ['necromancer.raise_skeletal_mage'], equippedWeapon: {},
    statuses: [], cooldowns: {}, activeBuffIds: [], enraged: false, summonedAdds: false
  };
  const area = (areas as readonly SubAreaDef[]).find(row => row.id === recipe.areaId);
  const fallback = area?.waves?.[0]?.encounters?.[0]?.monsters[0]?.archetypeId;
  if (!area || !fallback) throw new Error('Missing exact authored Blood Moor encounter');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: fallback,
    fallbackLevel: area.areaLevel, seed: recipe.planGenerationSeed, mode: recipe.mode,
    challengeOrdinal: recipe.challengeOrdinal, idleEliteMisses: recipe.idleEliteMisses });
  const wave = plan.waves[recipe.waveIndex];
  if (!wave || wave.waveTier !== 'trash' || wave.spawns.some(spawn => spawn.tier !== 'trash')) {
    throw new Error('Mage screen requires its authored ordinary first wave');
  }
  const rng = createRng(recipe.enemyGenerationSeed);
  const enemyTeam = wave.spawns.map(spawn => {
    const def = (monsters as unknown as readonly MonsterDef[]).find(row => row.id === spawn.archetypeId);
    if (!def) throw new Error(`Missing exact Mage screen monster: ${spawn.archetypeId}`);
    return buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, rng, index: spawn.index });
  });
  const snapshot: CombatSnapshot = { seed: recipe.combatSeeds[0], act: 1, playerTeam: [hero], enemyTeam };
  const allocation = { skillPointsSpent: pointsSpent(ranks),
    skillPointsUnspent: totalSkillPoints(recipe.level) - pointsSpent(ranks), statPointsUnspent: totalStatPoints(recipe.level) };
  const value = { recipe, snapshot, allocation };
  return { ...value, hash: mageJsonHash(value) };
}

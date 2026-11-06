import { beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import { buildEnemiesForWave } from './combatHelpers';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([
  ['areas/act1-catacombs', 90, 1200, 40, 'monster-poison-cloud'],
  ['areas/act2-tomb-of-tal-rasha', 350, 25600, 280, 'monster-charge'],
  ['areas/act3-durance-of-hate', 300, 33600, 360, ['monster-frost-nova', 'monster-lightning', 'monster-mephisto-poison-cloud']],
  ['areas/act4-chaos-sanctuary', 420, 44800, 460, ['monster-diablo-fire-breath', 'monster-diablo-lightning', 'monster-bone-prison', 'monster-charge']],
  ['areas/act5-throne-of-destruction', 520, 57600, 560, 'monster-tentacles']
] as const)('builds actual %s chapter overrides through the production wave consumer', (id, attack, life, defense, skill) => {
  const area = subAreas.find(row => row.id === id); if (!area) throw new Error('Missing native chapter');
  const plan = resolveChallengeWavePlan({ subArea: area, seed: 7, challengeOrdinal: 0,
    fallbackArchetypeId: area.chapterBoss?.archetypeId ?? '', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native chapter wave');
  const before = structuredClone(wave), enemies = buildEnemiesForWave(wave, 7);
  expect(enemies).toHaveLength(1);
  const enemy = enemies[0]; if (!enemy) throw new Error('Missing built chapter');
  expect(enemy).toMatchObject({ monsterArchetypeId: area.chapterBoss?.archetypeId,
    tier: 'chapter-boss', life, skillOrder: typeof skill === 'string' ? [skill] : skill,
    stats: { lifeMax: life, attack, defense } });
  expect(enemy.attackRange).toEqual([attack, attack]);
  expect(buildEnemiesForWave(wave, 7)).toEqual(enemies);
  expect(wave).toEqual(before);
});

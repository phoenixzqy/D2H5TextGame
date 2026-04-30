import { describe, expect, it } from 'vitest';
import defaultEliteConfigJson from '../../data/elite/elite-config.json';
import { createRng } from '../rng';
import type { EliteConfigDef } from '../types/elite';
import type { MonsterDef } from '../types/monsters';
import type { SubAreaDef } from '../types/maps';
import { buildMonsterUnit } from './monster-factory';
import { resolveWavePlan } from './sub-area-run';

const ELITE_CONFIG = defaultEliteConfigJson as EliteConfigDef;

const ANDARIEL: MonsterDef = {
  id: 'monsters/act1.andariel',
  name: 'Andariel',
  life: [100, 100],
  lifeGrowth: [0, 0],
  skills: ['monster-strong-melee'],
  attackSpeed: 100,
  defense: 20,
  baseExperience: 1000,
  canBeElite: false,
  canBeBoss: true
};

const CHAPTER_AREA: SubAreaDef = {
  id: 'areas/act1-catacombs',
  name: 'Catacombs',
  actId: 'acts/act1',
  areaLevel: 14,
  hasBoss: true,
  lootTable: 'loot/trash-act1',
  chapterBoss: {
    archetypeId: 'monsters/act1.andariel',
    hp: 2200,
    atk: 150,
    def: 200,
    skills: ['monster-poison-cloud'],
    dropTable: 'loot/act1-boss'
  },
  waves: [
    {
      id: 'w1',
      type: 'trash',
      encounters: [
        {
          id: 'e1',
          level: 14,
          monsters: [{ archetypeId: 'monsters/act1.fallen', count: 3 }]
        }
      ]
    },
    {
      id: 'w2',
      type: 'boss',
      lootTable: 'loot/mini-act1',
      encounters: [
        {
          id: 'e2',
          level: 14,
          monsters: [{ archetypeId: 'monsters/act1.fallen', count: 1, boss: true }]
        }
      ]
    }
  ]
};

describe('chapter boss wave planning', () => {
  it('replaces the final wave with a single chapter boss and boss intro cue', () => {
    const plan = resolveWavePlan(CHAPTER_AREA, 'monsters/act1.fallen', CHAPTER_AREA.areaLevel, 123);
    const finalWave = plan.waves[plan.waves.length - 1];

    expect(finalWave?.id).toBe('areas/act1-catacombs-chapter-boss');
    expect(finalWave?.waveTier).toBe('boss');
    expect(finalWave?.spawns).toHaveLength(1);
    expect(finalWave?.spawns[0]?.tier).toBe('chapter-boss');
    expect(finalWave?.spawns[0]?.archetypeId).toBe('monsters/act1.andariel');
    expect(finalWave?.bossIntro?.bossArchetypeId).toBe('monsters/act1.andariel');
  });

  it('uses the chapter-boss drop table on the replacement wave', () => {
    const plan = resolveWavePlan(CHAPTER_AREA, 'monsters/act1.fallen', CHAPTER_AREA.areaLevel, 123);
    expect(plan.waves[plan.waves.length - 1]?.lootTable).toBe('loot/act1-boss');
  });

  it('builds chapter bosses with configured HP multiplier and signature skill', () => {
    const plan = resolveWavePlan(CHAPTER_AREA, 'monsters/act1.fallen', CHAPTER_AREA.areaLevel, 123);
    const spawn = plan.waves[plan.waves.length - 1]?.spawns[0];
    expect(spawn?.chapterBoss).toBeDefined();
    if (!spawn?.chapterBoss) throw new Error('missing chapter boss payload');

    const unit = buildMonsterUnit({
      def: ANDARIEL,
      level: spawn.level,
      tier: spawn.tier,
      rng: createRng(1),
      skillOrderOverride: spawn.chapterBoss.skills,
      statOverrides: {
        lifeMax: spawn.chapterBoss.hp * ELITE_CONFIG.chapterBossHpMultiplier,
        attack: spawn.chapterBoss.atk,
        defense: spawn.chapterBoss.def
      }
    });

    expect(unit.stats.lifeMax).toBe(17_600);
    expect(unit.life).toBe(17_600);
    expect(unit.stats.attack).toBe(150);
    expect(unit.stats.defense).toBe(200);
    expect(unit.skillOrder).toEqual(['monster-poison-cloud']);
  });
});

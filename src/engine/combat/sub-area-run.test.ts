/**
 * Tests for sub-area-run wave plan resolution.
 */
import { describe, it, expect } from 'vitest';
import type { SubAreaDef } from '../types/maps';
import {
  resolveWavePlan,
  synthDefaultPlan,
  DEFAULT_FALLBACK_PLAN
} from './sub-area-run';

const BLOOD_MOOR: SubAreaDef = {
  id: 'areas/act1-blood-moor',
  name: 'Blood Moor',
  actId: 'acts/act1',
  areaLevel: 2,
  hasBoss: false,
  lootTable: 'loot/trash-act1',
  waves: [
    {
      id: 'w1',
      type: 'trash',
      encounters: [
        {
          id: 'e1',
          level: 2,
          monsters: [
            { archetypeId: 'monsters/act1.fallen', count: 3 },
            { archetypeId: 'monsters/act1.quill-rat', count: 1 }
          ]
        }
      ]
    },
    {
      id: 'w2',
      type: 'trash',
      encounters: [
        {
          id: 'e2',
          level: 2,
          monsters: [{ archetypeId: 'monsters/act1.fallen', count: 2 }]
        }
      ]
    }
  ]
};

const DEN_OF_EVIL: SubAreaDef = {
  id: 'areas/act1-den-of-evil',
  name: 'Den of Evil',
  actId: 'acts/act1',
  areaLevel: 3,
  hasBoss: true,
  lootTable: 'loot/trash-act1',
  bossEncounter: {
    id: 'boss',
    level: 4,
    monsters: [{ archetypeId: 'monsters/act1.carver', count: 1, boss: true }]
  },
  waves: [
    {
      id: 'w1',
      type: 'trash',
      encounters: [
        { id: 'e1', level: 3, monsters: [{ archetypeId: 'monsters/act1.fallen', count: 4 }] }
      ]
    },
    {
      id: 'w2',
      type: 'elite',
      encounters: [
        {
          id: 'e2',
          level: 4,
          monsters: [{ archetypeId: 'monsters/act1.dark-stalker', count: 2, elite: true }]
        }
      ]
    },
    {
      id: 'w3',
      type: 'boss',
      lootTable: 'loot/mini-act1',
      encounters: [
        {
          id: 'e3',
          level: 4,
          monsters: [{ archetypeId: 'monsters/act1.carver', count: 1, boss: true }]
        }
      ]
    }
  ]
};

describe('resolveWavePlan', () => {
  it('honors JSON wave order and flags', () => {
    const plan = resolveWavePlan(BLOOD_MOOR, 'monsters/act1.fallen', 1);
    expect(plan.subAreaId).toBe('areas/act1-blood-moor');
    expect(plan.defaultLootTable).toBe('loot/trash-act1');
    expect(plan.waves).toHaveLength(2);
    const w1 = plan.waves[0];
    expect(w1).toBeDefined();
    expect(w1?.spawns).toHaveLength(4); // 3 fallen + 1 quill-rat
    // All trash tier in w1.
    expect(w1?.spawns.every((s) => s.tier === 'trash')).toBe(true);
  });

  it('indexes per-archetype within a wave for stable naming', () => {
    const plan = resolveWavePlan(BLOOD_MOOR, 'monsters/act1.fallen', 1);
    const w1 = plan.waves[0];
    const fallenIdxs = w1?.spawns
      .filter((s) => s.archetypeId === 'monsters/act1.fallen')
      .map((s) => s.index);
    expect(fallenIdxs).toEqual([0, 1, 2]);
    const quillIdxs = w1?.spawns
      .filter((s) => s.archetypeId === 'monsters/act1.quill-rat')
      .map((s) => s.index);
    expect(quillIdxs).toEqual([0]);
  });

  it('preserves elite/boss flags on encounters and yields a 3-stage plan', () => {
    const plan = resolveWavePlan(DEN_OF_EVIL, 'monsters/act1.fallen', 3);
    expect(plan.waves).toHaveLength(3); // trash → elite → boss

    const tiers = plan.waves.map((w) => w.waveTier);
    expect(tiers).toEqual(['trash', 'elite', 'boss']);

    const elite = plan.waves[1];
    expect(elite?.spawns.every((s) => s.tier === 'elite')).toBe(true);

    const boss = plan.waves[2];
    expect(boss?.spawns).toHaveLength(1);
    expect(boss?.spawns[0]?.tier).toBe('boss');
    expect(boss?.lootTable).toBe('loot/mini-act1');
  });

  it('appends bossEncounter as a final wave when last wave is not boss', () => {
    const noFinalBoss: SubAreaDef = {
      ...DEN_OF_EVIL,
      waves: DEN_OF_EVIL.waves.slice(0, 2) // trash + elite, no boss wave
    };
    const plan = resolveWavePlan(noFinalBoss, 'monsters/act1.fallen', 3);
    expect(plan.waves).toHaveLength(3);
    expect(plan.waves[2]?.waveTier).toBe('boss');
    expect(plan.waves[2]?.spawns[0]?.archetypeId).toBe('monsters/act1.carver');
  });

  it('falls back to a synthetic 4-wave plan when there are no waves', () => {
    const empty: SubAreaDef = {
      ...BLOOD_MOOR,
      id: 'areas/empty',
      waves: []
    };
    const plan = resolveWavePlan(empty, 'monsters/act1.fallen', 1);
    expect(plan.waves).toHaveLength(DEFAULT_FALLBACK_PLAN.length);
    const tiers = plan.waves.map((w) => w.waveTier);
    expect(tiers).toEqual(DEFAULT_FALLBACK_PLAN.map((p) => p.tier));
    // Last wave is the boss singleton.
    const last = plan.waves[plan.waves.length - 1];
    expect(last?.spawns).toHaveLength(1);
    expect(last?.spawns[0]?.tier).toBe('boss');
  });

  it('skips waves whose encounters resolve to zero spawns', () => {
    const withShrine: SubAreaDef = {
      ...BLOOD_MOOR,
      waves: [
        ...BLOOD_MOOR.waves,
        { id: 'shrine', type: 'shrine' } // no encounters → must be skipped
      ]
    };
    const plan = resolveWavePlan(withShrine, 'monsters/act1.fallen', 1);
    expect(plan.waves).toHaveLength(2);
  });

  it('synthDefaultPlan emits the documented 3-trash → elite → boss sequence', () => {
    const plan = synthDefaultPlan(
      { id: 'areas/x', lootTable: 'loot/trash-act1', areaLevel: 1 },
      'monsters/act1.fallen',
      1
    );
    expect(plan.waves.map((w) => w.waveTier)).toEqual([
      'trash',
      'trash',
      'elite',
      'boss'
    ]);
  });
});

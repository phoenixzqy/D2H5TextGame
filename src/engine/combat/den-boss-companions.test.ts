import { describe, expect, it } from 'vitest';
import areas from '../../data/maps/sub-areas/act1.json';
import monsters from '../../data/monsters/act1.json';
import { createRng } from '../rng';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan } from './sub-area-run';

describe('Den authored boss companions', () => {
  it.each(['manual', 'idle'] as const)('keeps one boss and two ordinary Carvers in %s', mode => {
    const subArea = (areas as SubAreaDef[]).find(area => area.id === 'areas/act1-den-of-evil');
    const def = (monsters as unknown as MonsterDef[]).find(monster => monster.id === 'monsters/act1.carver');
    if (!subArea || !def) throw new Error('Missing native Den fixtures');
    const input = structuredClone(subArea);
    const plan = resolveChallengeWavePlan({ subArea, mode, seed: 2494876480,
      challengeOrdinal: 40, fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6 });
    const boss = plan.waves.at(-1);
    expect(boss?.waveTier).toBe('boss');
    expect(boss?.lootTable).toBe('loot/mini-act1');
    expect(boss?.spawns.map(spawn => [spawn.archetypeId, spawn.tier, spawn.index, spawn.level]))
      .toEqual([
        ['monsters/act1.carver', 'boss', 0, 7],
        ['monsters/act1.carver', 'trash', 1, 7],
        ['monsters/act1.carver', 'trash', 2, 7]
      ]);
    const rng = createRng(3966315908);
    const units = boss?.spawns.map(spawn => buildMonsterUnit({ def, tier: spawn.tier,
      level: spawn.level, index: spawn.index, rng }));
    expect(units?.map(unit => [unit.stats.attack, unit.stats.critDamage]))
      .toEqual([[104, 1.75], [65, 1.5], [65, 1.5]]);
    expect(subArea).toEqual(input);
  });
});

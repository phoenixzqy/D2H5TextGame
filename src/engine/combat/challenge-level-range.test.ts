import { describe, expect, it } from 'vitest';
import act1 from '../../data/maps/sub-areas/act1.json';
import act2 from '../../data/maps/sub-areas/act2.json';
import act3 from '../../data/maps/sub-areas/act3.json';
import act4 from '../../data/maps/sub-areas/act4.json';
import act5 from '../../data/maps/sub-areas/act5.json';
import type { Encounter, SubAreaDef } from '../types/maps';
import { challengeEnemyLevelRange, resolveChallengeWavePlan } from './sub-area-run';

const areas: readonly SubAreaDef[] = [...act1, ...act2, ...act3, ...act4, ...act5] as SubAreaDef[];
const encounter = (id: string, level: number, monsters: Encounter['monsters']): Encounter => ({ id, level, monsters });
function area(encounters: readonly Encounter[], rare = false): SubAreaDef {
  return { id: 'areas/act2-projection', name: 'projection', actId: 'acts/act2', areaLevel: 10,
    hasBoss: false, lootTable: 'unused', waves: [{ id: 'w1', type: 'trash', encounters }],
    challenge: { monsterCount: { min: 8, max: 8 }, rotation: ['trash'], manualFinalEliteWaves: rare ? 1 : 0 } };
}
function requiredArea(id: string): SubAreaDef {
  const found = areas.find(row => row.id === id);
  if (!found) throw new Error(`Missing canonical area: ${id}`);
  return found;
}

describe('whole-challenge enemy level range (BUG-603)', () => {
  it('includes later waves, difficulty bonuses and the act boss', () => {
    expect(challengeEnemyLevelRange(requiredArea('areas/act2-tomb-of-tal-rasha'))).toEqual({ min: 27, max: 32 });
    expect(challengeEnemyLevelRange(requiredArea('areas/act2-lost-city'))).toEqual({ min: 22, max: 26 });
  });

  it.each(areas)('covers native manual/idle count and seed boundaries: $id', subArea => {
    const range = challengeEnemyLevelRange(subArea);
    const levels = new Set<number>();
    for (const seed of [0, 7, 0xffffffff]) for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      for (const mode of ['manual', 'idle'] as const) {
        const plan = resolveChallengeWavePlan({ subArea, seed, challengeOrdinal, mode,
          fallbackArchetypeId: 'projection', fallbackLevel: subArea.areaLevel });
        for (const wave of plan.waves) for (const spawn of wave.spawns) {
          expect(spawn.level).toBeGreaterThanOrEqual(range.min);
          expect(spawn.level).toBeLessThanOrEqual(range.max);
          levels.add(spawn.level);
        }
      }
    }
    expect(Math.min(...levels)).toBe(range.min);
    expect(Math.max(...levels)).toBe(range.max);
  });

  it('includes a later level hidden by a high random count of the first source', () => {
    const subArea = area([
      encounter('low', 10, [{ archetypeId: 'low', countMin: 1, countMax: 20 }]),
      encounter('high', 50, [{ archetypeId: 'high', count: 1 }])
    ]);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 30 });
  });

  it.each([8, 20])('excludes sources beyond the challenge/global cap %i', count => {
    const subArea = area([
      encounter('low', 10, [{ archetypeId: 'low', count }]),
      encounter('unreachable', 50, [{ archetypeId: 'high', count: 1 }])
    ]);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 10 });
  });

  it('includes a rare leader pulled from beyond the fitted prefix', () => {
    const subArea = area([
      encounter('low', 10, [{ archetypeId: 'boss', count: 10, boss: true }]),
      encounter('leader', 50, [{ archetypeId: 'high', count: 1 }])
    ], true);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 30 });
  });

  it('includes the first ineligible source when a larger count can retain its second body', () => {
    const subArea = area([
      encounter('high', 50, [{ archetypeId: 'boss', countMin: 1, countMax: 2, boss: true }]),
      encounter('leader', 10, [{ archetypeId: 'low', count: 19 }])
    ], true);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 30 });
  });

  it('includes the first source when larger later counts can cap away the eligible leader', () => {
    const subArea = area([
      encounter('high', 50, [{ archetypeId: 'boss', count: 1, boss: true }]),
      encounter('low', 10, [{ archetypeId: 'other-boss', countMin: 8, countMax: 20, boss: true }]),
      encounter('leader', 10, [{ archetypeId: 'leader', count: 1 }])
    ], true);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 30 });
  });

  it('excludes a fixed first body permanently replaced by the rare leader', () => {
    const subArea = area([
      encounter('unreachable', 50, [{ archetypeId: 'boss', count: 1, boss: true }]),
      encounter('leader', 10, [{ archetypeId: 'low', count: 19 }])
    ], true);
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 10, max: 10 });
  });

  it('includes authored boss waves and the explicit boss override', () => {
    const base = area([encounter('low', 10, [{ archetypeId: 'low', count: 1 }])]);
    const withBoss: SubAreaDef = { ...base, waves: [...base.waves,
      { id: 'boss-wave', type: 'boss', encounters: [encounter('boss', 50, [{ archetypeId: 'boss', count: 1 }])] }] };
    expect(challengeEnemyLevelRange(withBoss)).toEqual({ min: 10, max: 33 });
    expect(challengeEnemyLevelRange({ ...withBoss,
      bossEncounter: encounter('explicit', 20, [{ archetypeId: 'explicit', count: 1 }]) })).toEqual({ min: 10, max: 18 });
  });

  it('replaces authored bosses with the chapter anchor and excludes optional encounters', () => {
    const subArea: SubAreaDef = { ...area([encounter('low', 10, [{ archetypeId: 'low', count: 1 }])]),
      difficulty: { monsterLevelBonus: 2 },
      bossEncounter: encounter('ignored', 80, [{ archetypeId: 'ignored', count: 1 }]),
      questEncounters: [{ ...encounter('optional', 100, [{ archetypeId: 'optional', count: 1 }]), lootTable: 'unused' }],
      chapterBoss: { archetypeId: 'chapter', hp: 100, atk: 10, def: 10, skills: [], dropTable: 'unused' } };
    expect(challengeEnemyLevelRange(subArea)).toEqual({ min: 12, max: 17 });
  });

  it('matches fallback templates and the empty authored-roster synthetic fallback', () => {
    const base = area([]);
    expect(challengeEnemyLevelRange({ ...base, waves: [] })).toEqual({ min: 10, max: 13 });
    expect(challengeEnemyLevelRange({ ...base, waves: [{ id: 'empty', type: 'trash',
      encounters: [encounter('empty', 10, [])] }] })).toEqual({ min: 10, max: 10 });
  });
});

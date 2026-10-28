import { describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import type { WavePlan } from '../combat/sub-area-run';
import { buildMonsterUnit } from '../combat/monster-factory';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan, monsterLevelForReplay, scaleChapterBossForReplay } from './replay-profile';

const native: MonsterDef = { id: 'test/boss', name: 'Boss', life: [10, 14], lifeGrowth: [2, 4],
  attack: [5, 9], attackGrowth: [1, 3], defense: 6, skills: [], baseExperience: 1,
  canBeElite: false, canBeBoss: true };
const boss = { archetypeId: native.id, hp: 7200, atk: 520, def: 560, skills: ['boss-skill'], dropTable: 'boss-loot' };
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing replay profile fixture');
  return value;
}

describe('level-only replay profiles', () => {
  it.each([1, 14, 82, 90, 102])('adds the authored offset after resolved Normal level %i without the hero cap', level => {
    expect(monsterLevelForReplay(level, 'normal')).toBe(level);
    expect(monsterLevelForReplay(level, 'nightmare')).toBe(level + 20);
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])('refuses invalid or overflowing resolved level %s', level => {
    expect(() => monsterLevelForReplay(level, 'nightmare')).toThrow();
  });
  it('refuses foreign profiles at runtime', () => {
    expect(() => monsterLevelForReplay(82, 'foreign' as 'nightmare')).toThrow();
  });
  it('preserves exact unrounded Normal chapter anchors', () => {
    const fractional = { ...boss, hp: 7.25, atk: 5.75, def: 3.125 };
    expect(scaleChapterBossForReplay(fractional, native, 82, 'normal')).toEqual(fractional);
  });
  it('uses unrounded native midpoint growth, without tier multipliers or RNG', () => {
    expect(scaleChapterBossForReplay(boss, native, 82, 'nightmare')).toEqual({ ...boss,
      hp: Math.round(7200 * (12 + 101 * 3) / (12 + 81 * 3)),
      atk: Math.round(520 * (7 + 101 * 2) / (7 + 81 * 2)),
      def: Math.round(560 * (6 + 101 * 1.5) / (6 + 81 * 1.5)) });
  });
  it('uses the actual factory attack/defense fallbacks when absent in an archetype', () => {
    const { attack: _attack, attackGrowth: _growth, defense: _defense, ...fallback } = native;
    const scaled = scaleChapterBossForReplay(boss, fallback, 82, 'nightmare');
    expect(scaled.atk).toBe(Math.round(520 * (32 + 101 * 5) / (32 + 81 * 5)));
    expect(scaled.def).toBe(Math.round(560 * (4 + 101 * 1.5) / (4 + 81 * 1.5)));
  });
  it.each([
    { ...native, life: [0, 0] as const, lifeGrowth: [0, 0] as const },
    { ...native, defense: -200 }, { ...native, lifeGrowth: [Infinity, Infinity] as const }
  ])('refuses invalid native anchors before a plan can publish', def => {
    expect(() => scaleChapterBossForReplay(boss, def, 82, 'nightmare')).toThrow();
  });
  it('retains skills, resistances, magic resistance and loot while applying the HP factor once at construction', () => {
    const def = { ...native, resistances: { fire: 30 }, magicResist: 7, magicResistGrowth: 0.5 };
    const scaled = scaleChapterBossForReplay({ ...boss, magicResist: 17 }, def, 82, 'nightmare');
    const unit = buildMonsterUnit({ def, level: 102, tier: 'chapter-boss', rng: createRng(11),
      skillOrderOverride: scaled.skills,
      statOverrides: { lifeMax: scaled.hp * 8, attack: scaled.atk, defense: scaled.def,
        ...(scaled.magicResist === undefined ? {} : { magicResist: scaled.magicResist }) } });
    expect(unit.stats.lifeMax).toBe(scaled.hp * 8);
    expect(unit.stats.resistances.fire).toBe(30);
    expect(unit.stats.magicResist).toBe(17);
    expect(unit.skillOrder).toEqual(boss.skills);
    expect(scaled.dropTable).toBe(boss.dropTable);
  });
  it('projects every canonical map and preserves Normal encounter/source/loot identity', () => {
    const index = new Map(monsters.map(def => [def.id, def]));
    expect(subAreas).toHaveLength(29);
    for (const area of subAreas) {
      const normal = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: required(monsters[0]).id,
        fallbackLevel: area.areaLevel, seed: 39, challengeOrdinal: 0 });
      const before = structuredClone(normal);
      const replay = applyReplayProfileToPlan(normal, 'nightmare', index);
      expect(normal).toEqual(before);
      expect(replay.replayProfileId).toBe('nightmare');
      expect(replay.waves).toHaveLength(normal.waves.length);
      replay.waves.forEach((wave, i) => {
        const original = required(normal.waves[i]);
        expect({ ...wave, spawns: [] }).toEqual({ ...original, spawns: [] });
        wave.spawns.forEach((spawn, j) => {
          const old = required(original.spawns[j]);
          expect(spawn.level).toBe(old.level + 20);
          expect({ ...spawn, level: 0, chapterBoss: undefined }).toEqual({ ...old, level: 0, chapterBoss: undefined });
          if (spawn.chapterBoss) {
            expect(spawn.chapterBoss.hp).toBeGreaterThan(required(old.chapterBoss).hp);
            expect(spawn.chapterBoss.atk).toBeGreaterThan(required(old.chapterBoss).atk);
            expect(spawn.chapterBoss.def).toBeGreaterThan(required(old.chapterBoss).def);
          }
        });
      });
    }
  });
  it('binds an immutable profile without freezing caller-owned plan data', () => {
    const plan: WavePlan = { subAreaId: 'area', defaultLootTable: 'loot', waves: [{ id: 'w1', waveTier: 'trash',
      source: { kind: 'wave', waveId: 'w1', encounterIds: ['e1'] },
      spawns: [{ archetypeId: native.id, level: 82, tier: 'trash', index: 0 }] }] };
    const bound = applyReplayProfileToPlan(plan, 'normal', new Map([[native.id, native]]));
    expect(Object.getOwnPropertyDescriptor(bound, 'replayProfileId')?.writable).toBe(false);
    expect(() => Object.assign(bound, { replayProfileId: 'nightmare' })).toThrow();
    expect(bound.waves).not.toBe(plan.waves);
    expect(Object.isFrozen(plan.waves[0]?.spawns[0])).toBe(false);
    expect(bound.waves).toEqual(plan.waves);
  });
  it('refuses a Nightmare Throne quest projection and missing chapter archetypes', () => {
    const plan: WavePlan = { subAreaId: 'area', defaultLootTable: 'loot', waves: [] };
    expect(() => applyReplayProfileToPlan({ ...plan, questSourceProjection: 'act5-throne' }, 'nightmare', new Map())).toThrow();
    expect(() => applyReplayProfileToPlan({ ...plan, waves: [{ id: 'boss', waveTier: 'boss',
      spawns: [{ archetypeId: native.id, level: 82, tier: 'chapter-boss', index: 0, chapterBoss: boss }] }] },
    'nightmare', new Map())).toThrow();
  });
});

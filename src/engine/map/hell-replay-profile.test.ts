/** Constructed planner contracts; no earned progression or pacing evidence. */
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { monsters, subAreas } from '@/data';
import replayDocument from '@/data/maps/replay-profiles.json';
import replaySchema from '@/data/schema/replay-profiles.schema.json';
import { replayProfiles } from '@/data/loaders/replay-profiles';
import { resolveChallengeWavePlan, type WavePlan } from '../combat/sub-area-run';
import { nativeMonsterStats } from '../combat/monster-factory';
import { buildEnemiesForWave } from '@/stores/combatHelpers';
import { applyReplayProfileToPlan, monsterLevelForReplay, scaleChapterBossForReplay } from './replay-profile';

const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing authored Hell contract fixture');
  return value;
}

// ADR-013 and D08's reviewed finite envelope, derived before runtime changes.
const ceilings = new Map([
  ['loot/trash-act1', 58], ['loot/mini-act1', 52], ['loot/act1-boss', 59],
  ['loot/trash-act2', 71], ['loot/mini-act2', 68], ['loot/act2-boss', 72],
  ['loot/trash-act3', 86], ['loot/mini-act3', 83], ['loot/act3-boss', 87],
  ['loot/trash-act4', 101], ['loot/mini-act4', 96], ['loot/act4-boss', 101],
  ['loot/trash-act5', 122], ['loot/mini-act5', 115], ['loot/act5-boss', 122],
  // Planner maximum; the authored goblin table ceiling stays99.
  ['loot/treasure-goblin', 93]
]);

describe('ADR-013 native Hell level-only replay', () => {
  it('authors exactly three finite profiles and rejects foreign or malformed Hell definitions', () => {
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(replaySchema);
    expect(Object.keys(replayProfiles).sort()).toEqual(['hell', 'nightmare', 'normal']);
    expect(Reflect.get(replayProfiles, 'hell')).toEqual({ monsterLevelOffset: 40 });
    expect(validate({ ...replayDocument, hell: { monsterLevelOffset: 40 } })).toBe(true);
    for (const monsterLevelOffset of [0, 20, 39, 41, -40, 40.5]) {
      expect(validate({ ...replayDocument, hell: { monsterLevelOffset } })).toBe(false);
    }
    expect(validate({ ...replayDocument, hell: { monsterLevelOffset: 40, hpMultiplier: 2 } })).toBe(false);
    expect(validate({ normal: replayDocument.normal, nightmare: replayDocument.nightmare })).toBe(false);
    expect(() => monsterLevelForReplay(82, 'foreign-profile' as 'hell')).toThrow('Unknown replay profile');
  });

  it.each([1, 13, 19, 39, 82, 90, 102])('adds40 once after resolved Normal level%i, independently of hero cap90', level => {
    expect(monsterLevelForReplay(level, 'normal')).toBe(level);
    expect(monsterLevelForReplay(level, 'nightmare')).toBe(level + 20);
    expect(monsterLevelForReplay(level, 'hell')).toBe(level + 40);
  });

  it('accepts the last safe Hell level and refuses its one-above overflow', () => {
    expect(monsterLevelForReplay(Number.MAX_SAFE_INTEGER - 40, 'hell')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => monsterLevelForReplay(Number.MAX_SAFE_INTEGER - 39, 'hell')).toThrow('Invalid replay monster level');
  });

  it.each(['manual', 'idle'] as const)('projects all29 real planners and13 count residues within the reviewed Hell ceilings (%s)', mode => {
    expect(subAreas).toHaveLength(29);
    const observed = new Map<string, number>();
    let globalMaximum = 0;
    for (const subArea of subAreas) for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      const normal = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: required(monsters[0]).id,
        fallbackLevel: subArea.areaLevel, seed: 3286157777, challengeOrdinal, mode, idleEliteMisses: 100 });
      const before = structuredClone(normal);
      const hell = applyReplayProfileToPlan(normal, 'hell', monsterIndex);
      expect(normal).toEqual(before);
      expect(hell.replayProfileId).toBe('hell');
      expect(hell.waves).toHaveLength(normal.waves.length);
      hell.waves.forEach((wave, i) => {
        const original = required(normal.waves[i]);
        expect({ ...wave, spawns: [] }).toEqual({ ...original, spawns: [] });
        const tableId = wave.lootTable ?? hell.defaultLootTable;
        wave.spawns.forEach((spawn, j) => {
          const old = required(original.spawns[j]);
          expect(spawn.level).toBe(old.level + 40);
          expect({ ...spawn, level: 0, chapterBoss: undefined }).toEqual({ ...old, level: 0, chapterBoss: undefined });
          expect(spawn.level).toBeLessThanOrEqual(required(ceilings.get(tableId)));
          observed.set(tableId, Math.max(observed.get(tableId) ?? 0, spawn.level));
          globalMaximum = Math.max(globalMaximum, spawn.level);
        });
      });
    }
    expect(globalMaximum).toBe(122);
    expect([...observed.entries()].sort()).toEqual([...ceilings.entries()].sort());
  });

  it('scales actual Baal anchors using native82→122 growth and applies chapter HP factor exactly once', () => {
    const area = required(subAreas.find(row => row.chapterBoss?.dropTable === 'loot/act5-boss'));
    const boss = required(area.chapterBoss), def = required(monsterIndex.get(boss.archetypeId));
    const from = nativeMonsterStats(def, 82), to = nativeMonsterStats(def, 122);
    const scaled = scaleChapterBossForReplay(boss, def, 82, 'hell');
    expect(scaled).toEqual({ ...boss, hp: Math.round(boss.hp * to.life / from.life),
      atk: Math.round(boss.atk * to.attack / from.attack), def: Math.round(boss.def * to.defense / from.defense) });
    const normal = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: def.id,
      fallbackLevel: area.areaLevel, seed: 3286157777, challengeOrdinal: 0, mode: 'manual' });
    const hell = applyReplayProfileToPlan(normal, 'hell', monsterIndex);
    const wave = required(hell.waves.find(row => row.spawns.some(spawn => spawn.chapterBoss)));
    expect(wave.spawns).toHaveLength(1);
    expect(required(wave.spawns[0]).chapterBoss).toEqual(scaled);
    const unit = required(buildEnemiesForWave(wave, 11)[0]);
    expect(unit.level).toBe(122);
    expect(unit.stats.lifeMax).toBe(scaled.hp * 8);
    expect(unit.skillOrder).toEqual(boss.skills);
    expect(scaled.dropTable).toBe(boss.dropTable);
  });

  it('captures immutable Hell identity and refuses non-Normal quest projections', () => {
    const normal: WavePlan = { subAreaId: 'constructed-plan', defaultLootTable: 'loot/act5-boss', waves: [] };
    const hell = applyReplayProfileToPlan(normal, 'hell', monsterIndex);
    expect(Object.getOwnPropertyDescriptor(hell, 'replayProfileId')).toMatchObject({
      value: 'hell', enumerable: true, writable: false, configurable: false });
    expect(() => Object.assign(hell, { replayProfileId: 'normal' })).toThrow();
    expect(normal.replayProfileId).toBeUndefined();
    expect(() => applyReplayProfileToPlan({ ...normal, questSourceProjection: 'act5-throne' }, 'hell', monsterIndex))
      .toThrow('Quest projection requires Normal');
  });
});

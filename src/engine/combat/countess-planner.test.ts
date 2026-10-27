/** Constructed Countess contracts; original preimplementation RED retained in task evidence. */
import { describe, expect, it } from 'vitest';
import act1Areas from '@/data/maps/sub-areas/act1.json';
import type { Encounter, SubAreaDef } from '@/engine/types/maps';
import {
  resolveChallengeWavePlan,
  resolveQuestEncounterPlan,
  resolveWavePlan,
} from '@/engine/combat/sub-area-run';

const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const ARCHETYPE = 'monsters/act1.the-countess';
const TABLE = 'loot/act1-boss';
type QuestEncounter = Encounter & { readonly lootTable: string };
type QuestArea = SubAreaDef & { readonly questEncounters?: readonly QuestEncounter[] };
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Countess planner fixture');
  return value;
}
function encounter(): QuestEncounter {
  return { id: ENCOUNTER, level: 13, lootTable: TABLE,
    monsters: [{ archetypeId: ARCHETYPE, count: 1, boss: true }] };
}
function authoredDarkWood(): QuestArea {
  return structuredClone(required(act1Areas.find(area => area.id === AREA))) as QuestArea;
}
function area(): QuestArea { return { ...authoredDarkWood(), questEncounters: [encounter()] }; }
function selected(subArea: QuestArea = area(), seed = 7, encounterId = ENCOUNTER) {
  return resolveQuestEncounterPlan({ subArea, encounterId, seed });
}
function malformed(patch: Record<string, unknown>): QuestArea {
  return { ...area(), ...patch } as unknown as QuestArea;
}
function malformedEncounter(patch: Record<string, unknown>): QuestArea {
  return malformed({ questEncounters: [{ ...encounter(), ...patch }] });
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

describe('Countess authored quest encounter', () => {
  it('authors exactly one optional level13 boss and the ordinary boss loot table', () => {
    const source = authoredDarkWood();
    const matches = source.questEncounters?.filter(row => row.id === ENCOUNTER);
    expect(matches).toEqual([encounter()]);
    expect(source.actId).toBe('acts/act1');
    expect(source.areaLevel).toBe(9);
    expect(source.hasBoss).toBe(false);
    expect(source.lootTable).toBe('loot/trash-act1');
    expect(source.bossEncounter?.monsters.some(row => row.archetypeId === ARCHETYPE) ?? false).toBe(false);
    expect(source.waves.flatMap(wave => wave.encounters ?? [])
      .flatMap(row => row.monsters).some(row => row.archetypeId === ARCHETYPE)).toBe(false);
  });

  it('selects one exact quest source with ordinary boss tier and no overrides', () => {
    const plan = selected();
    expect(plan.subAreaId).toBe(AREA);
    expect(plan.mode).toBe('manual');
    expect(plan.waves).toHaveLength(1);
    const wave = required(plan.waves[0]);
    expect(wave.source).toEqual({ kind: 'questEncounter', encounterId: ENCOUNTER });
    expect(wave.waveTier).toBe('boss');
    expect(wave.spawns).toEqual([{ archetypeId: ARCHETYPE, encounterId: ENCOUNTER,
      tier: 'boss', level: 13, index: 0 }]);
    expect(wave.lootTable ?? plan.defaultLootTable).toBe(TABLE);
    expect(wave.presentation?.isActBoss).not.toBe(true);
    expect(wave.spawns[0]).not.toHaveProperty('chapterBoss');
    expect(wave.spawns[0]).not.toHaveProperty('eliteAffix');
    expect(plan).not.toHaveProperty('questSourceProjection');
  });

  it('is deterministic and accepts frozen source data without mutation', () => {
    const source = deepFreeze(area()), before = structuredClone(source);
    expect(selected(source, 71)).toEqual(selected(source, 71));
    expect(source).toEqual(before);
  });

  it.each([0, 7, 42, 0x7fffffff])('keeps composition, authored level and source at seed %i', seed => {
    expect(required(selected(area(), seed).waves[0]).spawns).toEqual([
      { archetypeId: ARCHETYPE, encounterId: ENCOUNTER, tier: 'boss', level: 13, index: 0 },
    ]);
  });

  it('bypasses ordinary fitting, forced elites, level scaling and chapter overrides', () => {
    const source: QuestArea = { ...area(), areaLevel: 90,
      difficulty: { finaleBand: 'final', monsterLevelBonus: 20 },
      challenge: { monsterCount: { min: 20, max: 20 }, rotation: ['elite'],
        manualFinalEliteWaves: 9, appendChapterBoss: true },
      chapterBoss: { archetypeId: 'monsters/act1.andariel', hp: 999999, atk: 999999,
        def: 999999, skills: ['monster-strong-melee'], dropTable: 'loot/act5-boss' },
    };
    const wave = required(selected(source).waves[0]);
    expect(wave.spawns).toEqual([{ archetypeId: ARCHETYPE, encounterId: ENCOUNTER,
      tier: 'boss', level: 13, index: 0 }]);
    expect(wave.lootTable ?? selected(source).defaultLootTable).toBe(TABLE);
    expect(wave.presentation?.isActBoss).not.toBe(true);
  });

  it.each(['manual', 'idle'] as const)('leaves ordinary %s challenge plans unchanged', mode => {
    const withQuest = area();
    const { questEncounters: _optional, ...withoutQuest } = withQuest;
    const ordinary = (subArea: SubAreaDef) => resolveChallengeWavePlan({ subArea,
      fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 9,
      seed: 73, challengeOrdinal: 5, mode });
    const before = ordinary(withoutQuest);
    expect(ordinary(withQuest)).toEqual(before);
    expect(before.waves.flatMap(wave => wave.spawns).some(spawn => spawn.archetypeId === ARCHETYPE)).toBe(false);
    expect(before.waves.some(wave => wave.source?.kind === 'questEncounter')).toBe(false);
  });

  it('leaves ordinary authored wave resolution unchanged', () => {
    const withQuest = area();
    const { questEncounters: _optional, ...withoutQuest } = withQuest;
    expect(resolveWavePlan(withQuest, 'monsters/act1.fallen', 9, 73))
      .toEqual(resolveWavePlan(withoutQuest, 'monsters/act1.fallen', 9, 73));
  });

  it.each(['', 'act1-dw-countess-typo', 'act4-pod-izual'])('refuses unknown selection %j', id => {
    expect(() => selected(area(), 7, id)).toThrow();
  });

  it.each([
    ['wrong act', { actId: 'acts/act2' }],
    ['wrong area', { id: 'areas/act1-blood-moor' }],
    ['missing manifest', { questEncounters: undefined }],
    ['empty manifest', { questEncounters: [] }],
    ['duplicate selected identity', { questEncounters: [encounter(), encounter()] }],
    ['different identity', { questEncounters: [{ ...encounter(), id: 'other' }] }],
    ['non-array manifest', { questEncounters: { [ENCOUNTER]: encounter() } }],
  ] as const)('refuses %s instead of constructing a fallback', (_label, patch) => {
    expect(() => selected(malformed(patch))).toThrow();
  });

  it.each([
    ['wrong level', { level: 14 }], ['nonfinite level', { level: NaN }],
    ['wrong loot table', { lootTable: 'loot/countess-runes' }],
    ['missing loot table', { lootTable: undefined }],
    ['empty composition', { monsters: [] }],
    ['companion', { monsters: [...encounter().monsters, { archetypeId: 'monsters/act1.fallen', count: 1 }] }],
    ['multiple Countesses', { monsters: [{ archetypeId: ARCHETYPE, count: 2, boss: true }] }],
    ['different archetype', { monsters: [{ archetypeId: 'monsters/act1.andariel', count: 1, boss: true }] }],
    ['nonboss', { monsters: [{ archetypeId: ARCHETYPE, count: 1 }] }],
    ['elite override', { monsters: [{ archetypeId: ARCHETYPE, count: 1, boss: true, elite: true }] }],
    ['randomized count', { monsters: [{ archetypeId: ARCHETYPE, countMin: 1, countMax: 2, boss: true }] }],
  ] as const)('refuses malformed selected encounter: %s', (_label, patch) => {
    expect(() => selected(malformedEncounter(patch))).toThrow();
  });
});

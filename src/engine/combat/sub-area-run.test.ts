/**
 * Tests for sub-area-run wave plan resolution.
 */
import { describe, it, expect } from 'vitest';
import type { SubAreaDef } from '../types/maps';
import act1Areas from '../../data/maps/sub-areas/act1.json';
import act2Areas from '../../data/maps/sub-areas/act2.json';
import act3Areas from '../../data/maps/sub-areas/act3.json';
import type { WaveSpec } from './sub-area-run';
import {
  resolveWavePlan,
  resolveChallengeWavePlan,
  synthDefaultPlan,
  DEFAULT_FALLBACK_PLAN,
  DEFAULT_ELITE_CONFIG
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

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing expected wave');
  return value;
}

describe('authored encounter provenance', () => {
  const council = required(act3Areas.find(area => area.id === 'areas/act3-travincal')) as SubAreaDef;
  const durance = required(act3Areas.find(area => area.id === 'areas/act3-durance-of-hate')) as SubAreaDef;
  const challenge = (subArea: SubAreaDef, mode: 'manual' | 'idle') => resolveChallengeWavePlan({
    subArea, fallbackArchetypeId: 'monsters/act3.infector', fallbackLevel: 38,
    seed: 7, challengeOrdinal: 0, mode
  });

  it.each(['manual', 'idle'] as const)('%s retains original wave IDs and the exact Council encounter', mode => {
    const plan = challenge(council, mode);
    expect(plan.waves[0]).toMatchObject({
      id: 'areas/act3-travincal-challenge-w1',
      source: { kind: 'wave', waveId: 'w1', encounterIds: ['act3-tv-w1-e1'] }
    });
    expect(plan.waves.at(-1)).toMatchObject({
      source: { kind: 'bossEncounter', encounterId: 'act3-travincal-council' },
      spawns: [0, 1, 2].map(index => ({
        archetypeId: 'monsters/act3.infector', tier: 'boss', index,
        encounterId: 'act3-travincal-council'
      }))
    });
  });

  it('retains a legacy authored boss wave separately from the explicit boss encounter', () => {
    expect(resolveWavePlan(council, 'monsters/act3.infector', 38, 7).waves.at(-1)).toMatchObject({
      source: { kind: 'wave', waveId: 'w6', encounterIds: ['act3-tv-w6-e1'] },
      spawns: [0, 1, 2].map(index => ({ encounterId: 'act3-tv-w6-e1', index }))
    });
  });

  it.each(['manual', 'idle'] as const)('%s attributes a chapter override to the canonical chapter definition', mode => {
    expect(challenge(durance, mode).waves.at(-1)).toMatchObject({
      source: { kind: 'chapterBoss', archetypeId: 'monsters/act3.mephisto' },
      spawns: [{ archetypeId: 'monsters/act3.mephisto', tier: 'chapter-boss' }]
    });
    expect(challenge(durance, mode).waves.at(-1)?.spawns[0]).not.toHaveProperty('encounterId');
  });

  it('keeps two encounter identities for the same archetype through fitting and forced elites', () => {
    const subArea: SubAreaDef = { ...BLOOD_MOOR, waves: [{ id: 'original-w9', type: 'trash', encounters: [
      { id: 'left', level: 2, monsters: [{ archetypeId: 'monsters/act1.fallen', count: 1 }] },
      { id: 'right', level: 2, monsters: [{ archetypeId: 'monsters/act1.fallen', count: 1 }] }
    ] }] };
    const wave = required(challenge(subArea, 'manual').waves[0]);
    expect(wave).toMatchObject({ source: {
      kind: 'wave', waveId: 'original-w9', encounterIds: ['left', 'right']
    } });
    expect(wave.spawns).toHaveLength(8);
    expect(wave.spawns.map(spawn => ({ encounterId: spawn.encounterId, index: spawn.index })))
      .toEqual(Array.from({ length: 8 }, (_, i) => ({
      encounterId: i % 2 === 0 ? 'left' : 'right', index: i
      })));
  });

  it('gives synthetic waves and fallback templates no authored proof', () => {
    const fallback: SubAreaDef = { ...BLOOD_MOOR, waves: [] };
    for (const plan of [synthDefaultPlan(fallback, 'monsters/act1.fallen', 2),
      challenge(fallback, 'manual'), resolveWavePlan(fallback, 'monsters/act1.fallen', 2)]) {
      for (const wave of plan.waves) expect(wave).not.toHaveProperty('source');
    }
  });
});

it('retains canonical manual Duriel level32 and ordinary boss treasure class', () => {
  const subArea = required(act2Areas.find(area => area.id === 'areas/act2-tomb-of-tal-rasha')) as SubAreaDef;
  const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: 'monsters/act2.mummy',
    fallbackLevel: 25, seed: 7, challengeOrdinal: 0, mode: 'manual' });
  const boss = required(plan.waves.at(-1));
  expect(boss.lootTable).toBe('loot/act2-boss');
  expect(boss.spawns).toEqual([expect.objectContaining({
    archetypeId: 'monsters/act2.duriel', tier: 'chapter-boss', level: 32
  })]);
});

describe('Radament authored encounter and treasure class', () => {
  const farOasis = act2Areas.find((area) => area.id === 'areas/act2-far-oasis') as SubAreaDef;
  const challenge = (subArea: SubAreaDef, mode: 'manual' | 'idle' = 'manual') =>
    resolveChallengeWavePlan({ subArea, fallbackArchetypeId: 'monsters/act2.mummy',
      fallbackLevel: 18, seed: 123, challengeOrdinal: 0, mode });

  it.each(['manual', 'idle'] as const)('%s spawns the actual catalog Radament', (mode) => {
    const boss = required(challenge(farOasis, mode).waves.at(-1));
    expect(boss.spawns.filter((spawn) => spawn.tier === 'boss').map((spawn) => spawn.archetypeId))
      .toEqual(['monsters/act2.radament']);
  });

  it.each(['manual', 'idle'] as const)('%s keeps the four mummy companions ordinary', (mode) => {
    const boss = required(challenge(farOasis, mode).waves.at(-1));
    expect(boss.spawns.filter((spawn) => spawn.archetypeId === 'monsters/act2.mummy')
      .map((spawn) => spawn.tier)).toEqual(['trash', 'trash', 'trash', 'trash']);
    expect(boss.spawns).toHaveLength(5);
  });

  it.each(['manual', 'idle'] as const)('%s retains the authored mini-boss treasure class', (mode) => {
    const plan = challenge(farOasis, mode);
    expect(plan.waves.at(-1)?.lootTable).toBe('loot/mini-act2');
    expect(plan.defaultLootTable).toBe('loot/trash-act2');
  });

  it('also uses catalog Radament in the legacy authored wave', () => {
    const boss = required(resolveWavePlan(farOasis, 'monsters/act2.mummy', 18, 123).waves.at(-1));
    expect(boss.spawns.map((spawn) => spawn.archetypeId)).toEqual(['monsters/act2.radament']);
    expect(boss.spawns[0]?.tier).toBe('boss');
    expect(boss.lootTable).toBe('loot/mini-act2');
  });

  it('inherits the sole boss-wave table when legacy resolution appends the explicit encounter', () => {
    const subArea: SubAreaDef = { ...farOasis, waves: farOasis.waves.map((wave) =>
      wave.type === 'boss' ? { ...wave, encounters: [] } : wave) };
    expect(resolveWavePlan(subArea, 'monsters/act2.mummy', 18, 123).waves.at(-1)?.lootTable)
      .toBe('loot/mini-act2');
  });

  it.each(['same', 'different'] as const)('rejects ambiguous %s authored boss tables', (kind) => {
    const subArea: SubAreaDef = { ...farOasis, waves: [
      ...farOasis.waves.map((wave) => wave.type === 'boss' ? { ...wave, encounters: [] } : wave),
      { id: 'second-boss', type: 'boss', lootTable: kind === 'same' ? 'loot/mini-act2' : 'loot/other' }
    ] };
    expect(() => challenge(subArea)).toThrow(/boss.*loot|loot.*boss/i);
    expect(() => resolveWavePlan(subArea, 'monsters/act2.mummy', 18, 123)).toThrow(/boss.*loot|loot.*boss/i);
  });

  it('retains the area fallback when no boss table is authored', () => {
    const subArea: SubAreaDef = { ...farOasis, waves: farOasis.waves.filter((wave) => wave.type !== 'boss') };
    for (const plan of [challenge(subArea), resolveWavePlan(subArea, 'monsters/act2.mummy', 18, 123)]) {
      expect(plan.waves.at(-1)?.lootTable).toBeUndefined();
      expect(plan.defaultLootTable).toBe('loot/trash-act2');
    }
  });

  it('keeps chapter-boss treasure-class authority independent of authored wave tables', () => {
    const subArea: SubAreaDef = { ...farOasis, chapterBoss: {
      archetypeId: 'monsters/act2.duriel', hp: 100, atk: 10, def: 1, skills: [], dropTable: 'loot/act2-boss'
    } };
    for (const plan of [challenge(subArea), resolveWavePlan(subArea, 'monsters/act2.mummy', 18, 123)]) {
      expect(plan.waves.at(-1)?.lootTable).toBe('loot/act2-boss');
      expect(plan.waves.at(-1)?.spawns[0]?.tier).toBe('chapter-boss');
    }
  });

  it('is deterministic without mutating canonical map data', () => {
    const before = structuredClone(farOasis);
    expect(challenge(farOasis)).toEqual(challenge(farOasis));
    expect(farOasis).toEqual(before);
  });

  it('preserves legacy chapter-boss replacement when an explicit append has ambiguous wave tables', () => {
    const subArea: SubAreaDef = { ...farOasis,
      waves: [...farOasis.waves.map((wave) => wave.type === 'boss' ? { ...wave, encounters: [] } : wave),
        { id: 'another-boss', type: 'boss', lootTable: 'loot/other' }],
      chapterBoss: { archetypeId: 'monsters/act2.duriel', hp: 100, atk: 10, def: 1,
        skills: ['monster-weak-melee'], dropTable: 'loot/act2-boss' }
    };
    const boss = required(resolveWavePlan(subArea, 'monsters/act2.mummy', 18, 123).waves.at(-1));
    expect(boss.lootTable).toBe('loot/act2-boss');
    expect(boss.spawns[0]?.tier).toBe('chapter-boss');
  });
});

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

  it('applies area-level scaling while preserving encounter spread', () => {
    const tuned: SubAreaDef = { ...BLOOD_MOOR, areaLevel: 20 };
    const plan = resolveWavePlan(tuned, 'monsters/act1.fallen', 1);
    expect(plan.waves[0]?.spawns[0]?.level).toBe(20);
    expect(plan.waves[1]?.spawns[0]?.level).toBe(20);
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

describe('resolveChallengeWavePlan', () => {
  const THREE_WAVE_CHALLENGE: SubAreaDef = {
    ...BLOOD_MOOR,
    challenge: {
      monsterCount: { min: 8, max: 10 },
      rotation: ['trash', 'trash', 'elite'],
      manualFinalEliteWaves: 2
    },
    waves: [
      ...BLOOD_MOOR.waves,
      {
        id: 'w3',
        type: 'trash',
        encounters: [
          {
            id: 'e3',
            level: 2,
            monsters: [{ archetypeId: 'monsters/act1.quill-rat', count: 1 }]
          }
        ]
      }
    ]
  };

  it('preserves authored wave count and cycles 8-20 monsters per non-boss wave', () => {
    const first = resolveChallengeWavePlan({
      subArea: THREE_WAVE_CHALLENGE,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 2,
      seed: 123,
      challengeOrdinal: 0
    });
    const second = resolveChallengeWavePlan({
      subArea: THREE_WAVE_CHALLENGE,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 2,
      seed: 123,
      challengeOrdinal: 1
    });

    expect(first.waves).toHaveLength(3);
    expect(first.waves.map((w) => w.spawns.length)).toEqual([8, 9, 10]);
    expect(second.waves).toHaveLength(3);
    expect(second.waves.map((w) => w.spawns.length)).toEqual([9, 10, 8]);
  });

  it('forces the final two non-boss waves to elite guards', () => {
    const plan = resolveChallengeWavePlan({
      subArea: THREE_WAVE_CHALLENGE,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 2,
      seed: 123,
      challengeOrdinal: 0
    });
    const penultimate = plan.waves[plan.waves.length - 2];
    const final = plan.waves[plan.waves.length - 1];
    expect(penultimate?.presentation?.isForcedElite).toBe(true);
    expect(final?.presentation?.isForcedElite).toBe(true);
    expect(penultimate?.spawns.map((s) => s.tier)).toEqual([
      'champion', 'champion', 'champion', ...Array<string>(6).fill('trash')
    ]);
    expect(final?.spawns[0]?.tier).toBe('rare-elite');
    expect(final?.spawns.map((s) => s.tier)).toEqual([
      'rare-elite', 'rare-minion', 'rare-minion', 'rare-minion', ...Array<string>(6).fill('trash')
    ]);
    expect(final?.spawns).toHaveLength(10);
  });

  it('appends chapter bosses after the two elite guards on act-final maps', () => {
    const finalMap: SubAreaDef = {
      ...DEN_OF_EVIL,
      chapterBoss: {
        archetypeId: 'monsters/act1.andariel',
        hp: 2200,
        atk: 150,
        def: 200,
        skills: ['monster-poison-cloud'],
        dropTable: 'loot/act1-boss'
      }
    };
    const plan = resolveChallengeWavePlan({
      subArea: finalMap,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 3,
      seed: 123,
      challengeOrdinal: 0
    });
    expect(plan.waves).toHaveLength(3);
    expect(plan.waves[0]?.presentation?.isForcedElite).toBe(true);
    expect(plan.waves[1]?.presentation?.isForcedElite).toBe(true);
    expect(plan.waves[2]?.presentation?.isActBoss).toBe(true);
    expect(plan.waves[2]?.spawns[0]?.tier).toBe('chapter-boss');
  });

  it('preserves an authored boss wave when no bossEncounter field is present', () => {
    const { bossEncounter: _bossEncounter, ...withoutBossEncounter } = DEN_OF_EVIL;
    const authoredBossOnly: SubAreaDef = {
      ...withoutBossEncounter
    };
    const plan = resolveChallengeWavePlan({
      subArea: authoredBossOnly,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 3,
      seed: 123,
      challengeOrdinal: 0
    });

    expect(plan.waves).toHaveLength(3);
    expect(plan.waves[0]?.presentation?.isForcedElite).toBe(true);
    expect(plan.waves[1]?.presentation?.isForcedElite).toBe(true);
    expect(plan.waves[2]?.waveTier).toBe('boss');
    expect(plan.waves[2]?.spawns[0]?.archetypeId).toBe('monsters/act1.carver');
    expect(plan.waves[2]?.lootTable).toBe('loot/mini-act1');
  });

  it('uses a small fallback challenge plan instead of expanding the wave count to 8-20', () => {
    const empty: SubAreaDef = {
      ...BLOOD_MOOR,
      id: 'areas/empty-challenge',
      waves: []
    };
    const plan = resolveChallengeWavePlan({
      subArea: empty,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 2,
      seed: 123,
      challengeOrdinal: 0
    });
    expect(plan.waves).toHaveLength(3);
    expect(plan.waves.every((w) => w.spawns.length >= 8 && w.spawns.length <= 20)).toBe(true);
  });

  it('threads online-idle pity into real combat-loop waves', () => {
    const plan = resolveChallengeWavePlan({
      subArea: THREE_WAVE_CHALLENGE,
      fallbackArchetypeId: 'monsters/act1.fallen',
      fallbackLevel: 2,
      seed: 123,
      challengeOrdinal: 0,
      mode: 'idle',
      idleEliteMisses: 11
    });
    const first = plan.waves[0];
    expect(first?.presentation?.isIdleElite).toBe(true);
    expect(first?.presentation?.idleEliteMissesAfterWave).toBe(0);
    expect(first?.spawns[0]?.tier).toBe('rare-elite');
    expect(first?.spawns).toHaveLength(8);
  });
});

describe('Act I bounded promoted elite groups', () => {
  const args = { fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6, seed: 123, challengeOrdinal: 40 };

  function expectTreasure(wave: WaveSpec | undefined) {
    expect(wave?.spawns).toHaveLength(1);
    expect(wave?.lootTable).toBe('loot/treasure-goblin');
    expect(wave?.source).toEqual({ kind: 'wave', waveId: 'w4', encounterIds: ['act1-cp-w4-e1'] });
    expect(wave?.spawns[0]).toMatchObject({
      archetypeId: 'monsters/act1.fallen', tier: 'rare-elite', level: 9, index: 0
    });
    expect(wave?.spawns[0]?.eliteAffix).toBeDefined();
  }

  function expectCore(wave: WaveSpec | undefined, kind: 'champion' | 'rareElite') {
    expect(wave).toBeDefined();
    const spawns = wave?.spawns ?? [];
    expect(spawns.length).toBeGreaterThanOrEqual(8);
    const tiers = kind === 'champion'
      ? ['champion', 'champion', 'champion']
      : ['rare-elite', 'rare-minion', 'rare-minion', 'rare-minion'];
    expect(spawns.map((s) => s.tier)).toEqual([...tiers, ...Array<string>(spawns.length - tiers.length).fill('trash')]);
    expect(spawns[0]?.eliteAffix).toBeDefined();
    for (const spawn of spawns.slice(1)) expect(spawn).not.toHaveProperty('eliteAffix');
    for (const id of new Set(spawns.map((s) => s.archetypeId))) {
      const members = spawns.filter((s) => s.archetypeId === id);
      expect(members.map((s) => s.index)).toEqual(members.map((_, i) => i));
    }
  }

  it.each(['areas/act1-den-of-evil', 'areas/act1-cold-plains'])('bounds actual %s ordinal40 guards and preserves roster, metadata and boss', (id) => {
    const subArea = (act1Areas as SubAreaDef[]).find((area) => area.id === id);
    if (!subArea) throw new Error(`Missing authored area ${id}`);
    const before = structuredClone(subArea);
    const plan = resolveChallengeWavePlan({ ...args, subArea });
    // Identical later-act source preserves roster and metadata under shared group bounds.
    const control = resolveChallengeWavePlan({ ...args, subArea: { ...subArea, actId: 'acts/act2' } });
    const guards = plan.waves.filter((w) => w.presentation?.isForcedElite);
    expect(guards).toHaveLength(2);
    expectCore(guards[0], 'champion');
    if (id.endsWith('cold-plains')) expectTreasure(guards[1]);
    else expectCore(guards[1], 'rareElite');
    expect({ ...plan, waves: [] }).toEqual({ ...control, waves: [] });
    for (let i = 0; i < plan.waves.length; i++) {
      const wave = plan.waves[i];
      const old = control.waves[i];
      expect({ ...wave, spawns: [] }).toEqual({ ...old, spawns: [] });
      expect(wave?.spawns.map((s) => [s.archetypeId, s.level])).toEqual(old?.spawns.map((s) => [s.archetypeId, s.level]));
      if (!wave?.presentation?.isForcedElite) expect(wave).toEqual(old);
    }
    expect(subArea).toEqual(before);
    if (id.endsWith('cold-plains')) {
      expect(guards[0]?.spawns.map((s) => s.archetypeId.split('.').pop())).toEqual([
        'dark-stalker', 'dark-stalker', 'zombie', 'zombie', 'dark-stalker', 'dark-stalker',
        'zombie', 'zombie', 'dark-stalker', 'dark-stalker', 'zombie'
      ]);
      expectTreasure(guards[1]);
    }
  });

  it.each(Array.from({ length: 13 }, (_, i) => i))('caps both cores throughout the default8–20 cycle ordinal%i', (challengeOrdinal) => {
    const plan = resolveChallengeWavePlan({ ...args, subArea: BLOOD_MOOR, challengeOrdinal });
    expect(plan.waves.map((w) => w.spawns.length)).toEqual([8 + challengeOrdinal, 8 + ((challengeOrdinal + 1) % 13)]);
    expectCore(plan.waves[0], 'champion');
    expectCore(plan.waves[1], 'rareElite');
  });

  it.each([1, 2, 3, 4])('preserves the public minimum8 when authored bounds request%i', (count) => {
    const subArea: SubAreaDef = { ...BLOOD_MOOR, challenge: {
      monsterCount: { min: count, max: count }, rotation: ['trash'], manualFinalEliteWaves: 2
    } };
    const plan = resolveChallengeWavePlan({ ...args, subArea });
    expect(plan.waves.map((w) => w.spawns.length)).toEqual([8, 8]);
    expectCore(plan.waves[0], 'champion');
    expectCore(plan.waves[1], 'rareElite');
  });

  it.each([0, 1, 7, 42, 123, 0xffffffff])('keeps one affix draw and subsequent randomized rosters/boss at seed%i', (seed) => {
    const subArea: SubAreaDef = {
      ...BLOOD_MOOR,
      challenge: { monsterCount: { min: 8, max: 20 }, rotation: ['trash'], manualFinalEliteWaves: 4 },
      waves: Array.from({ length: 4 }, (_, i) => ({
        id: `random-${String(i)}`, type: 'trash', lootTable: `loot/wave-${String(i)}`,
        encounters: [{ id: `enc-${String(i)}`, level: 2, monsters: [
          { archetypeId: 'monsters/act1.fallen', countMin: 1, countMax: 3 },
          { archetypeId: 'monsters/act1.quill-rat', countMin: 1, countMax: 3 }
        ] }]
      })),
      bossEncounter: { id: 'random-boss', level: 4, monsters: [
        { archetypeId: 'monsters/act1.carver', countMin: 1, countMax: 3, boss: true }
      ] }
    };
    const input = structuredClone(subArea);
    const configBefore = structuredClone(DEFAULT_ELITE_CONFIG);
    const plan = resolveChallengeWavePlan({ ...args, subArea, seed, challengeOrdinal: 0 });
    const rng = createRng(seed);
    for (let i = 0; i < 4; i++) {
      const fallen = rng.nextInt(1, 3);
      const quills = rng.nextInt(1, 3);
      const affix = rng.pick(DEFAULT_ELITE_CONFIG.affixes);
      const roster = [...Array<string>(fallen).fill('monsters/act1.fallen'), ...Array<string>(quills).fill('monsters/act1.quill-rat')];
      const wave = plan.waves[i];
      expectCore(wave, i === 3 ? 'rareElite' : 'champion');
      expect(wave?.spawns.map((s) => s.archetypeId)).toEqual(Array.from({ length: 8 + i }, (_, j) => roster[j % roster.length]));
      expect(wave?.spawns.every((s) => s.level === 2 + i)).toBe(true);
      expect(wave?.lootTable).toBe(`loot/wave-${String(i)}`);
      expect(wave?.spawns[0]?.eliteAffix).toEqual(affix.skillId === 'monster-lightning'
        ? { ...affix, skillId: 'monster-act1-lightning-affix' }
        : affix);
    }
    expect(plan.waves[4]?.spawns).toEqual(Array.from({ length: rng.nextInt(1, 3) }, (_, index) => ({
      archetypeId: 'monsters/act1.carver', encounterId: 'random-boss', tier: 'boss', level: 6, index
    })));
    expect(subArea).toEqual(input);
    expect(DEFAULT_ELITE_CONFIG).toEqual(configBefore);
  });

  it.each(['champion', 'hard-pity', 'miss', 'disabled'] as const)('shares bounded groups in idle %s and preserves exact pity transitions', (scenario) => {
    const subArea = (act1Areas as SubAreaDef[]).find((a) => a.id === 'areas/act1-cold-plains');
    if (!subArea) throw new Error('Missing Cold Plains');
    const eliteConfig = { ...DEFAULT_ELITE_CONFIG, idle: {
      ...DEFAULT_ELITE_CONFIG.idle, enabled: scenario !== 'disabled',
      baseEliteChance: scenario === 'champion' ? 1 : 0, pityChanceCap: 1,
      pityStep: 0, championShareOfEliteRoll: 1, rareShareOfEliteRoll: 0
    } };
    const initialMisses = scenario === 'hard-pity' || scenario === 'disabled' ? 11 : 3;
    const input = { ...args, subArea, eliteConfig, mode: 'idle' as const, idleEliteMisses: initialMisses };
    const plan = resolveChallengeWavePlan(input);
    const control = resolveChallengeWavePlan({ ...input, subArea: { ...subArea, actId: 'acts/act2' } });
    expect(plan.waves.map((w) => w.presentation)).toEqual(control.waves.map((w) => w.presentation));
    const misses = scenario === 'champion' ? [0, 0] : scenario === 'hard-pity' ? [0, 1] : [initialMisses + 1, initialMisses + 2];
    expect(plan.waves.map((w) => w.presentation?.idleEliteMissesAfterWave)).toEqual([...misses, undefined, undefined]);
    if (scenario === 'champion' || scenario === 'hard-pity') {
      expect(plan.waves[0]?.presentation?.isIdleElite).toBe(true);
      expectCore(plan.waves[0], scenario === 'champion' ? 'champion' : 'rareElite');
      if (scenario === 'champion') expectCore(plan.waves[1], 'champion');
      else expect(plan.waves[1]).toEqual(control.waves[1]);
    } else {
      expect(plan.waves.slice(0, 2)).toEqual(control.waves.slice(0, 2));
      expect(plan.waves[0]?.presentation).not.toHaveProperty('isIdleElite');
    }
    expectCore(plan.waves[2], 'champion');
    expectTreasure(plan.waves[3]);
  });

  it.each([2, 3, 4, 5])('bounds forced and idle groups and retains rare indices for Act%i', (act) => {
    const subArea: SubAreaDef = { ...BLOOD_MOOR, actId: `acts/act${String(act)}` };
    const forced = resolveChallengeWavePlan({ ...args, subArea });
    expectCore(forced.waves[0], 'champion');
    expect(forced.waves[0]?.spawns).toHaveLength(9);
    expect(forced.waves[1]?.spawns.map((s) => s.tier)).toEqual([
      'rare-elite', 'rare-minion', 'rare-minion', 'rare-minion', ...Array<string>(6).fill('trash')
    ]);
    expect(forced.waves[1]?.spawns.map((s) => s.index)).toEqual(Array.from({ length: 10 }, (_, i) => i));
    expect(forced.waves[1]?.spawns.filter((s) => s.eliteAffix)).toHaveLength(1);
    expect(forced.waves[1]?.spawns[0]?.eliteAffix).toBeDefined();
    const idle = resolveChallengeWavePlan({ ...args, subArea: { ...subArea, challenge: {
      monsterCount: { min: 8, max: 20 }, rotation: ['trash'], manualFinalEliteWaves: 0
    } }, mode: 'idle', idleEliteMisses: 11 });
    expect(idle.waves[0]?.spawns.map((s) => s.tier)).toEqual([
      'rare-elite', 'rare-minion', 'rare-minion', 'rare-minion', ...Array<string>(5).fill('trash')
    ]);
    expect(idle.waves[0]?.spawns.map((s) => s.index)).toEqual(Array.from({ length: 9 }, (_, i) => i));
    expect(idle.waves[0]?.spawns.filter((s) => s.eliteAffix)).toHaveLength(1);
    expect(idle.waves[0]?.spawns[0]?.eliteAffix).toBeDefined();
  });

  it.each(['manual', 'idle'] as const)('preserves unpromoted authored flags on the source core in %s', (mode) => {
    const subArea: SubAreaDef = { ...DEN_OF_EVIL, challenge: {
      monsterCount: { min: 8, max: 20 }, rotation: ['trash'], manualFinalEliteWaves: 0
    } };
    const plan = resolveChallengeWavePlan({ ...args, subArea, mode, eliteConfig: {
      ...DEFAULT_ELITE_CONFIG, idle: { ...DEFAULT_ELITE_CONFIG.idle, enabled: false }
    } });
    expect(plan.waves[0]?.spawns.every((s) => s.tier === 'trash')).toBe(true);
    expect(plan.waves[1]?.spawns.map(s => s.tier)).toEqual([
      'elite', 'elite', ...Array<string>(8).fill('trash')
    ]);
    expect(plan.waves[1]?.spawns.every(s => s.eliteAffix === undefined)).toBe(true);
    expect(plan.waves[2]?.spawns.map((s) => s.tier)).toEqual(['boss']);
  });
});

// ---------------------------------------------------------------------------
// Bug C — randomized spawn counts (3–20 per wave, seeded RNG, schema-aware)
// ---------------------------------------------------------------------------
import { encountersToSpawns, MAX_SPAWNS_PER_WAVE } from './sub-area-run';
import { createRng } from '../rng';

describe('Bug C — encountersToSpawns count randomization', () => {
  it('honors fixed `count` for back-compat (no RNG dependence)', () => {
    const spawns = encountersToSpawns(
      [{ id: 'e', level: 1, monsters: [{ archetypeId: 'A', count: 4 }] }],
      'trash',
      createRng(0)
    );
    expect(spawns).toHaveLength(4);
  });

  it('rolls within [countMin, countMax] inclusive, seed-deterministic', () => {
    const enc = [
      { id: 'e', level: 1, monsters: [{ archetypeId: 'A', countMin: 3, countMax: 8 }] }
    ];
    const a = encountersToSpawns(enc, 'trash', createRng(123));
    const b = encountersToSpawns(enc, 'trash', createRng(123));
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThanOrEqual(3);
    expect(a.length).toBeLessThanOrEqual(8);
  });

  it('defaults to per-tier range when count is unspecified', () => {
    // Seed many runs and assert the distribution is bounded by [3,8].
    let minSeen = Infinity;
    let maxSeen = 0;
    for (let s = 1; s <= 50; s++) {
      const sp = encountersToSpawns(
        [{ id: 'e', level: 1, monsters: [{ archetypeId: 'A' }] }],
        'trash',
        createRng(s)
      );
      minSeen = Math.min(minSeen, sp.length);
      maxSeen = Math.max(maxSeen, sp.length);
      expect(sp.length).toBeGreaterThanOrEqual(3);
      expect(sp.length).toBeLessThanOrEqual(8);
    }
    expect(minSeen).toBeGreaterThanOrEqual(3);
    expect(maxSeen).toBeLessThanOrEqual(8);
    // With 50 different seeds we expect to see at least 2 distinct values.
    expect(maxSeen).toBeGreaterThan(minSeen);
  });

  it('elite waves default to [1,3]', () => {
    for (let s = 1; s <= 30; s++) {
      const sp = encountersToSpawns(
        [{ id: 'e', level: 1, monsters: [{ archetypeId: 'A' }] }],
        'elite',
        createRng(s)
      );
      expect(sp.length).toBeGreaterThanOrEqual(1);
      expect(sp.length).toBeLessThanOrEqual(3);
    }
  });

  it('boss waves default to exactly 1', () => {
    for (let s = 1; s <= 5; s++) {
      const sp = encountersToSpawns(
        [{ id: 'e', level: 1, monsters: [{ archetypeId: 'A' }] }],
        'boss',
        createRng(s)
      );
      expect(sp.length).toBe(1);
    }
  });

  it('caps total spawns at MAX_SPAWNS_PER_WAVE (20) globally', () => {
    const enc = [
      {
        id: 'e',
        level: 1,
        monsters: [
          { archetypeId: 'A', count: 15 },
          { archetypeId: 'B', count: 15 } // sum 30 → must clamp to 20
        ]
      }
    ];
    const sp = encountersToSpawns(enc, 'trash', createRng(0));
    expect(sp.length).toBeLessThanOrEqual(MAX_SPAWNS_PER_WAVE);
  });

  it('never spawns 0 monsters even when a roll bottoms out', () => {
    // countMin=1,countMax=1 forces 1.
    const sp = encountersToSpawns(
      [{ id: 'e', level: 1, monsters: [{ archetypeId: 'A', countMin: 1, countMax: 1 }] }],
      'trash',
      createRng(7)
    );
    expect(sp.length).toBe(1);
  });

  it('synthDefaultPlan is seed-deterministic and respects the [3,8]/[1,3]/[1,1] ranges', () => {
    const planA = synthDefaultPlan(
      { id: 'areas/x', lootTable: 'lt', areaLevel: 1 },
      'monsters/act1.fallen',
      1,
      42
    );
    const planB = synthDefaultPlan(
      { id: 'areas/x', lootTable: 'lt', areaLevel: 1 },
      'monsters/act1.fallen',
      1,
      42
    );
    expect(planA.waves.map((w) => w.spawns.length)).toEqual(
      planB.waves.map((w) => w.spawns.length)
    );
    // trash, trash, elite, boss
    const counts = planA.waves.map((w) => w.spawns.length);
    expect(counts[0]).toBeGreaterThanOrEqual(3);
    expect(counts[0]).toBeLessThanOrEqual(8);
    expect(counts[1]).toBeGreaterThanOrEqual(3);
    expect(counts[1]).toBeLessThanOrEqual(8);
    expect(counts[2]).toBeGreaterThanOrEqual(1);
    expect(counts[2]).toBeLessThanOrEqual(3);
    expect(counts[3]).toBe(1);
  });
});

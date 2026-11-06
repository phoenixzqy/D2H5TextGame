import Ajv from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import act4 from '../../data/maps/sub-areas/act4.json';
import schema from '../../data/schema/sub-area.schema.json';
import monsters from '../../data/monsters/act4.json';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import type { CombatSnapshot } from './combat';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan, type WaveSpec } from './sub-area-run';
import retained from './fixtures/act4-izual-guard-tier.json';

function izualWave(mode: 'manual' | 'idle'): WaveSpec {
  const area = (act4 as SubAreaDef[]).find(row => row.id === 'areas/act4-plains-of-despair');
  if (!area) throw new Error('Missing Plains of Despair');
  const wave = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act4.damned',
    fallbackLevel: 35, seed: retained.runSeed, challengeOrdinal: retained.ordinal, mode })
    .waves.find(row => row.source?.kind === 'bossEncounter');
  if (!wave) throw new Error('Missing authored Izual encounter');
  return wave;
}

describe('BUG507 Izual has two ordinary Oblivion Knight escorts', () => {
  it('validates the changed Act IV data using the existing schema', () => {
    const validate = new Ajv({ strict: true }).compile(schema);
    for (const area of act4) expect(validate(area), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each(['manual', 'idle'] as const)('%s keeps one Izual boss and two ordinary escorts', mode => {
    const wave = izualWave(mode);
    expect(wave.spawns).toHaveLength(3);
    expect(wave.spawns.filter(spawn => spawn.tier === 'boss').map(spawn => spawn.archetypeId))
      .toEqual(['monsters/act4.izual']);
    const guards = wave.spawns.filter(spawn => spawn.archetypeId === 'monsters/act4.oblivion-knight');
    expect(guards).toHaveLength(2);
    expect(guards.every(spawn => spawn.tier === 'trash')).toBe(true);
  });

  it('preserves the recorded Izual stats while removing escort boss multipliers', () => {
    const snapshot = structuredClone(retained.snapshot) as unknown as CombatSnapshot;
    const wave = izualWave('manual');
    const build = (legacy: boolean) => {
      const rng = createRng(snapshot.seed);
      return wave.spawns.map((spawn, index) => {
        const def = (monsters as unknown as MonsterDef[]).find(row => row.id === spawn.archetypeId);
        if (!def) throw new Error('Missing Act IV monster');
        const position = snapshot.enemyTeam[index]?.gridPosition;
        if (!position) throw new Error('Missing recorded enemy position');
        return { ...buildMonsterUnit({ def, level: spawn.level, tier: legacy ? 'boss' : spawn.tier,
          rng, index: spawn.index }), gridPosition: position };
      });
    };
    // Match the original enemies without replaying the completed prefix or native loss.
    expect(build(true)).toEqual(snapshot.enemyTeam);
    const corrected = build(false);
    expect(corrected[0]).toEqual(snapshot.enemyTeam[0]);
    for (const index of [1, 2]) {
      const guard = corrected[index], original = snapshot.enemyTeam[index];
      if (!guard || !original) throw new Error('Missing escort');
      expect(guard.tier).toBe('trash');
      expect(guard.level).toBe(original.level);
      expect(guard.stats.lifeMax).toBeLessThan(original.stats.lifeMax);
      expect(guard.stats.attack).toBeLessThan(original.stats.attack);
      expect(guard.stats.defense).toBeLessThan(original.stats.defense);
    }
  });
});

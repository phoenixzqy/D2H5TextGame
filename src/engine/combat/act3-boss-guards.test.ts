import Ajv from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import act3 from '../../data/maps/sub-areas/act3.json';
import schema from '../../data/schema/sub-area.schema.json';
import monsters from '../../data/monsters/act3.json';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan, type WaveSpec } from './sub-area-run';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import retained from './fixtures/act3-bazaar-guard-tier.json';

function bossWave(id: string, mode: 'manual' | 'idle'): WaveSpec {
  const area = (act3 as SubAreaDef[]).find(row => row.id === id);
  if (!area) throw new Error('Missing Act III area');
  const wave = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act3.flayer',
    fallbackLevel: 24, seed: retained.runSeed, challengeOrdinal: retained.ordinal, mode })
    .waves.find(row => row.source?.kind === 'bossEncounter');
  if (!wave) throw new Error('Missing authored Act III boss encounter');
  return wave;
}

describe('BUG506 Act III boss guards retain their ordinary role', () => {
  it('validates the changed Act III data against the existing schema', () => {
    const validate = new Ajv({ strict: true }).compile(schema);
    for (const area of act3) expect(validate(area), JSON.stringify(validate.errors)).toBe(true);
  });

  for (const [id, leader, count] of [
    ['areas/act3-flayer-jungle', 'monsters/act3.fetish', 5],
    ['areas/act3-kurast-bazaar', 'monsters/act3.serpent-magus', 4]
  ] as const) {
    it.each(['manual', 'idle'] as const)(`${id} %s keeps one leader and ${String(count)} ordinary guards`, mode => {
      const wave = bossWave(id, mode);
      expect(wave.spawns.filter(spawn => spawn.tier === 'boss').map(spawn => spawn.archetypeId)).toEqual([leader]);
      const guards = wave.spawns.filter(spawn => spawn.archetypeId === 'monsters/act3.flayer');
      expect(guards).toHaveLength(count);
      expect(guards.every(spawn => spawn.tier === 'trash')).toBe(true);
      expect(wave.lootTable).toBe('loot/mini-act3');
    });
  }

  it.each(['manual', 'idle'] as const)('%s preserves all three explicit Council bosses', mode => {
    const wave = bossWave('areas/act3-travincal', mode);
    expect(wave.spawns).toHaveLength(3);
    expect(wave.spawns.every(spawn => spawn.tier === 'boss' && spawn.archetypeId === 'monsters/act3.infector')).toBe(true);
  });

  it('clears the exact native Sarina failure with only corrected companion roles', () => {
    const snapshot = structuredClone(retained.snapshot) as unknown as CombatSnapshot;
    const wave = bossWave('areas/act3-kurast-bazaar', 'manual');
    const build = (legacy: boolean) => {
      const rng = createRng(snapshot.seed);
      return wave.spawns.map((spawn, index) => {
        const def = (monsters as unknown as MonsterDef[]).find(row => row.id === spawn.archetypeId);
        if (!def) throw new Error('Missing Act III monster');
        const position = snapshot.enemyTeam[index]?.gridPosition;
        if (!position) throw new Error('Missing retained enemy position');
        return { ...buildMonsterUnit({ def, level: spawn.level, tier: legacy ? 'boss' : spawn.tier,
          rng, index: spawn.index }), gridPosition: position };
      });
    };
    // Reconstruct the recorded enemies without replaying the unchanged native loss.
    expect(build(true)).toEqual(snapshot.enemyTeam);
    const enemies = build(false);
    expect(enemies[0]).toEqual(snapshot.enemyTeam[0]);
    const input = { ...snapshot, enemyTeam: enemies }, before = structuredClone(input);
    const output = runBattleRecorded(input);
    expect(input).toEqual(before);
    expect(output.result.winner).toBe('player');
    expect(output.result.playerTeam.find(unit => unit.kind === 'hero')?.life).toBeGreaterThan(0);
    expect(output.result.enemyTeam.every(unit => unit.life <= 0)).toBe(true);
  });
});

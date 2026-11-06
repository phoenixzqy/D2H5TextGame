import { describe, expect, it } from 'vitest';
import act2Areas from '../../data/maps/sub-areas/act2.json';
import type { SubAreaDef } from '../types/maps';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan, resolveWavePlan } from './sub-area-run';

const area: SubAreaDef = {
  id: 'areas/act2-copy-budget', name: 'Copy budget', actId: 'acts/act2',
  areaLevel: 20, hasBoss: false, lootTable: 'loot/trash-act2',
  challenge: { monsterCount: { min: 8, max: 20 }, rotation: ['trash'], manualFinalEliteWaves: 0 },
  waves: [{ id: 'authored', type: 'elite', encounters: [{
    id: 'core', level: 20, monsters: [
      { archetypeId: 'scarab', count: 2, elite: true },
      { archetypeId: 'ordinary', count: 1, boss: false },
      { archetypeId: 'mummy', count: 1 }
    ]
  }] }]
};

describe('authored elite copy budget (BUG447)', () => {
  it.each(['manual', 'idle'] as const)('preserves the authored core and fits ordinary copies in %s', (mode) => {
    const original = structuredClone(area);
    for (let ordinal = 0; ordinal < 13; ordinal++) {
      const plan = resolveChallengeWavePlan({ subArea: area, mode, challengeOrdinal: ordinal,
        seed: 7, fallbackArchetypeId: 'scarab', fallbackLevel: 20,
        eliteConfig: { ...DEFAULT_ELITE_CONFIG, idle: { ...DEFAULT_ELITE_CONFIG.idle, enabled: false } }
      });
      const wave = plan.waves[0];
      expect(wave?.spawns).toHaveLength(8 + ordinal);
      expect(wave?.spawns.map(s => s.tier)).toEqual([
        'elite', 'elite', 'trash', 'elite', ...Array<string>(4 + ordinal).fill('trash')
      ]);
      expect(wave?.presentation?.kind).toBe('elite');
      const counts = new Map<string, number>();
      for (const [i, spawn] of (wave?.spawns ?? []).entries()) {
        const archetypeId = ['scarab', 'scarab', 'ordinary', 'mummy'][i % 4];
        expect(spawn.archetypeId).toBe(archetypeId);
        expect(spawn.encounterId).toBe('core');
        expect(spawn.level).toBe(20);
        expect(spawn.index).toBe(counts.get(spawn.archetypeId) ?? 0);
        counts.set(spawn.archetypeId, spawn.index + 1);
        expect(spawn.eliteAffix).toBeUndefined();
      }
    }
    expect(area).toEqual(original);
    expect(resolveWavePlan(area, 'scarab', 20, 7).waves[0]?.spawns.map(s => s.tier))
      .toEqual(['elite', 'elite', 'trash', 'elite']);
  });

  it('keeps four authored elites among nineteen bodies in the earned Lost City W4', () => {
    const lostCity = act2Areas.find(a => a.id === 'areas/act2-lost-city') as SubAreaDef | undefined;
    if (!lostCity) throw new Error('Missing Lost City');
    const plan = resolveChallengeWavePlan({ subArea: lostCity, mode: 'manual', challengeOrdinal: 307,
      seed: 3902248427, fallbackArchetypeId: 'monsters/act2.scarab', fallbackLevel: 24 });
    const wave = plan.waves[3];
    expect(wave?.presentation).toEqual({ kind: 'elite', difficultyBand: 'normal' });
    expect(wave?.spawns).toHaveLength(19);
    expect(wave?.spawns.map(s => s.tier)).toEqual([
      'elite', 'elite', 'elite', 'elite', ...Array<string>(15).fill('trash')
    ]);
    expect(wave?.spawns.filter(s => s.archetypeId === 'monsters/act2.scarab')).toHaveLength(10);
    expect(wave?.spawns.every(s => s.eliteAffix === undefined)).toBe(true);
  });
});

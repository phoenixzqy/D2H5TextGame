import { describe, expect, it } from 'vitest';
import act1Areas from '../../data/maps/sub-areas/act1.json';
import act1Monsters from '../../data/monsters/act1.json';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan, resolveWavePlan } from './sub-area-run';

const den = (act1Areas as SubAreaDef[]).find(area => area.id === 'areas/act1-den-of-evil');
if (!den) throw new Error('Missing Den definition');
const sourceDen: SubAreaDef = den;
const args = { fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6,
  seed: 2223645302, challengeOrdinal: 40 };

// Historical authoring control, not a second production configuration.
function previousDen(): SubAreaDef {
  const before = structuredClone(sourceDen);
  const guard = before.waves.find(wave => wave.id === 'w3')?.encounters?.[0]?.monsters[0];
  if (!guard) throw new Error('Missing Den guard');
  return { ...before, waves: before.waves.map(wave => wave.id !== 'w3' ? wave : {
    ...wave, encounters: (wave.encounters ?? []).map(encounter => ({ ...encounter,
      monsters: encounter.monsters.map((monster, index) => index === 0
        ? { ...monster, archetypeId: 'monsters/act1.dark-stalker' } : monster)
    }))
  }) };
}

describe('Den authored Dark One guard', () => {
  it('uses its specified early cave family in both legacy and active plans', () => {
    const guard = sourceDen.waves.find(wave => wave.id === 'w3')?.encounters?.[0];
    expect(guard).toEqual({ id: 'act1-den-w3-e1', level: 4, monsters: [
      { archetypeId: 'monsters/act1.dark-one', count: 2, elite: true },
      { archetypeId: 'monsters/act1.fallen', count: 2 }
    ] });
    const legacy = resolveWavePlan(sourceDen, args.fallbackArchetypeId, 6);
    expect(legacy.waves[2]?.spawns[0]?.archetypeId).toBe('monsters/act1.dark-one');
    const active = resolveChallengeWavePlan({ ...args, subArea: sourceDen });
    expect(active.waves[2]?.spawns.slice(0, 4).map(spawn => [spawn.archetypeId, spawn.tier, spawn.level])).toEqual([
      ['monsters/act1.dark-one', 'rare-elite', 7],
      ['monsters/act1.dark-one', 'rare-minion', 7],
      ['monsters/act1.fallen', 'rare-minion', 7],
      ['monsters/act1.fallen', 'rare-minion', 7]
    ]);
  });

  it.each(['manual', 'idle'] as const)('preserves counts, levels, tiers, RNG/affixes and every other wave in %s', mode => {
    const frozen = structuredClone(sourceDen);
    for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      const input = { ...args, mode, challengeOrdinal, idleEliteMisses: 11 };
      const plan = resolveChallengeWavePlan({ ...input, subArea: sourceDen });
      const before = resolveChallengeWavePlan({ ...input, subArea: previousDen() });
      expect(plan.waves[2]?.spawns[0]?.archetypeId).toBe('monsters/act1.dark-one');
      // Reversing only the family must recover the entire old plan, including
      // following boss output and every shared RNG/affix/pity metadata field.
      const reversed = { ...plan, waves: plan.waves.map(wave => ({ ...wave,
        spawns: wave.spawns.map(spawn => spawn.archetypeId === 'monsters/act1.dark-one'
          ? { ...spawn, archetypeId: 'monsters/act1.dark-stalker' } : spawn)
      })) };
      expect(reversed).toEqual(before);
    }
    expect(sourceDen).toEqual(frozen);
  });

  it.each([[0, 236], [1 - Number.EPSILON, 364]])('builds the L7 rare leader at life roll %s with HP %s', (roll, hp) => {
    const leader = resolveChallengeWavePlan({ ...args, subArea: sourceDen }).waves[2]?.spawns[0];
    if (!leader) throw new Error('Missing rare leader');
    const def = (act1Monsters as unknown as MonsterDef[]).find(monster => monster.id === leader.archetypeId);
    if (!def) throw new Error('Missing leader definition');
    const unit = buildMonsterUnit({ def, level: leader.level, tier: leader.tier, rng: { ...createRng(7), next: () => roll },
      resistanceBonus: DEFAULT_ELITE_CONFIG.rareEliteResistanceBonus });
    expect(unit.stats.defense).toBe(27);
    expect(unit.stats.magicResist).toBe(9);
    expect(unit.stats.resistances).toEqual({ fire: 30, cold: 30, lightning: 30, poison: 30, arcane: 30, physical: 30 });
    expect(unit.stats.lifeMax).toBe(hp);
    expect(unit.stats.lifeMax).toBeGreaterThanOrEqual(236);
    expect(unit.stats.lifeMax).toBeLessThanOrEqual(364);
  });
});

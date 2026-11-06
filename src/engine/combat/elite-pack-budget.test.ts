import { describe, expect, it } from 'vitest';
import act1Areas from '../../data/maps/sub-areas/act1.json';
import act1Monsters from '../../data/monsters/act1.json';
import { createRng } from '../rng';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';
import { mitigateDamage } from './damage';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from './sub-area-run';

const den = (act1Areas as SubAreaDef[]).find(area => area.id === 'areas/act1-den-of-evil');
const darkOne = (act1Monsters as unknown as MonsterDef[]).find(monster => monster.id === 'monsters/act1.dark-one');
if (!den || !darkOne) throw new Error('Missing native Den fixtures');
const area = den;
const definition = darkOne;

describe('elite group spell concurrency and rare attack budget', () => {
  it.each(['manual', 'idle'] as const)('grants one affix per promoted Act I group in %s at every count', mode => {
    for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      const plan = resolveChallengeWavePlan({ subArea: area, mode, challengeOrdinal,
        seed: 2494876480, fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6,
        idleEliteMisses: 11 });
      for (const wave of plan.waves.filter(candidate => candidate.spawns.some(spawn => spawn.eliteAffix))) {
        expect(wave.spawns.filter(spawn => spawn.eliteAffix)).toHaveLength(1);
        expect(wave.spawns[0]?.eliteAffix).toBeDefined();
        for (const follower of wave.spawns.slice(1)) {
          expect(follower).not.toHaveProperty('eliteAffix');
          const base = (act1Monsters as unknown as MonsterDef[]).find(monster => monster.id === follower.archetypeId);
          if (!base) throw new Error('Missing native follower');
          const unit = buildMonsterUnit({ def: base, tier: follower.tier, level: follower.level,
            rng: createRng(7), extraSkillIds: [] });
          expect(unit.skillOrder).toEqual(base.skills);
        }
      }
    }
  });

  it.each([
    [1, 48, 35], [7, 93, 68], [20, 191, 140], [90, 716, 525]
  ] as const)('builds literal rare leader/minion Attack at L%i', (level, leader, minion) => {
    for (const [tier, expected] of [['rare-elite', leader], ['rare-minion', minion]] as const) {
      const unit = buildMonsterUnit({ def: definition, level, tier, rng: createRng(7) });
      expect(unit.stats.attack).toBe(expected);
      expect(unit.attackRange).toEqual([expected, expected]);
    }
  });

  it('reduces native L7 leader critical burst against the recorded L6 defense', () => {
    const leader = buildMonsterUnit({ def: definition, level: 7, tier: 'rare-elite', rng: createRng(7) });
    expect(leader.stats.critDamage).toBe(1.5);
    const damage = mitigateDamage(leader.stats.attack * leader.stats.critDamage, { type: 'physical',
      defenderArmor: 61, defenderMagicResist: 0,
      defenderResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } });
    expect(damage.final).toBe(78);
    expect(180 - damage.final).toBe(102);
  });

  it('preserves elite HP, armor and champion power', () => {
    expect(DEFAULT_ELITE_CONFIG.multipliers).toEqual({
      champion: { life: 3, attack: 1.5, defense: 1.3 },
      rareElite: { life: 4, attack: 1.5, defense: 1.3 },
      rareMinion: { life: 2, attack: 1.1, defense: 1.15 }
    });
  });
});

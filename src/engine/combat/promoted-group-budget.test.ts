import { describe, expect, it } from 'vitest';
import act2Areas from '../../data/maps/sub-areas/act2.json';
import act3Areas from '../../data/maps/sub-areas/act3.json';
import act4Areas from '../../data/maps/sub-areas/act4.json';
import act5Areas from '../../data/maps/sub-areas/act5.json';
import act2Monsters from '../../data/monsters/act2.json';
import act3Monsters from '../../data/monsters/act3.json';
import act4Monsters from '../../data/monsters/act4.json';
import act5Monsters from '../../data/monsters/act5.json';
import type { SubAreaDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from './sub-area-run';

const openings = [act2Areas[0], act3Areas[0], act4Areas[0], act5Areas[0]] as SubAreaDef[];
const monsters = [...act2Monsters, ...act3Monsters, ...act4Monsters, ...act5Monsters] as unknown as MonsterDef[];

describe('later-act promoted group combat budget (BUG440)', () => {
  it.each(openings.map(area => [area.actId, area] as const))('%s bounds manual and idle groups at every count while preserving natural skills', (_act, area) => {
    const source = structuredClone(area);
    for (const mode of ['manual', 'idle'] as const) {
      for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
        const plan = resolveChallengeWavePlan({ subArea: area, mode, challengeOrdinal,
          seed: 3677085560, fallbackArchetypeId: area.waves[0]?.encounters?.[0]?.monsters[0]?.archetypeId ?? '',
          fallbackLevel: area.areaLevel, idleEliteMisses: 11 });
        for (const [index, wave] of plan.waves.entries()) {
          if (!wave.presentation?.isForcedElite && !wave.presentation?.isIdleElite) continue;
          expect(wave.spawns).toHaveLength(8 + ((challengeOrdinal + index) % 13));
          const core = wave.spawns[0]?.tier === 'champion'
            ? ['champion', 'champion', 'champion']
            : ['rare-elite', 'rare-minion', 'rare-minion', 'rare-minion'];
          expect(wave.spawns.map(spawn => spawn.tier)).toEqual([
            ...core, ...Array<string>(wave.spawns.length - core.length).fill('trash')
          ]);
          expect(wave.spawns.filter(spawn => spawn.eliteAffix)).toHaveLength(1);
          expect(wave.spawns[0]?.eliteAffix).toBeDefined();
          for (const spawn of wave.spawns.slice(1)) {
            expect(spawn).not.toHaveProperty('eliteAffix');
            const def = monsters.find(monster => monster.id === spawn.archetypeId);
            if (!def) throw new Error('Missing authored later-act monster');
            const unit = buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, rng: createRng(7) });
            expect(unit.skillOrder).toEqual(def.skills);
          }
        }
      }
    }
    expect(area).toEqual(source);
  });

  it('retains the original later-act Lightning skill on one champion in the earned Rocky Waste wave', () => {
    const area = openings[0];
    if (!area) throw new Error('Missing Rocky Waste');
    const plan = resolveChallengeWavePlan({ subArea: area, mode: 'manual', challengeOrdinal: 122,
      seed: 3677085560, fallbackArchetypeId: 'monsters/act2.sand-raider', fallbackLevel: 14 });
    const guard = plan.waves[2];
    expect(guard?.spawns).toHaveLength(15);
    expect(guard?.spawns.map(spawn => spawn.tier)).toEqual([
      'champion', 'champion', 'champion', ...Array<string>(12).fill('trash')
    ]);
    expect(guard?.spawns[0]?.eliteAffix).toEqual({
      id: 'elite-affix/lightning-enchanted', nameKey: 'combat.eliteAffix.lightningEnchanted',
      skillId: 'monster-lightning'
    });
    expect(guard?.spawns.filter(spawn => spawn.eliteAffix)).toHaveLength(1);
    expect(DEFAULT_ELITE_CONFIG.multipliers.champion).toEqual({ life: 3, attack: 1.5, defense: 1.3 });
  });
});

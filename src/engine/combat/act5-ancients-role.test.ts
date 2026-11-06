import Ajv from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import act5 from '../../data/maps/sub-areas/act5.json';
import schema from '../../data/schema/sub-area.schema.json';
import type { SubAreaDef } from '../types/maps';
import { resolveChallengeWavePlan } from './sub-area-run';

const ancient = 'monsters/act5.ancient-barbarian';
const area = (act5 as SubAreaDef[]).find(row => row.id === 'areas/act5-ancients-way');
if (!area) throw new Error('Missing Ancients Way');

describe('BUG498 Ancient bosses retain their distinct campaign role', () => {
  it('loads schema-valid Act V data and keeps the exact three-boss quest recipe', () => {
    const validate = new Ajv({ strict: true }).compile(schema);
    for (const row of act5) expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(area.bossEncounter).toEqual({ id: 'act5-aw-ancients', level: 72,
      monsters: [{ archetypeId: ancient, count: 3, boss: true }] });
    const bossWaves = area.waves.filter(wave => wave.type === 'boss');
    expect(bossWaves).toHaveLength(1);
    expect(bossWaves[0]?.encounters?.[0]?.monsters).toEqual(area.bossEncounter?.monsters);
    expect(area.waves.filter(wave => wave.type !== 'boss').flatMap(wave =>
      (wave.encounters ?? []).flatMap(encounter => encounter.monsters)).some(row => row.archetypeId === ancient)).toBe(false);
  });

  it.each([0, 1561])('keeps Ancient bosses out of generated ordinary packs at ordinal %i', ordinal => {
    const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act5.barbarian-savage',
      fallbackLevel: area.areaLevel, seed: 498, challengeOrdinal: ordinal, mode: 'manual' });
    const ordinary = plan.waves.filter(wave => wave.source?.kind !== 'bossEncounter' && wave.source?.kind !== 'chapterBoss');
    expect(ordinary.length).toBeGreaterThan(0);
    expect(ordinary.flatMap(wave => wave.spawns).some(spawn => spawn.archetypeId === ancient)).toBe(false);
    const bosses = plan.waves.flatMap(wave => wave.spawns).filter(spawn => spawn.archetypeId === ancient);
    expect(bosses).toHaveLength(3);
    expect(bosses.every(spawn => spawn.tier === 'boss' && spawn.encounterId === 'act5-aw-ancients')).toBe(true);
  });
});

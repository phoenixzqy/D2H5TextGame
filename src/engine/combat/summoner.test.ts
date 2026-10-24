import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import monsters from '../../data/monsters/act2.json';
import areas from '../../data/maps/sub-areas/act2.json';
import schema from '../../data/schema/monster.schema.json';
import type { MonsterDef } from '../types/monsters';
import type { SubAreaDef } from '../types/maps';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan } from './sub-area-run';

const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(schema);
const row: unknown = monsters.find(m => m.id === 'monsters/act2.the-summoner');
if (!validate(row)) throw new Error('Invalid production Summoner definition');
const summoner = row;
const areaRow = areas.find(a => a.id === 'areas/act2-arcane-sanctuary');
if (!areaRow) throw new Error('Missing Arcane Sanctuary');
const area = areaRow as SubAreaDef;

describe('Summoner Act II durability calibration', () => {
  it('keeps the generated level28 boss inside its envelope with three ordinary guards', () => {
    const plan = resolveChallengeWavePlan({ subArea: area, seed: 1, challengeOrdinal: 257,
      mode: 'manual', fallbackArchetypeId: 'monsters/act2.sand-raider', fallbackLevel: 23 });
    expect(plan.waves.at(-1)?.spawns.map(s => [s.archetypeId, s.tier, s.level])).toEqual([
      ['monsters/act2.the-summoner', 'boss', 28],
      ...Array.from({ length: 3 }, () => ['monsters/act2.undead-flayer', 'trash', 28])
    ]);
    for (let seed = 1; seed <= 64; seed++) {
      const boss = buildMonsterUnit({ def: summoner, level: 28, tier: 'boss', rng: createRng(seed) });
      expect(boss.life).toBeGreaterThanOrEqual(4995);
      expect(boss.life).toBeLessThanOrEqual(6105);
      expect(boss.stats).toMatchObject({ lifeMax: boss.life, defense: 241, magicResist: 81,
        attackSpeed: 110, resistances: { fire: 50, cold: 50, lightning: 50, poison: 75 } });
    }
  });

  it('changes only life and preserves subsequent RNG at Normal28 and Nightmare48', () => {
    const previous: MonsterDef = { ...summoner, life: [780, 980], lifeGrowth: [78, 98] };
    for (const level of [28, 48]) for (let seed = 1; seed <= 16; seed++) {
      const rng = createRng(seed), oldRng = createRng(seed);
      const boss = buildMonsterUnit({ def: summoner, level, tier: 'boss', rng });
      const old = buildMonsterUnit({ def: previous, level, tier: 'boss', rng: oldRng });
      expect(boss).toEqual({ ...old, life: boss.life, stats: { ...old.stats,
        life: boss.life, lifeMax: boss.life } });
      expect(boss.life).toBeLessThan(old.life);
      expect(boss.life).toBeGreaterThanOrEqual(level === 28 ? 4995 : 7695);
      expect(boss.life).toBeLessThanOrEqual(level === 28 ? 6105 : 9405);
      expect(rng.next()).toBe(oldRng.next());
    }
  });
});

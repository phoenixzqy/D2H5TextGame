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
const row: unknown = monsters.find(m => m.id === 'monsters/act2.radament');
if (!validate(row)) throw new Error('Invalid production Radament definition');
const radament = row;
const areaRow = areas.find(a => a.id === 'areas/act2-far-oasis');
if (!areaRow) throw new Error('Missing Far Oasis');
const area = areaRow as SubAreaDef;

describe('Radament early Act II durability calibration', () => {
  it('keeps the native level22 mini-boss inside its envelope with four ordinary guards', () => {
    const plan = resolveChallengeWavePlan({ subArea: area, seed: 1, challengeOrdinal: 256,
      mode: 'manual', fallbackArchetypeId: 'monsters/act2.sand-raider', fallbackLevel: 18 });
    const wave = plan.waves.at(-1);
    expect(wave?.spawns.map(s => [s.archetypeId, s.tier, s.level])).toEqual([
      ['monsters/act2.radament', 'boss', 22],
      ...Array.from({ length: 4 }, () => ['monsters/act2.mummy', 'trash', 22])
    ]);
    for (let seed = 1; seed <= 64; seed++) {
      const boss = buildMonsterUnit({ def: radament, level: 22, tier: 'boss', rng: createRng(seed) });
      expect(boss.life).toBeGreaterThanOrEqual(4650);
      expect(boss.life).toBeLessThanOrEqual(5766);
      expect(boss.stats).toMatchObject({ lifeMax: boss.life, defense: 242, magicResist: 63,
        attackSpeed: 100, resistances: { fire: 50, poison: 75, cold: 0, physical: 25 } });
    }
  });

  it('changes only life while preserving identity, every non-life stat and RNG at Normal and Nightmare levels', () => {
    const previous: MonsterDef = { ...radament, life: [820, 1020], lifeGrowth: [82, 102] };
    for (const level of [22, 42]) for (let seed = 1; seed <= 16; seed++) {
      const rng = createRng(seed), oldRng = createRng(seed);
      const boss = buildMonsterUnit({ def: radament, level, tier: 'boss', rng });
      const old = buildMonsterUnit({ def: previous, level, tier: 'boss', rng: oldRng });
      expect(boss).toEqual({ ...old, life: boss.life, stats: { ...old.stats,
        life: boss.life, lifeMax: boss.life } });
      expect(boss.life).toBeLessThan(old.life);
      expect(boss.life).toBeGreaterThanOrEqual(level === 22 ? 4650 : 7650);
      expect(boss.life).toBeLessThanOrEqual(level === 22 ? 5766 : 9486);
      expect(rng.next()).toBe(oldRng.next());
    }
  });
});

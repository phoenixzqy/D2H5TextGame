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
import { runBattle, runBattleRecorded } from './combat';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import type { CombatUnit } from './types';

const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(schema);
const row: unknown = monsters.find(m => m.id === 'monsters/act2.the-summoner');
if (!validate(row)) throw new Error('Invalid production Summoner definition');
const summoner = row;
const areaRow = areas.find(a => a.id === 'areas/act2-arcane-sanctuary');
if (!areaRow) throw new Error('Missing Arcane Sanctuary');
const area = areaRow as SubAreaDef;

describe('Summoner Act II durability calibration', () => {
  it('retains a substantial elemental defense without the former three-element wall', () => {
    expect(summoner.resistances).toEqual({ fire: 25, cold: 25, lightning: 25, poison: 75 });
  });

  it('allows a learned rank20 Blizzard hit through the real level28 boss defenses', () => {
    resetRegistry(); loadDefaultSkills();
    const boss = buildMonsterUnit({ def: summoner, level: 28, tier: 'boss', rng: createRng(1) });
    const hero: CombatUnit = { ...boss, id: 'hero', kind: 'hero', side: 'player', tier: 'trash',
      level: 26, life: 1000, mana: 35, statuses: [],
      skillOrder: ['sorceress.blizzard'], skillLevels: { 'sorceress.blizzard': 20 },
      stats: { ...boss.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
        attackSpeed: 100, critChance: 0 } };
    let landed = 0;
    for (const seed of [1, 2, 3, 4]) {
      const input = { seed, act: 2 as const, playerTeam: [hero], enemyTeam: [boss] };
      const before = structuredClone(input), recorded = runBattleRecorded(input);
      const hits = recorded.events.filter(event => event.kind === 'damage' &&
        event.source === 'hero' && event.target === boss.id && event.damageType === 'cold');
      expect(hits).toHaveLength(1);
      const hit = hits[0];
      if (hit?.kind !== 'damage') throw new Error('Missing Blizzard attempt');
      expect(hit.crit).toBe(false);
      if (hit.dodged) expect(hit.amount).toBe(0);
      else {
        landed++;
        // P15 invested Blizzard: raw1605..1645, then25%cold resistance and81MR.
        expect(hit.amount).toBeGreaterThanOrEqual(1122);
        expect(hit.amount).toBeLessThanOrEqual(1152);
      }
      expect(recorded.result).toEqual(runBattle(input));
      expect(input).toEqual(before);
    }
    expect(landed).toBeGreaterThan(0);
  });

  it('changes only the three elemental resistances at Normal28 and Nightmare48', () => {
    const previous: MonsterDef = { ...summoner,
      resistances: { ...summoner.resistances, fire: 50, cold: 50, lightning: 50 } };
    const withoutDelivery = (unit: CombatUnit) => {
      const { basicAttackDelivery: _delivery, ...rest } = unit;
      return rest;
    };
    for (const level of [28, 48]) for (let seed = 0; seed < 16; seed++) {
      const currentRng = createRng(seed), previousRng = createRng(seed);
      const current = buildMonsterUnit({ def: summoner, level, tier: 'boss', rng: currentRng });
      const old = buildMonsterUnit({ def: previous, level, tier: 'boss', rng: previousRng });
      expect(withoutDelivery(current)).toEqual({ ...withoutDelivery(old),
        stats: { ...old.stats, resistances: current.stats.resistances } });
      expect(current.stats.magicResist).toBe(level === 28 ? 81 : 141);
      expect(currentRng.next()).toBe(previousRng.next());
    }
  });

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
        attackSpeed: 110, resistances: { fire: 25, cold: 25, lightning: 25, poison: 75 } });
    }
  });

  it('changes life and native delivery while preserving subsequent RNG at Normal28 and Nightmare48', () => {
    const previous: MonsterDef = { ...summoner, life: [780, 980], lifeGrowth: [78, 98] };
    for (const level of [28, 48]) for (let seed = 1; seed <= 16; seed++) {
      const rng = createRng(seed), oldRng = createRng(seed);
      const boss = buildMonsterUnit({ def: summoner, level, tier: 'boss', rng });
      const old = buildMonsterUnit({ def: previous, level, tier: 'boss', rng: oldRng });
      // The exact native definition has authored delivery; the modified
      // historical definition is deliberately unclassified.
      expect(old).not.toHaveProperty('basicAttackDelivery');
      expect(boss).toEqual({ ...old, basicAttackDelivery: 'melee', life: boss.life,
        stats: { ...old.stats, life: boss.life, lifeMax: boss.life } });
      expect(boss.life).toBeLessThan(old.life);
      expect(boss.life).toBeGreaterThanOrEqual(level === 28 ? 4995 : 7695);
      expect(boss.life).toBeLessThanOrEqual(level === 28 ? 6105 : 9405);
      expect(rng.next()).toBe(oldRng.next());
    }
  });
});

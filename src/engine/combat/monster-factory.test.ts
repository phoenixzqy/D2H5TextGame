/**
 * Tests for monster-factory: tier multipliers, JSON-derived stats,
 * deterministic life rolls.
 */
import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit, TIER_MULTIPLIERS, pickEliteAffix } from './monster-factory';

const FALLEN: MonsterDef = {
  id: 'monsters/act1.fallen',
  name: 'Fallen',
  life: [30, 50],
  lifeGrowth: [3, 5],
  skills: ['monster-weak-melee'],
  attackSpeed: 95,
  defense: 10,
  baseExperience: 10,
  canBeElite: true,
  canBeBoss: false,
  eliteAffixes: ['extra-fast', 'cursed']
};

describe('monster-factory', () => {
  it('builds a trash unit from JSON with sensible level-1 stats', () => {
    const unit = buildMonsterUnit({
      def: FALLEN,
      level: 1,
      tier: 'trash',
      rng: createRng(1),
      index: 0
    });
    expect(unit.side).toBe('enemy');
    expect(unit.tier).toBe('trash');
    expect(unit.kind).toBe('monster');
    expect(unit.level).toBe(1);
    expect(unit.name).toContain('Fallen');
    // Life rolled within JSON range at L1 (no growth applied).
    expect(unit.life).toBeGreaterThanOrEqual(30);
    expect(unit.life).toBeLessThanOrEqual(50);
    expect(unit.life).toBe(unit.stats.lifeMax);
    // Defense from JSON baseline at L1.
    expect(unit.stats.defense).toBe(10);
    // Attack scales from spec baseline.
    expect(unit.stats.attack).toBe(32);
    // Resistances default to 0 for unspecified slots.
    expect(unit.stats.resistances.fire).toBe(0);
    expect(unit.stats.resistances.poison).toBe(0);
    // Crit multiplier is the trash 1.5×, not the legacy one-shot 2×.
    expect(unit.stats.critDamage).toBe(1.5);
  });

  it('is deterministic given the same seed', () => {
    const a = buildMonsterUnit({ def: FALLEN, level: 5, tier: 'trash', rng: createRng(42) });
    const b = buildMonsterUnit({ def: FALLEN, level: 5, tier: 'trash', rng: createRng(42) });
    expect(a.life).toBe(b.life);
    expect(a.stats.attack).toBe(b.stats.attack);
    expect(a.id).toBe(b.id);
  });

  it('applies elite tier multipliers (×1.6 life, ×1.3 attack/defense)', () => {
    const seed = 7;
    const trash = buildMonsterUnit({ def: FALLEN, level: 5, tier: 'trash', rng: createRng(seed) });
    const elite = buildMonsterUnit({ def: FALLEN, level: 5, tier: 'elite', rng: createRng(seed) });

    expect(elite.tier).toBe('elite');
    expect(elite.name).toContain('(Elite)');
    // Same RNG seed → same underlying life roll. The visible life is the
    // tier multiplier applied to that roll (within ±1 due to rounding).
    const expectedLife = Math.round(trash.life * TIER_MULTIPLIERS.elite.life);
    expect(Math.abs(elite.stats.lifeMax - expectedLife)).toBeLessThanOrEqual(1);
    expect(elite.stats.attack).toBe(Math.round(trash.stats.attack * TIER_MULTIPLIERS.elite.attack));
    expect(elite.stats.defense).toBe(Math.round(trash.stats.defense * TIER_MULTIPLIERS.elite.defense));
  });

  it('applies boss tier multipliers (×3 life, ×1.6 atk, ×1.5 def) and badges name', () => {
    const seed = 99;
    const trash = buildMonsterUnit({ def: FALLEN, level: 10, tier: 'trash', rng: createRng(seed) });
    const boss = buildMonsterUnit({ def: FALLEN, level: 10, tier: 'boss', rng: createRng(seed) });

    expect(boss.tier).toBe('boss');
    expect(boss.name).toContain('(Boss)');
    const expectedLife = Math.round(trash.life * TIER_MULTIPLIERS.boss.life);
    expect(Math.abs(boss.stats.lifeMax - expectedLife)).toBeLessThanOrEqual(2);
    // Boss gets a higher crit multiplier than trash.
    expect(boss.stats.critDamage).toBeGreaterThan(trash.stats.critDamage);
    // Bosses keep the JSON skill list as their action priority.
    expect(boss.skillOrder).toEqual(FALLEN.skills);
  });

  it('pickEliteAffix prefers the archetype pool', () => {
    const affix = pickEliteAffix(FALLEN, createRng(1));
    expect(FALLEN.eliteAffixes).toContain(affix);
  });

  it('pickEliteAffix falls back to defaults when archetype pool is missing', () => {
    const noAffixes: MonsterDef = { ...FALLEN, eliteAffixes: [] };
    const affix = pickEliteAffix(noAffixes, createRng(2));
    expect(typeof affix).toBe('string');
    expect(affix.length).toBeGreaterThan(0);
  });
});

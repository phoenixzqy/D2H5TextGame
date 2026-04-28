import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { comboMultiplier, shouldShatter } from './combo';
import { applyStatus } from './status';
import type { CombatUnit } from './types';

const rng = createRng(0);

function mk(over: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: 't',
    name: 'T',
    side: 'enemy',
    level: 1,
    tier: 'trash',
    stats: {
      life: 100, lifeMax: 100, mana: 0, manaMax: 0,
      attack: 10, defense: 0, attackSpeed: 100,
      critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    life: 100, mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...over
  };
}

describe('combo matrix', () => {
  it('cold → lightning is ×1.30', () => {
    const u = applyStatus(mk(), { id: 'chill', sourceId: 's' }, rng);
    expect(comboMultiplier(u, 'lightning')).toBeCloseTo(1.3, 5);
  });

  it('freeze → physical is ×1.50 (shatter)', () => {
    const u = applyStatus(mk(), { id: 'freeze', sourceId: 's' }, rng);
    expect(comboMultiplier(u, 'physical')).toBeCloseTo(1.5, 5);
  });

  it('poison exponential: 3 stacks → 1.45', () => {
    let u = mk();
    for (let i = 0; i < 3; i++) {
      u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    }
    expect(comboMultiplier(u, 'poison')).toBeCloseTo(1 + 0.15 * 3, 5);
  });

  it('poison < 3 stacks does NOT trigger', () => {
    let u = mk();
    u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    expect(comboMultiplier(u, 'poison')).toBe(1);
  });

  it('boss reduces combo bonus to 50%', () => {
    const u = applyStatus(mk({ tier: 'boss' }), { id: 'chill', sourceId: 's' }, rng);
    // base 1.30 → boss 1.15
    expect(comboMultiplier(u, 'lightning')).toBeCloseTo(1.15, 5);
  });

  it('shouldShatter triggers at <20% HP under freeze + physical', () => {
    const u = applyStatus(mk({ life: 19 }), { id: 'freeze', sourceId: 's' }, rng);
    expect(shouldShatter(u, 'physical')).toBe(true);
    expect(shouldShatter(u, 'fire')).toBe(false);
  });

  it('no combo returns 1.0', () => {
    expect(comboMultiplier(mk(), 'physical')).toBe(1);
  });

  it('paralyze → fire is ×1.20', () => {
    const u = applyStatus(mk(), { id: 'paralyze', sourceId: 's' }, rng);
    expect(comboMultiplier(u, 'fire')).toBeCloseTo(1.2, 5);
  });
});

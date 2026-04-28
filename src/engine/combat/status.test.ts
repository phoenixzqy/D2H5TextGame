import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import {
  applyStatus,
  tickStatuses,
  removeStatus,
  hasStatus,
  getStacks,
  isStunned,
  dotDamageThisTick,
  spreadPlague,
  STATUS_DEFAULTS
} from './status';
import type { CombatUnit } from './types';

function mkUnit(over: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: 'u1',
    name: 'Unit',
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

const rng = createRng(1);

describe('status engine', () => {
  it('poison stacks up to 10', () => {
    let u = mkUnit();
    for (let i = 0; i < 15; i++) {
      u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    }
    expect(getStacks(u, 'poison')).toBe(10);
  });

  it('ignite stacks up to 5', () => {
    let u = mkUnit();
    for (let i = 0; i < 10; i++) {
      u = applyStatus(u, { id: 'ignite', sourceId: 's', dotPerStack: 3 }, rng);
    }
    expect(getStacks(u, 'ignite')).toBe(5);
  });

  it('chill is non-stacking and refreshes duration', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'chill', sourceId: 's' }, rng);
    u = tickStatuses(u);
    expect(u.statuses.find((s) => s.id === 'chill')?.remaining).toBe(1);
    u = applyStatus(u, { id: 'chill', sourceId: 's' }, rng);
    expect(u.statuses.find((s) => s.id === 'chill')?.remaining).toBe(STATUS_DEFAULTS.chill.duration);
    expect(getStacks(u, 'chill')).toBe(1);
  });

  it('freeze duration on bosses is halved', () => {
    let boss = mkUnit({ tier: 'boss' });
    boss = applyStatus(boss, { id: 'freeze', sourceId: 's', duration: 4 }, rng);
    expect(boss.statuses.find((s) => s.id === 'freeze')?.remaining).toBe(2);
  });

  it('tickStatuses removes expired and decrements rest', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'chill', sourceId: 's' }, rng); // dur 2
    u = applyStatus(u, { id: 'bleed', sourceId: 's', dotPerStack: 2 }, rng); // dur 3
    u = tickStatuses(u);
    u = tickStatuses(u);
    expect(hasStatus(u, 'chill')).toBe(false);
    expect(hasStatus(u, 'bleed')).toBe(true);
  });

  it('removeStatus drops a single status', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'chill', sourceId: 's' }, rng);
    u = applyStatus(u, { id: 'bleed', sourceId: 's', dotPerStack: 2 }, rng);
    u = removeStatus(u, 'chill');
    expect(hasStatus(u, 'chill')).toBe(false);
    expect(hasStatus(u, 'bleed')).toBe(true);
  });

  it('isStunned true under freeze/stun/paralyze', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'freeze', sourceId: 's' }, rng);
    expect(isStunned(u)).toBe(true);
  });

  it('paralyze diminishing-returns: 50% chance to fail when re-applied within 5 turns', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'paralyze', sourceId: 's' }, createRng(1));
    expect(hasStatus(u, 'paralyze')).toBe(true);
    expect(hasStatus(u, 'paralyze-cd')).toBe(true);
    // Try with a seed that makes chance(0.5) return true → applies
    u = removeStatus(u, 'paralyze');
    const r = createRng(2);
    let attempts = 0;
    let successes = 0;
    for (let i = 0; i < 200; i++) {
      const u2 = applyStatus(u, { id: 'paralyze', sourceId: 's' }, r);
      attempts++;
      if (hasStatus(u2, 'paralyze')) successes++;
    }
    // Should be roughly 50% of attempts (loose tolerance)
    expect(successes / attempts).toBeGreaterThan(0.3);
    expect(successes / attempts).toBeLessThan(0.7);
  });

  it('plague spreads stacks to others on death', () => {
    let src = mkUnit({ id: 'src' });
    src = applyStatus(src, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    src = applyStatus(src, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    src = applyStatus(src, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    src = applyStatus(src, { id: 'poison', sourceId: 's', dotPerStack: 5, damageType: 'poison' }, rng);
    expect(getStacks(src, 'poison')).toBe(4);
    const targets = [mkUnit({ id: 'a' }), mkUnit({ id: 'b' })];
    const out = spreadPlague(src, targets, 0.5, rng);
    const outA = out[0];
    const outB = out[1];
    expect(outA && getStacks(outA, 'poison')).toBe(2);
    expect(outB && getStacks(outB, 'poison')).toBe(2);
  });

  it('dotDamageThisTick sums damage across stacks', () => {
    let u = mkUnit();
    u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 4, damageType: 'poison' }, rng);
    u = applyStatus(u, { id: 'poison', sourceId: 's', dotPerStack: 4, damageType: 'poison' }, rng);
    u = applyStatus(u, { id: 'ignite', sourceId: 's', dotPerStack: 7 }, rng);
    const d = dotDamageThisTick(u);
    expect(d.total).toBe(4 * 2 + 7);
    expect(d.perStatus.get('poison')).toBe(8);
    expect(d.perStatus.get('ignite')).toBe(7);
  });
});

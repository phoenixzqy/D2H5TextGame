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
  it.each(['burn', 'ignite'])('uses the fire family defaults for a fresh %s without consuming RNG', (id) => {
    const input = mkUnit();
    const random = createRng(7);
    const control = createRng(7);
    const result = applyStatus(input, {
      id, sourceId: 'caster', simClockMs: 1000, dotPerStack: 3, damageType: 'fire'
    }, random);
    expect(result.statuses).toEqual([{
      id: 'ignite', sourceId: 'caster', stacks: 1, remaining: 3,
      appliedAtMs: 1000, expiresAtMs: 4000, dotPerStack: 3, damageType: 'fire'
    }]);
    expect(hasStatus(result, 'burn')).toBe(true);
    expect(hasStatus(result, 'ignite')).toBe(true);
    expect(getStacks(result, 'burn')).toBe(1);
    expect(getStacks(result, 'ignite')).toBe(1);
    expect(random.next()).toBe(control.next());
    expect(input.statuses).toEqual([]);
  });

  it('caps alternating fire aliases in one bucket and preserves the first potency/source/start', () => {
    let result = mkUnit();
    for (let i = 0; i < 10; i++) {
      result = applyStatus(result, {
        id: i % 2 === 0 ? 'burn' : 'ignite', sourceId: `caster-${String(i)}`,
        simClockMs: 1000 + i * 100, dotPerStack: 3 + i, damageType: 'fire'
      }, createRng(7));
    }
    expect(result.statuses).toEqual([{
      id: 'ignite', sourceId: 'caster-0', stacks: 5, remaining: 3,
      appliedAtMs: 1000, expiresAtMs: 4900, dotPerStack: 3, damageType: 'fire'
    }]);
    expect(getStacks(result, 'burn')).toBe(5);
  });

  it.each(['burn', 'ignite'])('reads and refreshes an active legacy %s without changing its payload', (id) => {
    const old = {
      id, sourceId: 'old', stacks: 4, remaining: 1, appliedAtMs: 500,
      expiresAtMs: 10_000, dotPerStack: 3, damageType: 'fire' as const
    };
    const input = mkUnit({ statuses: [old] });
    const before = structuredClone(input);
    expect(hasStatus(input, id === 'burn' ? 'ignite' : 'burn')).toBe(true);
    expect(getStacks(input, id === 'burn' ? 'ignite' : 'burn')).toBe(4);
    const result = applyStatus(input, {
      id: id === 'burn' ? 'ignite' : 'burn', sourceId: 'new', simClockMs: 1700,
      dotPerStack: 99, damageType: 'poison'
    }, createRng(7));
    expect(result.statuses).toEqual([{ ...old, stacks: 5, remaining: 3 }]);
    expect(input).toEqual(before);
  });

  it('extends finite legacy burn expiry but preserves an indefinite rate-less record', () => {
    const old = { id: 'burn', sourceId: 'old', stacks: 2, remaining: 1 };
    const indefinite = mkUnit({ statuses: [old] });
    const refreshed = applyStatus(indefinite, {
      id: 'ignite', sourceId: 'new', simClockMs: 1700, dotPerStack: 99
    }, createRng(7));
    expect(refreshed.statuses).toEqual([{ ...old, stacks: 3, remaining: 3 }]);
    const finite = { ...old, appliedAtMs: 500, expiresAtMs: 2000, dotPerStack: 2 };
    const extended = applyStatus(mkUnit({ statuses: [finite] }), {
      id: 'ignite', sourceId: 'new', simClockMs: 1700, dotPerStack: 99
    }, createRng(7));
    expect(extended.statuses).toEqual([{ ...finite, stacks: 3, remaining: 3, expiresAtMs: 4700 }]);
    expect(indefinite.statuses).toEqual([old]);
  });

  it.each([[0, 1000], [3000, 4000]])('replaces inactive legacy burn clocks %s..%s as fresh ignite', (start, end) => {
    const old = { id: 'burn', sourceId: 'old', stacks: 4, remaining: 1,
      appliedAtMs: start, expiresAtMs: end, dotPerStack: 99 };
    const unrelated = { id: 'chill', sourceId: 'other', stacks: 1, remaining: 2 };
    const input = mkUnit({ statuses: [old, unrelated] });
    const result = applyStatus(input, {
      id: 'ignite', sourceId: 'new', simClockMs: 1700, dotPerStack: 2
    }, createRng(7));
    expect(result.statuses).toEqual([{
      id: 'ignite', sourceId: 'new', stacks: 1, remaining: 3,
      appliedAtMs: 1700, expiresAtMs: 4700, dotPerStack: 2
    }, unrelated]);
    expect(result.statuses[1]).toBe(unrelated);
    expect(input.statuses).toEqual([old, unrelated]);
  });

  it.each(['burn', 'ignite'])('keeps first-match reads/refresh and preserves other mixed records when queried as %s', (query) => {
    const first = { id: 'burn', sourceId: 'first', stacks: 2, remaining: 1,
      appliedAtMs: 500, expiresAtMs: 2000, dotPerStack: 3 };
    const second = { id: 'ignite', sourceId: 'second', stacks: 4, remaining: 2,
      appliedAtMs: 400, expiresAtMs: 9000, dotPerStack: 8 };
    const unrelated = { id: 'poison', sourceId: 'other', stacks: 1, remaining: 2 };
    const input = mkUnit({ statuses: [first, second, unrelated] });
    const before = structuredClone(input);
    expect(getStacks(input, query)).toBe(2);
    const result = applyStatus(input, {
      id: query, sourceId: 'new', simClockMs: 1700, dotPerStack: 99
    }, createRng(7));
    expect(result.statuses).toEqual([
      { ...first, stacks: 3, remaining: 3, expiresAtMs: 4700 }, second, unrelated
    ]);
    expect(result.statuses[1]).toBe(second);
    expect(removeStatus(result, query).statuses).toEqual([unrelated]);
    expect(input).toEqual(before);
  });

  it('honors explicit fire configuration and leaves unrelated status names unchanged', () => {
    const result = applyStatus(mkUnit(), {
      id: 'burn', sourceId: 'caster', simClockMs: 1000,
      config: { duration: 4, maxStacks: 2 }
    }, createRng(7));
    expect(result.statuses[0]).toEqual({ id: 'ignite', sourceId: 'caster', stacks: 1,
      remaining: 4, appliedAtMs: 1000, expiresAtMs: 5000 });
    const unknown = applyStatus(mkUnit(), { id: 'burning-other', sourceId: 's' }, createRng(7));
    expect(unknown.statuses[0]?.id).toBe('burning-other');
    expect(unknown.statuses[0]?.remaining).toBe(1);
    expect(hasStatus(unknown, 'burn')).toBe(false);
    expect(getStacks(unknown, 'ignite')).toBe(0);
  });

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

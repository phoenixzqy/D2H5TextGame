import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_PANIC_DEFINITION, MONSTER_PANIC_SKILL, matchesMonsterPanic, resolveMonsterPanic } from './monster-panic';

const row = rows.find(row => row.id === 'monster-panic-flee');
if (!row) throw new Error('Missing authored Panic');
describe('authored native Panic leaf', () => {
  it('validates, detaches and freezes duration/dodge/payment without mutating input', () => {
    const input = structuredClone(row), before = structuredClone(input), definition = resolveMonsterPanic([input]);
    expect(definition).toEqual({ durationMs: 5000, dodgeChance: 0.2, cooldown: 5, manaCost: 0, minLevel: 1 });
    expect(input).toEqual(before);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(definition).not.toBe(MONSTER_PANIC_DEFINITION);
  });
  it.each([{ input: [] }, { input: [row, row] }, { input: [null, 42, {}] }])('rejects absent or duplicate source %j', ({ input }) => {
    expect(() => resolveMonsterPanic(input)).toThrow(/Panic/);
  });
  it.each([{ cooldown: 4 }, { cost: { mana: 1 } }, { target: 'single-enemy' }, { scaling: {} },
    { panicFlee: { durationMs: 5001, dodgeChance: 0.2 } }, { panicFlee: { durationMs: 5000, dodgeChance: 20 } },
    { panicFlee: { durationMs: 5000, dodgeChance: 0.2, maxUses: 2 } }, { panicFlee: undefined }])(
    'rejects unreviewed authored semantics %j', fields => {
      expect(() => resolveMonsterPanic([{ ...row, ...fields }])).toThrow(/Panic/);
    });
  it.each(['monster.panic_flee', 'monster-panic-flee'])('accepts only closed native semantics through %s', id => {
    const original = { ...MONSTER_PANIC_SKILL, id };
    expect(matchesMonsterPanic(original)).toBe(true);
    for (const fields of [{ cooldown: 4 }, { manaCost: 1 }, { isBuff: true }, { unexpected: true },
      { effects: [{ kind: 'buff' as const, id: 'panic_flee', duration: -1 }] }, { effects: [] },
      { effects: [...original.effects, { kind: 'monster-panic-flee' as const }] }])
      expect(matchesMonsterPanic({ ...original, ...fields })).toBe(false);
    const inherited = { ...original };
    Object.setPrototypeOf(inherited, { extra: true });
    expect(matchesMonsterPanic(inherited)).toBe(false);
    expect(matchesMonsterPanic({ ...original, [Symbol('extra')]: true })).toBe(false);
    const accessor = { ...original };
    Object.defineProperty(accessor, 'cooldown', { get: () => 5 });
    expect(matchesMonsterPanic(accessor)).toBe(false);
  });
});

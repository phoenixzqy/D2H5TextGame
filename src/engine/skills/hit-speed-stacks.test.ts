import { expect, it } from 'vitest';
import type { CombatUnit } from '../combat/types';
import { activeHitSpeedStack, copyHitSpeedStackStatuses, gainHitSpeedStack, type HitSpeedStackDefinition } from './hit-speed-stacks';
const definition: HitSpeedStackDefinition = { id: 'frenzy', marker: 'frenzy', rankField: 'frenzyRank',
  requiredLevel: 24, maxRank: 20, attackSpeedPctPerStack: .05, maxStacks: 5, durationMs: 6000 };
function hero(): CombatUnit {
  return {
    id: 'hero',
    name: 'Synthetic Feral owner',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 100,
    mana: 100,
    frenzyRank: 1,
    stats: {
      life: 100,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false
  };
}
it('caps and refreshes finite stacks without mutating the owner or base stats', () => {
  const original = hero(), before = structuredClone(original); let unit = original;
  for (let n = 1; n <= 7; n++) {
    unit = gainHitSpeedStack(unit, n * 100, definition);
    expect(activeHitSpeedStack(unit, n * 100, definition)).toMatchObject({ stacks: Math.min(n, 5), expiresAtMs: n * 100 + 6000 });
  }
  expect(original).toEqual(before); expect(unit.stats).toEqual(before.stats);
  expect(activeHitSpeedStack(unit, 6699.999, definition)?.stacks).toBe(5);
  expect(activeHitSpeedStack(unit, 6700, definition)).toBeUndefined();
});
it('does not amplify duplicate markers and independently copies authenticated records', () => {
  const paid = gainHitSpeedStack(hero(), 100, definition), marker = paid.statuses[0];
  if (!marker) throw new Error('Missing paid status');
  const copied = copyHitSpeedStackStatuses({ ...paid, statuses: [marker, marker] }, definition);
  expect(activeHitSpeedStack(copied, 100, definition)?.stacks).toBe(1);
  expect(copied.statuses[0]).not.toBe(marker); expect(copied.stats).toBe(paid.stats);
});
it('rejects wrong ownership, payloads, clocks and lifecycle boundaries', () => {
  const paid = gainHitSpeedStack(hero(), 100, definition), marker = paid.statuses[0];
  if (!marker) throw new Error('Missing paid status');
  const missing = { ...marker }; Reflect.deleteProperty(missing, 'frenzy');
  expect(activeHitSpeedStack({ ...paid, statuses: [missing] }, 101, definition)).toBeUndefined();
  for (const patch of [{ id: 'other' }, { sourceId: 'foreign' },
    { stacks: 0 }, { stacks: 6 }, { stacks: 1.5 }, { remaining: -1 },
    { appliedAtMs: NaN }, { expiresAtMs: Infinity }, { expiresAtMs: 6101 }, { tags: ['physical' as const] }]) {
    const unit = { ...paid, statuses: [{ ...marker, ...patch }] };
    expect(activeHitSpeedStack(unit, 101, definition)).toBeUndefined();
    expect(copyHitSpeedStackStatuses(unit, definition).statuses).toEqual([]);
  }
  for (const patch of [{ side: 'enemy' as const }, { kind: 'merc' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }, { life: 0 }, { level: 23 },
    { frenzyRank: 0 }, { frenzyRank: 21 }, { frenzyRank: 1.5 }]) {
    const unit = { ...paid, ...patch };
    expect(activeHitSpeedStack(unit, 101, definition)).toBeUndefined();
    expect(gainHitSpeedStack(unit, 101, definition)).toBe(unit);
  }
  expect(activeHitSpeedStack(paid, NaN, definition)).toBeUndefined();
  expect(gainHitSpeedStack(paid, Infinity, definition)).toBe(paid);
});

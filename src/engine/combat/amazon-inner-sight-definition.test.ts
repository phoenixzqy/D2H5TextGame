import { expect, it } from 'vitest';
import rows from '../../data/skills/amazon.json';
import type { CombatUnit } from './types';
import { AMAZON_INNER_SIGHT_DEFINITION, activeAmazonInnerSight, isAmazonInnerSightDefinition,
  paidAmazonInnerSight, resolveAmazonInnerSightDefinition } from './amazon-inner-sight-definition';

function authored() {
  const row = rows.find(row => row.id === 'skills-amazon-inner-sight');
  if (!row) throw new Error('Missing authored Amazon Inner Sight');
  return structuredClone(row);
}
it('copies complete authored tuning into immutable values without mutating callers', () => {
  const row = authored(), before = structuredClone(row), out = resolveAmazonInnerSightDefinition([row]);
  expect(out).toEqual({ durationMs: 8000, defenseReductionPct: 25 });
  expect(out).toEqual(AMAZON_INNER_SIGHT_DEFINITION);
  expect(Object.isFrozen(out)).toBe(true);
  expect(Object.isFrozen(row)).toBe(false);
  expect(row).toEqual(before);
  expect(paidAmazonInnerSight()).toEqual({ defenseReductionPct: 25 });
  expect(Object.isFrozen(paidAmazonInnerSight())).toBe(true);
  expect(paidAmazonInnerSight()).not.toBe(paidAmazonInnerSight());
  expect(row).not.toHaveProperty('appliesTags');
  expect(row.scaling).not.toHaveProperty('passiveStatsPerLevel');
});
it('consumes valid authored finite fractional values rather than hardcoding tuning', () => {
  const row = { ...authored(), statusEffect: { durationMs: 0.5, defenseReductionPct: 12.5 } };
  expect(resolveAmazonInnerSightDefinition([row])).toEqual({ durationMs: 0.5, defenseReductionPct: 12.5 });
  expect(isAmazonInnerSightDefinition(row)).toBe(true);
});
it('requires exactly one exact authored identity', () => {
  for (const list of [[], [null, 42, {}], [{ ...authored(), id: 'mskill-inner-sight' }], [authored(), authored()]])
    expect(() => resolveAmazonInnerSightDefinition(list)).toThrow(/Amazon Inner Sight/);
  expect(resolveAmazonInnerSightDefinition([null, {}, authored()])).toEqual(AMAZON_INNER_SIGHT_DEFINITION);
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 8000 } },
  { statusEffect: { defenseReductionPct: 25 } },
  ...[0, -1, 100.1, NaN, Infinity, '25', null].map(defenseReductionPct => ({ statusEffect: { durationMs: 8000, defenseReductionPct } })),
  ...[0, -1, NaN, Infinity, '8000', null].map(durationMs => ({ statusEffect: { durationMs, defenseReductionPct: 25 } })),
  { statusEffect: { durationMs: 8000, defenseReductionPct: 25, chance: 1 } },
  { target: 'self' }, { trigger: 'passive' }, { passive: true }, { aura: true }, { summon: true },
  { appliesStatus: [] }, { appliesStatus: ['merc-inner-sight'] }, { appliesStatus: ['inner-sight', 'freeze'] },
  { damage: { min: 1, max: 2 }, damageType: 'physical' }, { appliesTags: ['amp-damage'] },
  { cooldown: 0.5 }, { cost: {} }, { cost: undefined }, { maxLevel: 21 },
  { scaling: { passiveStatsPerLevel: { physicalDamagePct: .01 } } }
])('rejects incomplete or contradictory authored capability %j', patch => {
  const row = { ...authored(), ...patch };
  expect(isAmazonInnerSightDefinition(row)).toBe(false);
  expect(() => resolveAmazonInnerSightDefinition([row])).toThrow(/Amazon Inner Sight/);
});
function unit(): CombatUnit {
  return { id: 'target', name: 'target', side: 'enemy', kind: 'monster', tier: 'trash', level: 1, life: 100, mana: 0,
    stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 100, defense: 50, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [{ id: 'inner-sight', sourceId: 'absent-source', stacks: 1, remaining: 8,
      appliedAtMs: 1700, expiresAtMs: 9700, innerSight: paidAmazonInnerSight() }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
it('accepts a paid half-open interval and preserves rebased and fractional clocks after source death', () => {
  const u = unit(), before = structuredClone(u);
  expect(activeAmazonInnerSight(u, 1700)).toEqual({ defenseReductionPct: 25 });
  expect(activeAmazonInnerSight(u, 9699.999)).toEqual({ defenseReductionPct: 25 });
  for (const clock of [1699.999, 9700, NaN, Infinity]) expect(activeAmazonInnerSight(u, clock)).toBeUndefined();
  for (const shift of [-2000, .125]) {
    const rebased = { ...u, statuses: u.statuses.map(s => ({ ...s, appliedAtMs: 1700 + shift, expiresAtMs: 9700 + shift })) };
    expect(activeAmazonInnerSight(rebased, 1700 + shift)).toEqual({ defenseReductionPct: 25 });
    expect(activeAmazonInnerSight(rebased, 9700 + shift)).toBeUndefined();
  }
  expect(u).toEqual(before);
});
it.each([
  { innerSight: { defenseReductionPct: 100 } },
  { innerSight: { defenseReductionPct: NaN } }, { stacks: 2 }, { id: 'merc-inner-sight' },
  { appliedAtMs: NaN }, { expiresAtMs: Infinity },
  { expiresAtMs: 1700 }, { expiresAtMs: 9700.1 }, { expiresAtMs: 9699.9 }
])('rejects bare, malformed and forged paid packets %j', patch => {
  const u = unit();
  expect(activeAmazonInnerSight({ ...u, statuses: u.statuses.map(s => ({ ...s, ...patch })) }, 2000)).toBeUndefined();
});
it.each(['innerSight', 'appliedAtMs', 'expiresAtMs'] as const)('rejects a packet missing %s', field => {
  const u = unit(), statuses = u.statuses.map(status => {
    const copy = { ...status };
    if (field === 'innerSight') delete copy.innerSight;
    else if (field === 'appliedAtMs') delete copy.appliedAtMs;
    else delete copy.expiresAtMs;
    return copy;
  });
  expect(activeAmazonInnerSight({ ...u, statuses }, 2000)).toBeUndefined();
});

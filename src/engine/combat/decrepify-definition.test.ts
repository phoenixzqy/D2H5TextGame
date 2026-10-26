import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createRng } from '../rng';
import { createSkillValidator } from '../skills/skill-validator';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { activeDecrepify, DECREPIFY_DEFINITION, paidDecrepify, resolveDecrepifyDefinition } from './decrepify-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses, statusActiveAt } from './status';
import type { ActiveStatus, CombatUnit } from './types';

const row = rows.find(r => r.id === 'skills-necromancer-decrepify');
if (!row) throw new Error('Missing authored Decrepify');
const validate = createSkillValidator();
function unit(): CombatUnit {
  return { id: 'target', name: 'Synthetic curse target', side: 'enemy', kind: 'monster', tier: 'trash', level: 30,
    life: 1000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [], enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function paid(start = 400): CombatUnit {
  return applyStatus(unit(), { id: 'decrepify', sourceId: 'owner', simClockMs: start,
    durationMs: 3000, decrepify: paidDecrepify() }, createRng(1));
}
it('validates the authored complete curse and emits one finite nondamaging debuff', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(DECREPIFY_DEFINITION).toEqual({ durationMs: 3000, attackSpeedReductionPct: 50, damageReductionPct: 33 });
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed curse');
  expect(registeredSkillFromJson(typed).effects).toEqual([
    { kind: 'debuff', statusId: 'decrepify', durationMs: 3000, decrepify: true }
  ]);
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} },
  { statusEffect: { durationMs: 3000, damageReductionPct: 33 } },
  { statusEffect: { durationMs: 3000, attackSpeedReductionPct: 50 } },
  ...[0, -1, NaN, Infinity].map(durationMs => ({ statusEffect: { ...row.statusEffect, durationMs } })),
  ...[-1, 100, NaN, Infinity].flatMap(value => [
    { statusEffect: { ...row.statusEffect, attackSpeedReductionPct: value } },
    { statusEffect: { ...row.statusEffect, damageReductionPct: value } }
  ]),
  { statusEffect: { ...row.statusEffect, physicalResistReductionPct: 50 } },
  { trigger: 'passive' }, { target: 'self' }, { maxLevel: 21 }, { requiredLevel: 23 },
  { prerequisites: [] }, { cooldown: 0 }, { cost: { mana: 0 } }, { scaling: { costPerLevel: 0 } },
  { appliesStatus: ['decrepify', 'weaken'] }, { damage: { min: 1, max: 1 } }, { damageType: 'physical' }
])('rejects incomplete, nonfinite or contradictory authored curse %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false);
  expect(() => resolveDecrepifyDefinition([invalid])).toThrow();
});
it('copies and freezes scalar tuning without freezing the source; rejects missing and duplicate rows', () => {
  const source = structuredClone(rows), definition = resolveDecrepifyDefinition(source);
  const curse = source.find(r => r.id === row.id);
  if (!curse?.statusEffect) throw new Error('Missing copied curse');
  curse.statusEffect.attackSpeedReductionPct = 40;
  expect(definition.attackSpeedReductionPct).toBe(50);
  expect(Object.isFrozen(definition)).toBe(true);
  expect(Object.isFrozen(curse.statusEffect)).toBe(false);
  expect(resolveDecrepifyDefinition(source).attackSpeedReductionPct).toBe(40);
  expect(() => resolveDecrepifyDefinition([])).toThrow();
  expect(() => resolveDecrepifyDefinition([...rows, row])).toThrow();
  expect(() => resolveDecrepifyDefinition([...rows, null, {}, rows[0]])).not.toThrow();
  expect(Object.isFrozen(paidDecrepify())).toBe(true);
});
it('the adapter grants no paid capability to incomplete or contradictory curse metadata', () => {
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed curse');
  for (const statusEffect of [{}, { durationMs: 3000, physicalResistReductionPct: 50 },
    { durationMs: 3000, attackSpeedReductionPct: 50 },
    { durationMs: 3000, attackSpeedReductionPct: Infinity, damageReductionPct: 33 }])
    expect(registeredSkillFromJson({ ...typed, statusEffect }).effects).toEqual([{ kind: 'debuff', statusId: 'decrepify' }]);
  expect(registeredSkillFromJson({ ...typed, appliesStatus: ['amplify-damage'] }).effects)
    .toEqual([{ kind: 'debuff', statusId: 'amplify-damage' }]);
});
it('activates exactly on the paid interval, preserves rebased fractional time and survives source absence', () => {
  const target = paid(400.1);
  expect(activeDecrepify(target, 400.099)).toBeUndefined();
  expect(activeDecrepify(target, 400.1)).toEqual(paidDecrepify());
  expect(activeDecrepify(target, 3400.1)).toBeUndefined();
  const carried = rebaseStatusClock(target, 1000.2);
  expect(activeDecrepify(carried, 0)).toEqual(paidDecrepify());
  expect(carried.statuses[0]?.sourceId).toBe('owner');
  for (const clock of [NaN, Infinity, -Infinity]) expect(activeDecrepify(target, clock)).toBeUndefined();
});
it('replaces its copied source, potency and interval on refresh without stacking or mutating inputs', () => {
  const payload = { attackSpeedReductionPct: 50, damageReductionPct: 33 };
  const first = applyStatus({ ...unit(), statuses: [{ id: 'other', sourceId: 'other', stacks: 1, remaining: -1 }] },
    { id: 'decrepify', sourceId: 'first', simClockMs: 400, durationMs: 3000, decrepify: payload }, createRng(1));
  payload.damageReductionPct = 99;
  const before = structuredClone(first);
  const second = applyStatus(first, { id: 'decrepify', sourceId: 'second', simClockMs: 1000,
    durationMs: 3000, decrepify: paidDecrepify() }, createRng(1));
  expect(first).toEqual(before);
  expect(first.statuses.find(s => s.id === 'decrepify')?.decrepify?.damageReductionPct).toBe(33);
  expect(second.statuses.filter(s => s.id === 'decrepify')).toHaveLength(1);
  expect(second.statuses.find(s => s.id === 'decrepify')).toMatchObject({ sourceId: 'second', stacks: 1,
    appliedAtMs: 1000, expiresAtMs: 4000, decrepify: paidDecrepify() });
  expect(Object.isFrozen(second.statuses.find(s => s.id === 'decrepify')?.decrepify)).toBe(true);
  expect(second.statuses[0]).toEqual(first.statuses[0]);
});
it('Cleansing shortens the actual finite interval once while keeping potency until the new expiry', () => {
  const first = paid(), shorter = shortenCleansingStatuses(first, 1000, .5);
  expect(shorter.statuses[0]).toMatchObject({ appliedAtMs: 400, expiresAtMs: 2200, cleansingShortened: true });
  expect(activeDecrepify(shorter, 2199.9)).toEqual(paidDecrepify());
  expect(activeDecrepify(shorter, 2200)).toBeUndefined();
  const marker = shorter.statuses[0];
  if (!marker) throw new Error('Missing shortened curse');
  expect(statusActiveAt(marker, 2200)).toBe(false);
  expect(shortenCleansingStatuses(shorter, 1500, .5)).toBe(shorter);
  const fresh = applyStatus(shorter, { id: 'decrepify', sourceId: 'new', simClockMs: 2000,
    durationMs: 3000, decrepify: paidDecrepify(), cleansingDurationMultiplier: .5 }, createRng(1));
  expect(fresh.statuses[0]).toMatchObject({ sourceId: 'new', appliedAtMs: 2000, expiresAtMs: 3500 });
  expect(activeDecrepify(fresh, 3000)).toEqual(paidDecrepify());
});
it.each<Partial<ActiveStatus>>([
  { id: 'other' }, { stacks: 0 }, { stacks: 2 }, { appliedAtMs: Infinity }, { appliedAtMs: NaN },
  { expiresAtMs: Infinity }, { expiresAtMs: NaN }, { expiresAtMs: 400 }, { expiresAtMs: 399 },
  { expiresAtMs: 3400.01 }, { decrepify: { attackSpeedReductionPct: 49, damageReductionPct: 33 } },
  { decrepify: { attackSpeedReductionPct: 50, damageReductionPct: 32 } }
])('grants no power for malformed status %j', patch => {
  const target = paid();
  expect(activeDecrepify({ ...target, statuses: target.statuses.map(s => ({ ...s, ...patch })) }, 1000)).toBeUndefined();
});
it('bare, legacy and incomplete markers grant no potency', () => {
  const target = paid(), marker = { id: 'decrepify', sourceId: 'owner', stacks: 1, remaining: 3 };
  for (const status of [marker, { ...marker, decrepify: paidDecrepify() },
    { ...marker, appliedAtMs: 400, expiresAtMs: 3400 },
    { ...marker, appliedAtMs: 400, decrepify: paidDecrepify() }])
    expect(activeDecrepify({ ...target, statuses: [status] }, 1000)).toBeUndefined();
});

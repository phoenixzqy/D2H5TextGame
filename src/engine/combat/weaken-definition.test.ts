import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createRng } from '../rng';
import { createSkillValidator } from '../skills/skill-validator';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { activeWeaken, paidWeaken, resolveWeakenDefinition, WEAKEN_DEFINITION } from './weaken-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses } from './status';
import type { ActiveStatus, CombatUnit } from './types';

const row = rows.find(r => r.id === 'skills-necromancer-weaken');
if (!row) throw new Error('Missing authored Weaken');
const validate = createSkillValidator();
function unit(): CombatUnit {
  return { id: 'target', name: 'Synthetic Weaken target', side: 'enemy', kind: 'monster', tier: 'trash', level: 30,
    life: 1000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [], enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function paid(start = 400): CombatUnit {
  return applyStatus(unit(), { id: 'weaken', sourceId: 'owner', simClockMs: start,
    durationMs: 3000, weaken: paidWeaken() }, createRng(1));
}
it('validates the complete authored curse and emits one finite nondamaging debuff', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(WEAKEN_DEFINITION).toEqual({ durationMs: 3000, damageReductionPct: 33 });
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed curse');
  expect(registeredSkillFromJson(typed).effects).toEqual([{ kind: 'debuff', statusId: 'weaken', durationMs: 3000, weaken: true }]);
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 3000 } },
  { statusEffect: { damageReductionPct: 33 } },
  ...[0, -1, NaN, Infinity].map(durationMs => ({ statusEffect: { ...row.statusEffect, durationMs } })),
  ...[-1, 100, NaN, Infinity].map(damageReductionPct => ({ statusEffect: { ...row.statusEffect, damageReductionPct } })),
  { statusEffect: { ...row.statusEffect, attackSpeedReductionPct: 50 } },
  { statusEffect: { ...row.statusEffect, physicalResistReductionPct: 50 } },
  { trigger: 'passive' }, { target: 'self' }, { maxLevel: 21 }, { requiredLevel: 5 }, { prerequisites: [] },
  { cooldown: 0 }, { cost: { mana: 0 } }, { scaling: { costPerLevel: 0 } },
  { appliesStatus: ['weaken', 'decrepify'] }, { damage: { min: 1, max: 1 } }, { damageType: 'physical' }
])('rejects incomplete, nonfinite or contradictory authored Weaken %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false);
  expect(() => resolveWeakenDefinition([invalid])).toThrow();
});
it('copies immutable scalar tuning while leaving source ownership intact and refusing duplicates', () => {
  const source = structuredClone(rows), definition = resolveWeakenDefinition(source), curse = source.find(r => r.id === row.id);
  if (!curse?.statusEffect) throw new Error('Missing copied curse');
  curse.statusEffect.damageReductionPct = 40;
  expect(definition.damageReductionPct).toBe(33);
  expect(Object.isFrozen(definition)).toBe(true);
  expect(Object.isFrozen(curse.statusEffect)).toBe(false);
  expect(resolveWeakenDefinition(source).damageReductionPct).toBe(40);
  expect(() => resolveWeakenDefinition([])).toThrow();
  expect(() => resolveWeakenDefinition([...rows, row])).toThrow();
  expect(() => resolveWeakenDefinition([...rows, null, {}, rows[0]])).not.toThrow();
  expect(Object.isFrozen(paidWeaken())).toBe(true);
});
it('grants no paid adapter capability from partial or mismatched metadata', () => {
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed curse');
  for (const statusEffect of [{}, { durationMs: 3000 }, { damageReductionPct: 33 },
    { durationMs: 3000, damageReductionPct: Infinity },
    { durationMs: 3000, damageReductionPct: 33, attackSpeedReductionPct: 50 }])
    expect(registeredSkillFromJson({ ...typed, statusEffect }).effects).toEqual([{ kind: 'debuff', statusId: 'weaken' }]);
  expect(registeredSkillFromJson({ ...typed, appliesStatus: ['amplify-damage'] }).effects)
    .toEqual([{ kind: 'debuff', statusId: 'amplify-damage' }]);
});
it('uses the exact finite interval including fractional rebasing without requiring a live source', () => {
  const target = paid(400.1);
  expect(activeWeaken(target, 400.099)).toBeUndefined();
  expect(activeWeaken(target, 400.1)).toEqual(paidWeaken());
  expect(activeWeaken(target, 3400.1)).toBeUndefined();
  const carried = rebaseStatusClock(target, 1000.2);
  expect(activeWeaken(carried, 0)).toEqual(paidWeaken());
  expect(carried.statuses[0]?.sourceId).toBe('owner');
  for (const clock of [NaN, Infinity, -Infinity]) expect(activeWeaken(target, clock)).toBeUndefined();
});
it('replaces one copied paid source and interval on refresh without mutation or stacking', () => {
  const payload = { damageReductionPct: 33 }, other = { id: 'other', sourceId: 'other', stacks: 1, remaining: -1 };
  const first = applyStatus({ ...unit(), statuses: [other] }, { id: 'weaken', sourceId: 'first', simClockMs: 400,
    durationMs: 3000, weaken: payload }, createRng(1));
  payload.damageReductionPct = 99;
  const before = structuredClone(first), second = applyStatus(first, { id: 'weaken', sourceId: 'second', simClockMs: 1000,
    durationMs: 3000, weaken: paidWeaken() }, createRng(1));
  expect(first).toEqual(before);
  expect(first.statuses.find(s => s.id === 'weaken')?.weaken).toEqual({ damageReductionPct: 33 });
  expect(second.statuses.filter(s => s.id === 'weaken')).toEqual([expect.objectContaining({ sourceId: 'second', stacks: 1,
    appliedAtMs: 1000, expiresAtMs: 4000, weaken: paidWeaken() })]);
  expect(Object.isFrozen(second.statuses.find(s => s.id === 'weaken')?.weaken)).toBe(true);
  expect(second.statuses[0]).toEqual(other);
});
it('Cleansing shortens once and a fresh paid application uses its own shortened interval', () => {
  const shorter = shortenCleansingStatuses(paid(), 1000, .5);
  expect(shorter.statuses[0]).toMatchObject({ appliedAtMs: 400, expiresAtMs: 2200, cleansingShortened: true });
  expect(activeWeaken(shorter, 2199.9)).toEqual(paidWeaken());
  expect(activeWeaken(shorter, 2200)).toBeUndefined();
  expect(shortenCleansingStatuses(shorter, 1500, .5)).toBe(shorter);
  const fresh = applyStatus(shorter, { id: 'weaken', sourceId: 'new', simClockMs: 2000,
    durationMs: 3000, weaken: paidWeaken(), cleansingDurationMultiplier: .5 }, createRng(1));
  expect(fresh.statuses[0]).toMatchObject({ sourceId: 'new', appliedAtMs: 2000, expiresAtMs: 3500 });
  expect(activeWeaken(fresh, 3000)).toEqual(paidWeaken());
});
it.each<Partial<ActiveStatus>>([
  { id: 'other' }, { stacks: 0 }, { stacks: 2 }, { appliedAtMs: Infinity }, { appliedAtMs: NaN },
  { expiresAtMs: Infinity }, { expiresAtMs: NaN }, { expiresAtMs: 400 }, { expiresAtMs: 399 },
  { expiresAtMs: 3400.01 }, { weaken: { damageReductionPct: 32 } }, { weaken: { damageReductionPct: NaN } }
])('grants no damage reduction for malformed status %j', patch => {
  const target = paid();
  expect(activeWeaken({ ...target, statuses: target.statuses.map(s => ({ ...s, ...patch })) }, 1000)).toBeUndefined();
});
it('bare, legacy and incomplete markers never confer power', () => {
  const target = paid(), marker = { id: 'weaken', sourceId: 'owner', stacks: 1, remaining: 3 };
  for (const status of [marker, { ...marker, weaken: paidWeaken() },
    { ...marker, appliedAtMs: 400, expiresAtMs: 3400 }, { ...marker, appliedAtMs: 400, weaken: paidWeaken() }])
    expect(activeWeaken({ ...target, statuses: [status] }, 1000)).toBeUndefined();
});

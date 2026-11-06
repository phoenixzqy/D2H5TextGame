// Native delivery prerequisite only; no Frozen Armor or gameplay acceptance claim.
import { afterEach, beforeEach, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import monsters from '../../data/monsters/act1.json';
import schema from '../../data/schema/monster.schema.json';
import * as weapons from '../items/equipped-weapon';
import type { Item } from '../types/items';
import type { MonsterDef } from '../types/monsters';
import type { RegisteredSkill } from '../skills/effects';
import type { CombatUnit } from './types';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { buildSummon } from '../skills/summons';
import * as registry from '../skills/registry';

type Delivery = 'melee' | 'primary-melee' | 'ranged' | 'spell';
// Optional adapter lets causal RED collect against the parent lacking the API.
// GREEN must supply the actual API; undefined can never satisfy a positive oracle.
const delivery = (skill: RegisteredSkill) => (registry as {
  getSkillDamageDelivery?: (skill: RegisteredSkill) => Delivery | undefined;
}).getSkillDamageDelivery?.(skill);
const basic = (unit: CombatUnit | undefined) => (unit as (CombatUnit & {
  readonly basicAttackDelivery?: Delivery | 'none';
}) | undefined)?.basicAttackDelivery;
const skill = (id: string) => {
  const found = registry.getSkill(id);
  if (!found) throw new Error('Missing native fixture skill: ' + id);
  return found;
};
const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(schema);
function definition(id: string): MonsterDef {
  const row: unknown = monsters.find(candidate => candidate.id === id);
  if (!validate(row)) throw new Error('Invalid authored monster: ' + id);
  return row;
}
function monster(def: MonsterDef) {
  return buildMonsterUnit({ def, level: 30, tier: 'trash', rng: createRng(7) });
}
beforeEach(() => { registry.resetRegistry(); registry.loadDefaultSkills(); });
afterEach(() => { registry.resetRegistry(); registry.loadDefaultSkills(); });

it.each([
  ['skills-amazon-jab', 'melee'], ['amazon.power_strike', 'melee'],
  ['amazon.lightning_strike', 'primary-melee'], ['assassin.dragon_tail', 'primary-melee'],
  ['assassin.phoenix_strike', 'melee'], ['assassin.dragon_talon', 'melee'],
  ['barbarian.berserk', 'melee'], ['barbarian.whirlwind', 'melee'],
  ['barbarian.war_cry', 'spell'], ['barbarian.double_throw', 'ranged'],
  ['druid.fire_claws', 'melee'], ['druid.rabies', 'melee'], ['druid.tornado', 'spell'],
  ['necromancer.poison_dagger', 'melee'], ['paladin.vengeance', 'melee'],
  ['mskill-jab', 'melee'], ['mskill-bash', 'melee'], ['mskill-pilfer', 'melee'],
  ['mskill-basic-arrow', 'ranged'], ['mskill-pierce-arrow', 'ranged'],
  ['mskill-telekinesis', 'spell'], ['monster-weak-melee', 'melee'],
  ['monster-strong-melee', 'melee'], ['monster-poison-dagger', 'melee'],
  ['monster-weak-ranged', 'ranged'], ['monster-blood-raven-fire-arrow', 'ranged']
] as const)('classifies final native %s as %s without changing its semantics', (id, expected) => {
  const native = skill(id), before = structuredClone(native);
  expect(delivery(native)).toBe(expected);
  expect(native).toEqual(before);
});

it.each([
  ['monsters/act1.zombie', 'melee'], ['monsters/act1.quill-rat', 'melee'],
  ['monsters/act1.blood-raven', 'ranged'], ['monsters/act1.coldcrow', 'ranged']
] as const)('projects the authored %s basic as %s', (id, expected) => {
  const def = definition(id), before = structuredClone(def);
  const unit = monster(def);
  expect(basic(unit)).toBe(expected);
  expect(unit.stats).not.toHaveProperty('basicAttackDelivery');
  expect(def).toEqual(before);
});

it.each([
  ['skeleton', 'melee'], ['fire_golem', 'melee'], ['skeletal_mage', 'spell'],
  ['revived', 'melee'], ['raven', 'melee'], ['poison_creeper', 'melee'],
  ['carrion_vine', 'melee'], ['solar_creeper', 'melee'],
  ['shadow_warrior', 'melee'], ['shadow_master', 'melee'], ['minion', 'melee']
] as const)('projects built-in %s basic as %s', (id, expected) => {
  const owner = { ...monster(definition('monsters/act1.zombie')), id: 'owner', side: 'player' as const };
  const before = structuredClone(owner), body = buildSummon(owner, id);
  expect(body).toBeDefined();
  expect(basic(body)).toBe(expected);
  expect(body?.stats).not.toHaveProperty('basicAttackDelivery');
  expect(owner).toEqual(before);
});

it('keeps monster-derived summons tied to actual monster provenance', () => {
  const owner = monster(definition('monsters/act1.zombie'));
  const body = buildSummon(owner, 'revived', {
    monsterDef: definition('monsters/act1.blood-raven'), rng: createRng(7)
  });
  expect(body?.monsterArchetypeId).toBe('monsters/act1.blood-raven');
  expect(basic(body)).toBe('ranged');
});

it('rejects custom same-ID definitions and unknown archetypes', () => {
  const def = definition('monsters/act1.zombie');
  expect(basic(monster({ ...def, life: [999, 999] }))).toBeUndefined();
  expect(basic(monster({ ...def, id: 'monsters/custom' }))).toBeUndefined();
});

it('does not classify a custom alias retained through default reload', () => {
  const custom = { ...skill('amazon.jab'), id: 'skills-amazon-jab' };
  registry.registerSkill(custom);
  expect(delivery(custom)).toBeUndefined();
  registry.loadDefaultSkills();
  expect(registry.getSkill(custom.id)).toBe(custom);
  expect(delivery(custom)).toBeUndefined();
  expect(delivery(skill('amazon.jab'))).toBe('melee');
});

it('rejects a stale projectile clone after native reload', () => {
  const old = skill('monster-weak-ranged');
  expect(delivery(old)).toBe('ranged');
  registry.loadDefaultSkills();
  const fresh = skill('monster-weak-ranged');
  expect(fresh).not.toBe(old);
  expect(delivery(old)).toBeUndefined();
  expect(delivery(fresh)).toBe('ranged');
});

it('never refreshes native authority from a nested mutation on reload', () => {
  const native = skill('monster-strong-melee'), effect = native.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native generic melee strike');
  const mutable = effect.base as unknown as number[];
  const original = mutable[0];
  if (original === undefined) throw new Error('Missing native generic melee base');
  expect(delivery(native)).toBe('melee');
  try {
    mutable[0] = original + 1;
    expect(delivery(native)).toBeUndefined();
    registry.loadDefaultSkills();
    expect(delivery(skill('monster-strong-melee'))).toBeUndefined();
  } finally { mutable[0] = original; }
  registry.loadDefaultSkills();
  expect(delivery(skill('monster-strong-melee'))).toBe('melee');
});

const weapon = (baseId: string): Item => ({ id: 'weapon', baseId, rarity: 'normal',
  level: 1, identified: true, equipped: false });
const weaponDelivery = (equipment?: Readonly<Record<string, Item | null>>) => (weapons as {
  resolveBasicAttackDelivery?: (equipment?: Readonly<Record<string, Item | null>>) => Delivery | undefined;
}).resolveBasicAttackDelivery?.(equipment);

it.each([
  ['items/base/wp1h-short-sword', 'melee'], ['items/base/weapon-staff', 'melee'],
  ['items/base/weapon-bow', 'ranged'], ['items/base/weapon-crossbow', 'ranged'],
  ['items/base/weapon-throwing-knife', 'ranged']
] as const)('uses the original equipped %s base for %s basic delivery', (baseId, expected) => {
  const equipment = { weapon: weapon(baseId) }, before = structuredClone(equipment);
  expect(weaponDelivery(equipment)).toBe(expected);
  expect(equipment).toEqual(before);
});

it('separates verified unarmed from legacy missing and unresolved equipment', () => {
  expect(weaponDelivery({})).toBe('melee');
  expect(weaponDelivery({ weapon: null })).toBe('melee');
  expect(weaponDelivery()).toBeUndefined();
  expect(weaponDelivery({ weapon: weapon('unknown') })).toBeUndefined();
  expect(weaponDelivery({ weapon: weapon('items/base/sh-buckler') })).toBeUndefined();
  // Existing eligibility {} is deliberately unchanged despite distinct delivery.
  expect(weapons.resolveEquippedWeapon({ weapon: weapon('unknown') })).toEqual({});
});

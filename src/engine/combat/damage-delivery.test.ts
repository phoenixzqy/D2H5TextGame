import { afterEach, beforeEach, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/combat/damage-delivery.json';
import act1 from '../../data/monsters/act1.json';
import act2 from '../../data/monsters/act2.json';
import act3 from '../../data/monsters/act3.json';
import act4 from '../../data/monsters/act4.json';
import act5 from '../../data/monsters/act5.json';
import monsterSchema from '../../data/schema/monster.schema.json';
import type { MonsterDef } from '../types/monsters';
import type { RegisteredSkill, SkillEffect } from '../skills/effects';
import { getSkill, getSkillDamageDelivery, listSkills, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import { buildHydra } from '../skills/hydra';
import { buildDecoy } from '../skills/decoy';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';
import { DAMAGE_DELIVERY_DEFINITION, nativeMonsterBasicDelivery, resolveDamageDeliveryDefinition, sameDeliverySource } from './damage-delivery';

const validateMonster = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
const monsters: MonsterDef[] = [...act1, ...act2, ...act3, ...act4, ...act5].map(row => {
  if (!validateMonster(row)) throw new Error('Invalid authored monster: ' + row.id);
  return row;
});
const skill = (id: string): RegisteredSkill => {
  const found = getSkill(id);
  if (!found) throw new Error('Missing native skill: ' + id);
  return found;
};
const owner = () => {
  const def = monsters[0];
  if (!def) throw new Error('Missing native monster');
  return { ...buildMonsterUnit({ def, level: 30, tier: 'trash', rng: createRng(7) }),
    id: 'owner', side: 'player' as const };
};
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('covers every final native direct-damage skill with one whole-strike disposition', () => {
  const ids = listSkills();
  for (const id of Object.keys(authored.skills)) expect(ids, id).toContain(id);
  const native = [...new Set(ids.map(skill))];
  const direct = native.filter(row => row.effects.some(effect => effect.kind === 'damage'));
  expect(direct.length).toBeGreaterThan(100);
  for (const row of direct) {
    expect(row.effects.filter(effect => effect.kind === 'damage'), row.id).toHaveLength(1);
  }
  expect(direct.filter(row => getSkillDamageDelivery(row) === undefined).map(row => row.id)).toEqual([]);
});

it('explicitly classifies the retained Strafe compatibility stub as ranged', () => {
  expect(getSkillDamageDelivery(skill('amazon.piercing_strike'))).toBe('ranged');
});

it.each(['effects', 'base'] as const)('rejects native sparse %s length mutation, including reload', field => {
  // Authored monster payloads are immutable. The retained native Strafe
  // compatibility skill still exercises mutable source provenance.
  const native = skill('amazon.piercing_strike');
  const effect = native.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native Strafe compatibility strike');
  const array = (field === 'effects' ? native.effects : effect.base) as unknown as unknown[];
  const length = array.length;
  expect(Object.isFrozen(array)).toBe(false);
  expect(getSkillDamageDelivery(native)).toBe('ranged');
  try {
    array.length = length + 1;
    expect(Object.hasOwn(array, length)).toBe(false);
    expect(getSkillDamageDelivery(native)).toBeUndefined();
    loadDefaultSkills();
    expect(getSkillDamageDelivery(skill('amazon.piercing_strike'))).toBeUndefined();
  } finally { array.length = length; }
  loadDefaultSkills();
  expect(getSkillDamageDelivery(skill('amazon.piercing_strike'))).toBe('ranged');
});

it.each(['monster-rend', 'monster-weak-melee'])(
  'rejects sparse %s mutations at its immutable payload boundary and retains delivery on reload', id => {
  const native = skill(id), effect = native.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native monster strike');
  for (const array of [native.effects, effect.base]) {
    expect(Object.isFrozen(array)).toBe(true);
    const length = array.length;
    expect(Reflect.set(array, 'length', length + 1)).toBe(false);
    expect(array).toHaveLength(length);
    expect(Object.hasOwn(array, length)).toBe(false);
  }
  expect(getSkillDamageDelivery(native)).toBe('melee');
  loadDefaultSkills();
  expect(getSkillDamageDelivery(skill(id))).toBe('melee');
});

it('rejects sparse nested MonsterDef mutation without changing the bundled baseline', () => {
  const source = monsters.find(row => row.id === 'monsters/act1.zombie');
  if (!source) throw new Error('Missing zombie');
  const custom = structuredClone(source);
  (custom.life as unknown as number[]).length += 1;
  expect(nativeMonsterBasicDelivery(custom)).toBeUndefined();
  expect(buildMonsterUnit({ def: custom, level: 1, tier: 'trash', rng: createRng(7) }))
    .not.toHaveProperty('basicAttackDelivery');
  expect(nativeMonsterBasicDelivery(source)).toBe('melee');
});

it('requires array shape and optional own fields to match as well as values', () => {
  const sparse: unknown[] = Array(2);
  sparse[0] = 1;
  expect(sameDeliverySource([1], sparse)).toBe(false);
  expect(sameDeliverySource([undefined], Array(1))).toBe(false);
  expect(sameDeliverySource({ base: [1, 2] }, { base: [1, 2] })).toBe(true);
  expect(sameDeliverySource({ base: [1, 2], optional: undefined }, { base: [1, 2] })).toBe(false);
  expect(sameDeliverySource({ 0: 1 }, [1])).toBe(false);
});

it('refuses same-ID replacements before and after restoring defaults', () => {
  const native = skill('amazon.jab'), before = structuredClone(native);
  const custom = structuredClone(native);
  registerSkill(custom);
  expect(getSkillDamageDelivery(custom)).toBeUndefined();
  expect(getSkillDamageDelivery(native)).toBeUndefined();
  loadDefaultSkills();
  expect(getSkillDamageDelivery(custom)).toBeUndefined();
  expect(getSkillDamageDelivery(skill('amazon.jab'))).toBe('melee');
  expect(native).toEqual(before);
});

it('preserves native effect identities and enumerable semantics through classification', () => {
  for (const id of ['amazon.jab', 'monster-rend', 'monster-weak-ranged']) {
    const native = skill(id), effects = native.effects;
    const originals: readonly SkillEffect[] = [...effects];
    const before = structuredClone(native), keys = Object.keys(native);
    expect(getSkillDamageDelivery(native)).toBeDefined();
    expect(skill(id)).toBe(native);
    expect(native.effects).toBe(effects);
    originals.forEach((effect, index) => { expect(native.effects[index]).toBe(effect); });
    expect(Object.keys(native)).toEqual(keys);
    expect(native).toEqual(before);
  }
});

it('projects all112 exact native monster basics, with exactly six ranged archetypes', () => {
  const ranged = new Set([
    'monsters/act1.dark-archer', 'monsters/act1.dark-ranger', 'monsters/act1.coldcrow',
    'monsters/act1.returned-archer', 'monsters/act1.blood-raven', 'monsters/act2.burning-dead-archer'
  ]);
  expect(monsters).toHaveLength(112);
  expect(Object.keys(DAMAGE_DELIVERY_DEFINITION.monsterBasics).sort()).toEqual(monsters.map(row => row.id).sort());
  const before = structuredClone(monsters);
  for (const def of monsters) {
    const unit = buildMonsterUnit({ def, level: 30, tier: 'trash', rng: createRng(7) });
    expect(unit.basicAttackDelivery, def.id).toBe(ranged.has(def.id) ? 'ranged' : 'melee');
    expect(unit.stats).not.toHaveProperty('basicAttackDelivery');
  }
  expect(monsters).toEqual(before);
});

const bodyDeliveries = {
  skeleton: 'melee', clay_golem: 'melee', blood_golem: 'melee', iron_golem: 'melee', fire_golem: 'melee',
  skeletal_mage: 'spell', revived: 'melee', valkyrie: 'melee', raven: 'melee',
  spirit_of_barbs: undefined, spirit_wolf: 'melee', dire_wolf: 'melee', grizzly: 'melee',
  poison_creeper: 'melee', carrion_vine: 'melee', solar_creeper: 'melee',
  shadow_warrior: 'melee', shadow_master: 'melee', minion: 'melee'
} as const;
it.each(Object.entries(bodyDeliveries))('classifies the built-in %s body without changing its owner', (id, delivery) => {
  const source = owner(), before = structuredClone(source);
  const body = buildSummon(source, id);
  expect(getSummon(id)).toBeDefined();
  expect(body).toBeDefined();
  expect(body?.basicAttackDelivery).toBe(delivery);
  expect(body?.stats).not.toHaveProperty('basicAttackDelivery');
  expect(source).toEqual(before);
});

it('covers the default templates plus special bound bodies without empowering candidates', () => {
  expect(Object.keys(DAMAGE_DELIVERY_DEFINITION.summons).sort())
    .toEqual([...Object.keys(bodyDeliveries), 'hydra', 'decoy'].sort());
  const source = owner();
  expect(buildHydra(source)).not.toHaveProperty('basicAttackDelivery');
  expect(buildDecoy(source, 1)).not.toHaveProperty('basicAttackDelivery');
});

it('does not lend template authority to a custom same-name summon factory', () => {
  const original = getSummon('skeleton');
  if (!original) throw new Error('Missing native skeleton factory');
  try {
    registerSummon('skeleton', source => {
      const custom = { ...source };
      Reflect.deleteProperty(custom, 'basicAttackDelivery');
      return { ...custom, id: 'custom-body' };
    });
    expect(buildSummon(owner(), 'skeleton')).not.toHaveProperty('basicAttackDelivery');
  } finally { registerSummon('skeleton', original); }
  expect(buildSummon(owner(), 'skeleton')?.basicAttackDelivery).toBe('melee');
});

it('authors every weapon basic explicitly, including types without current item bases', () => {
  expect(DAMAGE_DELIVERY_DEFINITION.weapons).toEqual({
    claw: 'melee', sword: 'melee', axe: 'melee', mace: 'melee', dagger: 'melee',
    spear: 'melee', polearm: 'melee', bow: 'ranged', crossbow: 'ranged', throwing: 'ranged',
    staff: 'melee', wand: 'melee', scepter: 'melee', orb: 'melee'
  });
});

it('validates closed categories, legal values, all weapon types and exact monster coverage', () => {
  const changes = [
    (row: typeof authored) => Object.assign(row, { extra: true }),
    (row: typeof authored) => Reflect.deleteProperty(row, 'skills'),
    (row: typeof authored) => { row.skills['amazon.jab'] = 'none'; },
    (row: typeof authored) => { row.monsterBasics['monsters/act1.zombie'] = 'primary-melee'; },
    (row: typeof authored) => { row.summons.skeleton = 'unknown'; },
    (row: typeof authored) => Reflect.deleteProperty(row.weapons, 'orb'),
    (row: typeof authored) => Object.assign(row.weapons, { laser: 'ranged' }),
    (row: typeof authored) => Reflect.deleteProperty(row.monsterBasics, 'monsters/act1.zombie'),
    (row: typeof authored) => Object.assign(row.monsterBasics, { 'monsters/custom': 'melee' })
  ];
  for (const change of changes) {
    const input = structuredClone(authored);
    change(input);
    expect(() => resolveDamageDeliveryDefinition(input)).toThrow();
  }
});

it('copies and freezes validated records without freezing caller-owned authoring data', () => {
  const input = structuredClone(authored), before = structuredClone(input);
  const result = resolveDamageDeliveryDefinition(input);
  expect(input).toEqual(before);
  expect(Object.isFrozen(input)).toBe(false);
  expect(Object.isFrozen(input.skills)).toBe(false);
  expect(Object.isFrozen(result)).toBe(true);
  for (const category of ['skills', 'weapons', 'summons', 'monsterBasics'] as const) {
    expect(result[category]).not.toBe(input[category]);
    expect(Object.isFrozen(result[category])).toBe(true);
  }
  input.skills['amazon.jab'] = 'spell';
  expect(result.skills['amazon.jab']).toBe('melee');
});

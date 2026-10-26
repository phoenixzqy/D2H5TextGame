import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import skillSchema from '../../data/schema/skill.schema.json';
import amazonSkills from '../../data/skills/amazon.json';
import assassinSkills from '../../data/skills/assassin.json';
import barbarianSkills from '../../data/skills/barbarian.json';
import druidSkills from '../../data/skills/druid.json';
import necromancerSkills from '../../data/skills/necromancer.json';
import paladinSkills from '../../data/skills/paladin.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import mercenarySkills from '../../data/skills/mercenary.json';
import { loadMercPool } from '../../data/loaders/mercs';
import { createMercFromDef } from '../../stores/mercFactory';
import { MERC_STUB_SKILLS } from './aliases';
import type { RegisteredSkill } from './effects';
import { getSkill, listSkills, loadDefaultSkills, registerSkill, resetRegistry } from './registry';
import {
  canonicalSkillIdFromData,
  ENABLED_PLAYABLE_SKILL_CLASSES,
  PLAYABLE_CLASS_SKILL_DATA,
  registeredSkillFromJson
} from './dataCatalog';

describe('P08a08 authored player Meteor Armor Melt', () => {
  it('preserves Meteor and Burn tuning with the corrected All target and reviewed secondary', () => {
    const raw = sorceressSkills.find(row => row.id === 'skills-sorceress-meteor');
    const validate = new Ajv2020({ strict: true }).compile(skillSchema);
    expect(validate(raw), JSON.stringify(validate.errors)).toBe(true);
    expect(raw).toMatchObject({
      requiredLevel: 24, target: 'all-enemies', cooldown: 4,
      cost: { mana: 50 }, damageType: 'fire', damage: { min: 100, max: 150 },
      appliesStatus: ['burn', 'armor-melt'], statusEffect: { dotPctOfDamage: 0.1 },
      scaling: { damagePerLevel: 10 },
      additionalStatusEffects: { 'armor-melt': { chance: 1, defenseReductionPct: 30, durationMs: 3000 } }
    });
    expect(raw).not.toHaveProperty('aoeShape');
  });
});

describe('P08a04b authored player Frost Nova secondary Freeze', () => {
  beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
  afterEach(() => { resetRegistry(); loadDefaultSkills(); });

  function frostRow() {
    const row = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(skill => skill.id === 'skills-sorceress-frost-nova');
    if (!row) throw new Error('Actual player Frost Nova is missing');
    return row;
  }

  it('opts in actual Frost Nova with 10 percent chance alongside reviewed Meteor', () => {
    const raw = sorceressSkills.find(skill => skill.id === 'skills-sorceress-frost-nova');
    const validate = new Ajv2020({ strict: true }).compile(skillSchema);
    expect(validate(raw), JSON.stringify(validate.errors)).toBe(true);
    expect(raw).toMatchObject({ additionalStatusEffects: { freeze: { chance: 0.1 } } });
    expect(Object.values(PLAYABLE_CLASS_SKILL_DATA).flat()
      .filter(row => row.additionalStatusEffects !== undefined).map(row => row.id))
      .toEqual(['skills-amazon-freezing-arrow', 'skills-sorceress-frost-nova', 'skills-sorceress-meteor']);
  });

  it('registers one damage effect and the complete ordered list through both actual identities', () => {
    const before = structuredClone(frostRow());
    expect(getSkill('skills-sorceress-frost-nova')).toBe(getSkill('sorceress.frost_nova'));
    expect(getSkill('sorceress.frost_nova')).toEqual({
      id: 'sorceress.frost_nova', archetype: 'sorceress', trigger: 'active',
      target: 'all-enemies', cooldown: 3, manaCost: 20, minLevel: 6,
      effects: [{ kind: 'damage', damageType: 'cold', base: [25, 35], perRank: [3, 3],
        tags: ['cold', 'chill'], applyStatuses: [{ id: 'chill' }, { id: 'freeze', chance: 0.1 }] }]
    });
    expect(registeredSkillFromJson(frostRow())).toEqual(getSkill('sorceress.frost_nova'));
    expect(frostRow()).toEqual(before);
  });

  it('keeps opt-out damage in the exact old scalar or no-status shape', () => {
    const { additionalStatusEffects: _secondary, ...legacy } = frostRow();
    const { appliesStatus: _primary, ...plain } = legacy;
    const base = { kind: 'damage', damageType: 'cold', base: [25, 35], perRank: [3, 3], tags: ['cold', 'chill'] };
    expect(registeredSkillFromJson(legacy).effects).toEqual([{ ...base, applyStatus: { id: 'chill' } }]);
    expect(registeredSkillFromJson(plain).effects).toEqual([base]);
  });

  it('forwards explicit zeros and optional fields without enabling unconfigured tails', () => {
    const fixture = { ...frostRow(), id: 'skills-fixture-secondary-fields',
      statusEffect: { chance: 0, stacksOnApply: 2, dotPctOfDamage: 0 },
      additionalStatusEffects: { freeze: { chance: 1, stacksOnApply: 3, dotPctOfDamage: 0.25 } }
    };
    const before = structuredClone(fixture);
    expect(registeredSkillFromJson(fixture).effects).toEqual([
      { kind: 'damage', damageType: 'cold', base: [25, 35], perRank: [3, 3], tags: ['cold', 'chill'],
        applyStatuses: [
          { id: 'chill', chance: 0, stacksOnApply: 2, dotPctOfDamage: 0 },
          { id: 'freeze', chance: 1, stacksOnApply: 3, dotPctOfDamage: 0.25 }
        ] }
    ]);
    expect(fixture).toEqual(before);
    expect(getSkill('amazon.plague_javelin')?.effects).toEqual([
      { kind: 'damage', damageType: 'poison', base: [30, 50], perRank: [3, 3], tags: ['poison'],
        applyStatus: { id: 'poison', stacksOnApply: 3, dotPctOfDamage: 0.05 } }
    ]);
    expect(getSkill('sorceress.fire_bolt')?.effects).toEqual([
      { kind: 'damage', damageType: 'fire', base: [30, 45], perRank: [4, 4], tags: ['fire', 'burn'],
        applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }
    ]);
    expect(getSkill('necromancer.amplify_damage')?.effects).toEqual([
      { kind: 'debuff', statusId: 'amplify-damage', durationMs: 3000, physicalResistReductionPct: 50 }
    ]);
    expect(listSkills().filter(id => getSkill(id)?.effects.some(effect =>
      effect.kind === 'damage' && effect.applyStatuses !== undefined)).sort())
      .toEqual(['amazon.freezing_arrow', 'amazon.ice_arrow', 'assassin.mind_blast', 'assassin.phoenix_strike', 'paladin.vengeance', 'sorceress.frost_nova', 'sorceress.glacial_spike',
        'sorceress.ice_blast', 'sorceress.meteor']);
  });
});

describe('BUG165 authored cold Freeze/Chill pair', () => {
  it.each([
    ['sorceress', 'skills-sorceress-ice-blast'],
    ['sorceress', 'skills-sorceress-glacial-spike'],
    ['amazon', 'skills-amazon-ice-arrow']
  ] as const)('preserves both declared statuses for %s %s', (classId, id) => {
    const row = PLAYABLE_CLASS_SKILL_DATA[classId].find(skill => skill.id === id);
    if (!row) throw new Error('Missing authored freezing skill');
    const before = structuredClone(row);
    expect(row.appliesStatus).toEqual(['freeze', 'chill']);
    const skill = registeredSkillFromJson(row);
    expect(skill.effects).toEqual([expect.objectContaining({
      kind: 'damage', damageType: 'cold', applyStatuses: [{ id: 'freeze' }, { id: 'chill' }]
    })]);
    expect(skill.effects[0]).not.toHaveProperty('applyStatus');
    expect(getSkill(id)).toEqual(skill);
    expect(getSkill(skill.id)).toBe(getSkill(id));
    expect(row).toEqual(before);
  });

  it('keeps primary metadata separate and enables only the contracted cold active pair', () => {
    const row = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(skill => skill.id === 'skills-sorceress-ice-blast');
    if (!row) throw new Error('Missing Ice Blast');
    const statusEffect = { chance: 0, stacksOnApply: 2, dotPctOfDamage: 0 };
    const effect = registeredSkillFromJson({ ...row, statusEffect }).effects[0];
    expect(effect).toMatchObject({ applyStatuses: [
      { id: 'freeze', ...statusEffect }, { id: 'chill' }
    ] });
    for (const alternate of [
      { ...row, damageType: 'fire' as const },
      { ...row, trigger: 'passive' as const },
      { ...row, appliesStatus: ['freeze', 'chill', 'stun'] },
      { ...row, appliesStatus: ['freeze', 'stun'] },
      { ...row, appliesStatus: ['burn', 'chill'] }
    ]) {
      expect(registeredSkillFromJson(alternate).effects[0]).not.toHaveProperty('applyStatuses');
    }
  });
});

describe('P07a01b authored trigger metadata (not passive runtime behavior)', () => {
  beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
  afterEach(() => { resetRegistry(); loadDefaultSkills(); });

  function authoredSkill(id: string) {
    const skill = Object.values(PLAYABLE_CLASS_SKILL_DATA).flat().find(row => row.id === id);
    if (!skill) throw new Error(`Missing authored skill: ${id}`);
    return skill;
  }

  it('preserves actual Warmth passive classification through both identities', () => {
    const row = authoredSkill('skills-sorceress-warmth');
    expect(row.trigger).toBe('passive');
    expect(getSkill(row.id)).toBe(getSkill('sorceress.warmth'));
    expect(getSkill(row.id)).toMatchObject({
      id: 'sorceress.warmth', trigger: 'passive', target: 'self', cooldown: 0,
      manaCost: 0, isBuff: true, effects: [{ kind: 'buff', id: 'warmth', duration: -1 }]
    });
  });

  it('keeps actual Fire Bolt active with its existing damage effect', () => {
    const row = authoredSkill('skills-sorceress-fire-bolt');
    expect(row.trigger).toBe('active');
    expect(getSkill(row.id)).toBe(getSkill('sorceress.fire_bolt'));
    expect(getSkill(row.id)).not.toHaveProperty('isBuff');
    expect(getSkill(row.id)).toMatchObject({
      trigger: 'active', effects: [{ kind: 'damage', damageType: 'fire', base: [30, 45],
        perRank: [4, 4], tags: ['fire', 'burn'], applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }]
    });
  });


  it('opts only exact active self Frozen Armor into paid snapshot metadata', () => {
    const row = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(skill => skill.id === 'skills-sorceress-frozen-armor');
    if (!row) throw new Error('Missing actual Frozen Armor');
    expect(getSkill(row.id)?.effects).toEqual([
      { kind: 'buff', id: 'frozen-armor', duration: -1, frozenArmor: true }
    ]);
    expect(registeredSkillFromJson(row)).toEqual(getSkill(row.id));
    for (const fields of [{ id: 'mskill-frozen-armor' }, { id: 'skills-sorceress-other-armor' },
      { trigger: 'passive' as const }, { target: 'single-enemy' as const },
      { appliesStatus: ['other-armor'] }, { appliesStatus: ['frozen-armor', 'chill'] }]) {
      expect(registeredSkillFromJson({ ...row, ...fields }).effects.some(effect =>
        effect.kind === 'buff' && effect.frozenArmor === true)).toBe(false);
    }
    expect(listSkills().filter(id => getSkill(id)?.effects.some(effect =>
      effect.kind === 'buff' && effect.frozenArmor === true))).toEqual(['sorceress.frozen_armor']);
  });

  it('keeps actual Frozen Armor active despite passiveStatsPerLevel and isBuff', () => {
    const row = sorceressSkills.find(skill => skill.id === 'skills-sorceress-frozen-armor');
    expect(row).toMatchObject({ trigger: 'active', scaling: { passiveStatsPerLevel: { defensePct: 0.03 } } });
    expect(getSkill('skills-sorceress-frozen-armor')).toBe(getSkill('sorceress.frozen_armor'));
    expect(getSkill('sorceress.frozen_armor')).toMatchObject({
      trigger: 'active', isBuff: true, effects: [{ kind: 'buff', id: 'frozen-armor', duration: -1 }]
    });
  });

  it.each(['might', 'prayer'])('keeps actual Paladin %s aura authored as passive without changing its buff', name => {
    const dataId = `skills-paladin-${name}`;
    expect(paladinSkills.find(skill => skill.id === dataId)).toMatchObject({ aura: true, trigger: 'passive' });
    expect(getSkill(dataId)).toBe(getSkill(`paladin.${name}`));
    expect(getSkill(dataId)).toMatchObject({
      trigger: 'passive', isBuff: true, effects: [{ kind: 'buff', id: name, duration: -1 }]
    });
  });

  it('forwards literal aura metadata from an explicitly synthetic adapter fixture', () => {
    // No current playable row authors trigger:aura; this tests the supported adapter subset only.
    const fixture = { ...authoredSkill('skills-paladin-might'), id: 'skills-fixture-aura-trigger', trigger: 'aura' as const };
    const before = structuredClone(fixture);
    const registered = registeredSkillFromJson(fixture);
    expect(fixture).toEqual(before);
    expect(registered).toMatchObject({
      id: 'fixture.aura_trigger', trigger: 'aura', isBuff: true,
      effects: [{ kind: 'buff', id: 'aura_trigger', duration: -1 }]
    });
  });

  it('preserves every playable authored trigger in the adapter and canonical/data aliases', () => {
    const rows = Object.values(PLAYABLE_CLASS_SKILL_DATA).flat();
    expect(rows).toHaveLength(213);
    for (const row of rows) {
      const canonical = getSkill(canonicalSkillIdFromData(row.id));
      expect(getSkill(row.id), row.id).toBe(canonical);
      expect(canonical, row.id).toHaveProperty('trigger', row.trigger);
      expect(registeredSkillFromJson(row), row.id).toHaveProperty('trigger', row.trigger);
    }
  });

  it('adapts the entire playable corpus without mutating authored inputs', () => {
    const before = structuredClone(PLAYABLE_CLASS_SKILL_DATA);
    for (const row of Object.values(PLAYABLE_CLASS_SKILL_DATA).flat()) registeredSkillFromJson(row);
    expect(PLAYABLE_CLASS_SKILL_DATA).toEqual(before);
  });

  it('restores authored trigger metadata after overrides and repeated default reloads', () => {
    const ids = [...listSkills()].sort();
    for (let i = 0; i < 3; i++) {
      for (const id of ['sorceress.warmth', 'sorceress.frozen_armor']) {
        registerSkill({ id, archetype: 'fixture', target: 'self', cooldown: 9, manaCost: 999, minLevel: 99, effects: [] });
        expect(getSkill(id)).not.toHaveProperty('trigger');
      }
      loadDefaultSkills();
      expect(getSkill('skills-sorceress-warmth')).toHaveProperty('trigger', 'passive');
      expect(getSkill('skills-sorceress-frozen-armor')).toHaveProperty('trigger', 'active');
      expect([...listSkills()].sort()).toEqual(ids);
    }
  });

  it('leaves a manually registered legacy buff without trigger metadata and preserves unrelated stubs', () => {
    const legacy: RegisteredSkill = {
      id: 'fixture.legacy_buff', archetype: 'fixture', target: 'self', cooldown: 0,
      manaCost: 0, minLevel: 1, isBuff: true, effects: [{ kind: 'buff', id: 'legacy', duration: -1 }]
    };
    const before = structuredClone(legacy);
    registerSkill(legacy);
    expect(getSkill(legacy.id)).toBe(legacy);
    expect(getSkill(legacy.id)).not.toHaveProperty('trigger');
    expect(legacy).toEqual(before);
    for (const stub of MERC_STUB_SKILLS.filter(skill => skill.id !== 'mskill-minor-heal')) {
      expect(getSkill(stub.id)).toBe(stub);
      expect(getSkill(stub.id)).not.toHaveProperty('trigger');
    }
  });
});

describe('P08a03a authored Minor Heal registration', () => {
  const productionId = 'mskill-minor-heal';
  const expected = {
    id: productionId, archetype: 'mercenary', target: 'single-ally',
    cooldown: 4, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'heal', amountRange: [30, 50], target: 'ally' }]
  };
  beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
  afterEach(() => { resetRegistry(); loadDefaultSkills(); });

  it('replaces the actual production self-buff stub with its authored ranged ally heal', () => {
    const rows = mercenarySkills.filter(skill => skill.id === productionId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ trigger: 'active', target: 'single-ally',
      cooldown: 4, minLevel: 1, maxLevel: 20, heal: { min: 30, max: 50, target: 'ally' } });
    expect(getSkill(productionId)).toEqual(expected);
    expect(getSkill(productionId)).not.toHaveProperty('isBuff');
    expect(getSkill(productionId)).not.toHaveProperty('manaCostPerRank');
    expect(getSkill(productionId)).not.toHaveProperty('cooldownPerRank');
  });

  it('resolves the actual Acolyte factory loadout without claiming ordinary recruitment', () => {
    const definition = loadMercPool().pool.find(merc => merc.id === 'mercs/tavern-acolyte-priestess');
    if (!definition) throw new Error('Actual Acolyte Priestess definition is missing');
    const before = structuredClone(definition);
    const merc = createMercFromDef(definition);
    expect(merc.signatureSkillId).toBe(productionId);
    expect(merc.comboOrder).toEqual([productionId]);
    expect(merc.comboOrder.map(getSkill)).toEqual([expected]);
    expect(definition).toEqual(before);
  });

  it('restores the authored override after repeated default loads without duplicate IDs', () => {
    const ids = [...listSkills()].sort();
    registerSkill({ id: productionId, archetype: 'fixture', target: 'self',
      cooldown: 0, manaCost: 999, minLevel: 99, effects: [], isBuff: true });
    for (let i = 0; i < 3; i++) {
      loadDefaultSkills();
      expect(getSkill(productionId)).toEqual(expected);
      expect([...listSkills()].sort()).toEqual(ids);
      expect(listSkills().filter(id => id === productionId)).toHaveLength(1);
    }
  });

  it('preserves every unrelated merc/aura stub and adds no alternative Minor Heal identity', () => {
    for (const stub of MERC_STUB_SKILLS.filter(skill => skill.id !== productionId)) {
      expect(getSkill(stub.id)).toBe(stub);
    }
    expect(listSkills()).not.toContain('mskill.minor_heal');
    expect(listSkills()).not.toContain('mskill_minor_heal');
    expect(listSkills()).not.toContain('mercenary.minor_heal');
  });
});

describe('P08a02a Amplify Damage metadata boundary', () => {
  const validateSkill = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);
  const productionId = 'skills-necromancer-amplify-damage';
  const productionJson = necromancerSkills.find((skill) => skill.id === productionId);
  const productionSkill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find((skill) => skill.id === productionId);
  if (!productionJson || !productionSkill) throw new Error('Production Amplify Damage definition is missing');
  const schemaFixture = { ...productionJson, id: 'skills-fixture-status-metadata' };

  function adapterFixture(metadata: { durationMs?: number; physicalResistReductionPct?: number }) {
    if (!productionSkill) throw new Error('Production Amplify Damage definition is missing');
    return { ...productionSkill, statusEffect: { chance: 1, ...metadata } };
  }

  it.each([
    { durationMs: 3000, physicalResistReductionPct: 50 },
    { durationMs: 0, physicalResistReductionPct: 0 },
    { durationMs: 0.5, physicalResistReductionPct: 12.5 },
    { durationMs: 3000 },
    { physicalResistReductionPct: 50 },
    {}
  ])('validates optional finite nonnegative metadata %j', (metadata) => {
    expect(validateSkill({ ...schemaFixture, statusEffect: metadata })).toBe(true);
  });

  it.each(['durationMs', 'physicalResistReductionPct'])('rejects negative %s at its schema boundary', (field) => {
    expect(validateSkill({ ...schemaFixture, statusEffect: { [field]: -1 } })).toBe(false);
    expect(validateSkill.errors).toContainEqual(expect.objectContaining({
      instancePath: `/statusEffect/${field}`, keyword: 'minimum'
    }));
  });

  it.each([
    ['durationMs', Infinity], ['durationMs', -Infinity], ['durationMs', NaN], ['durationMs', '3000'],
    ['physicalResistReductionPct', Infinity], ['physicalResistReductionPct', -Infinity],
    ['physicalResistReductionPct', NaN], ['physicalResistReductionPct', '50']
  ])('rejects nonfinite or nonnumeric %s=%s', (field, value) => {
    expect(validateSkill({ ...schemaFixture, statusEffect: { [field]: value } })).toBe(false);
    expect(validateSkill.errors).toContainEqual(expect.objectContaining({
      instancePath: `/statusEffect/${field}`, keyword: 'type'
    }));
  });

  it('continues rejecting unknown status metadata keys', () => {
    expect(validateSkill({ ...schemaFixture, statusEffect: { unknownModifier: 50 } })).toBe(false);
    expect(validateSkill.errors).toContainEqual(expect.objectContaining({ keyword: 'additionalProperties' }));
  });

  it.each([
    { durationMs: 3000, physicalResistReductionPct: 50 },
    { durationMs: 0, physicalResistReductionPct: 0 },
    { durationMs: 3000 },
    { physicalResistReductionPct: 50 },
    {}
  ])('preserves supplied Amplify debuff metadata without inventing omitted fields %j', (metadata) => {
    const fixture = adapterFixture(metadata);
    const before = structuredClone(fixture);
    expect(registeredSkillFromJson(fixture).effects).toEqual([
      { kind: 'debuff', statusId: 'amplify-damage', ...metadata }
    ]);
    expect(fixture).toEqual(before);
  });

  it.each([
    { id: 'skills-necromancer-decrepify', statusId: 'decrepify' },
    { id: 'skills-necromancer-decrepify', statusId: 'amplify-damage' },
    { id: 'necromancer.amplify_damage', statusId: 'amplify-damage' },
    { id: productionId, statusId: 'amplify' },
    { id: productionId, statusId: 'amp-damage' }
  ])('does not forward Amplify metadata for $id / $statusId', ({ id, statusId }) => {
    expect(registeredSkillFromJson({
      ...adapterFixture({ durationMs: 3000, physicalResistReductionPct: 50 }), id, appliesStatus: [statusId]
    }).effects).toEqual([{ kind: 'debuff', statusId }]);
  });

  it('leaves damage and self-buff branches outside the new metadata path', () => {
    const fixture = adapterFixture({ durationMs: 3000, physicalResistReductionPct: 50 });
    expect(registeredSkillFromJson({ ...fixture, damage: { min: 10, max: 10 }, damageType: 'physical' }).effects)
      .toEqual([{ kind: 'damage', damageType: 'physical', base: [10, 10], tags: ['amp-damage'],
        applyStatus: { id: 'amplify-damage', chance: 1 } }]);
    expect(registeredSkillFromJson({ ...fixture, target: 'self' }).effects)
      .toEqual([{ kind: 'buff', id: 'amplify-damage', duration: -1 }]);
  });

  it('preserves the actual production curse identity and resource scaling', () => {
    expect(getSkill(productionId)).toMatchObject({
      id: 'necromancer.amplify_damage', manaCost: 15, cooldown: 3,
      manaCostPerRank: -0.2, cooldownPerRank: -0.05,
      effects: [{ kind: 'debuff', statusId: 'amplify-damage' }]
    });
  });
});

describe('skill registry JSON catalog', () => {
  it('registers every active Necromancer JSON skill for combat use', () => {
    const activeNecromancerSkillIds = necromancerSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeNecromancerSkillIds).toHaveLength(26);
    expect(activeNecromancerSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('registers every active Sorceress JSON skill after its class slice is enabled', () => {
    const registeredIds = new Set(listSkills());
    const activeSorceressSkillIds = sorceressSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));

    expect(ENABLED_PLAYABLE_SKILL_CLASSES).toEqual([
      'necromancer',
      'sorceress',
      'barbarian',
      'amazon',
      'paladin',
      'druid',
      'assassin'
    ]);
    expect(activeSorceressSkillIds).toHaveLength(25);
    expect(activeSorceressSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('registers every active Barbarian JSON skill after its class slice is enabled', () => {
    const activeBarbarianSkillIds = barbarianSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeBarbarianSkillIds).toHaveLength(18);
    expect(activeBarbarianSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('registers every active Amazon JSON skill after its class slice is enabled', () => {
    const activeAmazonSkillIds = amazonSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeAmazonSkillIds).toHaveLength(24);
    expect(activeAmazonSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
    expect(getSkill('skills-amazon-magic-arrow')?.requires).toEqual({ weaponType: ['bow', 'crossbow'] });
  });

  it('registers every active Paladin JSON skill after its class slice is enabled', () => {
    const activePaladinSkillIds = paladinSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activePaladinSkillIds).toHaveLength(10);
    expect(activePaladinSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('registers every active Druid JSON skill after its class slice is enabled', () => {
    const activeDruidSkillIds = druidSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeDruidSkillIds).toHaveLength(26);
    expect(activeDruidSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('registers every active Assassin JSON skill after its class slice is enabled', () => {
    const activeAssassinSkillIds = assassinSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeAssassinSkillIds).toHaveLength(26);
    expect(activeAssassinSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
  });

  it('can adapt every playable class JSON skill without hardcoded archetypes', () => {
    const adapted = Object.entries(PLAYABLE_CLASS_SKILL_DATA).flatMap(([classId, skills]) =>
      skills.map((skill) => ({ classId, skill: registeredSkillFromJson(skill) }))
    );

    expect(adapted).toHaveLength(213);
    expect(adapted.filter(({ classId, skill }) => skill.archetype !== classId)).toEqual([]);
  });

  it('gives every enabled active playable JSON skill at least one runtime effect', () => {
    const emptyActiveEffects = [...ENABLED_PLAYABLE_SKILL_CLASSES].flatMap((classId) =>
      PLAYABLE_CLASS_SKILL_DATA[classId]
        .filter((skill) => skill.trigger === 'active')
        .map((skill) => registeredSkillFromJson(skill))
        .filter((skill) => skill.effects.length === 0)
        .map((skill) => skill.id)
    );

    expect(emptyActiveEffects).toEqual([]);
  });

  it('keeps utility-only active skills usable through runtime buff or debuff effects', () => {
    expect(getSkill('skills-sorceress-teleport')?.effects).toContainEqual({
      kind: 'buff',
      id: 'teleport',
      sorceressBuff: 'teleport',
      duration: 1
    });
    expect(getSkill('skills-barbarian-find-item')?.effects).toContainEqual({
      kind: 'buff',
      id: 'find-item',
      duration: -1
    });
    expect(getSkill('skills-amazon-decoy')?.effects).toContainEqual({
      kind: 'buff',
      id: 'decoy',
      duration: -1
    });
  });

  it('uses JSON level scaling when overriding default Necromancer stubs', () => {
    const boneSpear = getSkill('skills-necromancer-bone-spear');
    const damage = boneSpear?.effects.find((effect) => effect.kind === 'damage');

    expect(damage?.kind === 'damage' ? damage.perRank : undefined).toEqual([7, 7]);
    expect(boneSpear?.minLevel).toBe(18);
  });

  it('preserves JSON-authored DoT status metadata for Necromancer damage skills', () => {
    const corpseExplosion = getSkill('skills-necromancer-corpse-explosion');
    const corpseDamage = corpseExplosion?.effects.find((effect) => effect.kind === 'damage');
    const poisonNova = getSkill('skills-necromancer-poison-nova');
    const poisonDamage = poisonNova?.effects.find((effect) => effect.kind === 'damage');

    expect(corpseDamage?.kind === 'damage' ? corpseDamage.applyStatus : undefined).toEqual({
      id: 'ignite',
      dotPctOfDamage: 0.1
    });
    expect(poisonDamage?.kind === 'damage' ? poisonDamage.applyStatus : undefined).toEqual({
      id: 'poison',
      stacksOnApply: 2,
      dotPctOfDamage: 0.05
    });
  });

  it('preserves JSON-authored Sorceress fire DoT metadata', () => {
    const fireBall = getSkill('skills-sorceress-fire-ball');
    const damage = fireBall?.effects.find((effect) => effect.kind === 'damage');

    expect(damage?.kind === 'damage' ? damage.perRank : undefined).toEqual([7, 7]);
    expect(damage?.kind === 'damage' ? damage.applyStatus : undefined).toEqual({
      id: 'burn',
      dotPctOfDamage: 0.1
    });
  });

  it('maps active self utility statuses to buffs instead of enemy debuffs', () => {
    const frozenArmor = getSkill('skills-sorceress-frozen-armor');

    expect(frozenArmor?.isBuff).toBe(true);
    expect(frozenArmor?.effects).toEqual([
      {
        kind: 'buff',
        id: 'frozen-armor',
        duration: -1,
        frozenArmor: true
      }
    ]);
  });

  it('registers summon stat scaling from Necromancer JSON skills', () => {
    const skeletalMage = getSkill('skills-necromancer-raise-skeletal-mage');
    const summon = skeletalMage?.effects.find((effect) => effect.kind === 'summon');

    expect(summon?.kind === 'summon' ? summon.summonId : undefined).toBe('skeletal_mage');
    expect(summon?.kind === 'summon' ? summon.maxCountScaling : undefined).toEqual({
      kind: 'first-three-then-every-three'
    });
    expect(summon?.kind === 'summon' ? summon.statScaling : undefined).toEqual({
      lifeMax: 7,
      attack: 3,
      magicDodge: 0.002
    });
  });

  it('registers Amazon Valkyrie as a scaling summon', () => {
    const valkyrie = getSkill('skills-amazon-valkyrie');
    const summon = valkyrie?.effects.find((effect) => effect.kind === 'summon');

    expect(valkyrie?.summonOnStart).toBe(true);
    expect(summon?.kind === 'summon' ? summon.summonId : undefined).toBe('valkyrie');
    expect(summon?.kind === 'summon' ? summon.statScaling : undefined).toEqual({
      lifeMax: 14,
      attack: 3,
      defense: 2
    });
  });

  it('registers Druid summons with distinct rank-scaled templates', () => {
    const grizzly = getSkill('skills-druid-summon-grizzly');
    const summon = grizzly?.effects.find((effect) => effect.kind === 'summon');

    expect(grizzly?.summonOnStart).toBe(true);
    expect(summon?.kind === 'summon' ? summon.summonId : undefined).toBe('grizzly');
    expect(summon?.kind === 'summon' ? summon.statScaling : undefined).toEqual({
      lifeMax: 12,
      attack: 3,
      defense: 2
    });
  });

  it('registers Assassin shadow summons with rank-scaled templates', () => {
    const shadowMaster = getSkill('skills-assassin-shadow-master');
    const summon = shadowMaster?.effects.find((effect) => effect.kind === 'summon');

    expect(shadowMaster?.summonOnStart).toBe(true);
    expect(summon?.kind === 'summon' ? summon.summonId : undefined).toBe('shadow_master');
    expect(summon?.kind === 'summon' ? summon.statScaling : undefined).toEqual({
      lifeMax: 10,
      attack: 3,
      defense: 2,
      magicDodge: 0.002
    });
  });
});

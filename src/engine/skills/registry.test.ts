import { describe, expect, it } from 'vitest';
import amazonSkills from '../../data/skills/amazon.json';
import assassinSkills from '../../data/skills/assassin.json';
import barbarianSkills from '../../data/skills/barbarian.json';
import druidSkills from '../../data/skills/druid.json';
import necromancerSkills from '../../data/skills/necromancer.json';
import paladinSkills from '../../data/skills/paladin.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import { getSkill, listSkills } from './registry';
import {
  canonicalSkillIdFromData,
  ENABLED_PLAYABLE_SKILL_CLASSES,
  PLAYABLE_CLASS_SKILL_DATA,
  registeredSkillFromJson
} from './dataCatalog';

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
      duration: -1
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
        duration: -1
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

import { describe, expect, it } from 'vitest';
import necromancerSkills from '../../data/skills/necromancer.json';
import { getSkill, listSkills } from './registry';

function canonicalSkillIdFromData(id: string): string {
  const match = /^skills-([a-z]+)-(.+)$/.exec(id);
  if (!match?.[1] || !match[2]) return id;
  return `${match[1]}.${match[2].replace(/-/g, '_')}`;
}

describe('skill registry JSON catalog', () => {
  it('registers every active Necromancer JSON skill for combat use', () => {
    const activeNecromancerSkillIds = necromancerSkills
      .filter((skill) => skill.trigger === 'active')
      .map((skill) => canonicalSkillIdFromData(skill.id));
    const registeredIds = new Set(listSkills());

    expect(activeNecromancerSkillIds).toHaveLength(26);
    expect(activeNecromancerSkillIds.filter((id) => !registeredIds.has(id))).toEqual([]);
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
});

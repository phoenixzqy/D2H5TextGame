/**
 * Tests for skills helper functions
 */
import { describe, it, expect } from 'vitest';
import { getSkillsForClass, organizeSkillsByTree, isSkillLocked, type SkillTemplate } from './skillsHelpers';

describe('skillsHelpers', () => {
  describe('getSkillsForClass', () => {
    it('should return Necromancer skills for necromancer class', () => {
      const skills = getSkillsForClass('necromancer');
      
      expect(skills.length).toBeGreaterThan(5); // More than the 5 hardcoded barbarian skills
      expect(skills.some(s => s.name === 'Bone Spear')).toBe(true);
      expect(skills.some(s => s.name === 'Raise Skeleton')).toBe(true);
      expect(skills.some(s => s.name === 'Whirlwind')).toBe(false); // No Barbarian skills
    });

    it('should return Barbarian skills for barbarian class', () => {
      const skills = getSkillsForClass('barbarian');
      
      expect(skills.length).toBeGreaterThan(5);
      expect(skills.some(s => s.name === 'Bash')).toBe(true);
      expect(skills.some(s => s.name === 'Whirlwind')).toBe(true);
      expect(skills.some(s => s.name === 'Bone Spear')).toBe(false); // No Necromancer skills
    });

    it('should return Sorceress skills for sorceress class', () => {
      const skills = getSkillsForClass('sorceress');
      
      expect(skills.length).toBeGreaterThan(5);
      expect(skills.some(s => s.name === 'Frozen Orb')).toBe(true);
      expect(skills.some(s => s.name === 'Ice Bolt')).toBe(true);
      expect(skills.some(s => s.name === 'Whirlwind')).toBe(false); // No Barbarian skills
    });

    it('should handle case-insensitive class names', () => {
      const skills1 = getSkillsForClass('NECROMANCER');
      const skills2 = getSkillsForClass('Necromancer');
      const skills3 = getSkillsForClass('necromancer');
      
      expect(skills1).toEqual(skills2);
      expect(skills2).toEqual(skills3);
    });

    it('should return empty array for unknown class', () => {
      const skills = getSkillsForClass('unknown-class');
      
      expect(skills).toEqual([]);
    });
  });

  describe('organizeSkillsByTree', () => {
    it('should organize skills by tree field when present', () => {
      const skills = getSkillsForClass('necromancer');
      const treeMap = organizeSkillsByTree(skills);
      
      // All necromancer skills now have tree fields
      expect(treeMap.size).toBeGreaterThan(0);
      // Should be organized into the 3 necromancer trees
      expect(treeMap.has('Summoning Spells') || treeMap.has('Poison and Bone Spells') || treeMap.has('Curses')).toBe(true);
    });

    it('should organize skills by tree field if present', () => {
      // Mock skills with tree field
      const mockSkills: SkillTemplate[] = [
        { 
          id: 'skill1', 
          name: 'Skill 1', 
          tree: 'combat', 
          trigger: 'active', 
          target: 'single-enemy', 
          cooldown: 1, 
          minLevel: 1, 
          maxLevel: 20 
        },
        { 
          id: 'skill2', 
          name: 'Skill 2', 
          tree: 'combat', 
          trigger: 'active', 
          target: 'single-enemy', 
          cooldown: 1, 
          minLevel: 1, 
          maxLevel: 20 
        },
        { 
          id: 'skill3', 
          name: 'Skill 3', 
          tree: 'passive', 
          trigger: 'passive', 
          target: 'self', 
          cooldown: 0, 
          minLevel: 1, 
          maxLevel: 20 
        }
      ];
      
      const treeMap = organizeSkillsByTree(mockSkills);
      
      expect(treeMap.has('combat')).toBe(true);
      expect(treeMap.has('passive')).toBe(true);
      expect(treeMap.get('combat')?.length).toBe(2);
      expect(treeMap.get('passive')?.length).toBe(1);
    });
  });

  describe('isSkillLocked', () => {
    const baseSkill: SkillTemplate = {
      id: 'test-skill',
      name: 'Test Skill',
      trigger: 'active',
      target: 'single-enemy',
      cooldown: 1,
      minLevel: 6,
      maxLevel: 20
    };

    it('should lock skill when player level is below minLevel', () => {
      const locked = isSkillLocked(baseSkill, 5, new Map());
      expect(locked).toBe(true);
    });

    it('should unlock skill when player level meets minLevel', () => {
      const locked = isSkillLocked(baseSkill, 6, new Map());
      expect(locked).toBe(false);
    });

    it('should unlock skill when player level exceeds minLevel', () => {
      const locked = isSkillLocked(baseSkill, 10, new Map());
      expect(locked).toBe(false);
    });

    it('should lock skill when prerequisites are not met', () => {
      const skillWithPrereqs: SkillTemplate = {
        ...baseSkill,
        minLevel: 1,
        prerequisites: ['prereq-skill-1', 'prereq-skill-2']
      };
      
      const allocatedSkills = new Map([
        ['prereq-skill-1', 1] // Only first prereq allocated
      ]);
      
      const locked = isSkillLocked(skillWithPrereqs, 10, allocatedSkills);
      expect(locked).toBe(true);
    });

    it('should unlock skill when all prerequisites are met', () => {
      const skillWithPrereqs: SkillTemplate = {
        ...baseSkill,
        minLevel: 1,
        prerequisites: ['prereq-skill-1', 'prereq-skill-2']
      };
      
      const allocatedSkills = new Map([
        ['prereq-skill-1', 1],
        ['prereq-skill-2', 1]
      ]);
      
      const locked = isSkillLocked(skillWithPrereqs, 10, allocatedSkills);
      expect(locked).toBe(false);
    });
  });
});

/**
 * Skills helpers for loading and organizing skill data by class
 */

// Define a skill template type that matches what's in JSON (without allocated level)
export interface SkillTemplate {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly trigger: 'active' | 'passive' | 'aura';
  readonly target: string;
  readonly cooldown: number;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly cost?: {
    readonly mana?: number;
    readonly life?: number;
  };
  readonly damage?: {
    readonly min: number;
    readonly max: number;
    readonly breakdown?: Record<string, number>;
  };
  readonly damageType?: string;
  readonly appliesStatus?: readonly string[];
  readonly appliesTags?: readonly string[];
  readonly synergies?: Record<string, number>;
  readonly scaling?: {
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number;
    readonly costPerLevel?: number;
  };
  // Extended fields for future expansion
  readonly tree?: string;
  readonly prerequisites?: readonly string[];
  readonly passive?: boolean;
  readonly aura?: boolean;
  readonly summon?: boolean;
}

// Eagerly import all class skill files
import amazonSkills from '@/data/skills/amazon.json';
import assassinSkills from '@/data/skills/assassin.json';
import barbarianSkills from '@/data/skills/barbarian.json';
import druidSkills from '@/data/skills/druid.json';
import necromancerSkills from '@/data/skills/necromancer.json';
import paladinSkills from '@/data/skills/paladin.json';
import sorceressSkills from '@/data/skills/sorceress.json';

// Map class IDs to their skill data
const skillsByClass: Record<string, SkillTemplate[]> = {
  amazon: amazonSkills as SkillTemplate[],
  assassin: assassinSkills as SkillTemplate[],
  barbarian: barbarianSkills as SkillTemplate[],
  druid: druidSkills as SkillTemplate[],
  necromancer: necromancerSkills as SkillTemplate[],
  paladin: paladinSkills as SkillTemplate[],
  sorceress: sorceressSkills as SkillTemplate[]
};

/**
 * Get all skills for a given class
 * @param classId - The character class ID (e.g., 'necromancer', 'barbarian')
 * @returns Array of skill definitions for the class, or empty array if not found
 */
export function getSkillsForClass(classId: string): SkillTemplate[] {
  const skills = skillsByClass[classId.toLowerCase()];
  if (!skills) {
    console.warn(`No skills found for class: ${classId}`);
    return [];
  }
  return skills;
}

/**
 * Organize skills by tree (for D2-style 3-tree layout)
 * If the skill data doesn't have 'tree' field, returns all skills in a single group
 * @param skills - Array of skill definitions
 * @returns Map of tree name to array of skills
 */
export function organizeSkillsByTree(skills: SkillTemplate[]): Map<string, SkillTemplate[]> {
  const treeMap = new Map<string, SkillTemplate[]>();
  
  // Check if any skill has tree field (for future expansion)
  const hasTreeField = skills.some((s) => 'tree' in s);
  
  if (!hasTreeField) {
    // No tree organization yet, group all skills under 'All Skills'
    treeMap.set('all', skills);
    return treeMap;
  }
  
  // Group by tree field
  skills.forEach((skill) => {
    const tree = skill.tree ?? 'general';
    const existing = treeMap.get(tree) ?? [];
    existing.push(skill);
    treeMap.set(tree, existing);
  });
  
  return treeMap;
}

/**
 * Check if a skill is locked based on player level and prerequisites
 * @param skill - The skill definition
 * @param playerLevel - Current player level
 * @param allocatedSkills - Map of skill IDs to their allocated levels
 * @returns true if the skill is locked, false if available
 */
export function isSkillLocked(
  skill: SkillTemplate,
  playerLevel: number,
  allocatedSkills: Map<string, number>
): boolean {
  // Check level requirement
  if (skill.minLevel && playerLevel < skill.minLevel) {
    return true;
  }
  
  // Check prerequisites (if present in expanded data)
  if (skill.prerequisites) {
    for (const prereqId of skill.prerequisites) {
      const prereqLevel = allocatedSkills.get(prereqId) ?? 0;
      if (prereqLevel === 0) {
        return true; // Prerequisite not allocated
      }
    }
  }
  
  return false;
}

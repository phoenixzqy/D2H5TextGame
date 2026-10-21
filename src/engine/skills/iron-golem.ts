import Ajv2020 from 'ajv/dist/2020';
import necromancerSkills from '../../data/skills/necromancer.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import { inferKind, type CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';

/** Canonical identity; the authored alias is accepted only through registry resolution. */
export const IRON_GOLEM_SKILL_ID = 'necromancer.iron_golem';
const IRON_ALIAS = 'skills-necromancer-iron-golem';
const BLOOD = 'necromancer.blood_golem';
const BLOOD_ALIAS = 'skills-necromancer-blood-golem';
type AuthoredSource = SkillDef & { readonly requiredLevel: number; readonly prerequisites?: readonly string[] };
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<AuthoredSource>(skillSchema);

function authored(id: string): AuthoredSource {
  const rows = necromancerSkills.filter(row => row.id === id);
  const row = rows[0];
  if (rows.length !== 1 || !validate(row)) throw new Error(`Invalid authored Iron prerequisite/source ${id}`);
  return row;
}
const qualification = (() => {
  const iron = authored(IRON_ALIAS);
  const blood = authored(BLOOD_ALIAS);
  if (iron.summonId !== 'iron_golem' || iron.prerequisites?.length !== 1 || iron.prerequisites[0] !== BLOOD_ALIAS) {
    throw new Error('Invalid authored Iron summon/prerequisite identity');
  }
  return Object.freeze({ requiredLevel: iron.requiredLevel, maxRank: iron.maxLevel, bloodMaxRank: blood.maxLevel });
})();

/** Copied isolated item contributions; inventory eligibility belongs to the store composer. */
export interface IronGolemInput {
  readonly sourceHeroId: string;
  readonly sourceItemId: string;
  readonly life: number;
  readonly attack: number;
  readonly defense: number;
}

/** Proof of successful engine preparation, retained independently of the unit's later life. */
export interface IronGolemPreparationAttestation {
  readonly sourceHeroId: string;
  readonly sourceItemId: string;
  readonly skillId: typeof IRON_GOLEM_SKILL_ID;
  readonly spawnedUnitId: string;
  readonly paidMp: number;
}

function allocated(levels: CombatUnit['skillLevels'], aliases: readonly string[], maximum: number): number {
  let rank = 0;
  for (const id of aliases) {
    const value = levels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maximum) rank = Math.max(rank, value);
  }
  return rank;
}

/** Suppress both identities in generic casting, even if their registry source is malformed. */
export function isIronGolemSkill(skill: Pick<RegisteredSkill, 'id'>): boolean {
  return skill.id === IRON_GOLEM_SKILL_ID || skill.id === IRON_ALIAS;
}

/**
 * Resolve explicit engine source evidence, without an unlearned rank-one fallback.
 * The authoritative Player composer must separately filter class/configuration;
 * CombatUnit has no class and cannot authenticate an arbitrarily forged snapshot.
 * Item/mana/candidate success is deliberately independent of this qualification.
 */
export function qualifyIronGolemSource(owner: CombatUnit, skill: RegisteredSkill): number {
  if (skill.id !== IRON_GOLEM_SKILL_ID || skill.archetype !== 'necromancer' ||
    skill.minLevel !== qualification.requiredLevel || owner.id.length === 0 || owner.side !== 'player' || inferKind(owner) !== 'hero' ||
    owner.summon === true || owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    !Number.isFinite(owner.life) || owner.life <= 0 || !Number.isInteger(owner.level) || owner.level < qualification.requiredLevel ||
    allocated(owner.skillLevels, [BLOOD, BLOOD_ALIAS], qualification.bloodMaxRank) === 0) return 0;
  return allocated(owner.skillLevels, [IRON_GOLEM_SKILL_ID, IRON_ALIAS], qualification.maxRank);
}

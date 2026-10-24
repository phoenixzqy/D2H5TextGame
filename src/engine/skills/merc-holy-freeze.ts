import Ajv2020 from 'ajv/dist/2020';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(schema);

/** Validate the unique native aura and copy immutable runtime tuning without retaining caller data. */
export function resolveMercHolyFreeze(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly coldDamagePct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-holy-freeze');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Holy Freeze');
  const row = matches[0];
  if (!validate(row) || !row.holyFreeze) throw new Error('Invalid native mercenary Holy Freeze');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      coldDamagePct: row.holyFreeze.coldDamagePct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercHolyFreeze(rows);
/** JSON-derived runtime fraction; slowing is supplied by the shared Chill definition. */
export const MERC_HOLY_FREEZE_DEFINITION = authored.definition;
/** Passive presence never consumes an action or a cooldown. */
export const MERC_HOLY_FREEZE_SKILL = authored.skill;

/** Only an explicitly factory-qualified living native merc can supply this wave's aura. */
export function isMercHolyFreezeSource(unit: CombatUnit): boolean {
  return unit.holyFreezeAura === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= MERC_HOLY_FREEZE_DEFINITION.minLevel;
}

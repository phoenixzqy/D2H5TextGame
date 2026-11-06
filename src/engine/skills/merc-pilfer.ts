import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Copy the unique authored Pickpocket attack and its rank-independent reward tuning. */
export function resolveMercPilfer(source: readonly unknown[]): {
  readonly skill: RegisteredSkill;
  readonly definition: { readonly minLevel: number; readonly currencyFindPct: number };
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-pilfer');
  if (matches.length !== 1) throw new Error('Expected exactly one native Pilfer');
  const row = matches[0];
  if (!validate(row) || !row.mercPilfer || !row.damage ||
    !Number.isInteger(row.damage.min) || !Number.isInteger(row.damage.max) || row.damage.min > row.damage.max ||
    Object.keys(row.damage.breakdown).length !== 1 || row.damage.breakdown.physical === undefined) {
    throw new Error('Invalid native Pilfer');
  }
  const skill: RegisteredSkill = Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active',
    target: row.target, minLevel: row.minLevel, cooldown: row.cooldown, manaCost: 0,
    effects: Object.freeze([Object.freeze({ kind: 'damage' as const, damageType: 'physical' as const,
      base: Object.freeze([row.damage.min, row.damage.max] as const), tags: Object.freeze(['physical'] as const) })]) });
  return Object.freeze({ skill, definition: Object.freeze({ minLevel: row.minLevel,
    currencyFindPct: row.mercPilfer.currencyFindPct }) });
}

const authored = resolveMercPilfer(rows);
/** Immutable authored attack identity; replacements cannot authorize reward find. */
export const MERC_PILFER_SKILL = authored.skill;
/** Native paid-wave reward tuning, independent of registry replacements. */
export const MERC_PILFER_DEFINITION = authored.definition;

/** Revalidate the exact Pickpocket template, factory marker and owned native bar. */
export function isMercPilferSource(unit: CombatUnit): boolean {
  return unit.mercPilferSource === true && unit.id.split('#')[0] === 'merc-mercs/tavern-thief-pickpocket' &&
    unit.side === 'player' && unit.kind === 'merc' && unit.summon !== true && unit.ownerId === undefined &&
    unit.summonOwnerId === undefined && unit.summonTemplateId === undefined && Number.isInteger(unit.level) &&
    unit.level >= MERC_PILFER_DEFINITION.minLevel && unit.skillOrder.includes(MERC_PILFER_SKILL.id);
}

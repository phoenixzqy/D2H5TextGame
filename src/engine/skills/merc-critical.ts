import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Critical Strike row and copy immutable authored tuning. */
export function resolveMercCritical(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly critChancePct: number; readonly critDamagePct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'passive-critical');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Critical Strike');
  const row = matches[0];
  if (!validate(row) || !row.mercCritical) throw new Error('Invalid native mercenary Critical Strike');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      critChancePct: row.mercCritical.critChancePct / 100,
      critDamagePct: row.mercCritical.critDamagePct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercCritical(rows);
/** JSON-derived additive critical chance and damage fractions; no extra critical roll. */
export const MERC_CRITICAL_DEFINITION = authored.definition;
/** An always-on presence never consumes an action, mana or cooldown. */
export const MERC_CRITICAL_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Critical Strike. */
export function isMercCriticalSource(unit: CombatUnit): boolean {
  return unit.mercCritical === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_CRITICAL_DEFINITION.minLevel;
}

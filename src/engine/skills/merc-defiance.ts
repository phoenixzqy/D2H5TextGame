import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Defiance row and copy immutable authored tuning. */
export function resolveMercDefiance(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly defensePct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-defiance');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Defiance');
  const row = matches[0];
  if (!validate(row) || !row.mercDefiance) throw new Error('Invalid native mercenary Defiance');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      defensePct: row.mercDefiance.defensePct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercDefiance(rows);
/** JSON-derived additive combat Defense fraction, independent of the selected Paladin aura. */
export const MERC_DEFIANCE_DEFINITION = authored.definition;
/** An always-on presence never consumes an action, mana or cooldown. */
export const MERC_DEFIANCE_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Defiance. */
export function isMercDefianceSource(unit: CombatUnit): boolean {
  return unit.mercDefianceAura === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_DEFIANCE_DEFINITION.minLevel;
}

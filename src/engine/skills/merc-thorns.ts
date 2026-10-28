import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Thorns row and copy immutable authored tuning. */
export function resolveMercThorns(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly physicalReflectionPct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-thorns');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Thorns');
  const row = matches[0];
  if (!validate(row) || !row.mercThorns) throw new Error('Invalid native mercenary Thorns');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      physicalReflectionPct: row.mercThorns.physicalReflectionPct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercThorns(rows);
/** JSON-derived additive reflection fraction, independent of the selected Paladin aura. */
export const MERC_THORNS_DEFINITION = authored.definition;
/** An always-on presence never consumes an action, mana or cooldown. */
export const MERC_THORNS_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Thorns. */
export function isMercThornsSource(unit: CombatUnit): boolean {
  return unit.mercThornsAura === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_THORNS_DEFINITION.minLevel;
}

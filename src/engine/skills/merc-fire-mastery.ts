import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Fire Mastery row and copy immutable authored tuning. */
export function resolveMercFireMastery(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly fireDamagePct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'passive-fire-mastery');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Fire Mastery');
  const row = matches[0];
  if (!validate(row) || !row.mercFireMastery) throw new Error('Invalid native mercenary Fire Mastery');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      fireDamagePct: row.mercFireMastery.fireDamagePct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercFireMastery(rows);
/** JSON-derived additive fraction, independent of the player Sorceress Fire Mastery. */
export const MERC_FIRE_MASTERY_DEFINITION = authored.definition;
/** An always-on presence never consumes an action, mana or cooldown. */
export const MERC_FIRE_MASTERY_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Fire Mastery. */
export function isMercFireMasterySource(unit: CombatUnit): boolean {
  return unit.mercFireMastery === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_FIRE_MASTERY_DEFINITION.minLevel;
}

import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Holy Fire row and copy its immutable pulse tuning. */
export function resolveMercHolyFire(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number;
    readonly amount: number; readonly intervalMs: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-holy-fire');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Holy Fire');
  const row = matches[0];
  if (!validate(row) || !row.mercHolyFire) throw new Error('Invalid native mercenary Holy Fire');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      amount: row.mercHolyFire.amount, intervalMs: row.mercHolyFire.intervalMs }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercHolyFire(rows);
/** JSON-owned ambient Fire damage and cadence, independent of selected player auras. */
export const MERC_HOLY_FIRE_DEFINITION = authored.definition;
/** Presence never consumes an action, mana or cooldown. */
export const MERC_HOLY_FIRE_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Holy Fire. */
export function isMercHolyFireSource(unit: CombatUnit): boolean {
  return unit.mercHolyFireAura === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_HOLY_FIRE_DEFINITION.minLevel;
}

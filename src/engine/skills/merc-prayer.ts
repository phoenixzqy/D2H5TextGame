import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Prayer row and copy immutable authored tuning. */
export function resolveMercPrayer(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number;
    readonly amount: number; readonly intervalMs: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-prayer');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Prayer');
  const row = matches[0];
  if (!validate(row) || !row.mercPrayer) throw new Error('Invalid native mercenary Prayer');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      amount: row.mercPrayer.amount, intervalMs: row.mercPrayer.intervalMs }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercPrayer(rows);
/** JSON-derived flat recovery and cadence, independent of the selected Paladin aura. */
export const MERC_PRAYER_DEFINITION = authored.definition;
/** Native presence never consumes an action, mana or cooldown. */
export const MERC_PRAYER_SKILL = authored.skill;

/** Only a living, factory-qualified native player-side merc can supply Prayer. */
export function isMercPrayerSource(unit: CombatUnit): boolean {
  return unit.mercPrayerAura === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    Number.isInteger(unit.level) && unit.level >= MERC_PRAYER_DEFINITION.minLevel;
}

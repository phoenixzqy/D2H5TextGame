import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const MARKERS = ['mskill-frozen-armor', 'frozen_armor'];

/** Validate the unique authored mercenary Armor and copy its flat, base tuning. */
export function resolveMercFrozenArmor(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly defense: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-frozen-armor');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Frozen Armor');
  const row = matches[0];
  if (!validate(row) || !row.mercFrozenArmor) throw new Error('Invalid native mercenary Frozen Armor');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel, defense: row.mercFrozenArmor.defense }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active', target: row.target,
      minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown, isBuff: true,
      effects: Object.freeze([Object.freeze({ kind: 'buff', id: 'frozen_armor', duration: -1, mercFrozenArmor: true })]) })
  });
}

const authored = resolveMercFrozenArmor(rows);
/** JSON-owned personal flat Defense, captured only after an ordinary cast. */
export const MERC_FROZEN_ARMOR_DEFINITION = authored.definition;
/** Deeply immutable native identity; custom same-ID replacements cannot pay for Armor. */
export const MERC_FROZEN_ARMOR_SKILL = authored.skill;

/** Revalidate the fresh native factory projection and owned bar, without a hero allocation fallback. */
export function isMercFrozenArmorSource(unit: CombatUnit): boolean {
  return unit.mercFrozenArmorSource === true && unit.side === 'player' && unit.kind === 'merc' &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && Number.isInteger(unit.level) &&
    unit.level >= MERC_FROZEN_ARMOR_DEFINITION.minLevel && unit.skillOrder.includes(MERC_FROZEN_ARMOR_SKILL.id);
}

/** Paid potency survives registry replacement; markers and unqualified bodies supply none. */
export function mercFrozenArmorDefense(unit: CombatUnit): number {
  const defense = unit.mercFrozenArmor?.defense;
  return isMercFrozenArmorSource(unit) && defense !== undefined && Number.isFinite(defense) && defense > 0
    ? defense : 0;
}

/** Invalidate only the new configuration snapshot; original carry/replay remains intact. */
export function refreshMercFrozenArmorState(unit: CombatUnit): CombatUnit {
  if (isMercFrozenArmorSource(unit)) return unit;
  const { mercFrozenArmor: _paid, ...rest } = unit;
  return { ...rest, activeBuffIds: unit.activeBuffIds.filter(id => !MARKERS.includes(id)) };
}

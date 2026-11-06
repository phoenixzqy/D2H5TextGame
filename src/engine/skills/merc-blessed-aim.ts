import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Validate the unique native Blessed Aim row and copy its bounded relative miss reduction. */
export function resolveMercBlessedAim(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly weaponMissReduction: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-blessed-aim');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Blessed Aim');
  const row = matches[0];
  if (!validate(row) || !row.mercBlessedAim) throw new Error('Invalid native mercenary Blessed Aim');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      weaponMissReduction: row.mercBlessedAim.weaponMissReductionPct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}

const authored = resolveMercBlessedAim(rows);
/** JSON-derived relative miss reduction, separate from the selected Paladin Attack aura. */
export const MERC_BLESSED_AIM_DEFINITION = authored.definition;
/** Presence consumes no cast, action, mana, cooldown or selected-aura slot. */
export const MERC_BLESSED_AIM_SKILL = authored.skill;

/** Revalidate the living original factory body, current owned bar and bounded native rank. */
export function isMercBlessedAimSource(unit: CombatUnit): boolean {
  const rank = unit.skillLevels?.[MERC_BLESSED_AIM_SKILL.id] ?? 1;
  return unit.mercBlessedAimAura === true && unit.id.split('#')[0] === 'merc-mercs/act2-blessed-aim' &&
    unit.side === 'player' && unit.kind === 'merc' && unit.summon !== true && unit.ownerId === undefined &&
    unit.summonOwnerId === undefined && unit.summonTemplateId === undefined &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= MERC_BLESSED_AIM_DEFINITION.minLevel && unit.skillOrder.includes(MERC_BLESSED_AIM_SKILL.id) &&
    Number.isInteger(rank) && rank >= 1 && rank <= MERC_BLESSED_AIM_DEFINITION.maxRank;
}

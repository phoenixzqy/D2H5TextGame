import skills from '../../data/skills/paladin.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { projectPlayerClassActives } from './player-class-actives';
import { createSkillValidator } from './skill-validator';

export const CONVERSION_IDS = ['skills-paladin-conversion', 'paladin.conversion'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate the exact authored row and detach all runtime tuning from mutable data. */
export function resolveConversionDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === CONVERSION_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.conversion || !row.damage ||
    row.damage.min > row.damage.max) throw new Error('Invalid authored Conversion');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    durationMs: row.conversion.durationMs, eligibleTiers: Object.freeze([...row.conversion.eligibleTiers]) });
}
export const CONVERSION_DEFINITION = resolveConversionDefinition(skills);
const authored = PLAYABLE_CLASS_SKILL_DATA.paladin.find(row => row.id === CONVERSION_IDS[0]);
if (!authored) throw new Error('Missing Conversion');
const expected = registeredSkillFromJson(authored);

/** Exact plain effect/registration comparison also rejects extra potency fields. */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null ||
    Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) &&
    sameValue(Reflect.get(a, key), Reflect.get(b, key)));
}

/** Refuse contradictory paid identities/payloads before mana or cooldown changes. */
export function matchesConversion(skill: RegisteredSkill): boolean { return sameValue(skill, expected); }

/** Exact aliases/MAX and the whole prerequisite chain share the native ownership validator. */
export function composeConversionRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [CONVERSION_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[CONVERSION_IDS[1]] ?? 0 : 0;
}

/** Native original living hero authority only; statuses/priority entries cannot establish rank. */
export function conversionRank(unit: CombatUnit): number {
  const rank = unit.conversionRank;
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= CONVERSION_DEFINITION.requiredLevel && typeof rank === 'number' &&
    Number.isInteger(rank) && rank > 0 && rank <= CONVERSION_DEFINITION.maxRank ? rank : 0;
}

/** Only living ordinary original monster bodies can receive the paid binding. */
export function isConversionTarget(unit: CombatUnit): boolean {
  return unit.side === 'enemy' && unit.kind === 'monster' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && Number.isFinite(unit.life) && unit.life > 0 &&
    CONVERSION_DEFINITION.eligibleTiers.some(tier => tier === unit.tier);
}

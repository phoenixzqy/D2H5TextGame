import Ajv2020 from 'ajv/dist/2020';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef, StaticFieldTuning } from '../types/skills';
import type { Player } from '../types/entities';
import { inferKind, type CombatUnit } from '../combat/types';
import { mitigateDamage } from '../combat/damage';
import type { RegisteredSkill } from './effects';

const ID = 'sorceress.static_field', AUTHORED = 'skills-sorceress-static-field';

/** Immutable authored eligibility and fractional damage tuning. */
export interface StaticFieldDefinition extends StaticFieldTuning {
  readonly requiredLevel: number;
  readonly maxRank: number;
}
const validate = new Ajv2020({ strict: true, allErrors: true })
  .compile<SkillDef & { readonly requiredLevel: number; readonly staticField: StaticFieldTuning }>(skillSchema);

/** Validate exactly one source row and copy primitives without retaining mutable input. */
export function resolveStaticFieldDefinition(rows: readonly unknown[]): StaticFieldDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === AUTHORED);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Static Field skill');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, ...row.staticField });
}

/** JSON-owned reference independent of mutable skill registration. */
export const STATIC_FIELD_DEFINITION = resolveStaticFieldDefinition(sorceressSkills);

/** Recognize only the two exact authored/runtime aliases. */
export function isStaticFieldId(id: string): boolean { return id === ID || id === AUTHORED; }

/** Resolve maximum finite positive whole allocated rank once, clamped to the authored cap. */
export function resolveStaticFieldRank(levels?: Readonly<Record<string, number>>): number {
  let rank = 0;
  for (const alias of [ID, AUTHORED]) {
    const value = levels?.[alias];
    if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
      rank = Math.max(rank, Math.min(STATIC_FIELD_DEFINITION.maxRank, value));
    }
  }
  return rank;
}

/** Player-only learned eligibility; explicit zero prevents foreign-class legacy fallback. */
export function composeStaticField(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  return player.class === 'sorceress' && Number.isInteger(player.level) &&
    player.level >= STATIC_FIELD_DEFINITION.requiredLevel ? resolveStaticFieldRank(player.skillLevels) : 0;
}

/** Runtime eligibility from the native projection, or exact allocations in pure engine callers. */
export function staticFieldRank(unit: CombatUnit): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || unit.summon === true ||
    unit.ownerId !== undefined || unit.summonOwnerId !== undefined || !Number.isFinite(unit.life) ||
    unit.life <= 0 || !Number.isInteger(unit.level) || unit.level < STATIC_FIELD_DEFINITION.requiredLevel) return 0;
  if (unit.staticFieldRank === undefined) return resolveStaticFieldRank(unit.skillLevels);
  return Number.isInteger(unit.staticFieldRank) && unit.staticFieldRank > 0 &&
    unit.staticFieldRank <= STATIC_FIELD_DEFINITION.maxRank ? unit.staticFieldRank : 0;
}

/** Refuse a substituted identity or payload before an action can be paid. */
export function matchesStaticField(skill: RegisteredSkill): boolean {
  return isStaticFieldId(skill.id) && skill.archetype === 'sorceress' && skill.trigger === 'active' &&
    skill.target === 'all-enemies' && skill.effects.length === 1 && skill.effects[0]?.kind === 'static-field';
}

/** Deterministic resistance/MR mitigation, clipped to a nonlethal difficulty floor; no combat RNG. */
export function staticFieldDamage(target: CombatUnit, difficulty: 'normal' | 'nightmare',
  tuning: StaticFieldTuning = STATIC_FIELD_DEFINITION): number {
  if (!Number.isFinite(target.life) || !Number.isFinite(target.stats.lifeMax) ||
    target.life <= 0 || target.stats.lifeMax <= 0) return 0;
  const floor = Math.max(1, Math.ceil(target.stats.lifeMax *
    (difficulty === 'nightmare' ? tuning.nightmareFloorFraction : tuning.normalFloorFraction)));
  const available = Math.max(0, target.life - floor);
  if (available === 0) return 0;
  return Math.min(available, mitigateDamage(target.life * tuning.currentHealthFraction, {
    type: 'lightning', defenderResistances: target.stats.resistances,
    defenderArmor: target.stats.defense, defenderMagicResist: target.stats.magicResist,
    ...(target.resistPenalty !== undefined ? { resistPenalty: target.resistPenalty } : {})
  }).final);
}

import rows from '../../data/skills/monsters.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const CANONICAL = 'monster.corpse_explosion', AUTHORED = 'monster-corpse-explosion';
type Source = Omit<SkillDef, 'cost'> & { readonly cost?: SkillDef['cost'] };
const validate = createSkillValidator<Source>();

/** Validate and copy the authored death-only budget; no active cast or corpse payment. */
export function resolveMonsterDeathExplosion(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === AUTHORED);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || row.trigger !== 'on-death' || row.target !== 'all-enemies' ||
    row.cooldown !== 0 || row.cost?.mana !== 0 || row.minLevel !== 1 || row.maxLevel !== 1 ||
    row.damageType !== 'fire' || !row.damage || row.damage.min !== 35 || row.damage.max !== 60 ||
    row.damage.breakdown.physical !== 30 || row.damage.breakdown.fire !== 30 ||
    Object.keys(row.damage.breakdown).length !== 2 || Object.keys(row.damage).length !== 3 ||
    Object.keys(row.cost).length !== 1 || Object.keys(row).length !== 13 ||
    row.appliesTags?.join(',') !== 'fire,physical' || row.appliesStatus !== undefined)
    throw new Error('Invalid authored monster death explosion');
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: row.damageType,
    base: Object.freeze([row.damage.min, row.damage.max] as const),
    components: Object.freeze([
      Object.freeze({ damageType: 'physical' as const, weight: row.damage.breakdown.physical }),
      Object.freeze({ damageType: 'fire' as const, weight: row.damage.breakdown.fire })
    ] as const) });
  return Object.freeze({ id: CANONICAL, archetype: 'monster', trigger: 'on-death',
    target: row.target, cooldown: row.cooldown, manaCost: row.cost.mana,
    minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** Frozen native identity; registry replacements cannot confer original death authority. */
export const MONSTER_DEATH_EXPLOSION_SKILL = resolveMonsterDeathExplosion(rows);

/** Validate the separate Fire Enchanted payload without accepting active or mixed damage semantics. */
export function resolveFireEnchantedExplosion(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'monster-fire-enchanted-explosion');
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || row.trigger !== 'on-death' || row.target !== 'all-enemies' ||
    row.cooldown !== 0 || row.cost?.mana !== 0 || row.minLevel !== 1 || row.maxLevel !== 1 ||
    row.damageType !== 'fire' || !row.damage || row.damage.min !== 50 || row.damage.max !== 50 ||
    row.damage.breakdown.fire !== 50 || Object.keys(row.damage.breakdown).length !== 1 ||
    Object.keys(row.damage).length !== 3 || Object.keys(row.cost).length !== 1 ||
    Object.keys(row).length !== 12 || row.appliesTags?.join(',') !== 'fire' || row.appliesStatus !== undefined)
    throw new Error('Invalid authored Fire Enchanted explosion');
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: row.damageType,
    base: Object.freeze([row.damage.min, row.damage.max] as const) });
  return Object.freeze({ id: 'monster.fire_enchanted_explosion', archetype: 'monster', trigger: 'on-death',
    target: row.target, cooldown: row.cooldown, manaCost: row.cost.mana,
    minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** Frozen authored Fire Enchanted identity, independent of the Doll's mixed burst. */
export const FIRE_ENCHANTED_EXPLOSION_SKILL = resolveFireEnchantedExplosion(rows);

/** Exact native aliases are always excluded from active selection, even after replacement. */
export function isMonsterDeathExplosionId(id: string): boolean {
  return id === CANONICAL || id === AUTHORED ||
    id === 'monster.fire_enchanted_explosion' || id === 'monster-fire-enchanted-explosion';
}

/** Only original living unowned enemy monsters can bind native death payloads. */
export function isOriginalEnemyDeathSource(unit: CombatUnit): boolean {
  return unit.kind === 'monster' && unit.side === 'enemy' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined;
}

/** Capture-time qualification only; call once after effective starting IDs have settled. */
export function isOriginalDeathExplosionSource(unit: CombatUnit): boolean {
  return isOriginalEnemyDeathSource(unit) && unit.monsterArchetypeId === 'monsters/act4.stygian-doll';
}

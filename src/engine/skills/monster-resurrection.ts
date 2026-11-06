import monsterSkills from '../../data/skills/monsters.json';
import type { CombatUnit, MonsterTier } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const CANONICAL = 'monster.resurrect_fallen', AUTHORED = 'monster-resurrect-fallen';
type Source = Omit<SkillDef, 'cost'> & { readonly cost?: SkillDef['cost'] };
const validate = createSkillValidator<Source>();
const sourceIds = new Set([
  'monsters/act1.fallen-shaman', 'monsters/act1.carver-shaman',
  'monsters/act1.devilkin-shaman', 'monsters/act1.bishibosh'
]);
const bodyIds = new Set([
  'monsters/act1.fallen', 'monsters/act1.dark-one',
  'monsters/act1.carver', 'monsters/act1.devilkin'
]);
const bodyTiers: ReadonlySet<MonsterTier> = new Set<MonsterTier>(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion']);

/** Closed structural semantics: extra fields, accessors and inherited behavior are not native authority. */
function same(value: unknown, expected: unknown): boolean {
  if (value === expected) return true;
  if (typeof value !== 'object' || value === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(value) !== Array.isArray(expected)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value) ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  const actualKeys = Reflect.ownKeys(value), expectedKeys = Reflect.ownKeys(expected);
  return actualKeys.length === expectedKeys.length && expectedKeys.every(key => {
    const actual = Object.getOwnPropertyDescriptor(value, key);
    const reference = Object.getOwnPropertyDescriptor(expected, key);
    return actual !== undefined && reference !== undefined && 'value' in actual && 'value' in reference &&
      same(actual.value, reference.value);
  });
}

/** Validate the authored leaf, then copy only approved zero-MP, one-body resurrection semantics. */
export function resolveMonsterResurrection(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === AUTHORED);
  if (matches.length !== 1) throw new Error('Expected exactly one authored monster resurrection skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored monster resurrection skill');
  const { name: _name, description: _description, icon: _icon, ...semantics } = row;
  const reference = { id: AUTHORED, trigger: 'active', target: 'summon', cooldown: 5, minLevel: 1, maxLevel: 1 };
  if (!same(semantics, reference) && !same(semantics, { ...reference, cost: { mana: 0 } })) {
    throw new Error('Unreviewed authored monster resurrection semantics');
  }
  return Object.freeze({
    id: CANONICAL, archetype: 'monster', trigger: 'active', target: row.target,
    cooldown: row.cooldown, manaCost: row.cost?.mana ?? 0, minLevel: row.minLevel,
    effects: Object.freeze([Object.freeze({ kind: 'monster-resurrection' as const })])
  });
}

/** Immutable authored reference, independent of registration order and imported registry replacements. */
export const MONSTER_RESURRECTION_SKILL = resolveMonsterResurrection(monsterSkills);

/** Recognize only the canonical and authored monster resurrection identities. */
export function isMonsterResurrectionId(id: string): boolean {
  return id === CANONICAL || id === AUTHORED;
}

/** Require complete native semantics before the combat owner may consume a shared corpse token. */
export function matchesMonsterResurrection(skill: RegisteredSkill): boolean {
  const identity = Object.getOwnPropertyDescriptor(skill, 'id');
  if (!identity || !('value' in identity) || typeof identity.value !== 'string' ||
    !isMonsterResurrectionId(identity.value)) return false;
  return same(skill, { ...MONSTER_RESURRECTION_SKILL, id: identity.value });
}

function isLivingOriginalEnemy(unit: CombatUnit): boolean {
  return unit.kind === 'monster' && unit.side === 'enemy' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined;
}

/**
 * Capture-time source qualification only. Call once on the effective starting map;
 * the combat owner's captured membership, current hostility and conversion checks govern later casts.
 */
export function isOriginalMonsterResurrectionSource(unit: CombatUnit): boolean {
  return isLivingOriginalEnemy(unit) && sourceIds.has(unit.monsterArchetypeId ?? '');
}

/**
 * Capture-time body qualification only. Later entrants cannot acquire original membership
 * through this predicate; only the combat owner's captured originals may supply resurrection bodies.
 */
export function isOriginalMonsterResurrectionBody(unit: CombatUnit): boolean {
  return isLivingOriginalEnemy(unit) && bodyIds.has(unit.monsterArchetypeId ?? '') && bodyTiers.has(unit.tier) &&
    Number.isFinite(unit.stats.lifeMax) && unit.stats.lifeMax > 0 &&
    Number.isFinite(unit.stats.manaMax) && unit.stats.manaMax >= 0 && Number.isFinite(unit.mana);
}

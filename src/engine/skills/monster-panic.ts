import rows from '../../data/skills/monsters.json';
import type { CombatUnit, MonsterTier } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const CANONICAL = 'monster.panic_flee', AUTHORED = 'monster-panic-flee';
const validate = createSkillValidator<SkillDef>();
const recipientIds = new Set(['monsters/act1.fallen', 'monsters/act1.dark-one', 'monsters/act1.devilkin']);
const tiers: ReadonlySet<MonsterTier> = new Set(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion']);

/** Closed structural equality rejects inherited, accessor and extra semantic fields. */
function same(value: unknown, expected: unknown): boolean {
  if (value === expected) return true;
  if (typeof value !== 'object' || value === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(value) !== Array.isArray(expected)) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value) ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) return false;
  const keys = Reflect.ownKeys(value), references = Reflect.ownKeys(expected);
  return keys.length === references.length && references.every(key => {
    const actual = Object.getOwnPropertyDescriptor(value, key), reference = Object.getOwnPropertyDescriptor(expected, key);
    return actual !== undefined && reference !== undefined && 'value' in actual && 'value' in reference &&
      same(actual.value, reference.value);
  });
}

/** Validate the exact authored leaf and copy only independent immutable tuning. */
export function resolveMonsterPanic(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === AUTHORED);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.panicFlee) throw new Error('Invalid authored monster Panic');
  const { name: _name, description: _description, icon: _icon, ...semantics } = row;
  if (!same(semantics, { id: AUTHORED, trigger: 'active', target: 'self', cooldown: 5,
    cost: { mana: 0 }, minLevel: 1, maxLevel: 1, panicFlee: { durationMs: 5000, dodgeChance: 0.2 } }))
    throw new Error('Unreviewed authored monster Panic semantics');
  return Object.freeze({ durationMs: row.panicFlee.durationMs, dodgeChance: row.panicFlee.dodgeChance,
    cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel });
}

/** Immutable authored tuning, independent of registry mutation. */
export const MONSTER_PANIC_DEFINITION = resolveMonsterPanic(rows);
/** Native reaction identity; its effects are committed only by the battle owner. */
export const MONSTER_PANIC_SKILL: RegisteredSkill = Object.freeze({ id: CANONICAL, archetype: 'monster',
  trigger: 'active', target: 'self', cooldown: MONSTER_PANIC_DEFINITION.cooldown,
  manaCost: MONSTER_PANIC_DEFINITION.manaCost, minLevel: MONSTER_PANIC_DEFINITION.minLevel,
  effects: Object.freeze([Object.freeze({ kind: 'monster-panic-flee' as const })]) });

/** Only the canonical and authored native identities share reaction authority. */
export function isMonsterPanicId(id: string): boolean { return id === CANONICAL || id === AUTHORED; }
/** A replaced identity or marker-only skill cannot borrow private reaction state. */
export function matchesMonsterPanic(skill: RegisteredSkill): boolean {
  const identity = Object.getOwnPropertyDescriptor(skill, 'id');
  return identity !== undefined && 'value' in identity && typeof identity.value === 'string' &&
    isMonsterPanicId(identity.value) && same(skill, { ...MONSTER_PANIC_SKILL, id: identity.value });
}
/** Capture-time recipient eligibility only; later entrants cannot acquire original membership. */
export function isOriginalPanicRecipient(unit: CombatUnit): boolean {
  return unit.kind === 'monster' && unit.side === 'enemy' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    unit.summonTemplateId === undefined && recipientIds.has(unit.monsterArchetypeId ?? '') && tiers.has(unit.tier);
}

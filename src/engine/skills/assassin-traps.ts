import Ajv2020 from 'ajv/dist/2020';
import tuning from '../../data/combat/assassin-traps.json';
import schema from '../../data/schema/assassin-traps.schema.json';
import authored from '@/data/skills/assassin.json';
import type { SkillDef } from '@/engine/types/skills';
import type { Player } from '@/engine/types/entities';
import type { DamageEffect, RegisteredSkill } from '@/engine/skills/effects';
import { createSkillValidator } from '@/engine/skills/skill-validator';
import { canonicalSkillIdFromData, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { projectPlayerClassActives } from '@/engine/skills/player-class-actives';

/** Exact authored fields, sentries and reactive blade identity. */
export const ASSASSIN_TRAP_IDS = ['assassin.shock_web', 'assassin.charged_bolt_sentry',
  'assassin.wake_of_fire', 'assassin.blade_sentinel', 'assassin.lightning_sentry',
  'assassin.wake_of_inferno', 'assassin.death_sentry', 'assassin.blade_shield'] as const;
export type AssassinTrapId = typeof ASSASSIN_TRAP_IDS[number];
interface Clock {
  readonly id: AssassinTrapId;
  readonly durationMs: number;
  readonly intervalMs: number;
}
type Timing = Clock & (
  | { readonly mode: 'pulse' | 'reactive'; readonly lightning?: never; readonly corpseBurnFraction?: never }
  | { readonly mode: 'corpse'; readonly lightning: { readonly base: readonly [number, number]; readonly perRank: readonly [number, number] };
      readonly corpseBurnFraction: number }
);
interface TrapTuning { readonly id: 'combat/assassin-traps'; readonly skills: readonly Timing[] }
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<TrapTuning>(schema);
/** Validate complete finite tuning and independently copy all owned data. */
export function resolveAssassinTrapTuning(input: unknown): TrapTuning {
  if (!validate(input) || new Set(input.skills.map(row => row.id)).size !== ASSASSIN_TRAP_IDS.length ||
    input.skills.some(row => row.intervalMs >= row.durationMs ||
      (row.lightning !== undefined && (row.lightning.base[1] < row.lightning.base[0] ||
        row.lightning.perRank[1] < row.lightning.perRank[0])))) throw new Error('Invalid authored Assassin traps');
  return freeze(structuredClone(input));
}
/** Immutable authored timing; importing it never establishes paid state. */
export const ASSASSIN_TRAP_TUNING = resolveAssassinTrapTuning(tuning);
const validateSource = createSkillValidator<SkillDef>();
const sources = new Map(ASSASSIN_TRAP_IDS.map(id => {
  const rows = authored.filter(row => canonicalSkillIdFromData(row.id) === id), row = rows[0];
  if (rows.length !== 1 || !validateSource(row) || row.trigger !== 'active' || row.target !== 'all-enemies')
    throw new Error('Invalid authored Assassin trap source');
  const skill = registeredSkillFromJson({ ...row, trigger: 'active', target: 'all-enemies' });
  const pulse = skill.effects[0], timing = ASSASSIN_TRAP_TUNING.skills.find(value => value.id === id);
  if (skill.effects.length !== 1 || pulse?.kind !== 'damage' || !timing) throw new Error('Invalid Assassin trap payload');
  if (pulse.applyStatuses !== undefined) throw new Error('Unsupported compound Assassin trap statuses');
  const effect: DamageEffect = timing.mode === 'corpse'
    ? { ...pulse, applyStatus: { id: 'burn', dotPctOfDamage: timing.corpseBurnFraction } } : pulse;
  return [id, freeze({ ...timing, maxRank: row.maxLevel, skill, pulse: effect })] as const;
}));
/** Canonicalize only the eight exact authored aliases. */
export function assassinTrapId(input: string): AssassinTrapId | undefined {
  const canonical = canonicalSkillIdFromData(input);
  return ASSASSIN_TRAP_IDS.find(id => id === canonical);
}
/** Read-only damage and timing shared by engine and presentation. */
export function assassinTrapDefinition(id: AssassinTrapId) {
  const definition = sources.get(id);
  if (!definition) throw new Error('Unknown Assassin trap');
  return definition;
}
function same(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (typeof actual !== 'object' || actual === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  return Object.keys(actual).length === keys.length && keys.every(key => Object.hasOwn(actual, key) &&
    same(Reflect.get(actual, key), Reflect.get(expected, key)));
}
/** Altered registrations cannot inherit paid trap semantics by name. */
export function matchesAssassinTrap(skill: RegisteredSkill): boolean {
  const id = assassinTrapId(skill.id);
  return id !== undefined && same(skill, assassinTrapDefinition(id).skill);
}
export type AssassinTrapRanks = Readonly<Partial<Record<AssassinTrapId, number>>>;
/** Native selected learned authority uses actual class, unlock and transitive prerequisites. */
export function composeAssassinTrapRanks(player: Pick<Player, 'class' | 'level' | 'comboOrder' | 'skillLevels'>): AssassinTrapRanks {
  if (player.class !== 'assassin') return Object.freeze({});
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: player.comboOrder, ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return Object.freeze(Object.fromEntries(projected.skillOrder.flatMap(alias => {
    const id = assassinTrapId(alias);
    return id ? [[id, projected.skillLevels?.[id] ?? 0]] : [];
  })));
}
/** Reject an expanded or malformed native authority object as a whole. */
export function copyAssassinTrapRanks(input: unknown): AssassinTrapRanks {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return Object.freeze({});
  const pairs = Object.entries(input);
  if (pairs.some(([id, rank]: [string, unknown]) => {
    const canonical = assassinTrapId(id);
    return canonical !== id || typeof rank !== 'number' || !Number.isInteger(rank) || rank < 1 ||
      rank > assassinTrapDefinition(canonical).maxRank;
  })) return Object.freeze({});
  return Object.freeze(Object.fromEntries(pairs));
}

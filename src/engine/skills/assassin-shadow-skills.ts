import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/skills/assassin.json';
import policy from '../../data/summons/assassin-shadow-skills.json';
import schema from '../../data/schema/assassin-shadow-skills.schema.json';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import type { SkillDef } from '../types/skills';
import { canonicalSkillIdFromData, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

/** Shadow templates whose paid native bodies may capture attack authority. */
export type AssassinShadowTemplate = 'shadow_warrior' | 'shadow_master';
/** Learned ranks captured at paid creation, before temporary recipient bonuses. */
export interface AssassinShadowPlan {
  readonly summonRank: number;
  readonly attacks: readonly { readonly id: string; readonly rank: number }[];
}
/** Native per-wave projection; neither this nor paid body bindings are saved. */
export type AssassinShadowSkills = Readonly<Partial<Record<AssassinShadowTemplate, AssassinShadowPlan>>>;
interface ShadowPolicy {
  readonly id: 'summons/assassin-shadow-skills';
  readonly warrior: { readonly mode: 'selected-learned-attacks' };
  readonly master: { readonly mode: 'independent-attacks'; readonly attackSkills: readonly string[] };
}
type Source = SkillDef & { readonly requiredLevel: number; readonly prerequisites?: readonly string[];
  readonly summon?: boolean };
const validateSource = createSkillValidator<Source>();
const rows = authored.map(input => {
  if (!validateSource(input)) throw new Error('Invalid authored Assassin shadow source catalog');
  const source: Source = structuredClone(input), id = canonicalSkillIdFromData(source.id);
  return { id, source };
});
const byId = new Map(rows.map(row => [row.id, row]));
const byAlias = new Map(rows.flatMap(row => [[row.id, row], [row.source.id, row]] as const));
if (byId.size !== rows.length || byAlias.size !== rows.length * 2)
  throw new Error('Duplicate authored Assassin skill identity');
const enemyTargets = new Set(['single-enemy', 'area-enemies', 'all-enemies']);
const attacks = rows.filter(({ source }) => source.trigger === 'active' &&
  enemyTargets.has(source.target) && source.damage !== undefined && source.summon !== true);
const attackIds = new Set(attacks.map(row => row.id));
const templates = ['shadow_warrior', 'shadow_master'] as const;
const shadowSources = templates.map(template => {
  const row = byId.get(`assassin.${template}`);
  if (!row || row.source.trigger !== 'active' || row.source.target !== 'summon' ||
    !('summonId' in row.source) || row.source.summonId !== template)
    throw new Error('Invalid authored shadow summon source');
  return { template, ...row, registered: registeredSkillFromJson({ ...row.source,
    trigger: 'active', target: 'summon' }) };
});
const expectedAttacks = new Map(attacks.map(row => [row.id,
  registeredSkillFromJson({ ...row.source, trigger: 'active', target: row.source.target as
    'single-enemy' | 'area-enemies' | 'all-enemies' })]));
const validatePolicy = new Ajv2020({ strict: true, allErrors: true }).compile<ShadowPolicy>(schema);

/** Validate policy references against actual authored attacks; never invent a fallback pool. */
export function resolveAssassinShadowPolicy(input: unknown): ShadowPolicy {
  if (!validatePolicy(input) || input.master.attackSkills.some(id => !attackIds.has(id)))
    throw new Error('Invalid authored Assassin shadow skill policy');
  return Object.freeze({ id: input.id, warrior: Object.freeze({ ...input.warrior }),
    master: Object.freeze({ ...input.master, attackSkills: Object.freeze([...input.master.attackSkills]) }) });
}
/** Immutable authored independent priority shared by native projection and previews. */
export const ASSASSIN_SHADOW_POLICY = resolveAssassinShadowPolicy(policy);

function allocated(levels: Readonly<Record<string, number>> | undefined, row: (typeof rows)[number]): number {
  return Math.max(0, ...[row.id, row.source.id].map(id => {
    const rank = levels && Object.hasOwn(levels, id) ? levels[id] : undefined;
    return typeof rank === 'number' && Number.isInteger(rank) && rank >= 1 && rank <= row.source.maxLevel ? rank : 0;
  }));
}
function freezePlan(summonRank: number, entries: AssassinShadowPlan['attacks']): AssassinShadowPlan {
  return Object.freeze({ summonRank, attacks: Object.freeze(entries.map(entry => Object.freeze({ ...entry }))) });
}

/** Capture exact class/unlock/transitive ownership and canonical attack priority from native input. */
export function composeAssassinShadowSkills(
  player: Pick<Player, 'class' | 'level' | 'comboOrder' | 'skillLevels'>
): AssassinShadowSkills {
  const result: Partial<Record<AssassinShadowTemplate, AssassinShadowPlan>> = {};
  if (player.class !== 'assassin' || !Number.isInteger(player.level) || player.level < 1) return Object.freeze(result);
  const ranks = new Map<string, number>(), visiting = new Set<string>();
  const legalRank = (id: string): number => {
    if (ranks.has(id)) return ranks.get(id) ?? 0;
    const row = byId.get(id);
    if (!row || visiting.has(id) || player.level < row.source.requiredLevel) return 0;
    const rank = allocated(player.skillLevels, row);
    if (!rank) return 0;
    visiting.add(id);
    const prerequisites = row.source.prerequisites;
    const legal = (prerequisites ?? []).every(alias => legalRank(canonicalSkillIdFromData(alias)) > 0);
    visiting.delete(id);
    ranks.set(id, legal ? rank : 0);
    return legal ? rank : 0;
  };
  const selected = [...new Set(player.comboOrder.flatMap(alias => {
    const row = byAlias.get(alias);
    return row ? [row.id] : [];
  }))];
  for (const row of shadowSources) {
    const summonRank = legalRank(row.id);
    if (!summonRank || !selected.includes(row.id)) continue;
    const entries = row.template === 'shadow_warrior'
      ? selected.filter(id => attackIds.has(id) && legalRank(id) > 0)
        .map(id => ({ id, rank: Math.min(summonRank, legalRank(id)) }))
      : ASSASSIN_SHADOW_POLICY.master.attackSkills.map(id => ({ id,
        rank: Math.min(summonRank, byId.get(id)?.source.maxLevel ?? 0) }));
    result[row.template] = freezePlan(summonRank, entries);
  }
  return Object.freeze(result);
}

function record(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

/** Copy the complete projection; any malformed/expanded key, order or rank disables all authority. */
export function copyAssassinShadowSkills(input: unknown): AssassinShadowSkills {
  const result: Partial<Record<AssassinShadowTemplate, AssassinShadowPlan>> = {};
  if (!record(input)) return Object.freeze(result);
  for (const [template, value] of Object.entries(input)) {
    const row = shadowSources.find(source => source.template === template);
    if (!row || !record(value) || Object.keys(value).length !== 2 ||
      !Object.hasOwn(value, 'summonRank') || !Object.hasOwn(value, 'attacks') ||
      typeof value.summonRank !== 'number' || !Number.isInteger(value.summonRank) ||
      value.summonRank < 1 || value.summonRank > row.source.maxLevel || !Array.isArray(value.attacks)) return Object.freeze({});
    const entries: { id: string; rank: number }[] = [], seen = new Set<string>();
    for (const entry of value.attacks) {
      if (!record(entry) || Object.keys(entry).length !== 2 ||
        !Object.hasOwn(entry, 'id') || !Object.hasOwn(entry, 'rank') || typeof entry.id !== 'string' ||
        !attackIds.has(entry.id) || seen.has(entry.id) || typeof entry.rank !== 'number' ||
        !Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > value.summonRank ||
        entry.rank > (byId.get(entry.id)?.source.maxLevel ?? 0)) return Object.freeze({});
      entries.push({ id: entry.id, rank: entry.rank });
      seen.add(entry.id);
    }
    const summonRank = value.summonRank;
    if (row.template === 'shadow_master' &&
      (entries.length !== ASSASSIN_SHADOW_POLICY.master.attackSkills.length || entries.some((entry, index) =>
        entry.id !== ASSASSIN_SHADOW_POLICY.master.attackSkills[index] ||
        entry.rank !== Math.min(summonRank, byId.get(entry.id)?.source.maxLevel ?? 0)))) return Object.freeze({});
    result[row.template] = freezePlan(summonRank, entries);
  }
  return Object.freeze(result);
}

function same(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (!record(actual) || !record(expected)) {
    return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length &&
      expected.every((value, index) => same(actual[index], value));
  }
  return Object.keys(actual).length === Object.keys(expected).length &&
    Object.keys(expected).every(key => Object.hasOwn(actual, key) && same(actual[key], expected[key]));
}

/** A copied native rank never authorizes a replacement or malformed registered attack. */
export function matchesAssassinShadowAttack(skill: RegisteredSkill): boolean {
  const expected = expectedAttacks.get(skill.id);
  return expected !== undefined && same(skill, expected);
}

/** Qualify native hero ownership and exact paid source semantics before staging any skilled body. */
export function qualifyAssassinShadow(
  owner: CombatUnit & { readonly assassinShadowSkills?: AssassinShadowSkills }, skill: RegisteredSkill, rank: number
): { readonly template: AssassinShadowTemplate; readonly plan: AssassinShadowPlan } | undefined {
  const row = shadowSources.find(source => source.id === skill.id);
  if (!row || owner.id.length === 0 || owner.side !== 'player' || owner.kind !== 'hero' ||
    owner.summon === true || owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    !Number.isFinite(owner.life) || owner.life <= 0 || !Number.isInteger(owner.level) ||
    owner.level < row.source.requiredLevel || rank !== allocated(owner.skillLevels, row) ||
    !owner.skillOrder.some(id => id === row.id || id === row.source.id) || !same(skill, row.registered)) return undefined;
  const plan = copyAssassinShadowSkills(owner.assassinShadowSkills)[row.template];
  const native = composeAssassinShadowSkills({ class: 'assassin', level: owner.level,
    comboOrder: owner.skillOrder, skillLevels: owner.skillLevels ?? {} })[row.template];
  return plan && plan.summonRank === rank && same(plan, native) ? { template: row.template, plan } : undefined;
}

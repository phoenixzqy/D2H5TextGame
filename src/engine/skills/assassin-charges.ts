import type { Player } from '@/engine/types/entities';
import { projectPlayerClassActives } from '@/engine/skills/player-class-actives';
import Ajv2020 from 'ajv/dist/2020';
import authored from '@/data/skills/assassin.json';
import tuning from '../../data/combat/assassin-charges.json';
import schema from '../../data/schema/assassin-charges.schema.json';
import type { SkillDef } from '@/engine/types/skills';
import type { DamageType } from '@/engine/types/attributes';
import type { DamageEffect, RegisteredSkill } from '@/engine/skills/effects';
import { canonicalSkillIdFromData, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { createSkillValidator } from '@/engine/skills/skill-validator';

/** The six authored martial charge families, independent of presentation markers. */
export type AssassinChargeBuilder = `assassin.${'tiger_strike' | 'fists_of_fire' | 'cobra_strike' |
  'claws_of_thunder' | 'blades_of_ice' | 'phoenix_strike'}`;
/** Native kick/claw finishers; basic attacks also release stored charges. */
export type AssassinMartialFinisher = `assassin.${'dragon_talon' | 'dragon_claw' | 'dragon_tail' | 'dragon_flight'}`;
interface ChargeDefinition {
  readonly id: 'combat/assassin-charges';
  readonly maxStacks: number;
  readonly durationMs: number;
  readonly damageFractionPerStack: number;
  readonly lifeFractionPerStack: number;
  readonly manaFractionPerStack: number;
  readonly builders: readonly AssassinChargeBuilder[];
  readonly finishers: readonly AssassinMartialFinisher[];
}
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<ChargeDefinition>(schema);
/** Validate complete finite tuning and prevent a single recovery from exceeding actual HP loss. */
export function resolveAssassinChargeDefinition(input: unknown): ChargeDefinition {
  if (!validate(input) || input.lifeFractionPerStack * input.maxStacks > 1 ||
    input.manaFractionPerStack * input.maxStacks > 1) throw new Error('Invalid authored Assassin charges');
  return freeze(structuredClone(input));
}
/** Immutable JSON tuning shared by state, runtime and previews. */
export const ASSASSIN_CHARGE_DEFINITION = resolveAssassinChargeDefinition(tuning);
const rules = ASSASSIN_CHARGE_DEFINITION;
const validateSource = createSkillValidator<SkillDef>();
const sources = new Map<string, { readonly maxRank: number; readonly skill: RegisteredSkill }>();
for (const input of authored) {
  if (!validateSource(input)) throw new Error('Invalid Assassin martial source catalog');
  const id = canonicalSkillIdFromData(input.id);
  if (![...rules.builders, ...rules.finishers].some(candidate => candidate === id)) continue;
  const source: SkillDef = structuredClone(input);
  const skill = registeredSkillFromJson({ ...source, trigger: 'active',
    target: source.target as 'single-enemy' | 'all-enemies' });
  if (skill.effects.length !== 1 || skill.effects[0]?.kind !== 'damage')
    throw new Error('Invalid Assassin martial damage definition');
  sources.set(id, { maxRank: source.maxLevel, skill: freeze(skill) });
}
if (sources.size !== rules.builders.length + rules.finishers.length) throw new Error('Incomplete Assassin martial catalog');
function same(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (typeof actual !== 'object' || actual === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  return Object.keys(actual).length === keys.length && keys.every(key => Object.hasOwn(actual, key) &&
    same(Reflect.get(actual, key), Reflect.get(expected, key)));
}
/** Names alone cannot opt forged or altered skills into paid martial behavior. */
export function matchesAssassinMartialSkill(skill: RegisteredSkill): boolean {
  const expected = sources.get(skill.id);
  return expected !== undefined && same(skill, expected.skill);
}
/** Native selected learned authority, independent of temporary paid charge state. */
export type AssassinMartialRanks = Readonly<Partial<Record<AssassinChargeBuilder | AssassinMartialFinisher, number>>>;
/** Reuse the native class/unlock/transitive-prerequisite projector before capturing ranks. */
export function composeAssassinMartialRanks(player: Pick<Player, 'class' | 'level' | 'comboOrder' | 'skillLevels'>): AssassinMartialRanks {
  if (player.class !== 'assassin') return Object.freeze({});
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: player.comboOrder, ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  const selected = new Set(projected.skillOrder.map(canonicalSkillIdFromData));
  return Object.freeze(Object.fromEntries([...sources.keys()].filter(id => selected.has(id))
    .map(id => [id, projected.skillLevels?.[id] ?? 0])));
}
/** An invalid or expanded native snapshot grants no martial authority. */
export function copyAssassinMartialRanks(input: unknown): AssassinMartialRanks {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return Object.freeze({});
  const pairs = Object.entries(input);
  if (pairs.some(([id, rank]: [string, unknown]) => {
    const source = sources.get(id);
    return !source || typeof rank !== 'number' || !Number.isInteger(rank) || rank < 1 || rank > source.maxRank;
  })) return Object.freeze({});
  return Object.freeze(Object.fromEntries(pairs));
}
/** Visible immutable view; this data never reconstructs private paid authority. */
export interface AssassinChargePool {
  readonly builder: AssassinChargeBuilder;
  readonly ranks: readonly number[];
  readonly expiresAtMs: number;
}
/** Consumed ranks already include their gain-time Command bonus; resolve this effect at rank1. */
export interface AssassinChargeRelease {
  readonly builder: AssassinChargeBuilder;
  readonly ranks: readonly number[];
  readonly effect?: DamageEffect;
}

/** Unmodified equal-rank release examples; this preview grants no paid combat authority. */
export interface AssassinMartialDisplay {
  readonly kind: 'builder' | 'finisher';
  readonly maxStacks: number;
  readonly durationSeconds: number;
  readonly finishers: readonly AssassinMartialFinisher[];
  readonly payout?:
    | { readonly kind: 'damage'; readonly percentPerStack: number; readonly damageTypes: readonly DamageType[];
        readonly releases: readonly { readonly stacks: number; readonly min: number; readonly max: number }[] }
    | { readonly kind: 'recovery';
        readonly releases: readonly { readonly stacks: number; readonly lifePercent: number; readonly manaPercent: number }[] };
}

function chargeReleaseEffect(builder: AssassinChargeBuilder, ranks: readonly number[]): DamageEffect | undefined {
  const source = sources.get(builder)?.skill.effects[0];
  if (builder === 'assassin.cobra_strike' || source?.kind !== 'damage') return undefined;
  const { perRank, ...effect } = structuredClone(source);
  const base = source.base.map((value, index) => Math.floor(ranks.reduce((sum, rank) =>
    sum + value + (perRank?.[index] ?? 0) * (rank - 1), 0) * rules.damageFractionPerStack));
  return { ...effect, base: [base[0] ?? 0, base[1] ?? 0] };
}

/** Resolve only complete authored martial templates, using the runtime's sum-then-floor payoff. */
export function resolveAssassinMartialDisplay(input: unknown, rank: number): AssassinMartialDisplay | undefined {
  if (!validateSource(input) || input.trigger !== 'active') return undefined;
  const id = canonicalSkillIdFromData(input.id), source = sources.get(id);
  if (!source || input.maxLevel !== source.maxRank || !Number.isInteger(rank) || rank < 1 || rank > source.maxRank ||
    !matchesAssassinMartialSkill(registeredSkillFromJson({ ...input, trigger: 'active' }))) return undefined;
  const common = { maxStacks: rules.maxStacks, durationSeconds: rules.durationMs / 1000, finishers: rules.finishers };
  const builder = rules.builders.find(builder => builder === id);
  if (!builder) return freeze({ ...common, kind: 'finisher' });
  const stacks = Array.from({ length: rules.maxStacks }, (_, index) => index + 1);
  if (builder === 'assassin.cobra_strike') return freeze({ ...common, kind: 'builder', payout: {
    kind: 'recovery', releases: stacks.map(stacks => ({ stacks,
      lifePercent: Number((rules.lifeFractionPerStack * stacks * 100).toFixed(4)),
      manaPercent: Number((rules.manaFractionPerStack * stacks * 100).toFixed(4)) }))
  } });
  const effect = chargeReleaseEffect(builder, [rank]);
  if (!effect) return undefined;
  return freeze({ ...common, kind: 'builder', payout: { kind: 'damage',
    percentPerStack: rules.damageFractionPerStack * 100,
    damageTypes: effect.components?.map(component => component.damageType) ?? [effect.damageType],
    releases: stacks.map(stacks => {
      const release = chargeReleaseEffect(builder, Array.from({ length: stacks }, () => rank));
      return { stacks, min: release?.base[0] ?? 0, max: release?.base[1] ?? 0 };
    })
  } });
}
/** One battle owns one instance; only qualified paid positive hostile hits may call gain. */
export class AssassinCharges {
  readonly #pools = new Map<string, Map<AssassinChargeBuilder, AssassinChargePool>>();
  /** Expiry is strict and nonfinite clocks cannot expose paid power. */
  peek(actor: string, clock: number): readonly AssassinChargePool[] {
    if (!Number.isFinite(clock) || clock < 0) return Object.freeze([]);
    const pools = this.#pools.get(actor);
    if (!pools) return Object.freeze([]);
    for (const [id, pool] of pools) if (pool.expiresAtMs <= clock) pools.delete(id);
    return Object.freeze(rules.builders.flatMap(id => {
      const pool = pools.get(id);
      return pool ? [pool] : [];
    }));
  }
  /** A full pool yields selection to non-builder skills or the ordinary basic fallback. */
  saturated(actor: string, clock: number): boolean {
    return this.peek(actor, clock).some(pool => pool.ranks.length >= rules.maxStacks);
  }
  /** Capture one already-authorized effective rank without adding later temporary bonuses. */
  gain(actor: string, builder: AssassinChargeBuilder, rank: number, clock: number): boolean {
    const source = sources.get(builder);
    if (!actor || !rules.builders.includes(builder) || !source || !Number.isInteger(rank) || rank < 1 ||
      rank > source.maxRank + 1 || !Number.isFinite(clock) || clock < 0 || !Number.isFinite(clock + rules.durationMs) ||
      this.saturated(actor, clock)) return false;
    let pools = this.#pools.get(actor);
    if (!pools) { pools = new Map(); this.#pools.set(actor, pools); }
    const old = pools.get(builder);
    pools.set(builder, freeze({ builder, ranks: [...(old?.ranks ?? []), rank], expiresAtMs: clock + rules.durationMs }));
    return true;
  }
  /** Consume before resolving releases, preventing recursive finisher/charge behavior. */
  consume(actor: string, clock: number): readonly AssassinChargeRelease[] {
    const pools = this.peek(actor, clock);
    if (pools.length === 0) return Object.freeze([]);
    this.#pools.delete(actor);
    return freeze(pools.map(pool => {
      const effect = chargeReleaseEffect(pool.builder, pool.ranks);
      return { builder: pool.builder, ranks: [...pool.ranks], ...(effect ? { effect } : {}) };
    }));
  }
}
/** Plan one finite Cobra transfer; runtime debits and credits exactly the returned mana. */
export function cobraChargeRecovery(hpRemoved: number, stacks: number, missingLife: number,
  missingMana: number, victimMana: number): { readonly life: number; readonly mana: number } {
  if (![hpRemoved, missingLife, missingMana, victimMana].every(Number.isFinite) || hpRemoved <= 0 ||
    !Number.isInteger(stacks) || stacks < 1 || stacks > rules.maxStacks) return { life: 0, mana: 0 };
  return { life: Math.max(0, Math.min(missingLife, Math.floor(hpRemoved * rules.lifeFractionPerStack * stacks))),
    mana: Math.max(0, Math.min(missingMana, victimMana, Math.floor(hpRemoved * rules.manaFractionPerStack * stacks))) };
}

import authored from '../../data/skills/barbarian.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { composeFindItem } from './find-item';

/** Exact learned identities; neither equipment nor imported markers create wards. */
export const GRIM_WARD_IDS = ['skills-barbarian-grim-ward', 'barbarian.grim_ward'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number; readonly tree?: string }>();

function same(value: unknown, expected: unknown): boolean {
  if (value === expected) return true;
  if (typeof value !== 'object' || value === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(value) !== Array.isArray(expected)) return false;
  if (Array.isArray(value) && Array.isArray(expected) && value.length !== expected.length) return false;
  const actual = value as Record<string, unknown>, reference = expected as Record<string, unknown>;
  return Object.keys(actual).length === Object.keys(reference).length &&
    Object.keys(reference).every(key => Object.hasOwn(actual, key) && same(actual[key], reference[key]));
}

/** Validate complete reviewed semantics, then own a frozen primitive tuning copy. */
export function resolveGrimWardDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === GRIM_WARD_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Grim Ward');
  const { name: _name, description: _description, icon: _icon, tree: _tree, ...semantics } = row;
  if (!same(semantics, { id: GRIM_WARD_IDS[0], requiredLevel: 24, trigger: 'active', target: 'all-enemies',
    cooldown: 4, minLevel: 1, maxLevel: 20, prerequisites: ['skills-barbarian-find-item'], cost: { mana: 7 },
    scaling: { cooldownPerLevel: -.05, costPerLevel: -.1 }, corpseWard: { durationMs: 6000,
      durationPerRankMs: 500, intervalMs: 2000, fearDurationMs: 1000, bossDurationMultiplier: .5 } }))
    throw new Error('Unreviewed authored Grim Ward semantics');
  if (!row.corpseWard || row.cost.mana === undefined || row.scaling?.costPerLevel === undefined ||
    row.scaling.cooldownPerLevel === undefined) throw new Error('Missing authored ward tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, manaCost: row.cost.mana,
    manaCostPerRank: row.scaling.costPerLevel, cooldown: row.cooldown, cooldownPerRank: row.scaling.cooldownPerLevel,
    ward: Object.freeze({ ...row.corpseWard }) });
}
/** JSON-owned ward tuning; scheduling/payment remain in the pure combat engine. */
export const GRIM_WARD_DEFINITION = resolveGrimWardDefinition(authored);

/** Requested and registered identities both pass the same dedicated corpse gate. */
export function isGrimWardId(id: string): boolean { return GRIM_WARD_IDS.some(alias => alias === id); }

/** Refuse altered effects, payment or startup semantics before spending a corpse. */
export function matchesGrimWard(skill: RegisteredSkill): boolean {
  const d = GRIM_WARD_DEFINITION;
  return isGrimWardId(skill.id) && same(skill, { id: skill.id, archetype: 'barbarian', trigger: 'active',
    target: 'all-enemies', minLevel: d.requiredLevel, manaCost: d.manaCost, manaCostPerRank: d.manaCostPerRank,
    cooldown: d.cooldown, cooldownPerRank: d.cooldownPerRank, effects: [{ kind: 'corpse-ward' }] });
}

/** Copied current learned authority, never a banked body, timer or saved ward. */
export interface GrimWardProjection { readonly sourceHeroId: string; readonly rank: number }

/** Require the native class, unlock and learned prerequisite chain; MAX valid aliases. */
export function composeGrimWard(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>): GrimWardProjection | undefined {
  if (!composeFindItem(player) || player.level < GRIM_WARD_DEFINITION.requiredLevel) return undefined;
  let rank = 0;
  for (const id of GRIM_WARD_IDS) {
    const value = player.skillLevels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= GRIM_WARD_DEFINITION.maxRank)
      rank = Math.max(rank, value);
  }
  return rank > 0 ? Object.freeze({ sourceHeroId: player.id, rank }) : undefined;
}

/** Reject a complete malformed/sparse/duplicate projection list; own immutable copies. */
export function copyGrimWardProjections(value: unknown): readonly GrimWardProjection[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const entries: readonly unknown[] = value, seen = new Set<string>(), copies: GrimWardProjection[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('rank' in entry) ||
      typeof entry.sourceHeroId !== 'string' || !entry.sourceHeroId || typeof entry.rank !== 'number' ||
      !Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > GRIM_WARD_DEFINITION.maxRank ||
      seen.has(entry.sourceHeroId) || !same(entry, { sourceHeroId: entry.sourceHeroId, rank: entry.rank })) return Object.freeze([]);
    seen.add(entry.sourceHeroId); copies.push(Object.freeze({ sourceHeroId: entry.sourceHeroId, rank: entry.rank }));
  }
  return Object.freeze(copies);
}

/** Native allocation/class provenance is separate from live role/life validation. */
export function grimWardRank(unit: CombatUnit, authority: ReadonlyMap<string, number>): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || !Number.isFinite(unit.life) || unit.life <= 0 ||
    unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < GRIM_WARD_DEFINITION.requiredLevel) return 0;
  return authority.get(unit.id) ?? 0;
}

/** Paid finite lifetime in milliseconds; never clamp malformed ranks into a ward. */
export function grimWardDuration(rank: number): number {
  const d = GRIM_WARD_DEFINITION;
  if (!Number.isInteger(rank) || rank < 1 || rank > d.maxRank) throw new Error('Invalid Grim Ward rank');
  return d.ward.durationMs + d.ward.durationPerRankMs * (rank - 1);
}

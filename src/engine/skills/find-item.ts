import authored from '../../data/skills/barbarian.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { CombatSnapshot } from '../combat/combat';
import { inferKind } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { composeFindPotion } from './find-potion';
import type { Rng } from '../rng';
import { validCapturedSkillRank } from './effective-rank';

/** Exact learned identities; marker buffs or equipment never grant a search. */
export const FIND_ITEM_IDS = ['skills-barbarian-find-item', 'barbarian.find_item'] as const;
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

/** Validate the complete reviewed row, then retain only independent primitive tuning. */
export function resolveFindItemDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === FIND_ITEM_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Find Item');
  const { name: _name, description: _description, icon: _icon, tree: _tree, ...semantics } = row;
  if (!same(semantics, { id: FIND_ITEM_IDS[0], requiredLevel: 12, trigger: 'active', target: 'self',
    cooldown: 4, minLevel: 1, maxLevel: 20, prerequisites: ['skills-barbarian-find-potion'],
    cost: { mana: 7 }, scaling: { cooldownPerLevel: -.05, costPerLevel: -.1 },
    corpseSearch: { successChance: .2, successChancePerRank: .01 } })) throw new Error('Unreviewed authored Find Item semantics');
  if (!row.corpseSearch || row.cost.mana === undefined || row.scaling?.costPerLevel === undefined ||
    row.scaling.cooldownPerLevel === undefined) throw new Error('Missing authored Find Item tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, manaCost: row.cost.mana,
    manaCostPerRank: row.scaling.costPerLevel, cooldown: row.cooldown, cooldownPerRank: row.scaling.cooldownPerLevel,
    search: Object.freeze({ ...row.corpseSearch }) });
}

/** JSON-owned chance, cost and cooldown; successful loot uses ordinary victory settlement. */
export const FIND_ITEM_DEFINITION = resolveFindItemDefinition(authored);

/** Both requested and resolved identities use the finite-body search gate. */
export function isFindItemId(id: string): boolean { return FIND_ITEM_IDS.some(alias => alias === id); }

/** Refuse altered or additional effects before corpse, mana or RNG commitment. */
export function matchesFindItem(skill: RegisteredSkill): boolean {
  const d = FIND_ITEM_DEFINITION;
  return isFindItemId(skill.id) && same(skill, { id: skill.id, archetype: 'barbarian', trigger: 'active',
    target: 'self', manaCost: d.manaCost, manaCostPerRank: d.manaCostPerRank,
    cooldown: d.cooldown, cooldownPerRank: d.cooldownPerRank, minLevel: d.requiredLevel,
    effects: [{ kind: 'corpse-search' }] });
}

/** Current learned native authority; contains no banked corpse or reward. */
export interface FindItemProjection { readonly sourceHeroId: string; readonly rank: number }

/** Require actual class, unlock and learned Find Potion; take MAX of valid search aliases. */
export function composeFindItem(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>): FindItemProjection | undefined {
  if (!composeFindPotion(player) || player.level < FIND_ITEM_DEFINITION.requiredLevel) return undefined;
  let rank = 0;
  for (const id of FIND_ITEM_IDS) {
    const value = player.skillLevels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= FIND_ITEM_DEFINITION.maxRank)
      rank = Math.max(rank, value);
  }
  return rank > 0 ? Object.freeze({ sourceHeroId: player.id, rank }) : undefined;
}

/** Reject the complete projection array for holes, malformed entries, extra fields or duplicate sources. */
export function copyFindItemProjections(value: unknown): readonly FindItemProjection[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const entries: readonly unknown[] = value, seen = new Set<string>(), copies: FindItemProjection[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('rank' in entry) ||
      typeof entry.sourceHeroId !== 'string' || entry.sourceHeroId.length === 0 || typeof entry.rank !== 'number' ||
      !Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > FIND_ITEM_DEFINITION.maxRank ||
      seen.has(entry.sourceHeroId) || !same(entry, { sourceHeroId: entry.sourceHeroId, rank: entry.rank })) return Object.freeze([]);
    seen.add(entry.sourceHeroId); copies.push(Object.freeze({ sourceHeroId: entry.sourceHeroId, rank: entry.rank }));
  }
  return Object.freeze(copies);
}

/** Recheck live runtime role; native allocation/class/prerequisite provenance was composed separately. */
export function findItemRank(unit: CombatUnit, authority: ReadonlyMap<string, number>): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || !Number.isFinite(unit.life) || unit.life <= 0 ||
    unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < FIND_ITEM_DEFINITION.requiredLevel) return 0;
  return authority.get(unit.id) ?? 0;
}

/** Return captured paid potency's probability; plain ranks retain their allocation cap. */
export function findItemChance(rank: number, rankBonus?: 1): number {
  if (!validCapturedSkillRank(rank, FIND_ITEM_DEFINITION.maxRank, rankBonus)) throw new Error('Invalid Find Item rank');
  const tuning = FIND_ITEM_DEFINITION.search;
  return tuning.successChance + tuning.successChancePerRank * (rank - 1);
}

/** Exactly one ordinary seeded draw after a paid corpse search; no loot generation. */
export function rollFindItemSearch(rank: number, rng: Pick<Rng, 'next'>, rankBonus?: 1): boolean {
  const chance = findItemChance(rank, rankBonus);
  return rng.next() < chance;
}

/** Created only by a successful paid engine search, then privately copied during native staging. */
export interface FindItemFind {
  readonly sourceHeroId: string;
  readonly corpseId: string;
  readonly rank: number;
  /** Captured paid potency; subtract to recover the separate original allocated authority. */
  readonly rankBonus?: 1;
}

/** Invalid reward attestations throw before settlement; do not silently lose promised bonus loot. */
export function copyFindItemFinds(value: unknown): readonly FindItemFind[] {
  if (!Array.isArray(value)) throw new Error('Invalid Find Item finds');
  const entries: readonly unknown[] = value, seen = new Set<string>(), copies: FindItemFind[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('corpseId' in entry) || !('rank' in entry) ||
      typeof entry.sourceHeroId !== 'string' || !entry.sourceHeroId || typeof entry.corpseId !== 'string' || !entry.corpseId ||
      typeof entry.rank !== 'number')
      throw new Error('Invalid Find Item find');
    const rankBonus = 'rankBonus' in entry ? entry.rankBonus : undefined;
    const copied: FindItemFind = { sourceHeroId: entry.sourceHeroId, corpseId: entry.corpseId,
      rank: entry.rank, ...(rankBonus === 1 ? { rankBonus: 1 } : {}) };
    if (!validCapturedSkillRank(entry.rank, FIND_ITEM_DEFINITION.maxRank, rankBonus) ||
      seen.has(entry.corpseId) || !same(entry, copied)) throw new Error('Invalid Find Item find');
    seen.add(entry.corpseId); copies.push(Object.freeze(copied));
  }
  return Object.freeze(copies);
}

/** Validate privately captured finds against original native authority and actual slain originals. */
export function findItemBonusEnemies(value: unknown, input: CombatSnapshot,
  finalEnemies: readonly CombatUnit[], heroId: string): readonly CombatUnit[] {
  const finds = copyFindItemFinds(value);
  if (finds.length === 0) return [];
  const authority = new Map(copyFindItemProjections(input.findItem).map(row => [row.sourceHeroId, row.rank]));
  const heroes = input.playerTeam.filter(unit => unit.id === heroId), hero = heroes[0];
  if (heroes.length !== 1 || !hero || findItemRank(hero, authority) === 0) throw new Error('Invalid Find Item source');
  return finds.map(find => {
    const originals = input.enemyTeam.filter(unit => unit.id === find.corpseId), original = originals[0];
    const slain = finalEnemies.filter(unit => unit.id === find.corpseId), dead = slain[0];
    if (find.sourceHeroId !== heroId || find.rank - (find.rankBonus ?? 0) !== authority.get(heroId) || originals.length !== 1 || !original ||
      original.side !== 'enemy' || inferKind(original) !== 'monster' || original.summon === true ||
      original.ownerId !== undefined || original.summonOwnerId !== undefined || !Number.isFinite(original.life) || original.life <= 0 ||
      slain.length !== 1 || !dead || dead.side !== 'enemy' || inferKind(dead) !== 'monster' ||
      !Number.isFinite(dead.life) || dead.life > 0) throw new Error('Invalid Find Item corpse');
    return original;
  });
}

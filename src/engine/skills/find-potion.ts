import authored from '../../data/skills/barbarian.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

/** Exact learned identities; legacy markers and equipment do not grant recovery. */
export const FIND_POTION_IDS = ['skills-barbarian-find-potion', 'barbarian.find_potion'] as const;
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

/** Independently validated primitive tuning; no mutable registry references. */
export function resolveFindPotionDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === FIND_POTION_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Find Potion');
  const { name: _name, description: _description, icon: _icon, tree: _tree, ...semantics } = row;
  if (!same(semantics, { id: FIND_POTION_IDS[0], requiredLevel: 1, trigger: 'active', target: 'self',
    cooldown: 4, minLevel: 1, maxLevel: 20, cost: { mana: 2 }, scaling: { cooldownPerLevel: -.05 },
    corpseRecovery: { lifePct: .1, lifePctPerRank: .005, manaPct: .05, manaPctPerRank: .0025 } })) {
    throw new Error('Unreviewed authored Find Potion semantics');
  }
  if (!row.corpseRecovery || row.cost.mana === undefined || row.scaling?.cooldownPerLevel === undefined)
    throw new Error('Missing authored Find Potion tuning');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, manaCost: row.cost.mana,
    cooldown: row.cooldown, cooldownPerRank: row.scaling.cooldownPerLevel,
    recovery: Object.freeze({ ...row.corpseRecovery }) });
}

/** JSON-owned no-potion recovery; body supply and payment are owned by combat. */
export const FIND_POTION_DEFINITION = resolveFindPotionDefinition(authored);

/** Both requested and resolved identities must pass the same finite-body gate. */
export function isFindPotionId(id: string): boolean {
  return FIND_POTION_IDS.some(alias => alias === id);
}

/** Refuse additional/changed registered effects before resource or corpse commitment. */
export function matchesFindPotion(skill: RegisteredSkill): boolean {
  const d = FIND_POTION_DEFINITION;
  return isFindPotionId(skill.id) && same(skill, { id: skill.id, archetype: 'barbarian', trigger: 'active',
    target: 'self', manaCost: d.manaCost, cooldown: d.cooldown, cooldownPerRank: d.cooldownPerRank,
    minLevel: d.requiredLevel, effects: [{ kind: 'corpse-recovery' }] });
}

/** Copied learned Player authority; never a corpse count or saved paid state. */
export interface FindPotionProjection { readonly sourceHeroId: string; readonly rank: number }

/** Resolve MAX of valid allocated aliases from an eligible native Barbarian. */
export function composeFindPotion(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>): FindPotionProjection | undefined {
  const d = FIND_POTION_DEFINITION;
  if (typeof player.id !== 'string' || player.id.length === 0 || player.class !== 'barbarian' ||
    !Number.isInteger(player.level) || player.level < d.requiredLevel) return undefined;
  let rank = 0;
  for (const id of FIND_POTION_IDS) {
    const value = player.skillLevels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= d.maxRank) rank = Math.max(rank, value);
  }
  return rank > 0 ? Object.freeze({ sourceHeroId: player.id, rank }) : undefined;
}

/** Reject the complete array if any entry, hole, duplicate or extra field is malformed. */
export function copyFindPotionProjections(value: unknown): readonly FindPotionProjection[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const copies: FindPotionProjection[] = [], seen = new Set<string>();
  const entries: readonly unknown[] = value;
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('rank' in entry) ||
      typeof entry.sourceHeroId !== 'string' || entry.sourceHeroId.length === 0 || typeof entry.rank !== 'number' ||
      !Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > FIND_POTION_DEFINITION.maxRank ||
      seen.has(entry.sourceHeroId) || !same(entry, { sourceHeroId: entry.sourceHeroId, rank: entry.rank })) return Object.freeze([]);
    seen.add(entry.sourceHeroId);
    copies.push(Object.freeze({ sourceHeroId: entry.sourceHeroId, rank: entry.rank }));
  }
  return Object.freeze(copies);
}

/** Verify live runtime identity; allocation/class provenance comes from the Player composer. */
export function findPotionRank(unit: CombatUnit, authority: ReadonlyMap<string, number>): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || !Number.isFinite(unit.life) || unit.life <= 0 ||
    unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < FIND_POTION_DEFINITION.requiredLevel) return 0;
  return authority.get(unit.id) ?? 0;
}

/** Actual capped gains after payment; refuse unless HP or pre-payment MP improves. */
export function findPotionRecovery(unit: CombatUnit, rank: number): { readonly life: number; readonly mana: number } | undefined {
  const d = FIND_POTION_DEFINITION, t = d.recovery;
  if (!Number.isInteger(rank) || rank < 1 || rank > d.maxRank ||
    ![unit.life, unit.mana, unit.stats.lifeMax, unit.stats.manaMax].every(Number.isFinite) ||
    unit.life <= 0 || unit.stats.lifeMax <= 0 || unit.stats.manaMax <= 0 ||
    unit.life > unit.stats.lifeMax || unit.mana < d.manaCost || unit.mana > unit.stats.manaMax) return undefined;
  const rawLife = Math.floor(unit.stats.lifeMax * (t.lifePct + t.lifePctPerRank * (rank - 1)));
  const rawMana = Math.floor(unit.stats.manaMax * (t.manaPct + t.manaPctPerRank * (rank - 1)));
  if (!Number.isFinite(rawLife) || !Number.isFinite(rawMana)) return undefined;
  const life = Math.min(unit.stats.lifeMax - unit.life, rawLife);
  const mana = Math.min(unit.stats.manaMax - unit.mana + d.manaCost, rawMana);
  return life > 0 || mana > d.manaCost ? { life, mana } : undefined;
}

import { createSkillValidator } from './skill-validator';
import necromancerSkills from '../../data/skills/necromancer.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { inferKind, type CombatUnit } from '../combat/types';

const PE = 'necromancer.poison_explosion', AUTHORED = 'skills-necromancer-poison-explosion';
const DAGGER = 'skills-necromancer-poison-dagger';
type Source = SkillDef & { readonly requiredLevel: number; readonly prerequisites?: readonly string[]; readonly tree?: string };
const validate = createSkillValidator<Source>();

/** Exact structural semantics; additional fields must receive their own mechanic review. */
function same(value: unknown, expected: unknown): boolean {
  if (value === expected) return true;
  if (typeof value !== 'object' || value === null || typeof expected !== 'object' || expected === null ||
    Array.isArray(value) !== Array.isArray(expected)) return false;
  if (Array.isArray(value) && Array.isArray(expected) && value.length !== expected.length) return false;
  const actual = value as Record<string, unknown>, reference = expected as Record<string, unknown>;
  return Object.keys(actual).length === Object.keys(reference).length &&
    Object.keys(reference).every(key => Object.hasOwn(actual, key) && same(actual[key], reference[key]));
}

/** Independent JSON-derived eligibility and tuning for the accepted finite-corpse mechanic. */
export interface PoisonExplosionDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly daggerMaxRank: number;
  readonly manaCost: number;
  readonly cooldown: number;
  readonly baseMin: number;
  readonly baseMax: number;
  readonly damagePerRank: number;
  readonly poisonPct: number;
}

/** Validate source separately from the mutable runtime registry, then copy only primitives. */
export function resolvePoisonExplosionDefinition(rows: readonly unknown[]): PoisonExplosionDefinition {
  function authored(id: string): Source {
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    const row = matches[0];
    if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Poison Explosion source/prerequisite');
    return row;
  }
  const pe = authored(AUTHORED), dagger = authored(DAGGER);
  const { name: _name, description: _description, icon: _icon, tree: _tree, ...semantics } = pe;
  if (!same(semantics, {
    id: AUTHORED, requiredLevel: 18, prerequisites: [DAGGER], trigger: 'active', target: 'all-enemies',
    cooldown: 2, minLevel: 1, maxLevel: 20, cost: { mana: 15 },
    damage: { min: 40, max: 60, breakdown: { poison: 60 } }, damageType: 'poison',
    appliesStatus: ['poison'], statusEffect: { dotPctOfDamage: 0.05 },
    appliesTags: ['poison'], scaling: { damagePerLevel: 5 }
  }) || dagger.maxLevel !== 20 || dagger.requiredLevel !== 6 || dagger.prerequisites !== undefined) {
    throw new Error('Unreviewed authored Poison Explosion semantics');
  }
  const manaCost = pe.cost.mana, damage = pe.damage, damagePerRank = pe.scaling?.damagePerLevel;
  const poisonPct = pe.statusEffect?.dotPctOfDamage;
  if (manaCost === undefined || !damage || damagePerRank === undefined || poisonPct === undefined) {
    throw new Error('Missing authored Poison Explosion tuning');
  }
  return Object.freeze({ requiredLevel: pe.requiredLevel, maxRank: pe.maxLevel, daggerMaxRank: dagger.maxLevel,
    manaCost, cooldown: pe.cooldown, baseMin: damage.min, baseMax: damage.max, damagePerRank, poisonPct });
}

/** Frozen authored reference, independent of registration order or later registry overrides. */
export const POISON_EXPLOSION_DEFINITION = resolvePoisonExplosionDefinition(necromancerSkills);

/** Both exact order aliases and resolved PE identities must pass the corpse gate. */
export function isPoisonExplosionId(id: string): boolean {
  return id === PE || id === AUTHORED;
}

/** Refuse changed/additional registered semantics before a corpse or resources can be spent. */
export function matchesPoisonExplosion(skill: RegisteredSkill): boolean {
  const d = POISON_EXPLOSION_DEFINITION;
  return isPoisonExplosionId(skill.id) && same(skill, {
    id: skill.id, archetype: 'necromancer', trigger: 'active', target: 'all-enemies',
    manaCost: d.manaCost, cooldown: d.cooldown, minLevel: d.requiredLevel,
    effects: [{ kind: 'damage', damageType: 'poison', base: [d.baseMin, d.baseMax],
      perRank: [d.damagePerRank, d.damagePerRank], tags: ['poison'],
      applyStatus: { id: 'poison', dotPctOfDamage: d.poisonPct } }]
  });
}

function allocated(levels: Readonly<Record<string, number>> | undefined, aliases: readonly string[], cap: number): number {
  let rank = 0;
  for (const id of aliases) {
    const value = levels?.[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= cap) rank = Math.max(rank, value);
  }
  return rank;
}

/** Minimal Player-derived wave authority; no persistent corpse inventory or generic skill fallback. */
export interface PoisonExplosionProjection {
  readonly sourceHeroId: string;
  readonly rank: number;
}

/** Require actual Necromancer unlock, allocated Poison Dagger and valid allocated PE aliases. */
export function composePoisonExplosion(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>):
  PoisonExplosionProjection | undefined {
  const d = POISON_EXPLOSION_DEFINITION;
  if (typeof player.id !== 'string' || player.id.length === 0 || player.class !== 'necromancer' ||
    !Number.isInteger(player.level) || player.level < d.requiredLevel ||
    allocated(player.skillLevels, [DAGGER, 'necromancer.poison_dagger'], d.daggerMaxRank) === 0) return undefined;
  const rank = allocated(player.skillLevels, [PE, AUTHORED], d.maxRank);
  return rank > 0 ? Object.freeze({ sourceHeroId: player.id, rank }) : undefined;
}

/** Copy a complete readonly authority array; any malformed entry or duplicate disables the array. */
export function copyPoisonExplosionProjections(value: unknown): readonly PoisonExplosionProjection[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const copied: PoisonExplosionProjection[] = [], ids = new Set<string>();
  const entries: readonly unknown[] = value;
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('rank' in entry) ||
      typeof entry.rank !== 'number' || typeof entry.sourceHeroId !== 'string' ||
      entry.sourceHeroId.length === 0 || !Number.isInteger(entry.rank) || entry.rank < 1 ||
      entry.rank > POISON_EXPLOSION_DEFINITION.maxRank || ids.has(entry.sourceHeroId) ||
      !same(entry, { sourceHeroId: entry.sourceHeroId, rank: entry.rank })) return Object.freeze([]);
    ids.add(entry.sourceHeroId);
    copied.push(Object.freeze({ sourceHeroId: entry.sourceHeroId, rank: entry.rank }));
  }
  return Object.freeze(copied);
}

/** Runtime identity/liveness guard; class/prerequisite provenance belongs to the Player composer. */
export function poisonExplosionRank(unit: CombatUnit, authority: ReadonlyMap<string, number>): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || !Number.isFinite(unit.life) || unit.life <= 0 ||
    unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < POISON_EXPLOSION_DEFINITION.requiredLevel) return 0;
  return authority.get(unit.id) ?? 0;
}

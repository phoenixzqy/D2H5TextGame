import { createSkillValidator } from './skill-validator';
import necromancerSkills from '../../data/skills/necromancer.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { inferKind, type CombatUnit } from '../combat/types';

const CE = 'necromancer.corpse_explosion', AUTHORED = 'skills-necromancer-corpse-explosion';
const TEETH = 'skills-necromancer-teeth';
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
export interface CorpseExplosionDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly teethMaxRank: number;
  readonly manaCost: number;
  readonly cooldown: number;
  readonly baseMin: number;
  readonly baseMax: number;
  readonly damagePerRank: number;
  readonly ignitePct: number;
}

/** Validate source separately from the mutable runtime registry, then copy only primitives. */
export function resolveCorpseExplosionDefinition(rows: readonly unknown[]): CorpseExplosionDefinition {
  function authored(id: string): Source {
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    const row = matches[0];
    if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Corpse Explosion source/prerequisite');
    return row;
  }
  const ce = authored(AUTHORED), teeth = authored(TEETH);
  const { name: _name, description: _description, icon: _icon, tree: _tree, ...semantics } = ce;
  if (!same(semantics, {
    id: AUTHORED, requiredLevel: 6, prerequisites: [TEETH], trigger: 'active', target: 'all-enemies',
    cooldown: 2, minLevel: 1, maxLevel: 20, cost: { mana: 20 },
    damage: { min: 50, max: 80, breakdown: { fire: 80 } }, damageType: 'fire', ignoresDefense: true,
    appliesStatus: ['ignite'], statusEffect: { dotPctOfDamage: 0.1 },
    appliesTags: ['fire', 'burn'], scaling: { damagePerLevel: 80 }
  }) || teeth.maxLevel !== 20 || teeth.requiredLevel !== 1 || teeth.prerequisites !== undefined) {
    throw new Error('Unreviewed authored Corpse Explosion semantics');
  }
  const manaCost = ce.cost.mana, damage = ce.damage, damagePerRank = ce.scaling?.damagePerLevel;
  const ignitePct = ce.statusEffect?.dotPctOfDamage;
  if (manaCost === undefined || !damage || damagePerRank === undefined || ignitePct === undefined) {
    throw new Error('Missing authored Corpse Explosion tuning');
  }
  return Object.freeze({ requiredLevel: ce.requiredLevel, maxRank: ce.maxLevel, teethMaxRank: teeth.maxLevel,
    manaCost, cooldown: ce.cooldown, baseMin: damage.min, baseMax: damage.max, damagePerRank, ignitePct });
}

/** Frozen authored reference, independent of registration order or later registry overrides. */
export const CORPSE_EXPLOSION_DEFINITION = resolveCorpseExplosionDefinition(necromancerSkills);

/** Both exact order aliases and resolved CE identities must pass the corpse gate. */
export function isCorpseExplosionId(id: string): boolean {
  return id === CE || id === AUTHORED;
}

/** Refuse changed/additional registered semantics before a corpse or resources can be spent. */
export function matchesCorpseExplosion(skill: RegisteredSkill): boolean {
  const d = CORPSE_EXPLOSION_DEFINITION;
  return isCorpseExplosionId(skill.id) && same(skill, {
    id: skill.id, archetype: 'necromancer', trigger: 'active', target: 'all-enemies',
    manaCost: d.manaCost, cooldown: d.cooldown, minLevel: d.requiredLevel,
    effects: [{ kind: 'damage', damageType: 'fire', ignoresDefense: true, base: [d.baseMin, d.baseMax],
      perRank: [d.damagePerRank, d.damagePerRank], tags: ['fire', 'burn'],
      applyStatus: { id: 'ignite', dotPctOfDamage: d.ignitePct } }]
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
export interface CorpseExplosionProjection {
  readonly sourceHeroId: string;
  readonly rank: number;
}

/** Require actual Necromancer unlock, allocated Teeth and valid allocated CE aliases. */
export function composeCorpseExplosion(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>):
  CorpseExplosionProjection | undefined {
  const d = CORPSE_EXPLOSION_DEFINITION;
  if (typeof player.id !== 'string' || player.id.length === 0 || player.class !== 'necromancer' ||
    !Number.isInteger(player.level) || player.level < d.requiredLevel ||
    allocated(player.skillLevels, [TEETH, 'necromancer.teeth'], d.teethMaxRank) === 0) return undefined;
  const rank = allocated(player.skillLevels, [CE, AUTHORED], d.maxRank);
  return rank > 0 ? Object.freeze({ sourceHeroId: player.id, rank }) : undefined;
}

/** Copy a complete readonly authority array; any malformed entry or duplicate disables the array. */
export function copyCorpseExplosionProjections(value: unknown): readonly CorpseExplosionProjection[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const copied: CorpseExplosionProjection[] = [], ids = new Set<string>();
  const entries: readonly unknown[] = value;
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('sourceHeroId' in entry) || !('rank' in entry) ||
      typeof entry.rank !== 'number' || typeof entry.sourceHeroId !== 'string' ||
      entry.sourceHeroId.length === 0 || !Number.isInteger(entry.rank) || entry.rank < 1 ||
      entry.rank > CORPSE_EXPLOSION_DEFINITION.maxRank || ids.has(entry.sourceHeroId) ||
      !same(entry, { sourceHeroId: entry.sourceHeroId, rank: entry.rank })) return Object.freeze([]);
    ids.add(entry.sourceHeroId);
    copied.push(Object.freeze({ sourceHeroId: entry.sourceHeroId, rank: entry.rank }));
  }
  return Object.freeze(copied);
}

/** Runtime identity/liveness guard; class/prerequisite provenance belongs to the Player composer. */
export function corpseExplosionRank(unit: CombatUnit, authority: ReadonlyMap<string, number>): number {
  if (unit.side !== 'player' || inferKind(unit) !== 'hero' || !Number.isFinite(unit.life) || unit.life <= 0 ||
    unit.summon === true || unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < CORPSE_EXPLOSION_DEFINITION.requiredLevel) return 0;
  return authority.get(unit.id) ?? 0;
}

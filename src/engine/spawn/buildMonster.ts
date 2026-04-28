/**
 * Build a {@link CombatUnit} from a JSON monster archetype.
 *
 * Promoted from `tests/sim/bloodMoor.sim.test.ts` so the production combat
 * bridge (`src/stores/combatHelpers.ts`) and the simulators share one code
 * path. Pure: no DOM/RNG dependence — the caller decides life-roll if it
 * wants randomness; we use the average for reproducibility.
 *
 * Spec: `docs/design/level1-balance.md` §4.1.
 *
 * @module engine/spawn/buildMonster
 */

import type { CombatUnit, MonsterTier } from '../combat/types';
import type { DerivedStats } from '../types/attributes';
import act1Monsters from '@/data/monsters/act1.json';

interface MonsterArchetype {
  readonly id: string;
  readonly name: string;
  readonly life: readonly number[];
  readonly attackSpeed: number;
  readonly defense: number;
  readonly resistances: Partial<Record<string, number>>;
  readonly skills: readonly string[];
  readonly attackIntervalMs?: number;
}

const ALL_ARCHETYPES: readonly MonsterArchetype[] = [
  ...(act1Monsters as readonly MonsterArchetype[])
];

/** Look up an archetype by id. Throws on miss. */
export function findArchetype(id: string): MonsterArchetype {
  const found = ALL_ARCHETYPES.find((m) => m.id === id);
  if (!found) throw new Error(`monster archetype not found: ${id}`);
  return found;
}

/**
 * Derive the monster's base attack damage from the skills it carries. The
 * production skill registry maps `monster-weak-melee` → 10–15 (avg 12) and
 * `monster-strong-melee` → 30–50 (avg 40).
 */
function deriveBaseAttack(a: MonsterArchetype): number {
  if (a.skills.includes('monster-strong-melee')) return 40;
  return 12;
}

/**
 * Construct an in-combat monster {@link CombatUnit}. Defaults match the
 * simulator (avg life, level=1, tier=trash).
 */
export function buildMonster(
  archetypeId: string,
  level = 1,
  tier: MonsterTier = 'trash',
  idSuffix: string | number = 0
): CombatUnit {
  const a = findArchetype(archetypeId);
  const lo = a.life[0] ?? 0;
  const hi = a.life[1] ?? lo;
  const lifeAvg = Math.floor((lo + hi) / 2);
  const baseAttack = deriveBaseAttack(a);

  const stats: DerivedStats = {
    life: lifeAvg,
    lifeMax: lifeAvg,
    mana: 0,
    manaMax: 0,
    attack: baseAttack,
    defense: a.defense,
    attackSpeed: a.attackSpeed,
    critChance: 0.05,
    critDamage: 1.5,
    physDodge: 0,
    magicDodge: 0,
    magicFind: 0,
    goldFind: 0,
    resistances: {
      fire: a.resistances.fire ?? 0,
      cold: a.resistances.cold ?? 0,
      lightning: a.resistances.lightning ?? 0,
      poison: a.resistances.poison ?? 0,
      arcane: a.resistances.arcane ?? 0,
      physical: a.resistances.physical ?? 0
    }
  };

  return {
    id: `${archetypeId}-${String(idSuffix)}`,
    name: a.name,
    side: 'enemy',
    level,
    tier,
    stats,
    life: lifeAvg,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...(a.attackIntervalMs !== undefined ? { attackIntervalMs: a.attackIntervalMs } : {})
  };
}

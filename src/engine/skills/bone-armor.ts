import skills from '../../data/skills/necromancer.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { createSkillValidator } from './skill-validator';

export const BONE_ARMOR_IDS = ['skills-necromancer-bone-armor', 'necromancer.bone_armor'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate and copy authored personal absorption independently of mutable catalog state. */
export function resolveBoneArmorDefinition(rows: readonly unknown[]): {
  readonly requiredLevel: number; readonly maxRank: number; readonly absorbPerRank: number;
} {
  const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === BONE_ARMOR_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Bone Armor');
  const absorbPerRank = row.scaling?.passiveStatsPerLevel?.boneArmorAbsorb;
  if (absorbPerRank === undefined) throw new Error('Missing Bone Armor absorption');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, absorbPerRank });
}
export const BONE_ARMOR_DEFINITION = resolveBoneArmorDefinition(skills);

/** One fresh-run pool from actual eligible allocation; never a saved-stat modifier. */
export function composeBoneArmor(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>): readonly ActiveStatus[] {
  const d = BONE_ARMOR_DEFINITION;
  if (player.class !== 'necromancer' || !Number.isFinite(player.level) || player.level < d.requiredLevel || !player.id) return [];
  let rank = 0;
  for (const id of BONE_ARMOR_IDS) {
    const allocated = player.skillLevels?.[id];
    if (typeof allocated === 'number' && Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(d.maxRank, allocated));
    }
  }
  const remaining = rank * d.absorbPerRank;
  return remaining > 0 && Number.isFinite(remaining)
    ? [Object.freeze({ id: 'bone-armor', sourceId: player.id, stacks: 1, remaining: -1,
      boneArmor: Object.freeze({ rank, remaining }) })] : [];
}

/** Only a single valid source-bound pool can absorb; bare markers never supply potency. */
export function boneArmorPool(unit: CombatUnit): ActiveStatus | undefined {
  if (unit.side !== 'player' || unit.kind !== 'hero' || (unit.summon ?? false) || unit.ownerId !== undefined ||
    unit.summonOwnerId !== undefined || !Number.isFinite(unit.life) || unit.life <= 0 ||
    !Number.isFinite(unit.level) || unit.level < BONE_ARMOR_DEFINITION.requiredLevel) return undefined;
  const matches = unit.statuses.filter(s => s.id === 'bone-armor');
  if (matches.length !== 1) return undefined;
  const s = matches[0], pool = s?.boneArmor;
  if (!s || !pool || s.sourceId !== unit.id || s.stacks !== 1 || s.remaining !== -1 ||
    s.appliedAtMs !== undefined || s.expiresAtMs !== undefined || s.dotPerStack !== undefined ||
    Object.keys(pool).length !== 2 || !Number.isInteger(pool.rank) || pool.rank < 1 ||
    pool.rank > BONE_ARMOR_DEFINITION.maxRank || !Number.isFinite(pool.remaining) || pool.remaining <= 0 ||
    pool.remaining > pool.rank * BONE_ARMOR_DEFINITION.absorbPerRank) return undefined;
  return s;
}

/** Independently copy the one valid transient pool at engine registration. */
export function copyBoneArmorStatuses(unit: CombatUnit): CombatUnit {
  const valid = boneArmorPool(unit);
  return { ...unit, statuses: unit.statuses.flatMap(s => s.id !== 'bone-armor' ? [s] :
    s === valid && s.boneArmor ? [{ ...s, boneArmor: Object.freeze({ ...s.boneArmor }) }] : []) };
}

/** Settle already-mitigated damage without RNG; caller owns events and death ordering. */
export function absorbBoneArmor(unit: CombatUnit, amount: number): {
  readonly unit: CombatUnit; readonly damage: number; readonly absorbed: number;
} {
  const status = boneArmorPool(unit), pool = status?.boneArmor;
  if (!pool || !Number.isFinite(amount) || amount <= 0) return { unit, damage: amount, absorbed: 0 };
  const absorbed = Math.min(amount, pool.remaining), remaining = pool.remaining - absorbed;
  const statuses = unit.statuses.flatMap(s => s !== status ? [s] : remaining > 0
    ? [{ ...s, boneArmor: Object.freeze({ rank: pool.rank, remaining }) }] : []);
  return { unit: { ...unit, statuses }, damage: amount - absorbed, absorbed };
}

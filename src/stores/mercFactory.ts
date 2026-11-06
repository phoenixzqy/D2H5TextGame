/**
 * Mercenary factory — converts a `MercDef` (from the gacha JSON) into a
 * fully-typed `Mercenary` entity that satisfies the strict `Unit` shape used
 * by the engine. Lives in `stores/` because it is the glue between data
 * loaders and runtime entity state; no engine simulation logic lives here.
 */

import type { Mercenary } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import { MITIGATION_DEFINITION } from '@/engine/combat/mitigation-definition';
import { deriveStats } from '@/engine/progression/stats';
import { growMercenary } from '@/engine/progression/merc-growth';
import { LEVEL_CAP } from '@/engine/progression/xp';
import { resolveMercSkillLoadout, type MercDef } from '@/data/loaders/mercs';

/**
 * Build a fresh Mercenary instance from a static `MercDef`.
 * `instanceSuffix` makes the runtime id unique across pulls (so two pulls of
 * the same SSR don't collide if duplicates are ever permitted in roster).
 * Paid recruits pass `recruitmentLevel`: catalog core stats are the L1 baseline,
 * advanced through ordinary class growth with full initial life/mana. Omitting
 * it preserves the separately supported catalog-level deterministic hire path.
 */
export function createMercFromDef(def: MercDef, instanceSuffix?: string, recruitmentLevel?: number): Mercenary {
  if (recruitmentLevel !== undefined && (!Number.isInteger(recruitmentLevel) ||
      recruitmentLevel < 1 || recruitmentLevel > LEVEL_CAP)) throw new RangeError('Invalid recruitment level');
  const level = recruitmentLevel === undefined ? Math.max(1, def.reqLevel) : 1;
  const coreStats: CoreStats = {
    strength: def.baseStats.strength,
    dexterity: def.baseStats.dexterity,
    vitality: def.baseStats.vitality,
    energy: def.baseStats.energy
  };
  const derivedStats = {
    ...deriveStats(coreStats, level),
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.mercenary))
  };
  const id = instanceSuffix ? `${def.id}#${instanceSuffix}` : def.id;
  const comboOrder = resolveMercSkillLoadout(def).filter((skillId) => skillId.trim().length > 0);
  const merc: Mercenary = {
    id,
    name: def.name,
    type: 'mercenary',
    team: 'player',
    level,
    coreStats,
    derivedStats,
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder,
    alive: true,
    turnOrder: 0,
    archetype: def.archetype,
    classId: def.classRef,
    rarity: def.rarity,
    signatureSkillId: def.signatureSkillId,
    equipment: []
  };
  if (recruitmentLevel === undefined) return merc;
  const grown = growMercenary(merc, recruitmentLevel - 1);
  return { ...grown, derivedStats: { ...grown.derivedStats, mana: grown.derivedStats.manaMax } };
}

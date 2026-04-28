/**
 * Mercenary factory — converts a `MercDef` (from the gacha JSON) into a
 * fully-typed `Mercenary` entity that satisfies the strict `Unit` shape used
 * by the engine. Lives in `stores/` because it is the glue between data
 * loaders and runtime entity state; no engine simulation logic lives here.
 */

import type { Mercenary } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import { deriveStats } from '@/engine/progression/stats';
import type { MercDef } from '@/data/loaders/mercs';

/**
 * Build a fresh Mercenary instance from a static `MercDef`.
 * `instanceSuffix` makes the runtime id unique across pulls (so two pulls of
 * the same SSR don't collide if duplicates are ever permitted in roster).
 */
export function createMercFromDef(def: MercDef, instanceSuffix?: string): Mercenary {
  const coreStats: CoreStats = {
    strength: def.baseStats.strength,
    dexterity: def.baseStats.dexterity,
    vitality: def.baseStats.vitality,
    energy: def.baseStats.energy
  };
  const derivedStats = deriveStats(coreStats, Math.max(1, def.reqLevel));
  const id = instanceSuffix ? `${def.id}#${instanceSuffix}` : def.id;
  return {
    id,
    name: def.name,
    type: 'mercenary',
    team: 'player',
    level: Math.max(1, def.reqLevel),
    coreStats,
    derivedStats,
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: def.comboOrder ?? [],
    alive: true,
    turnOrder: 0,
    archetype: def.archetype,
    rarity: def.rarity,
    equipment: []
  };
}

import { createRng, hashSeed } from '../rng';
import type { ItemRollPools, RollUniqueItemInput } from './rollItem';

/** Immutable content profile supplied by the closed, versioned data loader. */
export interface QuestUniqueProfile {
  readonly id: string;
  readonly ilvl: number;
  readonly entries: readonly {
    readonly uniqueId: string;
    readonly baseId: string;
    readonly reqLevel: number;
    readonly weight: number;
  }[];
}

/** The only executable unique-pool reference; the version owns its item level. */
export interface QuestUniqueProfileRewardInput {
  readonly profileId: 'quest-rewards/act3-gidbinn-ring-v1';
}

/** Accept only an exact closed authored profile reference, with no overrides. */
export function isQuestUniqueProfileRewardInput(value: unknown): value is QuestUniqueProfileRewardInput {
  return typeof value === 'object' && value !== null && Object.keys(value).length === 1 &&
    Object.hasOwn(value, 'profileId') && 'profileId' in value &&
    value.profileId === 'quest-rewards/act3-gidbinn-ring-v1';
}

/**
 * Validate every canonical member before one private seeded selection.
 * Profiles come from the schema-validated closed content loader. Returns one
 * exact-unique input, without allocation, reroll, filtering or fallback.
 */
export function resolveQuestUniqueProfile(profile: QuestUniqueProfile, pools: ItemRollPools,
  playerId: string, questId: string): RollUniqueItemInput | undefined {
  if (!Number.isSafeInteger(profile.ilvl) || profile.ilvl <= 0 || profile.entries.length === 0) return undefined;
  const ids = new Set<string>();
  for (const entry of profile.entries) {
    if (ids.has(entry.uniqueId) || entry.weight !== 1) return undefined;
    ids.add(entry.uniqueId);
    const matches = (pools.uniques ?? []).filter(row => row.id === entry.uniqueId);
    const template = matches[0];
    if (matches.length !== 1 || !template || template.baseId !== entry.baseId ||
      template.reqLevel !== entry.reqLevel ||
      !Number.isSafeInteger(template.qlvl ?? template.reqLevel) ||
      (template.qlvl ?? template.reqLevel) < 1 || profile.ilvl < (template.qlvl ?? template.reqLevel)) return undefined;
    const base = pools.bases.get(entry.baseId);
    if (!base || base.id !== entry.baseId || base.type !== 'jewelry' ||
      (base.slot !== 'ring-left' && base.slot !== 'ring-right')) return undefined;
  }
  const seed = hashSeed(JSON.stringify(['quest-unique-pool-v1', playerId, questId, profile.id, profile.ilvl]));
  const entry = profile.entries[createRng(seed).nextInt(0, profile.entries.length - 1)];
  return entry ? { uniqueId: entry.uniqueId, ilvl: profile.ilvl } : undefined;
}

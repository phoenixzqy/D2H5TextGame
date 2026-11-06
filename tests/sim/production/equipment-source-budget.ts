/** Diagnostic only: planning/source support and constructed rewards confer no earned progress. */
import { isDeepStrictEqual } from 'node:util';
import { vi } from 'vitest';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { applyReplayProfileToPlan } from '@/engine/map/replay-profile';
import { rollKillRewards, type AwardDataPools, type KillRewardInput } from '@/engine/loot/award';
import * as drops from '@/engine/loot/drop-roller';
import { prepareMaterialAction, planMaterialAction, type MaterialActionInventory } from '@/engine/crafting/material-actions';
import { createRng, hashSeed } from '@/engine/rng';

interface RewardContext {
  readonly input: KillRewardInput;
  readonly witness: { readonly areaId: string; readonly mode: 'manual' | 'idle'; readonly ordinal: number };
  plannedOccurrences: number;
}
interface EquipmentCensus {
  readonly scan: { readonly seed: number; readonly ordinals: readonly number[];
    readonly modes: readonly ('manual' | 'idle')[];
    readonly difficulties: readonly ('normal' | 'nightmare' | 'hell')[] };
  readonly areaIds: readonly string[];
  readonly contexts: readonly RewardContext[];
}

/** Fixed native planning scan, deduplicated by actual reward inputs; not a spawn-frequency model. */
export function enumerateEquipmentRewardContexts(): EquipmentCensus {
  const scan = { seed: 7, ordinals: Array.from({ length: 13 }, (_, index) => index),
    modes: ['manual', 'idle'] as const, difficulties: ['normal', 'nightmare', 'hell'] as const };
  const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
  const fallback = monsters[0];
  if (!fallback) throw new Error('Missing production monsters');
  const contexts = new Map<string, RewardContext>();
  for (const subArea of subAreas) for (const mode of scan.modes) for (const ordinal of scan.ordinals) {
    const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
      fallbackLevel: subArea.areaLevel, seed: scan.seed, challengeOrdinal: ordinal, mode });
    const act = Number(subArea.actId.slice(-1));
    if (act !== 1 && act !== 2 && act !== 3 && act !== 4 && act !== 5) throw new Error('Unknown source act');
    for (const difficulty of scan.difficulties) {
      const replay = applyReplayProfileToPlan(plan, difficulty, monsterIndex);
      for (const wave of replay.waves) for (const spawn of wave.spawns) {
        const input: KillRewardInput = { act, difficulty, tier: spawn.tier, monsterLevel: spawn.level,
          treasureClassId: wave.lootTable ?? replay.defaultLootTable, magicFind: 0, goldFind: 0 };
        const key = JSON.stringify(input), existing = contexts.get(key);
        if (existing) existing.plannedOccurrences++;
        else contexts.set(key, { input, witness: { areaId: subArea.id, mode, ordinal }, plannedOccurrences: 1 });
      }
    }
  }
  return { scan, areaIds: subAreas.map(area => area.id), contexts: [...contexts.values()] };
}

interface TableObservation {
  readonly id: string;
  /** Null retains the native tier default rather than guessing its value. */
  readonly numPicks: number | null;
  readonly noDropChance: number | null;
  readonly picks: readonly drops.TcPick[];
  readonly eligible: readonly drops.TcPick[];
  readonly selected: readonly drops.DropResult[];
}

/**
 * Observe every real TC invocation, including multi-table projections, without
 * replacing its outputs or drawing additional entropy. Salvage every sampled
 * item through the native pure planner in a disposable constructed inventory.
 * Totals are conditional samples, never expected yields or earned-settlement evidence.
 */
export function measureEquipmentRewardSources(census: EquipmentCensus, pools: AwardDataPools) {
  if (vi.isMockFunction(drops.rollDrops)) throw new Error('Equipment census needs the original drop export');
  const original = drops.rollDrops;
  let active: TableObservation[] | null = null;
  const spy = vi.spyOn(drops, 'rollDrops').mockImplementation((...args: Parameters<typeof original>) => {
    if (!active) throw new Error('Unscoped equipment source call');
    const result = original(...args), { tc, monsterLevel } = args[0];
    active.push(structuredClone({ id: tc.id, numPicks: tc.numPicks ?? null,
      noDropChance: tc.noDropChance ?? null, picks: tc.picks,
      eligible: tc.picks.filter(pick => pick.weight > 0 && monsterLevel >= pick.qlvlMin && monsterLevel <= pick.qlvlMax),
      selected: result }));
    return result;
  });
  try {
    const rows = census.contexts.map(context => {
      if (context.input.firstKillBonus) throw new Error('First-kill rewards are outside this source census');
      const seed = hashSeed(JSON.stringify(['equipment-source-budget-v1', context.input]));
      const tables: TableObservation[] = [];
      active = tables;
      const reward = rollKillRewards(context.input, pools, createRng(seed));
      active = null;
      const source: MaterialActionInventory = { backpack: reward.items, stash: [], materials: {},
        currencies: {}, quarantine: [], materialActionOrdinal: 0 };
      const before = structuredClone(source);
      const authority = { characterId: 'constructed-source-budget', highestUnlockedAct: context.input.act,
        difficulty: context.input.difficulty ?? 'normal', backpackCapacity: reward.items.length, stashCapacity: 0,
        reservedItemIds: new Set<string>(), otherOwnedItemIds: new Set<string>(), bases: pools.bases, affixes: pools.affixes };
      const request = reward.items.length ? prepareMaterialAction(source, authority, {
        recipeId: 'actions/salvage', itemIds: reward.items.map(item => item.id) }) : null;
      const salvage = request ? planMaterialAction(source, authority, request) : null;
      if (salvage && (!salvage.next || salvage.replay)) throw new Error('Missing new salvage projection');
      return { ...context, seed, rawNonEquipmentPicks: pools.treasureClasses.get(context.input.treasureClassId)?.picks
        .filter(pick => (pick.type ?? 'item') !== 'item') ?? [], tables,
      sample: { items: reward.items.map(item => ({ baseId: item.baseId, rarity: item.rarity, ilvl: item.ilvl ?? item.level })),
        materials: reward.materials, runeShards: reward.runeShards, wishstones: reward.wishstones,
        runes: reward.runes, gems: reward.gems, salvageMaterials: salvage?.result.materials ?? {},
        inputUnchanged: isDeepStrictEqual(source, before), remainingItems: salvage?.next?.backpack.length ?? source.backpack.length,
        salvageOrdinal: salvage?.next?.materialActionOrdinal ?? 0 } };
    });
    return { version: 1, scope: 'live-projections-and-conditional-salvage-samples',
      scan: census.scan, areaIds: census.areaIds, rows,
      limitations: [
        'The fixed planning scan is not exhaustive over RNG seeds, idle history, optional quests or all campaign states.',
        'Planned occurrences are scan bookkeeping, not encounter probabilities, admissions, victories or observed player income.',
        'Raw non-equipment picks are reference only; live eligible projections determine TC source support.',
        'One identity-seeded native reward sample per context is not a probability, expectation or population estimate.',
        'All sampled equipment is salvaged only in a constructed pure projection; player gear retention and capacity are not modeled.',
        'Salvage output is separate from original materials; do not treat it as an additional independent kill-reward channel.',
        'No once-only first-kill, quest projection/cache, endgame, Find Item, kill-rate, affordability or pacing credit.'
      ] };
  } finally { active = null; spy.mockRestore(); }
}

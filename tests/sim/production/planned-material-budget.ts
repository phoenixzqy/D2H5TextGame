/** Conditional numeric diagnostic; no earned progress or player-time inference. */
import { monsters, subAreas } from '@/data';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialEconomy } from '@/data/loaders/materials';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import type { KillRewardInput } from '@/engine/loot/award';
import { analyzeIndependentMaterialContext } from './material-acquisition';
import { analyzeMaterialBundle } from './material-source-budgets';
import { analyzeMixedTcSource } from './mixed-tc-budgets';
import { measureEquipmentRewardSources } from './equipment-source-budget';

interface SupplyChannel { readonly source: 'independent' | 'bundle' | 'treasureClass';
  readonly materials: readonly { readonly materialId: string; readonly mean: number; readonly chance: number }[] }
/** Per-settlement marginal material supply, retaining replacement-channel identity. */
export interface MaterialSupplyContext {
  readonly id: string;
  readonly input: KillRewardInput;
  readonly channels: readonly SupplyChannel[];
}
interface KillCount { readonly sourceId: string; readonly count: number }

/** Weight marginal supply by fixed native spawn counts under independent output draws. */
export function combinePlannedMaterials(kills: readonly KillCount[], contexts: readonly MaterialSupplyContext[]) {
  const index = new Map(contexts.map(context => [context.id, context]));
  if (index.size !== contexts.length) throw new Error('Duplicate material supply source');
  const totals = new Map<string, { materialId: string; independentMean: number; bundleMean: number;
    treasureClassMean: number; logNoDrop: number }>();
  for (const kill of kills) {
    if (!Number.isSafeInteger(kill.count) || kill.count < 1) throw new Error('Invalid planned kill count');
    const context = index.get(kill.sourceId);
    if (!context) throw new Error('Missing material supply source');
    const channelNames = context.channels.map(channel => channel.source);
    if (channelNames.includes('bundle') && channelNames.includes('independent')) {
      throw new Error('Bundle must replace the ordinary independent channel');
    }
    for (const channel of context.channels) {
      const seen = new Set<string>();
      for (const material of channel.materials) {
        if (!material.materialId || seen.has(material.materialId) || !Number.isFinite(material.mean) ||
          !Number.isFinite(material.chance) || material.chance < 0 || material.chance > 1 ||
          material.mean < material.chance || (material.chance === 0 && material.mean !== 0)) {
          throw new Error('Invalid or duplicate marginal material supply');
        }
        seen.add(material.materialId);
        const total = totals.get(material.materialId) ?? { materialId: material.materialId,
          independentMean: 0, bundleMean: 0, treasureClassMean: 0, logNoDrop: 0 };
        total[`${channel.source}Mean`] += kill.count * material.mean;
        total.logNoDrop += kill.count * Math.log1p(-material.chance);
        totals.set(material.materialId, total);
      }
    }
  }
  return [...totals.values()].map(({ logNoDrop, ...total }) => ({ ...total,
    totalMean: total.independentMean + total.bundleMean + total.treasureClassMean,
    chanceAtLeastOne: -Math.expm1(logNoDrop) }));
}

/** Native Normal manual plans plus modeled repeatable material supply per cleared plan. */
export function measurePlannedMaterialBudgets() {
  const scan = { seed: 7, ordinals: Array.from({ length: 13 }, (_, index) => index),
    modes: ['manual'] as const, difficulties: ['normal'] as const };
  const fallback = monsters[0];
  if (!fallback) throw new Error('Missing production monsters');
  const unique = new Map<string, { input: KillRewardInput; id: string; plannedOccurrences: number;
    witness: { areaId: string; mode: 'manual'; ordinal: number } }>();
  const encounters = subAreas.flatMap(subArea => scan.ordinals.map(ordinal => {
    const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
      fallbackLevel: subArea.areaLevel, seed: scan.seed, challengeOrdinal: ordinal, mode: 'manual' });
    const act = Number(subArea.actId.slice(-1));
    if (act !== 1 && act !== 2 && act !== 3 && act !== 4 && act !== 5) throw new Error('Unknown source act');
    const counts = new Map<string, number>();
    for (const wave of plan.waves) for (const spawn of wave.spawns) {
      const input: KillRewardInput = { tier: spawn.tier, monsterLevel: spawn.level,
        treasureClassId: wave.lootTable ?? plan.defaultLootTable, act, difficulty: 'normal', magicFind: 0, goldFind: 0 };
      const key = JSON.stringify(input);
      let context = unique.get(key);
      if (!context) {
        context = { id: `context-${String(unique.size)}`, input, plannedOccurrences: 0,
          witness: { areaId: subArea.id, mode: 'manual', ordinal } };
        unique.set(key, context);
      }
      context.plannedOccurrences++;
      counts.set(context.id, (counts.get(context.id) ?? 0) + 1);
    }
    return { areaId: subArea.id, act, ordinal, waveCount: plan.waves.length,
      spawnCount: [...counts.values()].reduce((sum, count) => sum + count, 0),
      kills: [...counts].map(([sourceId, count]) => ({ sourceId, count })) };
  }));
  const sourceRows = [...unique.values()];
  const native = measureEquipmentRewardSources({ scan, areaIds: subAreas.map(area => area.id), contexts: sourceRows }, loadAwardPools());
  const baselineCache = new Map<string, SupplyChannel>(), bundleCache = new Map<string, SupplyChannel>();
  const contexts: MaterialSupplyContext[] = native.rows.map((row, index) => {
    const source = sourceRows[index];
    if (!source) throw new Error('Missing source identity');
    const { input } = row;
    const special = input.treasureClassId === materialEconomy.treasureGoblin.treasureClassId ? 'treasure-goblin'
      : input.tier === 'chapter-boss' && materialEconomy.chapterBossMaterials[input.treasureClassId] ? 'chapter-boss' : null;
    const cache = special ? bundleCache : baselineCache;
    const key = `${String(input.act)}/${special ?? input.tier}`;
    let channel = cache.get(key);
    if (!channel) {
      channel = special ? { source: 'bundle', materials: analyzeMaterialBundle(special, input.act, 'normal').materials
        .map(material => ({ materialId: material.materialId, mean: material.modeledMeanUnitsPerSettlement,
          chance: material.modeledChanceAtLeastOnePerSettlement })) }
        : { source: 'independent', materials: analyzeIndependentMaterialContext({ act: input.act,
          difficulty: 'normal', tier: input.tier }).materials.map(material => ({ materialId: material.materialId,
          mean: material.probabilityPerKill, chance: material.probabilityPerKill })) };
      cache.set(key, channel);
    }
    const channels = [channel];
    for (const table of row.tables) {
      if (!table.eligible.some(pick => pick.type === 'rune' || pick.type === 'gem')) continue;
      const analysis = analyzeMixedTcSource(input, { id: table.id, picks: table.picks,
        ...(table.numPicks === null ? {} : { numPicks: table.numPicks }),
        ...(table.noDropChance === null ? {} : { noDropChance: table.noDropChance }) });
      channels.push({ source: 'treasureClass', materials: analysis.intervals.flatMap(material => {
        if (material.materialId === null) return [];
        if (!material.quantity || material.quantity.min < 1 || material.modeledMeanUnitsPerKill === null) {
          throw new Error('Unsupported TC material quantity distribution');
        }
        return [{ materialId: material.materialId, mean: material.modeledMeanUnitsPerKill, chance: material.probabilityPerKill }];
      }) });
    }
    return { id: source.id, input, channels };
  });
  return { version: 1, scope: 'planned-normal-manual-repeatable-material-supply', scan, contexts,
    probabilityModel: 'independent-uniform-32-bit-output-draws',
    conditioning: 'every-planned-spawn-receives-one-authorized-repeatable-kill-settlement',
    encounters: encounters.map(row => ({ ...row, materials: combinePlannedMaterials(row.kills, contexts) })),
    limitations: [
      'Fixed seed/ordinal plans are witnesses, not a population or encounter-frequency distribution.',
      'Every planned spawn is assumed settled; combat wins, summoned enemies, survival and party behavior are not modeled.',
      'Native TC projections determine live material sources; chapter-boss/goblin bundles replace ordinary independent materials.',
      'Means and per-material at-least-one chances assume independent uniform output draws, not proved PRNG seed populations.',
      'Per-material marginals do not establish joint recipe acquisition or repeated-rune completion distributions.',
      'Find Item, first-kill/quest/endgame rewards, salvage, currencies, gear retention and player time are excluded.',
      'No all-source affordability, completion hours, campaign progress or formal balance acceptance.'
    ] };
}

/** Numeric diagnostics only. No campaign, earned-income or acquisition-time credit. */
import { materialEconomy } from '@/data/loaders/materials';
import { rollDrops, type TreasureClass, type TcPick, type DropResult } from '@/engine/loot/drop-roller';
import type { KillRewardInput } from '@/engine/loot/award';
import type { Rng } from '@/engine/rng';
import { loadAwardPools } from '@/data/loaders/loot';
import { enumerateEquipmentRewardContexts, measureEquipmentRewardSources } from './equipment-source-budget';
import { analyzeIndependentMaterialContext } from './material-acquisition';

const GRID = 2 ** 32;
function outcomeKey(drop: DropResult) {
  return drop.kind === 'item' ? `item:${drop.baseId}` : `direct:${drop.currency}:${drop.itemId ?? ''}`;
}

/** Probe one real TC attempt with separately controlled gate/selection/quantity variates. */
export function probeMixedTcSource(input: KillRewardInput, tc: TreasureClass, selection: number,
  quantity = 0, gate = GRID - 1) {
  if (input.tier !== 'trash' || (tc.numPicks ?? 1) !== 1) throw new Error('Expected one trash-tier attempt');
  for (const n of [selection, quantity, gate]) {
    if (!Number.isSafeInteger(n) || n < 0 || n >= GRID) throw new Error('Invalid grid numerator');
  }
  let draws = 0, gates = 0, quantities = 0, noDrop = -1;
  const unsupported = (): never => { throw new Error('Unexpected TC RNG operation'); };
  const rng: Rng = { next: () => draws++ === 0 ? selection / GRID : .5,
    chance: p => { gates++; noDrop = p; return gate / GRID < p; },
    nextInt: (min, max) => { quantities++; return min + Math.floor(quantity / GRID * (max - min + 1)); },
    pick: unsupported, fork: unsupported };
  const results = rollDrops({ tc, tier: input.tier, monsterLevel: input.monsterLevel,
    magicFind: input.magicFind, materialProfile: { act: input.act, difficulty: input.difficulty ?? 'normal' } }, rng);
  if (gates !== 1 || draws > 2 || quantities > 1 || results.length > 1 || noDrop < 0 || noDrop > 1) {
    throw new Error('Native single-attempt draw contract changed');
  }
  const drop = results[0];
  if (!drop) return { key: 'no-drop', noDrop, drop: { kind: 'none' as const, quantity: 0 } };
  if (draws < 1 || quantities !== Number(drop.kind === 'direct')) throw new Error('Native TC selection contract changed');
  return { key: outcomeKey(drop), noDrop, drop: { ...drop, quantity: drop.kind === 'direct' ? drop.quantity : 1 } };
}

function pickKeys(pick: TcPick): string[] {
  if ((pick.type ?? 'item') === 'item') return [`item:${pick.baseId ?? ''}`];
  const currency = pick.type === 'rune' ? 'runes' : pick.type === 'gem' ? 'gems'
    : pick.itemId === 'currency/wishstone' ? 'wishstones' : 'runeShards';
  const ids = pick.itemId ? [pick.itemId] : pick.type === 'rune' ? materialEconomy.runeOrder
    : pick.type === 'gem' ? materialEconomy.gemTypes.flatMap(type =>
      materialEconomy.gemQualities.map(quality => `gems/${type}/${quality}`)) : [''];
  return ids.map(id => `direct:${currency}:${id}`);
}

function quantityGrid(min: number, max: number) {
  const span = max - min + 1;
  const pmf = Array.from({ length: span }, (_, i) => {
    const first = Math.ceil(i * GRID / span), endExclusive = Math.ceil((i + 1) * GRID / span);
    return { quantity: min + i, first, endExclusive, outcomes: endExclusive - first };
  });
  return { min, max, pmf, modeledMean: pmf.reduce((sum, p) => sum + p.quantity * p.outcomes / GRID, 0) };
}

/** Preserve native TC residual-to-material coupling; count exact output-grid intervals. */
export function analyzeMixedTcSource(input: KillRewardInput, table: TreasureClass) {
  const keys = table.picks.filter(p => p.weight > 0 && p.qlvlMin <= input.monsterLevel && p.qlvlMax >= input.monsterLevel)
    .flatMap(pickKeys);
  if (new Set(keys).size !== keys.length) throw new Error('Ambiguous native outcome order');
  const ranks = new Map(keys.map((key, rank) => [key, rank])), cache = new Map<number, number>();
  const observed = probeMixedTcSource(input, table, 0);
  const rankAt = (n: number) => {
    const saved = cache.get(n);
    if (saved !== undefined) return saved;
    const rank = ranks.get(probeMixedTcSource(input, table, n).key);
    if (rank === undefined) throw new Error('Native outcome order changed or no surviving source');
    cache.set(n, rank); return rank;
  };
  const boundary = (rank: number) => {
    let low = 0, high = GRID;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (rankAt(mid) >= rank) high = mid; else low = mid + 1;
    }
    return low;
  };
  const noDropOutcomes = Math.ceil(observed.noDrop * GRID), survival = 1 - noDropOutcomes / GRID;
  const boundaries = [0, ...keys.map((_, rank) => boundary(rank + 1))];
  const intervals = keys.map((key, rank) => {
    const first = boundaries[rank], endExclusive = boundaries[rank + 1];
    if (first === undefined || endExclusive === undefined) throw new Error('Missing native TC interval');
    const outcomes = endExclusive - first, probabilityPerKill = survival * outcomes / GRID;
    const lower = outcomes > 0 ? probeMixedTcSource(input, table, first).drop : null;
    const upper = outcomes > 0 ? probeMixedTcSource(input, table, first, GRID - 1).drop : null;
    const quantity = lower?.kind === 'direct' && upper?.kind === 'direct' ? quantityGrid(lower.quantity, upper.quantity) : null;
    const materialId = lower?.kind === 'direct' && (lower.currency === 'runes' || lower.currency === 'gems')
      ? lower.itemId ?? null : null;
    return { key, first, endExclusive, outcomes, probabilityPerKill, materialId, quantity,
      modeledMeanUnitsPerKill: quantity ? probabilityPerKill * quantity.modeledMean : null };
  });
  return { gridOutcomes: GRID, noDrop: { nativeChance: observed.noDrop, outcomes: noDropOutcomes,
    probability: noDropOutcomes / GRID }, intervals };
}

/** Quantify currently live one-attempt mixed sources; combine material means once per channel. */
export function measureMixedTcBudgets() {
  const pools = loadAwardPools(), census = enumerateEquipmentRewardContexts();
  const candidates = census.contexts.filter(row => row.input.tier === 'trash' &&
    pools.treasureClasses.get(row.input.treasureClassId)?.picks.some(p => (p.type ?? 'item') !== 'item' &&
      p.weight > 0 && p.qlvlMin <= row.input.monsterLevel && p.qlvlMax >= row.input.monsterLevel));
  const sources = measureEquipmentRewardSources({ ...census, contexts: candidates }, pools);
  const baselines = new Map<string, ReturnType<typeof analyzeIndependentMaterialContext>>();
  const rows = sources.rows.filter(row => row.tables.some(t => t.eligible.some(p => (p.type ?? 'item') !== 'item')))
    .map(row => {
      const observed = row.tables[0];
      if (row.tables.length !== 1 || !observed) throw new Error('Mixed source now needs a multi-table budget');
      const table: TreasureClass = { id: observed.id, picks: observed.picks,
        ...(observed.numPicks === null ? {} : { numPicks: observed.numPicks }),
        ...(observed.noDropChance === null ? {} : { noDropChance: observed.noDropChance }) };
      const analysis = analyzeMixedTcSource(row.input, table);
      const baselineId = `act${String(row.input.act)}-${row.input.difficulty ?? 'normal'}-trash`;
      let baseline = baselines.get(baselineId);
      if (!baseline) {
        baseline = analyzeIndependentMaterialContext({ act: row.input.act,
          difficulty: row.input.difficulty ?? 'normal', tier: 'trash' });
        baselines.set(baselineId, baseline);
      }
      const combinedMaterialMeans = baseline.materials.map(material => ({ materialId: material.materialId,
        modeledMeanUnitsPerKill: material.probabilityPerKill + analysis.intervals
          .filter(entry => entry.materialId === material.materialId)
          .reduce((sum, entry) => sum + (entry.modeledMeanUnitsPerKill ?? 0), 0) }));
      return { input: row.input, witness: row.witness, table, analysis, baselineId, combinedMaterialMeans };
    });
  return { version: 1, scope: 'live-single-attempt-mixed-tc-and-independent-material-means',
    probabilityModel: 'uniform-32-bit-output-grid', withinAttemptModel: 'independent-gate-selection-and-quantity-draws',
    materialIdentityModel: 'native-residual-coupled-to-tc-selection', scan: census.scan,
    candidateContexts: candidates.length, baselineContexts: [...baselines].map(([id, analysis]) => ({ id, analysis })), rows,
    limitations: [
      'Fixed planning scan is not exhaustive campaign or seed coverage; no encounter-frequency model.',
      'One trash-tier attempt per live mixed table only; unsupported multiplicity or ambiguous identity order refuses.',
      'Material identity uses the native TC selection residual, not an independent extra identity draw.',
      'NoDrop survival, TC selection and quantity means assume independent uniform output-grid draws; seeded populations are not proved.',
      'Only rune/gem means combine TC and ordinary independent channels; TC currency means exclude all other currency sources.',
      'No bundle, guarantee/salvage, quest/cache/first-kill, endgame or Find Item income is included.',
      'No total acquisition rate, recipe completion time, campaign hours, earned income or balance acceptance.'
    ] };
}

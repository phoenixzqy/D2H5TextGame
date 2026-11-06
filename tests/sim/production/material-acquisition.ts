import { materialCatalog, materialEconomy } from '@/data/loaders/materials';
import type { MonsterTier } from '@/engine/combat/types';
import type { MaterialContext } from '@/engine/loot/materials';
import { rollCurrencyDrops } from '@/engine/loot/orbs-and-currency';
import type { Rng } from '@/engine/rng';

// rng.ts returns unsigned 32-bit numerators divided by this denominator.
// Uniform mass over this grid is a model, not a claim about seed populations.
const GRID = 2 ** 32;

function interval(first: number, endExclusive: number) {
  return { first, endExclusive, outcomes: endExclusive - first,
    probabilityPerKill: (endExclusive - first) / GRID };
}

function waitingKills(probability: number) {
  if (probability === 0) return null;
  const quantile = (confidence: number) => probability === 1 ? 1
    : Math.ceil(Math.log1p(-confidence) / Math.log1p(-probability));
  return { mean: 1 / probability, median: quantile(.5), p95: quantile(.95) };
}

/**
 * Count the native channel's contiguous identity intervals, without rolling
 * kills or duplicating the material weighting/capping/gate implementation.
 * Requires production's canonical ordered weighted walk and no bundle override.
 */
function analyzeChannel(kind: 'rune' | 'gem', context: MaterialContext) {
  const ids = kind === 'rune' ? [...materialEconomy.runeOrder]
    : materialEconomy.gemTypes.flatMap(type =>
      materialEconomy.gemQualities.map(quality => `gems/${type}/${quality}`));
  const ranks = new Map(ids.map((id, rank) => [id, rank]));
  const observations = new Map<number, number>();

  function outcomeRank(numerator: number): number {
    const cached = observations.get(numerator);
    if (cached !== undefined) return cached;
    const unit = numerator / GRID;
    // Keep every production draw, including the champion's wishstone gate.
    const values = [...(context.tier === 'champion' ? [0] : []),
      kind === 'rune' ? unit : 0, kind === 'gem' ? unit : 0, .5];
    let consumed = 0;
    const next = () => {
      const value = values[consumed++];
      if (value === undefined) throw new Error('Independent material draw contract changed');
      return value;
    };
    const unsupported = (): never => { throw new Error('Unexpected independent material RNG operation'); };
    const rng: Rng = { next, chance: chance => next() < chance,
      nextInt: unsupported, pick: unsupported, fork: unsupported };
    const drops = rollCurrencyDrops(1, context.tier, context.act, context.difficulty, 0, rng);
    if (consumed !== values.length) throw new Error('Independent material draw contract changed');
    const emitted = Object.keys(drops.materials).filter(id => materialCatalog.get(id)?.kind === kind);
    const id = emitted[0];
    if (emitted.length > 1 || (id !== undefined && drops.materials[id] !== 1)) {
      throw new Error('Independent material quantity contract changed');
    }
    const rank = id === undefined ? ids.length : ranks.get(id);
    if (rank === undefined) throw new Error('Independent material identity order changed');
    observations.set(numerator, rank);
    return rank;
  }

  function firstRankAtLeast(rank: number): number {
    let low = 0, high = GRID;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (outcomeRank(middle) >= rank) high = middle;
      else low = middle + 1;
    }
    return low;
  }

  const boundaries = [0, ...ids.map((_, rank) => firstRankAtLeast(rank + 1))];
  const materials = ids.map((materialId, rank) => {
    const first = boundaries[rank], endExclusive = boundaries[rank + 1];
    if (first === undefined || endExclusive === undefined) throw new Error('Missing material boundary');
    const support = interval(first, endExclusive);
    return { materialId, kind, ...support, iidWaitingKills: waitingKills(support.probabilityPerKill) };
  });
  const noDropFirst = boundaries.at(-1);
  if (noDropFirst === undefined) throw new Error('Missing no-drop boundary');
  return { materials, channel: { authoredGateChance: materialEconomy.independentDropChances[context.tier][kind],
    noDrop: interval(noDropFirst, GRID) } };
}

/**
 * Analyze the baseline independent rune/gem channel for one reward context.
 * Exact counts refer to uniform grid mass; waiting kills additionally assume IID
 * trials. This excludes every TC, bundle override and other acquisition source.
 */
export function analyzeIndependentMaterialContext(context: MaterialContext) {
  const rune = analyzeChannel('rune', context), gem = analyzeChannel('gem', context);
  return { context: { ...context }, channels: { rune: rune.channel, gem: gem.channel },
    materials: [...rune.materials, ...gem.materials] };
}

/** Production-backed numeric component of P15 acquisition evidence; no gameplay or time credit. */
export function measureIndependentMaterialAcquisition() {
  return {
    version: 1,
    scope: 'ordinary-independent-rune-gem-channel',
    probabilityModel: 'uniform-32-bit-output-grid',
    waitingModel: 'independent-identically-distributed-kills',
    gridOutcomes: GRID,
    excludedSources: ['treasure-class-picks', 'chapter-boss-material-bundles', 'treasure-goblin-bundles',
      'first-kill-bonuses', 'quest-rewards', 'crafting', 'endgame-rewards', 'find-item'],
    limitations: [
      'Configured chapter-boss and goblin bundles replace this baseline channel.',
      'Zero means unavailable in this channel, not unavailable from every source.',
      'Uniform grid mass does not prove uniform or independent PRNG outputs across seeds.',
      'IID waiting kills are modeled estimates, not measured campaign or acquisition time.',
      'No kills per hour, recipe completion time, total acquisition rate or balance acceptance is inferred.'
    ],
    contexts: Object.values(materialEconomy.profiles).flatMap(profile =>
      (Object.keys(materialEconomy.independentDropChances) as MonsterTier[]).map(tier =>
        analyzeIndependentMaterialContext({ ...profile, tier })))
  };
}

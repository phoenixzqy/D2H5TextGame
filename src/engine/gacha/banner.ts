import type { Rng } from '../rng';
import type { GachaRates, GachaRarity } from './roller';

/** Completed consecutive misses; SSR resets both, while SR resets only its own counter. */
export interface BannerState {
  readonly pullsSinceSR: number;
  readonly pullsSinceSSR: number;
}

/** Authored rules, validated by the data boundary before planning recruitment. */
export interface BannerRules {
  readonly rates: GachaRates;
  readonly pity: {
    readonly sr: { readonly threshold: number };
    readonly ssr: { readonly threshold: number };
  };
  readonly pool: Readonly<Record<GachaRarity, readonly string[]>>;
  readonly shardConversion: {
    readonly perDuplicate: Readonly<Record<GachaRarity, number>>;
  };
}

/** A concrete recruit or merc-specific shard receipt; neither publishes ownership. */
export type BannerResult =
  | { readonly kind: 'merc'; readonly mercId: string; readonly rarity: GachaRarity; readonly isNew: true }
  | { readonly kind: 'shard'; readonly mercId: string; readonly rarity: GachaRarity;
      readonly isNew: false; readonly shardCount: number };

/**
 * Plan one/ten paid draws without mutating counters, ownership or wallets.
 * Each draw consumes a tier roll followed by a uniform identity pick, including
 * guaranteed draws. A batch threads new ownership before selecting its next draw.
 * Rules contain Nth-draw floors, so N-1 completed misses force the next draw.
 * Historical SSR counters above a newly lowered floor force one ordinary paid draw.
 */
export function rollBanner(
  rng: Rng,
  rules: BannerRules,
  state: BannerState,
  ownedMercs: ReadonlySet<string>,
  count: number
): { readonly results: readonly BannerResult[]; readonly nextState: BannerState } {
  if ((count !== 1 && count !== 10) ||
    !Number.isSafeInteger(state.pullsSinceSR) || state.pullsSinceSR < 0 ||
    !Number.isSafeInteger(state.pullsSinceSSR) || state.pullsSinceSSR < 0 ||
    state.pullsSinceSR > state.pullsSinceSSR) {
    throw new RangeError('Invalid recruitment count or pity state');
  }
  const owned = new Set(ownedMercs);
  const results: BannerResult[] = [];
  let sr = state.pullsSinceSR, ssr = state.pullsSinceSSR;
  for (let index = 0; index < count; index++) {
    const roll = rng.next();
    const rarity: GachaRarity = ssr >= rules.pity.ssr.threshold - 1 || roll < rules.rates.SSR
      ? 'SSR'
      : sr >= rules.pity.sr.threshold - 1 || roll < rules.rates.SSR + rules.rates.SR ? 'SR' : 'R';
    const mercId = rng.pick(rules.pool[rarity]);
    if (owned.has(mercId)) {
      results.push({ kind: 'shard', mercId, rarity, isNew: false,
        shardCount: rules.shardConversion.perDuplicate[rarity] });
    } else {
      owned.add(mercId);
      results.push({ kind: 'merc', mercId, rarity, isNew: true });
    }
    sr = rarity === 'R' ? sr + 1 : 0;
    ssr = rarity === 'SSR' ? 0 : ssr + 1;
  }
  return { results, nextState: { pullsSinceSR: sr, pullsSinceSSR: ssr } };
}

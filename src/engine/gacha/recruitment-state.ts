import type { Rng } from '../rng';
import { rollBanner, type BannerResult, type BannerRules } from './banner';
import type { GachaRarity } from './roller';

/** Durable receipts use ordinals for order; timestamps are wall-clock milliseconds. */
export interface RecruitmentReceipt {
  readonly ordinal: number;
  readonly timestamp: number;
  readonly mercId: string;
  readonly rarity: GachaRarity;
  readonly isNew: boolean;
  readonly shardCount: number;
}

/** The historical SSR owner is preserved; only SR misses and new-model history are added. */
export interface RecruitmentState {
  readonly pityCounter: number;
  readonly srPityCounter: number;
  readonly totalPulls: number;
  readonly history: readonly RecruitmentReceipt[];
}

/** Canonical merc identities retain paid progress through dismissal and re-recruitment. */
export type MercRecruitmentProgress = Readonly<Record<string, {
  readonly shards: number;
  readonly stars: number;
}>>;

/** Authored durable limits used by recruitment planning and the save boundary. */
export interface RecruitmentRules extends BannerRules {
  readonly uiHistoryCap: number;
  readonly shardConversion: BannerRules['shardConversion'] & {
    readonly shardsPerStar: number;
    readonly maxStars: number;
  };
}

function invalid(): never { throw new Error('Invalid recruitment state'); }
function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) && Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function tierFor(rules: BannerRules, id: string): GachaRarity | undefined {
  return (['SSR', 'SR', 'R'] as const).find(tier => rules.pool[tier].includes(id));
}
function readProgress(value: unknown, rules: RecruitmentRules): MercRecruitmentProgress {
  if (!jsonRecord(value)) return invalid();
  for (const [id, row] of Object.entries(value)) {
    if (!tierFor(rules, id) || !jsonRecord(row) || !exact(row, ['shards', 'stars']) ||
      !integer(row.shards) || !integer(row.stars) || row.stars > rules.shardConversion.maxStars) return invalid();
  }
  return value as MercRecruitmentProgress;
}

/** Initialize only unavailable SR/history state; never infer past duplicate rewards. */
export function createRecruitmentState(pityCounter: number): RecruitmentState {
  if (!integer(pityCounter)) return invalid();
  return { pityCounter, srPityCounter: 0, totalPulls: 0, history: [] };
}

/**
 * Validate own JSON data before save normalization or transaction planning.
 * No getters, inherited fields, hidden fields, sparse arrays or repairs are accepted.
 * Counter checks use the retained result suffix without inventing legacy history.
 */
export function readRecruitmentState(state: unknown, progress: unknown, rules: RecruitmentRules): {
  readonly state: RecruitmentState; readonly progress: MercRecruitmentProgress;
} {
  if (!jsonRecord(state) || !exact(state, ['pityCounter', 'srPityCounter', 'totalPulls', 'history']) ||
    !integer(state.pityCounter) || !integer(state.srPityCounter) || !integer(state.totalPulls) ||
    state.srPityCounter >= rules.pity.sr.threshold || state.srPityCounter > state.pityCounter) return invalid();
  const history: unknown = state.history;
  if (!Array.isArray(history) || Object.getPrototypeOf(history) !== Array.prototype ||
    history.length !== Math.min(state.totalPulls, rules.uiHistoryCap) ||
    Reflect.ownKeys(history).length !== history.length + 1) return invalid();
  let srSuffix = 0, ssrSuffix = 0, hasSR = false, hasSSR = false;
  for (let index = 0; index < history.length; index++) {
    const field = Object.getOwnPropertyDescriptor(history, String(index)), row: unknown = field?.value;
    if (field?.enumerable !== true || !Object.hasOwn(field, 'value') || !jsonRecord(row) ||
      !exact(row, ['ordinal', 'timestamp', 'mercId', 'rarity', 'isNew', 'shardCount']) ||
      row.ordinal !== state.totalPulls - history.length + index + 1 || !integer(row.timestamp) ||
      typeof row.mercId !== 'string' || !tierFor(rules, row.mercId) || tierFor(rules, row.mercId) !== row.rarity ||
      typeof row.isNew !== 'boolean' || row.shardCount !== (row.isNew ? 0
        : rules.shardConversion.perDuplicate[row.rarity as GachaRarity])) return invalid();
    if (row.rarity !== 'R') { hasSR = true; srSuffix = 0; } else srSuffix++;
    if (row.rarity === 'SSR') { hasSSR = true; ssrSuffix = 0; } else ssrSuffix++;
  }
  if (state.srPityCounter !== srSuffix ||
    (hasSSR ? state.pityCounter !== ssrSuffix : state.pityCounter < ssrSuffix) ||
    (state.totalPulls > 0 && state.pityCounter >= rules.pity.ssr.threshold) ||
    (!hasSR && state.totalPulls > 0 && state.totalPulls !== history.length)) return invalid();
  const ownedProgress = readProgress(progress, rules);
  return { state: state as unknown as RecruitmentState, progress: ownedProgress };
}

/** Plan paid draws, receipts and shard balances together without publishing any participant. */
export function planRecruitment(rng: Rng, rules: RecruitmentRules, state: RecruitmentState,
  progress: MercRecruitmentProgress, ownedMercs: ReadonlySet<string>, count: number, timestamp: number): {
    readonly state: RecruitmentState; readonly progress: MercRecruitmentProgress;
    readonly results: readonly BannerResult[];
  } {
  readRecruitmentState(state, progress, rules);
  if (!integer(timestamp) || (count !== 1 && count !== 10) || !integer(state.totalPulls + count)) return invalid();
  const rolled = rollBanner(rng, rules, { pullsSinceSR: state.srPityCounter, pullsSinceSSR: state.pityCounter }, ownedMercs, count);
  const nextProgress = { ...progress };
  const receipts = rolled.results.map((result, index): RecruitmentReceipt => {
    if (result.kind === 'shard') {
      const current = nextProgress[result.mercId] ?? { shards: 0, stars: 0 };
      const shards = current.shards + result.shardCount;
      if (!integer(shards)) return invalid();
      nextProgress[result.mercId] = { ...current, shards };
    }
    return { ordinal: state.totalPulls + index + 1, timestamp, mercId: result.mercId,
      rarity: result.rarity, isNew: result.isNew, shardCount: result.kind === 'shard' ? result.shardCount : 0 };
  });
  return { results: rolled.results, progress: nextProgress, state: {
    pityCounter: rolled.nextState.pullsSinceSSR, srPityCounter: rolled.nextState.pullsSinceSR,
    totalPulls: state.totalPulls + count, history: [...state.history, ...receipts].slice(-rules.uiHistoryCap)
  } };
}

/** Explicit shard spending; caller checks current roster ownership and atomically publishes projections. */
export function planStarUpgrade(rules: RecruitmentRules, progress: MercRecruitmentProgress,
  mercId: string): MercRecruitmentProgress | null {
  readProgress(progress, rules);
  const current = progress[mercId];
  if (!current || current.stars >= rules.shardConversion.maxStars || current.shards < rules.shardConversion.shardsPerStar) return null;
  return { ...progress, [mercId]: { stars: current.stars + 1, shards: current.shards - rules.shardConversion.shardsPerStar } };
}

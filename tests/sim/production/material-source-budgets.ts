import { materialRecipeRules } from '@/data/loaders/material-recipes';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { materialCatalog, materialEconomy, type MaterialRewardBundle, type MaterialProfile } from '@/data/loaders/materials';
import { loadQuests } from '@/data/loaders/quests';
import { loadAwardPools } from '@/data/loaders/loot';
import { loadJamellaQuestAwardPools, loadJamellaQuestRewardProfile } from '@/data/loaders/quest-table-rewards';
import { CHAPTER_BOSS_FIRST_KILLS } from '@/data/loaders/chapter-boss-first-kills';
import { isQuestTableRewardInput, rollQuestTableRewards, type QuestTableRewardInput } from '@/engine/loot/award';
import { sampleMaterial, type MaterialContext } from '@/engine/loot/materials';
import { rollCurrencyDrops } from '@/engine/loot/orbs-and-currency';
import type { Rng } from '@/engine/rng';

const GRID = 2 ** 32;
type BundleSource = 'chapter-boss' | 'treasure-goblin';

function identityIntervals(kind: 'rune' | 'gem', observe: (numerator: number) => string) {
  const ids = kind === 'rune' ? [...materialEconomy.runeOrder]
    : materialEconomy.gemTypes.flatMap(type => materialEconomy.gemQualities.map(quality => `gems/${type}/${quality}`));
  const ranks = new Map(ids.map((id, rank) => [id, rank])), cache = new Map<number, number>();
  const readRank = (numerator: number) => {
    const cached = cache.get(numerator);
    if (cached !== undefined) return cached;
    const rank = ranks.get(observe(numerator));
    if (rank === undefined) throw new Error('Unexpected material identity in guaranteed channel');
    cache.set(numerator, rank);
    return rank;
  };
  const firstRankAtLeast = (rank: number) => {
    let low = 0, high = GRID;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (readRank(middle) >= rank) high = middle;
      else low = middle + 1;
    }
    return low;
  };
  const boundaries = [0, ...ids.map((_, rank) => firstRankAtLeast(rank + 1))];
  return ids.map((materialId, rank) => {
    const first = boundaries[rank], endExclusive = boundaries[rank + 1];
    if (first === undefined || endExclusive === undefined) throw new Error('Missing guaranteed material interval');
    return { materialId, kind, first, endExclusive, outcomes: endExclusive - first,
      probabilityPerDraw: (endExclusive - first) / GRID };
  });
}

// rng.ts nextInt uses floor(u * inclusiveRange) + min. Integer numerators
// multiplied by these small ranges remain exact; no equiprobable-count shortcut.
function quantityGrid(min: number, max: number) {
  const span = max - min + 1;
  const pmf = Array.from({ length: span }, (_, index) => {
    const first = Math.ceil(index * GRID / span), endExclusive = Math.ceil((index + 1) * GRID / span);
    return { quantity: min + index, first, endExclusive, outcomes: endExclusive - first,
      probability: (endExclusive - first) / GRID };
  });
  return { min, max, pmf, modeledMean: pmf.reduce((sum, row) => sum + row.quantity * row.probability, 0) };
}

/** Native bundle identity grid and modeled independent quantity/identity combinations. */
export function analyzeMaterialBundle(source: BundleSource, act: MaterialProfile['act'], difficulty: MaterialProfile['difficulty']) {
  const goblin = materialEconomy.treasureGoblin;
  const tableId = source === 'chapter-boss' ? `loot/act${String(act)}-boss` : goblin.treasureClassId;
  const boss = materialEconomy.chapterBossMaterials[tableId];
  const policy: MaterialRewardBundle = source === 'chapter-boss' && boss ? { ...boss } : {
    runePoolAct: Math.min(materialEconomy.actRuneCaps.length, act + goblin.runePoolActOffset) as MaterialProfile['act'],
    runeQuantityMin: goblin.runeQuantityMin, runeQuantityMax: goblin.runeQuantityMax,
    runeMinOrdinal: 1, runeMaxOrdinal: materialEconomy.runeOrder.length,
    gemQuantity: goblin.gemQuantityMin, gemQuantityMax: goblin.gemQuantityMax
  };
  if (source === 'chapter-boss' && (!boss || boss.act !== act)) throw new Error('Missing chapter-boss material source');
  const context: MaterialContext = { act, difficulty, tier: source === 'chapter-boss' ? 'chapter-boss' : 'boss' };
  const probe = (unit: number, maximum = false) => {
    const unsupported = (): never => { throw new Error('Unexpected bundle RNG operation'); };
    const rng: Rng = { next: () => unit, chance: p => unit < p,
      nextInt: (min, max) => maximum ? max : min, pick: unsupported, fork: unsupported };
    return rollCurrencyDrops(1, context.tier, act, difficulty, 0, rng, policy);
  };
  const lower = probe(0), upper = probe(0, true);
  const quantities = { rune: quantityGrid(lower.runes, upper.runes), gem: quantityGrid(lower.gems, upper.gems) };
  const materials = (['rune', 'gem'] as const).flatMap(kind => {
    const ids = new Set(kind === 'rune' ? materialEconomy.runeOrder
      : materialEconomy.gemTypes.flatMap(type => materialEconomy.gemQualities.map(quality => `gems/${type}/${quality}`)));
    return identityIntervals(kind, numerator => {
      const emitted = probe(numerator / GRID);
      const selected = Object.keys(emitted.materials).filter(id => ids.has(id)), id = selected[0];
      if (selected.length !== 1 || id === undefined || emitted.materials[id] !== quantities[kind].min) {
        throw new Error('Guaranteed bundle identity or quantity contract changed');
      }
      return id;
    }).map(row => ({ ...row,
      modeledMeanUnitsPerSettlement: quantities[kind].modeledMean * row.probabilityPerDraw,
      modeledChanceAtLeastOnePerSettlement: quantities[kind].pmf.reduce((sum, quantity) => sum + quantity.probability *
        (row.probabilityPerDraw === 1 ? 1 : -Math.expm1(quantity.quantity * Math.log1p(-row.probabilityPerDraw))), 0) }));
  });
  return { id: `${source}/act${String(act)}-${difficulty}`, source, tableId, context, policy, quantities, materials,
    conditioning: source === 'chapter-boss' ? 'per-authorized-boss-settlement' : 'per-authorized-goblin-settlement',
    replaces: 'ordinary-independent-rune-gem-channel' };
}

type OnceOnlySource = {
  readonly id: string;
  readonly tableId: string;
  readonly repeatable: false;
  readonly quantity: 1;
  readonly materials: ReturnType<typeof identityIntervals>;
} & ({ readonly source: 'quest-cache'; readonly questId: string;
  readonly input: QuestTableRewardInput; readonly conditioning: 'per-authorized-quest-claim' }
  | { readonly source: 'first-kill-hell-rune'; readonly act: MaterialProfile['act'];
    readonly difficulty: 'hell'; readonly conditioning: 'per-authorized-hell-first-kill' });

/** Conditional single-material quest claims and authored Hell first-kill runes. */
export function measureOnceOnlyMaterials(): OnceOnlySource[] {
  const rows: OnceOnlySource[] = [], pools = loadAwardPools();
  const jamella = loadJamellaQuestRewardProfile();
  for (const quest of loadQuests()) {
    const input = quest.rewards?.lootTable;
    if (!isQuestTableRewardInput(input) || input.picks !== 1) continue;
    const selectedPools = input.tableId === jamella.input.tableId ? loadJamellaQuestAwardPools() : pools;
    const table = selectedPools.treasureClasses.get(input.tableId);
    if (!table) throw new Error('Missing quest reward table');
    const eligible = table.picks.filter(pick => pick.weight > 0 && input.ilvl >= pick.qlvlMin && input.ilvl <= pick.qlvlMax);
    if (!eligible.length || eligible.some(pick => pick.type !== 'rune' && pick.type !== 'gem')) continue;
    const kind = eligible[0]?.type;
    if (kind !== 'rune' && kind !== 'gem') throw new Error('Missing single-material cache kind');
    const ids = kind === 'rune' ? [...materialEconomy.runeOrder]
      : materialEconomy.gemTypes.flatMap(type => materialEconomy.gemQualities.map(quality => `gems/${type}/${quality}`));
    let previousRank = -1;
    for (const pick of eligible) {
      const rank = ids.indexOf(pick.itemId ?? '');
      if (pick.type !== kind || materialCatalog.get(pick.itemId ?? '')?.kind !== kind || rank <= previousRank ||
        (pick.quantityMin ?? 1) !== 1 || (pick.quantityMax ?? 1) !== 1) {
        throw new Error('Single-material cache order, kind or quantity contract changed');
      }
      previousRank = rank;
    }
    const materials = identityIntervals(kind, numerator => {
      const unit = numerator / GRID;
      const unsupported = (): never => { throw new Error('Unexpected material-cache RNG operation'); };
      const rng: Rng = { next: () => unit, chance: p => unit < p,
        nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)), pick: unsupported, fork: unsupported };
      const reward = rollQuestTableRewards(input, selectedPools, rng);
      const entries = Object.entries(reward?.materials ?? {}), material = entries[0];
      if (entries.length !== 1 || material === undefined || material[1] !== 1 || reward?.items.length !== 0) {
        throw new Error('Incomplete single-material quest cache');
      }
      return material[0];
    });
    rows.push({ id: `quest-cache/${quest.id}`, source: 'quest-cache', questId: quest.id, tableId: input.tableId,
      input: { ...input }, repeatable: false, quantity: 1, conditioning: 'per-authorized-quest-claim', materials });
  }
  for (const [tableId, rule] of CHAPTER_BOSS_FIRST_KILLS.bosses) {
    const band = rule.hellRune;
    if (!band) continue;
    const materials = identityIntervals('rune', numerator => sampleMaterial('rune',
      { act: rule.act, tier: 'chapter-boss', difficulty: 'hell' }, numerator / GRID, band));
    rows.push({ id: `first-kill-hell-rune/${tableId}`, source: 'first-kill-hell-rune', tableId,
      act: rule.act, difficulty: 'hell', repeatable: false, quantity: 1,
      conditioning: 'per-authorized-hell-first-kill', materials });
  }
  return rows;
}

/** Special-source budgets and direct recipe demand, without encounter-rate inference. */
export function measureSpecialMaterialBudgets() {
  return {
    version: 1,
    probabilityModel: 'uniform-32-bit-output-grid',
    combinationModel: 'independent-draws-within-settlement',
    bundles: (['chapter-boss', 'treasure-goblin'] as const).flatMap(source =>
      Object.values(materialEconomy.profiles).map(profile => analyzeMaterialBundle(source, profile.act, profile.difficulty))),
    onceOnly: measureOnceOnlyMaterials(),
    demand: catalogMaterialDemand(),
    excludedSources: ['ordinary-independent-rune-gem-channel', 'other-treasure-class-picks',
      'equipment-derived-salvage-availability', 'other-quest-rewards-and-currencies', 'endgame-rewards', 'find-item'],
    limitations: [
      'Bundle materials replace the ordinary independent rune/gem channel; never add both for one settlement.',
      'Goblin rewards are conditional on an authorized goblin settlement; encounter and admission rates are not measured.',
      'Quest caches and Hell first-kill bonuses are conditional once-only amounts, never repeatable income.',
      'Quest rows do not infer difficulty eligibility; settlement owns claim eligibility and first-kill flags.',
      'Exact uniform-grid masses do not establish uniformity or independence of seeded PRNG outputs.',
      'Bundle means and at-least-one chances model independent quantity and identity draws within a settlement.',
      'Single-material caches exclude accompanying quest currencies, equipment caches and other rewards.',
      'No total acquisition rate, recipe affordability, completion time, pacing or balance acceptance is established.'
    ]
  };
}

/** Direct inputs/outputs and item predicates; no acquisition or craft-time inference. */
export function catalogMaterialDemand() {
  return {
    recipes: structuredClone(materialRecipeRules.recipes),
    runewords: socketRunewords.map(word => {
      const materials: Record<string, number> = {};
      for (const id of word.runes) materials[id] = (materials[id] ?? 0) + materialRecipeRules.insertion.quantity;
      return { id: word.id, runeSequence: [...word.runes], costs: { materials, currencies: {} },
        target: { sockets: word.sockets, reqLevel: word.reqLevel,
          allowedBases: [...word.allowedBases], allowedSlots: [...word.allowedSlots],
          ...(word.allowedWeaponTypes ? { allowedWeaponTypes: [...word.allowedWeaponTypes] } : {}) } };
    }),
    salvage: structuredClone(materialRecipeRules.salvage),
    insertion: structuredClone(materialRecipeRules.insertion),
    limitations: [
      'Costs are direct inputs; fusion and dismantling keep their separate outputs and currency costs.',
      'Recipe targets must be owned and eligible; this catalog does not establish equipment availability.',
      'Socket clearing destroys inserted contents without refund; their value is not a fixed recipe cost.',
      'Salvage requires eligible owned equipment; yield rules do not measure equipment acquisition.',
      'Runeword costs retain repeated runes and sequence; base and socket eligibility remain required.',
      'No material-yield ratio is interpreted as expected recipe completion time or affordability.'
    ]
  };
}

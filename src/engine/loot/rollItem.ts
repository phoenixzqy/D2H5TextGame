import { createRng, hashSeed, type Rng } from '../rng';
import { rollStatPackage } from '../items/statRolls';
import type { Affix, AffixRoll, Item, ItemBase, ItemBaseType, ItemStatKey, Rarity, RolledAffix, SetPieceDef, UniqueItemDef } from '../types/items';
export interface RarityAffixRange { readonly min: number; readonly max: number }
export interface RarityAffixCount { readonly prefix: RarityAffixRange; readonly suffix: RarityAffixRange; readonly total?: RarityAffixRange }
export type RarityAffixRules = Readonly<Partial<Record<Rarity, RarityAffixCount>>>;
export interface RollItemInput { readonly baseId: string; readonly rarity: Rarity; readonly ilvl: number }
/** Exact unique template and positive integer item level to materialize. */
export interface RollUniqueItemInput { readonly uniqueId: string; readonly ilvl: number }
export interface ItemRollPools {
  readonly bases: ReadonlyMap<string, ItemBase>;
  readonly affixes: readonly Affix[];
  readonly rarityRules?: RarityAffixRules;
  readonly uniques?: readonly UniqueItemDef[];
  readonly setPieces?: readonly SetPieceDef[];
}
let itemSeq = 0; export function __resetRollItemSeqForTests(): void { itemSeq = 0; }
function nextItemId(rng: Rng): string { itemSeq = (itemSeq + 1) >>> 0; return `it-${rng.nextInt(0, 0xffffff).toString(36)}-${itemSeq.toString(36)}`; }

function hasReviewedSocketBudget(base: ItemBase): base is ItemBase & { readonly maxSockets: number } {
  const maximum = base.maxSockets, fixed = base.sockets ?? 0;
  return typeof maximum === 'number' && Number.isSafeInteger(maximum) && maximum >= 0 && maximum <= 6
    && Number.isSafeInteger(fixed) && fixed >= 0 && fixed <= maximum;
}

/** Capacity uses stable generation entropy, preserving parent RNG and retry allocation gaps. */
function withSocketCapacity(item: Item, base: ItemBase & { readonly maxSockets: number }): Item {
  if (base.type !== 'weapon' && base.type !== 'armor') return item;
  if (item.rarity === 'unique' || item.rarity === 'set') {
    return { ...item, socketCapacity: base.sockets ?? 0 };
  }
  const generationEntropy = item.id.slice(3, item.id.lastIndexOf('-'));
  const rng = createRng(hashSeed(JSON.stringify([
    'item-socket-capacity-v1', generationEntropy, item.baseId, item.rarity, item.level
  ])));
  const maximum = item.rarity === 'normal' ? base.maxSockets : Math.min(2, base.maxSockets);
  return { ...item, socketCapacity: rng.nextInt(0, maximum) };
}
/**
 * Advance the in-memory item-id sequence past the highest seq encoded in
 * any of the given existing ids. Call after hydrating a save so freshly
 * rolled items can never collide with persisted ones (the rng portion
 * alone is not unique — only ~16M values — so we rely on the seq suffix
 * to disambiguate).
 */
export function seedItemSeqFromIds(ids: Iterable<string>): void {
  let max = itemSeq;
  for (const id of ids) {
    const m = /^it-[0-9a-z]+-([0-9a-z]+)$/.exec(id);
    if (!m?.[1]) continue;
    const n = parseInt(m[1], 36);
    if (Number.isFinite(n) && n > max) max = n;
  }
  itemSeq = max >>> 0;
}
function defaultRules(rarity: Rarity): RarityAffixCount { if (rarity === 'magic') return { prefix:{min:1,max:1}, suffix:{min:1,max:1} }; if (rarity === 'rare') return { prefix:{min:1,max:3}, suffix:{min:1,max:3}, total:{min:4,max:6} }; return { prefix:{min:0,max:0}, suffix:{min:0,max:0}, total:{min:0,max:0} }; }
function rulesFor(rarity: Rarity, rules?: RarityAffixRules): RarityAffixCount { return rules?.[rarity] ?? defaultRules(rarity); }
function rollBaseStats(base: ItemBase, rng: Rng): Partial<Record<ItemStatKey, number>> { const rolls: Partial<Record<ItemStatKey, number>> = {}; if (base.baseDamage) rolls.attack = rng.nextInt(Math.ceil(base.baseDamage.min), Math.floor(base.baseDamage.max)); if (typeof base.baseDefense === 'number' && base.baseDefense > 0) { const v = Math.max(1, Math.round(base.baseDefense * 0.15)); rolls.defense = rng.nextInt(Math.max(1, base.baseDefense - v), base.baseDefense + v); } return rolls; }
function tierIndexFor(affix: Affix, ilvl: number): number | undefined { let chosen: number | undefined; affix.tiers.forEach((tier, index) => { if (ilvl >= tier.ilvlMin && ilvl <= tier.ilvlMax) chosen = index; }); return chosen; }
function appliesTo(affix: Affix, type: ItemBaseType): boolean { return affix.appliesTo.length === 0 || affix.appliesTo.includes(type); }
function pickWeighted(pool: readonly Affix[], rarity: Rarity, rng: Rng): Affix | undefined { const weighted = pool.map((affix) => ({ affix, weight: affix.rarityWeights[rarity] ?? 0 })).filter((entry) => entry.weight > 0); const total = weighted.reduce((sum, entry) => sum + entry.weight, 0); if (total <= 0) return undefined; let roll = rng.next() * total; for (const entry of weighted) { roll -= entry.weight; if (roll <= 0) return entry.affix; } return weighted[weighted.length - 1]?.affix; }
function takeAffix(remaining: Affix[], kind: 'prefix' | 'suffix', rarity: Rarity, ilvl: number, rng: Rng): AffixRoll | undefined { const pool = remaining.filter((affix) => affix.kind === kind && tierIndexFor(affix, ilvl) !== undefined); const picked = pickWeighted(pool, rarity, rng); if (!picked) return undefined; const tierIndex = tierIndexFor(picked, ilvl); if (tierIndex === undefined) return undefined; const tier = picked.tiers[tierIndex]; if (!tier) return undefined; const idx = remaining.findIndex((affix) => affix.id === picked.id); if (idx >= 0) remaining.splice(idx, 1); return { id: picked.id, tier: tierIndex, rolledValue: rng.nextInt(tier.valueMin, tier.valueMax) }; }
function eligibleFor(affix: Affix, rarity: Rarity, ilvl: number): boolean { return (affix.rarityWeights[rarity] ?? 0) > 0 && tierIndexFor(affix, ilvl) !== undefined; }
/**
 * Preflight exactly one legal rare prefix/suffix without consuming randomness.
 * The returned roller reuses normal item affix selection and tier rolls, but
 * never creates an item or changes identity, base rolls, capacity or source level.
 */
export function prepareRareAffixPair(base: ItemBase, ilvl: number, affixes: readonly Affix[]): (rng: Rng) => readonly RolledAffix[] {
  if (!Number.isSafeInteger(ilvl) || ilvl < 1 || !base.canHaveAffixes) throw new Error('Invalid craft source level or base');
  const legal = affixes.filter(affix => appliesTo(affix, base.type) && eligibleFor(affix, 'rare', ilvl));
  if (!legal.some(affix => affix.kind === 'prefix') || !legal.some(affix => affix.kind === 'suffix')) {
    throw new Error('Missing legal craft prefix or suffix');
  }
  return rng => {
    const remaining = [...legal];
    const prefix = takeAffix(remaining, 'prefix', 'rare', ilvl, rng);
    const suffix = takeAffix(remaining, 'suffix', 'rare', ilvl, rng);
    if (!prefix || !suffix || 'values' in prefix || 'values' in suffix) throw new Error('Invalid craft affix pool');
    return [prefix, suffix];
  };
}
function rollCounts(rarity: Rarity, rules: RarityAffixCount, available: { prefix: number; suffix: number }, rng: Rng): { prefix: number; suffix: number } { if (rarity === 'rare') { const totalRule = rules.total ?? { min: 4, max: 6 }; const maxTotal = Math.min(totalRule.max, available.prefix + available.suffix, rules.prefix.max + rules.suffix.max); const minTotal = Math.min(totalRule.min, maxTotal); const feasible: { total: number; minPrefix: number; maxPrefix: number }[] = []; for (let total = minTotal; total <= maxTotal; total += 1) { const minPrefix = Math.max(rules.prefix.min, total - rules.suffix.max, total - available.suffix, 0); const maxPrefix = Math.min(rules.prefix.max, available.prefix, total - rules.suffix.min); if (minPrefix <= maxPrefix) feasible.push({ total, minPrefix, maxPrefix }); } const picked = (feasible.length > 0 ? feasible[rng.nextInt(0, feasible.length - 1)] : undefined) ?? { total: 0, minPrefix: 0, maxPrefix: 0 }; const prefix = rng.nextInt(picked.minPrefix, picked.maxPrefix); return { prefix, suffix: picked.total - prefix }; } return { prefix: rng.nextInt(Math.min(rules.prefix.min, available.prefix), Math.min(rules.prefix.max, available.prefix)), suffix: rng.nextInt(Math.min(rules.suffix.min, available.suffix), Math.min(rules.suffix.max, available.suffix)) }; }
function rollAffixes(base: ItemBase, rarity: Rarity, ilvl: number, affixes: readonly Affix[], rules: RarityAffixCount, rng: Rng): readonly AffixRoll[] { if (rarity !== 'magic' && rarity !== 'rare') return []; if (!base.canHaveAffixes) return []; const remaining = affixes.filter((affix) => appliesTo(affix, base.type) && eligibleFor(affix, rarity, ilvl)); const available = { prefix: remaining.filter((affix) => affix.kind === 'prefix').length, suffix: remaining.filter((affix) => affix.kind === 'suffix').length }; const counts = rollCounts(rarity, rules, available, rng); const rolled: AffixRoll[] = []; for (let i = 0; i < counts.prefix; i += 1) { const roll = takeAffix(remaining, 'prefix', rarity, ilvl, rng); if (roll) rolled.push(roll); } for (let i = 0; i < counts.suffix; i += 1) { const roll = takeAffix(remaining, 'suffix', rarity, ilvl, rng); if (roll) rolled.push(roll); } return rolled; }
/**
 * Prepare four to six distinct rare affixes without creating or changing an item.
 * Preflight consumes no RNG and rejects pools/count rules that cannot satisfy the
 * full contract. Ordinary sparse drops and the two-affix caster recipe retain
 * their existing rules and random streams. Definitions are caller-owned readonly
 * data; each use gets a fresh without-replacement selection pool.
 */
export function prepareRareAffixes(base: ItemBase, ilvl: number, affixes: readonly Affix[],
  rules: RarityAffixCount): (rng: Rng) => readonly RolledAffix[] {
  if (!Number.isSafeInteger(ilvl) || ilvl < 1 || !base.canHaveAffixes) {
    throw new Error('Invalid rare affix source level or base');
  }
  const total = rules.total ?? { min: 4, max: 6 };
  const bounded = (range: RarityAffixRange, min: number, max: number): boolean =>
    Number.isSafeInteger(range.min) && Number.isSafeInteger(range.max) &&
    range.min >= min && range.max <= max && range.min <= range.max;
  if (!bounded(rules.prefix, 1, 3) || !bounded(rules.suffix, 1, 3) || !bounded(total, 4, 6)) {
    throw new Error('Invalid rare affix count rules');
  }
  const legal = affixes.filter(affix => appliesTo(affix, base.type) &&
    eligibleFor(affix, 'rare', ilvl) && Number.isFinite(affix.rarityWeights.rare));
  if (new Set(legal.map(affix => affix.id)).size !== legal.length) {
    throw new Error('Duplicate rare affix identity');
  }
  const availablePrefix = legal.filter(affix => affix.kind === 'prefix').length;
  const availableSuffix = legal.filter(affix => affix.kind === 'suffix').length;
  let feasible = false;
  for (let count = total.min; count <= total.max; count++) {
    const minPrefix = Math.max(rules.prefix.min, count - rules.suffix.max, count - availableSuffix);
    const maxPrefix = Math.min(rules.prefix.max, availablePrefix, count - rules.suffix.min);
    if (minPrefix <= maxPrefix) feasible = true;
  }
  if (!feasible) throw new Error('Insufficient distinct legal rare affixes');
  return rng => rollAffixes(base, 'rare', ilvl, legal, rules, rng).map(roll => {
    if ('values' in roll) throw new Error('Invalid generated rare affix');
    return roll;
  });
}
function templateWeight(template: { readonly weight?: number }): number { return Math.max(0, template.weight ?? 1); }
function eligibleUnique(template: UniqueItemDef, baseId: string, ilvl: number): boolean { return template.baseId === baseId && ilvl >= (template.qlvl ?? template.reqLevel); }
function eligibleSetPiece(template: SetPieceDef, baseId: string, ilvl: number): boolean { return template.baseId === baseId && ilvl >= (template.qlvl ?? template.reqLevel); }
/** Preflight exact materialized rarity without consuming RNG or allocating an ID. */
export function canRollItemRarity(input: RollItemInput, pools: ItemRollPools): boolean {
  const base = pools.bases.get(input.baseId);
  if (!base || base.id !== input.baseId || !hasReviewedSocketBudget(base) ||
    !Number.isSafeInteger(input.ilvl) || input.ilvl < 1) return false;
  const positive = (template: { readonly weight?: number }): boolean =>
    Number.isFinite(templateWeight(template)) && templateWeight(template) > 0;
  if (input.rarity === 'unique') return (pools.uniques ?? []).some(template =>
    eligibleUnique(template, base.id, input.ilvl) && positive(template));
  if (input.rarity === 'set') return (pools.setPieces ?? []).some(template =>
    eligibleSetPiece(template, base.id, input.ilvl) && positive(template));
  return true;
}
function pickTemplate<T extends { readonly weight?: number }>(templates: readonly T[], rng: Rng): T | undefined {
  const positive = templates.filter(template => Number.isFinite(templateWeight(template)) && templateWeight(template) > 0);
  const total = positive.reduce((sum, template) => sum + templateWeight(template), 0);
  if (total <= 0) return undefined;
  let roll = rng.next() * total;
  for (const template of positive) {
    roll -= templateWeight(template);
    if (roll <= 0) return template;
  }
  return positive[positive.length - 1];
}
function materializeTemplateItem(base: ItemBase & { readonly maxSockets: number }, input: RollItemInput, rarity: Extract<Rarity, 'unique' | 'set'>, rng: Rng, template: UniqueItemDef | SetPieceDef): Item {
  const { statRolls } = rollStatPackage(template.stats, rng);
  const item: Item = {
    id: nextItemId(rng),
    baseId: base.id,
    rarity,
    level: Math.max(input.ilvl, template.reqLevel),
    ilvl: input.ilvl,
    baseRolls: rollBaseStats(base, rng),
    affixes: [],
    statRolls,
    generatedName: {},
    identified: true,
    equipped: false
  };
  if (rarity === 'unique') return withSocketCapacity({ ...item, uniqueId: template.id }, base);
  const piece = template as SetPieceDef;
  return withSocketCapacity({ ...item, setId: piece.setId, setPieceId: piece.id }, base);
}
/**
 * Construct one exact unique without weighted selection or rare fallback.
 * Invalid level, missing/duplicate template, missing/mismatched base or unmet
 * qlvl (falling back to reqLevel) returns undefined without RNG or allocation.
 * Template weight and base equip requirements do not affect eligibility.
 * Uses existing stat → ID → base rolls; reproducing IDs also requires matching
 * allocator state. Typed definitions are caller-owned; constructor/RNG errors
 * propagate and may consume randomness or leave allocation gaps.
 */
export function rollUniqueItem(input: RollUniqueItemInput, pools: ItemRollPools, rng: Rng): Item | undefined {
  if (!Number.isInteger(input.ilvl) || input.ilvl <= 0) return undefined;
  const matches = (pools.uniques ?? []).filter((template) => template.id === input.uniqueId);
  const template = matches[0];
  if (matches.length !== 1 || !template) return undefined;
  const base = pools.bases.get(template.baseId);
  if (!base || base.id !== template.baseId || !hasReviewedSocketBudget(base) || !eligibleUnique(template, base.id, input.ilvl)) return undefined;
  return materializeTemplateItem(base, { baseId: base.id, rarity: 'unique', ilvl: input.ilvl }, 'unique', rng, template);
}
export function rollItem(input: RollItemInput, pools: ItemRollPools, rng: Rng): Item | undefined {
  const base = pools.bases.get(input.baseId);
  if (!base || !hasReviewedSocketBudget(base)) return undefined;
  const ilvl = input.ilvl;
  if (input.rarity === 'unique') {
    const template = pickTemplate((pools.uniques ?? []).filter((u) => eligibleUnique(u, base.id, ilvl)), rng);
    if (template) return materializeTemplateItem(base, input, 'unique', rng, template);
  }
  if (input.rarity === 'set') {
    const template = pickTemplate((pools.setPieces ?? []).filter((p) => eligibleSetPiece(p, base.id, ilvl)), rng);
    if (template) return materializeTemplateItem(base, input, 'set', rng, template);
  }
  const rarity = input.rarity === 'unique' || input.rarity === 'set' ? 'rare' : input.rarity;
  const affixes = rollAffixes(base, rarity, ilvl, pools.affixes, rulesFor(rarity, pools.rarityRules), rng);
  return withSocketCapacity({ id: nextItemId(rng), baseId: base.id, rarity, level: ilvl, ilvl, baseRolls: rollBaseStats(base, rng), affixes, generatedName: {}, identified: rarity === 'normal' || rarity === 'magic', equipped: false }, base);
}

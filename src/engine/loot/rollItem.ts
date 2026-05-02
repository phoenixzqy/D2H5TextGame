import type { Rng } from '../rng';
import { rollStatPackage } from '../items/statRolls';
import type { Affix, AffixRoll, Item, ItemBase, ItemBaseType, ItemStatKey, Rarity, SetPieceDef, UniqueItemDef } from '../types/items';
export interface RarityAffixRange { readonly min: number; readonly max: number }
export interface RarityAffixCount { readonly prefix: RarityAffixRange; readonly suffix: RarityAffixRange; readonly total?: RarityAffixRange }
export type RarityAffixRules = Readonly<Partial<Record<Rarity, RarityAffixCount>>>;
export interface RollItemInput { readonly baseId: string; readonly rarity: Rarity; readonly ilvl: number }
export interface ItemRollPools {
  readonly bases: ReadonlyMap<string, ItemBase>;
  readonly affixes: readonly Affix[];
  readonly rarityRules?: RarityAffixRules;
  readonly uniques?: readonly UniqueItemDef[];
  readonly setPieces?: readonly SetPieceDef[];
}
let itemSeq = 0; export function __resetRollItemSeqForTests(): void { itemSeq = 0; }
function nextItemId(rng: Rng): string { itemSeq = (itemSeq + 1) >>> 0; return `it-${rng.nextInt(0, 0xffffff).toString(36)}-${itemSeq.toString(36)}`; }
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
function rollCounts(rarity: Rarity, rules: RarityAffixCount, available: { prefix: number; suffix: number }, rng: Rng): { prefix: number; suffix: number } { if (rarity === 'rare') { const totalRule = rules.total ?? { min: 4, max: 6 }; const maxTotal = Math.min(totalRule.max, available.prefix + available.suffix, rules.prefix.max + rules.suffix.max); const minTotal = Math.min(totalRule.min, maxTotal); const feasible: { total: number; minPrefix: number; maxPrefix: number }[] = []; for (let total = minTotal; total <= maxTotal; total += 1) { const minPrefix = Math.max(rules.prefix.min, total - rules.suffix.max, total - available.suffix, 0); const maxPrefix = Math.min(rules.prefix.max, available.prefix, total - rules.suffix.min); if (minPrefix <= maxPrefix) feasible.push({ total, minPrefix, maxPrefix }); } const picked = (feasible.length > 0 ? feasible[rng.nextInt(0, feasible.length - 1)] : undefined) ?? { total: 0, minPrefix: 0, maxPrefix: 0 }; const prefix = rng.nextInt(picked.minPrefix, picked.maxPrefix); return { prefix, suffix: picked.total - prefix }; } return { prefix: rng.nextInt(Math.min(rules.prefix.min, available.prefix), Math.min(rules.prefix.max, available.prefix)), suffix: rng.nextInt(Math.min(rules.suffix.min, available.suffix), Math.min(rules.suffix.max, available.suffix)) }; }
function rollAffixes(base: ItemBase, rarity: Rarity, ilvl: number, affixes: readonly Affix[], rules: RarityAffixCount, rng: Rng): readonly AffixRoll[] { if (rarity !== 'magic' && rarity !== 'rare') return []; if (!base.canHaveAffixes) return []; const remaining = affixes.filter((affix) => appliesTo(affix, base.type) && eligibleFor(affix, rarity, ilvl)); const available = { prefix: remaining.filter((affix) => affix.kind === 'prefix').length, suffix: remaining.filter((affix) => affix.kind === 'suffix').length }; const counts = rollCounts(rarity, rules, available, rng); const rolled: AffixRoll[] = []; for (let i = 0; i < counts.prefix; i += 1) { const roll = takeAffix(remaining, 'prefix', rarity, ilvl, rng); if (roll) rolled.push(roll); } for (let i = 0; i < counts.suffix; i += 1) { const roll = takeAffix(remaining, 'suffix', rarity, ilvl, rng); if (roll) rolled.push(roll); } return rolled; }
function templateWeight(template: { readonly weight?: number }): number { return Math.max(0, template.weight ?? 1); }
function eligibleUnique(template: UniqueItemDef, baseId: string, ilvl: number): boolean { return template.baseId === baseId && ilvl >= (template.qlvl ?? template.reqLevel); }
function eligibleSetPiece(template: SetPieceDef, baseId: string, ilvl: number): boolean { return template.baseId === baseId && ilvl >= (template.qlvl ?? template.reqLevel); }
function pickTemplate<T extends { readonly weight?: number }>(templates: readonly T[], rng: Rng): T | undefined {
  const total = templates.reduce((sum, template) => sum + templateWeight(template), 0);
  if (total <= 0) return undefined;
  let roll = rng.next() * total;
  for (const template of templates) {
    roll -= templateWeight(template);
    if (roll <= 0) return template;
  }
  return templates[templates.length - 1];
}
function materializeTemplateItem(base: ItemBase, input: RollItemInput, rarity: Extract<Rarity, 'unique' | 'set'>, rng: Rng, template: UniqueItemDef | SetPieceDef): Item {
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
  if (rarity === 'unique') return { ...item, uniqueId: template.id };
  const piece = template as SetPieceDef;
  return { ...item, setId: piece.setId, setPieceId: piece.id };
}
export function rollItem(input: RollItemInput, pools: ItemRollPools, rng: Rng): Item | undefined {
  const base = pools.bases.get(input.baseId);
  if (!base) return undefined;
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
  return { id: nextItemId(rng), baseId: base.id, rarity, level: ilvl, ilvl, baseRolls: rollBaseStats(base, rng), affixes, generatedName: {}, identified: rarity === 'normal' || rarity === 'magic', equipped: false };
}

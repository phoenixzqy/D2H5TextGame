import { materialRecipes, materialRecipeRules, type CraftingBag, type MaterialRecipe } from '@/data/loaders/material-recipes';
import { materialCatalog, materialEconomy, type MaterialProfile } from '@/data/loaders/materials';
import { mergeMaterials, type MaterialLedger } from '../loot/materials';
import { previewSocketInsertion, previewSocketClearing, validateCanonicalSocketItem, type CanonicalSocketItem } from '../items/socket-contents';
import { prepareRareAffixPair } from '../loot/rollItem';
import { createRng, hashSeed, type Rng } from '../rng';
import { sha256 } from '../sha256';
import type { Affix, ItemBase } from '../types/items';
import type { HistoricalItem } from '../save/historical-items';
import { historicalSocketBases, validateItemServiceFields } from '../save/historical-sockets';
import { actionData, canonicalActionValue, readMaterialActionState, type MaterialActionReceipt } from './action-state';

/** Exact v18 location; historical ownership maps accept arbitrary string keys. */
export type MaterialRecoveryOrigin = { readonly container: 'backpack' | 'stash'; readonly index: number }
  | { readonly container: 'equipped'; readonly slot: string }
  | { readonly container: 'mercEquipment'; readonly mercId: string; readonly slot: string };
/** Exact unsupported v18 payload plus its original location; recovery never infers contents. */
export interface MaterialRecoveryEntry { readonly sourceVersion: 18; readonly item: HistoricalItem; readonly origin: MaterialRecoveryOrigin }
/** Whole participating inventory projection; the store adapter owns publication and rollback. */
export interface MaterialActionInventory {
  readonly backpack: readonly CanonicalSocketItem[];
  readonly stash: readonly CanonicalSocketItem[];
  readonly materials: MaterialLedger;
  readonly currencies: Readonly<Record<string, number>>;
  readonly quarantine: readonly MaterialRecoveryEntry[];
  readonly materialActionOrdinal: number;
  readonly latestMaterialAction?: MaterialActionReceipt;
}
/** Live authority, never UI-supplied: progression, all other ownership, reservations and capacities. */
export interface MaterialActionContext {
  readonly characterId: string;
  readonly highestUnlockedAct: MaterialProfile['act'];
  readonly difficulty: MaterialProfile['difficulty'];
  readonly backpackCapacity: number;
  readonly stashCapacity: number;
  readonly reservedItemIds: ReadonlySet<string>;
  readonly otherOwnedItemIds: ReadonlySet<string>;
  readonly bases: ReadonlyMap<string, ItemBase>;
  readonly affixes: readonly Affix[];
}
/** IDs select live ownership; callers cannot submit a replacement item or random output. */
export interface MaterialActionSelection { readonly recipeId: string; readonly itemIds?: readonly string[]; readonly materialId?: string }
/** Native resource deficit; missing is the additional quantity required by this action. */
export interface MaterialActionShortfall { readonly kind: 'material' | 'currency'; readonly id: string; readonly missing: number }
/** All deficits after validating participating balances; never a malformed-state refusal. */
export class MaterialActionShortageError extends Error {
  constructor(readonly shortfalls: readonly MaterialActionShortfall[]) {
    super(shortfalls[0]?.kind === 'currency' ? 'Insufficient crafting currency' : 'Insufficient crafting materials');
    this.name = 'MaterialActionShortageError';
  }
}
interface ActionInput { readonly kind: 'material' | 'currency' | 'item' | 'quarantine'; readonly id: string; readonly quantity: number }
interface TargetPreimage { readonly id: string; readonly preimage: string }
/** Prepared once per confirmation and retained through double-click/retry. */
export interface MaterialActionRequest {
  readonly characterId: string;
  readonly ordinal: number;
  readonly recipeId: string;
  readonly inputs: readonly ActionInput[];
  readonly targets: readonly TargetPreimage[];
  readonly requestHash: string;
}
/** A replay has no next-state publication, even when its original inputs are gone. */
export interface MaterialActionPlan {
  readonly replay: boolean;
  readonly result: MaterialActionReceipt['result'];
  readonly next?: MaterialActionInventory;
}
interface Description {
  readonly inputs: readonly ActionInput[];
  readonly targets: readonly TargetPreimage[];
  readonly materials: MaterialLedger;
  readonly currencies: Readonly<Record<string, number>>;
  readonly output: CraftingBag;
  readonly transform?: (rng: Rng) => CanonicalSocketItem;
  readonly removeIds?: ReadonlySet<string>;
  readonly recoverId?: string;
}
const emptyBag = (): CraftingBag => ({ materials: {}, currencies: {} });
const isPositive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

function sourceLevel(item: CanonicalSocketItem): number {
  const value = Object.hasOwn(item, 'ilvl') ? actionData(item, 'ilvl') : actionData(item, 'level');
  if (!isPositive(value)) throw new Error('Invalid crafting source level');
  return value;
}
function targetBase(item: CanonicalSocketItem, context: MaterialActionContext): ItemBase {
  const base = context.bases.get(item.baseId);
  if (!base) throw new Error('Unknown material action item base');
  validateCanonicalSocketItem(item, base);
  if (item.equipped || typeof item.equipped !== 'boolean' || context.reservedItemIds.has(item.id)
    || !['weapon', 'armor', 'jewelry'].includes(base.type) || context.otherOwnedItemIds.has(item.id)) throw new Error('Ineligible material action item');
  return base;
}
function ownedItem(state: MaterialActionInventory, context: MaterialActionContext, id: string, allowStash = false): CanonicalSocketItem {
  const matches = [...state.backpack, ...state.stash].filter(item => item.id === id);
  const item = matches[0];
  if (!item || matches.length !== 1 || !allowStash && !state.backpack.includes(item)) throw new Error('Missing or duplicate owned material target');
  targetBase(item, context);
  return item;
}
function currencyBalance(currencies: Readonly<Record<string, number>>, id: string): number {
  const value = Object.hasOwn(currencies, id) ? currencies[id] : 0;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid crafting currency balance');
  return value;
}
function balances(state: MaterialActionInventory, costs: CraftingBag, output: CraftingBag): Pick<Description, 'materials' | 'currencies'> {
  const materials: Record<string, number> = { ...mergeMaterials(state.materials) };
  const currencies = { ...state.currencies };
  // Invalid participating balances take precedence over ordinary affordability.
  for (const id of new Set([...Object.keys(costs.currencies), ...Object.keys(output.currencies)])) currencyBalance(currencies, id);
  const shortfalls: MaterialActionShortfall[] = [];
  for (const [id, count] of Object.entries(costs.materials)) {
    const missing = count - (materials[id] ?? 0);
    if (missing > 0) shortfalls.push({ kind: 'material', id, missing });
  }
  for (const [id, count] of Object.entries(costs.currencies)) {
    const missing = count - currencyBalance(currencies, id);
    if (missing > 0) shortfalls.push({ kind: 'currency', id, missing });
  }
  if (shortfalls.length) throw new MaterialActionShortageError(shortfalls);
  for (const [id, count] of Object.entries(costs.materials)) {
    const before = materials[id] ?? 0;
    if (before === count) Reflect.deleteProperty(materials, id); else materials[id] = before - count;
  }
  for (const [id, count] of Object.entries(costs.currencies)) {
    const before = currencyBalance(currencies, id);
    currencies[id] = before - count;
  }
  for (const [id, count] of Object.entries(output.currencies)) {
    const after = currencyBalance(currencies, id) + count;
    if (!Number.isSafeInteger(after)) throw new Error('Crafting currency overflow');
    currencies[id] = after;
  }
  return { materials: mergeMaterials(materials, output.materials), currencies };
}
function describe(state: MaterialActionInventory, context: MaterialActionContext, selection: MaterialActionSelection): Description {
  if (!context.characterId || ![1, 2, 3, 4, 5].includes(context.highestUnlockedAct)
    || !['normal', 'nightmare', 'hell'].includes(context.difficulty)
    || !Number.isSafeInteger(context.backpackCapacity) || context.backpackCapacity < 0
    || !Number.isSafeInteger(context.stashCapacity) || context.stashCapacity < 0) throw new Error('Invalid material action authority');
  const ids = [...new Set(selection.itemIds ?? [])];
  if (ids.some(id => typeof id !== 'string' || !id)) throw new Error('Invalid selected item identity');
  let costs = emptyBag(), output = emptyBag(), transform: Description['transform'];
  let items: readonly CanonicalSocketItem[] = [], removeIds: ReadonlySet<string> | undefined, recoverId: string | undefined;
  let targets: readonly TargetPreimage[] | undefined;
  if (selection.recipeId === 'actions/salvage') {
    if (!ids.length || selection.materialId !== undefined) throw new Error('Empty or malformed salvage selection');
    // Resolve the whole batch once; repeated ownership remains ambiguous.
    const owned = new Map<string, CanonicalSocketItem | null>();
    for (const holder of [state.backpack, state.stash]) {
      for (const item of holder) owned.set(item.id, owned.has(item.id) ? null : item);
    }
    items = ids.map(id => {
      const item = owned.get(id);
      if (!item) throw new Error('Missing or duplicate owned material target');
      targetBase(item, context);
      return item;
    });
    let count = 0;
    for (const item of items) {
      const base = targetBase(item, context);
      if (base.type !== 'weapon' && base.type !== 'armor' && base.type !== 'jewelry') throw new Error('Non-gear cannot be salvaged');
      const yieldValue = materialRecipeRules.salvage.rarityYields[item.rarity];
      const added = yieldValue * (1 + Math.floor((sourceLevel(item) - 1) / materialRecipeRules.salvage.levelBandSize));
      if (!isPositive(added) || !Number.isSafeInteger(count + added)) throw new Error('Salvage output overflow');
      count += added;
    }
    output = { materials: { [materialRecipeRules.salvage.materialId]: count }, currencies: {} };
    removeIds = new Set(ids);
  } else if (selection.recipeId === 'actions/recover-v18') {
    if (ids.length !== 1 || selection.materialId !== undefined) throw new Error('Invalid recovery selection');
    const matches = state.quarantine.filter(entry => entry.item.id === ids[0]);
    const entry = matches[0];
    if (matches.length !== 1 || !entry || actionData(entry, 'sourceVersion') !== 18 || 'socketContents' in entry.item
      || context.reservedItemIds.has(entry.item.id) || context.otherOwnedItemIds.has(entry.item.id)
      || [...state.backpack, ...state.stash].some(item => item.id === entry.item.id)) throw new Error('Invalid or colliding recovery entry');
    const historicalBase = historicalSocketBases.find(row => row.id === entry.item.baseId);
    if (!historicalBase) throw new Error('Unknown historical recovery base');
    validateItemServiceFields(entry.item, historicalBase);
    if (state.backpack.length >= context.backpackCapacity) throw new Error('No room for recovered item');
    const { runes, runewordId: _word, ...rest } = entry.item;
    const item: CanonicalSocketItem = { ...rest, rarity: 'normal', equipped: false, socketContents: [] };
    targetBase(item, context);
    const refunds: Record<string, number> = {};
    for (const id of runes ?? []) refunds[id] = (refunds[id] ?? 0) + 1;
    output = { materials: refunds, currencies: {} };
    recoverId = item.id; transform = () => item;
    targets = [{ id: item.id, preimage: canonicalActionValue(entry) }];
  } else if (selection.recipeId === 'actions/socket-insert') {
    if (ids.length !== 1 || !selection.materialId || !materialCatalog.has(selection.materialId)) throw new Error('Invalid insertion selection');
    const item = ownedItem(state, context, ids[0] ?? ''); items = [item];
    const next = previewSocketInsertion(item, targetBase(item, context), selection.materialId);
    costs = { materials: { [selection.materialId]: materialRecipeRules.insertion.quantity }, currencies: {} };
    transform = () => next;
  } else {
    const recipe = materialRecipes.get(selection.recipeId);
    if (!recipe || selection.materialId !== undefined) throw new Error('Unknown material recipe');
    costs = recipe.costs;
    if ('output' in recipe) {
      if (ids.length) throw new Error('Exchange has no target item');
      output = recipe.output;
      if (recipe.kind === 'rune-fusion') {
        const ordinal = materialEconomy.runeOrder.indexOf(Object.keys(output.materials)[0] ?? '') + 1;
        const cap = Math.min(materialEconomy.actRuneCaps[context.highestUnlockedAct - 1] ?? 0,
          context.difficulty === 'hell' ? materialEconomy.runeOrder.length : materialEconomy.nonHellRuneCap);
        if (ordinal < 1 || ordinal > cap) throw new Error('Rune fusion output not unlocked');
      }
    } else {
      if (ids.length !== 1) throw new Error('Transform needs one exact item');
      const item = ownedItem(state, context, ids[0] ?? ''); items = [item];
      const base = targetBase(item, context), target = recipe.target;
      if ((target.type === 'gear' ? base.type !== 'weapon' && base.type !== 'armor' : base.type !== target.type)
        || target.slot !== undefined && base.slot !== target.slot || !target.rarities.includes(item.rarity)
        || target.identified !== undefined && item.identified !== target.identified
        || target.emptyContents !== ((item.socketContents?.length ?? 0) === 0)) throw new Error('Ineligible recipe target');
      transform = recipeTransform(recipe, item, base, context);
    }
  }
  const inputs: ActionInput[] = [
    ...Object.entries(costs.materials).map(([id, quantity]) => ({ kind: 'material' as const, id, quantity })),
    ...Object.entries(costs.currencies).map(([id, quantity]) => ({ kind: 'currency' as const, id, quantity })),
    ...items.map(item => ({ kind: 'item' as const, id: item.id, quantity: 1 })),
    ...(recoverId ? [{ kind: 'quarantine' as const, id: recoverId, quantity: 1 }] : [])
  ];
  return { ...balances(state, costs, output), inputs,
    targets: targets ?? items.map(item => ({ id: item.id, preimage: canonicalActionValue(item) })), output,
    ...(transform ? { transform } : {}), ...(removeIds ? { removeIds } : {}), ...(recoverId ? { recoverId } : {}) };
}

function recipeTransform(recipe: Exclude<MaterialRecipe, { readonly output: CraftingBag }>, item: CanonicalSocketItem,
  base: ItemBase, context: MaterialActionContext): (rng: Rng) => CanonicalSocketItem {
  if (recipe.kind === 'socket-clear') {
    const next = previewSocketClearing(item, base); return () => next;
  }
  if (recipe.kind === 'socket-armor') {
    if (!isPositive(base.maxSockets) || base.maxSockets < recipe.minimumSockets) throw new Error('Base has no socket budget');
    return rng => ({ ...item, socketCapacity: rng.nextInt(recipe.minimumSockets, base.maxSockets ?? 0) });
  }
  const roll = prepareRareAffixPair(base, sourceLevel(item), context.affixes);
  return rng => ({ ...item, rarity: 'rare', generatedName: {}, affixes: [
    { affixId: recipe.fixedAffix.affixId, values: new Map(Object.entries(recipe.fixedAffix.values)) }, ...roll(rng)
  ] });
}
function requestHash(payload: Omit<MaterialActionRequest, 'requestHash'>): string {
  return sha256(canonicalActionValue(payload));
}

function validatedSelection(state: MaterialActionInventory, context: MaterialActionContext, selection: MaterialActionSelection) {
  const current = readMaterialActionState(state);
  if (current.ordinal === Number.MAX_SAFE_INTEGER) throw new Error('Material action ordinal exhausted');
  return { ordinal: current.ordinal + 1, description: describe(state, context, selection) };
}

/** Check native eligibility without preparing an intent, rolling output or changing state. Throws on refusal. */
export function validateMaterialActionSelection(state: MaterialActionInventory, context: MaterialActionContext, selection: MaterialActionSelection): void {
  validatedSelection(state, context, selection);
}

/** Complete preflight and prepare a stable intent, without rolling output, publishing or advancing ordinal. */
export function prepareMaterialAction(state: MaterialActionInventory, context: MaterialActionContext, selection: MaterialActionSelection): MaterialActionRequest {
  const { ordinal, description } = validatedSelection(state, context, selection);
  const payload = { characterId: context.characterId, ordinal, recipeId: selection.recipeId,
    inputs: description.inputs, targets: description.targets };
  return { ...payload, requestHash: requestHash(payload) };
}

function validateRequest(value: MaterialActionRequest): void {
  canonicalActionValue(value); // descriptor/hidden/sparse/cycle validation before field access
  const exactKeys = (node: object, keys: readonly string[]): boolean =>
    Reflect.ownKeys(node).length === keys.length && keys.every(key => Object.hasOwn(node, key));
  if (!exactKeys(value, ['characterId', 'ordinal', 'recipeId', 'inputs', 'targets', 'requestHash'])
    || typeof value.characterId !== 'string' || !value.characterId || !isPositive(value.ordinal)
    || typeof value.recipeId !== 'string' || !value.recipeId || typeof value.requestHash !== 'string'
    || !/^[a-f0-9]{64}$/.test(value.requestHash) || !Array.isArray(value.inputs) || !Array.isArray(value.targets)) throw new Error('Invalid material action request');
  const seenInputs = new Set<string>(), seenTargets = new Set<string>();
  const inputs: readonly unknown[] = value.inputs, targets: readonly unknown[] = value.targets;
  for (const input of inputs) {
    if (!input || typeof input !== 'object' || !exactKeys(input, ['kind', 'id', 'quantity'])) throw new Error('Invalid material action inputs');
    const kind = actionData(input, 'kind'), id = actionData(input, 'id'), quantity = actionData(input, 'quantity');
    if (typeof kind !== 'string' || !['material', 'currency', 'item', 'quarantine'].includes(kind) || typeof id !== 'string' || !id
      || !isPositive(quantity) || seenInputs.has(`${kind}:${id}`)) throw new Error('Invalid material action inputs');
    seenInputs.add(`${kind}:${id}`);
  }
  for (const target of targets) {
    if (!target || typeof target !== 'object' || !exactKeys(target, ['id', 'preimage'])) throw new Error('Invalid material action preimage');
    const id = actionData(target, 'id'), preimage = actionData(target, 'preimage');
    if (typeof id !== 'string' || !id || typeof preimage !== 'string' || !preimage || seenTargets.has(id)) throw new Error('Invalid material action preimage');
    seenTargets.add(id);
  }
  const { requestHash: hash, ...payload } = value;
  if (requestHash(payload) !== hash) throw new Error('Material action request hash mismatch');
}

/**
 * Resolve exact latest replay before consumed-input checks; new requests repeat
 * complete live preflight and use a private identity-seeded RNG. The caller holds
 * the shared synchronous ownership lease through publication and every rollback.
 */
export function planMaterialAction(state: MaterialActionInventory, context: MaterialActionContext, request: MaterialActionRequest): MaterialActionPlan {
  validateRequest(request);
  if (request.characterId !== context.characterId) throw new Error('Wrong material action character');
  const current = readMaterialActionState(state);
  if (request.ordinal === current.ordinal && current.receipt?.requestHash === request.requestHash) {
    return { replay: true, result: current.receipt.result };
  }
  if (current.ordinal === Number.MAX_SAFE_INTEGER || request.ordinal !== current.ordinal + 1) throw new Error('Stale or gapped material action');
  const materialId = request.recipeId === 'actions/socket-insert' ? request.inputs.find(input => input.kind === 'material')?.id : undefined;
  const description = describe(state, context, { recipeId: request.recipeId, itemIds: request.targets.map(target => target.id),
    ...(materialId ? { materialId } : {}) });
  if (canonicalActionValue(description.inputs) !== canonicalActionValue(request.inputs)
    || canonicalActionValue(description.targets) !== canonicalActionValue(request.targets)) throw new Error('Material action inputs changed');
  const rng = createRng(hashSeed(JSON.stringify(['material-action-v1', context.characterId, request.ordinal, request.requestHash])));
  const transformed = description.transform?.(rng);
  const result = { ...description.output, ...(transformed ? { itemId: transformed.id } : {}) };
  const project = (items: readonly CanonicalSocketItem[]): readonly CanonicalSocketItem[] => items
    .filter(item => !description.removeIds?.has(item.id)).map(item => item.id === transformed?.id ? transformed : item);
  const next: MaterialActionInventory = { ...state, materials: description.materials, currencies: description.currencies,
    backpack: description.recoverId && transformed ? [...state.backpack, transformed] : project(state.backpack),
    stash: project(state.stash), quarantine: description.recoverId ? state.quarantine.filter(entry => entry.item.id !== description.recoverId) : state.quarantine,
    materialActionOrdinal: request.ordinal, latestMaterialAction: { ordinal: request.ordinal, requestHash: request.requestHash, result } };
  return { replay: false, result, next };
}

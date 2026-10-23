import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { loadItemBases } from '@/data/loaders/loot';
import { validateItemServiceFields, effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { aggregateEquipmentMods } from '@/engine/progression/equipment-mods';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { checkEligibility } from '@/features/inventory/compareEquip';
import type { DerivedStats } from '@/engine/types/attributes';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { observeEarnedState, type EarnedState } from './earned-state';

type Owner = 'hero' | 'merc';
type Gear = Record<string, Item | null>;
type ScoreKey = 'attack' | 'attackSpeed' | 'lifeMax' | 'defense' | 'magicResist' | 'manaMax' |
  'fireRes' | 'lightningRes' | 'physicalRes';
const safeKeys = new Set(['strength', 'dexterity', 'vitality', 'energy', 'life', 'mana', 'attack',
  'defense', 'magicResist', 'attackSpeed', 'allRes', 'fireRes', 'coldRes', 'lightningRes',
  'poisonRes', 'arcaneRes', 'physicalRes']);

/** Expected policy refusal, distinguished from a harness/runtime exception. */
export class FreshGearRefusal extends Error {
  constructor(readonly evidence: unknown) { super('Fresh earned gear policy refused'); }
}

/** Validate the actual current instance; no legacy capacity fallback or normalization. */
export function auditNativeLiteral(expected: Item): Item {
  const actual = useInventoryStore.getState().backpack.find(item => item.id === expected.id);
  if (!actual || !Object.hasOwn(actual, 'socketCapacity') ||
    !isDeepStrictEqual(actual, { ...expected, socketCapacity: actual.socketCapacity })) {
    throw new FreshGearRefusal({ reason: 'historical-literal-fields-drift', expected, actual: actual ?? null });
  }
  validateNative(actual);
  return actual;
}

function validateNative(item: Item): number {
  const base = loadItemBases().get(item.baseId);
  assert.ok(base, 'Selected actual item has no authoritative base');
  try {
    validateItemServiceFields(item, base);
    return effectiveSocketCapacity(item, base);
  } catch (error) {
    throw new FreshGearRefusal({ reason: 'invalid-native-item-state', item,
      validatorError: error instanceof Error ? error.message : String(error) });
  }
}

/** Refuse drift in a separately frozen complete earned instance, including absent fields. */
export function auditFrozenNativeItem(expected: Item): Item {
  const actual = useInventoryStore.getState().backpack.find(item => item.id === expected.id);
  if (!isDeepStrictEqual(actual, expected)) throw new FreshGearRefusal({
    reason: 'frozen-v2-owned-payload-drift', expected, actual: actual ?? null
  });
  assert.ok(actual);
  validateNative(actual);
  return actual;
}

function mercIn(state: EarnedState) {
  const merc = state.merc.ownedMercs.find(actor => actor.id === state.merc.fieldedMercId);
  assert.ok(merc && merc.classId === 'rogue', 'Accepted policy requires its fielded earned Rogue');
  return merc;
}

/** Transfer only the current backpack instance; preserve its entire native payload. */
export function transferFreshItem(owner: Owner, slot: EquipmentSlot, id: string, candidateIndex?: number) {
  const before = observeEarnedState();
  const merc = mercIn(before);
  const item = before.inventory.backpack.find(candidate => candidate.id === id);
  if (!item) throw new FreshGearRefusal({ reason: 'selected-item-not-in-backpack', owner, slot, id });
  const bases = loadItemBases();
  const actor = owner === 'hero' ? before.player.player : merc;
  assert.ok(actor);
  if (!checkEligibility(item, actor, bases).eligible)
    throw new FreshGearRefusal({ reason: 'selected-item-ineligible', owner, slot, item });
  if (candidateIndex !== undefined) {
    const candidates = before.inventory.backpack.filter(candidate => bases.get(candidate.baseId)?.slot === slot);
    if (candidates[candidateIndex]?.id !== item.id) throw new FreshGearRefusal({
      reason: 'accepted-merc-candidate-order-drift', slot, id, candidateIndex,
      actualId: candidates[candidateIndex]?.id ?? null });
  }
  const capacity = validateNative(item);
  const result = owner === 'hero' ? useInventoryStore.getState().equipItem(item)
    : useMercStore.getState().equipOnMerc(merc.id, slot, item);
  if (!result.ok) throw new FreshGearRefusal({ reason: 'production-equip-refused', owner, slot, item, result });
  const after = observeEarnedState();
  const stored = owner === 'hero' ? after.inventory.equipped[slot] : after.merc.mercEquipment[merc.id]?.[slot];
  assert.ok(stored, 'Transferred actual item disappeared');
  assert.equal(validateNative(stored), capacity);
  assert.deepEqual(stored, owner === 'hero' ? { ...item, equipped: true }
    : { ...item, equipped: true, equipSlot: slot });
  return { owner, slot, itemBefore: item, itemAfter: stored, capacity, candidateIndex: candidateIndex ?? null };
}

function safe(gear: Gear): boolean {
  return Object.keys(aggregateEquipmentMods(gear)).every(key => safeKeys.has(key));
}
function score(stats: DerivedStats, key: ScoreKey): number {
  if (key === 'fireRes') return stats.resistances.fire;
  if (key === 'lightningRes') return stats.resistances.lightning;
  if (key === 'physicalRes') return stats.resistances.physical;
  return stats[key];
}

/** Pure accepted selector over actual earned ownership, frozen before any transfer. */
export function selectFreshGear(before: EarnedState, phase: 'initial' | 'boundary') {
  const bases = loadItemBases();
  const player = before.player.player;
  assert.ok(player);
  const merc = mercIn(before);
  const virtual: Record<Owner, Gear> = { hero: { ...before.inventory.equipped },
    merc: { ...before.merc.mercEquipment[merc.id] } };
  const reserved = new Set<string>();
  const choices: { owner: Owner; slot: EquipmentSlot; previousId: string | null;
    selectedId: string | null; item: Item | null; keys: readonly ScoreKey[]; score: readonly number[] }[] = [];
  const project = (owner: Owner, gear: Gear) => owner === 'hero'
    ? deriveEquippedPlayerStats(player, player.level, gear, before.map.questProgress,
      before.inventory.questItems, before.map.questReceipts) : deriveEquippedMercStats(merc, gear);
  const pick = (owner: Owner, slot: EquipmentSlot, keys: readonly ScoreKey[], oneHanded = false) => {
    const current = virtual[owner][slot] ?? null;
    const values = (item: Item) => phase === 'initial'
      ? [aggregateEquipmentMods({ item })[slot === 'weapon' ? 'attack' : 'defense'] ?? 0]
      : keys.map(key => score(project(owner, { ...virtual[owner], [slot]: item }), key));
    const pool = [...before.inventory.backpack, ...(current ? [current] : [])].filter(item => {
      const base = bases.get(item.baseId);
      return base?.slot === slot && !reserved.has(item.id) && safe({ item }) &&
        (!oneHanded || base.handedness === 'oneHanded') &&
        (phase !== 'initial' || item.rarity === 'normal' && (item.affixes?.length ?? 0) === 0) &&
        safe({ ...virtual[owner], [slot]: item }) && checkEligibility(item, owner === 'hero' ? player : merc, bases).eligible;
    });
    if (pool.length === 0 && phase === 'initial' && !current) {
      choices.push({ owner, slot, previousId: null, selectedId: null, item: null, keys, score: [] });
      return;
    }
    if (pool.length === 0) throw new FreshGearRefusal({ reason: 'no-safe-eligible-earned-candidate', owner, slot, phase });
    const scored = pool.map(item => ({ item, values: values(item) }));
    scored.sort((a, b) => {
      for (let index = 0; index < a.values.length; index++) {
        const left = a.values[index], right = b.values[index];
        assert.ok(Number.isFinite(left) && Number.isFinite(right));
        assert.ok(left !== undefined && right !== undefined);
        if (left !== right) return right - left;
      }
      return Number(b.item.id === current?.id) - Number(a.item.id === current?.id) ||
        (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0);
    });
    const selected = scored[0];
    assert.ok(selected);
    validateNative(selected.item);
    choices.push({ owner, slot, previousId: current?.id ?? null, selectedId: selected.item.id,
      item: selected.item, keys, score: selected.values });
    reserved.add(selected.item.id);
    virtual[owner][slot] = selected.item;
  };
  if (phase === 'initial') {
    pick('hero', 'weapon', ['attack'], true);
    for (const slot of ['offhand', 'head', 'chest', 'belt', 'gloves', 'boots'] as const) pick('hero', slot, ['defense']);
    pick('merc', 'weapon', ['attack']);
    for (const slot of ['head', 'chest', 'belt', 'gloves', 'boots'] as const) pick('merc', slot, ['defense']);
  } else {
    pick('merc', 'weapon', ['attack', 'attackSpeed'], true);
    pick('merc', 'head', ['attack', 'lifeMax', 'defense']);
    pick('hero', 'weapon', ['attackSpeed', 'lifeMax', 'magicResist', 'defense'], true);
    for (const slot of ['head', 'offhand', 'chest', 'belt', 'gloves'] as const) pick('hero', slot, ['defense', 'lifeMax']);
    pick('hero', 'boots', ['fireRes', 'lightningRes', 'defense']);
    pick('hero', 'amulet', ['lifeMax', 'physicalRes', 'manaMax']);
    for (const slot of ['offhand', 'chest', 'belt', 'gloves', 'boots'] as const) pick('merc', slot, ['defense', 'lifeMax']);
  }
  return { phase, choices: structuredClone(choices) };
}

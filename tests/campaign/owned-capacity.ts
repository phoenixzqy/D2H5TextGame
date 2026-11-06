import assert from 'node:assert/strict';
import { loadItemBases } from '@/data/loaders/loot';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { projectMercenaryStars } from '@/engine/progression/merc-stars';
import { aggregateEquipmentMods } from '@/engine/progression/equipment-mods';
import type { DerivedStats } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';
import { checkEligibility, prepareCompareEquip, slotCandidates } from '@/features/inventory/compareEquip';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, isMercEquipmentSlotCompatible } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from '@/stores/inventoryCapacity';
import { executeLiveMaterialAction, prepareLiveMaterialAction } from '@/stores/materialActions';
import { EQUIPMENT_SLOT_ORDER } from '@/ui/EquipmentPanel';
import { earnedDelta, observeEarnedState } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import type { CampaignProfile } from './policy';
import { weaponOffense } from './merc-gear';

const scalars = ['lifeMax', 'manaMax', 'attack', 'defense', 'magicResist', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'] as const;
const resistances = ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const;
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function scores(stats: DerivedStats, current: DerivedStats): number[] {
  const deltas = [...scalars.map(key => stats[key] - current[key]),
    ...resistances.map(key => stats.resistances[key] - current.resistances[key])];
  const net = deltas.reduce((sum, value) => sum + value, 0);
  return [...deltas, weaponOffense(stats) - weaponOffense(current), net, deltas.every(value => value >= 0) ? net : -Infinity];
}

function collectionIdentity(item: Item): string | null {
  const identity = item.rarity === 'unique' ? item.uniqueId
    : item.rarity === 'set' && item.setId && item.setPieceId ? `${item.setId}/${item.setPieceId}` : null;
  return identity ? `${item.rarity}/${item.baseId}/${identity}` : null;
}

/** Finite owned shortlist; native eligibility is never waived when these items are equipped later. */
export function recoverIntendedOwnedCapacity(profile: CampaignProfile, record: CampaignRecord,
  onSink: (delta: CampaignReward) => void): 'ready' | 'protected-capacity-blocked' | 'unchanged' {
  if (profile.capacityPolicy !== 'owned-shortlist-v2') return 'unchanged';
  assert.equal(useHydrationStore.getState().status, 'ready');
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(), 'Owned capacity requires an idle boundary');
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  const inventory = useInventoryStore.getState(), target = BACKPACK_CAPACITY - 3;
  if (inventory.backpack.length <= target) return 'ready';
  const owned = [...inventory.backpack, ...inventory.stash], bases = loadItemBases();
  const selection = useIronGolemSelectionStore.getState().selection;
  const retained = new Set(Object.values(inventory.questItems).filter(row => row.state === 'owned').map(row => row.itemId));
  if (selection?.heroId === hero.id) retained.add(selection.itemId);
  for (const item of owned) {
    const base = bases.get(item.baseId);
    if (item.equipped || (item.socketContents?.length ?? 0) > 0 || item.personalizedBy !== undefined ||
      (!['normal', 'magic', 'rare'].includes(item.rarity) && !collectionIdentity(item)) || !base ||
      !['weapon', 'armor', 'jewelry'].includes(base.type)) retained.add(item.id);
  }
  const collection = new Map<string, Item[]>();
  for (const item of owned) {
    const identity = collectionIdentity(item);
    if (identity) { const copies = collection.get(identity) ?? []; copies.push(item); collection.set(identity, copies); }
  }
  for (const copies of collection.values()) {
    const first = copies[0]; assert.ok(first);
    const base = bases.get(first.baseId);
    const count = base?.slot === 'ring-left' || base?.slot === 'ring-right' ||
      base?.type === 'weapon' && base.handedness === 'oneHanded' ? 2 : 1;
    copies.sort((a, b) => (b.socketCapacity ?? 0) - (a.socketCapacity ?? 0) ||
      (b.ilvl ?? b.level) - (a.ilvl ?? a.level) || lexical(a.id, b.id));
    for (const item of copies.slice(0, count)) retained.add(item.id);
  }
  const surplusCandidates = owned.filter(item => !retained.has(item.id));
  const map = useMapStore.getState(), mercState = useMercStore.getState(), merc = mercState.getFieldedMerc();
  const compare = prepareCompareEquip(hero, inventory.equipped, bases,
    map.questProgress, inventory.questItems, map.questReceipts);
  const stars = merc ? mercState.recruitmentProgress[merc.id.split('#')[0] ?? merc.id]?.stars ?? 0 : 0;
  const mercEquipment = merc ? mercState.getMercEquipment(merc.id) : {};
  const mercStats = merc ? deriveEquippedMercStats(merc, mercEquipment, stars) : null;
  const groups = new Map<string, { item: Item; scores: number[] }[]>();
  const add = (group: string, item: Item, values: number[]) => {
    const rows = groups.get(group) ?? []; rows.push({ item, scores: values }); groups.set(group, rows);
  };
  for (const slot of EQUIPMENT_SLOT_ORDER) {
    for (const item of slotCandidates(owned, slot, bases)) {
      const base = bases.get(item.baseId); assert.ok(base);
      const kind = base.weaponType ?? base.type;
      const comparison = compare(item, slot);
      const stats = { ...hero.derivedStats, resistances: { ...hero.derivedStats.resistances } };
      for (const key of scalars) stats[key] = comparison.stats[key].candidate;
      for (const key of resistances) stats.resistances[key] = comparison.resistances[key].candidate;
      const mods = aggregateEquipmentMods({ [slot]: item });
      const currentMods = aggregateEquipmentMods({ [slot]: inventory.equipped[slot] ?? null });
      add(`hero/${slot}/${kind}/${checkEligibility(item, hero, bases).eligible ? 'eligible' : 'future'}`, item,
        [...scores(stats, hero.derivedStats), (mods.magicFind ?? 0) - (currentMods.magicFind ?? 0),
          (mods.goldFind ?? 0) - (currentMods.goldFind ?? 0)]);
      if (merc && mercStats && slot !== 'charm' && isMercEquipmentSlotCompatible(base, slot)) {
        const projected = deriveEquippedMercStats(merc, { ...mercEquipment, [slot]: item }, stars);
        add(`merc/${slot}/${kind}/${checkEligibility(item, projectMercenaryStars(merc, stars), bases).eligible ? 'eligible' : 'future'}`,
          item, scores(projected, mercStats));
      }
    }
  }
  for (const [group, rows] of groups) {
    const count = group.includes('/ring-') ? 2 : 1;
    for (let index = 0; index < (rows[0]?.scores.length ?? 0); index++) {
      const best = rows.filter(row => Number.isFinite(row.scores[index]) && (row.scores[index] ?? 0) > 0).sort((a, b) =>
        (b.scores[index] ?? 0) - (a.scores[index] ?? 0) || lexical(a.item.id, b.item.id)).slice(0, count);
      for (const row of best) retained.add(row.item.id);
    }
  }
  const socketBases = new Map<string, Item>();
  for (const item of surplusCandidates.filter(row => row.rarity === 'normal')) {
    const previous = socketBases.get(item.baseId);
    const order = previous ? (item.socketCapacity ?? 0) - (previous.socketCapacity ?? 0) ||
      (item.ilvl ?? item.level) - (previous.ilvl ?? previous.level) || lexical(previous.id, item.id) : 1;
    if (order > 0) socketBases.set(item.baseId, item);
  }
  for (const item of socketBases.values()) retained.add(item.id);
  const consumedItems = surplusCandidates.filter(item => !retained.has(item.id));
  const ownedIds = new Set(owned.map(item => item.id));
  const retainedItemIds = [...retained].filter(id => ownedIds.has(id)).sort(lexical);
  record({ kind: 'owned-capacity-selection', policy: profile.capacityPolicy, retainedItemIds,
    itemIds: consumedItems.map(item => item.id) });
  if (consumedItems.length) {
    const before = observeEarnedState();
    const request = prepareLiveMaterialAction({ recipeId: 'actions/salvage', itemIds: consumedItems.map(item => item.id) });
    const result = executeLiveMaterialAction(request), delta = earnedDelta(before, observeEarnedState());
    onSink({ ...delta, inventorySink: { policy: 'salvage-owned-shortlist-v2', ordinal: request.ordinal,
      retainedItemIds, consumedItems } });
    assert.equal(result.replay, false); assert.deepEqual(delta.removedItemIds, consumedItems.map(item => item.id));
    assert.deepEqual(delta.addedItems, []); assert.equal(delta.xp, 0);
    record({ kind: 'campaign-inventory-sink', policy: 'salvage-owned-shortlist-v2', request, result, delta });
  }
  const state = useInventoryStore.getState(), transfers = Math.max(0, state.backpack.length - target);
  if (transfers > STASH_CAPACITY - state.stash.length) return 'protected-capacity-blocked';
  const transferItems = [...state.backpack].sort((a, b) => lexical(a.id, b.id)).slice(0, transfers);
  for (const item of transferItems) {
    const result = useInventoryStore.getState().moveToStash(item.id);
    assert.deepEqual(result, { ok: true }); record({ kind: 'campaign-capacity-transfer', itemId: item.id, result });
  }
  assert.ok(useInventoryStore.getState().backpack.length <= target);
  return 'ready';
}

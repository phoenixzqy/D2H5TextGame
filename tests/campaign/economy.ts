import assert from 'node:assert/strict';
import { xpTotal } from '@/engine/progression/xp';
import { materialRecipeRules } from '@/data/loaders/material-recipes';
import { materialCatalog } from '@/data/loaders/materials';
import { loadItemBases } from '@/data/loaders/loot';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import type { Item } from '@/engine/types/items';
import type { SaveCurrent } from '@/engine/types/save';

export interface CampaignEconomy {
  readonly xp: number;
  readonly items: readonly Item[];
  readonly materials: Readonly<Record<string, number>>;
  readonly currencies: Readonly<Record<string, number>>;
}
export interface CampaignReward {
  readonly xp: number;
  readonly addedItems: readonly Item[];
  readonly removedItemIds: readonly string[];
  readonly materials: Readonly<Record<string, number>>;
  readonly currencies: Readonly<Record<string, number>>;
  readonly inventorySink?: { readonly policy: 'salvage-overflow-normals-v1'; readonly ordinal: number;
    readonly consumedItems?: readonly Item[] } |
    { readonly policy: 'salvage-caster-overflow-v1' | 'salvage-owned-overflow-v1' | 'salvage-owned-shortlist-v2'; readonly ordinal: number; readonly retainedItemIds: readonly string[]; readonly consumedItems: readonly Item[] };
  readonly socketInsertion?: { readonly ordinal: number; readonly materialId: string;
    readonly before: Item; readonly after: Item };
}

/** Read canonical ownership, not the legacy equipment mirrors in merc definitions. */
export function campaignEconomy(save: SaveCurrent): CampaignEconomy {
  return { xp: xpTotal(save.player.level) + save.player.experience,
    items: [...save.inventory.backpack, ...save.inventory.stash,
      ...Object.values(save.inventory.equipped).filter((item): item is Item => item !== null),
      ...Object.values(save.mercs.mercEquipment).flatMap(slots =>
        Object.values(slots).filter((item): item is Item => item != null))],
    materials: save.inventory.materials, currencies: save.inventory.currencies };
}

function itemPayload(item: Item) {
  const { equipped: _equipped, equipSlot: _slot, ...payload } = item;
  return payload;
}
const ledger = (value: Readonly<Record<string, number>>) => Object.fromEntries(
  Object.entries(value).filter(([, count]) => count !== 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));

/** Independent conservation of actual terminal ownership versus journaled settlement deltas. */
export function auditCampaignEconomy(initial: CampaignEconomy, terminal: CampaignEconomy,
  rewards: readonly CampaignReward[]) {
  const items = new Map(initial.items.map(item => [item.id, itemPayload(item)]));
  assert.equal(items.size, initial.items.length, 'Duplicate initial owned item');
  const currencies = { ...initial.currencies }, materials = { ...initial.materials };
  const protectedIds = new Set(initial.items.filter(item => item.equipped).map(item => item.id));
  const seenItemIds = new Set(items.keys());
  const actionOrdinals = new Set<number>();
  let xp = initial.xp, addedItems = 0, removedItems = 0, socketInsertions = 0;
  const reserveAction = (ordinal: number) => {
    assert.ok(Number.isSafeInteger(ordinal) && ordinal > 0 && !actionOrdinals.has(ordinal),
      'Duplicate or invalid campaign material action');
    actionOrdinals.add(ordinal);
  };
  for (const reward of rewards) {
    xp += reward.xp;
    if (reward.socketInsertion) {
      const insertion = reward.socketInsertion;
      reserveAction(insertion.ordinal);
      assert.equal(reward.inventorySink, undefined);
      assert.equal(reward.xp, 0);
      assert.deepEqual(reward.addedItems, []); assert.deepEqual(reward.removedItemIds, []);
      assert.deepEqual(ledger(reward.currencies), {});
      const kind = materialCatalog.get(insertion.materialId)?.kind;
      assert.ok(kind === 'gem' || kind === 'rune', 'Socket requires a catalog gem or rune');
      assert.deepEqual(items.get(insertion.before.id), itemPayload(insertion.before), 'Socket prior payload mismatch');
      const base = loadItemBases().get(insertion.before.baseId); assert.ok(base);
      validateCanonicalSocketItem(insertion.before, base);
      assert.notEqual(insertion.before.rarity, 'runeword');
      assert.ok((insertion.before.socketContents?.length ?? 0) < effectiveSocketCapacity(insertion.before, base));
      const expected = { ...itemPayload(insertion.before), socketContents: [
        ...insertion.before.socketContents ?? [], { kind, id: insertion.materialId }] };
      assert.deepEqual(itemPayload(insertion.after), expected, 'Socket changed intrinsic item payload');
      validateCanonicalSocketItem(insertion.after, base);
      const quantity = materialRecipeRules.insertion.quantity;
      assert.ok((materials[insertion.materialId] ?? 0) >= quantity, 'Socket used an unearned material');
      assert.deepEqual(ledger(reward.materials), { [insertion.materialId]: -quantity }, 'Socket material cost mismatch');
      items.set(insertion.before.id, expected); socketInsertions++;
    }
    if (reward.removedItemIds.length) {
      const sink = reward.inventorySink;
      assert.ok(sink?.policy === 'salvage-overflow-normals-v1' || sink?.policy === 'salvage-caster-overflow-v1' || sink?.policy === 'salvage-owned-overflow-v1' || sink?.policy === 'salvage-owned-shortlist-v2',
        'Unplanned campaign item sink');
      const retained = new Set(sink.policy !== 'salvage-overflow-normals-v1' ? sink.retainedItemIds : []);
      for (const id of retained) assert.ok(items.has(id), 'Unowned retention target');
      const consumed = new Map(sink.consumedItems?.map(item => [item.id, item] as const) ?? []);
      if (sink.consumedItems !== undefined) {
        assert.equal(consumed.size, sink.consumedItems.length, 'Duplicate sink custody');
        assert.deepEqual([...consumed.keys()], reward.removedItemIds, 'Sink custody mismatch');
      }
      reserveAction(sink.ordinal);
      assert.equal(reward.xp, 0); assert.deepEqual(reward.addedItems, []);
      assert.ok(Object.values(reward.currencies).every(count => count === 0));
      assert.equal(new Set(reward.removedItemIds).size, reward.removedItemIds.length);
      let scrap = 0;
      for (const id of reward.removedItemIds) {
        const item = items.get(id); assert.ok(item, 'Unowned campaign sink target');
        assert.ok((item.rarity === 'normal' || (sink.policy !== 'salvage-overflow-normals-v1' &&
          (item.rarity === 'magic' || item.rarity === 'rare' || sink.policy === 'salvage-owned-shortlist-v2' &&
            (item.rarity === 'unique' || item.rarity === 'set')))) && !item.socketContents?.length &&
          (sink.policy !== 'salvage-owned-shortlist-v2' || item.personalizedBy === undefined) &&
          (sink.consumedItems !== undefined || !protectedIds.has(id)) && !retained.has(id),
          'Protected campaign sink target');
        if (sink.policy === 'salvage-owned-shortlist-v2' && (item.rarity === 'unique' || item.rarity === 'set')) {
          const identity = item.rarity === 'unique' ? item.uniqueId : item.setId && item.setPieceId;
          assert.ok(identity, 'Unknown special sink identity');
          const sameIdentity = (candidate: typeof item) => candidate.rarity === item.rarity && candidate.baseId === item.baseId &&
            (item.rarity === 'unique' ? candidate.uniqueId === item.uniqueId
              : candidate.setId === item.setId && candidate.setPieceId === item.setPieceId);
          const base = loadItemBases().get(item.baseId); assert.ok(base);
          const count = base.slot === 'ring-left' || base.slot === 'ring-right' ||
            base.type === 'weapon' && base.handedness === 'oneHanded' ? 2 : 1;
          assert.ok([...retained].filter(iid => { const candidate = items.get(iid); return candidate && sameIdentity(candidate); }).length >= count,
            'Special sink lost required collection copies');
        }
        if (sink.consumedItems !== undefined) {
          const custody = consumed.get(id); assert.ok(custody && !custody.equipped,
            sink.policy === 'salvage-caster-overflow-v1' ? 'Equipped caster sink target' : 'Equipped sink target');
          assert.deepEqual(itemPayload(custody), item, 'Sink source payload mismatch');
        }
        const level = item.ilvl ?? item.level;
        assert.ok(Number.isSafeInteger(level) && level > 0);
        scrap += materialRecipeRules.salvage.rarityYields[item.rarity] *
          (1 + Math.floor((level - 1) / materialRecipeRules.salvage.levelBandSize));
        items.delete(id); removedItems++;
      }
      assert.deepEqual(ledger(reward.materials), { [materialRecipeRules.salvage.materialId]: scrap },
        'Native salvage yield conservation');
    } else assert.equal(reward.inventorySink, undefined, 'Sink receipt without consumption');
    for (const item of reward.addedItems) {
      assert.equal(seenItemIds.has(item.id), false, 'Duplicate campaign item settlement');
      seenItemIds.add(item.id);
      items.set(item.id, itemPayload(item));
      addedItems++;
    }
    for (const [id, count] of Object.entries(reward.currencies)) currencies[id] = (currencies[id] ?? 0) + count;
    for (const [id, count] of Object.entries(reward.materials)) materials[id] = (materials[id] ?? 0) + count;
  }
  const terminalItems = new Map(terminal.items.map(item => [item.id, itemPayload(item)]));
  assert.equal(terminalItems.size, terminal.items.length, 'Duplicate terminal owned item');
  assert.deepEqual(terminalItems, items, 'Campaign item identity/payload conservation');
  assert.equal(terminal.xp, xp, 'Campaign XP conservation');
  assert.deepEqual(ledger(terminal.currencies), ledger(currencies), 'Campaign currency conservation');
  assert.deepEqual(ledger(terminal.materials), ledger(materials), 'Campaign material conservation');
  return { xp: xp - initial.xp, addedItems, ...(removedItems ? { removedItems } : {}),
    ...(socketInsertions ? { socketInsertions } : {}) };
}

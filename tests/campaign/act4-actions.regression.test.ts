/** Constructed earlier encounters isolate native Act IV actions; no earned wins are claimed. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import * as lootAward from '@/engine/loot/award';
import { loadAwardPools } from '@/data/loaders/loot';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState } from '../sim/production/earned-state';
import { constructActFourPrefix, fixtureSave } from './act4-fixture';

const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const hammer = `${forge}#objective:obj-kill-hephasto`, stone = 'quests/act3-guardian#reward:questItem';
const shatter = `${forge}#action:shatter-soulstone`, hephasto = `${forge}#action:hephasto-victory`;
const river = 'areas/act4-river-of-flame', chaos = 'areas/act4-chaos-sanctuary';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function readyHammer() {
  const f = constructActFourPrefix();
  f.actions.start(fallen); f.actions.start(forge); f.actions.start(terror);
  f.enter(4, 'areas/act4-plains-of-despair'); f.actions.claim(fallen);
  f.enter(4, river); f.actions.visit(river, 4); f.actions.recover(hammer);
  return f;
}

it('executes exact two-input Shatter without ordinary income and preserves inherited history', () => {
  const f = readyHammer(), before = observeEarnedState(), rewards = f.rewards.length;
  expect(() => { f.actions.execute(shatter); }).not.toThrow();
  expect(f.rewards).toHaveLength(rewards);
  expect(useInventoryStore.getState().questItems).toEqual({ ...before.inventory.questItems,
    [hammer]: { itemId: 'quest/hellforge_hammer', state: 'consumed' },
    [stone]: { itemId: 'items/soulstone_mephisto', state: 'consumed' } });
  expect(useMapStore.getState().questReceipts).toEqual({ ...before.map.questReceipts, [shatter]: true });
  expect(useMapStore.getState().questProgress[forge]).toEqual({ ...before.map.questProgress[forge],
    status: 'completed', objectives: { 'obj-kill-hephasto': true, 'obj-shatter': true } });
  expect(useMapStore.getState().questProgress[terror]).toEqual(before.map.questProgress[terror]);
  expect(f.actions.entries.at(-1)).toMatchObject({ action: 'execute', id: shatter, result: 'ok' });
  fixtureSave();
});

it.each(['stone-missing', 'stone-wrong', 'stone-consumed', 'hammer-missing', 'hammer-consumed', 'proof-missing',
  'alias-location', 'wrong-act', 'combat-active'] as const)('refuses Shatter with %s and changes no domain state', fault => {
  const f = readyHammer(), inventory = useInventoryStore.getState(), map = useMapStore.getState();
  if (fault === 'stone-missing' || fault === 'hammer-missing') {
    const items = { ...inventory.questItems }; Reflect.deleteProperty(items, fault === 'stone-missing' ? stone : hammer);
    useInventoryStore.setState({ questItems: items });
  }
  if (fault === 'stone-wrong') useInventoryStore.setState({ questItems: { ...inventory.questItems,
    [stone]: { itemId: 'wrong', state: 'owned' } } });
  if (fault === 'stone-consumed' || fault === 'hammer-consumed') {
    const source = fault === 'stone-consumed' ? stone : hammer, item = inventory.questItems[source]; assert.ok(item);
    useInventoryStore.setState({ questItems: { ...inventory.questItems, [source]: { ...item, state: 'consumed' } } });
  }
  if (fault === 'proof-missing') {
    const receipts = { ...map.questReceipts }; Reflect.deleteProperty(receipts, hephasto);
    useMapStore.setState({ questReceipts: receipts });
  }
  if (fault === 'alias-location') map.setCurrentLocation(4, 'a4-river-of-flame');
  if (fault === 'wrong-act') map.setCurrentLocation(3, river);
  if (fault === 'combat-active') useCombatStore.setState({ inCombat: true });
  const before = observeEarnedState(), count = f.rewards.length;
  expect(() => { f.actions.execute(shatter); }).toThrow();
  expect(observeEarnedState()).toEqual(before); expect(f.rewards).toHaveLength(count);
  expect(f.actions.entries.at(-1)?.result).toBe(fault === 'combat-active' ? 'combat-active' : 'not-eligible');
});

it('retains the native Hellforge cache, direct gem shards, XP and fielded merc share once', () => {
  const f = readyHammer(); f.actions.execute(shatter);
  const roll = vi.spyOn(lootAward, 'rollQuestTableRewards');
  f.actions.claim(forge);
  expect(roll).toHaveBeenCalledTimes(1);
  const call = roll.mock.calls[0]; assert.ok(call);
  expect(call).toHaveLength(3);
  expect(call[0]).toEqual({ tableId: 'loot/hellforge-runes', ilvl: 56, picks: 1 });
  expect(call[1]).toEqual(loadAwardPools());
  for (const key of ['next', 'nextInt', 'pick', 'chance', 'fork'] as const)
    expect(typeof call[2][key]).toBe('function');
  const result = roll.mock.results[0]; assert.ok(result?.type === 'return' && result.value);
  const delta = f.actions.entries.at(-1)?.delta; assert.ok(delta);
  const mercId = useMercStore.getState().fieldedMercId; assert.ok(mercId);
  expect(delta.xp).toBe(7000); expect(delta.mercXp).toEqual({ [mercId]: 5250 });
  expect(delta.addedItems).toEqual(result.value.items); expect(delta.materials).toEqual(result.value.materials);
  expect(delta.currencies['gem-shard']).toBe(3 + result.value.gems);
  expect(delta.currencies['rune-shard']).toBe(result.value.runeShards);
  const before = observeEarnedState(); expect(() => { f.actions.claim(forge); }).toThrow('already-claimed');
  expect(observeEarnedState()).toEqual(before); expect(roll).toHaveBeenCalledTimes(1);
});

it('uses three separate seal interactions and a separate native Diablo Claim', () => {
  const f = readyHammer(); f.actions.execute(shatter); f.actions.claim(forge); f.actions.visit(chaos, 4);
  for (let index = 1; index <= 3; index++) {
    f.actions.interact(`objects/diablo_seal_${String(index)}`);
    expect(useMapStore.getState().questProgress[terror]?.objectives).toEqual({
      'obj-seal-1': true, 'obj-seal-2': index >= 2, 'obj-seal-3': index >= 3, 'obj-kill-diablo': false });
  }
  expect(() => { f.actions.claim(terror); }).toThrow('not-completed');
  f.enter(4, chaos);
  const roll = vi.spyOn(lootAward, 'rollQuestTableRewards'); f.actions.claim(terror);
  expect(roll).toHaveBeenCalledTimes(1);
  const call = roll.mock.calls[0]; assert.ok(call);
  expect(call).toHaveLength(3);
  expect(call[0]).toEqual({ tableId: 'loot/diablo-q', ilvl: 61, picks: 5 });
  expect(call[1]).toEqual(loadAwardPools());
  for (const key of ['next', 'nextInt', 'pick', 'chance', 'fork'] as const)
    expect(typeof call[2][key]).toBe('function');
  const delta = f.actions.entries.at(-1)?.delta; assert.ok(delta);
  expect(delta.xp).toBe(25000); expect(Object.values(delta.mercXp)).toEqual([18750]);
  const result = roll.mock.results[0]; assert.ok(result?.type === 'return' && result.value);
  expect(delta.addedItems).toEqual(result.value.items); expect(delta.materials).toEqual(result.value.materials);
});

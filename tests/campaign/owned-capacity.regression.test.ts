/** Constructed native capacity transactions; not earned campaign or balance evidence. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Item } from '@/engine/types/items';
import { createCharacter } from '@/features/character/createCharacter';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { recoverIntendedOwnedCapacity } from './owned-capacity';
import { auditCampaignEconomy, campaignEconomy, type CampaignReward } from './economy';
import { campaignProfiles } from './profiles';

let restores: (() => void)[];
const profile = () => campaignProfiles['necromancer-bone-intended-v1'];
const save = () => { const s = snapshotStores(); assert.ok(s); return s; };
const gear = (id: string, extra: Partial<Item> = {}): Item => ({ id,
  baseId: 'items/base/helm-cap', rarity: 'rare', level: 1, ilvl: 1,
  socketCapacity: 0, identified: true, equipped: false, ...extra });
const special = (id: string) => gear(id, { rarity: 'unique', uniqueId: 'items/unique/biggin-s-bonnet' });
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Capacity QA', 'necromancer').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('recovers rare overflow from both containers and transfers protected gear without losing special ownership', () => {
  const bagSpecial = Array.from({ length: 120 }, (_, i) => ({ ...special(`bag-special-${String(i)}`),
    personalizedBy: { characterId: save().player.id, name: 'Capacity QA' } }));
  const stashSpecial = Array.from({ length: 430 }, (_, i) => ({ ...special(`stash-special-${String(i)}`),
    personalizedBy: { characterId: save().player.id, name: 'Capacity QA' } }));
  useInventoryStore.setState({ backpack: [...bagSpecial,
    ...Array.from({ length: 120 }, (_, i) => gear(`bag-rare-${String(i)}`))],
    stash: [...stashSpecial, ...Array.from({ length: 60 }, (_, i) => gear(`stash-rare-${String(i)}`))] });
  const before = save(), rewards: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); })).toBe('ready');
  const after = save();
  expect(after.inventory.backpack).toHaveLength(97); expect(after.inventory.stash.length).toBeLessThanOrEqual(500);
  expect([...after.inventory.backpack, ...after.inventory.stash].filter(i => i.rarity === 'unique'))
    .toEqual(expect.arrayContaining([...bagSpecial, ...stashSpecial]));
  expect(rewards).toHaveLength(1);
  expect(rewards[0]?.inventorySink?.consumedItems?.some(i => i.id.startsWith('bag-rare'))).toBe(true);
  expect(rewards[0]?.inventorySink?.consumedItems?.some(i => i.id.startsWith('stash-rare'))).toBe(true);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), rewards).removedItems).toBe(179);
  expect(after.player).toEqual(before.player); expect(after.mercs).toEqual(before.mercs);
  const repeated: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { repeated.push(d); })).toBe('ready');
  expect(save()).toEqual(after); expect(repeated).toEqual([]);
});

it('lets stronger protected gear displace inferior ordinary backups in the owned shortlist', () => {
  const protectedItem = { ...special('a-protected-leader'), baseRolls: { defense: 500 },
    affixes: [{ id: 'affix.vital.life.flat', tier: 0, rolledValue: 10000 }] };
  const surplus = Array.from({ length: 120 }, (_, i) => gear(`z-inferior-${String(i)}`, {
    baseRolls: { defense: 1 },
    affixes: [{ id: 'affix.vital.life.flat', tier: 0, rolledValue: i + 1 }]
  }));
  useInventoryStore.setState({ backpack: [protectedItem, ...surplus] });
  const before = save(), rewards: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); })).toBe('ready');
  const after = save();
  expect([...after.inventory.backpack, ...after.inventory.stash]).toEqual([protectedItem]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), rewards).removedItems).toBe(120);
});

it('salvages ordinary backups that improve no tracked stat over the current equipped loadout', () => {
  const equipped = gear('equipped-leader', {
    baseRolls: { defense: 500 },
    affixes: [{ id: 'affix.vital.life.flat', tier: 0, rolledValue: 10000 }] });
  useInventoryStore.setState({ backpack: [equipped] });
  expect(useInventoryStore.getState().equipItem(equipped, 'head').ok).toBe(true);
  useInventoryStore.setState({ backpack: Array.from({ length: 110 }, (_, i) =>
    gear(`inferior-${String(i)}`, { baseRolls: { defense: 1 } })) });
  const before = save(), rewards: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); })).toBe('ready');
  const after = save();
  expect([...after.inventory.backpack, ...after.inventory.stash]).toEqual([]);
  expect(after.inventory.equipped).toEqual(before.inventory.equipped);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), rewards).removedItems).toBe(110);
});

it('retains future upgrades, paid inserts, reserved material, personalized gear and normal socket bases', () => {
  const future = gear('future-life', { level: 50, ilvl: 50,
    affixes: [{ id: 'affix.vital.life.flat', tier: 0, rolledValue: 30 }] });
  const reserved = gear('golem-material'), inserted = gear('paid-insert', {
    socketCapacity: 1, socketContents: [{ kind: 'rune', id: 'runes/el' }] });
  const personalized = gear('named', { personalizedBy: { characterId: save().player.id, name: 'Capacity QA' } });
  const base = gear('future-socket-base', { rarity: 'normal', socketCapacity: 2 });
  useIronGolemSelectionStore.setState({ selection: { heroId: save().player.id, itemId: reserved.id } });
  useInventoryStore.setState({ backpack: [future, reserved, inserted, personalized, base,
    ...Array.from({ length: 110 }, (_, i) => gear(`surplus-${String(i)}`))] });
  const rewards: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); })).toBe('ready');
  const owned = [...save().inventory.backpack, ...save().inventory.stash];
  for (const item of [future, reserved, inserted, personalized, base]) expect(owned).toContainEqual(item);
  expect(rewards[0]?.removedItemIds.length).toBeGreaterThan(0);
});

it('reports protected overflow when both containers cannot fit it', () => {
  useInventoryStore.setState({ backpack: Array.from({ length: 101 }, (_, i) => ({ ...special(`bag-${String(i)}`), personalizedBy: { characterId: save().player.id, name: 'QA' } })),
    stash: Array.from({ length: 500 }, (_, i) => ({ ...special(`stash-${String(i)}`), personalizedBy: { characterId: save().player.id, name: 'QA' } })) });
  const before = save();
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, () => undefined)).toBe('protected-capacity-blocked');
  expect(save()).toEqual(before);
});

it('retains committed salvage accounting when recording fails', () => {
  useInventoryStore.setState({ backpack: Array.from({ length: 110 }, (_, i) => gear(`rare-${String(i)}`)) });
  const before = save(), rewards: CampaignReward[] = [];
  expect(() => recoverIntendedOwnedCapacity(profile(), row => {
    if (row.kind === 'campaign-inventory-sink') throw new Error('Recorder failure');
  }, d => { rewards.push(d); })).toThrow('Recorder failure');
  expect(rewards).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(save()), rewards).removedItems).toBe(109);
});

it('leaves historical profiles untouched and refuses active combat before mutation', () => {
  useInventoryStore.setState({ backpack: Array.from({ length: 110 }, (_, i) => gear(`rare-${String(i)}`)) });
  const before = save();
  expect(recoverIntendedOwnedCapacity(campaignProfiles['necromancer-bone'], () => undefined, () => undefined)).toBe('unchanged');
  expect(save()).toEqual(before);
  useCombatStore.setState({ inCombat: true });
  expect(() => recoverIntendedOwnedCapacity(profile(), () => undefined, () => undefined)).toThrow();
  expect(usePlayerStore.getState().player).toEqual(before.player);
  expect(useInventoryStore.getState().backpack).toEqual(before.inventory.backpack);
});


it.each(['yield', 'retained', 'payload', 'special'] as const)('rejects forged owned overflow %s accounting', mutation => {
  useInventoryStore.setState({ backpack: Array.from({ length: 110 }, (_, i) => gear(`rare-${String(i)}`)) });
  const before = save(), rewards: CampaignReward[] = [];
  recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); });
  const reward = rewards[0]; assert.ok(reward?.inventorySink);
  assert.equal(reward.inventorySink.policy, 'salvage-owned-shortlist-v2');
  const sink = reward.inventorySink; assert.ok('retainedItemIds' in sink && sink.consumedItems);
  const first = sink.consumedItems[0]; assert.ok(first);
  let initial = campaignEconomy(before), forged: CampaignReward = reward;
  if (mutation === 'yield') forged = { ...reward, materials: {} };
  if (mutation === 'retained') forged = { ...reward, inventorySink: { ...sink,
    retainedItemIds: [...sink.retainedItemIds, first.id] } };
  if (mutation === 'payload') forged = { ...reward, inventorySink: { ...sink,
    consumedItems: sink.consumedItems.map(item => item.id === first.id ? { ...item, ilvl: 99 } : item) } };
  if (mutation === 'special') {
    const specialItem = { ...first, rarity: 'unique' as const };
    initial = { ...initial, items: initial.items.map(item => item.id === first.id ? specialItem : item) };
    forged = { ...reward, inventorySink: { ...sink,
      consumedItems: sink.consumedItems.map(item => item.id === first.id ? specialItem : item) } };
  }
  expect(() => auditCampaignEconomy(initial, campaignEconomy(save()), [forged])).toThrow();
});


it('salvages duplicate special drops but retains collection pieces, paired rings and useful rolled upgrades', () => {
  const best = { ...special('best-roll'), baseRolls: { defense: 500 } };
  const representative = { ...special('collection'), ilvl: 20 };
  const rings = Array.from({ length: 120 }, (_, i) => gear(`set-ring-${String(i).padStart(3, '0')}`, {
    baseId: 'items/base/ring-silver', rarity: 'set', setId: 'sets/cathan-traps',
    setPieceId: 'sets/cathan-traps/ring' }));
  const otherPiece = gear('other-set-piece', { baseId: 'items/base/armor-chain-mail', rarity: 'set',
    setId: 'sets/angelic-raiment', setPieceId: 'sets/angelic-raiment/armor' });
  useInventoryStore.setState({ backpack: [best, representative, otherPiece,
    ...Array.from({ length: 120 }, (_, i) => special(`surplus-unique-${String(i)}`))], stash: rings });
  const before = save(), rewards: CampaignReward[] = [];
  expect(recoverIntendedOwnedCapacity(profile(), () => undefined, d => { rewards.push(d); })).toBe('ready');
  const after = save(), owned = [...after.inventory.backpack, ...after.inventory.stash];
  expect(owned).toEqual(expect.arrayContaining([best, representative, otherPiece, rings[0], rings[1]]));
  expect(owned.filter(i => i.rarity === 'set' && i.baseId === 'items/base/ring-silver')).toHaveLength(2);
  expect(owned.filter(i => i.rarity === 'unique')).toHaveLength(2);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), rewards).removedItems).toBe(238);
  const reward = rewards[0]; assert.ok(reward);
  const sink = reward.inventorySink; assert.ok(sink && 'retainedItemIds' in sink);
  const forged = { ...reward, inventorySink: { ...sink, retainedItemIds: [] } };
  expect(() => auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [forged])).toThrow();
});

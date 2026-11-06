/** Constructed owned gear exercises native campaign actions; no earned-save or balance claim. */
import assert, { AssertionError } from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMetaStore } from '@/stores/metaStore';
import { snapshotStores } from '@/stores/persistence';
import * as earnedState from '../sim/production/earned-state';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { claimCampaignQuest, equipCampaignGear, startCampaignQuest, type CampaignRecord } from './actions';
import { createCampaignQuestActions } from './quest-actions';
import { decodeSave } from '@/engine/save/validate';
import { auditCampaignEconomy, campaignEconomy, type CampaignReward } from './economy';
import { campaignProfiles } from './profiles';
import { recoverCampaignCapacity } from './capacity';

const expectedSlots = ['amulet', 'belt', 'boots', 'charm', 'chest', 'gloves', 'head',
  'offhand', 'ring-left', 'ring-right', 'weapon'];
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers();
  resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function item(id: string, baseId = 'items/base/helm-cap', extra: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, ilvl: 1,
    identified: true, equipped: false, socketCapacity: 0, ...extra };
}
function snapshot() {
  const save = snapshotStores();
  assert.ok(save);
  return structuredClone(save);
}
function journal() {
  const records: Readonly<Record<string, unknown>>[] = [];
  const record: CampaignRecord = entry => { records.push(entry); };
  return { records, record };
}

const sisters = 'quests/act1-sisters-to-the-slaughter';
function readySisters() {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Boss checkpoint', 'sorceress').ok).toBe(true);
  const meta = useMetaStore.getState();
  meta.updateIdleState(meta.readIdleBonus(Date.now()));
  useMapStore.getState().markCleared('areas/act1-catacombs');
  useMapStore.getState().updateQuestProgress(sisters,
    { status: 'completed', objectives: { 'obj-kill-andariel': true } });
}

it.each(['legacy', 'transaction'] as const)('retains the complete pre-Claim boss save through the %s adapter', adapter => {
  readySisters();
  const before = snapshot(), log = journal(), rewards: CampaignReward[] = [];
  const record: CampaignRecord = entry => {
    if (entry.kind === 'campaign-boss-checkpoint') {
      expect(snapshot()).toEqual(before);
      expect(entry).toMatchObject({ boundary: 'before-claim', questId: sisters, act: 1,
        area: 'areas/act1-catacombs', snapshot: before });
      expect(typeof entry.exported).toBe('string');
      assert.ok(typeof entry.exported === 'string');
      expect(decodeSave(JSON.parse(entry.exported) as unknown)).toEqual(before);
    }
    log.record(entry);
  };
  if (adapter === 'legacy') claimCampaignQuest(sisters, record, delta => { rewards.push(delta); });
  else createCampaignQuestActions(record, delta => { rewards.push(delta); }).claim(sisters);
  expect(log.records.filter(entry => entry.kind === 'campaign-boss-checkpoint')).toHaveLength(1);
  expect(log.records[0]?.kind).toBe('campaign-boss-checkpoint');
  expect(snapshot().map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(rewards).toHaveLength(1);
  expect(before.map.questProgress[sisters]?.rewardClaimed).not.toBe(true);
});

it.each(['legacy', 'transaction'] as const)('does not commit a %s boss Claim when checkpoint recording fails', adapter => {
  readySisters();
  const before = snapshot(), rewards: CampaignReward[] = [];
  const record: CampaignRecord = () => { throw new Error('Checkpoint disk full'); };
  expect(() => {
    if (adapter === 'legacy') claimCampaignQuest(sisters, record, delta => { rewards.push(delta); });
    else createCampaignQuestActions(record, delta => { rewards.push(delta); }).claim(sisters);
  }).toThrow('Checkpoint disk full');
  expect(snapshot()).toEqual(before);
  expect(rewards).toEqual([]);
});

it('does not label an incomplete or already claimed quest as a boss checkpoint', () => {
  readySisters();
  const log = journal();
  claimCampaignQuest(sisters, () => undefined, () => undefined);
  const before = snapshot();
  expect(() => { createCampaignQuestActions(log.record, () => undefined).claim(sisters); }).toThrow();
  expect(snapshot()).toEqual(before);
  expect(log.records.some(entry => entry.kind === 'campaign-boss-checkpoint')).toBe(false);
});

it('recovers overflow through native salvage while preserving protected gear and exact earned materials', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Capacity QA', 'sorceress').ok).toBe(true);
  const ordinary = Array.from({ length: 141 }, (_, i) => item(`ordinary-${String(i)}`));
  const protectedItems = [item('rare', undefined, { rarity: 'rare' }),
    item('unique', undefined, { rarity: 'unique', uniqueId: 'items/unique/peasant-crown' }),
    item('socketed', undefined, { socketCapacity: 1, socketContents: [{ kind: 'rune', id: 'runes/el' }] })];
  useInventoryStore.setState({ backpack: [...ordinary, ...protectedItems], materials: { 'materials/scrap': 9 } });
  const before = snapshot(), log = journal(), sinks: CampaignReward[] = [];
  expect(recoverCampaignCapacity(log.record, delta => { sinks.push(delta); })).toBe('ready');
  const after = snapshot();
  expect(after.inventory.backpack).toEqual(protectedItems);
  expect(after.inventory.materials).toEqual({ 'materials/scrap': 150 });
  expect(after.inventory.materialActionOrdinal).toBe(before.inventory.materialActionOrdinal + 1);
  expect(sinks).toHaveLength(1);
  expect(sinks[0]).toMatchObject({ xp: 0, addedItems: [], removedItemIds: ordinary.map(i => i.id),
    materials: { 'materials/scrap': 141 } });
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), sinks))
    .toEqual({ xp: 0, addedItems: 0, removedItems: 141 });
  const sink = sinks[0]; assert.ok(sink);
  const { inventorySink: _sink, ...missingSink } = sink;
  for (const tampered of [missingSink, { ...sink, xp: 1 },
    { ...sink, materials: { 'materials/scrap': 142 } }, { ...sink, removedItemIds: [...sink.removedItemIds, 'rare'] },
    { ...sink, removedItemIds: [...sink.removedItemIds, 'socketed'] }])
    expect(() => auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [tampered])).toThrow();
  const first = ordinary[0]; assert.ok(first);
  expect(() => auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [sink,
    { xp: 0, addedItems: [first], removedItemIds: [], materials: {}, currencies: {} }]))
    .toThrow('Duplicate campaign item settlement');
  for (const key of ['player', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(recoverCampaignCapacity(log.record, delta => { sinks.push(delta); })).toBe('ready');
  expect(snapshot()).toEqual(after); expect(sinks).toHaveLength(1);
});

it('audits a legally unequipped starter at consumption while rejecting missing or tampered custody', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793690000000);
  expect(createCharacter('Starter salvage', 'amazon').ok).toBe(true);
  useInventoryStore.setState({ backpack: Array.from({ length: 99 }, (_row, index) => item(`overflow-${String(index)}`)) });
  const before = snapshot(), starter = before.inventory.equipped.weapon; assert.ok(starter);
  expect(starter.equipped).toBe(true);
  expect(useInventoryStore.getState().unequipItem('weapon').ok).toBe(true);
  const sinks: CampaignReward[] = [];
  expect(recoverCampaignCapacity(() => undefined, delta => { sinks.push(delta); })).toBe('ready');
  const after = snapshot();
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), sinks))
    .toEqual({ xp: 0, addedItems: 0, removedItems: 100 });
  const sink = sinks[0]; assert.ok(sink?.inventorySink?.policy === 'salvage-overflow-normals-v1');
  const custody = sink.inventorySink.consumedItems; assert.ok(custody);
  expect(custody.find(row => row.id === starter.id)?.equipped).toBe(false);
  for (const inventorySink of [
    { policy: sink.inventorySink.policy, ordinal: sink.inventorySink.ordinal },
    { ...sink.inventorySink, consumedItems: custody.map(row => row.id === starter.id ? { ...row, equipped: true } : row) },
    { ...sink.inventorySink, consumedItems: custody.map(row => row.id === starter.id ? { ...row, level: row.level + 1 } : row) },
    { ...sink.inventorySink, consumedItems: custody.slice(1) }
  ]) expect(() => auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [{ ...sink, inventorySink }])).toThrow();
});

it('leaves protected overflow untouched when the stash cannot accommodate it', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Capacity QA', 'sorceress').ok).toBe(true);
  useInventoryStore.setState({ backpack: Array.from({ length: 101 }, (_, i) => item(`kept-${String(i)}`, undefined, { rarity: 'rare' })),
    stash: Array.from({ length: 500 }, (_, i) => item(`stash-${String(i)}`)) });
  const before = snapshot(), log = journal();
  expect(recoverCampaignCapacity(log.record, () => { throw new Error('Unexpected sink'); })).toBe('protected-capacity-blocked');
  expect(snapshot()).toEqual(before); expect(log.records).toEqual([]);
});

it('salvages eligible normals while leaving blocked protected overflow and stash intact', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Capacity QA', 'sorceress').ok).toBe(true);
  const kept = Array.from({ length: 101 }, (_, i) => item(`kept-${String(i)}`, undefined, { rarity: 'rare' }));
  const ordinary = Array.from({ length: 141 }, (_, i) => item(`ordinary-${String(i)}`));
  const stash = Array.from({ length: 500 }, (_, i) => item(`stash-${String(i)}`));
  useInventoryStore.setState({ backpack: [...kept, ...ordinary], stash, materials: { 'materials/scrap': 9 } });
  const before = snapshot(), log = journal(), sinks: CampaignReward[] = [];
  expect(recoverCampaignCapacity(log.record, delta => { sinks.push(delta); })).toBe('protected-capacity-blocked');
  const after = snapshot();
  expect(after.inventory.backpack).toEqual(kept); expect(after.inventory.stash).toEqual(stash);
  expect(after.inventory.materials).toEqual({ 'materials/scrap': 150 });
  expect(sinks).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), sinks))
    .toEqual({ xp: 0, addedItems: 0, removedItems: 141 });
  for (const key of ['player', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(recoverCampaignCapacity(log.record, () => { throw new Error('Repeated sink'); })).toBe('protected-capacity-blocked');
  expect(snapshot()).toEqual(after);
});

it('retains the actual material sink before a diagnostic recorder throws', () => {
  expect(createCharacter('Capacity QA', 'sorceress').ok).toBe(true);
  useInventoryStore.setState({ backpack: Array.from({ length: 101 }, (_, i) => item(`ordinary-${String(i)}`)) });
  const sinks: unknown[] = [];
  expect(() => recoverCampaignCapacity(() => { throw new Error('Journal unavailable'); }, delta => { sinks.push(delta); }))
    .toThrow('Journal unavailable');
  expect(sinks).toHaveLength(1);
  expect(useInventoryStore.getState().backpack).toEqual([]);
  expect(useInventoryStore.getState().materials['materials/scrap']).toBe(101);
});
function conserved(before: ReturnType<typeof snapshot>) {
  const after = snapshot();
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  const { derivedStats: _beforeStats, equipment: _beforeMirror, ...beforePlayer } = before.player;
  const { derivedStats: _afterStats, equipment: _afterMirror, ...afterPlayer } = after.player;
  expect(afterPlayer).toEqual(beforePlayer);
  for (const key of ['map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  for (const key of ['stash', 'questItems', 'questServices', 'materials', 'currencies',
    'legacyGearQuarantine', 'socketQuarantine', 'materialActionOrdinal', 'latestMaterialAction'] as const)
    expect(after.inventory[key]).toEqual(before.inventory[key]);
}

it.each(['sorceress', 'amazon'] as const)('equips owned empty-slot upgrades for a native fresh %s', cls => {
  expect(createCharacter('Gear regression', cls).ok).toBe(true);
  const starter = structuredClone(useInventoryStore.getState().equipped);
  if (cls === 'sorceress') expect(starter).toEqual({});
  else {
    expect(Object.keys(starter).sort()).toEqual(['offhand', 'weapon']);
    expect(starter.weapon).toMatchObject({ baseId: 'items/base/weapon-bow-training', equipped: true });
    expect(starter.offhand).toBeNull();
  }
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight');
  assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  startCampaignQuest('quests/act1-den-of-evil', () => undefined);
  // Disclosed constructed service history makes charge preservation nonvacuous.
  const siege = ACT5_ENCOUNTERS.find(row => row.questId === 'quests/act5-siege-on-harrogath');
  assert.ok(siege);
  useMapStore.getState().updateQuestProgress(siege.questId, { status: 'completed',
    rewardClaimed: true, objectives: { [siege.objectiveId]: true } });
  useMapStore.setState({ questReceipts: { [siege.proof]: true } });
  useInventoryStore.setState({ questServices: {
    [`${siege.questId}#reward:service`]: { serviceId: 'socket_item', state: 'available' }
  } });
  useInventoryStore.getState().addItem(item('retained-stash'), true);
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  const cap = item('cap'), armor = item('armor', 'items/base/armor-quilted');
  const charm = item('ormus', 'items/base/small-charm', { rarity: 'unique',
    uniqueId: 'items/unique/ormus-charm', level: 32, ilvl: 32 });
  for (const owned of [cap, armor, charm]) useInventoryStore.getState().addItem(owned);
  const before = snapshot(), log = journal();
  equipCampaignGear(log.record, campaignProfiles['sorceress-cold']);
  const after = useInventoryStore.getState();
  expect(after.equipped.head?.id).toBe('cap');
  expect(after.equipped.chest?.id).toBe('armor');
  expect(after.equipped.charm?.id).toBe('ormus');
  expect(after.equipped.weapon).toEqual(starter.weapon);
  expect(after.backpack).toEqual([]);
  const stats = usePlayerStore.getState().player?.derivedStats;
  expect(stats).toEqual({ ...before.player.derivedStats,
    defense: before.player.derivedStats.defense + 17,
    lifeMax: before.player.derivedStats.lifeMax + 20, manaMax: before.player.derivedStats.manaMax + 10 });
  expect(log.records.filter(row => row.kind === 'gear-decision').map(row => row.slot)).toEqual(expectedSlots);
  expect(log.records.filter(row => row.kind === 'equip').map(row => [row.slot, row.result]))
    .toEqual([['charm', { ok: true }], ['chest', { ok: true }], ['head', { ok: true }]]);
  conserved(before);
});

it('respects level requirements, deterministic equal-item ties, no-ops and actual replacement', () => {
  expect(createCharacter('Gear regression', 'sorceress').ok).toBe(true);
  const refused = item('high-level', 'items/base/helm-war-hat');
  for (const owned of [refused, item('cap-z'), item('cap-a')]) useInventoryStore.getState().addItem(owned);
  const before = snapshot(), log = journal();
  equipCampaignGear(log.record, campaignProfiles['sorceress-cold']);
  expect(useInventoryStore.getState().equipped.head?.id).toBe('cap-a');
  const decision = log.records.find(row => row.kind === 'gear-decision' && row.slot === 'head');
  expect(decision).toMatchObject({ selected: 'cap-a', candidates: [
    { item: refused, eligibility: { eligible: false, reasons: [{ kind: 'level', required: 22, current: 1 }] },
      comparison: null, upgrade: false },
    { item: { id: 'cap-z' }, eligibility: { eligible: true }, upgrade: true },
    { item: { id: 'cap-a' }, eligibility: { eligible: true }, upgrade: true }
  ] });
  conserved(before);
  const unchanged = snapshot(), repeat = journal();
  equipCampaignGear(repeat.record, campaignProfiles['sorceress-cold']);
  expect(repeat.records.filter(row => row.kind === 'equip')).toEqual([]);
  conserved(unchanged);
  expect(snapshot().inventory).toEqual(unchanged.inventory);
  const better = item('better-cap', 'items/base/helm-cap', { baseRolls: { defense: 8 } });
  useInventoryStore.getState().addItem(better);
  const replacementBefore = snapshot(), replacement = journal();
  equipCampaignGear(replacement.record, campaignProfiles['sorceress-cold']);
  expect(useInventoryStore.getState().equipped.head?.id).toBe('better-cap');
  expect(usePlayerStore.getState().player?.derivedStats).toEqual({ ...replacementBefore.player.derivedStats,
    defense: replacementBefore.player.derivedStats.defense + 1 });
  expect(useInventoryStore.getState().backpack.filter(owned => owned.id === 'cap-a'))
    .toEqual([{ ...item('cap-a'), equipped: false }]);
  expect(replacement.records.filter(row => row.kind === 'equip').map(row => row.result)).toEqual([{ ok: true }]);
  conserved(replacementBefore);
});

it('continues after a real full-backpack refusal and preserves all stores when every upgrade is blocked', () => {
  expect(createCharacter('Gear regression', 'sorceress').ok).toBe(true);
  const sword = item('old-sword', 'items/base/wp1h-short-sword');
  const shield = item('old-shield', 'items/base/sh-buckler');
  for (const owned of [sword, shield]) {
    useInventoryStore.getState().addItem(owned);
    expect(useInventoryStore.getState().equipItem(owned)).toEqual({ ok: true });
  }
  // The explicitly constructed legacy defense roll offsets the displaced Buckler.
  const better = item('two-handed', 'items/base/wp2h-two-handed-sword', {
    rarity: 'magic', affixes: [{ affixId: 'diagnostic-defense', values: new Map([['statMods.defense', 6]]) }]
  });
  useInventoryStore.getState().addItem(better);
  for (let index = 0; index < 99; index++)
    useInventoryStore.getState().addItem(item(`ineligible-${String(index)}`, 'items/base/helm-war-hat'));
  expect(useInventoryStore.getState().backpack).toHaveLength(100);
  const before = snapshot(), inventoryBefore = useInventoryStore.getState();
  const playerBefore = usePlayerStore.getState(), log = journal();
  expect(() => { equipCampaignGear(log.record, campaignProfiles['sorceress-cold']); }).not.toThrow();
  expect(log.records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: 'two-handed', candidates: [{ upgrade: true }] });
  expect(log.records.at(-1)).toMatchObject({ kind: 'equip', slot: 'weapon',
    result: { ok: false, reason: 'backpack_full' } });
  expect(useInventoryStore.getState()).toBe(inventoryBefore);
  expect(usePlayerStore.getState()).toBe(playerBefore);
  conserved(before);
  expect(snapshot().player).toEqual(before.player);
  expect(snapshot().inventory).toEqual(before.inventory);
});


it('tries blocked upgrades by score and ID, then equips the first feasible lower-ranked upgrade', () => {
  expect(createCharacter('Gear regression', 'sorceress').ok).toBe(true);
  for (const owned of [item('old-sword', 'items/base/wp1h-short-sword'),
    item('old-shield', 'items/base/sh-buckler')]) {
    useInventoryStore.getState().addItem(owned);
    expect(useInventoryStore.getState().equipItem(owned)).toEqual({ ok: true });
  }
  for (const id of ['blocked-z', 'blocked-a']) useInventoryStore.getState().addItem(
    item(id, 'items/base/wp2h-two-handed-sword', { rarity: 'magic',
      affixes: [{ affixId: 'diagnostic-defense', values: new Map([['statMods.defense', 6]]) }] }));
  for (const id of ['feasible-z', 'feasible-a']) useInventoryStore.getState().addItem(
    item(id, 'items/base/wp1h-short-sword', { baseRolls: { attack: 9 } }));
  for (let index = 0; index < 96; index++) useInventoryStore.getState().addItem(
    item(`ineligible-${String(index)}`, 'items/base/helm-war-hat'));
  const before = snapshot(), log = journal();
  expect(before.inventory.backpack).toHaveLength(100);
  equipCampaignGear(log.record, campaignProfiles['sorceress-cold']);
  expect(log.records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: 'blocked-a', candidates: [
      { item: { id: 'blocked-z' }, score: 10, upgrade: true },
      { item: { id: 'blocked-a' }, score: 10, upgrade: true },
      { item: { id: 'feasible-z' }, score: 1, upgrade: true },
      { item: { id: 'feasible-a' }, score: 1, upgrade: true }
    ] });
  expect(log.records.filter(row => row.kind === 'equip').map(row => [row.item, row.result]))
    .toEqual([
      [expect.objectContaining({ id: 'blocked-a' }), { ok: false, reason: 'backpack_full' }],
      [expect.objectContaining({ id: 'blocked-z' }), { ok: false, reason: 'backpack_full' }],
      [expect.objectContaining({ id: 'feasible-a' }), { ok: true }]
    ]);
  const after = snapshot();
  expect(after.inventory.equipped.weapon?.id).toBe('feasible-a');
  expect(after.inventory.equipped.offhand).toEqual(before.inventory.equipped.offhand);
  expect(after.inventory.backpack).toEqual([
    ...before.inventory.backpack.filter(owned => owned.id !== 'feasible-a'),
    { ...before.inventory.equipped.weapon, equipped: false }
  ]);
  expect(after.player.derivedStats).toEqual({ ...before.player.derivedStats,
    attack: before.player.derivedStats.attack + 1 });
  conserved(before);
});

it.each([false, true])('allows a native overflow equip with existing target = %s', occupied => {
  expect(createCharacter('Gear regression', 'sorceress').ok).toBe(true);
  if (occupied) {
    const old = item('old-cap');
    useInventoryStore.getState().addItem(old);
    expect(useInventoryStore.getState().equipItem(old)).toEqual({ ok: true });
  }
  const cap = item('upgrade-cap', 'items/base/helm-cap', { baseRolls: { defense: 8 } });
  useInventoryStore.getState().addItem(cap);
  for (let index = 0; index < 100; index++) useInventoryStore.getState().addItem(
    item(`ineligible-${String(index)}`, 'items/base/helm-war-hat'));
  const before = snapshot(), log = journal();
  expect(before.inventory.backpack).toHaveLength(101);
  equipCampaignGear(log.record, campaignProfiles['sorceress-cold']);
  expect(useInventoryStore.getState().equipped.head?.id).toBe(cap.id);
  expect(useInventoryStore.getState().backpack).toHaveLength(occupied ? 101 : 100);
  expect(log.records.filter(row => row.kind === 'equip').map(row => row.result)).toEqual([{ ok: true }]);
  conserved(before);
});

it('retains and fails on a real unexpected no_slot refusal without changing earned state', () => {
  expect(createCharacter('Gear regression', 'sorceress').ok).toBe(true);
  const charm = item('duplicate-charm', 'items/base/small-charm', { rarity: 'unique',
    uniqueId: 'items/unique/ormus-charm', level: 32, ilvl: 32 });
  // Deliberately corrupt ownership: native equip must reject before publication.
  useInventoryStore.setState({ backpack: [charm], stash: [structuredClone(charm)] });
  const before = observeEarnedState(), inventoryBefore = useInventoryStore.getState();
  const playerBefore = usePlayerStore.getState(), log = journal();
  expect(() => { equipCampaignGear(log.record, campaignProfiles['sorceress-cold']); }).toThrow(AssertionError);
  expect(log.records.at(-1)).toMatchObject({ kind: 'equip', slot: 'charm',
    result: { ok: false, reason: 'no_slot' } });
  expect(observeEarnedState()).toEqual(before);
  expect(useInventoryStore.getState()).toBe(inventoryBefore);
  expect(usePlayerStore.getState()).toBe(playerBefore);
});


it('avoids whole-store observations when every owned candidate is ineligible while retaining detached decision records', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Gear pressure', 'sorceress').ok).toBe(true);
  const blocked = item('ineligible-owned-cap', 'items/base/helm-war-hat');
  useInventoryStore.getState().addItem(blocked);
  const before = snapshot(), log = journal(), observe = vi.spyOn(earnedState, 'observeEarnedState');
  equipCampaignGear(log.record, campaignProfiles['sorceress-cold']);
  expect(observe).not.toHaveBeenCalled(); observe.mockRestore();
  expect(snapshot()).toEqual(before);
  expect(log.records.filter(row => row.kind === 'gear-decision').map(row => row.slot)).toEqual(expectedSlots);
  const decision = log.records.find(row => row.kind === 'gear-decision' && row.slot === 'head');
  const candidates = decision?.candidates as { item: Item; upgrade: boolean }[];
  expect(candidates).toHaveLength(1); expect(candidates[0]?.upgrade).toBe(false);
  expect(candidates[0]?.item).toEqual(blocked); expect(candidates[0]?.item).not.toBe(blocked);
});

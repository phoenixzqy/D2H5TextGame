/** Constructed owned items isolate native merc gear transfer; no earned combat evidence. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import type { Item } from '@/engine/types/items';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignEconomy, auditCampaignEconomy } from './economy';
import { equipCampaignMercGear } from './merc-gear';

let restores: (() => void)[], mercId: string;
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Merc gear QA', 'sorceress').ok).toBe(true);
  const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight'); assert.ok(definition);
  const result = useMercStore.getState().hireMerc(definition); assert.ok(result.ok && result.mercId); mercId = result.mercId;
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const item = (id: string, extra: Partial<Item> = {}): Item => ({ id,
  baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, ilvl: 1,
  identified: true, equipped: false, socketCapacity: 0, ...extra });

function run(includeStash = false, weaponPolicy?: 'physical-offense-v1', reservedItemId?: string) {
  const before = snapshotStores(); assert.ok(before);
  const rawMercs = useMercStore.getState().ownedMercs;
  const rows: Readonly<Record<string, unknown>>[] = [];
  equipCampaignMercGear(row => { rows.push(row); }, includeStash, reservedItemId, weaponPolicy);
  const after = snapshotStores(); assert.ok(after);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  for (const key of ['player', 'map', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(useMercStore.getState().ownedMercs).toEqual(rawMercs);
  for (const merc of after.mercs.ownedMercs)
    expect(merc.equipment).toEqual(Object.values(after.mercs.mercEquipment[merc.id] ?? {}).filter(owned => owned != null));
  return { rows, before, after };
}

it('equips an owned eligible upgrade by deterministic ID while preserving all item payloads', () => {
  useInventoryStore.getState().addItem(item('cap-z')); useInventoryStore.getState().addItem(item('cap-a'));
  const { rows, after } = run();
  expect(after.mercs.mercEquipment[mercId]?.head).toEqual({ ...item('cap-a'), equipped: true, equipSlot: 'head' });
  expect(after.inventory.backpack).toEqual([item('cap-z')]);
  expect(rows.find(row => row.kind === 'merc-gear-decision' && row.slot === 'head'))
    .toMatchObject({ selected: 'cap-a' });
  expect(rows.filter(row => row.kind === 'merc-equip')).toHaveLength(1);
  const merc = useMercStore.getState().ownedMercs.find(row => row.id === mercId); assert.ok(merc);
  const first = deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(mercId));
  expect(first.defense).toBeGreaterThan(merc.derivedStats.defense);
  const unchanged = observeEarnedState(); equipCampaignMercGear(() => undefined);
  expect(observeEarnedState()).toEqual(unchanged);
});

it('retains native requirement gates and keeps unowned or incompatible sources out of selection', () => {
  useInventoryStore.getState().addItem(item('locked', { baseId: 'items/base/helm-armet', level: 90, ilvl: 90 }));
  useInventoryStore.setState({ stash: [item('stash-only')] });
  const { rows, before, after } = run();
  expect(after).toEqual(before);
  expect(rows.find(row => row.kind === 'merc-gear-decision' && row.slot === 'head'))
    .toMatchObject({ selected: null, candidates: [{ item: { id: 'locked' }, eligible: false, upgrade: false }] });
});

it('retrieves an explicitly selected owned stash upgrade through the native transfer', () => {
  useInventoryStore.setState({ stash: [item('stash-upgrade')] });
  const { rows, after } = run(true);
  expect(after.mercs.mercEquipment[mercId]?.head?.id).toBe('stash-upgrade');
  expect(after.inventory.stash).toEqual([]);
  expect(rows.some(row => row.kind === 'campaign-gear-retrieve')).toBe(true);
});

it('retains selected stash gear when the native backpack is full', () => {
  useInventoryStore.setState({ stash: [item('stash-upgrade')], backpack: Array.from({ length: 100 },
    (_row, index) => item(`locked-${String(index)}`, { baseId: 'items/base/helm-armet', level: 90, ilvl: 90 })) });
  const { rows, before, after } = run(true);
  expect(after).toEqual(before);
  expect(rows.find(row => row.kind === 'campaign-gear-retrieve'))
    .toMatchObject({ itemId: 'stash-upgrade', result: { ok: false, reason: 'backpack_full' } });
});

it('does not offer an owned one-handed weapon in the native merc offhand slot', () => {
  const katar = item('owned-katar', { baseId: 'items/base/wp1h-katar', baseRolls: { attack: 7 } });
  useInventoryStore.getState().addItem(katar);
  const { rows, after } = run();
  expect(rows.find(row => row.kind === 'merc-gear-decision' && row.slot === 'offhand'))
    .toMatchObject({ candidates: [], selected: null });
  expect(after.mercs.mercEquipment[mercId]?.offhand ?? null).toBeNull();
  for (const row of rows.filter(row => row.kind === 'merc-equip')) expect(row.result).toMatchObject({ ok: true });
});

it('rejects a candidate that gains defense by losing Life even if its summed score is positive', () => {
  const old = item('old-life', { rarity: 'magic', affixes: [{ affixId: 'constructed-life',
    values: new Map([['statMods.life', 5]]) }] });
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'head', old)).toEqual({ ok: true });
  const candidate = item('defense-tradeoff', { rarity: 'magic', affixes: [{ affixId: 'constructed-defense',
    values: new Map([['statMods.defense', 100]]) }] });
  useInventoryStore.getState().addItem(candidate);
  const { rows, before, after } = run(); expect(after).toEqual(before);
  expect(rows.find(row => row.kind === 'merc-gear-decision' && row.slot === 'head'))
    .toMatchObject({ selected: null, candidates: [{ item: { id: 'defense-tradeoff' }, eligible: true, upgrade: false }] });
});

it('returns displaced canonical gear once and conserves the signed projection exactly', () => {
  const old = item('old'); useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'head', old).ok).toBe(true);
  const replacement = item('better', { rarity: 'magic', affixes: [{ affixId: 'constructed-defense',
    values: new Map([['statMods.defense', 10]]) }] });
  useInventoryStore.getState().addItem(replacement);
  const { after } = run();
  expect(after.inventory.backpack).toEqual([old]);
  expect(after.mercs.mercEquipment[mercId]?.head).toEqual({ ...replacement, equipped: true, equipSlot: 'head' });
});

it('retains a committed transfer when its diagnostic recorder throws', () => {
  const source = item('committed'); useInventoryStore.getState().addItem(source);
  expect(() => { equipCampaignMercGear(row => {
    if (row.kind === 'merc-equip') throw new Error('Recorder failure after transfer');
  }); }).toThrow('Recorder failure after transfer');
  expect(useInventoryStore.getState().backpack).toEqual([]);
  expect(useMercStore.getState().getMercEquipment(mercId).head).toEqual({ ...source, equipped: true, equipSlot: 'head' });
});

it('rejects a missing fielded mercenary before changing ownership', () => {
  useInventoryStore.getState().addItem(item('retained'));
  useMercStore.setState({ fieldedMercId: null }); const before = observeEarnedState();
  expect(() => { equipCampaignMercGear(() => undefined); }).toThrow('Campaign fielded merc missing');
  expect(observeEarnedState()).toEqual(before);
});

const weapon = (id: string, attack: number, mods: readonly (readonly [string, number])[] = []) =>
  item(id, { baseId: 'items/base/wp1h-katar', rarity: 'magic', baseRolls: { attack },
    affixes: [{ affixId: 'constructed-weapon', values: new Map(mods) }] });

it('opts into a stronger weapon despite defense/resource losses, with deterministic ties and conserved custody', () => {
  const old = weapon('old-defense', 7, [['statMods.life', 20], ['statMods.magicResist', 8], ['statMods.attackSpeed', 5]]);
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'weapon', old).ok).toBe(true);
  const z = weapon('offense-z', 100), a = weapon('offense-a', 100);
  useInventoryStore.getState().addItem(z); useInventoryStore.getState().addItem(a);
  const { rows, before, after } = run(false, 'physical-offense-v1');
  expect(after.mercs.mercEquipment[mercId]?.weapon?.id).toBe(a.id);
  expect(after.inventory.backpack).toEqual([z, old]);
  expect(after.mercs.ownedMercs.map(row => ({ ...row, equipment: [] })))
    .toEqual(before.mercs.ownedMercs.map(row => ({ ...row, equipment: [] })));
  expect(rows.find(row => row.kind === 'merc-gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ weaponPolicy: 'physical-offense-v1', selected: a.id });
  const unchanged = observeEarnedState(); equipCampaignMercGear(() => undefined, false, undefined, 'physical-offense-v1');
  expect(observeEarnedState()).toEqual(unchanged);
});

it('keeps the historical monotone weapon decision when offense is not enabled', () => {
  const old = weapon('old-life-weapon', 7, [['statMods.life', 20]]);
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'weapon', old).ok).toBe(true);
  useInventoryStore.getState().addItem(weapon('offensive-tradeoff', 100));
  const { before, after } = run(); expect(after).toEqual(before);
});

it('limits the offense exception to weapons and retains monotone armor selection', () => {
  const old = item('old-armor-life', { rarity: 'magic', affixes: [{ affixId: 'constructed-life', values: new Map([['statMods.life', 20]]) }] });
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'head', old).ok).toBe(true);
  useInventoryStore.getState().addItem(item('armor-tradeoff', { rarity: 'magic',
    affixes: [{ affixId: 'constructed-defense', values: new Map([['statMods.defense', 200]]) }] }));
  const { before, after } = run(false, 'physical-offense-v1'); expect(after).toEqual(before);
});

it('uses speed and critical damage rather than attack alone when choosing a weapon', () => {
  const slow = weapon('slow-high-attack', 100);
  const fast = weapon('fast-critical', 75, [['statMods.attackSpeed', 100], ['statMods.critChance', .5], ['statMods.critDamage', 1]]);
  useInventoryStore.getState().addItem(slow); useInventoryStore.getState().addItem(fast);
  const { after } = run(false, 'physical-offense-v1');
  expect(after.mercs.mercEquipment[mercId]?.weapon?.id).toBe(fast.id);
});

it('values native critical overflow when it reverses the capped-critical weapon ranking', () => {
  useInventoryStore.getState().addItem(weapon('overflow', 80, [['statMods.critChance', 3]]));
  useInventoryStore.getState().addItem(weapon('capped-higher-attack', 100, [['statMods.critChance', 1]]));
  const { after } = run(false, 'physical-offense-v1');
  expect(after.mercs.mercEquipment[mercId]?.weapon?.id).toBe('overflow');
});

it('projects earned mercenary stars without persisting natural stats or filling resources', () => {
  useMercStore.setState({ recruitmentProgress: { [mercId]: { stars: 2, shards: 0 } } });
  const candidate = weapon('starred-offense', 100);
  useInventoryStore.getState().addItem(candidate);
  const { rows, after } = run(false, 'physical-offense-v1');
  const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
  expect(after.mercs.mercEquipment[mercId]?.weapon?.id).toBe(candidate.id);
  expect(rows.find(row => row.kind === 'merc-equip'))
    .toMatchObject({ after: deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(mercId), 2) });
  expect(deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(mercId), 2).attack)
    .toBeGreaterThan(deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(mercId)).attack);
});

it('requires strict offense improvement even when a weaker weapon gains substantial defense', () => {
  const old = weapon('current-offense', 100);
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(mercId, 'weapon', old).ok).toBe(true);
  useInventoryStore.getState().addItem(weapon('equal', 100));
  useInventoryStore.getState().addItem(weapon('weaker-defense', 10, [['statMods.defense', 1000]]));
  const { before, after } = run(false, 'physical-offense-v1'); expect(after).toEqual(before);
});

it('excludes reserved, level-locked and out-of-scope stash weapons from offense selection', () => {
  const reserved = weapon('reserved-weapon', 1000), allowed = weapon('allowed-weapon', 30);
  useInventoryStore.getState().addItem(reserved); useInventoryStore.getState().addItem(allowed);
  useInventoryStore.getState().addItem({ ...weapon('locked-weapon', 2000), baseId: 'items/base/weapon-polearm' });
  useInventoryStore.setState({ stash: [weapon('stash-weapon', 3000)] });
  const { after } = run(false, 'physical-offense-v1', reserved.id);
  expect(after.mercs.mercEquipment[mercId]?.weapon?.id).toBe(allowed.id);
  expect(after.inventory.backpack.map(row => row.id)).toEqual([reserved.id, 'locked-weapon']);
  expect(after.inventory.stash.map(row => row.id)).toEqual(['stash-weapon']);
});

it('honors native full-backpack refusal for an explicitly included offensive stash weapon', () => {
  useInventoryStore.setState({ stash: [weapon('stash-offense', 100)], backpack: Array.from({ length: 100 },
    (_row, index) => item(`locked-full-${String(index)}`, { baseId: 'items/base/helm-armet', level: 90, ilvl: 90 })) });
  const { rows, before, after } = run(true, 'physical-offense-v1');
  expect(after).toEqual(before);
  expect(rows.find(row => row.kind === 'campaign-gear-retrieve'))
    .toMatchObject({ itemId: 'stash-offense', result: { ok: false, reason: 'backpack_full' } });
});

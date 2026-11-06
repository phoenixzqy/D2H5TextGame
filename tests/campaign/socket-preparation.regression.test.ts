/** Constructed native transactions; not fresh-campaign viability. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Item } from '@/engine/types/items';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { hireCampaignPrayer } from './caster-preparation';
import { auditCampaignEconomy, campaignEconomy, type CampaignReward } from './economy';
import { prepareNovaTombSockets, prepareJavelinArcaneSockets, prepareJavelinPhysicalShieldSockets,
  prepareIntendedActTwoSockets, prepareIntendedMercWeaponSockets, prepareIntendedHeroWeaponSockets } from './socket-preparation';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { campaignProfiles } from './profiles';
import type { CampaignProfile } from './policy';

let restores: (() => void)[];
const save = () => { const s = snapshotStores(); assert.ok(s); return s; };
const item = (id: string, baseId = 'items/base/helm-cap', socketCapacity = 1): Item => ({
  id, baseId, socketCapacity, rarity: 'normal', level: 1, ilvl: 1, identified: true, equipped: false });
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Socket QA', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(26));
  useMapStore.getState().markCleared('areas/act1-catacombs'); hireCampaignPrayer(() => undefined);
  for (const source of [item('hero-head'), item('merc-head'), item('merc-shield', 'items/base/sh-kite', 2)])
    useInventoryStore.getState().addItem(source);
  expect(useInventoryStore.getState().equipItem(bagItem('hero-head'), 'head').ok).toBe(true);
  expect(useMercStore.getState().equipOnMerc('mercs/act2-prayer', 'head', bagItem('merc-head')).ok).toBe(true);
  expect(useMercStore.getState().equipOnMerc('mercs/act2-prayer', 'offhand', bagItem('merc-shield')).ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/normal': 1, 'gems/diamond/chipped': 2, 'gems/topaz/flawed': 2 } });
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function bagItem(id: string): Item {
  const found = useInventoryStore.getState().backpack.find(row => row.id === id); assert.ok(found); return found;
}

it('prepares owned sockets for the actual Javelin companion, preserving unfielded Prayer gear and once-only costs', () => {
  const rogue = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(rogue);
  const hire = useMercStore.getState().hireMerc(rogue); assert.ok(hire.ok && hire.mercId);
  useInventoryStore.getState().addItem(item('rogue-head'));
  expect(useMercStore.getState().equipOnMerc(hire.mercId, 'head', bagItem('rogue-head')).ok).toBe(true);
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareJavelinArcaneSockets(() => undefined, delta => { deltas.push(delta); }).insertions).toBe(2);
  const after = save();
  expect(after.mercs.mercEquipment['mercs/act2-prayer']).toEqual(before.mercs.mercEquipment['mercs/act2-prayer']);
  expect(after.mercs.mercEquipment[hire.mercId]?.head?.socketContents)
    .toEqual([{ kind: 'gem', id: 'gems/diamond/chipped' }]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 2 });
  expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
  expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
  expect(prepareJavelinArcaneSockets(() => undefined, delta => { deltas.push(delta); }).insertions).toBe(0);
  expect(save()).toEqual(after);
});

it('uses owned Diamonds and shield Topazes through native transfers and conserves exact payloads/costs', () => {
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareNovaTombSockets(() => undefined, d => { deltas.push(d); }).insertions).toBe(4);
  const after = save();
  expect(after.inventory.equipped.head?.socketContents).toEqual([{ kind: 'gem', id: 'gems/diamond/normal' }]);
  expect(after.mercs.mercEquipment['mercs/act2-prayer']?.head?.socketContents).toEqual([{ kind: 'gem', id: 'gems/diamond/chipped' }]);
  expect(after.mercs.mercEquipment['mercs/act2-prayer']?.offhand?.socketContents).toEqual([
    { kind: 'gem', id: 'gems/topaz/flawed' }, { kind: 'gem', id: 'gems/topaz/flawed' }]);
  expect(after.player.derivedStats.magicResist).toBe(before.player.derivedStats.magicResist + 6);
  expect(after.player.statPoints).toBe(before.player.statPoints); expect(after.player.skillPoints).toBe(before.player.skillPoints);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 4 });
});

it('does not supply gems when only one owned unit is available', () => {
  useInventoryStore.setState({ materials: { 'gems/diamond/normal': 1 } });
  const deltas: CampaignReward[] = [];
  expect(prepareNovaTombSockets(() => undefined, d => { deltas.push(d); }).insertions).toBe(1);
  expect(deltas).toHaveLength(1); expect(useInventoryStore.getState().materials['gems/diamond/normal'] ?? 0).toBe(0);
});

it('preserves the complete realm on native full-backpack refusals', () => {
  useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, i) => item(`full-${String(i)}`)) });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareNovaTombSockets(() => undefined, d => { deltas.push(d); }).refused).toBe(3);
  expect(save()).toEqual(before); expect(deltas).toEqual([]);
});

it('restores equipped gear and retains committed gem conservation when the diagnostic recorder fails', () => {
  const before = save(), deltas: CampaignReward[] = [];
  expect(() => prepareNovaTombSockets(row => {
    if (row.kind === 'campaign-socket-insertion') throw new Error('Recorder failure');
  }, d => { deltas.push(d); })).toThrow('Recorder failure');
  const after = save(); expect(after.inventory.equipped.head?.id).toBe('hero-head');
  expect(deltas).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ socketInsertions: 1 });
});

it('refuses an active combat before transferring any owned gear', () => {
  useCombatStore.setState({ inCombat: true }); const before = save();
  expect(() => prepareNovaTombSockets(() => undefined, () => undefined)).toThrow();
  expect(save()).toEqual(before);
});

it('preserves previously inserted contents even when the equipped target has an empty socket', () => {
  expect(useInventoryStore.getState().unequipItem('head').ok).toBe(true);
  const cap = bagItem('hero-head');
  useInventoryStore.setState({ backpack: useInventoryStore.getState().backpack.map(row => row.id === cap.id ?
    { ...row, socketCapacity: 2, socketContents: [{ kind: 'gem', id: 'gems/diamond/chipped' }] } : row) });
  expect(useInventoryStore.getState().equipItem(bagItem(cap.id), 'head').ok).toBe(true);
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareNovaTombSockets(() => undefined, d => { deltas.push(d); }).insertions).toBe(3);
  const after = save();
  expect(after.inventory.equipped.head).toEqual(before.inventory.equipped.head);
  expect(deltas.every(row => row.socketInsertion?.before.id !== cap.id)).toBe(true);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas).socketInsertions).toBe(3);
});

it('uses a weapon Diamond effect for an actual offhand weapon', () => {
  for (const id of ['hero-wand', 'hero-offhand-wand'])
    useInventoryStore.getState().addItem(item(id, 'items/base/weapon-wand', 1));
  expect(useInventoryStore.getState().equipItem(bagItem('hero-wand'), 'weapon').ok).toBe(true);
  expect(useInventoryStore.getState().equipItem(bagItem('hero-offhand-wand'), 'offhand').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/normal': 8, 'gems/topaz/flawed': 2 } });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareNovaTombSockets(() => undefined, d => { deltas.push(d); }).insertions).toBe(6);
  const after = save();
  expect(after.inventory.equipped.offhand?.socketContents).toEqual([{ kind: 'gem', id: 'gems/diamond/normal' }]);
  expect(after.player.derivedStats.magicResist).toBe(before.player.derivedStats.magicResist + 18);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas).socketInsertions).toBe(6);
});


it('spends one owned Diamond only in the hero shield, retaining resources and all other equipped gear', () => {
  const shield = item('physical-hero-shield', 'items/base/sh-buckler');
  useInventoryStore.getState().addItem(shield);
  expect(useInventoryStore.getState().equipItem(bagItem(shield.id), 'offhand').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/flawless': 1 } });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareJavelinPhysicalShieldSockets(() => undefined, row => { deltas.push(row); }))
    .toEqual({ insertions: 1, refused: 0 });
  const after = save();
  expect(after.inventory.equipped.offhand?.socketContents).toEqual([{ kind: 'gem', id: 'gems/diamond/flawless' }]);
  expect(after.player.derivedStats.resistances.physical).toBe(before.player.derivedStats.resistances.physical + 8);
  expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
  expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
  expect(after.inventory.equipped.head).toEqual(before.inventory.equipped.head); expect(after.mercs).toEqual(before.mercs);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 1 });
  expect(prepareJavelinPhysicalShieldSockets(() => undefined, row => { deltas.push(row); }).insertions).toBe(0);
  expect(save()).toEqual(after);
});

it('keeps hero shields excluded from old magical preparation and never treats offhand weapons as shields', () => {
  const shield = item('retained-hero-shield', 'items/base/sh-buckler');
  useInventoryStore.getState().addItem(shield);
  expect(useInventoryStore.getState().equipItem(bagItem(shield.id), 'offhand').ok).toBe(true);
  prepareNovaTombSockets(() => undefined, () => undefined);
  expect(useInventoryStore.getState().equipped.offhand?.socketContents).toBeUndefined();
  const weapon = item('physical-offhand-weapon', 'items/base/weapon-wand');
  useInventoryStore.getState().addItem(weapon);
  expect(useInventoryStore.getState().equipItem(bagItem(weapon.id), 'offhand').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/flawless': 1 } });
  const before = save();
  expect(prepareJavelinPhysicalShieldSockets(() => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

const defensiveProfile: CampaignProfile = { ...campaignProfiles['sorceress-cold'],
  socketPreparationPolicy: 'owned-act2-defense-v1' };

it('prepares both intended shields with owned gems and retains exact native equipment and material costs', () => {
  useInventoryStore.getState().addItem(item('intended-hero-shield', 'items/base/sh-kite', 2));
  expect(useInventoryStore.getState().equipItem(bagItem('intended-hero-shield'), 'offhand').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/flawed': 8, 'gems/topaz/flawed': 2 } });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedActTwoSockets(defensiveProfile, () => undefined, row => { deltas.push(row); }))
    .toEqual({ insertions: 6, refused: 0 });
  const after = save();
  expect(after.inventory.equipped.offhand?.socketContents).toEqual([
    { kind: 'gem', id: 'gems/diamond/flawed' }, { kind: 'gem', id: 'gems/diamond/flawed' }]);
  expect(after.mercs.mercEquipment['mercs/act2-prayer']?.offhand?.socketContents).toEqual([
    { kind: 'gem', id: 'gems/topaz/flawed' }, { kind: 'gem', id: 'gems/topaz/flawed' }]);
  expect(after.player.derivedStats.magicResist).toBe(before.player.derivedStats.magicResist + 4);
  for (const type of ['physical', 'lightning', 'cold', 'fire', 'poison', 'arcane'] as const)
    expect(after.player.derivedStats.resistances[type]).toBe(before.player.derivedStats.resistances[type] + 8);
  expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
  expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
  expect(after.inventory.materials).toEqual({ 'gems/diamond/flawed': 4 });
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 6 });
  expect(prepareIntendedActTwoSockets(defensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(0);
  expect(save()).toEqual(after);
});

it('keeps historical, pre-Act-II and post-Act-II socket custody unchanged', () => {
  let before = save();
  expect(prepareIntendedActTwoSockets(campaignProfiles['sorceress-cold'], () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
  useMapStore.setState({ clearedSubAreas: [] }); before = save();
  expect(prepareIntendedActTwoSockets(defensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
  useMapStore.getState().markCleared('areas/act1-catacombs');
  useMapStore.getState().markCleared('areas/act2-tomb-of-tal-rasha'); before = save();
  expect(prepareIntendedActTwoSockets(defensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('prepares the intended fielded companion without spending on an unfielded Prayer', () => {
  const rogue = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(rogue);
  const hire = useMercStore.getState().hireMerc(rogue); assert.ok(hire.ok && hire.mercId);
  useInventoryStore.getState().addItem(item('intended-rogue-head'));
  expect(useMercStore.getState().equipOnMerc(hire.mercId, 'head', bagItem('intended-rogue-head')).ok).toBe(true);
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedActTwoSockets(defensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(2);
  const after = save();
  expect(after.mercs.mercEquipment['mercs/act2-prayer']).toEqual(before.mercs.mercEquipment['mercs/act2-prayer']);
  expect(after.mercs.mercEquipment[hire.mercId]?.head?.socketContents)
    .toEqual([{ kind: 'gem', id: 'gems/diamond/chipped' }]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas).socketInsertions).toBe(2);
});


const offensiveProfile: CampaignProfile = { ...defensiveProfile,
  mercWeaponSocketPolicy: 'owned-physical-offense-v1' };
function equipOffensiveWeapon() {
  useMercStore.getState().addExperience('mercs/act2-prayer', xpTotal(26));
  useInventoryStore.getState().addItem(item('offense-polearm', 'items/base/weapon-polearm', 3));
  expect(useMercStore.getState().equipOnMerc('mercs/act2-prayer', 'weapon', bagItem('offense-polearm')).ok).toBe(true);
  useInventoryStore.setState({ materials: { 'runes/eld': 4, 'runes/el': 4,
    'gems/diamond/normal': 8, 'gems/amethyst/perfect': 4 } });
}

it('fills intended late-act merc weapons by owned offense score and conserves native costs/resources', () => {
  equipOffensiveWeapon(); useMapStore.getState().markCleared('areas/act2-tomb-of-tal-rasha');
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, row => { deltas.push(row); }))
    .toEqual({ insertions: 3, refused: 0 });
  const after = save(), weapon = after.mercs.mercEquipment['mercs/act2-prayer']?.weapon;
  expect(weapon?.id).toBe('offense-polearm');
  expect(weapon?.socketContents).toEqual(Array.from({ length: 3 }, () => ({ kind: 'rune', id: 'runes/eld' })));
  expect(after.inventory.materials).toEqual({ ...before.inventory.materials, 'runes/eld': 1 });
  expect(after.inventory.equipped).toEqual(before.inventory.equipped);
  expect(after.player).toEqual(before.player);
  // Native save capture mirrors canonical equipment into ownedMercs.
  const intrinsic = (rows: typeof before.mercs.ownedMercs) => rows.map(({ equipment: _equipment, ...rest }) => rest);
  expect(intrinsic(after.mercs.ownedMercs)).toEqual(intrinsic(before.mercs.ownedMercs));
  const merc = before.mercs.ownedMercs.find(row => row.id === 'mercs/act2-prayer'); assert.ok(merc);
  const priorStats = deriveEquippedMercStats(merc, before.mercs.mercEquipment[merc.id] ?? {});
  const nextStats = deriveEquippedMercStats(merc, after.mercs.mercEquipment[merc.id] ?? {});
  expect(nextStats).toEqual({ ...priorStats, attack: priorStats.attack + 225 });
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 3 });
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(0);
  expect(save()).toEqual(after);
});

it('uses only remaining owned offensive inserts and leaves non-improving materials untouched', () => {
  equipOffensiveWeapon(); useInventoryStore.setState({ materials: {
    'runes/eld': 1, 'gems/amethyst/chipped': 1, 'gems/diamond/normal': 8 } });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(2);
  expect(useMercStore.getState().getMercEquipment('mercs/act2-prayer').weapon?.socketContents)
    .toEqual([{ kind: 'rune', id: 'runes/eld' }, { kind: 'gem', id: 'gems/amethyst/chipped' }]);
  expect(useInventoryStore.getState().materials).toEqual({ 'gems/diamond/normal': 8 });
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(save()), deltas).socketInsertions).toBe(2);
});

it('keeps new offensive preparation opt-in and gated before ActII unlock', () => {
  equipOffensiveWeapon(); let before = save();
  expect(prepareIntendedMercWeaponSockets(defensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
  useMapStore.setState({ clearedSubAreas: [] }); before = save();
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('preserves partial offensive sockets and never clears previously owned contents', () => {
  equipOffensiveWeapon(); expect(useMercStore.getState().unequipFromMerc('mercs/act2-prayer', 'weapon').ok).toBe(true);
  useInventoryStore.setState({ backpack: useInventoryStore.getState().backpack.map(row => row.id === 'offense-polearm' ?
    { ...row, socketContents: [{ kind: 'rune' as const, id: 'runes/el' }] } : row) });
  expect(useMercStore.getState().equipOnMerc('mercs/act2-prayer', 'weapon', bagItem('offense-polearm')).ok).toBe(true);
  const before = save();
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('preserves full-bag offensive transfer refusal and rejects busy combat without mutation', () => {
  equipOffensiveWeapon(); useCombatStore.setState({ inCombat: true }); let before = save();
  expect(() => prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, () => undefined)).toThrow();
  expect(save()).toEqual(before); useCombatStore.setState({ inCombat: false });
  useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, i) => item(`offense-full-${String(i)}`)) });
  before = save();
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, () => undefined)).toEqual({ insertions: 0, refused: 1 });
  expect(save()).toEqual(before);
});

it('restores offensive weapon custody and accounts committed costs after recorder failure', () => {
  equipOffensiveWeapon(); const before = save(), deltas: CampaignReward[] = [];
  expect(() => prepareIntendedMercWeaponSockets(offensiveProfile, row => {
    if (row.kind === 'campaign-socket-insertion') throw new Error('Offense recorder failure');
  }, row => { deltas.push(row); })).toThrow('Offense recorder failure');
  expect(useMercStore.getState().getMercEquipment('mercs/act2-prayer').weapon?.id).toBe('offense-polearm');
  expect(deltas).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(save()), deltas).socketInsertions).toBe(1);
});

it('spends offensive materials only on the actually fielded companion weapon', () => {
  equipOffensiveWeapon(); const rogue = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(rogue);
  const hired = useMercStore.getState().hireMerc(rogue); assert.ok(hired.ok && hired.mercId);
  useMercStore.getState().addExperience(hired.mercId, xpTotal(26));
  useInventoryStore.getState().addItem(item('offense-bow', 'items/base/weapon-bow', 1));
  expect(useMercStore.getState().equipOnMerc(hired.mercId, 'weapon', bagItem('offense-bow')).ok).toBe(true);
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedMercWeaponSockets(offensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(1);
  const after = save();
  expect(after.mercs.mercEquipment['mercs/act2-prayer']).toEqual(before.mercs.mercEquipment['mercs/act2-prayer']);
  expect(after.mercs.mercEquipment[hired.mercId]?.weapon?.socketContents).toEqual([{ kind: 'rune', id: 'runes/eld' }]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas).socketInsertions).toBe(1);
});

const heroOffensiveProfile: CampaignProfile = { ...offensiveProfile,
  heroWeaponPolicy: { kind: 'physical-offense-v1', level: 24 } };
function equipHeroOffensiveWeapon(extra: Partial<Item> = {}) {
  const weapon = { ...item('hero-offense-weapon', 'items/base/weapon-polearm', 3), ...extra };
  useInventoryStore.getState().addItem(weapon);
  expect(useInventoryStore.getState().equipItem(bagItem(weapon.id), 'weapon').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'runes/eld': 4, 'runes/el': 4, 'gems/diamond/normal': 8 } });
}

it('fills an opted-in hero weapon without a companion, paying exact native costs without healing', () => {
  equipHeroOffensiveWeapon(); useMercStore.setState({ ownedMercs: [], fieldedMercId: null });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, row => { deltas.push(row); }))
    .toEqual({ insertions: 3, refused: 0 });
  const after = save();
  expect(after.inventory.equipped.weapon).toEqual({ ...before.inventory.equipped.weapon,
    socketContents: Array.from({ length: 3 }, () => ({ kind: 'rune', id: 'runes/eld' })) });
  expect(after.inventory.materials).toEqual({ ...before.inventory.materials, 'runes/eld': 1 });
  expect(after.player.derivedStats).toEqual({ ...before.player.derivedStats, attack: before.player.derivedStats.attack + 225 });
  expect(after.player).toEqual({ ...before.player, derivedStats: after.player.derivedStats, equipment: after.player.equipment });
  expect(after.inventory).toEqual({ ...before.inventory, equipped: after.inventory.equipped,
    materials: after.inventory.materials, materialActionOrdinal: after.inventory.materialActionOrdinal,
    latestMaterialAction: after.inventory.latestMaterialAction });
  for (const key of ['map', 'meta', 'mercs', 'formation', 'endgame'] as const) expect(after[key]).toEqual(before[key]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), deltas))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 3 });
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(0);
  expect(save()).toEqual(after);
});

it('gates hero socket spending by declared physical role, level and Act II unlock', () => {
  equipHeroOffensiveWeapon();
  for (const profile of [offensiveProfile, { ...heroOffensiveProfile,
    heroWeaponPolicy: { kind: 'physical-offense-v1' as const, level: 27 } }]) {
    const before = save();
    expect(prepareIntendedHeroWeaponSockets(profile, () => undefined, () => undefined).insertions).toBe(0);
    expect(save()).toEqual(before);
  }
  useMapStore.setState({ clearedSubAreas: [] }); const before = save();
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('preserves partial hero sockets and all companion gear without spending', () => {
  equipHeroOffensiveWeapon({ socketContents: [{ kind: 'rune', id: 'runes/el' }] });
  const before = save();
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('fills only affordable improving hero inserts and preserves unrelated materials', () => {
  equipHeroOffensiveWeapon(); useInventoryStore.setState({ materials: { 'runes/eld': 1, 'gems/diamond/normal': 8 } });
  const before = save(), deltas: CampaignReward[] = [];
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, row => { deltas.push(row); }).insertions).toBe(1);
  expect(save().inventory.equipped.weapon?.socketContents).toEqual([{ kind: 'rune', id: 'runes/eld' }]);
  expect(useInventoryStore.getState().materials).toEqual({ 'gems/diamond/normal': 8 });
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(save()), deltas).socketInsertions).toBe(1);
});

it('does not buy hero attack speed beyond the native action-period cap', () => {
  equipHeroOffensiveWeapon({ rarity: 'magic', affixes: [{ affixId: 'constructed-speed-cap',
    values: new Map([['statMods.attackSpeed', 1000]]) }] });
  useInventoryStore.setState({ materials: { 'gems/topaz/chipped': 3 } });
  const before = save();
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, () => undefined).insertions).toBe(0);
  expect(save()).toEqual(before);
});

it('refuses full hero bags and busy combat before spending or changing custody', () => {
  equipHeroOffensiveWeapon(); useCombatStore.setState({ inCombat: true }); let before = save();
  expect(() => prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, () => undefined)).toThrow();
  expect(save()).toEqual(before); useCombatStore.setState({ inCombat: false });
  useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, i) => item(`hero-full-${String(i)}`)) });
  before = save();
  expect(prepareIntendedHeroWeaponSockets(heroOffensiveProfile, () => undefined, () => undefined))
    .toEqual({ insertions: 0, refused: 1 });
  expect(save()).toEqual(before);
});

it('re-equips the hero weapon and retains payment evidence after a recorder failure', () => {
  equipHeroOffensiveWeapon(); const before = save(), deltas: CampaignReward[] = [];
  expect(() => prepareIntendedHeroWeaponSockets(heroOffensiveProfile, row => {
    if (row.kind === 'campaign-socket-insertion') throw new Error('Hero recorder failure');
  }, row => { deltas.push(row); })).toThrow('Hero recorder failure');
  expect(save().inventory.equipped.weapon?.id).toBe('hero-offense-weapon');
  expect(save().inventory.equipped.weapon?.socketContents).toEqual([{ kind: 'rune', id: 'runes/eld' }]);
  expect(deltas).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(save()), deltas).socketInsertions).toBe(1);
});

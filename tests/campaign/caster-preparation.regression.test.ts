/** Constructed helper checks; no earned campaign or native combat is inferred. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useIronGolemSelectionStore, armIronGolemSelection } from '@/stores/ironGolemSelectionStore';
import type { CampaignProfile } from './policy';
import type { CampaignReward } from './economy';
import { xpTotal } from '@/engine/progression/xp';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState, earnedDelta } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { growCampaignBuild } from './actions';
import { auditCampaignEconomy, campaignEconomy } from './economy';
import { casterGearScore, equipCampaignCasterGear, hireCampaignPrayer,
  resetCampaignPoints, novaActTwoProfile, prepareNovaActTwoOpening, prepareNovaActFiveResources, recoverCampaignCasterCapacity, prepareNovaBaalDexterity } from './caster-preparation';

let restores: (() => void)[];
const save = () => { const state = snapshotStores(); assert.ok(state); return state; };
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Caster helper QA', 'sorceress').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('values elemental survival while enforcing Mana, defense and speed floors', () => {
  const baseline = { ...hero().derivedStats, manaMax: 100, defense: 100, attackSpeed: 1 };
  const current = casterGearScore(baseline, baseline);
  expect(casterGearScore({ ...baseline, magicResist: baseline.magicResist + 10 }, baseline)).toBeGreaterThan(current);
  for (const next of [{ manaMax: 79 }, { defense: 79 }, { attackSpeed: .89 }])
    expect(casterGearScore({ ...baseline, ...next }, baseline)).toBe(-Infinity);
});

function actFiveResourceFixture() {
  usePlayerStore.getState().gainExperience(xpTotal(55));
  const profile = { ...campaignProfiles['sorceress-cold-nova-focus'],
    statsPerLevel: { strength: 0, dexterity: 5, vitality: 0, energy: 0 } };
  growCampaignBuild(profile, () => undefined);
  // Constructed act access isolates the native respec/point transaction; no campaign win is claimed.
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
  useMapStore.getState().setCurrentLocation(5, 'town-harrogath');
  return profile;
}

it('prepares Act V resources with one native reset and exact refunded-point conservation', () => {
  const initial = actFiveResourceFixture(), before = save();
  const profile = prepareNovaActFiveResources(initial, () => undefined), after = save();
  expect(profile.statsPerLevel).toEqual({ strength: 0, dexterity: 2, vitality: 2, energy: 1 });
  expect(after.player.coreStats.vitality).toBeGreaterThan(before.player.coreStats.vitality);
  expect(after.player.coreStats.energy).toBeGreaterThan(before.player.coreStats.energy);
  expect(after.player.statPoints + Object.values(after.player.coreStats).reduce<number>((a: number,b: number)=>a+b,0))
    .toBe(before.player.statPoints + Object.values(before.player.coreStats).reduce<number>((a: number,b: number)=>a+b,0));
  expect(after.player.respecsRemaining.stat).toBe(before.player.respecsRemaining.stat - 1);
  expect(after.player.skillLevels).toEqual(before.player.skillLevels);
  for(const domain of ['inventory','map','mercs','formation','meta','endgame'] as const)
    expect(after[domain]).toEqual(before[domain]);
});

it('retains the Act V resource profile when logging throws after the committed reset', () => {
  const initial = actFiveResourceFixture(), before = save(), failure = new Error('Recorder failed');
  let retained: CampaignProfile | undefined;
  expect(()=>prepareNovaActFiveResources(initial,row=>{
    if(row.kind==='act2-native-point-reset')throw failure;
  },profile=>{retained=profile;})).toThrow(failure);
  const after=save();
  expect(retained?.statsPerLevel).toEqual({ strength: 0, dexterity: 2, vitality: 2, energy: 1 });
  expect(after.player.respecsRemaining.stat).toBe(before.player.respecsRemaining.stat-1);
  expect(after.player.statPoints).toBeGreaterThan(before.player.statPoints);
  expect(after.player.skillLevels).toEqual(before.player.skillLevels);
});

it('refuses an exhausted Act V resource reset without changing native state', () => {
  const profile=actFiveResourceFixture(),player=hero();
  assert.ok(player.respecsRemaining);
  usePlayerStore.setState({player:{...player,respecsRemaining:{...player.respecsRemaining,stat:0}}});
  const before=save();
  expect(()=>prepareNovaActFiveResources(profile,()=>undefined)).toThrow('unused free reset');
  expect(save()).toEqual(before);
});

it('accounts for physical resistance and armor in mixed scoring without changing elemental scoring', () => {
  const baseline = { ...hero().derivedStats, lifeMax: 1005, manaMax: 519, defense: 499,
    attackSpeed: 347, magicResist: 12, physDodge: .665, magicDodge: .26,
    resistances: { physical: 26, fire: 60, poison: 90, cold: 97, lightning: 74, arcane: 78 } };
  const protectedStats = { ...baseline, resistances: { ...baseline.resistances, physical: 75 } };
  expect(casterGearScore(protectedStats, baseline)).toBe(casterGearScore(baseline, baseline));
  const mixed = casterGearScore(baseline, baseline, 'mixed-v4');
  expect(casterGearScore(protectedStats, baseline, 'mixed-v4')).toBeGreaterThan(mixed);
  expect(casterGearScore({ ...baseline, defense: 700 }, baseline, 'mixed-v4')).toBeGreaterThan(mixed);
  expect(casterGearScore({ ...baseline, manaMax: 79 }, baseline, 'mixed-v4')).toBe(-Infinity);
});

it('equips an owned physical protection upgrade in mixed mode with exact conservation', () => {
  usePlayerStore.getState().gainExperience(xpTotal(55));
  const baseline = { ...hero().derivedStats };
  const source: Item = { id: 'owned-physical-protection', baseId: 'items/base/helm-cap', rarity: 'magic',
    level: 1, ilvl: 1, identified: true, equipped: false, affixes: [{ affixId: 'constructed-physical',
      values: new Map([['resistances.physical', 50]]) }] };
  useInventoryStore.getState().addItem(source); const before = save();
  equipCampaignCasterGear(baseline, () => undefined);
  expect(useInventoryStore.getState().equipped.head).toBeUndefined();
  equipCampaignCasterGear(baseline, () => undefined, 'critical', 'mixed-v4');
  const after = save();
  expect(after.inventory.equipped.head?.id).toBe(source.id);
  expect(after.player.derivedStats.resistances.physical).toBeGreaterThan(before.player.derivedStats.resistances.physical);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
});

it('hires native level12 Prayer and leaves existing Rogue ownership intact', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14));
  const rogue = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(rogue);
  expect(useMercStore.getState().hireMerc(rogue).ok).toBe(true);
  useMapStore.getState().markCleared('areas/act1-catacombs');
  const before = save(); hireCampaignPrayer(() => undefined); const after = save();
  for (const key of ['player', 'inventory', 'map', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(after.mercs.ownedMercs.slice(0, -1)).toEqual(before.mercs.ownedMercs);
  expect(after.mercs.ownedMercs.at(-1)).toMatchObject({ level: 12 });
  expect(after.mercs.fieldedMercId).toBe(after.mercs.ownedMercs.at(-1)?.id);
});

it('refuses Prayer before earned access without changing any state', () => {
  const before = save(); expect(() => { hireCampaignPrayer(() => undefined); }).toThrow(); expect(save()).toEqual(before);
});

it('installs Prayer and buys Static with the next earned training point before additional Nova ranks', () => {
  usePlayerStore.getState().gainExperience(xpTotal(13));
  const initial = campaignProfiles['sorceress-cold-nova-focus']; growCampaignBuild(initial, () => undefined);
  useMapStore.getState().markCleared('areas/act1-catacombs');
  const rank = hero().skillLevels?.['sorceress.frost_nova'];
  const opening = prepareNovaActTwoOpening(initial, () => undefined);
  expect(useMercStore.getState().getFieldedMerc()?.id).toBe('mercs/act2-prayer');
  expect(opening.statsPerLevel).toEqual(initial.statsPerLevel);
  usePlayerStore.getState().gainExperience(xpTotal(14) - xpTotal(13));
  growCampaignBuild(opening, () => undefined);
  expect(hero().skillLevels?.['sorceress.static_field']).toBe(1);
  expect(hero().skillLevels?.['sorceress.frost_nova']).toBe(rank);
});

it('consumes one free stat reset, refunds exactly, and preserves points and ownership', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14));
  growCampaignBuild(campaignProfiles['sorceress-cold-nova-focus'], () => undefined);
  const before = save(), result = resetCampaignPoints('stat', () => undefined), after = save();
  expect(result.cost).toBe(0); expect(result.refund).toBeGreaterThan(0);
  expect(after.player.statPoints).toBe(before.player.statPoints + result.refund);
  expect(after.player.respecsRemaining.stat).toBe(before.player.respecsRemaining.stat - 1);
  expect(after.player.skillLevels).toEqual(before.player.skillLevels);
  expect(after.player.skillPoints).toBe(before.player.skillPoints);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  growCampaignBuild(novaActTwoProfile(campaignProfiles['sorceress-cold-nova-focus'], false), () => undefined);
  expect(hero().coreStats.vitality).toBe(after.player.coreStats.vitality + result.refund);
});

it('earns and allocates Blizzard only at its native level24 gate after a free skill reset', () => {
  usePlayerStore.getState().gainExperience(xpTotal(24));
  growCampaignBuild(campaignProfiles['sorceress-cold-nova-focus'], () => undefined);
  const before = save(), reset = resetCampaignPoints('skill', () => undefined);
  expect(reset.refund).toBe(Object.values(before.player.skillLevels ?? {}).reduce((a, b) => a + b, 0));
  expect(hero().skillLevels).toEqual({});
  growCampaignBuild(novaActTwoProfile(campaignProfiles['sorceress-cold-nova-focus'], true), () => undefined);
  expect(hero().skillLevels).toMatchObject({ 'sorceress.blizzard': 20, 'sorceress.glacial_spike': 1,
    'sorceress.static_field': 1, 'sorceress.warmth': 1 });
  expect(hero().skillPoints).toBe(0);
  expect(hero().respecsRemaining?.skill).toBe(before.player.respecsRemaining.skill - 1);
});

it('chooses owned caster gear deterministically and conserves full item payloads', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14));
  const item = (id: string): Item => ({ id, baseId: 'items/base/helm-cap', rarity: 'magic', level: 1, ilvl: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'constructed-life', values: new Map([['statMods.life', 30]]) }] });
  useInventoryStore.getState().addItem(item('z')); useInventoryStore.getState().addItem(item('a'));
  const before = save(); const baseline = hero().derivedStats;
  equipCampaignCasterGear(baseline, () => undefined); const after = save();
  expect(after.inventory.equipped.head?.id).toBe('a');
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
  expect(after.inventory.backpack).toEqual([item('z')]);
});

it('checks the comparable-stat contract while native equip also updates Magic Find', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14));
  const source: Item = { id: 'caster-find-upgrade', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1, ilvl: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'constructed-life-find',
      values: new Map([['statMods.life', 30], ['statMods.magicFind', 5]]) }] };
  useInventoryStore.getState().addItem(source); const before = save();
  equipCampaignCasterGear(hero().derivedStats, () => undefined); const after = save();
  expect(after.inventory.equipped.head?.id).toBe(source.id); expect(after.player.derivedStats.magicFind).toBe(5);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
});

it('retrieves eligible caster gear from owned stash while conserving all earned payloads', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14));
  const source: Item = { id: 'owned-caster-stash', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1, ilvl: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'constructed-life', values: new Map([['statMods.life', 30]]) }] };
  useInventoryStore.setState({ stash: [source] }); const before = save();
  equipCampaignCasterGear(hero().derivedStats, () => undefined); const after = save();
  expect(after.inventory.equipped.head?.id).toBe(source.id); expect(after.inventory.stash).toEqual([]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
});


it('uses owned crit upgrades for prepared weapons while the default keeps the life sword', () => {
  usePlayerStore.getState().gainExperience(xpTotal(26));
  const sword = (id: string, chance: number, multiplier: number, life: number): Item => ({ id,
    baseId: 'items/base/wp1h-scimitar', rarity: 'magic', level: 12, ilvl: 12,
    identified: true, equipped: false, affixes: [{ affixId: 'constructed-critical-life', values: new Map([
      ['statMods.critChance', chance], ['statMods.critDamage', multiplier], ['statMods.life', life]
    ]) }] });
  const old = sword('life-sword', .05, .16, 28), oldOffhand = sword('life-offhand', .05, .16, 28);
  useInventoryStore.getState().addItem(old); expect(useInventoryStore.getState().equipItem(old, 'weapon').ok).toBe(true);
  useInventoryStore.getState().addItem(oldOffhand); expect(useInventoryStore.getState().equipItem(oldOffhand, 'offhand').ok).toBe(true);
  const better = sword('a-crit-sword', .06, .17, 0), tied = sword('z-crit-sword', .06, .17, 0);
  const regressesChance = sword('bad-chance', .04, .99, 0), regressesDamage = sword('bad-multiplier', .99, .15, 0);
  useInventoryStore.setState({ stash: [tied, better, regressesChance, regressesDamage] });
  const before = save(), baseline = hero().derivedStats;
  equipCampaignCasterGear(baseline, () => undefined);
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe(old.id);
  equipCampaignCasterGear(baseline, () => undefined, 'critical');
  const after = save();
  expect(after.inventory.equipped.offhand?.id).toBe(better.id);
  expect(after.inventory.equipped.weapon?.id).toBe(tied.id);
  expect(after.player.derivedStats.critChance).toBeCloseTo(.17);
  expect(after.player.derivedStats.critDamage).toBeCloseTo(2.34);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
  equipCampaignCasterGear(baseline, () => undefined, 'critical');
  expect(save().inventory.equipped).toEqual(after.inventory.equipped);
});

it('retains native full-backpack refusals for prepared critical weapons', () => {
  usePlayerStore.getState().gainExperience(xpTotal(26));
  const candidate: Item = { id: 'stash-crit-refused', baseId: 'items/base/wp1h-scimitar', rarity: 'magic', level: 12, ilvl: 12,
    identified: true, equipped: false, affixes: [{ affixId: 'constructed-crit', values: new Map([['statMods.critChance', .1]]) }] };
  useInventoryStore.setState({ stash: [candidate], backpack: Array.from({ length: 100 }, (_, index): Item => ({
    id: `full-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, ilvl: 1, identified: true, equipped: false, affixes: [] })) });
  const before = save(), rows: Record<string, unknown>[] = [];
  equipCampaignCasterGear(hero().derivedStats, row => { rows.push(row); }, 'critical');
  expect(save()).toEqual(before);
  expect(rows.some(row => row.kind === 'campaign-gear-retrieve' &&
    (row.result as { ok?: boolean; reason?: string }).reason === 'backpack_full')).toBe(true);
});

function casterOverflowFixture() {
  usePlayerStore.getState().gainExperience(xpTotal(55));
  const item = (id: string, extra: Partial<Item> = {}): Item => ({ id, baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0, affixes: [], ...extra });
  const extras = [item('kept-unique', { rarity: 'unique', uniqueId: 'items/unique/peasant-crown' }),
    item('kept-socket', { rarity: 'normal', socketCapacity: 1, socketContents: [{ kind: 'rune', id: 'runes/el' }] }),
    item('kept-reserved'), item('kept-upgrade', { affixes: [{ affixId: 'constructed-upgrade',
      values: new Map([['resistances.physical', 50], ['statMods.critChance', .2], ['statMods.magicResist', 30]]) }] })];
  useInventoryStore.setState({ backpack: [...extras, ...Array.from({length:120},(_,index)=>item('junk-'+String(index)))],
    stash: [item('stash-preserved')] });
  armIronGolemSelection(hero().id, 'kept-reserved', true);
  return extras;
}

it('salvages surplus caster rares while retaining upgrades, unique, sockets, reserve and stash', () => {
  const extras = casterOverflowFixture(), before = save(), rewards: CampaignReward[] = [];
  expect(recoverCampaignCasterCapacity(hero().derivedStats, () => undefined, delta=>{rewards.push(delta);})).toBe('ready');
  const after = save();
  for (const item of extras) expect(after.inventory.backpack).toContainEqual(item);
  expect(after.inventory.stash).toEqual(before.inventory.stash);
  expect(after.inventory.backpack.length).toBeLessThanOrEqual(97);
  expect(rewards).toHaveLength(1);
  const sink = rewards[0]; assert.ok(sink);
  expect(sink.removedItemIds).toHaveLength(120);
  expect(sink.materials['materials/scrap']).toBeGreaterThan(0);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(after),rewards))
    .toEqual({xp:0,addedItems:0,removedItems:120});
  expect(after.player).toEqual(before.player);
});

it('retains committed caster salvage accounting when the post-sink recorder fails', () => {
  casterOverflowFixture(); const before=save(),rewards:CampaignReward[]=[],failure=new Error('Post-sink recorder');
  expect(()=>recoverCampaignCasterCapacity(hero().derivedStats,row=>{
    if(row.kind==='campaign-inventory-sink')throw failure;
  },delta=>{rewards.push(delta);})).toThrow(failure);
  expect(rewards).toHaveLength(1);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(save()),rewards).removedItems).toBe(120);
  useIronGolemSelectionStore.setState({selection:null});
});

it('equips only requested boss weapons while preserving all armor and owned items', () => {
  usePlayerStore.getState().gainExperience(xpTotal(26));
  const weapon: Item = { id: 'boss-critical', baseId: 'items/base/wp1h-scimitar', rarity: 'magic', level: 12, ilvl: 12,
    identified: true, equipped: false, socketCapacity: 0, affixes: [{ affixId: 'constructed-crit',
      values: new Map([['statMods.critChance', .2], ['statMods.critDamage', .2]]) }] };
  const armor: Item = { id: 'armor-remains-in-bag', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1, ilvl: 1,
    identified: true, equipped: false, socketCapacity: 0, affixes: [{ affixId: 'constructed-resist',
      values: new Map([['statMods.magicResist', 30]]) }] };
  useInventoryStore.getState().addItem(weapon); useInventoryStore.getState().addItem(armor);
  const before=save();
  equipCampaignCasterGear(hero().derivedStats,()=>undefined,'critical','elemental-v1',['weapon']);
  const after=save();expect(after.inventory.equipped.weapon?.id).toBe(weapon.id);
  expect(after.inventory.equipped.head).toEqual(before.inventory.equipped.head);
  expect(after.inventory.backpack).toContainEqual(armor);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(after),[])).toEqual({xp:0,addedItems:0});
});

it('selects paid boss critical armor monotonically while retaining native inventory conservation', () => {
  usePlayerStore.getState().gainExperience(xpTotal(26));
  const candidate: Item = { id:'critical-head',baseId:'items/base/helm-cap',rarity:'magic',level:1,ilvl:1,
    identified:true,equipped:false,socketCapacity:0,affixes:[{affixId:'constructed-critical',
      values:new Map([['statMods.critChance',.2],['statMods.critDamage',.2],['resistances.arcane',50]])}] };
  const old: Item = {...candidate,id:'old-arcane-head',affixes:[{affixId:'constructed-resist',values:new Map([['resistances.arcane',50]])}]};
  const unsafe: Item = {...candidate,id:'unsafe-critical-head',affixes:[{affixId:'constructed-critical',
    values:new Map([['statMods.critChance',.5],['statMods.critDamage',.5]])}]};
  useInventoryStore.getState().addItem(old);expect(useInventoryStore.getState().equipItem(old,'head').ok).toBe(true);
  useInventoryStore.getState().addItem(candidate);useInventoryStore.getState().addItem(unsafe);const before=save();
  equipCampaignCasterGear(hero().derivedStats,()=>undefined,'critical-all');const after=save();
  expect(after.inventory.equipped.head?.id).toBe(candidate.id);
  expect(after.inventory.backpack).toContainEqual(unsafe);
  expect(after.player.derivedStats.resistances.arcane).toBe(before.player.derivedStats.resistances.arcane);
  expect(after.player.derivedStats.critChance).toBeGreaterThan(before.player.derivedStats.critChance);
  expect(after.player.derivedStats.critDamage).toBeGreaterThan(before.player.derivedStats.critDamage);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(after),[])).toEqual({xp:0,addedItems:0});
});

it('audits native salvage of formerly equipped gear and rejects forged equipped custody', () => {
  usePlayerStore.getState().gainExperience(xpTotal(55));
  const item=(id:string):Item=>({id,baseId:'items/base/helm-cap',rarity:'rare',level:1,ilvl:1,
    identified:true,equipped:false,socketCapacity:0,affixes:[]});
  const old=item('old-worn-head');useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old,'head').ok).toBe(true);const before=save();
  expect(useInventoryStore.getState().unequipItem('head').ok).toBe(true);const beforeLoot=observeEarnedState();
  for(let index=0;index<120;index++)useInventoryStore.getState().addItem(item('junk-'+String(index)));
  const best:Item={...item('best-kept'),affixes:[{affixId:'constructed-upgrade',
    values:new Map([['resistances.physical',50],['statMods.critChance',.2],['statMods.magicResist',30]])}]};
  useInventoryStore.getState().addItem(best);
  const rewards:CampaignReward[]=[earnedDelta(beforeLoot,observeEarnedState())];
  recoverCampaignCasterCapacity(hero().derivedStats,()=>undefined,delta=>{rewards.push(delta);});
  const [lootReward, salvageReward] = rewards; assert.ok(lootReward && salvageReward);
  expect(salvageReward.removedItemIds).toContain(old.id);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(save()),rewards).removedItems).toBe(121);
  const sink=salvageReward.inventorySink;assert.ok(sink?.policy==='salvage-caster-overflow-v1');
  const forged={...salvageReward,inventorySink:{...sink,consumedItems:sink.consumedItems.map(source=>
    source.id===old.id?{...source,equipped:true}:source)}};
  expect(()=>auditCampaignEconomy(campaignEconomy(before),campaignEconomy(save()),[lootReward,forged]))
    .toThrow('Equipped caster sink target');
});

function paidBaalFixture() {
  usePlayerStore.getState().gainExperience(xpTotal(55));
  const profile:CampaignProfile={...campaignProfiles['sorceress-cold-nova-focus'],
    statsPerLevel:{strength:0,dexterity:2,vitality:2,energy:1}};
  growCampaignBuild(profile,()=>undefined);const player=hero();assert.ok(player.respecsRemaining);
  usePlayerStore.setState({player:{...player,respecsRemaining:{...player.respecsRemaining,stat:0}}});
  useInventoryStore.getState().addCurrency('wishstone',5);
  vi.spyOn(useMapStore.getState(),'isActUnlocked').mockReturnValue(true);
  useMapStore.getState().setCurrentLocation(5,'town-harrogath');return profile;
}

it('pays for Baal Dexterity preparation exactly once with native point conservation',()=>{
  const initial=paidBaalFixture(),before=save(),costs:CampaignReward[]=[];
  const profile=prepareNovaBaalDexterity(initial,()=>undefined,delta=>{costs.push(delta);});const after=save();
  expect(profile.statsPerLevel).toEqual({strength:0,dexterity:4,vitality:1,energy:0});
  expect(after.player.derivedStats.attackSpeed).toBeGreaterThan(before.player.derivedStats.attackSpeed);
  expect(after.inventory.currencies.wishstone).toBe((before.inventory.currencies.wishstone ?? 0)-5);
  expect(after.player.respecsRemaining.stat).toBe(0);expect(after.player.skillLevels).toEqual(before.player.skillLevels);
  expect(auditCampaignEconomy(campaignEconomy(before),campaignEconomy(after),costs)).toEqual({xp:0,addedItems:0});
  const unchanged=save();expect(prepareNovaBaalDexterity(profile,()=>undefined,delta=>{costs.push(delta);})).toBe(profile);
  expect(save()).toEqual(unchanged);expect(costs).toHaveLength(1);
});

it('retains paid Baal preparation cost and profile when the postcommit recorder throws',()=>{
  const initial=paidBaalFixture(),costs:CampaignReward[]=[],failure=new Error('Paid reset recorder');
  let retained:CampaignProfile|undefined;
  expect(()=>prepareNovaBaalDexterity(initial,()=>{throw failure;},delta=>{costs.push(delta);},profile=>{retained=profile;})).toThrow(failure);
  expect(retained?.statsPerLevel.dexterity).toBe(4);expect(costs).toHaveLength(1);
  expect(hero().statPoints).toBe(270);expect(useInventoryStore.getState().currencies.wishstone).toBe(0);
});

it('refuses unaffordable paid Baal preparation without changing native state',()=>{
  const initial=paidBaalFixture();useInventoryStore.setState({currencies:{wishstone:4}});const before=save();
  expect(()=>prepareNovaBaalDexterity(initial,()=>undefined,()=>undefined)).toThrow('insufficient-wishstones');
  expect(save()).toEqual(before);
});

it('retains future caster upgrades during salvage without bypassing their native equip gate', () => {
  usePlayerStore.getState().gainExperience(xpTotal(26));
  growCampaignBuild(campaignProfiles['sorceress-cold-nova-focus'], () => undefined);
  const future: Item = { id: 'future-armor', baseId: 'items/base/helm-armet', rarity: 'rare', level: 45, ilvl: 45,
    identified: true, equipped: false, socketCapacity: 0, affixes: [{ affixId: 'constructed-life-mana',
      values: new Map([['statMods.life', 200], ['statMods.mana', 200]]) }] };
  const item = (index: number): Item => ({ id: `junk-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0, affixes: [] });
  useInventoryStore.setState({ backpack: [future, ...Array.from({ length: 120 }, (_, index) => item(index))] });
  const before = save(), rewards: CampaignReward[] = [];
  expect(recoverCampaignCasterCapacity(hero().derivedStats, () => undefined, delta => { rewards.push(delta); })).toBe('ready');
  const after = save();
  expect(after.inventory.backpack).toContainEqual(future);
  expect(after.inventory.equipped).toEqual(before.inventory.equipped);
  expect(after.player).toEqual(before.player);
  expect(rewards.flatMap(reward => reward.removedItemIds)).not.toContain(future.id);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), rewards).removedItems).toBeGreaterThan(0);
  expect(useInventoryStore.getState().equipItem(future, 'head')).toEqual({ ok: false, reason: 'requirements_not_met' });
  expect(save()).toEqual(after);
});

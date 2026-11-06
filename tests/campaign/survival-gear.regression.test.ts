/** Constructed policy checks; these fixtures are not earned campaign evidence. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { armIronGolemSelection, useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { auditCampaignEconomy, campaignEconomy } from './economy';
import { equipCampaignSurvivalGear, survivalGearScore, type CampaignThreat } from './survival-gear';
import { javelinGearThreats } from './javelin-progression';
import * as heroProjection from '@/engine/progression/equipped-stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';

const physicalThreat = { type: 'physical', rawDamage: 100, dodge: 'physical', weight: 1 } as const;
const threats: readonly CampaignThreat[] = [physicalThreat];
let restores: (() => void)[], mercId: string;
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Survival QA', 'amazon').ok).toBe(true);
  const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(definition);
  const result = useMercStore.getState().hireMerc(definition);
  assert.ok(result.ok && result.mercId); mercId = result.mercId;
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const item = (id: string, mods: Readonly<Record<string, number>> = {}): Item => ({
  id, baseId: 'items/base/helm-cap', rarity: 'magic', level: 1, ilvl: 1,
  identified: true, equipped: false, affixes: [{ affixId: 'constructed-policy',
    values: new Map(Object.entries(mods)) }]
});
const save = () => { const result = snapshotStores(); assert.ok(result); return result; };

for (const owner of ['hero', 'merc'] as const) {
  for (const element of ['lightning', 'cold', 'fire', 'poison'] as const) {
    it(`values owned Act II ${element} protection for ${owner} without income or healing`, () => {
      const amulet = { ...item(`${element}-amulet`, { [`resistances.${element}`]: 40 }),
        baseId: 'items/base/amu-tin' };
      useInventoryStore.getState().addItem(amulet);
      const before = save();
      equipCampaignSurvivalGear(owner, javelinGearThreats(2), () => undefined);
      const after = save(), equipment = owner === 'hero' ? after.inventory.equipped : after.mercs.mercEquipment[mercId];
      expect(equipment?.amulet?.id).toBe(amulet.id);
      expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
        .toEqual({ xp: 0, addedItems: 0 });
      expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
      expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
    });
  }
}

it('values armor above the old floor against Act II normal and critical physical bursts', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  const baseline = { ...player.derivedStats, defense: 160 };
  expect(survivalGearScore({ ...baseline, defense: 200 }, baseline, javelinGearThreats(2)))
    .toBeGreaterThan(survivalGearScore(baseline, baseline, javelinGearThreats(2)));
});

it('represents the authored fifty-point Act II physical curse', () => {
  const physical = javelinGearThreats(2).filter(threat => threat.type === 'physical');
  expect(physical).toEqual([
    { type: 'physical', rawDamage: 225, dodge: 'physical', weight: .95, resistPenalty: 50 },
    { type: 'physical', rawDamage: 337.5, dodge: 'physical', weight: .05, resistPenalty: 50 }
  ]);
});

const equipOneHandedPair = () => {
  for (const slot of ['weapon', 'offhand'] as const) {
    const weapon = { ...item(`retained-${slot}`, { 'statMods.attack': 80 }), baseId: 'items/base/wp1h-short-sword' };
    useInventoryStore.getState().addItem(weapon);
    expect(useInventoryStore.getState().equipItem(weapon, slot).ok).toBe(true);
  }
};

it('allows a declared hero shield tradeoff while retaining mainhand, speed and earned pools', () => {
  equipOneHandedPair();
  const shield = { ...item('owned-shield', { 'statMods.defense': 100 }), baseId: 'items/base/sh-buckler' };
  useInventoryStore.getState().addItem(shield);
  const before = save();
  equipCampaignSurvivalGear('hero', threats, () => undefined);
  expect(save()).toEqual(before);
  equipCampaignSurvivalGear('hero', threats, () => undefined, undefined,
    { minimumAttack: before.player.derivedStats.attack });
  expect(save()).toEqual(before);
  equipCampaignSurvivalGear('hero', threats, () => undefined, undefined, { minimumAttack: 0 });
  const after = save();
  expect(after.inventory.equipped.offhand?.id).toBe(shield.id);
  expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
  expect(after.player.derivedStats.attack).toBeLessThan(before.player.derivedStats.attack);
  for (const key of ['attackSpeed', 'life', 'mana', 'manaMax'] as const)
    expect(after.player.derivedStats[key]).toBe(before.player.derivedStats[key]);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
});

it('limits the opt-in offhand candidates to shields', () => {
  equipOneHandedPair();
  const weapon = { ...item('defensive-weapon', { 'statMods.defense': 1000 }), baseId: 'items/base/wp1h-short-sword' };
  useInventoryStore.getState().addItem(weapon);
  const before = save();
  equipCampaignSurvivalGear('hero', threats, () => undefined, undefined, { minimumAttack: 0 });
  expect(save()).toEqual(before);
});

it('rejects invalid shield policies and two-handed displacement before mutation', () => {
  const before = save();
  for (const minimumAttack of [-1, NaN, Infinity, .5, Number.MAX_SAFE_INTEGER + 1])
    expect(() => { equipCampaignSurvivalGear('hero', threats, () => undefined, undefined,
      { minimumAttack }); }).toThrow('shield');
  expect(() => { equipCampaignSurvivalGear('merc', threats, () => undefined, undefined,
    { minimumAttack: 0 }); }).toThrow('hero');
  expect(() => { equipCampaignSurvivalGear('hero', threats, () => undefined, undefined,
    { minimumAttack: 0 }); }).toThrow('mainhand');
  expect(save()).toEqual(before);
});

for (const owner of ['hero', 'merc'] as const) {
  it(`permits an explicit mana reserve for ${owner} while preserving default floors and earned resources`, () => {
    const stats = () => {
      const player = usePlayerStore.getState().player; assert.ok(player);
      const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
      return owner === 'hero' ? player.derivedStats :
        deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(merc.id));
    };
    const reserve = stats().manaMax + 100;
    const old = item('surplus-mana', { 'statMods.mana': 200 });
    useInventoryStore.getState().addItem(old);
    const result = owner === 'hero' ? useInventoryStore.getState().equipItem(old, 'head') :
      useMercStore.getState().equipOnMerc(mercId, 'head', old);
    expect(result.ok).toBe(true);
    const candidate = item('defense-with-reserve', { 'statMods.mana': 120, 'statMods.defense': 100 });
    useInventoryStore.getState().addItem(candidate);
    const before = save(), initialStats = stats();
    equipCampaignSurvivalGear(owner, threats, () => undefined);
    expect(save()).toEqual(before);
    equipCampaignSurvivalGear(owner, threats, () => undefined, reserve);
    const after = save(), finalStats = stats();
    const equipment = owner === 'hero' ? after.inventory.equipped : after.mercs.mercEquipment[mercId];
    expect(equipment?.head?.id).toBe(candidate.id);
    expect(finalStats.manaMax).toBeLessThan(initialStats.manaMax);
    expect(finalStats.manaMax).toBeGreaterThanOrEqual(reserve);
    for (const key of ['attack', 'attackSpeed', 'life', 'mana'] as const)
      expect(finalStats[key]).toBe(initialStats[key]);
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
      .toEqual({ xp: 0, addedItems: 0 });
  });
}

it('rejects invalid mana reserves before any equipment or resource changes', () => {
  useInventoryStore.getState().addItem(item('retained-reserve-candidate'));
  const before = save();
  for (const reserve of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])
    expect(() => { equipCampaignSurvivalGear('hero', threats, () => undefined, reserve); }).toThrow('mana reserve');
  expect(save()).toEqual(before);
});

it('uses the production resistance-before-armor floor and stops valuing excess armor', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  const baseline = { ...player.derivedStats, lifeMax: 100, defense: 40, physDodge: 0,
    resistances: { ...player.derivedStats.resistances, physical: 50 } };
  expect(survivalGearScore(baseline, baseline, threats)).toBe(-.085);
  const protectedStats = { ...baseline, defense: 50 };
  expect(survivalGearScore(protectedStats, baseline, threats)).toBe(-.0085);
  expect(survivalGearScore({ ...protectedStats, defense: 500 }, baseline, threats))
    .toBe(survivalGearScore(protectedStats, baseline, threats));
  for (const patch of [{ manaMax: baseline.manaMax - 1 }, { attack: baseline.attack - 1 },
    { attackSpeed: baseline.attackSpeed - 1 }])
    expect(survivalGearScore({ ...baseline, ...patch }, baseline, threats)).toBe(-Infinity);
});

it('accounts for elemental mitigation, pierce and the declared dodge pool', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  const baseline = { ...player.derivedStats, lifeMax: 100, magicResist: 10, magicDodge: .25,
    resistances: { ...player.derivedStats.resistances, arcane: 50 } };
  const arcane = [{ type: 'arcane', rawDamage: 100, dodge: 'magical', weight: 1,
    resistPenalty: 20 }] as const;
  expect(survivalGearScore(baseline, baseline, arcane)).toBeCloseTo(-.36);
  expect(survivalGearScore({ ...baseline, defense: 10000 }, baseline, arcane))
    .toBe(survivalGearScore(baseline, baseline, arcane));
});

for (const owner of ['hero', 'merc'] as const) {
  it(`equips an eligible defensive amulet for ${owner} without creating income`, () => {
    const amulet = { ...item('life-amulet', { 'statMods.life': 20 }), baseId: 'items/base/amu-tin' };
    useInventoryStore.getState().addItem(amulet);
    const before = save();
    equipCampaignSurvivalGear(owner, threats, () => undefined);
    const after = save(), equipped = owner === 'hero' ? after.inventory.equipped : after.mercs.mercEquipment[mercId];
    expect(equipped?.amulet?.id).toBe('life-amulet');
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
  });

  it(`allows a useful Life/armor tradeoff for ${owner}, retaining equipment and all income`, () => {
    const old = item('old-life', { 'statMods.life': 20 });
    useInventoryStore.getState().addItem(old);
    const result = owner === 'hero' ? useInventoryStore.getState().equipItem(old, 'head') :
      useMercStore.getState().equipOnMerc(mercId, 'head', old);
    expect(result.ok).toBe(true);
    const replacement = item('new-armor', { 'statMods.defense': 100 });
    useInventoryStore.setState({ stash: [replacement] });
    const before = save();
    equipCampaignSurvivalGear(owner, threats, () => undefined);
    const after = save();
    const equipped = owner === 'hero' ? after.inventory.equipped : after.mercs.mercEquipment[mercId];
    expect(equipped?.head?.id).toBe('new-armor');
    expect(after.inventory.backpack).toEqual([old]);
    expect(after.inventory.stash).toEqual([]);
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
      .toEqual({ xp: 0, addedItems: 0 });
    for (const key of ['map', 'formation', 'meta', 'endgame'] as const) expect(after[key]).toEqual(before[key]);
    if (owner === 'merc') expect(after.player).toEqual(before.player);
    else expect(after.mercs).toEqual(before.mercs);
    const unchanged = save(); equipCampaignSurvivalGear(owner, threats, () => undefined);
    expect(save()).toEqual(unchanged);
  });
}

it('keeps level-ineligible items out and uses an item ID only to break equal property scores', () => {
  useInventoryStore.setState({ backpack: [item('z'), { ...item('locked', { 'statMods.defense': 1000 }),
    baseId: 'items/base/helm-armet', level: 90, ilvl: 90 }, item('a')] });
  equipCampaignSurvivalGear('merc', threats, () => undefined);
  expect(useMercStore.getState().getMercEquipment(mercId).head?.id).toBe('a');
  expect(useInventoryStore.getState().backpack.map(row => row.id)).toEqual(['z', 'locked']);
});

it('leaves a selected stash candidate and the full save intact when retrieval is full', () => {
  useInventoryStore.setState({ stash: [item('selected')], backpack: Array.from({ length: 100 },
    (_, i) => ({ ...item(`locked-${String(i)}`), baseId: 'items/base/helm-armet', level: 90, ilvl: 90 })) });
  const before = save(); equipCampaignSurvivalGear('merc', threats, () => undefined);
  expect(save()).toEqual(before);
});

it('validates the entire threat policy before any transfer', () => {
  useInventoryStore.getState().addItem(item('retained'));
  const before = save();
  for (const invalid of [[], [{ ...physicalThreat, rawDamage: NaN }],
    [{ ...physicalThreat, weight: -1 }], [{ ...physicalThreat, resistPenalty: Infinity }]])
    expect(() => { equipCampaignSurvivalGear('merc', invalid, () => undefined); }).toThrow('threat');
  expect(save()).toEqual(before);
});

it('keeps a native committed equip when the recorder fails afterward', () => {
  useInventoryStore.getState().addItem(item('committed'));
  expect(() => { equipCampaignSurvivalGear('merc', threats, row => {
    if (row.kind === 'campaign-survival-equip') throw new Error('Recorder failed');
  }); }).toThrow('Recorder failed');
  expect(useMercStore.getState().getMercEquipment(mercId).head?.id).toBe('committed');
  expect(useInventoryStore.getState().backpack).toEqual([]);
});

it('projects each hero transfer from the current resource pools without healing after a Life tradeoff', () => {
  const old = item('old-life', { 'statMods.life': 20 });
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old, 'head').ok).toBe(true);
  const player = usePlayerStore.getState().player; assert.ok(player);
  usePlayerStore.setState({ player: { ...player,
    derivedStats: { ...player.derivedStats, life: player.derivedStats.lifeMax } } });
  useInventoryStore.getState().addItem(item('armor', { 'statMods.defense': 100 }));
  useInventoryStore.getState().addItem({ ...item('life-ring', { 'statMods.life': 30 }),
    baseId: 'items/base/ring' });
  const results: Readonly<Record<string, unknown>>[] = [];
  equipCampaignSurvivalGear('hero', threats, row => {
    if (row.kind === 'campaign-survival-equip') {
      expect(row.after).toEqual(usePlayerStore.getState().player?.derivedStats);
      results.push(row);
    }
  });
  expect(results.length).toBeGreaterThanOrEqual(2);
  const current = usePlayerStore.getState().player; assert.ok(current);
  expect(current.derivedStats.life).toBeLessThan(player.derivedStats.lifeMax);
  expect(current.derivedStats.lifeMax).toBeGreaterThan(current.derivedStats.life);
});


it('values more armor against the observed Act III elite and critical bursts beyond the old floor', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  const baseline = { ...player.derivedStats, defense: 199,
    resistances: { ...player.derivedStats.resistances, physical: 18 } };
  expect(survivalGearScore({ ...baseline, defense: 240 }, baseline, javelinGearThreats(3)))
    .toBeGreaterThan(survivalGearScore(baseline, baseline, javelinGearThreats(3)));
});

for (const element of ['fire', 'cold', 'lightning', 'poison'] as const) {
  it(`values owned Act III ${element} protection without granting rewards or healing`, () => {
    const amulet = { ...item(`act3-${element}`, { [`resistances.${element}`]: 40 }), baseId: 'items/base/amu-tin' };
    useInventoryStore.getState().addItem(amulet);
    const before = save();
    equipCampaignSurvivalGear('hero', javelinGearThreats(3), () => undefined);
    const after = save();
    expect(after.inventory.equipped.amulet?.id).toBe(amulet.id);
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
    expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
    expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
  });
}


it('prepares mercenary candidates without unused hero quest projections or any state change', () => {
  const before = save(), prepare = vi.spyOn(heroProjection, 'prepareEquippedPlayerStats');
  equipCampaignSurvivalGear('merc', threats, () => undefined);
  expect(prepare).not.toHaveBeenCalled(); expect(save()).toEqual(before);
});


for (const owner of ['hero', 'merc'] as const) {
  it(`preserves the current hero's reserved Iron Golem armor during ${owner} defense selection`, () => {
    const reserved = item('reserved-defense', { 'statMods.defense': 100 });
    useInventoryStore.getState().addItem(reserved);
    const hero = usePlayerStore.getState().player; assert.ok(hero);
    armIronGolemSelection(hero.id, reserved.id, true);
    const before = save(), selection = useIronGolemSelectionStore.getState().selection;
    equipCampaignSurvivalGear(owner, threats, () => undefined, undefined, undefined, 'stash-room-v1');
    expect(save()).toEqual(before);
    expect(useIronGolemSelectionStore.getState().selection).toEqual(selection);
  });
}

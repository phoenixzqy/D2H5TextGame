/** Constructed native allocation/owned-gear fixtures; no earned-route viability claim. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { playerToCombatUnit, scopedSummonConfiguration } from '@/stores/combatHelpers';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { growCampaignBuild, equipCampaignGear, type CampaignRecord } from './actions';
import { campaignEconomy, auditCampaignEconomy } from './economy';
import { campaignProfiles } from './profiles';
import type { CampaignProfile } from './policy';
import { campaignRequest } from './policy';

const bowPolicy = campaignProfiles['amazon-bow'];

it('registers owned-defense Bow separately while retaining the original survival policy', () => {
  const { profile } = campaignRequest('act2', 'amazon-bow-survival-owned-v1');
  expect(profile).toEqual({ ...campaignProfiles['amazon-bow-survival-v1'],
    survivalEquipmentPolicy: 'act2-owned-v1' });
  expect(campaignProfiles['amazon-bow-survival-v1']).not.toHaveProperty('survivalEquipmentPolicy');
});

it('registers managed stash retrieval separately from the retained owned-defense policy', () => {
  const { profile } = campaignRequest('act2', 'amazon-bow-survival-managed-v1');
  expect(profile).toEqual({ ...campaignProfiles['amazon-bow-survival-owned-v1'],
    survivalRetrievalPolicy: 'stash-room-v1' });
  expect(campaignProfiles['amazon-bow-survival-owned-v1']).not.toHaveProperty('survivalRetrievalPolicy');
});

for (const managed of [false, true])
for (const owner of ['hero', 'merc'] as const) {
  it(`uses owned Act II Bow defense for ${owner} with managed retrieval ${String(managed)} without income, healing or weapon displacement`, () => {
    vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
    createBowFixture();
    const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(definition);
    expect(useMercStore.getState().hireMerc(definition).ok).toBe(true);
    const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
    useMapStore.getState().markCleared('areas/act1-catacombs');
    // Act II preparation can return to a cleared Act I farm before its next boundary.
    useMapStore.setState({ currentAct: owner === 'hero' ? 2 : 1 });
    const old = item('surplus-mana', 'items/base/helm-cap', { rarity: 'magic',
      affixes: [{ affixId: 'constructed-policy', values: new Map([['statMods.mana', 200]]) }] });
    useInventoryStore.getState().addItem(old);
    expect((owner === 'hero' ? useInventoryStore.getState().equipItem(old, 'head') :
      useMercStore.getState().equipOnMerc(merc.id, 'head', old)).ok).toBe(true);
    // Isolate this owner's trade; the other owner already has stronger protection.
    const protectedOther = item('other-owner-defense', 'items/base/helm-cap', { rarity: 'magic',
      affixes: [{ affixId: 'constructed-policy', values: new Map([
        ['statMods.mana', 200], ['resistances.lightning', 75], ['resistances.cold', 75]]) }] });
    useInventoryStore.getState().addItem(protectedOther);
    expect((owner === 'hero' ? useMercStore.getState().equipOnMerc(merc.id, 'head', protectedOther) :
      useInventoryStore.getState().equipItem(protectedOther, 'head')).ok).toBe(true);
    const candidate = item('owned-resistance', 'items/base/helm-cap', { rarity: 'magic',
      affixes: [{ affixId: 'constructed-policy', values: new Map([
        ['statMods.mana', 120], ['resistances.lightning', 40], ['resistances.cold', 40]]) }] });
    useInventoryStore.setState({ stash: [candidate], ...(managed ? { backpack: Array.from({ length: 100 },
      (_, i) => item(`locked-${String(i)}`, 'items/base/helm-armet', { level: 90, ilvl: 90 })) } : {}) });
    const before = snapshotStores(); assert.ok(before);
    const profile: CampaignProfile = { ...campaignProfiles['amazon-bow-survival-v1'],
      survivalEquipmentPolicy: 'act2-owned-v1', ...(managed ? { survivalRetrievalPolicy: 'stash-room-v1' } : {}) };
    const records: Readonly<Record<string, unknown>>[] = [];
    equipCampaignGear(row => { records.push(row); }, profile);
    const after = snapshotStores(); assert.ok(after);
    const equipment = owner === 'hero' ? after.inventory.equipped : after.mercs.mercEquipment[merc.id];
    expect(equipment?.head?.id).toBe(candidate.id);
    const transfer = records.find(row => row.kind === 'campaign-survival-equip' && row.owner === owner);
    expect(transfer).toMatchObject({ result: { ok: true } });
    const projection = transfer?.after as { manaMax: number };
    expect(projection.manaMax).toBeTypeOf('number');
    expect(projection.manaMax).toBeGreaterThanOrEqual(150);
    expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
    for (const key of ['life', 'mana', 'attack', 'attackSpeed'] as const)
      expect(after.player.derivedStats[key]).toBe(before.player.derivedStats[key]);
    for (const key of ['map', 'formation', 'meta', 'endgame'] as const) expect(after[key]).toEqual(before[key]);
    expect(after.player.coreStats).toEqual(before.player.coreStats);
    expect(after.player.skillLevels).toEqual(before.player.skillLevels);
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
      .toEqual({ xp: 0, addedItems: 0 });
    equipCampaignGear(() => undefined, profile);
    expect(snapshotStores()).toEqual(after);
  });
}

it.each([1, 3])('retains the original Bow equipment behavior outside Act II (act %s)', act => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  createBowFixture();
  const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(definition);
  expect(useMercStore.getState().hireMerc(definition).ok).toBe(true);
  useMapStore.setState({ currentAct: act });
  if (act === 3) {
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().markCleared('areas/act2-tomb-of-tal-rasha');
  }
  useInventoryStore.setState({ stash: [item('stash-defense', 'items/base/helm-cap')] });
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, { ...campaignProfiles['amazon-bow-survival-v1'],
    survivalEquipmentPolicy: 'act2-owned-v1' });
  expect(snapshotStores()).toEqual(before);
  expect(records.some(row => row.kind === 'campaign-survival-gear-decision')).toBe(false);
});

it('grows defensive Bow consecutively with paid missile defense and conserved native resources', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  const { profile }: { profile: CampaignProfile } = campaignRequest('act2', 'amazon-bow-survival-v1');
  expect(createCharacter('Bow defense', 'amazon').ok).toBe(true);
  const initial = snapshotStores(); assert.ok(initial);
  const checkpoints = [
    { level: 1, multi: 0, critical: 1, held: 0 },
    { level: 5, multi: 0, critical: 1, held: 4 },
    { level: 6, multi: 4, critical: 1, held: 0 },
    { level: 11, multi: 9, critical: 1, held: 0 },
    { level: 12, multi: 9, critical: 1, held: 0 },
    { level: 16, multi: 13, critical: 1, held: 0 },
    { level: 23, multi: 20, critical: 1, held: 0 },
    { level: 24, multi: 20, critical: 3, held: 0 },
    { level: 26, multi: 20, critical: 5, held: 0 }
  ];
  let priorRanks = initial.player.skillLevels ?? {};
  // Supplied XP verifies allocation, not earned combat or fresh-route viability.
  for (let level = 1; level <= 26; level++) {
    if (level > 1) expect(usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1)).newLevel).toBe(level);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const player = after.player, ranks = player.skillLevels ?? {};
    expect(Object.values(ranks).reduce((sum, rank) => sum + rank, 0) + player.skillPoints)
      .toBe(level + [12, 24].filter(at => level >= at).length + 1);
    expect(player.statPoints).toBe(0);
    expect(player.coreStats).toEqual({ strength: initial.player.coreStats.strength,
      dexterity: initial.player.coreStats.dexterity + 2 * (level - 1),
      vitality: initial.player.coreStats.vitality + 3 * (level - 1), energy: initial.player.coreStats.energy });
    expect(player.respecsRemaining).toEqual(initial.player.respecsRemaining);
    for (const [id, rank] of Object.entries(priorRanks)) expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    priorRanks = ranks;
    expect(player.comboOrder).toEqual(level < 6 ? ['amazon.magic_arrow']
      : ['amazon.slow_missiles', 'amazon.multiple_shot']);
    const native = playerToCombatUnit(player);
    expect(native.skillOrder).toEqual(level < 6 ? ['amazon.magic_arrow']
      : level < 12 ? ['amazon.multiple_shot'] : ['amazon.slow_missiles', 'amazon.multiple_shot']);
    expect(native.slowMissilesRank).toBe(level < 12 ? 0 : 1);
    expect(scopedSummonConfiguration({ ...player, comboOrder: ['amazon.slow_missiles'] }).skillOrder)
      .toEqual(level < 12 ? [] : ['amazon.slow_missiles']);
    const checkpoint = checkpoints.find(at => at.level === level);
    if (checkpoint) {
      expect(ranks).toEqual({ 'amazon.magic_arrow': 1, 'amazon.critical_strike': checkpoint.critical,
        ...(level >= 6 ? { 'amazon.multiple_shot': checkpoint.multi, 'amazon.dodge': 1 } : {}),
        ...(level >= 12 ? { 'amazon.inner_sight': 1, 'amazon.slow_missiles': 1 } : {}) });
      expect(player.skillPoints).toBe(checkpoint.held);
    }
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(initial[key]);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
  expect(profile.weaponPolicy).toBe('preserve-bow-fallback');
  expect(profile.mercEquipmentPolicy).toBe('monotone-fielded-v1');
});

it('uses the once-only Den payment for defensive Bow prerequisites at the native L12 boundary', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  const { profile } = campaignRequest('act2', 'amazon-bow-survival-v1');
  expect(createCharacter('Bow Den', 'amazon').ok).toBe(true);
  for (let level = 1; level <= 11; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  // Constructed objective/XP fixtures exercise real Claim; they are not earned-route evidence.
  expect(usePlayerStore.getState().gainExperience(xpTotal(12) - xpTotal(11) - 250).newLevel).toBe(11);
  const den = 'quests/act1-den-of-evil';
  useMapStore.getState().updateQuestProgress(den, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  const before = snapshotStores(); assert.ok(before);
  expect(canClaim(den)).toBe(true);
  expect(claimQuestReward(den)).toBe('ok');
  const paid = snapshotStores(); assert.ok(paid);
  expect(paid.player.level).toBe(12);
  expect(paid.player.experience).toBe(250);
  expect(paid.player.skillPoints).toBe(before.player.skillPoints + 3);
  expect(paid.player.statPoints).toBe(before.player.statPoints + 5);
  expect(paid.player.skillLevels).toEqual(before.player.skillLevels);
  expect(canClaim(den)).toBe(false);
  expect(claimQuestReward(den)).toBe('already-claimed');
  expect(snapshotStores()).toEqual(paid);
  const purchases: string[] = [];
  growCampaignBuild(profile, row => {
    if (row.kind === 'allocate-skill') {
      expect(row.result).toBe('ok');
      purchases.push((row.target as { id: string }).id);
    }
  });
  expect(purchases).toEqual(['amazon.inner_sight', 'amazon.slow_missiles', 'amazon.multiple_shot']);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillLevels).toEqual({ 'amazon.magic_arrow': 1, 'amazon.critical_strike': 1,
    'amazon.multiple_shot': 10, 'amazon.dodge': 1, 'amazon.inner_sight': 1, 'amazon.slow_missiles': 1 });
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.statPoints).toBe(0);
  expect(after.player.coreStats).toEqual({ ...before.player.coreStats,
    dexterity: before.player.coreStats.dexterity + 2, vitality: before.player.coreStats.vitality + 3 });
  expect(playerToCombatUnit(after.player).slowMissilesRank).toBe(1);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(paid[key]);
});

it('preserves spent offensive Bow points when opting into defensive Bow on a resumed hero', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  const { profile } = campaignRequest('act2', 'amazon-bow-survival-v1');
  expect(createCharacter('Bow resume', 'amazon').ok).toBe(true);
  for (let level = 1; level <= 16; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(campaignProfiles['amazon-bow-volley-v1'], () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBe(0);
  growCampaignBuild(profile, () => undefined);
  const resumed = snapshotStores(); assert.ok(resumed);
  expect(resumed).toEqual({ ...before, player: { ...before.player,
    comboOrder: ['amazon.slow_missiles', 'amazon.multiple_shot'] } });
  expect(playerToCombatUnit(resumed.player).skillOrder).toEqual(['amazon.multiple_shot']);
  expect(playerToCombatUnit(resumed.player).slowMissilesRank).toBe(0);
  for (const level of [17, 18]) {
    usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
    const player = usePlayerStore.getState().player; assert.ok(player);
    expect(player.skillLevels).toEqual({ ...before.player.skillLevels, 'amazon.inner_sight': 1,
      ...(level === 18 ? { 'amazon.slow_missiles': 1 } : {}) });
    expect(player.coreStats).toEqual({ ...before.player.coreStats,
      dexterity: before.player.coreStats.dexterity + 2 * (level - 16),
      vitality: before.player.coreStats.vitality + 3 * (level - 16) });
    expect(player.skillPoints).toBe(0);
    expect(player.respecsRemaining).toEqual(before.player.respecsRemaining);
  }
});

it('uses the starter arrow until Multiple Shot is learned, preserving native growth and resources', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  const { profile } = campaignRequest('act2', 'amazon-bow-volley-v1');
  expect(createCharacter('Volley growth', 'amazon').ok).toBe(true);
  const created = snapshotStores(); assert.ok(created);
  for (let level = 1; level <= 26; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const player = after.player;
    expect(player.comboOrder).toEqual(level < 6 ? ['amazon.magic_arrow'] : ['amazon.multiple_shot']);
    expect(player.skillLevels?.['amazon.magic_arrow']).toBe(1);
    expect(player.skillLevels?.['amazon.multiple_shot'] ?? 0)
      .toBe(level < 6 ? 0 : Math.min(20, level - 2 + (level >= 12 ? 1 : 0)));
    const milestones = [12, 24].filter(at => level >= at).length;
    expect(Object.values(player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0) + player.skillPoints)
      .toBe(level + milestones + 1);
    expect(player.statPoints).toBe(0);
    expect(player.coreStats).toEqual({ strength: created.player.coreStats.strength,
      dexterity: created.player.coreStats.dexterity + 4 * (level - 1),
      vitality: created.player.coreStats.vitality + level - 1, energy: created.player.coreStats.energy });
    expect(player.respecsRemaining).toEqual(created.player.respecsRemaining);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it('keeps Magic Arrow with an unlearned volley after level six and retains ordinary armor upgrades', () => {
  const { profile } = campaignRequest('act2', 'amazon-bow-volley-v1');
  createBowFixture();
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight'); assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  growCampaignBuild({ ...profile, targets: [] }, () => undefined);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(['amazon.magic_arrow']);
  useInventoryStore.getState().addItem(item('owned-helm', 'items/base/helm-skull-cap'));
  const before = snapshotStores(); assert.ok(before);
  equipCampaignGear(() => undefined, profile);
  const after = snapshotStores(); assert.ok(after);
  expect(after.inventory.equipped.head?.id).toBe('owned-helm');
  expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  expect(campaignProfiles['amazon-bow'].priority).toEqual(['amazon.multiple_shot', 'amazon.magic_arrow']);
});

it('continues Bow investment from cone growth into criticals and dodge without refunds', () => {
  expect(createCharacter('Bow growth', 'amazon').ok).toBe(true);
  const initial = usePlayerStore.getState().player; assert.ok(initial);
  const checkpoints = [
    { level: 6, multi: 4, critical: 1, dodge: 1 },
    { level: 18, multi: 17, critical: 1, dodge: 1 },
    { level: 21, multi: 20, critical: 1, dodge: 1 },
    { level: 30, multi: 20, critical: 11, dodge: 1 },
    { level: 50, multi: 20, critical: 20, dodge: 13 }
  ];
  // Consecutive supplied XP proves lawful allocation only. The historical
  // earned clear used resets/gear; fresh campaign viability remains unproved.
  for (let level = 1; level <= 50; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(bowPolicy, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const player = usePlayerStore.getState().player; assert.ok(player);
    const milestones = [12, 24, 36].filter(at => level >= at).length;
    expect(Object.values(player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0) + player.skillPoints)
      .toBe(level + milestones + 1);
    expect(player.respecsRemaining).toEqual(initial.respecsRemaining);
    expect(player.coreStats).toEqual({ strength: initial.coreStats.strength,
      dexterity: initial.coreStats.dexterity + 4 * (level - 1),
      vitality: initial.coreStats.vitality + level - 1, energy: initial.coreStats.energy });
    const checkpoint = checkpoints.find(at => at.level === level);
    if (checkpoint) {
      expect(player.skillLevels).toEqual({ 'amazon.magic_arrow': 1,
        'amazon.critical_strike': checkpoint.critical, 'amazon.dodge': checkpoint.dodge,
        'amazon.multiple_shot': checkpoint.multi });
      expect(player.skillPoints).toBe(0);
    }
  }
});

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function createBowFixture() {
  expect(createCharacter('Bow policy', 'amazon').ok).toBe(true);
  // Supplied XP exercises native eligibility only; not earned acquisition evidence.
  expect(usePlayerStore.getState().gainExperience(xpTotal(10)).newLevel).toBe(10);
}
function item(id: string, baseId: string, extra: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, ilvl: 1, identified: true,
    equipped: false, socketCapacity: 0, ...extra };
}

it('forwards the intended merc weapon policy through shared campaign equipment without healing or income', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Merc offense QA', 'sorceress').ok).toBe(true);
  const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(definition);
  expect(useMercStore.getState().hireMerc(definition).ok).toBe(true);
  const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
  const weapon = (id: string, attack: number, life: number) => item(id, 'items/base/wp1h-katar', {
    rarity: 'magic', baseRolls: { attack },
    affixes: [{ affixId: 'constructed-life', values: new Map([['statMods.life', life]]) }]
  });
  const heroWeapon = weapon('protected-hero-weapon', 7, 100);
  useInventoryStore.getState().addItem(heroWeapon);
  expect(useInventoryStore.getState().equipItem(heroWeapon, 'weapon').ok).toBe(true);
  const heroOffhand = weapon('protected-hero-offhand', 7, 100);
  useInventoryStore.getState().addItem(heroOffhand);
  expect(useInventoryStore.getState().equipItem(heroOffhand, 'offhand').ok).toBe(true);
  const old = weapon('merc-life-weapon', 7, 20);
  useInventoryStore.getState().addItem(old);
  expect(useMercStore.getState().equipOnMerc(merc.id, 'weapon', old).ok).toBe(true);
  const upgrade = weapon('merc-offense-weapon', 100, 0);
  useInventoryStore.getState().addItem(upgrade);
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, campaignProfiles['sorceress-cold-intended-v1']);
  const after = snapshotStores(); assert.ok(after);
  expect(after.mercs.mercEquipment[merc.id]?.weapon?.id).toBe(upgrade.id);
  expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
  expect(after.inventory.equipped.offhand).toEqual(before.inventory.equipped.offhand);
  expect(after.inventory.backpack).toEqual([old]);
  for (const key of ['player', 'map', 'formation', 'meta', 'endgame'] as const) expect(after[key]).toEqual(before[key]);
  expect(after.mercs.ownedMercs.map(row => ({ ...row, equipment: [] })))
    .toEqual(before.mercs.ownedMercs.map(row => ({ ...row, equipment: [] })));
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), [])).toEqual({ xp: 0, addedItems: 0 });
  expect(records.find(row => row.kind === 'merc-gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ weaponPolicy: 'physical-offense-v1', selected: upgrade.id });
});

function runGear() {
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  const record: CampaignRecord = row => { records.push(row); };
  // These constructed fixtures isolate hero equipment and deliberately own no merc.
  const { mercEquipmentPolicy, ...heroOnlyPolicy } = bowPolicy;
  expect(mercEquipmentPolicy).toBe('monotone-fielded-v1');
  equipCampaignGear(record, heroOnlyPolicy);
  const after = snapshotStores(); assert.ok(after);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  expect(after.player.experience).toBe(before.player.experience);
  expect(after.player.skillPoints).toBe(before.player.skillPoints);
  expect(after.player.statPoints).toBe(before.player.statPoints);
  for (const key of ['map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  return { before, after, records };
}

it('rejects a superior owned wrong-type main weapon without ownership changes', () => {
  createBowFixture();
  useInventoryStore.getState().addItem(item('axe', 'items/base/wp2h-great-axe'));
  const { before, after, records } = runGear();
  expect(after.inventory).toEqual(before.inventory);
  expect(after.player).toEqual(before.player);
  expect(records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: null, candidates: [{ item: { id: 'axe' }, upgrade: true,
      policyRejection: 'requires-bow-fallback' }] });
  expect(records.filter(row => row.kind === 'equip')).toEqual([]);
});

it('rejects an offhand upgrade that would natively displace the two-handed fallback bow', () => {
  createBowFixture();
  // Constructed attack affix offsets the displaced bow, making this a real clear net upgrade.
  useInventoryStore.getState().addItem(item('shield', 'items/base/sh-buckler', { rarity: 'magic',
    affixes: [{ affixId: 'constructed-attack', values: new Map([['statMods.attack', 13]]) }] }));
  const { before, after, records } = runGear();
  expect(after.inventory).toEqual(before.inventory);
  expect(after.player).toEqual(before.player);
  expect(records.find(row => row.kind === 'gear-decision' && row.slot === 'offhand'))
    .toMatchObject({ selected: null, candidates: [{ item: { id: 'shield' }, upgrade: true,
      policyRejection: 'requires-bow-fallback' }] });
  expect(records.filter(row => row.kind === 'equip')).toEqual([]);
});

it('equips the first eligible owned bow upgrade by ID and retains native level gates', () => {
  createBowFixture();
  for (const owned of [item('bow-z', 'items/base/weapon-bow'), item('bow-a', 'items/base/weapon-bow'),
    item('crossbow', 'items/base/weapon-crossbow')]) useInventoryStore.getState().addItem(owned);
  const { before, after, records } = runGear();
  expect(after.inventory.equipped.weapon?.id).toBe('bow-a');
  expect(after.inventory.equipped.offhand).toBeNull();
  expect(after.inventory.backpack).toEqual([
    ...before.inventory.backpack.filter(owned => owned.id !== 'bow-a'),
    { ...before.inventory.equipped.weapon, equipped: false }
  ]);
  expect(records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: 'bow-a', candidates: [
      { item: { id: 'bow-z' }, upgrade: true, policyRejection: null },
      { item: { id: 'bow-a' }, upgrade: true, policyRejection: null },
      { item: { id: 'crossbow' }, eligibility: { eligible: false,
        reasons: [{ kind: 'level', required: 15, current: 10 }] }, upgrade: false }
    ] });
  expect(records.filter(row => row.kind === 'equip')).toHaveLength(1);
});

const paladinPolicies = [campaignProfiles['paladin-zeal'], campaignProfiles['paladin-holy-bolt']] as const;

it.each(paladinPolicies)('pays and selects $auraSelection.id at the first L2 growth without gear', profile => {
  expect(createCharacter('Aura policy', 'paladin').ok).toBe(true);
  const records: Readonly<Record<string, unknown>>[] = [];
  const record: CampaignRecord = row => { records.push(row); };
  const inventory = useInventoryStore.getState();
  growCampaignBuild(profile, record);
  const level1 = usePlayerStore.getState().player; assert.ok(level1);
  expect(level1.selectedAuraId).toBeUndefined();
  expect(level1.skillPoints).toBe(0);
  expect(level1.skillLevels).toEqual({ 'paladin.holy_fire': 1, 'paladin.zeal': 1, 'paladin.sacrifice': 1 });
  expect(records.filter(row => row.kind === 'select-aura')).toEqual([]);
  expect(usePlayerStore.getState().gainExperience(xpTotal(2)))
    .toMatchObject({ newLevel: 2, skillPointsGranted: 1, statPointsGranted: 5 });
  const level2 = usePlayerStore.getState().player; assert.ok(level2);
  records.length = 0;
  growCampaignBuild(profile, record);
  const selected = usePlayerStore.getState().player; assert.ok(selected);
  expect(selected.selectedAuraId).toBe(profile.auraSelection.id);
  expect(selected.skillPoints).toBe(0);
  expect(selected.skillLevels).toEqual({ ...level1.skillLevels, [profile.auraSelection.id]: 1 });
  expect(selected.statPoints).toBe(0);
  for (const key of ['strength', 'dexterity', 'vitality', 'energy'] as const)
    expect(selected.coreStats[key]).toBe(level2.coreStats[key] + profile.statsPerLevel[key]);
  const auraIndex = records.findIndex(row => row.kind === 'select-aura');
  const paymentIndex = records.findIndex(row => row.kind === 'allocate-skill' &&
    (row.target as { id: string }).id === profile.auraSelection.id);
  expect(paymentIndex).toBeGreaterThanOrEqual(0);
  expect(auraIndex).toBeGreaterThan(paymentIndex);
  const aura = records[auraIndex]; assert.ok(aura);
  expect(aura).toMatchObject({ id: profile.auraSelection.id, result: 'ok', selected: profile.auraSelection.id });
  // Native selection changes only selection: no free rank, point, stats or resource refill.
  expect(aura.after).toEqual({ ...(aura.before as object), selectedAuraId: profile.auraSelection.id });
  expect(useInventoryStore.getState()).toBe(inventory);
  records.length = 0;
  growCampaignBuild(profile, record);
  expect(usePlayerStore.getState().player).toEqual(selected);
  expect(records.filter(row => row.kind === 'allocate-skill' || row.kind === 'select-aura')).toEqual([]);
  expect(usePlayerStore.getState().gainExperience(xpTotal(3) - xpTotal(2)).newLevel).toBe(3);
  growCampaignBuild(profile, record);
  expect(usePlayerStore.getState().player?.selectedAuraId).toBe(profile.auraSelection.id);
  expect(usePlayerStore.getState().player?.skillLevels?.[profile.auraSelection.id]).toBe(1);
});

it.each(paladinPolicies)('stops on actual native refusal for unpaid $auraSelection.id', profile => {
  expect(createCharacter('Aura refusal', 'paladin').ok).toBe(true);
  expect(usePlayerStore.getState().gainExperience(xpTotal(2)).newLevel).toBe(2);
  const before = usePlayerStore.getState().player;
  const records: Readonly<Record<string, unknown>>[] = [];
  // Intentionally malformed constructed policy leaves the aura unlearned.
  expect(() => { growCampaignBuild({ ...profile, targets: [] }, row => { records.push(row); }); })
    .toThrow('Campaign aura selection refused');
  expect(usePlayerStore.getState().player).toEqual(before);
  expect(records).toMatchObject([{ kind: 'select-aura', id: profile.auraSelection.id,
    result: 'ineligible', selected: undefined, before, after: before }]);
});

// Independently derived full stored-rank vectors; zero means absent, with no Den grant.
// Every consecutive native level grows; checkpoints include the extra L12 skill point.
const allocationFixtures = [
  { id: "sorceress-cold-nova-focus", keys: ["frost_nova", "ice_bolt", "warmth", "ice_blast"],
    checkpoints: [[1, [1, 1, 1, 0], 0], [2, [1, 1, 1, 0], 1], [5, [1, 1, 1, 0], 4],
      [6, [5, 1, 1, 1], 0], [12, [12, 1, 1, 1], 0], [13, [13, 1, 1, 1], 0], [14, [14, 1, 1, 1], 0]] },
  { id: "sorceress-cold", keys: ["frost_nova", "ice_bolt", "warmth", "ice_blast"],
    checkpoints: [[1, [1, 1, 1, 0], 0], [2, [1, 1, 1, 0], 1], [6, [1, 1, 1, 5], 0], [12, [1, 1, 1, 12], 0], [14, [1, 1, 1, 14], 0]] },
  { id: "sorceress-cold-nova5", keys: ["frost_nova", "ice_bolt", "warmth", "ice_blast"],
    checkpoints: [[1, [1, 1, 1, 0], 0], [2, [1, 1, 1, 0], 1], [5, [1, 1, 1, 0], 4],
      [6, [5, 1, 1, 1], 0], [12, [5, 1, 1, 8], 0], [13, [5, 1, 1, 9], 0], [14, [5, 1, 1, 10], 0]] },
  { id: "sorceress-fire", keys: ["frost_nova", "ice_bolt", "fire_bolt", "warmth", "fire_ball"],
    checkpoints: [[1, [1, 1, 1, 0, 0], 0], [2, [1, 1, 1, 1, 0], 0], [6, [1, 1, 5, 1, 0], 0], [12, [1, 1, 10, 1, 2], 0], [14, [1, 1, 10, 1, 4], 0]] },
  { id: "amazon-bow", keys: ["magic_arrow", "critical_strike", "multiple_shot", "dodge"],
    checkpoints: [[1, [1, 1, 0, 0], 0], [2, [1, 1, 0, 0], 1], [6, [1, 1, 4, 1], 0], [12, [1, 1, 11, 1], 0], [14, [1, 1, 13, 1], 0]] },
  { id: "amazon-javelin", keys: ["magic_arrow", "jab", "critical_strike", "power_strike", "poison_javelin", "dodge"],
    checkpoints: [[1, [1, 1, 0, 0, 0, 0], 0], [2, [1, 1, 1, 0, 0, 0], 0], [6, [1, 4, 1, 1, 0, 0], 0], [12, [1, 4, 1, 6, 1, 1], 0], [14, [1, 4, 1, 8, 1, 1], 0]] },
  { id: "amazon-javelin-poison2", keys: ["magic_arrow", "jab", "critical_strike", "power_strike", "poison_javelin", "dodge"],
    checkpoints: [[1, [1, 1, 0, 0, 0, 0], 0], [2, [1, 1, 1, 0, 0, 0], 0], [6, [1, 3, 1, 1, 1, 0], 0], [12, [1, 3, 1, 6, 2, 1], 0], [14, [1, 3, 1, 8, 2, 1], 0]] },
  { id: "amazon-javelin-poison2-impale1", keys: ["magic_arrow", "jab", "critical_strike", "power_strike", "poison_javelin", "dodge", "impale"],
    checkpoints: [[1, [1, 1, 0, 0, 0, 0, 0], 0], [2, [1, 1, 1, 0, 0, 0, 0], 0], [5, [1, 3, 1, 0, 0, 0, 0], 1], [6, [1, 3, 1, 1, 1, 0, 0], 0], [7, [1, 3, 1, 1, 2, 0, 0], 0], [8, [1, 3, 1, 1, 2, 1, 0], 0], [11, [1, 3, 1, 4, 2, 1, 0], 0], [12, [1, 3, 1, 5, 2, 1, 1], 0], [14, [1, 3, 1, 7, 2, 1, 1], 0]] },
  { id: "assassin-martial", keys: ["shock_web", "dragon_talon", "tiger_strike", "cobra_strike"],
    checkpoints: [[1, [1, 1, 0, 0], 0], [2, [1, 1, 1, 0], 0], [6, [1, 5, 1, 0], 0], [12, [1, 11, 1, 1], 0], [14, [1, 13, 1, 1], 0]] },
  { id: "assassin-traps", keys: ["shock_web", "fire_blast", "charged_bolt_sentry"],
    checkpoints: [[1, [1, 1, 0], 0], [2, [1, 1, 0], 1], [6, [6, 1, 0], 0], [12, [6, 1, 7], 0], [14, [6, 1, 9], 0]] },
  { id: "necromancer-summon", keys: ["raise_skeleton", "skeleton_mastery", "clay_golem", "raise_skeletal_mage", "amplify_damage"],
    checkpoints: [[1, [1, 1, 0, 0, 0], 0], [2, [1, 1, 0, 0, 1], 0], [6, [4, 1, 1, 0, 1], 0], [12, [10, 1, 1, 1, 1], 0], [14, [12, 1, 1, 1, 1], 0]] },
  { id: "necromancer-bone", keys: ["raise_skeleton", "teeth", "bone_armor", "corpse_explosion", "bone_wall"],
    checkpoints: [[1, [1, 1, 0, 0, 0], 0], [2, [1, 1, 1, 0, 0], 0], [6, [1, 4, 1, 1, 0], 0], [12, [1, 10, 1, 1, 1], 0], [14, [1, 12, 1, 1, 1], 0]] },
  { id: "barbarian-double-swing", keys: ["bash", "howl", "shout", "increased_stamina", "double_swing"],
    checkpoints: [[1, [1, 1, 0, 0, 0], 0], [2, [2, 1, 0, 0, 0], 0], [6, [3, 1, 1, 0, 2], 0], [12, [3, 1, 1, 1, 8], 0], [14, [3, 1, 1, 1, 10], 0]] },
  { id: "barbarian-double-throw", keys: ["bash", "howl", "shout", "increased_stamina", "double_swing", "double_throw"],
    checkpoints: [[1, [1, 1, 0, 0, 0, 0], 0], [2, [2, 1, 0, 0, 0, 0], 0], [6, [3, 1, 1, 0, 1, 0], 1], [12, [3, 1, 1, 1, 1, 7], 0], [14, [3, 1, 1, 1, 1, 9], 0]] },
  { id: "paladin-zeal", keys: ["holy_fire", "zeal", "sacrifice", "might"],
    checkpoints: [[1, [1, 1, 1, 0], 0], [2, [1, 1, 1, 1], 0], [6, [1, 1, 5, 1], 0], [12, [1, 8, 5, 1], 0], [14, [1, 10, 5, 1], 0]] },
  { id: "paladin-holy-bolt", keys: ["holy_fire", "zeal", "sacrifice", "prayer", "holy_bolt"],
    checkpoints: [[1, [1, 1, 1, 0, 0], 0], [2, [1, 1, 1, 1, 0], 0], [6, [1, 1, 1, 1, 4], 0], [12, [1, 1, 1, 1, 11], 0], [14, [1, 1, 1, 1, 13], 0]] },
  { id: "druid-fire", keys: ["summon_dire_wolf", "firestorm", "oak_sage", "molten_boulder", "fissure"],
    checkpoints: [[1, [1, 2, 0, 0, 0], 0], [2, [1, 3, 0, 0, 0], 0], [6, [1, 5, 1, 1, 0], 0], [12, [1, 5, 1, 1, 7], 0], [14, [1, 5, 1, 1, 9], 0]] },
  { id: "druid-summon", keys: ["summon_dire_wolf", "firestorm", "raven", "poison_creeper", "oak_sage", "carrion_vine", "summon_spirit_wolf"],
    checkpoints: [[1, [1, 1, 1, 0, 0, 0, 0], 0], [2, [1, 1, 2, 0, 0, 0, 0], 0], [6, [1, 1, 3, 1, 1, 0, 1], 0], [12, [1, 1, 3, 1, 1, 1, 7], 0], [14, [1, 1, 3, 1, 1, 1, 9], 0]] },
 ] as const;
const starterRanks = {
  sorceress: { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 },
  amazon: { 'amazon.magic_arrow': 1 }, assassin: { 'assassin.shock_web': 1 },
  necromancer: { 'necromancer.raise_skeleton': 1 }, barbarian: { 'barbarian.bash': 1 },
  paladin: { 'paladin.holy_fire': 1, 'paladin.zeal': 1 },
  druid: { 'druid.summon_dire_wolf': 1, 'druid.firestorm': 1 }
} as const;

it('grows the Necromancer summon support policy with native prerequisites and conserved points', () => {
  const profile: CampaignProfile = campaignProfiles['necromancer-summon'];
  expect(createCharacter('Summon support', 'necromancer').ok).toBe(true);
  const initial = snapshotStores(); assert.ok(initial);
  const checkpoints = [
    { level: 30, mastery: 18, global: 0, mage: 1, support: false },
    { level: 40, mastery: 20, global: 2, mage: 1, support: true },
    { level: 53, mastery: 20, global: 15, mage: 1, support: true },
    { level: 60, mastery: 20, global: 20, mage: 3, support: true }
  ];
  for (let level = 1; level <= 60; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const player = usePlayerStore.getState().player; assert.ok(player);
    const ranks = player.skillLevels ?? {};
    const milestones = [12, 24, 36].filter(at => level >= at).length;
    expect(Object.values(ranks).reduce((sum, rank) => sum + rank, 0) + player.skillPoints)
      .toBe(level + milestones + 1); // One native starter rank and creation's spendable point.
    expect(player.statPoints).toBe(0);
    expect(player.coreStats).toEqual({ strength: 15, dexterity: 25 + level - 1,
      vitality: 15 + 3 * (level - 1), energy: 25 + level - 1 });
    expect(player.respecsRemaining).toEqual(initial.player.respecsRemaining);
    const checkpoint = checkpoints.find(at => at.level === level);
    if (checkpoint) {
      const expected = { 'necromancer.raise_skeleton': 12,
        'necromancer.skeleton_mastery': checkpoint.mastery, 'necromancer.clay_golem': 1,
        'necromancer.raise_skeletal_mage': checkpoint.mage, 'necromancer.amplify_damage': 1,
        ...(checkpoint.global ? { 'necromancer.summon_mastery': checkpoint.global } : {}),
        ...(checkpoint.support ? { 'necromancer.iron_maiden': 1, 'necromancer.life_tap': 1,
          'necromancer.weaken': 1, 'necromancer.terror': 1, 'necromancer.decrepify': 1,
          'necromancer.dim_vision': 1, 'necromancer.confuse': 1 } : {}) };
      expect(ranks).toEqual(expected);
      expect(player.skillPoints).toBe(0);
      if (checkpoint.support) expect(scopedSummonConfiguration(player).skillOrder).toEqual([
        'necromancer.raise_skeleton', 'necromancer.clay_golem', 'necromancer.raise_skeletal_mage',
        'necromancer.confuse', 'necromancer.iron_maiden', 'necromancer.amplify_damage'
      ]);
    }
  }
  const beforeRepeat = snapshotStores(); assert.ok(beforeRepeat);
  const repeatState = observeEarnedState();
  const repeat: Readonly<Record<string, unknown>>[] = [];
  growCampaignBuild(profile, row => { repeat.push(row); });
  expect(observeEarnedState()).toEqual(repeatState);
  expect(repeat.filter(row => row.kind === 'allocate-skill' || row.kind === 'allocate-stats')).toEqual([]);
  for (const domain of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(beforeRepeat[domain]).toEqual(initial[domain]);
});

it.each(allocationFixtures)('uses native creation and conserves constructed growth for $id', fixture => {
  const profile: CampaignProfile | undefined = campaignProfiles[fixture.id];
  assert.ok(profile, `Missing reviewed campaign profile: ${fixture.id}`);
  expect(createCharacter('Profile fixture', profile.classId).ok).toBe(true);
  const initial = snapshotStores(); assert.ok(initial);
  expect(initial.player.skillLevels).toEqual(starterRanks[profile.classId]);
  expect(initial.player.skillPoints).toBe(1);
  expect(initial.player.selectedAuraId).toBeUndefined();
  const owned = Object.values(initial.inventory.equipped).filter(value => value !== null);
  if (profile.classId === 'amazon') {
    expect(owned).toHaveLength(1);
    expect(initial.inventory.equipped.weapon).toMatchObject({
      baseId: 'items/base/weapon-bow-training', baseRolls: { attack: 13 } });
  } else expect(owned).toEqual([]);
  const grantedRanks = Object.values(starterRanks[profile.classId]).reduce<number>((sum, rank) => sum + rank, 0);
  for (let level = 1; level <= 14; level++) {
    if (level > 1) expect(usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1)).newLevel).toBe(level);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats' || row.kind === 'select-aura')
        expect(row.result).toBe('ok');
    });
    const player = usePlayerStore.getState().player; assert.ok(player);
    const ranks = player.skillLevels ?? {};
    expect(Object.values(ranks).reduce((sum, rank) => sum + rank, 0) - grantedRanks + player.skillPoints)
      .toBe(level + (level >= 12 ? 1 : 0));
    expect(player.statPoints).toBe(0);
    for (const key of ['strength', 'dexterity', 'vitality', 'energy'] as const)
      expect(player.coreStats[key]).toBe(initial.player.coreStats[key] + (level - 1) * profile.statsPerLevel[key]);
    expect(player.comboOrder).toEqual(profile.priority);
    if (fixture.id === 'amazon-javelin-poison2-impale1') {
      expect(ranks['amazon.impale'] ?? 0).toBe(level >= 12 ? 1 : 0);
      expect(scopedSummonConfiguration(player).skillOrder.includes('amazon.impale')).toBe(level >= 12);
    }
    expect(player.selectedAuraId).toBe(level >= 2 ? profile.auraSelection?.id : undefined);
    const checkpoint = fixture.checkpoints.find(([at]) => at === level);
    if (checkpoint) {
      const [, vector, held] = checkpoint;
      expect(ranks).toEqual(Object.fromEntries(fixture.keys.flatMap((key, index) => {
        const rank = vector[index]; assert.ok(rank !== undefined);
        return rank > 0 ? [[`${profile.classId}.${key}`, rank]] : [];
      })));
      expect(player.skillPoints).toBe(held);
    }
  }
  const final = snapshotStores(); assert.ok(final);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(final[key]).toEqual(initial[key]);
});


it('retains native Impale level and prerequisite refusals and pays exactly one legal point', () => {
  expect(createCharacter('Impale guards', 'amazon').ok).toBe(true);
  expect(usePlayerStore.getState().gainExperience(xpTotal(11)).newLevel).toBe(11);
  const locked = observeEarnedState(); assert.ok(locked.player.player);
  expect(locked.player.player.skillPoints).toBeGreaterThan(0);
  expect(usePlayerStore.getState().allocateSkillPoint('amazon.impale')).toBe('level-too-low');
  expect(observeEarnedState()).toEqual(locked);
  expect(usePlayerStore.getState().gainExperience(xpTotal(12) - xpTotal(11)).newLevel).toBe(12);
  const missing = observeEarnedState(); assert.ok(missing.player.player);
  expect(missing.player.player.skillPoints).toBeGreaterThan(0);
  expect(usePlayerStore.getState().allocateSkillPoint('amazon.impale')).toBe('prereq-missing');
  expect(observeEarnedState()).toEqual(missing);
  expect(usePlayerStore.getState().allocateSkillPoint('amazon.jab')).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint('amazon.power_strike')).toBe('ok');
  const before = observeEarnedState(); assert.ok(before.player.player);
  expect(usePlayerStore.getState().allocateSkillPoint('amazon.impale')).toBe('ok');
  expect(observeEarnedState()).toEqual({ ...before, player: { ...before.player,
    player: { ...before.player.player, skillPoints: before.player.player.skillPoints - 1,
      skillLevels: { ...before.player.player.skillLevels, 'amazon.impale': 1 } } } });
});

const denBoundaryFixtures = [
  { id: 'amazon-javelin-poison2', power: 7, impale: 0 },
  { id: 'amazon-javelin-poison2-impale1', power: 6, impale: 1 }
] as const;

it.each(denBoundaryFixtures)('accounts once-only actual Den payment at constructed L12 growth for $id', fixture => {
  const profile = campaignProfiles[fixture.id];
  expect(createCharacter('Den allocation', 'amazon').ok).toBe(true);
  const initial = snapshotStores(); assert.ok(initial);
  // Supplied consecutive XP and completed objective flags isolate actual Claim/allocation.
  // They do not prove earned Den reachability or campaign viability.
  for (let level = 1; level <= 11; level++) {
    if (level > 1) expect(usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1)).newLevel).toBe(level);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
  }
  expect(usePlayerStore.getState().gainExperience(xpTotal(12) - xpTotal(11) - 250))
    .toMatchObject({ newLevel: 11, levelsGained: 0, skillPointsGranted: 0, statPointsGranted: 0 });
  const den = 'quests/act1-den-of-evil';
  useMapStore.getState().updateQuestProgress(den, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  const before = usePlayerStore.getState().player; assert.ok(before);
  expect(before.skillPoints).toBe(0);
  expect(before.skillLevels?.['amazon.impale']).toBeUndefined();
  expect(canClaim(den)).toBe(true);
  expect(claimQuestReward(den)).toBe('ok');
  const paid = usePlayerStore.getState().player; assert.ok(paid);
  expect(xpTotal(paid.level) + paid.experience).toBe(xpTotal(before.level) + before.experience + 500);
  expect(paid.level).toBe(12);
  expect(paid.experience).toBe(250);
  expect(paid.skillPoints).toBe(before.skillPoints + 3); // level + L12 milestone + actual Den point
  expect(paid.statPoints).toBe(before.statPoints + 5);
  expect(paid.skillLevels).toEqual(before.skillLevels);
  expect(useMapStore.getState().questProgress[den]?.rewardClaimed).toBe(true);
  expect(canClaim(den)).toBe(false);
  const claimed = observeEarnedState();
  expect(claimQuestReward(den)).toBe('already-claimed');
  expect(observeEarnedState()).toEqual(claimed);
  const beforeGrowth = snapshotStores(); assert.ok(beforeGrowth);
  const purchases: string[] = [];
  growCampaignBuild(profile, row => {
    if (row.kind === 'allocate-skill') {
      expect(row.result).toBe('ok');
      purchases.push((row.target as { id: string }).id);
    } else if (row.kind === 'allocate-stats') expect(row.result).toBe('ok');
  });
  expect(purchases).toEqual(fixture.impale
    ? ['amazon.impale', 'amazon.power_strike', 'amazon.power_strike']
    : ['amazon.power_strike', 'amazon.power_strike', 'amazon.power_strike']);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillLevels).toEqual({
    'amazon.magic_arrow': 1, 'amazon.jab': 3, 'amazon.critical_strike': 1,
    'amazon.power_strike': fixture.power, 'amazon.poison_javelin': 2, 'amazon.dodge': 1,
    ...(fixture.impale ? { 'amazon.impale': 1 } : {})
  });
  expect(after.player.skillPoints).toBe(0);
  expect(Object.values(after.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)
    - 1 + after.player.skillPoints).toBe(12 + 1 + 1); // levels + milestone + once-only Den
  expect(after.player.statPoints).toBe(0);
  for (const key of ['strength', 'dexterity', 'vitality', 'energy'] as const)
    expect(after.player.coreStats[key]).toBe(initial.player.coreStats[key] + 11 * profile.statsPerLevel[key]);
  expect(after.player.comboOrder).toEqual(profile.priority);
  expect(scopedSummonConfiguration(after.player).skillOrder.includes('amazon.impale')).toBe(fixture.impale === 1);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(beforeGrowth[key]);
});

it('spends the actual once-only Den point on Blast after legally purchasing Nova5', () => {
  const profile = campaignProfiles['sorceress-cold-nova5'];
  assert.ok(profile, 'Missing reviewed campaign profile: sorceress-cold-nova5');
  expect(createCharacter('Nova Den', 'sorceress').ok).toBe(true);
  // Supplied XP/objectives isolate native allocation and Claim, not earned reachability.
  expect(usePlayerStore.getState().gainExperience(xpTotal(12)).newLevel).toBe(12);
  growCampaignBuild(profile, () => undefined);
  const allocated = usePlayerStore.getState().player; assert.ok(allocated);
  expect(allocated.skillLevels).toEqual({ 'sorceress.frost_nova': 5,
    'sorceress.ice_bolt': 1, 'sorceress.warmth': 1, 'sorceress.ice_blast': 8 });
  expect(allocated.skillPoints).toBe(0);
  const den = 'quests/act1-den-of-evil';
  useMapStore.getState().updateQuestProgress(den, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  expect(claimQuestReward(den)).toBe('ok');
  const paid = usePlayerStore.getState().player; assert.ok(paid);
  expect(paid.level).toBe(12);
  expect(paid.experience).toBe(allocated.experience + 500);
  expect(paid.skillPoints).toBe(1);
  expect(paid.skillLevels).toEqual(allocated.skillLevels);
  const claimed = observeEarnedState();
  expect(claimQuestReward(den)).toBe('already-claimed');
  expect(observeEarnedState()).toEqual(claimed);
  growCampaignBuild(profile, () => undefined);
  const after = observeEarnedState(); assert.ok(after.player.player);
  expect(after.player.player).toEqual({ ...paid, skillPoints: 0,
    skillLevels: { ...paid.skillLevels, 'sorceress.ice_blast': 9 } });
  for (const key of ['inventory', 'map', 'merc', 'formation', 'meta'] as const)
    expect(after[key]).toEqual(claimed[key]);
});

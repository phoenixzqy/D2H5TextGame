/** Constructed owned gear verifies selection and custody, not acquisition odds or balance. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import type { CharacterClass } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { xpTotal } from '@/engine/progression/xp';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { armIronGolemSelection } from '@/stores/ironGolemSelectionStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { equipCampaignGear, growCampaignBuild } from './actions';
import { intendedCampaignProfiles } from './intended-profiles';
import type { CampaignProfile } from './policy';
import { campaignEconomy, auditCampaignEconomy } from './economy';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const item = (id: string, baseId: string, attack?: number): Item => ({ id, baseId,
  rarity: 'normal', level: 1, ilvl: 1, identified: true, equipped: false,
  ...(attack === undefined ? {} : { baseRolls: { attack } }) });
const save = () => { const result = snapshotStores(); assert.ok(result); return structuredClone(result); };
function create(classId: CharacterClass) {
  expect(createCharacter('Owned build QA', classId).ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
}
function conserved(before: ReturnType<typeof save>) {
  const after = save();
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  for (const key of ['map', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(after.mercs).toEqual({ ...before.mercs, mercEquipment: after.mercs.mercEquipment,
    ownedMercs: before.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: after.mercs.ownedMercs.find(current => current.id === merc.id)?.equipment })) });
  expect(after.player).toEqual({ ...before.player, equipment: after.player.equipment,
    derivedStats: after.player.derivedStats });
  expect(after.player.derivedStats.life).toBe(before.player.derivedStats.life);
  expect(after.player.derivedStats.mana).toBe(before.player.derivedStats.mana);
}

const corpseProfile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
function prepareCorpse(level = 24) {
  create('necromancer');
  usePlayerStore.getState().gainExperience(xpTotal(level));
  growCampaignBuild(corpseProfile, () => undefined);
}
const physicalWeapon = (id: string, attack: number, mods: Readonly<Record<string, number>> = {},
  baseId = 'items/base/wp1h-katar'): Item => ({ ...item(id, baseId, attack), rarity: 'magic',
  affixes: [{ affixId: 'constructed-physical-preparation', values: new Map(Object.entries(mods)) }] });

it('Double Swing keeps its invested sword mastery active when selecting owned weapons', () => {
  create('barbarian');
  const profile = intendedCampaignProfiles['barbarian-double-swing-intended-v1'];
  for (let level = 1; level <= 49; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const old = physicalWeapon('swing-current-sword', 7, {}, 'items/base/wp1h-scimitar');
  const sword = physicalWeapon('swing-better-sword', 46, {}, 'items/base/wp1h-scimitar');
  const axe = physicalWeapon('swing-high-raw-axe', 300, {}, 'items/base/wp2h-great-axe');
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  useInventoryStore.getState().addItem(sword);
  useInventoryStore.getState().addItem(axe);
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, profile);
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe(sword.id);
  const decision = records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon');
  const expectedAxe: unknown = expect.objectContaining({ id: axe.id });
  const expectedRejection: unknown = expect.objectContaining({
    item: expectedAxe, policyRejection: 'requires-build-weapon'
  });
  expect(decision).toMatchObject({ selected: sword.id });
  expect(decision?.candidates).toEqual(expect.arrayContaining([expectedRejection]));
  expect(usePlayerStore.getState().player?.skillLevels?.['barbarian.sword_mastery']).toBeGreaterThan(0);
  conserved(before);
});

it('selects owned physical first-kill weapons with defensive tradeoffs and native two-hand custody', () => {
  prepareCorpse();
  const old = physicalWeapon('old-defense', 7, { 'statMods.defense': 50 });
  const shield = item('old-shield', 'items/base/sh-buckler');
  for (const gear of [old, shield]) {
    useInventoryStore.getState().addItem(gear);
    expect(useInventoryStore.getState().equipItem(gear).ok).toBe(true);
  }
  const a = physicalWeapon('strong-a', 46, {}, 'items/base/weapon-polearm');
  const z = physicalWeapon('strong-z', 46, {}, 'items/base/weapon-polearm');
  useInventoryStore.setState({ stash: [z, a] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, corpseProfile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(a.id);
  expect(after.inventory.equipped.offhand ?? null).toBeNull();
  expect(after.player.derivedStats.attack).toBeGreaterThan(before.player.derivedStats.attack);
  expect(after.player.derivedStats.defense).toBeLessThan(before.player.derivedStats.defense);
  expect(records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: a.id });
  conserved(before);
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save()).toEqual(after);
});

it.each([
  { source: 'stash', bag: 119, stash: 293, stages: 21 },
  { source: 'backpack', bag: 119, stash: 293, stages: 20 },
  { source: 'stash', bag: 100, stash: 499, stages: 2 },
  { source: 'stash', bag: 99, stash: 500, stages: 1 }
] as const)('reserves native two-hand displacement room from $source at $bag/$stash', fixture => {
  prepareCorpse();
  const old = physicalWeapon('old-defense', 7, { 'statMods.defense': 50 });
  const shield = item('old-shield', 'items/base/sh-buckler');
  for (const gear of [old, shield]) {
    useInventoryStore.getState().addItem(gear);
    expect(useInventoryStore.getState().equipItem(gear).ok).toBe(true);
  }
  const selected = physicalWeapon('strong-twohand', 46, {}, 'items/base/weapon-polearm');
  const locked = (id: string) => item(id, 'items/base/helm-armet');
  useInventoryStore.setState({
    backpack: [...(fixture.source === 'backpack' ? [selected] : []),
      ...Array.from({ length: fixture.bag - Number(fixture.source === 'backpack') },
        (_, i) => locked(`bag-locked-${String(i).padStart(3, '0')}`))],
    stash: [...(fixture.source === 'stash' ? [selected] : []),
      ...Array.from({ length: fixture.stash - Number(fixture.source === 'stash') },
        (_, i) => locked(`stash-locked-${String(i).padStart(3, '0')}`))]
  });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  let backpackAfterHeroEquip: number | undefined;
  equipCampaignGear(row => {
    records.push(row);
    if (row.kind === 'equip') backpackAfterHeroEquip = save().inventory.backpack.length;
  }, corpseProfile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(selected.id);
  expect(after.inventory.equipped.offhand).toBeNull();
  expect(backpackAfterHeroEquip).toBe(100);
  // The unchanged companion policy then equips both displaced pieces from the bag.
  expect(records.filter(row => row.kind === 'merc-equip').map(row => (row.item as Item).id).sort())
    .toEqual([old.id, shield.id].sort());
  expect(after.inventory.backpack).toHaveLength(98);
  expect(records.filter(row => row.kind === 'campaign-gear-stage')).toHaveLength(fixture.stages);
  expect(records.filter(row => row.kind === 'equip')).toHaveLength(1);
  conserved(before);
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save()).toEqual(after);
});

it('ranks physical weapons by native capped action cadence rather than unbounded speed', () => {
  prepareCorpse();
  const best = physicalWeapon('best-native-cadence', 8, { 'statMods.attackSpeed': 300 });
  const fast = physicalWeapon('over-cap-speed', 7, { 'statMods.attackSpeed': 900 });
  useInventoryStore.setState({ stash: [fast, best] });
  const before = save();
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save().inventory.equipped.weapon?.id).toBe(best.id);
  conserved(before);
});

it('includes native critical chance and overflow when selecting physical weapons', () => {
  prepareCorpse();
  const heavy = physicalWeapon('higher-base-attack', 46, { 'statMods.defense': 1 });
  const critical = physicalWeapon('critical-offense', 38,
    { 'statMods.critChance': 1.2, 'statMods.critDamage': 1 });
  useInventoryStore.setState({ stash: [heavy, critical] });
  const before = save();
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save().inventory.equipped.weapon?.id).toBe(critical.id);
  conserved(before);
});

it('declares physical hero weapon preparation only for the six explicit intended identities', () => {
  expect(Object.entries(intendedCampaignProfiles).filter(([, profile]) => 'heroWeaponPolicy' in profile)
    .map(([id]) => id)).toEqual(['amazon-bow-intended-v1', 'amazon-javelin-intended-v1', 'necromancer-bone-intended-v1',
      'barbarian-double-swing-intended-v1', 'barbarian-double-throw-intended-v1',
      'assassin-martial-intended-v1']);
  expect(intendedCampaignProfiles['amazon-bow-intended-v1'])
    .toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 1 });
  expect(intendedCampaignProfiles['amazon-javelin-intended-v1'])
    .toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 12 });
  expect(corpseProfile).toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 24 });
  expect(intendedCampaignProfiles['barbarian-double-swing-intended-v1'])
    .toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 6 });
  expect(intendedCampaignProfiles['barbarian-double-throw-intended-v1'])
    .toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 12 });
  expect(intendedCampaignProfiles['assassin-martial-intended-v1'])
    .toHaveProperty('heroWeaponPolicy', { kind: 'physical-offense-v1', level: 1 });
});

it.each([1, 49])('Martial selects an owned offensive claw despite a socket defense tradeoff at level %i', level => {
  create('assassin');
  if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level));
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  growCampaignBuild(profile, () => undefined);
  const old: Item = { ...physicalWeapon('martial-socketed-claw', level === 1 ? 4 : 11,
    {}, level === 1 ? 'items/base/wp1h-katar' : 'items/base/wp1h-wrist-blade'),
    socketCapacity: 1, socketContents: [{ kind: 'gem', id: 'gems/diamond/flawed' }] };
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  const selected = physicalWeapon('martial-owned-claw', level === 1 ? 8 : 23,
    {}, level === 1 ? 'items/base/wp1h-katar' : 'items/base/wp1h-greater-claws');
  const nonclaw = physicalWeapon('martial-high-attack-nonclaw', 300, {}, 'items/base/weapon-staff');
  // Item level40 does not override the Feral Claws base's level50 requirement.
  const locked = { ...physicalWeapon('martial-level-locked-claw', 55, {}, 'items/base/wp1h-feral-claws'),
    level: 40, ilvl: 40 };
  useInventoryStore.setState({ stash: [nonclaw, locked, selected] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  let mainhandMagicResist: number | undefined;
  equipCampaignGear(row => {
    records.push(row);
    if (row.kind === 'equip' && row.slot === 'weapon')
      mainhandMagicResist = usePlayerStore.getState().player?.derivedStats.magicResist;
  }, profile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(selected.id);
  expect(after.player.derivedStats.attack).toBeGreaterThan(before.player.derivedStats.attack);
  // The ordinary offhand pass may subsequently equip the displaced socketed claw.
  expect(mainhandMagicResist).toBeLessThan(before.player.derivedStats.magicResist);
  const expectedEligibility: unknown = expect.objectContaining({ eligible: false });
  const expectedCandidates: unknown = expect.arrayContaining([
      expect.objectContaining({ item: nonclaw, policyRejection: 'requires-build-weapon' }),
      expect.objectContaining({ item: locked, eligibility: expectedEligibility })
    ]);
  expect(records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon'))
    .toMatchObject({ selected: selected.id, candidates: expectedCandidates });
  conserved(before);
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(after);
});

it('Martial retains its claw when a defensive replacement lowers physical offense', () => {
  create('assassin');
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  const old = physicalWeapon('martial-retained-attack', 8);
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  useInventoryStore.setState({ stash: [physicalWeapon('martial-lower-offense', 4,
    { 'statMods.magicResist': 100 })] });
  const before = save();
  equipCampaignGear(() => undefined, profile);
  expect(save().inventory.equipped.weapon?.id).toBe(old.id);
  conserved(before);
});

it.each([
  { profile: 'barbarian-double-swing-intended-v1', level: 6, active: true },
  { profile: 'barbarian-double-swing-intended-v1', level: 49, active: true },
  { profile: 'barbarian-double-swing-intended-v1', level: 5, active: false },
  { profile: 'barbarian-double-throw-intended-v1', level: 12, active: true },
  { profile: 'barbarian-double-throw-intended-v1', level: 49, active: true },
  { profile: 'barbarian-double-throw-intended-v1', level: 11, active: false }
] as const)('uses owned offensive tradeoffs for $profile at level $level only after unlock', fixture => {
  create('barbarian');
  usePlayerStore.getState().gainExperience(xpTotal(fixture.level));
  const profile = intendedCampaignProfiles[fixture.profile];
  growCampaignBuild(profile, () => undefined);
  const base = fixture.profile === 'barbarian-double-throw-intended-v1'
    ? 'items/base/weapon-throwing-knife' : 'items/base/weapon-staff';
  const old = physicalWeapon('retained-defense', 2, { 'statMods.defense': 50 }, base);
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  const selected = physicalWeapon('owned-offense', 8, {}, base);
  useInventoryStore.setState({ stash: [selected] });
  const before = save();
  let mainhandDefense: number | undefined;
  equipCampaignGear(row => {
    if (row.kind === 'equip' && row.slot === 'weapon')
      mainhandDefense = usePlayerStore.getState().player?.derivedStats.defense;
  }, profile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(fixture.active ? selected.id : old.id);
  if (fixture.active) {
    expect(after.player.derivedStats.attack).toBeGreaterThan(before.player.derivedStats.attack);
    // A later native offhand equip may recover defense from the displaced knife.
    expect(mainhandDefense).toBeLessThan(before.player.derivedStats.defense);
  }
  conserved(before);
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(after);
});

it('acquires first throwing affinity even when active physical scoring prefers its current staff', () => {
  create('barbarian');
  usePlayerStore.getState().gainExperience(xpTotal(12));
  const intended = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  growCampaignBuild(intended, () => undefined);
  const staff = physicalWeapon('strong-current-staff', 18, {}, 'items/base/weapon-staff');
  useInventoryStore.getState().addItem(staff);
  expect(useInventoryStore.getState().equipItem(staff).ok).toBe(true);
  const throwing = physicalWeapon('first-throwing', 2, {}, 'items/base/weapon-throwing-knife');
  useInventoryStore.setState({ stash: [throwing] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  const profile: CampaignProfile = { ...intended, heroWeaponPolicy: { kind: 'physical-offense-v1', level: 12 } };
  equipCampaignGear(row => { records.push(row); }, profile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(throwing.id);
  expect(after.player.derivedStats.attack).toBeLessThan(before.player.derivedStats.attack);
  const decision = records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon');
  expect(decision?.candidates).toEqual(expect.arrayContaining([
    expect.objectContaining({ item: throwing, acquiresWeaponAffinity: true, upgrade: true }) ]));
  const choices = decision?.candidates as readonly {
    item: Item; physicalOffense?: { current: number; candidate: number }
  }[];
  const choice = choices.find(row => row.item.id === throwing.id);
  assert.ok(choice?.physicalOffense);
  expect(choice.physicalOffense.candidate).toBeLessThan(choice.physicalOffense.current);
  conserved(before);
  useInventoryStore.getState().addItem(physicalWeapon('strong-incompatible-staff', 18, {}, 'items/base/weapon-staff'));
  const equipped = save();
  equipCampaignGear(() => undefined, profile);
  expect(save().inventory.equipped.weapon?.id).toBe(throwing.id);
  conserved(equipped);
});

it.each(['early-corpse', 'other-build'] as const)('retains defensive weapon policy for %s', phase => {
  prepareCorpse(phase === 'early-corpse' ? 23 : 24);
  const old = physicalWeapon('old-defense', 7, { 'statMods.defense': 50 });
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  useInventoryStore.setState({ stash: [physicalWeapon('offense', 46, {}, 'items/base/weapon-polearm')] });
  const before = save();
  equipCampaignGear(() => undefined, phase === 'early-corpse' ? corpseProfile :
    intendedCampaignProfiles['necromancer-summon-intended-v1']);
  expect(save()).toEqual(before);
});

it('retains its physical mainhand when additional capped speed gives no offensive improvement', () => {
  prepareCorpse();
  const old = physicalWeapon('current-capped', 8, { 'statMods.attackSpeed': 300 }, 'items/base/weapon-staff');
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  useInventoryStore.setState({ stash: [physicalWeapon('equal-offense', 8,
    { 'statMods.attackSpeed': 900, 'statMods.defense': 100 }, 'items/base/weapon-staff')] });
  const before = save();
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save()).toEqual(before);
});

it('excludes reserved and ineligible offensive mainhands before native transfer', () => {
  prepareCorpse();
  const reserved = physicalWeapon('reserved-offense', 46, {}, 'items/base/weapon-polearm');
  const locked = physicalWeapon('ineligible-offense', 46, {}, 'items/base/wp1h-war-sword');
  useInventoryStore.setState({ stash: [locked, reserved] });
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  armIronGolemSelection(hero.id, reserved.id, true);
  const before = save();
  equipCampaignGear(() => undefined, corpseProfile);
  expect(save()).toEqual(before);
});

it('falls back to an owned backpack physical upgrade when both native containers are full', () => {
  prepareCorpse();
  const old = physicalWeapon('old-defense', 4, { 'statMods.defense': 50 });
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  const fallback = physicalWeapon('bag-offense', 8);
  const strongest = physicalWeapon('stash-offense', 46, {}, 'items/base/weapon-polearm');
  const locked = (id: string) => item(id, 'items/base/helm-armet');
  useInventoryStore.setState({ backpack: [fallback, ...Array.from({ length: 99 },
    (_, i) => locked(`bag-locked-${String(i)}`))], stash: [strongest, ...Array.from({ length: 499 },
    (_, i) => locked(`stash-locked-${String(i)}`))] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, corpseProfile);
  expect(save().inventory.equipped.weapon?.id).toBe(fallback.id);
  expect(records.find(row => row.kind === 'campaign-gear-retrieve'))
    .toMatchObject({ itemId: strongest.id, result: { ok: false, reason: 'backpack_full' } });
  conserved(before);
});

it('opts all fourteen candidate builds into owned selection without giving items', () => {
  expect(Object.values(intendedCampaignProfiles)).toHaveLength(14);
  for (const profile of Object.values(intendedCampaignProfiles))
    expect(profile).toHaveProperty('ownedEquipmentPolicy', 'owned-build-v1');
});

it.each([true, false])('uses Act I owned defensive tradeoffs only with explicit opt-in %s', enabled => {
  create('sorceress');
  const cap = (id: string, mods: Readonly<Record<string, number>>): Item => ({
    ...item(id, 'items/base/helm-cap'), rarity: 'magic',
    affixes: [{ affixId: 'constructed-early-defense', values: new Map(Object.entries(mods)) }]
  });
  const old = cap('old-armor', { 'statMods.defense': 50 });
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old, 'head').ok).toBe(true);
  const candidate = cap('owned-resistances', Object.fromEntries(
    ['fire', 'cold', 'lightning', 'arcane', 'poison'].map(type => [`resistances.${type}`, 40])));
  useInventoryStore.setState({ stash: [candidate] });
  const before = save();
  const intended = intendedCampaignProfiles['sorceress-fire-intended-v1'];
  const profile: CampaignProfile = enabled
    ? { ...intended, earlySurvivalEquipmentPolicy: 'owned-balanced-v1' }
    : intended;
  equipCampaignGear(() => undefined, profile);
  const after = save();
  expect(after.inventory.equipped.head?.id).toBe(enabled ? candidate.id : old.id);
  if (enabled) {
    expect(after.player.derivedStats.defense).toBeLessThan(before.player.derivedStats.defense);
    expect(after.player.derivedStats.resistances.lightning).toBeGreaterThan(before.player.derivedStats.resistances.lightning);
  }
  for (const key of ['attack', 'attackSpeed', 'manaMax'] as const)
    expect(after.player.derivedStats[key]).toBe(before.player.derivedStats[key]);
  expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
  conserved(before);
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(after);
});

it('preserves the Act I Mana floor when an owned armor tradeoff otherwise scores better', () => {
  create('sorceress');
  const old: Item = { ...item('retained-mana', 'items/base/helm-cap'), rarity: 'magic',
    affixes: [{ affixId: 'constructed-mana', values: new Map([['statMods.mana', 1]]) }] };
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old, 'head').ok).toBe(true);
  const candidate: Item = { ...item('lower-mana-defense', 'items/base/helm-cap'), rarity: 'magic',
    affixes: [{ affixId: 'constructed-mana-floor', values: new Map([['statMods.life', 1000]]) }] };
  useInventoryStore.setState({ stash: [candidate] });
  const before = save();
  equipCampaignGear(() => undefined, { ...intendedCampaignProfiles['sorceress-fire-intended-v1'],
    earlySurvivalEquipmentPolicy: 'owned-balanced-v1' });
  expect(save()).toEqual(before);
});

it('retrieves and equips an eligible stash upgrade without income or healing', () => {
  create('sorceress');
  const cap = item('stash-cap', 'items/base/helm-cap');
  useInventoryStore.setState({ stash: [cap] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, intendedCampaignProfiles['sorceress-cold-intended-v1']);
  expect(save().inventory.equipped.head?.id).toBe(cap.id);
  expect(save().inventory.stash).toEqual([]);
  expect(records).toContainEqual({ kind: 'campaign-gear-retrieve', itemId: cap.id, result: { ok: true } });
  conserved(before);
  const after = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles['sorceress-cold-intended-v1']);
  expect(save()).toEqual(after);
});

it.each([
  { classId: 'barbarian', profile: 'barbarian-double-throw-intended-v1', base: 'items/base/weapon-throwing-knife' },
  { classId: 'assassin', profile: 'assassin-martial-intended-v1', base: 'items/base/wp1h-katar' }
] as const)('acquires and retains the $classId mastery weapon despite a higher scalar alternative', fixture => {
  create(fixture.classId);
  const staff = item('equipped-staff', 'items/base/weapon-staff');
  useInventoryStore.getState().addItem(staff);
  expect(useInventoryStore.getState().equipItem(staff).ok).toBe(true);
  const selected = item('affinity-a', fixture.base), tied = item('affinity-z', fixture.base);
  useInventoryStore.setState({ stash: [tied, selected] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, intendedCampaignProfiles[fixture.profile]);
  expect(save().inventory.equipped.weapon?.id).toBe(selected.id);
  const decision = records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon');
  expect(decision).toMatchObject({ selected: selected.id });
  expect(decision?.candidates).toEqual(expect.arrayContaining([
    expect.objectContaining({ item: selected, acquiresWeaponAffinity: true }) ]));
  conserved(before);
  useInventoryStore.getState().addItem(item('strong-incompatible', 'items/base/weapon-staff', 18));
  const equipped = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles[fixture.profile]);
  expect(save().inventory.equipped.weapon?.id).toBe(selected.id);
  conserved(equipped);
});

it('uses an ordinary fallback while a throwing weapon is unavailable', () => {
  create('barbarian');
  useInventoryStore.getState().addItem(item('fallback', 'items/base/weapon-staff'));
  const before = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles['barbarian-double-throw-intended-v1']);
  expect(save().inventory.equipped.weapon?.id).toBe('fallback');
  conserved(before);
});

it('does not equip an ineligible or Iron Golem reserved preferred weapon', () => {
  create('assassin');
  const high = item('ineligible-claws', 'items/base/wp1h-greater-claws');
  const reserved = item('reserved-claws', 'items/base/wp1h-katar');
  useInventoryStore.setState({ stash: [high, reserved] });
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  armIronGolemSelection(hero.id, reserved.id, true);
  const before = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles['assassin-martial-intended-v1']);
  expect(save()).toEqual(before);
});

it('preserves the native bow mutex when selecting from stash', () => {
  create('amazon');
  useInventoryStore.setState({ stash: [item('shield', 'items/base/sh-buckler'),
    item('wrong-weapon', 'items/base/weapon-staff', 18)] });
  const before = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles['amazon-bow-intended-v1']);
  expect(save()).toEqual(before);
});

it.each([
  { level: 1, source: 'stash', baseId: 'items/base/weapon-bow-training', attack: 18 },
  { level: 52, source: 'backpack', baseId: 'items/base/weapon-bow', attack: 21 },
  { level: 52, source: 'stash', baseId: 'items/base/weapon-crossbow', attack: 34 }
] as const)('Bow selects owned physical upgrades despite lost resistance at $level from $source', fixture => {
  create('amazon');
  if (fixture.level > 1) usePlayerStore.getState().gainExperience(xpTotal(fixture.level));
  const profile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  growCampaignBuild(profile, () => undefined);
  const old: Item = fixture.level === 1
    ? physicalWeapon('bow-old-resistance', 8, { 'statMods.magicResist': 8 }, 'items/base/weapon-bow-training')
    : { ...item('bow-old-socketed', 'items/base/weapon-bow', 22), socketCapacity: 2,
      socketContents: [{ kind: 'gem', id: 'gems/diamond/flawed' }, { kind: 'gem', id: 'gems/diamond/flawed' }] };
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  const selected: Item = { ...item('bow-physical-upgrade', fixture.baseId, fixture.attack),
    ...(fixture.baseId === 'items/base/weapon-bow'
      ? { rarity: 'unique', uniqueId: 'items/unique/rogue-bow' } : {}) };
  const wrong = item('bow-wrong-weapon', 'items/base/weapon-staff', 300);
  const shield = item('bow-wrong-offhand', 'items/base/sh-buckler');
  const locked = item('bow-level-locked', fixture.level === 1
    ? 'items/base/weapon-ward-bow' : 'items/base/wp1h-legend-sword', 95);
  useInventoryStore.setState({ [fixture.source]: [selected, wrong, shield, locked] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, profile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(selected.id);
  expect(after.inventory.equipped.offhand ?? null).toBeNull();
  expect(after.player.derivedStats.attack).toBeGreaterThan(before.player.derivedStats.attack);
  expect(after.player.derivedStats.magicResist).toBe(before.player.derivedStats.magicResist - 8);
  const decision = records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon');
  expect(decision).toMatchObject({ selected: selected.id });
  const candidates = decision?.candidates as readonly {
    item: Item; upgrade: boolean; policyRejection: string | null;
    eligibility: { eligible: boolean }; physicalOffense?: { current: number; candidate: number };
  }[];
  const selectedDecision = candidates.find(row => row.item.id === selected.id);
  expect(selectedDecision).toMatchObject({ upgrade: true, policyRejection: null });
  expect(selectedDecision?.physicalOffense?.candidate)
    .toBeGreaterThan(selectedDecision?.physicalOffense?.current ?? Infinity);
  expect(candidates.find(row => row.item.id === wrong.id))
    .toMatchObject({ policyRejection: 'requires-bow-fallback' });
  expect(candidates.find(row => row.item.id === locked.id))
    .toMatchObject({ eligibility: { eligible: false } });
  expect(after.player.skillLevels).toEqual(before.player.skillLevels);
  expect(after.player.comboOrder).toEqual(before.player.comboOrder);
  conserved(before);
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(after);
});

it('requires an idle boundary before owned selection changes anything', () => {
  create('sorceress');
  useInventoryStore.setState({ stash: [item('cap', 'items/base/helm-cap')] });
  useCombatStore.setState({ inCombat: true });
  const before = save();
  expect(() => { equipCampaignGear(() => undefined, intendedCampaignProfiles['sorceress-cold-intended-v1']); })
    .toThrow('idle');
  expect(save()).toEqual(before);
});

it('keeps a reserved backpack item out of both hero and companion equipment', () => {
  create('necromancer');
  const cap = item('reserved-cap', 'items/base/helm-cap');
  useInventoryStore.getState().addItem(cap);
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  armIronGolemSelection(hero.id, cap.id, true);
  const before = save();
  equipCampaignGear(() => undefined, intendedCampaignProfiles['necromancer-summon-intended-v1']);
  expect(save()).toEqual(before);
});

it.each([false, true])('handles a full backpack with stash full = %s using native fallback or staging', fullStash => {
  create('sorceress');
  const fallback = item('bag-cap', 'items/base/helm-cap');
  const selected = { ...item('stash-cap', 'items/base/helm-cap'), baseRolls: { defense: 8 } };
  const locked = (id: string) => item(id, 'items/base/helm-war-hat');
  useInventoryStore.setState({ backpack: [fallback, ...Array.from({ length: 99 },
    (_, i) => locked(`bag-locked-${String(i)}`))], stash: [selected, ...Array.from({ length: fullStash ? 499 : 0 },
    (_, i) => locked(`stash-locked-${String(i)}`))] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, intendedCampaignProfiles['sorceress-cold-intended-v1']);
  expect(save().inventory.equipped.head?.id).toBe(fullStash ? fallback.id : selected.id);
  expect(records.find(row => row.kind === 'campaign-gear-retrieve')).toMatchObject({
    itemId: selected.id, result: fullStash ? { ok: false, reason: 'backpack_full' } : { ok: true } });
  expect(records.filter(row => row.kind === 'campaign-gear-stage')).toHaveLength(fullStash ? 0 : 1);
  if (fullStash) {
    // This profile has no Act I survival pass: retain the ordinary bag fallback
    // and leave the refused stronger stash item owned for later preparation.
    expect(save().inventory.stash).toContainEqual(selected);
    expect(records.filter(row => row.kind === 'campaign-survival-equip')).toEqual([]);
    expect(records.filter(row => row.kind === 'campaign-gear-retrieve')).toHaveLength(1);
  }
  conserved(before);
});


it('uses owned Act II defensive tradeoffs for both party members while preserving weapons and earned pools', () => {
  create('necromancer');
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
  const defensiveCap = (id: string, mods: Readonly<Record<string, number>>): Item => ({
    ...item(id, 'items/base/helm-cap'), rarity: 'magic',
    affixes: [{ affixId: 'constructed-defense-policy', values: new Map(Object.entries(mods)) }]
  });
  const oldHero = defensiveCap('old-hero', { 'statMods.critDamage': 10 });
  const oldMerc = defensiveCap('old-merc', { 'statMods.critDamage': 10 });
  for (const cap of [oldHero, oldMerc]) useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(oldHero, 'head').ok).toBe(true);
  expect(useMercStore.getState().equipOnMerc(merc.id, 'head', oldMerc).ok).toBe(true);
  const defense = Object.fromEntries(['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical']
    .map(element => [`resistances.${element}`, 60]));
  useInventoryStore.setState({ stash: [defensiveCap('defense-a', defense), defensiveCap('defense-b', defense)] });
  const beforeAct = save();
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(beforeAct);
  useMapStore.getState().markCleared('areas/act1-catacombs');
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  const mercBefore = deriveEquippedMercStats(merc, before.mercs.mercEquipment[merc.id] ?? {});
  equipCampaignGear(row => { records.push(row); }, profile);
  const after = save(), mercAfter = deriveEquippedMercStats(merc, after.mercs.mercEquipment[merc.id] ?? {});
  expect(after.inventory.equipped.head?.id).toBe('defense-a');
  expect(after.mercs.mercEquipment[merc.id]?.head?.id).toBe('defense-b');
  expect(after.player.derivedStats.resistances.lightning).toBeGreaterThan(before.player.derivedStats.resistances.lightning);
  expect(mercAfter.resistances.lightning).toBeGreaterThan(mercBefore.resistances.lightning);
  for (const key of ['attack', 'attackSpeed'] as const) {
    expect(after.player.derivedStats[key]).toBe(before.player.derivedStats[key]);
    expect(mercAfter[key]).toBe(mercBefore[key]);
  }
  expect(after.inventory.equipped.weapon).toEqual(before.inventory.equipped.weapon);
  expect(after.inventory.equipped.offhand).toEqual(before.inventory.equipped.offhand);
  expect(records.filter(row => row.kind === 'campaign-survival-equip')).toHaveLength(2);
  conserved(before);
  const settled = save();
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(settled);
});


it.each([11, 12, 49])('Javelin considers owned weapon offense only after Impale unlock at level %i', level => {
  create('amazon');
  usePlayerStore.getState().gainExperience(xpTotal(level));
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  growCampaignBuild(profile, () => undefined);
  const old = physicalWeapon('javelin-old-defense', 12, { 'statMods.magicResist': 20 },
    'items/base/wp1h-scimitar');
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  const selected = physicalWeapon('javelin-owned-spear', 24, {}, 'items/base/weapon-trident');
  const locked = physicalWeapon('javelin-locked-spear', 95, {}, 'items/base/weapon-mancatcher');
  useInventoryStore.setState({ stash: [locked, selected] });
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  equipCampaignGear(row => { records.push(row); }, profile);
  const after = save();
  expect(after.inventory.equipped.weapon?.id).toBe(level < 12 ? old.id : selected.id);
  if (level >= 12) {
    expect(after.player.derivedStats.attack).toBeGreaterThan(before.player.derivedStats.attack);
    expect(after.player.derivedStats.magicResist).toBeLessThan(before.player.derivedStats.magicResist);
  }
  const candidates = records.find(row => row.kind === 'gear-decision' && row.slot === 'weapon')?.candidates;
  const expectedEligibility: unknown = expect.objectContaining({ eligible: false });
  expect(candidates).toEqual(expect.arrayContaining([
    expect.objectContaining({ item: locked, eligibility: expectedEligibility })
  ]));
  expect(after.player.comboOrder).toEqual(before.player.comboOrder);
  conserved(before);
  equipCampaignGear(() => undefined, profile);
  expect(save()).toEqual(after);
});

it('Javelin retains weapon offense when an owned defensive replacement lowers it', () => {
  create('amazon');
  usePlayerStore.getState().gainExperience(xpTotal(12));
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  growCampaignBuild(profile, () => undefined);
  const old = physicalWeapon('javelin-retained-offense', 24, {}, 'items/base/weapon-trident');
  useInventoryStore.getState().addItem(old);
  expect(useInventoryStore.getState().equipItem(old).ok).toBe(true);
  useInventoryStore.setState({ stash: [physicalWeapon('javelin-lower-offense', 10,
    { 'statMods.magicResist': 100 }, 'items/base/weapon-spear')] });
  const before = save();
  equipCampaignGear(() => undefined, profile);
  expect(save().inventory.equipped.weapon?.id).toBe(old.id);
  conserved(before);
});

/** Constructed native quest fixtures; these checks do not prove earned Act II reachability. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { resolveQuestResistanceBonus } from '@/engine/progression/quest-resistance';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import * as persistence from '@/stores/persistence';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  WaveGuardError } from '@/stores/waveTransitionGuard';
import { captureEarnedRestorers, observeEarnedState, observeStore,
  resetEarnedStores } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import { createCampaignQuestActions, type CampaignQuestAction } from './quest-actions';

const staffQuest = 'quests/act2-horadric-staff';
const tombs = 'quests/act2-seven-tombs';
const radament = 'quests/act2-radaments-lair';
const sun = 'quests/act2-tainted-sun';
const arcane = 'quests/act2-arcane-sanctuary';
const cube = `${staffQuest}#objective:obj-cube`;
const shaft = `${staffQuest}#objective:obj-shaft`;
const amulet = `${staffQuest}#objective:obj-amulet`;
const staff = `${staffQuest}#objective:obj-transmute`;
const book = `${radament}#reward:questItem`;
const dryHills = 'areas/act2-dry-hills';
const oasis = 'areas/act2-far-oasis';
const lostCity = 'areas/act2-lost-city';
const tomb = 'areas/act2-tomb-of-tal-rasha';
const sanctuary = 'areas/act2-arcane-sanctuary';
type QuestActions = ReturnType<typeof createCampaignQuestActions>;
let restores: (() => void)[];
let ownsRun = false;

beforeEach(() => {
  assert.equal(hasActiveSubAreaRun(), false);
  restores = captureEarnedRestorers();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act2 adapters', 'sorceress').ok).toBe(true);
  // Constructed access only: this is deliberately not a fresh earned Act I prefix.
  useMapStore.setState({ currentAct: 2, currentSubAreaId: dryHills,
    clearedSubAreas: ['areas/act1-catacombs'] });
});

afterEach(() => {
  if (ownsRun) { abortSubAreaRun(); ownsRun = false; }
  vi.restoreAllMocks();
  for (const restore of restores) restore();
});

function hero() {
  const player = usePlayerStore.getState().player;
  assert.ok(player);
  return player;
}

function observed() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore) };
}

function fixture(record: CampaignRecord = () => undefined) {
  const rewards: { action: CampaignQuestAction; delta: CampaignReward }[] = [];
  const actions = createCampaignQuestActions(record, (delta, action) => {
    rewards.push({ action, delta });
  });
  return { actions, rewards };
}

function last(actions: QuestActions) {
  const entry = actions.entries.at(-1);
  assert.ok(entry);
  return entry;
}

function refused(actions: QuestActions, action: CampaignQuestAction, id: string,
  attempt: () => void, result: string) {
  const before = observed(), count = actions.entries.length;
  expect(attempt).toThrow();
  expect(observed()).toEqual(before);
  expect(actions.entries).toHaveLength(count + 1);
  expect(last(actions)).toMatchObject({ action, id, result,
    before: { items: before.inventory.questItems, progress: before.map.questProgress,
      receipts: before.map.questReceipts, currentAct: before.map.currentAct,
      currentSubAreaId: before.map.currentSubAreaId },
    after: { items: before.inventory.questItems, progress: before.map.questProgress,
      receipts: before.map.questReceipts, currentAct: before.map.currentAct,
      currentSubAreaId: before.map.currentSubAreaId } });
}

function attempts(actions: QuestActions) {
  return [
    ['start', sun, () => { actions.start(sun); }],
    ['claim', radament, () => { actions.claim(radament); }],
    ['visit', dryHills, () => { actions.visit(dryHills); }],
    ['recover', cube, () => { actions.recover(cube); }],
    ['interact', 'objects/serpent_altar', () => { actions.interact('objects/serpent_altar'); }],
    ['assemble', staff, () => { actions.assemble(staff); }],
    ['insert', staff, () => { actions.insert(staff); }],
    ['read', book, () => { actions.read(book); }]
  ] as const;
}

function recoverParts(actions: QuestActions) {
  actions.start(staffQuest);
  actions.start(tombs);
  actions.visit(dryHills); actions.recover(cube);
  actions.visit(oasis); actions.recover(shaft);
  actions.visit(lostCity); actions.recover(amulet);
}

function completedRadament(actions: QuestActions) {
  actions.start(radament);
  // Disclosed constructed kill prerequisite; no combat or earned claim is inferred.
  useMapStore.getState().updateQuestProgress(radament, { status: 'completed',
    objectives: { 'obj-kill-radament': true } });
}

describe('constructed native campaign quest transitions', () => {
  it('Starts false objectives and visits act 2 without granting rewards or combat', () => {
    const { actions, rewards } = fixture(), before = observed();
    actions.start(staffQuest);
    expect(useMapStore.getState().questProgress[staffQuest]).toEqual({ id: staffQuest,
      status: 'inProgress', objectives: { 'obj-cube': false, 'obj-shaft': false,
        'obj-amulet': false, 'obj-transmute': false } });
    expect(last(actions)).toMatchObject({ action: 'start', id: staffQuest, result: 'ok' });
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    const progress = structuredClone(useMapStore.getState().questProgress);
    actions.visit(dryHills);
    expect(useMapStore.getState()).toMatchObject({ currentAct: 2, currentSubAreaId: dryHills,
      questProgress: progress, clearedSubAreas: before.map.clearedSubAreas });
    expect(observed().player).toEqual(before.player);
    expect(observed().inventory).toEqual(before.inventory);
    expect(observed().merc).toEqual(before.merc);
    expect(observed().combat).toEqual(before.combat);
    expect(rewards).toEqual([]);
    expect(last(actions)).toMatchObject({ action: 'visit', id: dryHills, result: 'ok' });
    refused(actions, 'start', staffQuest, () => { actions.start(staffQuest); }, 'threw');
  });

  it('recovers exact sources, retains Cube and consumes real ingredients/output once', () => {
    const { actions, rewards } = fixture(), before = observed();
    recoverParts(actions);
    const parts = {
      [cube]: { itemId: 'quest/horadric_cube', state: 'owned' },
      [shaft]: { itemId: 'quest/staff_of_kings', state: 'owned' },
      [amulet]: { itemId: 'quest/viper_amulet', state: 'owned' }
    };
    expect(useInventoryStore.getState().questItems).toEqual(parts);
    expect(useMapStore.getState().questProgress[staffQuest]).toMatchObject({ status: 'inProgress',
      objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': false } });
    actions.assemble(staff);
    const assembled = { ...parts,
      [shaft]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
      [amulet]: { itemId: 'quest/viper_amulet', state: 'consumed' },
      [staff]: { itemId: 'quest/horadric_staff', state: 'owned' }
    };
    expect(useInventoryStore.getState().questItems).toEqual(assembled);
    expect(useMapStore.getState().questProgress[staffQuest]).toMatchObject({ status: 'completed',
      objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': true } });
    expect(last(actions)).toMatchObject({ action: 'assemble', id: staff, result: 'ok',
      before: { items: parts }, after: { items: assembled } });
    refused(actions, 'assemble', staff, () => { actions.assemble(staff); }, 'already-owned');
    refused(actions, 'recover', amulet, () => { actions.recover(amulet); }, 'already-owned');
    refused(actions, 'insert', staff, () => { actions.insert(staff); }, 'not-eligible');
    actions.visit(tomb); actions.insert(staff);
    expect(useInventoryStore.getState().questItems).toEqual({ ...assembled,
      [staff]: { itemId: 'quest/horadric_staff', state: 'consumed' } });
    expect(useMapStore.getState().questProgress[tombs]).toEqual({ id: tombs, status: 'inProgress',
      objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': false } });
    expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
    refused(actions, 'insert', staff, () => { actions.insert(staff); }, 'already-consumed');
    expect(observed().player).toEqual(before.player);
    expect(observed().merc).toEqual(before.merc);
    expect(useMapStore.getState().questReceipts).toEqual(before.map.questReceipts);
    expect(useMapStore.getState().clearedSubAreas).toEqual(before.map.clearedSubAreas);
    const { questItems: _oldItems, ...oldInventory } = before.inventory;
    const { questItems: _newItems, ...newInventory } = observed().inventory;
    expect(newInventory).toEqual(oldInventory);
    expect(rewards).toEqual([]);
    expect(actions.entries.filter(row => row.action === 'recover' && row.result === 'ok')
      .map(row => row.id)).toEqual([cube, shaft, amulet]);
  });

  it.each([cube, shaft, amulet])('refuses assembly with missing actual input %s despite true flags', missing => {
    const { actions, rewards } = fixture(); recoverParts(actions);
    const items = { ...useInventoryStore.getState().questItems };
    Reflect.deleteProperty(items, missing);
    useInventoryStore.setState({ questItems: items });
    refused(actions, 'assemble', staff, () => { actions.assemble(staff); }, 'not-eligible');
    expect(rewards).toEqual([]);
  });

  it('refuses early, unknown and item-dependent object arguments without banking progress', () => {
    const { actions, rewards } = fixture();
    actions.start(staffQuest); actions.start(tombs); actions.start(arcane);
    actions.visit(lostCity);
    refused(actions, 'recover', amulet, () => { actions.recover(amulet); }, 'not-eligible');
    refused(actions, 'recover', 'quest/horadric_cube', () => { actions.recover('quest/horadric_cube'); }, 'not-eligible');
    actions.visit(sanctuary);
    refused(actions, 'interact', 'objects/horazon_journal',
      () => { actions.interact('objects/horazon_journal'); }, 'not-eligible');
    actions.visit(tomb);
    refused(actions, 'interact', 'objects/tal_rasha_orifice',
      () => { actions.interact('objects/tal_rasha_orifice'); }, 'not-eligible');
    refused(actions, 'insert', staff, () => { actions.insert(staff); }, 'not-eligible');
    refused(actions, 'read', 'items/book_of_skill', () => { actions.read('items/book_of_skill'); }, 'unsupported-rewards');
    expect(rewards).toEqual([]);
  });

  it('refuses corrupted quest ledger data without repairing it or awarding income', () => {
    const { actions, rewards } = fixture(); actions.start(staffQuest);
    useInventoryStore.setState({ questItems: { [cube]: { itemId: 'quest/viper_amulet', state: 'owned' } } });
    refused(actions, 'recover', cube, () => { actions.recover(cube); }, 'not-eligible');
    refused(actions, 'assemble', staff, () => { actions.assemble(staff); }, 'not-eligible');
    refused(actions, 'read', book, () => { actions.read(book); }, 'unsupported-rewards');
    expect(rewards).toEqual([]);
  });

  it('Claims native Radament XP, then Reads the actual book for exactly one separate skill point', () => {
    const { actions, rewards } = fixture(); completedRadament(actions);
    const beforeClaim = structuredClone(hero());
    const growth = awardXp(xpTotal(beforeClaim.level) + beforeClaim.experience, 5000);
    actions.claim(radament);
    expect(hero().skillPoints).toBe(beforeClaim.skillPoints + growth.skillPointsGranted);
    expect(hero().statPoints).toBe(beforeClaim.statPoints + growth.statPointsGranted);
    expect(useInventoryStore.getState().questItems[book]).toEqual({ itemId: 'items/book_of_skill', state: 'owned' });
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 5000, addedItems: [], removedItemIds: [] } });
    const beforeRead = observed(); actions.read(book);
    const afterRead = observed();
    expect(afterRead.player.player).toEqual({ ...beforeRead.player.player,
      skillPoints: (beforeRead.player.player?.skillPoints ?? 0) + 1 });
    expect(afterRead.inventory).toEqual({ ...beforeRead.inventory, questItems: {
      ...beforeRead.inventory.questItems, [book]: { itemId: 'items/book_of_skill', state: 'consumed' }
    } });
    for (const key of ['map', 'merc', 'formation', 'meta', 'combat'] as const)
      expect(afterRead[key]).toEqual(beforeRead[key]);
    expect(last(actions)).toMatchObject({ action: 'read', id: book, result: 'ok',
      before: { player: { skillPoints: beforeRead.player.player?.skillPoints } },
      after: { player: { skillPoints: hero().skillPoints } }, delta: { xp: 0, addedItems: [], removedItemIds: [] } });
    refused(actions, 'read', book, () => { actions.read(book); }, 'already-consumed');
    refused(actions, 'claim', radament, () => { actions.claim(radament); }, 'already-claimed');
    expect(rewards).toHaveLength(1);
  });

  it('cannot Read a missing source from historical claimed flags', () => {
    const { actions, rewards } = fixture(); completedRadament(actions);
    useMapStore.getState().markQuestRewardClaimed(radament);
    refused(actions, 'read', book, () => { actions.read(book); }, 'not-owned');
    expect(rewards).toEqual([]);
  });

  it('keeps Summoner credit, journal interaction, explicit Claim and XP-derived points distinct', () => {
    const { actions, rewards } = fixture(); actions.start(arcane); actions.visit(sanctuary);
    useMapStore.getState().updateQuestProgress(arcane, { objectives: {
      'obj-find-summoner': true, 'obj-read-journal': false } });
    const beforeInteract = observed(); actions.interact('objects/horazon_journal');
    expect(hero()).toEqual(beforeInteract.player.player);
    expect(useMapStore.getState().questProgress[arcane]).toMatchObject({ status: 'completed',
      objectives: { 'obj-find-summoner': true, 'obj-read-journal': true } });
    expect(rewards).toEqual([]);
    const before = structuredClone(hero());
    const growth = awardXp(xpTotal(before.level) + before.experience, 7000);
    actions.claim(arcane);
    expect(xpTotal(hero().level) + hero().experience).toBe(growth.totalXp);
    expect(hero().skillPoints).toBe(before.skillPoints + growth.skillPointsGranted + 1);
    expect(hero().statPoints).toBe(before.statPoints + growth.statPointsGranted);
    expect(hero().coreStats).toEqual(before.coreStats);
    expect(hero().skillLevels).toEqual(before.skillLevels);
    expect(useMapStore.getState().questReceipts).toEqual(beforeInteract.map.questReceipts);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 7000 } });
    refused(actions, 'interact', 'objects/horazon_journal',
      () => { actions.interact('objects/horazon_journal'); }, 'already-read');
    refused(actions, 'claim', arcane, () => { actions.claim(arcane); }, 'already-claimed');
    expect(rewards).toHaveLength(1);
  });

  it('grants Tainted Sun resistance only on actual Claim without fabricating a proof receipt', () => {
    const { actions, rewards } = fixture(); actions.start(sun); actions.visit(lostCity);
    const before = observed(); actions.interact('objects/serpent_altar');
    expect(hero()).toEqual(before.player.player);
    expect(resolveQuestResistanceBonus(useMapStore.getState().questProgress)).toEqual({ fire: 0, cold: 0 });
    expect(rewards).toEqual([]);
    const preClaim = structuredClone(hero());
    const growth = awardXp(xpTotal(preClaim.level) + preClaim.experience, 4500);
    actions.claim(sun);
    expect(xpTotal(hero().level) + hero().experience).toBe(growth.totalXp);
    expect(hero().skillPoints).toBe(preClaim.skillPoints + growth.skillPointsGranted);
    expect(hero().statPoints).toBe(preClaim.statPoints + growth.statPointsGranted);
    expect(resolveQuestResistanceBonus(useMapStore.getState().questProgress)).toEqual({ fire: 30, cold: 30 });
    expect(hero().derivedStats.resistances).toMatchObject({ fire: 30, cold: 30 });
    expect(useInventoryStore.getState().questItems).toEqual(before.inventory.questItems);
    expect(useMapStore.getState().questReceipts).toEqual(before.map.questReceipts);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 4500 } });
    refused(actions, 'claim', sun, () => { actions.claim(sun); }, 'already-claimed');
    expect(resolveQuestResistanceBonus(useMapStore.getState().questProgress)).toEqual({ fire: 30, cold: 30 });
  });
});

describe('constructed campaign quest safety boundaries', () => {
  it.each(['idle', 'loading', 'error'] as const)('guards every wrapper during %s hydration', status => {
    const { actions, rewards } = fixture(); useHydrationStore.getState().setStatus(status);
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'not-ready');
    expect(rewards).toEqual([]);
  });

  it('guards Read and Claim as well as world actions during save replacement', () => {
    const { actions, rewards } = fixture();
    vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'not-ready');
    expect(rewards).toEqual([]);
  });

  it('retains a null delta and no income when the hero is missing', () => {
    const { actions, rewards } = fixture(); usePlayerStore.getState().reset();
    for (const [action, id, attempt] of attempts(actions)) {
      refused(actions, action, id, attempt, 'no-player');
      expect(last(actions)).toMatchObject({ before: { player: null }, after: { player: null }, delta: null });
    }
    expect(rewards).toEqual([]);
  });

  it('guards every wrapper, including Read and Claim, while combat is active', () => {
    const { actions, rewards } = fixture(); useCombatStore.setState({ inCombat: true });
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'combat-active');
    expect(rewards).toEqual([]);
  });

  it('guards an actual active native run even with inCombat false', () => {
    const { actions, rewards } = fixture();
    const run = startSubAreaRun({ act: 2, subAreaId: sanctuary, runSeed: 7, challengeOrdinal: 0 });
    ownsRun = true; expect(run).toBeTruthy();
    useCombatStore.setState({ inCombat: false });
    for (const [action, id, attempt] of attempts(actions)) refused(actions, action, id, attempt, 'combat-active');
    expect(rewards).toEqual([]);
  });

  it('refuses unknown, mismatched and locked visits before any location change', () => {
    const { actions, rewards } = fixture();
    refused(actions, 'visit', 'areas/missing', () => { actions.visit('areas/missing'); }, 'unknown-area');
    refused(actions, 'visit', 'areas/act1-blood-moor',
      () => { actions.visit('areas/act1-blood-moor'); }, 'unknown-area');
    useMapStore.setState({ clearedSubAreas: [] });
    refused(actions, 'visit', dryHills, () => { actions.visit(dryHills); }, 'locked-area');
    expect(rewards).toEqual([]);
  });

  it.each(['wave', 'restore'] as const)('retains and propagates typed %s ownership errors', kind => {
    const { actions, rewards } = fixture();
    const wave = kind === 'wave' ? beginWaveTransition(true) : null;
    const restore = kind === 'restore' ? reserveWaveRestore() : null;
    try {
      for (const [action, id, attempt] of attempts(actions)) {
        const before = observed(); let caught: unknown;
        try { attempt(); } catch (error) { caught = error; }
        expect(caught).toBeInstanceOf(WaveGuardError);
        expect(caught).toMatchObject({ code: kind === 'wave' ? 'waveBusy' : 'restorePending' });
        expect(observed()).toEqual(before);
        expect(last(actions)).toMatchObject({ action, id, result: 'threw' });
      }
      expect(rewards).toEqual([]);
    } finally {
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
  });
});

describe('campaign quest accounting before diagnostic failures', () => {
  it('retains actual native Claim reward and entry before its recorder fails', () => {
    const { actions, rewards } = fixture(); completedRadament(actions);
    const failure = new Error('Constructed claim logger failure');
    const order: string[] = [];
    const logged = createCampaignQuestActions(() => {
      order.push('record');
      expect(logged.entries).toHaveLength(1);
      expect(last(logged)).toMatchObject({ action: 'claim', id: radament, result: 'ok', delta: { xp: 5000 } });
      throw failure;
    }, (delta, action) => { order.push('reward'); rewards.push({ action, delta }); });
    expect(() => { logged.claim(radament); }).toThrow(failure);
    expect(order).toEqual(['reward', 'record']);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 5000 } });
    expect(useMapStore.getState().questProgress[radament]?.rewardClaimed).toBe(true);
    expect(useInventoryStore.getState().questItems[book]).toEqual({ itemId: 'items/book_of_skill', state: 'owned' });
  });

  it.each(['read', 'insert'] as const)('retains a successful native %s transition before recorder failure', action => {
    const { actions } = fixture();
    if (action === 'read') { completedRadament(actions); actions.claim(radament); }
    else { recoverParts(actions); actions.assemble(staff); actions.visit(tomb); }
    const before = observed(), id = action === 'read' ? book : staff;
    const failure = new Error('Constructed transition logger failure');
    const rewards: CampaignReward[] = [];
    const logged = createCampaignQuestActions(() => {
      expect(logged.entries).toHaveLength(1);
      expect(last(logged)).toMatchObject({ action, id, result: 'ok', before: { items: before.inventory.questItems },
        after: { items: { [id]: { state: 'consumed' } } } });
      throw failure;
    }, delta => { rewards.push(delta); });
    expect(() => { logged[action](id); }).toThrow(failure);
    expect(useInventoryStore.getState().questItems[id]?.state).toBe('consumed');
    expect(rewards).toEqual([]);
    if (action === 'read') expect(hero().skillPoints).toBe((before.player.player?.skillPoints ?? 0) + 1);
    else expect(useMapStore.getState().questProgress[tombs]?.objectives['obj-open-tomb']).toBe(true);
  });

  it('accounts exceptional residual native XP when Claim restoration itself fails', () => {
    const { actions, rewards } = fixture(); completedRadament(actions);
    const before = structuredClone(hero());
    // Native Claim grants XP first. Fail its book publication and then its player restore.
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => {
      throw new Error('Constructed ledger publication failure');
    });
    vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce(() => {
      throw new Error('Constructed hero restoration failure');
    });
    let caught: unknown;
    try { actions.claim(radament); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    expect(xpTotal(hero().level) + hero().experience - xpTotal(before.level) - before.experience).toBe(5000);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ action: 'claim', delta: { xp: 5000 } });
    expect(last(actions)).toMatchObject({ action: 'claim', id: radament, result: 'threw', delta: { xp: 5000 } });
    expect(useMapStore.getState().questProgress[radament]?.rewardClaimed).not.toBe(true);
    expect(useInventoryStore.getState().questItems[book]).toBeUndefined();
  });
});

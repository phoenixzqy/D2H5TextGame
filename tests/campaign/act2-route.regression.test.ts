/** Constructed encounters exercise route wiring; no battle, earned prefix or campaign victory is inferred. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import type { SaveCurrent } from '@/engine/types/save';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import * as build from './actions';
import type { CampaignReward } from './economy';
import { campaignProfiles } from './profiles';
import { CampaignStop } from './route';
import { createCampaignQuestActions, type CampaignQuestEntry } from './quest-actions';
import { runActTwo, resumeActTwoAfterCube, assertFreshActOnePrefix, assertActTwoComplete } from './act2-route';

const sisters = 'quests/act1-sisters-to-the-slaughter';
const radament = 'quests/act2-radaments-lair';
const staffQuest = 'quests/act2-horadric-staff';
const sun = 'quests/act2-tainted-sun';
const arcane = 'quests/act2-arcane-sanctuary';
const tombs = 'quests/act2-seven-tombs';
const quests = [radament, staffQuest, sun, arcane, tombs];
const cube = `${staffQuest}#objective:obj-cube`;
const shaft = `${staffQuest}#objective:obj-shaft`;
const amulet = `${staffQuest}#objective:obj-amulet`;
const staff = `${staffQuest}#objective:obj-transmute`;
const book = `${radament}#reward:questItem`;
const catacombs = 'areas/act1-catacombs';
const dryHills = 'areas/act2-dry-hills';
const oasis = 'areas/act2-far-oasis';
const lostCity = 'areas/act2-lost-city';
const sanctuary = 'areas/act2-arcane-sanctuary';
const tomb = 'areas/act2-tomb-of-tal-rasha';
const encounters = [oasis, sanctuary, tomb] as const;
const profile = campaignProfiles['sorceress-cold'];
let restores: (() => void)[];
let created: SaveCurrent;

beforeEach(() => {
  restores = captureEarnedRestorers();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act2 route', 'sorceress').ok).toBe(true);
  // Only an in-memory observation, with no save export, import or filesystem IO.
  const fresh = snapshotStores(); assert.ok(fresh); created = structuredClone(fresh);
  useMapStore.setState({ currentAct: 2, currentSubAreaId: dryHills,
    clearedSubAreas: [catacombs] });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const restore of restores) restore();
});

function hero() {
  const player = usePlayerStore.getState().player; assert.ok(player); return player;
}

/** These public map events are explicitly constructed prerequisites, never production combat proof. */
function constructEncounter(area: string) {
  const map = useMapStore.getState();
  map.setCurrentLocation(2, area);
  if (area === oasis) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
    archetypeIds: ['monsters/act2.radament'] });
  else if (area === sanctuary) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
    archetypeIds: ['monsters/act2.the-summoner'] });
  else if (area === tomb) map.recordBossKill({ actId: 'acts/act2', areaId: area,
    bossArchetypeId: 'monsters/act2.duriel' });
  else throw new Error(`Unexpected constructed encounter ${area}`);
  useMapStore.getState().markCleared(area);
}

function fixture() {
  const trace: string[] = [], rewards: CampaignReward[] = [];
  const record: build.CampaignRecord = entry => {
    if (entry.kind === 'quest-action') trace.push(`${String(entry.action)}:${String(entry.id)}`);
  };
  const actions = createCampaignQuestActions(record, delta => { rewards.push(delta); });
  return { trace, rewards, record, actions };
}

function completedRoute() {
  const current = fixture();
  runActTwo(profile, current.record, (area, phase) => {
    expect(phase).toBe('route'); constructEncounter(area);
  }, current.actions);
  return current;
}

function successfulClaims(entries: readonly CampaignQuestEntry[]) {
  return entries.filter(entry => entry.action === 'claim' && entry.result === 'ok').map(entry => entry.id);
}

function constructClaimedPrefix() {
  useMapStore.getState().updateQuestProgress(sisters, { status: 'completed',
    objectives: { 'obj-kill-andariel': true } });
  useMapStore.getState().markCleared(catacombs);
  const rewards: CampaignReward[] = [];
  // Actual native Claim, but the kill/clear prerequisite remains a disclosed fixture.
  build.claimCampaignQuest(sisters, () => undefined, delta => { rewards.push(delta); });
  expect(rewards).toHaveLength(1);
  return [sisters];
}

describe('fixed Act II suffix with constructed native prerequisites', () => {
  it('uses the exact three-encounter route and all nine ordered native growth/gear boundaries', () => {
    const current = fixture();
    const grow = build.growCampaignBuild, equip = build.equipCampaignGear;
    const growSpy = vi.spyOn(build, 'growCampaignBuild').mockImplementation((next, record) => {
      expect(next).toBe(profile); current.trace.push('grow'); grow(next, record);
    });
    const gearSpy = vi.spyOn(build, 'equipCampaignGear').mockImplementation((record, next) => {
      expect(next).toBe(profile); current.trace.push('gear'); equip(record, next);
    });
    const entered: string[] = [];
    runActTwo(profile, current.record, (area, phase) => {
      expect(phase).toBe('route'); entered.push(area); current.trace.push(`enter:${area}`);
      if (area === oasis) {
        for (const id of quests) {
          const progress = useMapStore.getState().questProgress[id];
          expect(progress).toMatchObject({ id, status: 'inProgress' });
          expect(progress?.rewardClaimed).not.toBe(true);
        }
        expect(useMapStore.getState().questProgress[radament]?.objectives['obj-kill-radament']).toBe(false);
      } else if (area === sanctuary) {
        expect(useMapStore.getState().questProgress[arcane]?.objectives).toEqual({
          'obj-find-summoner': false, 'obj-read-journal': false });
      } else if (area === tomb) {
        expect(useMapStore.getState().questProgress[tombs]?.objectives).toEqual({
          'obj-open-tomb': true, 'obj-kill-duriel': false });
        expect(useInventoryStore.getState().questItems[staff]).toEqual({ itemId: 'quest/horadric_staff', state: 'consumed' });
      }
      constructEncounter(area);
    }, current.actions);
    expect(entered).toEqual(encounters);
    expect(growSpy).toHaveBeenCalledTimes(9); expect(gearSpy).toHaveBeenCalledTimes(9);
    expect(current.trace).toEqual([
      'grow', 'gear', ...quests.map(id => `start:${id}`),
      `visit:${dryHills}`, `recover:${cube}`, `enter:${oasis}`, 'grow', 'gear',
      `recover:${shaft}`, `claim:${radament}`, `read:${book}`, 'grow', 'gear',
      `visit:${lostCity}`, `recover:${amulet}`, 'interact:objects/serpent_altar', `claim:${sun}`, 'grow', 'gear',
      `assemble:${staff}`, `claim:${staffQuest}`, 'grow', 'gear',
      `enter:${sanctuary}`, 'grow', 'gear', 'interact:objects/horazon_journal', `claim:${arcane}`, 'grow', 'gear',
      `visit:${tomb}`, `insert:${staff}`, `enter:${tomb}`, 'grow', 'gear', `claim:${tombs}`, 'grow', 'gear'
    ]);
    expect(successfulClaims(current.actions.entries)).toEqual([radament, sun, staffQuest, arcane, tombs]);
    expect(current.rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(34500);
    expect(useInventoryStore.getState().questItems).toEqual({
      [cube]: { itemId: 'quest/horadric_cube', state: 'owned' },
      [shaft]: { itemId: 'quest/staff_of_kings', state: 'consumed' },
      [amulet]: { itemId: 'quest/viper_amulet', state: 'consumed' },
      [staff]: { itemId: 'quest/horadric_staff', state: 'consumed' },
      [book]: { itemId: 'items/book_of_skill', state: 'consumed' }
    });
    expect(() => { assertActTwoComplete(current.actions.entries); }).not.toThrow();
  });

  it.each(encounters)('propagates the first constructed nonwin at %s and performs no later actions', stop => {
    const current = fixture(), entered: string[] = [];
    const failure = new CampaignStop('nonwin', `Constructed ${stop} draw`);
    let atStop: ReturnType<typeof observeEarnedState> | undefined;
    let claimsAtStop: string[] = [];
    let entriesAtStop = 0;
    expect(() => {
      runActTwo(profile, current.record, (area, phase) => {
        expect(phase).toBe('route'); entered.push(area);
        if (area === stop) {
          atStop = observeEarnedState(); entriesAtStop = current.actions.entries.length;
          claimsAtStop = successfulClaims(current.actions.entries); throw failure;
        }
        constructEncounter(area);
      }, current.actions);
    }).toThrow(failure);
    expect(entered).toEqual(encounters.slice(0, encounters.indexOf(stop) + 1));
    expect(observeEarnedState()).toEqual(atStop);
    expect(current.actions.entries).toHaveLength(entriesAtStop);
    expect(successfulClaims(current.actions.entries)).toEqual(claimsAtStop);
    const expectedClaims = stop === oasis ? [] : stop === sanctuary
      ? [radament, sun, staffQuest] : [radament, sun, staffQuest, arcane];
    expect(claimsAtStop).toEqual(expectedClaims);
    expect(current.rewards.reduce((total, delta) => total + delta.xp, 0))
      .toBe(stop === oasis ? 0 : stop === sanctuary ? 15500 : 22500);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(stop);
    expect(successfulClaims(current.actions.entries)).not.toContain(tombs);
    expect(() => { assertActTwoComplete(current.actions.entries); }).toThrow();
  });

  it('keeps the Act I L14 envelope out of the suffix', () => {
    usePlayerStore.getState().gainExperience(xpTotal(15));
    expect(hero().level).toBe(15);
    const current = completedRoute();
    expect(hero().level).toBeGreaterThanOrEqual(15);
    expect(successfulClaims(current.actions.entries)).toHaveLength(5);
    expect(() => { assertActTwoComplete(current.actions.entries); }).not.toThrow();
  });

  it('propagates an action recorder failure after retaining native Claim income and stops immediately', () => {
    const rewards: CampaignReward[] = [], entered: string[] = [];
    const failure = new Error('Constructed suffix recorder failure');
    const record: build.CampaignRecord = entry => {
      if (entry.kind === 'quest-action' && entry.action === 'claim' && entry.id === sun) throw failure;
    };
    const actions = createCampaignQuestActions(record, delta => { rewards.push(delta); });
    expect(() => {
      runActTwo(profile, record, area => { entered.push(area); constructEncounter(area); }, actions);
    }).toThrow(failure);
    expect(entered).toEqual([oasis]);
    expect(successfulClaims(actions.entries)).toEqual([radament, sun]);
    expect(rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(9500);
    expect(useMapStore.getState().questProgress[sun]?.rewardClaimed).toBe(true);
    expect(useInventoryStore.getState().questItems[book]?.state).toBe('consumed');
    expect(useInventoryStore.getState().questItems[staff]).toBeUndefined();
  });
});

describe('retained Act II cube prefix', () => {
  function prefixFixture() {
    constructClaimedPrefix();
    const previous = fixture();
    for (const id of quests) previous.actions.start(id);
    previous.actions.visit(dryHills); previous.actions.recover(cube);
    return previous.actions.entries;
  }

  it('resumes remaining encounters and Claims without repeating the retained Start/visit/recover actions', () => {
    const prefix = prefixFixture(), current = fixture(), entered: string[] = [];
    resumeActTwoAfterCube(profile, current.record, area => {
      entered.push(area); constructEncounter(area);
    }, current.actions, prefix);
    expect(entered).toEqual(encounters);
    expect(current.actions.entries[0]).toMatchObject({ action: 'recover', id: shaft });
    expect(current.actions.entries.some(entry => entry.action === 'start')).toBe(false);
    expect(successfulClaims(current.actions.entries)).toEqual([radament, sun, staffQuest, arcane, tombs]);
    expect(() => { assertActTwoComplete([...prefix, ...current.actions.entries]); }).not.toThrow();
  });

  it.each(['length', 'result', 'items', 'progress', 'sisters'] as const)(
    'refuses a retained %s mismatch before allocation, records or encounters', mismatch => {
      let prefix = prefixFixture();
      if (mismatch === 'length') prefix = prefix.slice(1);
      if (mismatch === 'result') prefix = prefix.map((entry, i) => i ? entry : { ...entry, result: 'refused' });
      if (mismatch === 'items') useInventoryStore.setState({ questItems: {} });
      if (mismatch === 'progress') useMapStore.getState().updateQuestProgress(staffQuest, {
        objectives: { 'obj-cube': false }
      });
      if (mismatch === 'sisters') useMapStore.getState().updateQuestProgress(sisters, { rewardClaimed: false });
      const current = fixture(), before = observeEarnedState(), entered: string[] = [];
      expect(() => { resumeActTwoAfterCube(profile, current.record, area => {
        entered.push(area);
      }, current.actions, prefix); }).toThrow();
      expect(observeEarnedState()).toEqual(before);
      expect(current.trace).toEqual([]); expect(entered).toEqual([]);
    });

  it('preserves the retained prefix when the next encounter loses', () => {
    const prefix = prefixFixture(), copy = structuredClone(prefix), current = fixture();
    const error = new CampaignStop('nonwin', 'Retained Oasis loss');
    expect(() => { resumeActTwoAfterCube(profile, current.record, () => {
      throw error;
    }, current.actions, prefix); }).toThrow(error);
    expect(prefix).toEqual(copy); expect(current.actions.entries).toEqual([]);
  });

  it('resumes a ten-action Book checkpoint without replaying Oasis, Radament or the Book', () => {
    constructClaimedPrefix();
    const previous = fixture(), stopped = new CampaignStop('budget', 'Constructed Lost City preparation stop');
    expect(() => { runActTwo(profile, previous.record, constructEncounter,
      { ...previous.actions, visit: (area, act) => {
        if (area === lostCity) throw stopped;
        previous.actions.visit(area, act);
      } }); }).toThrow(stopped);
    expect(previous.actions.entries).toHaveLength(10);
    const before = structuredClone(previous.actions.entries), current = fixture(), entered: string[] = [];
    resumeActTwoAfterCube(profile, current.record, area => {
      entered.push(area); constructEncounter(area);
    }, current.actions, previous.actions.entries);
    expect(entered).toEqual([sanctuary, tomb]);
    expect(current.actions.entries[0]).toMatchObject({ action: 'visit', id: lostCity });
    expect(successfulClaims(current.actions.entries)).toEqual([sun, staffQuest, arcane, tombs]);
    expect(current.actions.entries.some(row => row.action === 'read')).toBe(false);
    expect(current.rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(29500);
    expect(previous.actions.entries).toEqual(before);
    expect(() => { assertActTwoComplete([...before, ...current.actions.entries]); }).not.toThrow();
  });

  it('resumes an interrupted Arcane entry without replaying Oasis or its earned Claims', () => {
    constructClaimedPrefix();
    const previous = fixture(), stopped = new CampaignStop('budget', 'Constructed execution limit');
    expect(() => { runActTwo(profile, previous.record, area => {
      if (area === sanctuary) throw stopped;
      constructEncounter(area);
    }, previous.actions); }).toThrow(stopped);
    expect(previous.actions.entries).toHaveLength(16);
    const current = fixture(), entered: string[] = [];
    resumeActTwoAfterCube(profile, current.record, area => {
      entered.push(area); constructEncounter(area);
    }, current.actions, previous.actions.entries);
    expect(entered).toEqual([sanctuary, tomb]);
    expect(successfulClaims(current.actions.entries)).toEqual([arcane, tombs]);
    expect(() => { assertActTwoComplete([...previous.actions.entries, ...current.actions.entries]); }).not.toThrow();
  });
});

describe('fresh Act I prefix predicate', () => {
  it('accepts a fresh creation observation and a canonical completed/cleared/actually Claimed prefix fixture', () => {
    const claims = constructClaimedPrefix();
    expect(() => { assertFreshActOnePrefix(created, claims); }).not.toThrow();
  });

  it('refuses clear-only access even though production Act II unlock is true', () => {
    expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
    expect(() => { assertFreshActOnePrefix(created, [sisters]); }).toThrow();
  });

  it('refuses claimed live flags without the successful Sisters action ledger', () => {
    constructClaimedPrefix();
    expect(() => { assertFreshActOnePrefix(created, []); }).toThrow();
  });

  it('refuses an unclaimed canonical Sisters objective even with a claimed-ID assertion', () => {
    useMapStore.getState().updateQuestProgress(sisters, { status: 'completed', rewardClaimed: false,
      objectives: { 'obj-kill-andariel': true } });
    expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
    expect(() => { assertFreshActOnePrefix(created, [sisters]); }).toThrow();
  });

  it('requires the real canonical Andariel objective and Catacombs clear beyond unlock', () => {
    const claims = constructClaimedPrefix();
    useMapStore.getState().updateQuestProgress(sisters, { objectives: { 'obj-kill-andariel': false } });
    expect(() => { assertFreshActOnePrefix(created, claims); }).toThrow();
    useMapStore.getState().updateQuestProgress(sisters, { objectives: { 'obj-kill-andariel': true } });
    useMapStore.setState({ clearedSubAreas: [] });
    expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
    expect(() => { assertFreshActOnePrefix(created, claims); }).toThrow();
  });

  it.each(['progress', 'items', 'clear', 'level'] as const)('refuses a nonfresh creation observation containing %s', fault => {
    const claims = constructClaimedPrefix();
    const nonfresh: SaveCurrent = fault === 'progress'
      ? { ...created, map: { ...created.map, questProgress: { ...created.map.questProgress,
        [radament]: { id: radament, status: 'inProgress', objectives: { 'obj-kill-radament': false } } } } }
      : fault === 'items'
        ? { ...created, inventory: { ...created.inventory, questItems: { ...created.inventory.questItems,
          [cube]: { itemId: 'quest/horadric_cube', state: 'owned' } } } }
        : fault === 'clear'
          ? { ...created, map: { ...created.map, clearedSubAreas: [...created.map.clearedSubAreas, catacombs] } }
          : { ...created, player: { ...created.player, level: 2 } };
    expect(() => { assertFreshActOnePrefix(nonfresh, claims); }).toThrow();
  });
});

describe('Act II terminal completion predicates', () => {
  it('refuses all completed live flags when a successful Claim event is missing or duplicated', () => {
    const { actions } = completedRoute();
    const missing = actions.entries.filter(entry => !(entry.action === 'claim' && entry.id === sun));
    expect(() => { assertActTwoComplete(missing); }).toThrow();
    const repeated = actions.entries.find(entry => entry.action === 'claim' && entry.id === sun);
    assert.ok(repeated);
    expect(() => { assertActTwoComplete([...actions.entries, repeated]); }).toThrow();
  });

  it.each([staff, shaft, amulet, book])('requires consumed state for actual source %s', source => {
    const { actions } = completedRoute();
    const entry = useInventoryStore.getState().questItems[source]; assert.ok(entry);
    useInventoryStore.setState({ questItems: { ...useInventoryStore.getState().questItems,
      [source]: { ...entry, state: 'owned' } } });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
  });

  it('requires the retained actual Cube source', () => {
    const { actions } = completedRoute();
    const items = { ...useInventoryStore.getState().questItems }; Reflect.deleteProperty(items, cube);
    useInventoryStore.setState({ questItems: items });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
  });

  it.each(quests)('requires the canonical completed, true-objective and claimed row for %s', id => {
    const { actions } = completedRoute();
    const original = useMapStore.getState().questProgress[id]; assert.ok(original);
    useMapStore.getState().updateQuestProgress(id, { rewardClaimed: false });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
    useMapStore.getState().updateQuestProgress(id, { ...original, status: 'inProgress' });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
    const first = Object.keys(original.objectives)[0]; assert.ok(first);
    useMapStore.getState().updateQuestProgress(id, { ...original,
      objectives: { ...original.objectives, [first]: false } });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
    useMapStore.getState().updateQuestProgress(id, { ...original, id: 'quests/wrong-source' });
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
  });

  it.each(encounters)('requires the canonical %s clear independently of Act III unlock', area => {
    const { actions } = completedRoute();
    useMapStore.setState({ clearedSubAreas: useMapStore.getState().clearedSubAreas.filter(id => id !== area) });
    expect(useMapStore.getState().isActUnlocked(3)).toBe(true);
    expect(() => { assertActTwoComplete(actions.entries); }).toThrow();
  });
});

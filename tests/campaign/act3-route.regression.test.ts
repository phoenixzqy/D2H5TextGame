/** Constructed prerequisites test suffix wiring; none is earned combat or prefix proof. */
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
import { runActTwo, assertActTwoComplete } from './act2-route';
import { actThreeActionOrder, runActThree, resumeActThree, assertActThreeResumePrefix, assertFreshActTwoPrefix, assertActThreeComplete } from './act3-route';
import { createActThreeAreaPreparation, enterPreparedActThreeArea, auditActThreeAreaPreparation, resumeActThreeAreaPreparation } from './act3-area-preparation';
import type { CampaignWave } from './policy';

const sisters = 'quests/act1-sisters-to-the-slaughter';
const staffQuest = 'quests/act2-horadric-staff';
const khalim = 'quests/act3-khalims-will';
const guardian = 'quests/act3-guardian';
const cube = `${staffQuest}#objective:obj-cube`;
const brain = `${khalim}#objective:obj-brain`;
const heart = `${khalim}#objective:obj-heart`;
const eye = `${khalim}#objective:obj-eye`;
const flail = `${khalim}#objective:obj-flail`;
const will = `${khalim}#objective:obj-transmute`;
const soulstone = `${guardian}#reward:questItem`;
const council = `${khalim}#action:council-victory`;
const orb = `${guardian}#action:break-compelling-orb`;
const marsh = 'areas/act3-great-marsh';
const jungle = 'areas/act3-flayer-jungle';
const bazaar = 'areas/act3-kurast-bazaar';
const travincal = 'areas/act3-travincal';
const durance = 'areas/act3-durance-of-hate';
const encounters = [marsh, jungle, bazaar, travincal, durance] as const;
const order = [
  ['start', khalim], ['start', guardian], ['recover', brain], ['recover', heart],
  ['recover', eye], ['recover', flail], ['assemble', will], ['claim', khalim],
  ['visit', travincal], ['execute', orb], ['claim', guardian]
] as const;
const profile = campaignProfiles['sorceress-cold'];
let restores: (() => void)[];
let created: SaveCurrent;

beforeEach(() => {
  restores = captureEarnedRestorers();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act3 route', 'sorceress').ok).toBe(true);
  // Fresh in-memory observation only; no save import/export or retained-save access.
  const fresh = snapshotStores(); assert.ok(fresh); created = structuredClone(fresh);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const restore of restores) restore();
});

function hero() {
  const player = usePlayerStore.getState().player; assert.ok(player); return player;
}

/** Constructed map events are prerequisites for native actions, never accepted combat evidence. */
function constructActTwoEncounter(area: string) {
  const map = useMapStore.getState(); map.setCurrentLocation(2, area);
  if (area === 'areas/act2-far-oasis') map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
    archetypeIds: ['monsters/act2.radament'] });
  else if (area === 'areas/act2-arcane-sanctuary') map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
    archetypeIds: ['monsters/act2.the-summoner'] });
  else if (area === 'areas/act2-tomb-of-tal-rasha') map.recordBossKill({ actId: 'acts/act2', areaId: area,
    bossArchetypeId: 'monsters/act2.duriel' });
  else throw new Error(`Unexpected constructed Act II encounter ${area}`);
  useMapStore.getState().markCleared(area);
}

/** Deliberately constructed receipt/progress rows; production admission suites own provenance. */
function constructActThreeEncounter(area: string) {
  const map = useMapStore.getState();
  // Native admission saves aliases. Orb must receive the explicit later canonical Visit.
  map.setCurrentLocation(3, area.replace('areas/act3-', 'a3-'));
  if (area === travincal) useMapStore.setState({ questReceipts: { ...map.questReceipts, [council]: true } });
  if (area === durance) {
    expect(map.questReceipts[orb]).toBe(true);
    expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed');
    expect(map.questProgress[khalim]?.rewardClaimed).toBe(true);
    map.updateQuestProgress(guardian, { status: 'completed', rewardClaimed: false,
      objectives: { 'obj-kill-mephisto': true } });
  }
  useMapStore.getState().markCleared(area);
}

function fixture() {
  const trace: string[] = [], rewards: CampaignReward[] = [];
  let hook: build.CampaignRecord = () => undefined;
  const record: build.CampaignRecord = entry => {
    if (entry.kind === 'quest-action') trace.push(`${String(entry.action)}:${String(entry.id)}`);
    hook(entry);
  };
  const actions = createCampaignQuestActions(record, delta => { rewards.push(delta); });
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills',
    clearedSubAreas: ['areas/act1-catacombs'] });
  useMapStore.getState().updateQuestProgress(sisters, { status: 'completed',
    objectives: { 'obj-kill-andariel': true } });
  build.claimCampaignQuest(sisters, () => undefined, () => undefined);
  runActTwo(profile, record, constructActTwoEncounter, actions);
  const act2Entries = actions.entries.slice(), act3Start = actions.entries.length;
  assertActTwoComplete(act2Entries);
  const act2Items = structuredClone(useInventoryStore.getState().questItems);
  trace.length = 0; rewards.length = 0;
  return { trace, rewards, record, actions, act2Entries, act2Items, act3Start,
    prefixClaims: [sisters], hook: (next: build.CampaignRecord) => { hook = next; } };
}

function completedRoute() {
  const current = fixture();
  assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries);
  runActThree(profile, current.record, (area, phase) => {
    expect(phase).toBe('route'); constructActThreeEncounter(area);
  }, current.actions);
  return { ...current, suffix: current.actions.entries.slice(current.act3Start) };
}

describe('fixed Act III suffix with constructed native prerequisites', () => {
  it('keeps native quest custody through the shared challenge-prepared Act III entries', () => {
    const current = fixture(), waves: CampaignWave[] = [];
    usePlayerStore.getState().gainExperience(xpTotal(47) - xpTotal(hero().level) - hero().experience);
    useMapStore.getState().markCleared('areas/act1-dark-wood');
    const prepared = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' as const };
    const state = createActThreeAreaPreparation();
    runActThree(prepared, current.record, area => {
      enterPreparedActThreeArea(prepared, current.record, (_act, entered, phase) => {
        expect(phase).toBe('route');
        const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
        useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
        constructActThreeEncounter(entered);
        waves.push({ phase, area: entered, ordinal, index: 0, outcome: 'victory', advance: 'victory',
          logicalMs: 1, xp: 0, items: 0, heroLife: 1, heroMana: 1 });
      }, state, area);
    }, current.actions);
    expect(auditActThreeAreaPreparation(state, waves)).toMatchObject({ completed: true, routeAreas: 5, admissions: 5 });
    assertActThreeComplete(current.actions.entries.slice(current.act3Start));
  });

  it('prepares only after the orb service and keeps the returned profile through Guardian Claim', () => {
    const current = fixture(), entered: string[] = [];
    const prepared = { ...profile, priority: [...profile.priority].reverse() };
    const prepare = vi.fn(() => {
      expect(entered).toEqual(encounters.slice(0, 4));
      expect(useMapStore.getState().questReceipts[orb]).toBe(true);
      build.growCampaignBuild(prepared, current.record);
      return prepared;
    });
    const result = runActThree(profile, current.record, area => {
      entered.push(area);
      expect(hero().comboOrder).toEqual(area === durance ? prepared.priority : profile.priority);
      constructActThreeEncounter(area);
    }, current.actions, prepare);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(result).toBe(prepared);
    expect(hero().comboOrder).toEqual(prepared.priority);
    expect(useMapStore.getState().questProgress[guardian]?.rewardClaimed).toBe(true);
  });

  it('retains a pre-Durance preparation failure without entering Durance or claiming Guardian', () => {
    const current = fixture(), entered: string[] = [], failure = new CampaignStop('budget', 'Preparation bound');
    expect(() => runActThree(profile, current.record, area => {
      entered.push(area); constructActThreeEncounter(area);
    }, current.actions, () => { throw failure; })).toThrow(failure);
    expect(entered).toEqual(encounters.slice(0, 4));
    expect(useMapStore.getState().questReceipts[orb]).toBe(true);
    expect(useMapStore.getState().questProgress[guardian]?.rewardClaimed).not.toBe(true);
  });

  it('uses five admissions, eleven native actions and eight ordered grow/equip boundaries after the fixed prefix', () => {
    const current = fixture(), entered: string[] = [];
    const grow = build.growCampaignBuild, equip = build.equipCampaignGear;
    const growSpy = vi.spyOn(build, 'growCampaignBuild').mockImplementation((next, record) => {
      expect(next).toBe(profile); current.trace.push('grow'); grow(next, record);
    });
    const gearSpy = vi.spyOn(build, 'equipCampaignGear').mockImplementation((record, next) => {
      expect(next).toBe(profile); current.trace.push('gear'); equip(record, next);
    });
    const visit = vi.spyOn(current.actions, 'visit');
    assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries);
    runActThree(profile, current.record, (area, phase) => {
      expect(phase).toBe('route'); entered.push(area); current.trace.push(`enter:${area}`);
      if (area === marsh) {
        expect(useMapStore.getState().questProgress[khalim]).toMatchObject({ status: 'inProgress',
          objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } });
        expect(useMapStore.getState().questProgress[guardian]).toMatchObject({ status: 'inProgress',
          objectives: { 'obj-kill-mephisto': false } });
      }
      constructActThreeEncounter(area);
    }, current.actions);
    expect(entered).toEqual(encounters);
    expect(actThreeActionOrder).toEqual(order);
    expect(current.actions.entries.slice(current.act3Start).map(row => [row.action, row.id])).toEqual(order);
    expect(growSpy).toHaveBeenCalledTimes(8); expect(gearSpy).toHaveBeenCalledTimes(8);
    expect(visit).toHaveBeenCalledTimes(1); expect(visit).toHaveBeenCalledWith(travincal, 3);
    expect(current.trace).toEqual([
      'grow', 'gear', `start:${khalim}`, `start:${guardian}`,
      `enter:${marsh}`, 'grow', 'gear', `recover:${brain}`,
      `enter:${jungle}`, 'grow', 'gear', `recover:${heart}`,
      `enter:${bazaar}`, 'grow', 'gear', `recover:${eye}`,
      `enter:${travincal}`, 'grow', 'gear', `recover:${flail}`,
      `assemble:${will}`, `claim:${khalim}`, 'grow', 'gear', `visit:${travincal}`, `execute:${orb}`,
      `enter:${durance}`, 'grow', 'gear', `claim:${guardian}`, 'grow', 'gear'
    ]);
    expect(current.actions.entries.slice(0, current.act3Start)).toEqual(current.act2Entries);
    expect(() => { assertActTwoComplete(current.act2Entries); }).not.toThrow();
    expect(() => { assertActTwoComplete(current.actions.entries); }).toThrow();
    expect(current.rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(26000);
    expect(useInventoryStore.getState().questItems).toEqual({ ...current.act2Items,
      [brain]: { itemId: 'quest/khalims_brain', state: 'consumed' },
      [heart]: { itemId: 'quest/khalims_heart', state: 'consumed' },
      [eye]: { itemId: 'quest/khalims_eye', state: 'consumed' },
      [flail]: { itemId: 'quest/khalims_flail', state: 'consumed' },
      [will]: { itemId: 'items/khalims_will', state: 'consumed' },
      [soulstone]: { itemId: 'items/soulstone_mephisto', state: 'owned' } });
    expect(useMapStore.getState().questReceipts).toEqual({ [council]: true, [orb]: true });
    expect(hero().id).toBe(created.player.id);
    expect(() => { assertActThreeComplete(current.actions.entries.slice(current.act3Start)); }).not.toThrow();
  });

  it('keeps the Act I L14 envelope outside this suffix', () => {
    const current = fixture();
    // Disclosed constructed XP, solely to exercise the suffix above the Act I envelope.
    usePlayerStore.getState().gainExperience(xpTotal(15));
    expect(hero().level).toBeGreaterThanOrEqual(15);
    runActThree(profile, current.record, constructActThreeEncounter, current.actions);
    expect(hero().level).toBeGreaterThanOrEqual(15);
    expect(() => { assertActThreeComplete(current.actions.entries.slice(current.act3Start)); }).not.toThrow();
  });

  it.each(encounters)('propagates the first constructed nonwin at %s without later actions', stop => {
    const current = fixture(), entered: string[] = [];
    const failure = new CampaignStop('nonwin', `Constructed ${stop} draw`);
    let atStop: ReturnType<typeof observeEarnedState> | undefined, entriesAtStop = 0;
    expect(() => { runActThree(profile, current.record, (area, phase) => {
      expect(phase).toBe('route'); entered.push(area);
      if (area === stop) {
        atStop = observeEarnedState(); entriesAtStop = current.actions.entries.length; throw failure;
      }
      constructActThreeEncounter(area);
    }, current.actions); }).toThrow(failure);
    expect(entered).toEqual(encounters.slice(0, encounters.indexOf(stop) + 1));
    expect(observeEarnedState()).toEqual(atStop);
    expect(current.actions.entries).toHaveLength(entriesAtStop);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(stop);
    const items = useInventoryStore.getState().questItems;
    if (stop === durance) {
      expect(items[will]?.state).toBe('consumed');
      expect(useMapStore.getState().questReceipts).toEqual({ [council]: true, [orb]: true });
      expect(current.rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(8000);
    } else {
      expect(items[flail]).toBeUndefined(); expect(items[will]).toBeUndefined();
      expect(useMapStore.getState().questReceipts).toEqual({});
      expect(current.rewards).toEqual([]);
    }
    expect(items[soulstone]).toBeUndefined();
    expect(useMapStore.getState().questProgress[guardian]?.rewardClaimed).not.toBe(true);
    expect(() => { assertActThreeComplete(current.actions.entries.slice(current.act3Start)); }).toThrow();
  });

  it.each([khalim, guardian])('retains the native %s Claim before a recorder failure and stops', id => {
    const current = fixture(), entered: string[] = [], failure = new Error(`Constructed recorder ${id}`);
    current.hook(entry => { if (entry.kind === 'quest-action' && entry.action === 'claim' && entry.id === id) throw failure; });
    expect(() => { runActThree(profile, current.record, area => {
      entered.push(area); constructActThreeEncounter(area);
    }, current.actions); }).toThrow(failure);
    expect(entered).toEqual(id === khalim ? encounters.slice(0, 4) : encounters);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    expect(current.actions.entries.at(-1)).toMatchObject({ action: 'claim', id, result: 'ok' });
    expect(current.rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(id === khalim ? 8000 : 26000);
    expect(useInventoryStore.getState().questItems[will]?.state).toBe(id === khalim ? 'owned' : 'consumed');
    expect(useInventoryStore.getState().questItems[soulstone]?.state).toBe(id === guardian ? 'owned' : undefined);
  });
});

describe('fresh Act II prefix predicate', () => {
  it('accepts the same fresh hero and exact copied Act II action slice before any Act III state', () => {
    const current = fixture();
    expect(() => { assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries); }).not.toThrow();
  });

  it.each(['id', 'class'] as const)('rejects a replaced hero %s despite identical prefix flags', field => {
    const current = fixture(); usePlayerStore.setState({ player: { ...hero(), [field]: 'replaced-hero' } });
    expect(() => { assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries); }).toThrow();
  });

  it('requires actual Act I and exact Act II action ledgers beyond access/terminal flags', () => {
    const current = fixture(); expect(useMapStore.getState().isActUnlocked(3)).toBe(true);
    expect(() => { assertFreshActTwoPrefix(created, [], current.act2Entries); }).toThrow();
    expect(() => { assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries.slice(1)); }).toThrow();
    expect(() => { assertFreshActTwoPrefix(created, current.prefixClaims, [...current.act2Entries, ...current.act2Entries]); }).toThrow();
  });

  it.each(['quest', 'source', 'receipt', 'clear'] as const)('rejects premature Act III %s state', fault => {
    const current = fixture();
    if (fault === 'quest') useMapStore.getState().updateQuestProgress('quests/act3-lam-esens-tome', {
      status: 'inProgress', objectives: { 'obj-find-tome': false, 'obj-deliver': false } });
    if (fault === 'source') useInventoryStore.setState({ questItems: { ...current.act2Items,
      [brain]: { itemId: 'quest/khalims_brain', state: 'owned' } } });
    if (fault === 'receipt') useMapStore.setState({ questReceipts: { [council]: true } });
    if (fault === 'clear') useMapStore.getState().markCleared(marsh);
    expect(() => { assertFreshActTwoPrefix(created, current.prefixClaims, current.act2Entries); }).toThrow();
  });
});

describe('Act III terminal predicates', () => {
  it('accepts only the exact suffix, rejecting omitted, duplicated, reordered or unsuccessful actions', () => {
    const current = completedRoute();
    expect(() => { assertActThreeComplete(current.actions.entries); }).toThrow();
    expect(() => { assertActThreeComplete(current.suffix.slice(1)); }).toThrow();
    const first = current.suffix[0]; assert.ok(first);
    expect(() => { assertActThreeComplete([...current.suffix, first]); }).toThrow();
    const second = current.suffix[1]; assert.ok(second);
    const swapped = current.suffix.slice(); [swapped[0], swapped[1]] = [second, first];
    expect(() => { assertActThreeComplete(swapped); }).toThrow();
    const refused: CampaignQuestEntry[] = current.suffix.map((row, index) => index === 2 ? { ...row, result: 'not-eligible' } : row);
    expect(() => { assertActThreeComplete(refused); }).toThrow();
  });

  it.each([khalim, guardian])('requires own canonical completed, true-objective and claimed row for %s', id => {
    const current = completedRoute(), original = useMapStore.getState().questProgress[id]; assert.ok(original);
    for (const change of [{ rewardClaimed: false }, { status: 'inProgress' as const }, { id: 'wrong-row' },
      { objectives: Object.fromEntries(Object.keys(original.objectives).map(key => [key, false])) }]) {
      useMapStore.getState().updateQuestProgress(id, { ...original, ...change });
      expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
    }
  });

  it.each([brain, heart, eye, flail, will, soulstone, cube,
    `${staffQuest}#objective:obj-shaft`, `${staffQuest}#objective:obj-amulet`,
    `${staffQuest}#objective:obj-transmute`, 'quests/act2-radaments-lair#reward:questItem'])(
    'requires the exact preserved source, item and state for %s', source => {
      const current = completedRoute(), items = useInventoryStore.getState().questItems;
      const original = items[source]; assert.ok(original);
      const missing = { ...items }; Reflect.deleteProperty(missing, source);
      for (const questItems of [missing, { ...items, [source]: { ...original, itemId: 'wrong-item' } },
        { ...items, [source]: { ...original, state: original.state === 'owned' ? 'consumed' as const : 'owned' as const } }]) {
        useInventoryStore.setState({ questItems });
        expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
      }
    });

  it.each([council, orb])('requires the own true receipt %s', source => {
    const current = completedRoute(), original = useMapStore.getState().questReceipts;
    const missing = { ...original }; Reflect.deleteProperty(missing, source);
    useMapStore.setState({ questReceipts: missing });
    expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
    const falseReceipt = { ...original }; Reflect.set(falseReceipt, source, false);
    useMapStore.setState({ questReceipts: falseReceipt });
    expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
  });

  it('rejects extra sources and receipts beyond the route graph', () => {
    const current = completedRoute(), map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
    useInventoryStore.setState({ questItems: { ...items, [`${khalim}#objective:obj-extra`]: {
      itemId: 'quest/khalims_brain', state: 'owned' } } });
    expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
    useInventoryStore.setState({ questItems: items });
    useMapStore.setState({ questReceipts: { ...map.questReceipts, [`${guardian}#action:extra`]: true } });
    expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
  });

  it.each(encounters)('requires the actual canonical clear %s beyond Act IV access', area => {
    const current = completedRoute();
    useMapStore.setState(state => ({ clearedSubAreas: state.clearedSubAreas.filter(id => id !== area) }));
    expect(useMapStore.getState().isActUnlocked(4)).toBe(true);
    expect(() => { assertActThreeComplete(current.suffix); }).toThrow();
  });
});


describe('verified partial Act III continuation', () => {
  function interrupted(count: number) {
    const current = fixture(), stopped = new Error('Retained Act III checkpoint');
    current.hook(row => {
      if (row.kind === 'quest-action' && current.actions.entries.length - current.act3Start === count) throw stopped;
    });
    expect(() => runActThree(profile, current.record, constructActThreeEncounter, current.actions)).toThrow(stopped);
    current.hook(() => undefined);
    return { ...current, prefix: current.actions.entries.slice(current.act3Start) };
  }

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])('continues prefix length %i without replaying prior encounters, actions or rewards', count => {
    const current = interrupted(count), entered: string[] = [], rewards: CampaignReward[] = [];
    const actions = createCampaignQuestActions(current.record, delta => { rewards.push(delta); });
    const prefix = structuredClone(current.prefix);
    const prepared = { ...profile, priority: [...profile.priority].reverse() };
    const result = resumeActThree(profile, current.record, area => {
      entered.push(area); constructActThreeEncounter(area);
    }, actions, prefix, () => prepared);
    expect(result).toBe(prepared);
    expect(prefix).toEqual(current.prefix);
    expect(entered).toEqual(encounters.slice(Math.min(4, count - 2)));
    expect(actions.entries.map(row => [row.action, row.id])).toEqual(order.slice(count));
    expect(rewards.reduce((total, delta) => total + delta.xp, 0)).toBe(count >= 8 ? 18000 : 26000);
    expect(() => { assertActThreeComplete([...prefix, ...actions.entries]); }).not.toThrow();
  });

  it.each(['order', 'failed', 'progress', 'items', 'receipts', 'clear', 'act2', 'custody'] as const)('rejects a mismatched %s checkpoint before preparation or any mutation', fault => {
      const current = interrupted(3), prefix = structuredClone(current.prefix), entered: string[] = [];
      const actions = createCampaignQuestActions(current.record, () => undefined);
      if (fault === 'order') prefix.reverse();
      if (fault === 'failed') { const row = prefix[2]; assert.ok(row); prefix[2] = { ...row, result: 'not-eligible' }; }
      if (fault === 'progress') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
        [guardian]: { id: guardian, status: 'completed', objectives: { 'obj-kill-mephisto': true } } } }));
      if (fault === 'items') useInventoryStore.setState({ questItems: current.act2Items });
      if (fault === 'receipts') useMapStore.setState({ questReceipts: { [council]: true } });
      if (fault === 'clear') useMapStore.setState(state => ({ clearedSubAreas: state.clearedSubAreas.filter(id => id !== marsh) }));
      if (fault === 'act2') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
        'quests/act2-seven-tombs': { id: 'quests/act2-seven-tombs', status: 'inProgress', objectives: {} } } }));
      if (fault === 'custody') actions.entries.push(...prefix);
      const before = snapshotStores(), prepare = vi.fn(() => profile);
      expect(() => resumeActThree(profile, current.record, area => { entered.push(area); }, actions, prefix, prepare)).toThrow();
      expect(snapshotStores()).toEqual(before);
      expect(entered).toEqual([]); expect(prepare).not.toHaveBeenCalled();
    });
});


it('resumes prepared Durance from the Orb prefix without repeating any prior quest action', () => {
  const current = fixture(), waves: CampaignWave[] = [], rewards: CampaignReward[] = [];
  usePlayerStore.getState().gainExperience(xpTotal(43) - xpTotal(hero().level) - hero().experience);
  useMapStore.getState().markCleared('areas/act1-dark-wood');
  const prepared = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' as const };
  const state = createActThreeAreaPreparation();
  let interrupted = false;
  const enter = (_act: number, area: string, phase: 'farm' | 'route') => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    if (phase === 'route') constructActThreeEncounter(area);
    const xp = phase === 'farm' && interrupted ? xpTotal(47) - xpTotal(hero().level) - hero().experience : 0;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ phase, area, ordinal, index: 0, outcome: 'victory',
      advance: phase === 'farm' && !interrupted ? 'next-wave' : 'victory',
      logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    if (phase === 'farm' && !interrupted) { interrupted = true; throw new CampaignStop('budget', 'Wall stop'); }
  };
  expect(() => runActThree(prepared, current.record, area => {
    enterPreparedActThreeArea(prepared, current.record, enter, state, area);
  }, current.actions)).toThrow('Wall stop');
  const prefix = current.actions.entries.slice(current.act3Start), parent = structuredClone(state);
  expect(prefix).toHaveLength(10);
  const before = observeEarnedState(); assertActThreeResumePrefix(prefix);
  const resumed = resumeActThreeAreaPreparation(state, waves, { afterAttempt: state.attempts.length,
    nextOrdinal: state.nextOrdinal, terminalXp: xpTotal(hero().level) + hero().experience, abandonedWaveIndex: 1,
    maxAdmissions: 615, maxCombatMs: 180_000_000, combatMs: 5, maxWallMs: 600_000, wallMs: 600_001 });
  expect(observeEarnedState()).toEqual(before); expect(state).toEqual(parent);
  const actions = createCampaignQuestActions(current.record, delta => { rewards.push(delta); });
  resumeActThree(prepared, current.record, area => {
    expect(area).toBe(durance); enterPreparedActThreeArea(prepared, current.record, enter, resumed, area);
  }, actions, prefix);
  expect(actions.entries.map(row => [row.action, row.id])).toEqual([['claim', guardian]]);
  expect(rewards.reduce((sum, delta) => sum + delta.xp, 0)).toBe(18000);
  expect(auditActThreeAreaPreparation(resumed, waves)).toMatchObject({ completed: true, routeAreas: 5, admissions: 7 });
  assertActThreeComplete([...prefix, ...actions.entries]);
});

/** Constructed route returns/throws exercise dispatch and cleanup, never earned viability. */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, observeEarnedState, observeStore, resetEarnedStores } from '../sim/production/earned-state';
import * as creation from '@/features/character/createCharacter';
import { claimCampaignQuest } from './actions';
import { runCampaign } from './native-runner';
import { runActOne, CampaignStop } from './route';
import { runActTwo } from './act2-route';
import * as openingAudit from './opening-audit';
import * as javelinTraining from './javelin-training';
import * as preparation from './preparation';
import * as areaPreparation from './act2-area-preparation';
import { decodeSave } from '@/engine/save/validate';
import * as saveValidation from '@/engine/save/validate';
import { snapshotStores, exportCurrentSave } from '@/stores/persistence';
import * as admission from './admission';

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./act2-route', async original => ({ ...await original<typeof import('./act2-route')>(), runActTwo: vi.fn() }));

let restores: (() => void)[];
let pity: number;
beforeEach(() => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(runActTwo).mockReset();
});
afterEach(() => { vi.restoreAllMocks(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });
const sisters = 'quests/act1-sisters-to-the-slaughter';
const radament = 'quests/act2-radaments-lair';
const staffQuest = 'quests/act2-horadric-staff';
const suffixQuests = [radament, staffQuest, 'quests/act2-tainted-sun',
  'quests/act2-arcane-sanctuary', 'quests/act2-seven-tombs'];
const book = `${radament}#reward:questItem`;
const cube = `${staffQuest}#objective:obj-cube`;
const shaft = `${staffQuest}#objective:obj-shaft`;
const dryHills = 'areas/act2-dry-hills';
const oasis = 'areas/act2-far-oasis';

function expectedSuffixPrefix(read: boolean) {
  return [...suffixQuests.map(id => ['start', id, 'ok'] as const),
    ['visit', dryHills, 'ok'], ['recover', cube, 'ok'], ['recover', shaft, 'ok'],
    ['claim', radament, 'ok'], ...(read ? [['read', book, 'ok']] : [])];
}

function constructedSuffixPrefix(actions: Parameters<typeof runActTwo>[3]) {
  for (const id of suffixQuests) actions.start(id);
  actions.visit(dryHills); actions.recover(cube);
  // Disclosed constructed encounter only: no wave or earned combat proof is inferred.
  const map = useMapStore.getState();
  map.setCurrentLocation(2, oasis);
  map.recordMonsterKills({ actId: 'acts/act2', areaId: oasis,
    archetypeIds: ['monsters/act2.radament'] });
  map.markCleared(oasis);
  actions.recover(shaft); actions.claim(radament); actions.read(book);
}

function constructedPrefix() {
  vi.mocked(runActOne).mockImplementation((_profile, record, _enter, reward) => {
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
}

it.each([
  { mode: 'area-prepared-act2-v1', profileId: 'amazon-bow-volley-v1' },
  { mode: 'challenge-prepared-act2-v1', profileId: 'amazon-bow-survival-managed-v1' },
  { mode: 'route-first-act2-v1', profileId: 'amazon-bow-volley-v1' },
  { mode: 'area-prepared-retry-act2-v1', profileId: 'amazon-bow-survival-owned-v1' },
  { mode: 'area-prepared-retry-act2-v1', profileId: 'amazon-bow-survival-managed-v1' }
])('retains $mode/$profileId and its audit after a bounded Act II dispatch stop', ({ mode, profileId }) => {
  constructedPrefix();
  const prefix = vi.mocked(runActOne).getMockImplementation();
  vi.mocked(runActOne).mockImplementation((...args) => {
    prefix?.(...args);
    useMapStore.getState().markCleared('areas/act1-dark-wood');
  });
  const prepareStage = vi.spyOn(preparation, 'prepareCampaignStage').mockImplementation(() => undefined);
  // Constructed stop before any admission tests wiring and checkpoint retention only.
  vi.spyOn(areaPreparation, 'runAreaPreparedActTwo').mockImplementation((_profile, _record, _enter, _actions, state) => {
    state.failureStatus = 'budget'; state.failure = 'Constructed area preparation stop';
    throw new CampaignStop('budget', state.failure);
  });
  const outer = surroundingRealm();
  const report = runCampaign('act2', profileId, () => undefined, 'none', undefined, mode);
  expect(prepareStage).toHaveBeenCalledTimes(mode === 'route-first-act2-v1' ? 0 : 1);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Constructed area preparation stop');
  expect(report.actTwoAreaPreparation).toMatchObject({ mode,
    attempts: [], completed: false, failureStatus: 'budget' });
  expect(report.actTwoAreaPreparationAudit).toEqual({ completed: false, admissions: 0,
    carriedRouteAttempts: 0, trainingAdmissions: 0, trainingNonwins: 0, routeAreas: 0, xp: 0, nonwinOrdinals: [],
    continuation: { routeIndex: 0, terminalXp: 8000,
      cleared: ['areas/act1-catacombs', 'areas/act1-dark-wood'], trainingAdmissions: 0,
      trainingNonwins: 0, consecutiveNonwins: 0, perArea: {},
      farm: { act: 1, area: 'areas/act1-dark-wood' }, fallback: false } });
  expect(runActTwo).not.toHaveBeenCalled();
  expect(report.successor?.map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(report.exported).not.toBeNull();
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(getIdleEliteMisses()).toBe(outer.pity);
});

function realm() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore),
    hydration: observeStore(useHydrationStore) };
}

/** Nonempty surrounding state catches reset-instead-of-restore cleanup mistakes. */
function surroundingRealm() {
  vi.spyOn(Date, 'now').mockReturnValue(1793304123456);
  useHydrationStore.getState().setStatus('ready');
  expect(creation.createCharacter('Retained realm', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(750);
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-cold-plains');
  useMapStore.getState().markCleared('areas/act1-blood-moor');
  useMetaStore.getState().setIdleTarget('a1-cold-plains');
  setIdleEliteMisses(23);
  useHydrationStore.getState().setStatus('loading');
  return { state: realm(), now: Date.now, value: Date.now(), pity: getIdleEliteMisses() };
}

it('retains the complete boss entry save before a recorder failure can admit combat', () => {
  vi.mocked(runActOne).mockImplementation((_profile, _record, enter) => {
    enter('areas/act1-catacombs', 'route');
  });
  const entries: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act1', 'sorceress-cold', entry => {
    entries.push(entry);
    if (entry.kind === 'campaign-boss-checkpoint') throw new Error('Boss entry checkpoint disk full');
  });
  const checkpoints = entries.filter(entry => entry.kind === 'campaign-boss-checkpoint');
  expect(checkpoints).toHaveLength(1);
  const checkpoint = checkpoints[0];
  expect(checkpoint).toMatchObject({ boundary: 'before-admission', questId: sisters, act: 1,
    area: 'areas/act1-catacombs', snapshot: { map: { challengeOrdinals: { normal: 0 } } } });
  if (!checkpoint || typeof checkpoint.exported !== 'string') throw new Error('Missing complete boss entry save');
  expect(decodeSave(JSON.parse(checkpoint.exported) as unknown)).toEqual(checkpoint.snapshot);
  expect(report.failure).toContain('Boss entry checkpoint disk full');
  expect(report.technicalStatus).toBe('failed');
  expect(report.admissions).toBe(0);
  expect(report.successor?.map.challengeOrdinals.normal).toBe(0);
  expect(entries.some(entry => entry.kind === 'admission')).toBe(false);
  expect(report.totals).toMatchObject({ playedWaves: 0 });
});

it('binds the first boss entry to its acquisition prefix before combat can start', () => {
  vi.mocked(runActOne).mockImplementation((_profile, _record, enter) => {
    enter('areas/act1-catacombs', 'farm');
  });
  const start = vi.spyOn(admission, 'startCampaignAdmission').mockImplementation(() => {
    throw new Error('Combat admitted before first-entry recording');
  });
  const entries: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act1', 'sorceress-cold-intended-v1', entry => {
    entries.push(entry);
    if (entry.kind === 'campaign-first-boss-entry') throw new Error('First-entry disk full');
  });
  expect(report.failure).toContain('First-entry disk full');
  expect(start).not.toHaveBeenCalled();
  expect(report.admissions).toBe(0);
  expect(report).toMatchObject({ firstBossEntries: [{ phase: 'farm', questId: sisters,
    ordinal: 0, costs: { combatMs: 0, admissions: 0, decisionAdjustedMs: null } }] });
  expect(entries.filter(entry => entry.kind === 'campaign-boss-checkpoint')).toHaveLength(1);
  expect(entries.filter(entry => entry.kind === 'campaign-first-boss-entry')).toHaveLength(1);
});

it('rejects unknown requests before native creation or either route', () => {
  const create = vi.spyOn(creation, 'createCharacter');
  for (const [phase, id] of [['act6', 'sorceress-cold'], ['act2', 'constructor']])
    expect(() => runCampaign(phase ?? '', id ?? '', () => undefined)).toThrow();
  expect(create).not.toHaveBeenCalled();
  expect(runActOne).not.toHaveBeenCalled(); expect(runActTwo).not.toHaveBeenCalled();
});

it.each(['screen', 'level-training-v1'] as const)('selects opening recovery only for explicit %s execution', execution => {
  const report = runCampaign('act1', 'sorceress-cold-nova-focus', () => undefined,
    'none', undefined, execution);
  const selected = vi.mocked(runActOne).mock.calls[0]?.[4];
  expect(selected).toBe(report.recovery);
  expect(selected?.opening).toEqual(execution === 'level-training-v1'
    ? { mode: 'den-training-v1', cycles: [] } : undefined);
  expect(report.openingAudit).toEqual({ cycles: 0, trainingAdmissions: 0,
    trainingXp: 0, failureOrdinals: [], trainingNonwinOrdinals: [] });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
});

it.each(['screen', 'javelin-earned-v1'] as const)('wires post-Den acquisition only for %s execution', execution => {
  const acquisition = vi.spyOn(javelinTraining, 'prepareJavelinAcquisition').mockImplementation(() => undefined);
  vi.mocked(runActOne).mockImplementation((_profile, _record, _enter, _reward, _recovery, afterDen) => {
    afterDen?.();
  });
  const report = runCampaign('act1', 'amazon-javelin-poison2-impale1', () => undefined,
    'none', undefined, execution);
  expect(acquisition).toHaveBeenCalledTimes(execution === 'javelin-earned-v1' ? 1 : 0);
  expect(report.javelinAcquisitionAudit).toEqual({ stages: 0, admissions: 0, xp: 0, combatMs: 0, nonwinOrdinals: [] });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
});

it('retains the native checkpoint and other audits after an independent opening audit fails', () => {
  vi.spyOn(openingAudit, 'auditCampaignOpening').mockImplementation(() => {
    throw new Error('Constructed independent opening audit failure');
  });
  const before = observeEarnedState(), now = Date.now;
  const report = runCampaign('act1', 'sorceress-cold-nova-focus', () => undefined,
    'none', undefined, 'level-training-v1');
  expect(report.technicalStatus).toBe('failed');
  expect(report.failure).toContain('Checkpoint opening:');
  expect(report.openingAudit).toBeNull();
  expect(report.preparationAudit).not.toBeNull(); expect(report.questAudit).not.toBeNull();
  expect(report.economyAudit).not.toBeNull(); expect(report.exported).not.toBeNull();
  expect(observeEarnedState()).toEqual(before); expect(Date.now).toBe(now);
});

it.each(['decoder-rejection', 'decoded-state-mismatch'] as const)(
  'journals the exact terminal save before %s and restores the surrounding realm', failure => {
    const outer = surroundingRealm(), nativeDecode = saveValidation.decodeSave;
    let terminal: Readonly<Record<string, unknown>> | undefined;
    let validationStarted = false;
    const captured: { entry: Readonly<Record<string, unknown>>; validationStarted: boolean }[] = [];
    vi.mocked(runActOne).mockImplementation(() => {
      usePlayerStore.getState().gainExperience(17);
      useInventoryStore.getState().addCurrency('rune-shard', 3);
      terminal = { kind: 'stopped-native-checkpoint', snapshot: snapshotStores(), exported: exportCurrentSave() };
      vi.spyOn(saveValidation, 'decodeSave').mockImplementation(value => {
        validationStarted = true;
        if (failure === 'decoder-rejection') throw new Error('Constructed terminal decoder rejection');
        const decoded = nativeDecode(value);
        return { ...decoded, player: { ...decoded.player, name: 'Constructed decoded mismatch' } };
      });
      throw new CampaignStop('budget', 'Constructed terminal stop');
    });
    const report = runCampaign('act1', 'sorceress-cold', entry => {
      if (entry.kind === 'stopped-native-checkpoint')
        captured.push({ entry: structuredClone(entry), validationStarted });
    });
    expect(captured).toEqual([{ entry: terminal, validationStarted: false }]);
    expect(saveValidation.decodeSave).toHaveBeenCalledTimes(1);
    expect(report.technicalStatus).toBe('failed');
    expect(report.gameplayStatus).toBe('budget');
    expect(report.failure).toContain('Constructed terminal stop');
    expect(report.failure).toContain('Checkpoint:');
    expect(report.failure).toContain(failure === 'decoder-rejection'
      ? 'Constructed terminal decoder rejection' : 'Constructed decoded mismatch');
    expect(report.successor).toEqual(terminal?.snapshot);
    expect(report.exported).toBe(terminal?.exported);
    expect(typeof report.exported).toBe('string');
    expect(nativeDecode(JSON.parse(report.exported ?? '') as unknown)).toEqual(report.successor);
    expect(report.admissions).toBe(0); expect(report.waves).toEqual([]);
    expect(realm()).toEqual(outer.state);
    expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
    expect(getIdleEliteMisses()).toBe(outer.pity);
  }
);

it.each(['nonwin', 'budget', 'technical'] as const)('stops before any suffix when the prefix ends with %s', status => {
  vi.mocked(runActOne).mockImplementation(() => {
    if (status === 'technical') throw new Error('Constructed prefix failure');
    throw new CampaignStop(status, 'Constructed prefix stop');
  });
  const before = observeEarnedState(), now = Date.now;
  const report = runCampaign('act2', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe(status === 'technical' ? 'failed' : 'completed');
  expect(report.gameplayStatus).toBe(status === 'technical' ? 'incomplete' : status);
  expect(runActOne).toHaveBeenCalledTimes(1); expect(runActTwo).not.toHaveBeenCalled();
  expect(report.admissions).toBe(0);
  expect(observeEarnedState()).toEqual(before); expect(Date.now).toBe(now);
});

it.each(['clear-only', 'claimed-flags-only'] as const)('rejects a fake prefix return with %s evidence', kind => {
  vi.mocked(runActOne).mockImplementation(() => {
    useMapStore.getState().markCleared('areas/act1-catacombs');
    if (kind === 'claimed-flags-only') useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', rewardClaimed: true, objectives: { 'obj-kill-andariel': true } });
  });
  const report = runCampaign('act2', 'sorceress-fire', () => undefined);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(runActTwo).not.toHaveBeenCalled(); expect(report.admissions).toBe(0);
});

it('creates and hires once, records a native prefix Claim, then dispatches the suffix and restores originals', () => {
  vi.mocked(runActOne).mockImplementation((_profile, record, _enter, reward) => {
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
  vi.mocked(runActTwo).mockImplementation(() => { throw new CampaignStop('budget', 'Constructed suffix stop'); });
  setIdleEliteMisses(7); useMetaStore.getState().setIdleTarget('a1-blood-moor');
  const before = observeEarnedState(), now = Date.now;
  const records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => { records.push(record); });
  expect(runActOne).toHaveBeenCalledTimes(1); expect(runActTwo).toHaveBeenCalledTimes(1);
  expect(records.filter(row => row.kind === 'created')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'hire')).toHaveLength(1);
  expect(records.findIndex(row => row.kind === 'fresh-act1-prefix'))
    .toBeGreaterThan(records.findIndex(row => row.kind === 'quest-claim'));
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.economyAudit?.xp).toBe(8000);
  expect(report.successor?.map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(observeEarnedState()).toEqual(before); expect(Date.now).toBe(now); expect(getIdleEliteMisses()).toBe(7);
});

it.each([
  ['claim', false], ['read', false], ['claim', true], ['read', true]
] as const)('retains suffix %s evidence when action recording fails (checkpoint failure=%s)', (trigger, failCheckpoint) => {
  constructedPrefix();
  let continued = false, checkpointAttempts = 0;
  vi.mocked(runActTwo).mockImplementation((_profile, _record, _enter, actions) => {
    constructedSuffixPrefix(actions);
    continued = true;
    throw new CampaignStop('budget', 'Unexpected continuation after failed recorder');
  });
  const outer = surroundingRealm();
  const records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => {
    records.push(record);
    if (record.kind === 'stopped-native-checkpoint') {
      checkpointAttempts++;
      if (failCheckpoint) throw new Error('Constructed suffix checkpoint recorder failure');
    }
    if (record.kind === 'quest-action' && record.action === trigger &&
      record.id === (trigger === 'claim' ? radament : book))
      throw new Error('Constructed suffix action recorder failure');
  });
  expect(continued).toBe(false);
  expect(runActOne).toHaveBeenCalledTimes(1); expect(runActTwo).toHaveBeenCalledTimes(1);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(report.failure).toContain('Constructed suffix action recorder failure');
  if (failCheckpoint) {
    expect(report.failure).toContain('Checkpoint:');
    expect(report.failure).toContain('Constructed suffix checkpoint recorder failure');
  } else expect(report.failure).not.toContain('Checkpoint:');
  expect(checkpointAttempts).toBe(1);
  expect(report.questActions.map(entry => [entry.action, entry.id, entry.result]))
    .toEqual(expectedSuffixPrefix(trigger === 'read'));
  expect(report.questRewards).toHaveLength(2);
  expect(report.questRewards.map(delta => delta.xp)).toEqual([8000, 5000]);
  expect(report.totals.earnings.quests.xp).toBe(13000);
  expect(report.totals.earnings.allEarned.xp).toBe(13000);
  expect(report.economyAudit).toEqual({ xp: 13000,
    addedItems: report.questRewards.reduce((count, delta) => count + delta.addedItems.length, 0) });
  expect(report.successor?.map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(report.successor?.map.questProgress[radament]?.rewardClaimed).toBe(true);
  expect(report.successor?.inventory.questItems[book]).toEqual({ itemId: 'items/book_of_skill',
    state: trigger === 'read' ? 'consumed' : 'owned' });
  if (trigger === 'read') {
    const read = report.questActions.find(entry => entry.action === 'read');
    expect(read?.before.player).not.toBeNull();
    expect(read?.after.player?.skillPoints).toBe((read?.before.player?.skillPoints ?? 0) + 1);
    expect(report.successor?.player.skillPoints).toBe(read?.after.player?.skillPoints);
  }
  expect(report.exported).not.toBeNull();
  expect(report.admissions).toBe(0); expect(report.waves).toEqual([]);
  expect(records.filter(record => record.kind === 'created')).toHaveLength(1);
  expect(records.filter(record => record.kind === 'hire')).toHaveLength(1);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

it.each([
  ['nonwin', false], ['budget', false], ['nonwin', true], ['budget', true]
] as const)('preserves a constructed suffix %s and retained rewards (checkpoint failure=%s)', (status, failCheckpoint) => {
  constructedPrefix();
  vi.mocked(runActTwo).mockImplementation((_profile, _record, _enter, actions) => {
    constructedSuffixPrefix(actions);
    // Constructed stop only: no wave was played, and no combat settlement is claimed.
    throw new CampaignStop(status, `Constructed suffix ${status} stop`);
  });
  const outer = surroundingRealm();
  let checkpointAttempts = 0;
  const report = runCampaign('act2', 'sorceress-cold', record => {
    if (record.kind === 'stopped-native-checkpoint') {
      checkpointAttempts++;
      if (failCheckpoint) throw new Error('Constructed stopped-checkpoint recorder failure');
    }
  });
  expect(report.technicalStatus).toBe(failCheckpoint ? 'failed' : 'completed');
  expect(report.gameplayStatus).toBe(status);
  expect(report.failure).toContain(`Constructed suffix ${status} stop`);
  if (failCheckpoint) {
    expect(report.failure).toContain('Checkpoint:');
    expect(report.failure).toContain('Constructed stopped-checkpoint recorder failure');
  } else expect(report.failure).not.toContain('Checkpoint:');
  expect(checkpointAttempts).toBe(1);
  expect(report.questActions.map(entry => [entry.action, entry.id, entry.result])).toEqual(expectedSuffixPrefix(true));
  expect(report.questRewards.map(delta => delta.xp)).toEqual([8000, 5000]);
  expect(report.economyAudit).toEqual({ xp: 13000,
    addedItems: report.questRewards.reduce((count, delta) => count + delta.addedItems.length, 0) });
  expect(report.totals.earnings.allEarned.xp).toBe(13000);
  expect(report.successor?.inventory.questItems[book]).toEqual({ itemId: 'items/book_of_skill', state: 'consumed' });
  expect(report.successor?.map.questProgress[radament]?.rewardClaimed).toBe(true);
  expect(report.successor).not.toBeNull(); expect(report.exported).not.toBeNull();
  expect(report.admissions).toBe(0); expect(report.waves).toEqual([]);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

/** Constructed settled waves test native counter/allocation custody, not earned campaign balance. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { javelinTrainingRequest } from './javelin-progression';
import { resumeJavelinTraining, type JavelinTrainingCheckpoint } from './javelin-training';
import { auditCampaignTraining } from './training-audit';
import { CampaignStop } from './route';
import type { CampaignProfile, CampaignWave } from './policy';

const profile: CampaignProfile = { ...campaignProfiles['amazon-javelin-poison2-impale1'], progressionPolicy: 'javelin-earned-v1' };
const area = 'areas/act5-bloody-foothills', entry = 'areas/act5-crystalline-passage';
let restores: (() => void)[];
beforeEach(() => {
 restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
 vi.spyOn(Date, 'now').mockReturnValue(1793304000000); expect(createCharacter('Resume', 'amazon').ok).toBe(true);
 const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
 expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
 usePlayerStore.getState().gainExperience(xpTotal(54));
 vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
 useMapStore.getState().setCurrentLocation(5, 'a5-bloody-foothills'); useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function fixture(outcomes: readonly ('victory' | 'defeat')[] = ['victory']) {
 const request = javelinTrainingRequest(5, entry); assert.ok(request);
 const player = usePlayerStore.getState().player; assert.ok(player);
 const waves: CampaignWave[] = outcomes.map((outcome, ordinal) => ({ phase: 'farm', area, ordinal, index: 0,
  outcome, advance: outcome === 'victory' ? 'victory' : 'defeat', logicalMs: 1.25, xp: 0, items: 0,
  heroLife: outcome === 'victory' ? 1 : 0, heroMana: 1 }));
 useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: outcomes.length } }));
 const prior: JavelinTrainingCheckpoint = { entryAct: 5, entryArea: entry, request,
  startOrdinal: 0, nextOrdinal: outcomes.length, fromXp: xpTotal(player.level) + player.experience,
  terminalXp: xpTotal(player.level) + player.experience, startCombatMs: 10,
  terminalCombatMs: 10 + outcomes.length * 1.25, result: null, failure: 'Recorder', failureStatus: 'technical' };
 return { prior, waves };
}
function admit(waves: CampaignWave[], xp: number, outcome: 'victory' | 'defeat' = 'victory') {
 const ordinal = useMapStore.getState().challengeOrdinals.normal;
 useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
 usePlayerStore.getState().gainExperience(xp);
 waves.push({ phase: 'farm', area, ordinal, index: 0, outcome,
  advance: outcome === 'victory' ? 'victory' : 'defeat', logicalMs: 1.25, xp, items: 0,
  heroLife: outcome === 'victory' ? 1 : 0, heroMana: 1 });
 if (outcome === 'defeat') throw new CampaignStop('nonwin', 'Settled', { area, phase: 'farm', ordinal, index: 0, outcome });
}

it('continues a settled checkpoint cumulatively and leaves its history unchanged', () => {
 const { prior, waves } = fixture(), original = structuredClone(prior), added: CampaignWave[] = [], retained: JavelinTrainingCheckpoint[] = [];
 let ms = prior.terminalCombatMs;
 resumeJavelinTraining(profile, prior, waves, () => undefined, () => {
  const xp = xpTotal(55) - prior.terminalXp; ms += 1.25; admit(added, xp);
 }, row => { retained.push(row); }, () => ms, true);
 expect(prior).toEqual(original); expect(added).toHaveLength(1);
 const checkpoint = retained[0]; assert.ok(checkpoint);
 expect(checkpoint.startOrdinal).toBe(0); expect(checkpoint.startCombatMs).toBe(10);
 expect(checkpoint.result).toMatchObject({ admissions: 2, wins: 2, nonwins: 0, fromLevel: 54, terminalLevel: 55 });
 expect(auditCampaignTraining(checkpoint, [...waves, ...added])).toMatchObject({ admissions: 2 });
});

it('carries trailing losses, resets them on a new win and stops at the original consecutive bound', () => {
 const { prior, waves } = fixture(['defeat', 'defeat']), added: CampaignWave[] = [], retained: JavelinTrainingCheckpoint[] = [];
 const outcomes = ['victory', 'defeat', 'defeat', 'defeat'] as const; let index = 0, ms = prior.terminalCombatMs;
 expect(() => { resumeJavelinTraining(profile, prior, waves, () => undefined, () => {
  const outcome = outcomes[index++]; assert.ok(outcome); ms += 1.25; admit(added, 0, outcome);
 }, row => { retained.push(row); }, () => ms, true); }).toThrow('retry-limit');
 expect(index).toBe(4); const checkpoint = retained[0]; assert.ok(checkpoint);
 expect(checkpoint.result).toMatchObject({ admissions: 6, wins: 1, nonwins: 5, consecutiveNonwins: 3 });
 expect(auditCampaignTraining(checkpoint, [...waves, ...added]).nonwinOrdinals).toHaveLength(5);
});

it('does not replenish an exhausted original admission allowance', () => {
 const { prior, waves } = fixture(Array.from({ length: 600 }, () => 'victory' as const)), retained: JavelinTrainingCheckpoint[] = [];
 expect(() => { resumeJavelinTraining(profile, prior, waves, () => undefined,
  () => { throw new Error('Unexpected admission'); }, row => { retained.push(row); }, () => prior.terminalCombatMs, true); }).toThrow('admission-limit');
 expect(retained[0]?.result).toMatchObject({ admissions: 600, wins: 600 });
});

it('retains the original total-loss bound even when earlier victories reset consecutive losses', () => {
 const { prior, waves } = fixture(Array.from({ length: 18 }, (_unused, index) => index % 2 ? 'victory' : 'defeat'));
 const added: CampaignWave[] = [], retained: JavelinTrainingCheckpoint[] = []; let ms = prior.terminalCombatMs;
 expect(() => { resumeJavelinTraining(profile, prior, waves, () => undefined, () => {
  ms += 1.25; admit(added, 0, 'defeat');
 }, row => { retained.push(row); }, () => ms, true); }).toThrow('retry-limit');
 expect(added).toHaveLength(1);
 expect(retained[0]?.result).toMatchObject({ admissions: 19, nonwins: 10, consecutiveNonwins: 1 });
});

it('does not restart a stage whose original consecutive-loss bound is already exhausted', () => {
 const { prior, waves } = fixture(['defeat', 'defeat', 'defeat']);
 expect(() => { resumeJavelinTraining(profile, prior, waves, () => undefined,
  () => { throw new Error('Unexpected admission'); }, () => undefined,
  () => prior.terminalCombatMs, true); }).toThrow('retry-limit');
});

it('does not replenish consumed combat time before reserving another whole admission', () => {
 const { prior, waves } = fixture(); prior.terminalCombatMs = prior.startCombatMs + prior.request.maxCombatMs;
 const first = waves[0]; assert.ok(first); waves[0] = { ...first, logicalMs: prior.request.maxCombatMs };
 const retained: JavelinTrainingCheckpoint[] = [];
 expect(() => { resumeJavelinTraining(profile, prior, waves, () => undefined,
  () => { throw new Error('Unexpected admission'); }, row => { retained.push(row); }, () => prior.terminalCombatMs, true); }).toThrow('whole-area');
 expect(retained[0]?.nextOrdinal).toBe(prior.nextOrdinal);
});

it.each(['xp', 'ordinal', 'clock', 'policy', 'unsettled', 'missing-clear'] as const)(
 'rejects %s mismatch before allocation, recording or admission', fault => {
  const { prior, waves } = fixture(); let clock = prior.terminalCombatMs;
  if (fault === 'xp') prior.terminalXp++;
  if (fault === 'ordinal') useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: 2 } }));
  if (fault === 'clock') clock++;
  if (fault === 'policy') Object.assign(prior, { request: { ...prior.request, maxAdmissions: 601 } });
  if (fault === 'unsettled') { const first = waves[0]; assert.ok(first); waves[0] = { ...first, advance: 'next-wave' }; }
  if (fault === 'missing-clear') useMapStore.setState({ clearedSubAreas: [] });
  const before = observeEarnedState();
  const expected = { xp: /XP/, ordinal: /ordinal/, clock: /clock/, policy: /policy/,
   unsettled: /settled/, 'missing-clear': /cleared/ }[fault];
  expect(() => { resumeJavelinTraining(profile, prior, waves,
   () => { throw new Error('Unexpected record'); }, () => { throw new Error('Unexpected admission'); },
   () => { throw new Error('Unexpected retain'); }, () => clock, true); }).toThrow(expected);
  expect(observeEarnedState()).toEqual(before);
 });

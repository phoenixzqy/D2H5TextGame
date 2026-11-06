/** Constructed encounter/XP fixtures test policy only; never earned viability evidence. */
import { beforeEach, afterEach, expect, it } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { runActOne, runActOneMainQuest, CampaignStop, type CampaignSettledNonwin } from './route';
import { observeEarnedState } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { campaignRecoveryMode, type CampaignProfile } from './policy';
import { intendedCampaignProfiles } from './intended-profiles';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Recovery fixture', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(12));
});
afterEach(() => { for (const restore of restores) restore(); });

const catacombs = 'areas/act1-catacombs', wood = 'areas/act1-dark-wood';
function fixture(options: { failures?: number; trainingXp?: boolean; trainingEvery?: number; failTraining?: Error;
  routeError?: Error; failRecord?: string } = {}) {
  const records: Readonly<Record<string, unknown>>[] = [];
  const admissions: { area: string; phase: string; ordinal: number; level: number }[] = [];
  const recovery: NonNullable<Parameters<typeof runActOne>[4]> = { mode: 'act1-training-v1', cycles: [] };
  let failures = options.failures ?? 1;
  let training = 0;
  const enter: Parameters<typeof runActOne>[2] = (area, phase) => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    const level = usePlayerStore.getState().player?.level ?? 0;
    admissions.push({ area, phase, ordinal, level });
    if (phase === 'farm') {
      if (options.failTraining) throw options.failTraining;
      if (options.trainingXp !== false && ++training % (options.trainingEvery ?? 1) === 0) {
        const player = usePlayerStore.getState().player;
        if (!player) throw new Error('Missing fixture player');
        usePlayerStore.getState().gainExperience(xpTotal(level + 1) - xpTotal(level) - player.experience);
      }
    }
    if (area === catacombs && failures-- > 0) {
      if (options.routeError) throw options.routeError;
      throw new CampaignStop('nonwin', 'Constructed settled draw', { area, phase: 'route', ordinal,
        index: 4, outcome: 'draw' });
    }
    // Disclosed constructed encounter prerequisites; actual Start/Claim/allocation are native.
    useMapStore.getState().markCleared(area);
    if (area === catacombs) useMapStore.getState().recordBossKill({ actId: 'acts/act1', areaId: area,
      bossArchetypeId: 'monsters/act1.andariel' });
  };
  const run = () => { runActOne(campaignProfiles['sorceress-cold'], entry => {
    records.push(entry);
    if (entry.kind === options.failRecord) throw new Error('Recorder failed');
  }, enter, () => undefined, recovery); };
  return { run, enter, records, admissions, recovery };
}

it('retains the failed admission, earns one training level, and retries the whole area once', () => {
  const f = fixture(); f.run();
  expect(f.admissions.slice(-3)).toEqual([
    { area: catacombs, phase: 'route', ordinal: 5, level: 12 },
    { area: wood, phase: 'farm', ordinal: 6, level: 12 },
    { area: catacombs, phase: 'route', ordinal: 7, level: 13 }
  ]);
  expect(f.recovery.cycles).toMatchObject([{ failure: { ordinal: 5, index: 4, outcome: 'draw' },
    fromLevel: 12, targetLevel: 13, trainingOrdinals: [6], retryOrdinal: 7, resolution: 'retry-won' }]);
  expect(f.records.filter(row => row.kind === 'quest-claim').map(row => row.id))
    .toEqual(['quests/act1-den-of-evil', 'quests/act1-sisters-to-the-slaughter']);
  expect(f.records.filter(row => row.kind === 'recovery-resolved')).toHaveLength(1);
  expect(usePlayerStore.getState().player).toMatchObject({ level: 13, statPoints: 0, skillPoints: 0 });
  expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
});

it('resolves both failed retries and stops after two total training/retry cycles', () => {
  const f = fixture({ failures: 4 });
  expect(f.run).toThrow('Constructed settled draw');
  expect(f.admissions.filter(row => row.area === catacombs)).toHaveLength(3);
  expect(f.recovery.cycles.map(row => row.resolution)).toEqual(['retry-nonwin', 'retry-nonwin']);
  expect(f.records.filter(row => row.kind === 'recovery-resolved')).toHaveLength(2);
  expect(usePlayerStore.getState().player?.level).toBe(14);
});

it('stops after twelve training admissions without a level instead of retrying', () => {
  const f = fixture({ trainingXp: false });
  expect(f.run).toThrow('Recovery training admission limit');
  expect(f.admissions.filter(row => row.phase === 'farm')).toHaveLength(12);
  expect(f.admissions.filter(row => row.area === catacombs)).toHaveLength(1);
  expect(f.recovery.cycles).toMatchObject([{ resolution: 'stopped', retryOrdinal: null }]);
});

it.each(['nonwin', 'budget', 'technical'] as const)('propagates training %s without another recovery', kind => {
  const error = kind === 'technical' ? new Error('Training error') : new CampaignStop(kind, 'Training stop');
  const f = fixture({ failTraining: error });
  expect(f.run).toThrow(error);
  expect(f.recovery.cycles).toMatchObject([{ resolution: 'stopped', trainingOrdinals: [6] }]);
  expect(f.admissions.filter(row => row.area === catacombs)).toHaveLength(1);
});

it.each(['unsettled', 'budget', 'technical'] as const)('never recovers a route %s exception', kind => {
  const error = kind === 'technical' ? new Error('Route error') :
    new CampaignStop(kind === 'budget' ? 'budget' : 'nonwin', 'Unsettled route stop');
  const f = fixture({ routeError: error });
  expect(f.run).toThrow(error); expect(f.recovery.cycles).toEqual([]);
  expect(f.admissions.filter(row => row.phase === 'farm')).toEqual([]);
});

it('preserves the default first-nonwin behavior', () => {
  const f = fixture();
  expect(() => { runActOne(campaignProfiles['sorceress-cold'], () => undefined, f.enter, () => undefined); })
    .toThrow('Constructed settled draw');
  expect(f.admissions.filter(row => row.phase === 'farm')).toEqual([]);
});

it('does not recover at the L14 ceiling', () => {
  usePlayerStore.getState().gainExperience(xpTotal(14) - xpTotal(12));
  const f = fixture(); expect(f.run).toThrow('Constructed settled draw');
  expect(f.recovery.cycles).toEqual([]);
});

it.each(['recovery-start', 'recovery-training', 'recovery-attempt-retry'])(
  'keeps %s recorder failure technical without inventing a retry admission', kind => {
  const f = fixture({ failRecord: kind });
  expect(f.run).toThrow('Recorder failed');
  expect(f.recovery.cycles).toMatchObject([{ resolution: 'stopped', retryOrdinal: null }]);
  expect(f.admissions.filter(row => row.area === catacombs)).toHaveLength(1);
});

it('enforces twenty total training admissions across both cycles', () => {
  const f = fixture({ failures: 4, trainingEvery: 11 });
  expect(f.run).toThrow('Recovery training admission limit');
  expect(f.recovery.cycles.map(row => row.trainingOrdinals.length)).toEqual([11, 9]);
  expect(f.recovery.cycles.map(row => row.resolution)).toEqual(['retry-nonwin', 'stopped']);
});

it.each(['intro', 'den', 'acquisition'] as const)('never recovers a %s nonwin', stage => {
  if (stage !== 'den') {
    resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
    expect(createCharacter('Early stop', 'sorceress').ok).toBe(true);
    if (stage === 'acquisition') usePlayerStore.getState().gainExperience(xpTotal(6));
  }
  const f = fixture();
  expect(() => { runActOne(campaignProfiles['sorceress-cold'], () => undefined, (area, phase) => {
    if (stage === 'acquisition' && phase === 'route') { f.enter(area, phase); return; }
    throw new CampaignStop('nonwin', 'Early settled stop', { area, phase, ordinal: 0, index: 0, outcome: 'defeat' });
  }, () => undefined, f.recovery); }).toThrow('Early settled stop');
  expect(f.recovery.cycles).toEqual([]);
});

it('parses only the declared recovery modes', () => {
  expect(campaignRecoveryMode(undefined)).toBe('none');
  expect(campaignRecoveryMode('none')).toBe('none');
  expect(campaignRecoveryMode('act1-training-v1')).toBe('act1-training-v1');
  for (const value of ['', 'act2-training-v1', 'constructor'])
    expect(() => campaignRecoveryMode(value)).toThrow('Unknown campaign recovery mode');
});

/** Constructed farm results exercise the complete native quest/allocation route. */
function acquisitionFixture(options: { policy?: boolean; recover?: boolean; outcomes?: readonly boolean[];
  earnTarget?: boolean; error?: Error } = {}) {
  resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Den fixture', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(6));
  const f = fixture({ failures: 0 });
  const profile: CampaignProfile = { ...campaignProfiles['sorceress-cold'],
    ...(options.policy === false ? {} : { acquisitionTrainingPolicy: 'den-bounded-v1' }) };
  let farms = 0;
  const run = () => { runActOne(profile, row => { f.records.push(row); }, (area, phase) => {
    if (phase !== 'farm') { f.enter(area, phase); return; }
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    farms++;
    useInventoryStore.getState().addCurrency('rune-shard', 2);
    const hero = usePlayerStore.getState().player;
    if (!hero) throw new Error('Missing fixture hero');
    // Disclosed partial-wave XP; no constructed combat viability claim.
    usePlayerStore.getState().gainExperience(options.earnTarget && farms >= 2
      ? xpTotal(12) - xpTotal(hero.level) - hero.experience : 1);
    if (options.error) throw options.error;
    if (options.outcomes?.[farms - 1] ?? true)
      throw new CampaignStop('nonwin', 'Constructed acquisition defeat',
        { area, phase, ordinal, index: 3, outcome: 'defeat' });
  }, () => undefined, options.recover === false ? { mode: 'none', cycles: [] } : f.recovery); };
  return { ...f, run, farms: () => farms };
}

it('retains a farm loss and income, then earns the target and continues without claiming Den twice', () => {
  const f = acquisitionFixture({ outcomes: [true, false], earnTarget: true }); f.run();
  expect(f.farms()).toBe(2);
  expect(useInventoryStore.getState().currencies['rune-shard']).toBe(4);
  expect(f.recovery).toMatchObject({ acquisition: { startOrdinal: 1, nextOrdinal: 3,
    result: { status: 'target-earned', admissions: 2, nonwins: 1 }, failure: null, failureStatus: null } });
  expect(f.records.filter(row => row.kind === 'campaign-training-terminal')).toMatchObject([
    { status: 'target-earned', admissions: 2, wins: 1, nonwins: 1, terminalLevel: 12 }
  ]);
  expect(f.records.filter(row => row.kind === 'quest-claim').map(row => row.id))
    .toEqual(['quests/act1-den-of-evil', 'quests/act1-sisters-to-the-slaughter']);
  expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
  expect(f.recovery.cycles).toEqual([]);
});

it.each([{ policy: false }, { recover: false }])('preserves first-loss acquisition behavior without both opt-ins (%j)', options => {
  const f = acquisitionFixture(options);
  expect(f.run).toThrow('Constructed acquisition defeat');
  expect(f.farms()).toBe(1);
  expect(f.records.some(row => row.kind === 'campaign-training-start')).toBe(false);
});

it.each([
  { name: 'consecutive nonwins', outcomes: [true, true, true], admissions: 3, nonwins: 3, status: 'retry-limit' },
  { name: 'total nonwins', outcomes: Array.from({ length: 19 }, (_, i) => i % 2 === 0), admissions: 19, nonwins: 10, status: 'retry-limit' },
  { name: 'original admission ceiling', outcomes: Array.from({ length: 99 }, () => false), admissions: 99, nonwins: 0, status: 'admission-limit' }
])('stops acquisition at the $name without extending the controller', ({ outcomes, admissions, nonwins, status }) => {
  const f = acquisitionFixture({ outcomes });
  expect(f.run).toThrow(`Den acquisition ${status}`);
  expect(f.farms()).toBe(admissions);
  expect(f.records.filter(row => row.kind === 'campaign-training-terminal')).toMatchObject([
    { status, admissions, nonwins, terminalLevel: 6 }
  ]);
  expect(useInventoryStore.getState().currencies['rune-shard']).toBe(admissions * 2);
  expect(f.recovery).toMatchObject({ acquisition: { startOrdinal: 1, nextOrdinal: 1 + admissions,
    result: { status, admissions, nonwins }, failureStatus: status === 'retry-limit' ? 'nonwin' : 'budget' } });
  expect(useMapStore.getState().isActUnlocked(2)).toBe(false);
});

it.each([new Error('Acquisition observer failed'), new CampaignStop('budget', 'Outer admission budget')])(
  'propagates acquisition technical and outer budget errors without retrying', error => {
    const f = acquisitionFixture({ error });
    expect(f.run).toThrow(error); expect(f.farms()).toBe(1);
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(2);
    expect(f.records.some(row => row.kind === 'campaign-training-terminal')).toBe(false);
    expect(f.recovery).toMatchObject({ acquisition: { startOrdinal: 1, nextOrdinal: 2, result: null,
      failureStatus: error instanceof CampaignStop ? 'budget' : 'technical' } });
  });

it.each(['farm', 'retry'] as const)('does not invent a %s admission when the global guard stops before entry', stage => {
  const f = fixture(), error = new CampaignStop('budget', 'Campaign admission/time budget reached');
  expect(() => { runActOne(campaignProfiles['sorceress-cold'], () => undefined, (area, phase, flee) => {
    if (f.recovery.cycles.length && (stage === 'farm' ? phase === 'farm' : phase === 'route')) throw error;
    f.enter(area, phase, flee);
  }, () => undefined, f.recovery); }).toThrow(error);
  expect(f.recovery.cycles).toMatchObject([{ resolution: 'stopped', retryOrdinal: null,
    trainingOrdinals: stage === 'farm' ? [] : [6] }]);
  expect(f.admissions.filter(row => row.area === catacombs)).toHaveLength(1);
});

/** Constructed retained checkpoint: no fresh acquisition or combat viability claim. */
function continuationFixture(options: Parameters<typeof fixture>[0] = {}) {
  const f = fixture({ failures: 0, ...options });
  const map = useMapStore.getState();
  map.updateQuestProgress('quests/act1-den-of-evil', { status: 'completed', rewardClaimed: true });
  for (const slug of ['den-of-evil', 'blood-moor', 'cold-plains', 'burial-grounds'])
    map.markCleared(`areas/act1-${slug}`);
  map.updateQuestProgress('quests/act1-sisters-to-the-slaughter', { status: 'inProgress' });
  map.setCurrentLocation(1, 'a1-dark-wood');
  useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: 127 } });
  const failure: CampaignSettledNonwin = { area: wood, phase: 'route', ordinal: 126,
    index: 3, outcome: 'defeat' };
  const resume = (recovery = f.recovery) => { runActOneMainQuest(campaignProfiles['sorceress-cold'], row => {
    f.records.push(row);
  }, f.enter, () => undefined, recovery, { failure }); };
  return { ...f, failure, resume };
}

it('resumes the retained defeat by earning a level in the last cleared area before retrying', () => {
  const f = continuationFixture(); f.resume();
  expect(f.admissions).toEqual([
    { area: 'areas/act1-burial-grounds', phase: 'farm', ordinal: 127, level: 12 },
    { area: wood, phase: 'route', ordinal: 128, level: 13 },
    { area: catacombs, phase: 'route', ordinal: 129, level: 13 }
  ]);
  expect(f.recovery.cycles).toMatchObject([{ failure: f.failure, fromLevel: 12, targetLevel: 13,
    trainingArea: 'areas/act1-burial-grounds', trainingOrdinals: [127], retryOrdinal: 128,
    resolution: 'retry-won', endLevel: 13 }]);
  expect(f.records.filter(row => row.kind === 'quest-start')).toEqual([]);
  expect(f.records.filter(row => row.kind === 'quest-claim').map(row => row.id))
    .toEqual(['quests/act1-sisters-to-the-slaughter']);
  expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
});

it.each(['ordinal', 'location', 'first-remaining', 'quest', 'mode'] as const)(
  'refuses a retained %s mismatch before admissions, records, or state mutation', mismatch => {
    const f = continuationFixture(), map = useMapStore.getState();
    if (mismatch === 'ordinal')
      useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: 128 } });
    if (mismatch === 'location') map.setCurrentLocation(1, 'a1-catacombs');
    if (mismatch === 'first-remaining') useMapStore.setState({
      clearedSubAreas: map.clearedSubAreas.filter(area => area !== 'areas/act1-burial-grounds')
    });
    if (mismatch === 'quest') map.markQuestRewardClaimed('quests/act1-sisters-to-the-slaughter');
    const before = observeEarnedState();
    expect(() => { f.resume(mismatch === 'mode' ? { mode: 'none', cycles: [] } : f.recovery); }).toThrow();
    expect(f.admissions).toEqual([]); expect(f.records).toEqual([]);
    expect(f.recovery.cycles).toEqual([]); expect(observeEarnedState()).toEqual(before);
  });

it('retains a failed continuation training admission without fabricating a route retry', () => {
  const error = new CampaignStop('nonwin', 'Retained training defeat', {
    area: 'areas/act1-burial-grounds', phase: 'farm', ordinal: 127, index: 2, outcome: 'defeat'
  });
  const f = continuationFixture({ failTraining: error });
  expect(f.resume).toThrow(error);
  expect(f.admissions).toEqual([
    { area: 'areas/act1-burial-grounds', phase: 'farm', ordinal: 127, level: 12 }
  ]);
  expect(f.recovery.cycles).toMatchObject([{ failure: f.failure, trainingOrdinals: [127],
    retryOrdinal: null, resolution: 'stopped' }]);
});

it('retains the twelve-admission bound when resumed training earns no level', () => {
  const f = continuationFixture({ trainingXp: false });
  expect(f.resume).toThrow('Recovery training admission limit');
  expect(f.admissions).toHaveLength(12);
  expect(f.admissions.every(row => row.area === 'areas/act1-burial-grounds' && row.phase === 'farm')).toBe(true);
  expect(f.recovery.cycles).toMatchObject([{ trainingOrdinals: Array.from({ length: 12 }, (_, i) => i + 127),
    retryOrdinal: null, resolution: 'stopped' }]);
});

it('uses a cleared lower-level challenge for intended recovery without changing historical selection', () => {
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0];
  if (!merc) throw new Error('Missing native initial merc');
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  const f = continuationFixture();
  runActOneMainQuest(intendedCampaignProfiles['sorceress-cold-intended-v1'], row => {
    f.records.push(row);
  }, f.enter, () => undefined, f.recovery, { failure: f.failure });
  expect(f.admissions).toEqual([
    { area: 'areas/act1-cold-plains', phase: 'farm', ordinal: 127, level: 12 },
    { area: wood, phase: 'route', ordinal: 128, level: 13 },
    { area: catacombs, phase: 'route', ordinal: 129, level: 13 }
  ]);
  expect(f.recovery.cycles).toMatchObject([{ trainingArea: 'areas/act1-cold-plains',
    trainingPolicy: 'cleared-level-margin-v1', trainingOrdinals: [127], resolution: 'retry-won' }]);
});

it('bounds intended lower-level recovery at forty earned admissions per cycle', () => {
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0];
  if (!merc) throw new Error('Missing native initial merc');
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  const f = continuationFixture({ trainingXp: false });
  expect(() => { runActOneMainQuest(intendedCampaignProfiles['sorceress-cold-intended-v1'], () => undefined,
    f.enter, () => undefined, f.recovery, { failure: f.failure }); }).toThrow('Recovery training admission limit');
  expect(f.admissions).toHaveLength(40);
  expect(f.admissions.every(row => row.area === 'areas/act1-cold-plains' && row.phase === 'farm')).toBe(true);
  expect(f.recovery.cycles).toMatchObject([{ retryOrdinal: null, resolution: 'stopped' }]);
});

it('selects only cleared eligible areas and stops before training when none qualify', () => {
  const f = continuationFixture();
  // Constructed L6 starting state exercises only source selection; no earned-route claim.
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing fixture hero');
  usePlayerStore.setState({ player: { ...player, level: 6 } });
  const questProgress = { ...useMapStore.getState().questProgress };
  delete questProgress['quests/act1-sisters-to-the-slaughter'];
  useMapStore.setState({ clearedSubAreas: ['areas/act1-den-of-evil'], questProgress });
  const profile = intendedCampaignProfiles['sorceress-cold-intended-v1'];
  const admissions: string[] = [];
  expect(() => { runActOneMainQuest(profile, () => undefined, (area, phase) => {
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...useMapStore.getState().challengeOrdinals, normal: ordinal + 1 } });
    admissions.push(area);
    throw new CampaignStop('nonwin', 'Constructed settled route defeat', { area, phase, ordinal,
      index: 0, outcome: 'defeat' });
  }, () => undefined, f.recovery); }).toThrow('No cleared lower-level recovery area');
  expect(admissions).toEqual(['areas/act1-blood-moor']);
  expect(f.recovery.cycles).toMatchObject([{ trainingArea: null, trainingOrdinals: [],
    retryOrdinal: null, resolution: 'stopped' }]);
});

it('applies one shared recovery policy to all fourteen intended profiles', () => {
  expect(Object.keys(intendedCampaignProfiles)).toHaveLength(14);
  for (const profile of Object.values(intendedCampaignProfiles))
    expect(profile.recoveryTrainingPolicy).toBe('cleared-level-margin-v1');
  for (const [id, profile] of Object.entries(campaignProfiles))
    if (!id.endsWith('-intended-v1')) expect(profile).not.toHaveProperty('recoveryTrainingPolicy');
});

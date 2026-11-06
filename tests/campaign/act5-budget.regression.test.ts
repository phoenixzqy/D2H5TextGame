/** Constructed budget wiring only: fake admissions, outcomes and proofs are never earned wins.
 * One native hero/hire and all Act II–V route/action/Claim services remain in the runner. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, observeStore,
  resetEarnedStores } from '../sim/production/earned-state';
import { playEarnedWave, type EarnedWave } from '../sim/production/earned-playback';
import { unrecordedCampaignWave } from './unrecorded-wave-fixture';
import { observeP15Wave, type P15Wave } from '../sim/contracts/p15-wave-observation';
import { claimCampaignQuest } from './actions';
import { startCampaignAdmission } from './admission';
import { assertCampaignSettlement } from './settlement';
import { runCampaign } from './native-runner';
import { runActOne } from './route';
import { actTwoActionOrder } from './act2-route';
import { actThreeActionOrder } from './act3-route';
import { actFourActionOrder } from './act4-route';
import { publishConstructedActFourEncounter } from './act4-fixture';
import { publishConstructedActFiveWave } from './act5-fixture';

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./admission', () => ({ startCampaignAdmission: vi.fn() }));
vi.mock('../sim/production/earned-playback', async original => ({
  ...await original<typeof import('../sim/production/earned-playback')>(), playEarnedWave: vi.fn()
}));
vi.mock('../sim/contracts/p15-wave-observation', async original => ({
  ...await original<typeof import('../sim/contracts/p15-wave-observation')>(), observeP15Wave: vi.fn()
}));
vi.mock('./settlement', () => ({ assertCampaignSettlement: vi.fn() }));

const sisters = 'quests/act1-sisters-to-the-slaughter', eve = 'quests/act5-eve-of-destruction';
const throne = 'areas/act5-throne-of-destruction', throneProof = `${eve}#action:throne-waves-victory`;
const prefixXp = [8000, 5000, 4500, 6000, 7000, 12000, 8000, 18000, 9000, 7000, 25000];
const prefixOrder = [...actTwoActionOrder, ...actThreeActionOrder, ...actFourActionOrder];
let restores: (() => void)[], pity: number, wallTime: number, actOneAdmissions: number;
let logicalMsAt: (ordinal: number, index: number) => number;
let afterWave: (act: number, index: number) => void;
let admissions: { act: number; area: string }[];

beforeEach(() => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(startCampaignAdmission).mockReset();
  vi.mocked(playEarnedWave).mockReset(); vi.mocked(observeP15Wave).mockReset();
  vi.mocked(assertCampaignSettlement).mockReset();
  wallTime = 0; actOneAdmissions = 1; admissions = []; logicalMsAt = () => 1; afterWave = () => undefined;
  vi.spyOn(performance, 'now').mockImplementation(() => wallTime);
  vi.mocked(runActOne).mockImplementation((_profile, record, enter, reward) => {
    for (let index = 0; index < actOneAdmissions; index++) enter('areas/act1-blood-moor', 'route');
    const map = useMapStore.getState(); map.markCleared('areas/act1-catacombs');
    map.updateQuestProgress(sisters, { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const ordinal = admissions.length, location = area.replace(/^areas\/act([1-5])-/, 'a$1-');
    admissions.push({ act, area });
    useMapStore.getState().setCurrentLocation(act, location);
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    return { location, handle: { runId: area, runSeed: 0, challengeOrdinal: ordinal, totalWaves: act === 5 ? 8 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const admission = admissions[handle.challengeOrdinal]; assert.ok(admission);
    const beforeAward = observeEarnedState(), combat = observeStore(useCombatStore);
    const suffix = admission.act === 5;
    if (suffix) {
      publishConstructedActFiveWave(index);
      usePlayerStore.getState().gainExperience(1);
      useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
    } else publishPrefixEncounter(admission.act, admission.area);
    afterWave(admission.act, index);
    const afterAward = observeEarnedState(), player = usePlayerStore.getState().player; assert.ok(player);
    // Dummy units support the graph observer; no recording or simulated combat is supplied.
    const hero = { id: player.id, kind: 'hero', side: 'player', life: 1, mana: 1 } as
      EarnedWave['opening']['playerTeam'][number];
    const outcome = { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [] } as
      NonNullable<EarnedWave['played']['outcome']>;
    return unrecordedCampaignWave({ index, opening: { ...combat, playerTeam: [hero] }, played: { ...combat, outcome },
      beforeAward, afterAward, afterAdvance: combat,
      advanceResult: suffix && index < 7 ? 'next-wave' : 'victory',
      terminalSimClockMs: logicalMsAt(handle.challengeOrdinal, index),
      rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0,
        materials: suffix ? { 'materials/scrap': 3 } : {} },
      actualDelta: earnedDelta(beforeAward, afterAward) });
  });
  vi.mocked(observeP15Wave).mockImplementation(wave => {
    const metrics: P15Wave['metrics'] = {
      engineWinner: 'player', outcome: 'victory', logicalMs: wave.terminalSimClockMs,
      victoryOnlyTtkMs: wave.terminalSimClockMs, heroDied: false, heroLife: 1, heroMana: 1,
      heroEntryLife: 1, heroEntryMana: 1, minimumObservedMana: 1, zeroManaObserved: false,
      livingEnemies: [], directDamageBySource: {}, periodicDamageByTarget: {},
      periodicProvenance: { eventCount: 0, missingEventCount: 0, hpMsBySource: {}, hpMsByDamageType: {} }
    };
    return { metrics } as P15Wave;
  });
  vi.mocked(assertCampaignSettlement).mockImplementation(() => undefined);
});

afterEach(() => { vi.restoreAllMocks(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

function publishPrefixEncounter(act: number, area: string) {
  const map = useMapStore.getState();
  if (act === 1) return;
  if (act === 2) {
    if (area.endsWith('far-oasis')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.radament'] });
    else if (area.endsWith('arcane-sanctuary')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.the-summoner'] });
    else map.recordBossKill({ actId: 'acts/act2', areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
  } else if (act === 3) {
    if (area.endsWith('travincal')) useMapStore.setState({ questReceipts: { ...map.questReceipts,
      'quests/act3-khalims-will#action:council-victory': true } });
    if (area.endsWith('durance-of-hate')) map.updateQuestProgress('quests/act3-guardian', {
      status: 'completed', objectives: { 'obj-kill-mephisto': true } });
  } else { assert.equal(act, 4); publishConstructedActFourEncounter(area); }
  useMapStore.getState().markCleared(area);
}

function realm() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore), hydration: observeStore(useHydrationStore) };
}

function run(onRecord: (row: Readonly<Record<string, unknown>>) => void = () => undefined) {
  vi.spyOn(Date, 'now').mockReturnValue(1793304123456);
  useHydrationStore.getState().setStatus('ready'); expect(createCharacter('A5 budget realm', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(750); useInventoryStore.getState().addCurrency('rune-shard', 17);
  setIdleEliteMisses(23); useHydrationStore.getState().setStatus('loading');
  const outer = { state: realm(), now: Date.now, value: Date.now(), pity: getIdleEliteMisses() };
  const records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act5', 'sorceress-cold', row => { records.push(row); onRecord(row); });
  expect(realm()).toEqual(outer.state); expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.questActions.slice(0, 45).map(row => [row.action, row.id])).toEqual(prefixOrder);
  expect(report.questActions.every(row => row.result === 'ok')).toBe(true);
  expect(records.filter(row => row.kind === 'fresh-act4-prefix')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expect(report.questAudit).not.toBeNull(); expect(report.exported).not.toBeNull();
  const suffixWaves = report.waves.filter(row => row.area === throne);
  const claimed = report.successor?.map.questProgress[eve]?.rewardClaimed === true;
  const xp = claimed ? [...prefixXp, 40000] : prefixXp;
  expect(report.questRewards.map(delta => delta.xp)).toEqual(xp);
  expect(report.totals.earnings.waves).toEqual({ xp: suffixWaves.length, items: 0 });
  expect(report.economyAudit).toEqual({ xp: xp.reduce((sum, amount) => sum + amount, suffixWaves.length),
    addedItems: report.questRewards.reduce((sum, delta) => sum + delta.addedItems.length, 0) });
  expect(report.successor?.inventory.materials['materials/scrap'] ?? 0).toBe(3 * suffixWaves.length +
    report.questRewards.reduce((sum, delta) => sum + (delta.materials['materials/scrap'] ?? 0), 0));
  return { report, records, suffixWaves };
}

function stopped(report: ReturnType<typeof runCampaign>, message: string, prefixAdmissions = 12) {
  expect(report.gameplayStatus).toBe('budget'); expect(report.failure).toBe(message);
  expect(report.questActions.slice(45).map(row => [row.action, row.id])).toEqual([['start', eve]]);
  expect(report.successor?.map.questProgress[eve]?.rewardClaimed).not.toBe(true);
  expect(report.successor?.map.questTitles).toEqual({}); expect(report.successor?.map.questDifficulties).toEqual({});
  expect(report.waves.filter(row => row.area !== throne)).toHaveLength(prefixAdmissions);
  expect(report.fledWaves).toBe(0); expect(report.unobservedWaves).toEqual([]);
}

it.each([148, 149])('retains the original160 cap after %i Act I plus eleven native prefix admissions', count => {
  actOneAdmissions = count;
  const { report, suffixWaves } = run();
  expect(report.admissions).toBe(160);
  expect(admissions.map(row => row.act)).toEqual([...Array<number>(count).fill(1),
    2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, ...(count === 148 ? [5] : [])]);
  expect(admissions.map((_row, ordinal) => ordinal)).toEqual(Array.from({ length: 160 }, (_unused, ordinal) => ordinal));
  if (count === 149) {
    stopped(report, 'Campaign admission/time budget reached', 160);
    expect(suffixWaves).toEqual([]); expect(report.stagedWaves).toBe(160);
  } else {
    expect(report.gameplayStatus).toBe('act5-complete'); expect(report.failure).toBeNull();
    expect(report.questActions).toHaveLength(47); expect(suffixWaves).toHaveLength(8);
    expect(suffixWaves.map(row => [row.ordinal, row.index])).toEqual(Array.from({ length: 8 }, (_unused, index) => [159, index]));
    expect(report.stagedWaves).toBe(167); expect(report.totals.completedChallenges).toBe(160);
  }
});

it('retains the original wall deadline before the first Act V admission', () => {
  const { report, suffixWaves } = run(row => { if (row.kind === 'fresh-act4-prefix') wallTime = 600_001; });
  stopped(report, 'Campaign admission/time budget reached');
  expect(report.admissions).toBe(12); expect(report.stagedWaves).toBe(12); expect(suffixWaves).toEqual([]);
  expect(report.wallMs).toBe(600_001);
});

it('retains all prior logical time at the exact original36000000 cap before Act V', () => {
  logicalMsAt = ordinal => ordinal === 11 ? 35_999_989 : 1;
  const { report, suffixWaves } = run();
  stopped(report, 'Campaign admission/time budget reached');
  expect(report.totals.combatMs).toBe(36_000_000); expect(report.admissions).toBe(12); expect(suffixWaves).toEqual([]);
});

it('retains a first Act V wave crossing the original logical cap and its unplayed staged successor', () => {
  logicalMsAt = ordinal => ordinal === 11 ? 35_999_988 : ordinal === 12 ? 2 : 1;
  const { report, records, suffixWaves } = run();
  stopped(report, 'Campaign time budget reached between waves');
  expect(report.admissions).toBe(13); expect(report.stagedWaves).toBe(14);
  expect(report.totals).toMatchObject({ combatMs: 36_000_001, playedWaves: 13, completedChallenges: 12 });
  expect(suffixWaves).toMatchObject([{ ordinal: 12, index: 0, advance: 'next-wave', xp: 1, logicalMs: 2 }]);
  expect(report.successor?.map.questReceipts[throneProof]).toBeUndefined();
  expect(records.map(row => row.kind).slice(-3)).toEqual(['settled-wave', 'staged-wave', 'stopped-native-checkpoint']);
});

it('retains fifth-wave proof and earned income when the original combat cap stops before guards', () => {
  logicalMsAt = (ordinal, index) => ordinal === 12 && index === 4 ? 35_999_984 : 1;
  const { report, suffixWaves } = run();
  stopped(report, 'Campaign time budget reached between waves');
  expect(report.admissions).toBe(13); expect(report.stagedWaves).toBe(18);
  expect(report.totals).toMatchObject({ combatMs: 36_000_000, playedWaves: 17, completedChallenges: 12 });
  expect(suffixWaves.map(row => [row.ordinal, row.index])).toEqual(Array.from({ length: 5 }, (_unused, index) => [12, index]));
  expect(report.successor?.map.questReceipts[throneProof]).toBe(true);
  expect(report.successor?.map.questReceipts[`${eve}#action:baal-victory`]).toBeUndefined();
});

it('retains native-shaped proof and guard income when the original wall deadline stops the next guard', () => {
  afterWave = (act, index) => { if (act === 5 && index === 5) wallTime = 600_001; };
  const { report, suffixWaves } = run();
  stopped(report, 'Campaign time budget reached between waves');
  expect(report.admissions).toBe(13); expect(report.stagedWaves).toBe(19); expect(report.wallMs).toBe(600_001);
  expect(report.totals).toMatchObject({ combatMs: 18, playedWaves: 18, completedChallenges: 12 });
  expect(suffixWaves.map(row => row.index)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(report.successor?.map.questReceipts[throneProof]).toBe(true);
  expect(report.successor?.map.questReceipts[`${eve}#action:baal-victory`]).toBeUndefined();
});

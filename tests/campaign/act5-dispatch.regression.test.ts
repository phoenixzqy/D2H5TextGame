/** Constructed runner wiring only: every combat/admission/proof here is fake, never earned evidence.
 * Act II/III/IV/V routes, explicit quest operations, Claims, point grants and cleanup stay native. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import * as creation from '@/features/character/createCharacter';
import { emptyEndgameState } from '@/engine/endgame/state';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { xpTotal } from '@/engine/progression/xp';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
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
import { assertCampaignRecovery } from './recovery-audit';
import { runCampaign } from './native-runner';
import { runActOne, CampaignStop } from './route';
import { runActTwo, actTwoActionOrder } from './act2-route';
import * as actThree from './act3-route';
import * as actFour from './act4-route';
import * as economy from './economy';
import * as questAudit from './quest-audit';
import * as actFive from './act5-route';
import * as nativeClaims from '@/features/quests/claimReward';
import { publishConstructedActFiveWave } from './act5-fixture';
import { publishConstructedActFourEncounter } from './act4-fixture';
import type { CampaignTrainingRequest } from './training';

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./act2-route', async original => {
  const actual = await original<typeof import('./act2-route')>();
  return { ...actual, runActTwo: vi.fn(actual.runActTwo) };
});
vi.mock('./act3-route', async original => {
  const actual = await original<typeof import('./act3-route')>();
  return { ...actual, runActThree: vi.fn(actual.runActThree) };
});
vi.mock('./act4-route', async original => {
  const actual = await original<typeof import('./act4-route')>();
  return { ...actual, runActFour: vi.fn(actual.runActFour) };
});
vi.mock('./admission', () => ({ startCampaignAdmission: vi.fn() }));
vi.mock('../sim/production/earned-playback', async original => ({
  ...await original<typeof import('../sim/production/earned-playback')>(), playEarnedWave: vi.fn()
}));
vi.mock('../sim/contracts/p15-wave-observation', async original => ({
  ...await original<typeof import('../sim/contracts/p15-wave-observation')>(), observeP15Wave: vi.fn()
}));
vi.mock('./settlement', () => ({ assertCampaignSettlement: vi.fn() }));

const sisters = 'quests/act1-sisters-to-the-slaughter';
const khalim = 'quests/act3-khalims-will', guardian = 'quests/act3-guardian';
const will = `${khalim}#objective:obj-transmute`, soulstone = `${guardian}#reward:questItem`;
const council = `${khalim}#action:council-victory`, orb = `${guardian}#action:break-compelling-orb`;
const prefixArea = 'areas/act1-blood-moor';
const oasis = 'areas/act2-far-oasis', sanctuary = 'areas/act2-arcane-sanctuary';
const tomb = 'areas/act2-tomb-of-tal-rasha';
const marsh = 'areas/act3-great-marsh', jungle = 'areas/act3-flayer-jungle';
const bazaar = 'areas/act3-kurast-bazaar', travincal = 'areas/act3-travincal';
const durance = 'areas/act3-durance-of-hate';
const actThreeAreas = [marsh, jungle, bazaar, travincal, durance] as const;
const plains = 'areas/act4-plains-of-despair', river = 'areas/act4-river-of-flame';
const chaos = 'areas/act4-chaos-sanctuary', actFourAreas = [plains, river, chaos] as const;
const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const hammer = `${forge}#objective:obj-kill-hephasto`, shatter = `${forge}#action:shatter-soulstone`;
const izual = `${fallen}#action:izual-victory`, hephasto = `${forge}#action:hephasto-victory`;
const diablo = `${terror}#action:diablo-victory`;
const throne = 'areas/act5-throne-of-destruction', eve = 'quests/act5-eve-of-destruction';
const throneProof = `${eve}#action:throne-waves-victory`, baalProof = `${eve}#action:baal-victory`;
const prefixXp = [8000, 5000, 4500, 6000, 7000, 12000, 8000, 18000, 9000, 7000, 25000];
type FailurePoint = 'playback-throne' | 'observer-throne' | 'logger-throne' | 'playback-baal' |
  'observer-baal' | 'logger-baal' | 'native-claim' | 'claim-recorder' | 'claim-recorder-checkpoint';
type RecordRow = Readonly<Record<string, unknown>>;
let restores: (() => void)[];
let pity: number;
let wallTime: number;
let failurePoint: FailurePoint | undefined;
let nonwinIndex: number | undefined;
let playedIndices: number[];
let actualActTwo: typeof runActTwo;
let actualActThree: typeof actThree.runActThree;
let actualActFour: typeof actFour.runActFour;
let identities: { act: number; area: string; ordinal: number; heroId: string; mercId: string | null }[];

beforeEach(async () => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(runActTwo).mockReset(); vi.mocked(actThree.runActThree).mockReset();
  vi.mocked(actFour.runActFour).mockReset();
  actualActTwo = (await vi.importActual<typeof import('./act2-route')>('./act2-route')).runActTwo;
  vi.mocked(runActTwo).mockImplementation(actualActTwo);
  actualActThree = (await vi.importActual<typeof import('./act3-route')>('./act3-route')).runActThree;
  vi.mocked(actThree.runActThree).mockImplementation(actualActThree);
  actualActFour = (await vi.importActual<typeof import('./act4-route')>('./act4-route')).runActFour;
  vi.mocked(actFour.runActFour).mockImplementation(actualActFour);
  vi.mocked(startCampaignAdmission).mockReset(); vi.mocked(playEarnedWave).mockReset();
  vi.mocked(observeP15Wave).mockReset(); vi.mocked(assertCampaignSettlement).mockReset();
  identities = []; playedIndices = []; wallTime = 0; failurePoint = undefined; nonwinIndex = undefined;
  vi.spyOn(performance, 'now').mockImplementation(() => wallTime);
  vi.mocked(runActOne).mockImplementation((_profile, record, enter, reward) => {
    enter(prefixArea, 'route');
    // Disclosed constructed clear/objective; actual Sisters Claim is the prefix income.
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().markCleared('areas/act1-den-of-evil');
    useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const ordinal = identities.length, location = area.replace(/^areas\/act([1-5])-/, 'a$1-');
    identities.push({ act, area, ordinal, heroId: player.id, mercId: useMercStore.getState().fieldedMercId });
    useMapStore.getState().setCurrentLocation(act, location);
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    return { location, handle: { runId: area, runSeed: 0, challengeOrdinal: ordinal, totalWaves: area === throne ? 8 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const admission = identities[handle.challengeOrdinal]; assert.ok(admission);
    const beforeAward = observeEarnedState(), combat = observeStore(useCombatStore);
    const suffix = admission.area === throne, lost = suffix && nonwinIndex === index;
    if (suffix) {
      playedIndices.push(index);
      if (!lost) publishConstructedActFiveWave(index);
      // Deliberately constructed ordinary income checks every played guard and exceptional wave.
      usePlayerStore.getState().gainExperience(1);
      useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
    } else constructedEncounter(admission.act, admission.area);
    if (suffix && (failurePoint === 'playback-throne' && index === 4 || failurePoint === 'playback-baal' && index === 7))
      throw new Error(`Constructed ${failurePoint} failure after publication`);
    const afterAward = observeEarnedState();
    // Only the retention wrapper reads these dummy units. No native recording or battle exists.
    const fakeHero = { id: admission.heroId, kind: 'hero', side: 'player', life: 1, mana: 1 } as
      EarnedWave['opening']['playerTeam'][number];
    const fakeEnemy = { id: 'constructed-hostile', kind: 'monster', side: 'enemy', life: 1 } as
      EarnedWave['opening']['enemyTeam'][number];
    const outcome = { winner: lost ? 'enemy' : 'player',
      finalPlayerTeam: [fakeHero], finalEnemyTeam: [{ ...fakeEnemy, life: lost ? 1 : 0 }] } as
      NonNullable<EarnedWave['played']['outcome']>;
    return unrecordedCampaignWave({ index, opening: { ...combat, playerTeam: [fakeHero], enemyTeam: [fakeEnemy],
      subAreaRunId: admission.area }, played: { ...combat, outcome },
      beforeAward, afterAward, afterAdvance: combat, advanceResult: lost ? 'defeat' : suffix && index < 7 ? 'next-wave' : 'victory',
      terminalSimClockMs: 1,
      rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: suffix ? { 'materials/scrap': 3 } : {} },
      actualDelta: earnedDelta(beforeAward, afterAward) });
  });
  vi.mocked(observeP15Wave).mockImplementation(wave => {
    if (useMapStore.getState().currentSubAreaId === 'a5-throne-of-destruction' &&
      (failurePoint === 'observer-throne' && wave.index === 4 || failurePoint === 'observer-baal' && wave.index === 7))
      throw new Error(`Constructed ${failurePoint} failure after publication`);
    const winner = wave.played.outcome?.winner ?? null;
    const metrics: P15Wave['metrics'] = { engineWinner: winner,
      outcome: winner === 'player' ? 'victory' : winner === 'enemy' ? 'defeat' : 'draw',
      logicalMs: 1, victoryOnlyTtkMs: winner === 'player' ? 1 : null,
      heroDied: false, heroLife: 1, heroMana: 1, heroEntryLife: 1, heroEntryMana: 1,
      minimumObservedMana: 1, zeroManaObserved: false, livingEnemies: [],
      directDamageBySource: {}, periodicDamageByTarget: {},
      periodicProvenance: { eventCount: 0, missingEventCount: 0, hpMsBySource: {}, hpMsByDamageType: {} } };
    return { metrics } as P15Wave;
  });
  // Fake combat deliberately bypasses native settlement proof. Production matrices own provenance.
  vi.mocked(assertCampaignSettlement).mockImplementation(() => undefined);
});

afterEach(() => { vi.restoreAllMocks(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

/** Fake encounter effects only. Every explicit quest operation and Claim still uses native APIs. */
function constructedEncounter(act: number, area: string) {
  const map = useMapStore.getState();
  if (act === 1) return;
  if (act === 2) {
    if (area === oasis) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.radament'] });
    else if (area === sanctuary) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.the-summoner'] });
    else if (area === tomb) map.recordBossKill({ actId: 'acts/act2', areaId: area,
      bossArchetypeId: 'monsters/act2.duriel' });
    else if (!['areas/act2-rocky-waste', 'areas/act2-dry-hills', 'areas/act2-lost-city'].includes(area))
      throw new Error(`Unexpected constructed Act II area ${area}`);
  } else if (act === 3) {
    if (area === travincal) useMapStore.setState({ questReceipts: { ...map.questReceipts, [council]: true } });
    if (area === durance) {
      expect(map.questReceipts[orb]).toBe(true);
      expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed');
      map.updateQuestProgress(guardian, { status: 'completed', objectives: { 'obj-kill-mephisto': true } });
    }
  } else if (act === 4) publishConstructedActFourEncounter(area);
  else {
    expect(act).toBe(5);
    const contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
    if (contract) {
      const row = map.questProgress[contract.questId]; assert.ok(row);
      for (const prerequisite of contract.prerequisites) expect(row.objectives[prerequisite]).toBe(true);
      map.updateQuestProgress(contract.questId, { ...row, status: 'completed',
        objectives: { ...row.objectives, [contract.objectiveId]: true } });
      useMapStore.setState({ questReceipts: { ...map.questReceipts, [contract.proof]: true } });
    }
  }
  map.markCleared(area);
}

function realm() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore),
    hydration: observeStore(useHydrationStore) };
}

function surroundingRealm() {
  vi.spyOn(Date, 'now').mockReturnValue(1793304123456);
  useHydrationStore.getState().setStatus('ready');
  expect(creation.createCharacter('A5 outer realm', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(750);
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-cold-plains');
  useMapStore.getState().markCleared('areas/act1-blood-moor');
  useMetaStore.getState().setIdleTarget('a1-cold-plains'); setIdleEliteMisses(23);
  useHydrationStore.getState().setStatus('loading');
  return { state: realm(), now: Date.now, value: Date.now(), pity: getIdleEliteMisses() };
}

function expectRestored(outer: ReturnType<typeof surroundingRealm>) {
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
}

function expectEconomy(report: ReturnType<typeof runCampaign>, xp: readonly number[], waveXp = 0) {
  expect(report.questRewards.map(delta => delta.xp)).toEqual(xp);
  expect(report.totals.earnings.waves).toEqual({ xp: waveXp, items: 0 });
  expect(report.totals.earnings.allEarned.xp).toBe(xp.reduce((total, value) => total + value, waveXp));
  expect(report.economyAudit).toEqual({ xp: xp.reduce((total, value) => total + value, waveXp),
    addedItems: report.questRewards.reduce((total, delta) => total + delta.addedItems.length, 0) });
  expect(report.exported).not.toBeNull();
}

function suffixEntries(report: ReturnType<typeof runCampaign>) {
  return report.questActions.slice(45);
}

function expectMaterials(report: ReturnType<typeof runCampaign>, played: number) {
  expect(report.successor?.inventory.materials['materials/scrap'] ?? 0).toBe(report.questRewards.reduce(
    (total, delta) => total + (delta.materials['materials/scrap'] ?? 0), 0) + 3 * played);
}

/** Constructed Act I income/clears satisfy the intended companion's native prerequisite. */
function prepareRouteFirstFixture() {
  const actOne = vi.mocked(runActOne).getMockImplementation(); assert.ok(actOne);
  vi.mocked(runActOne).mockImplementation((...args) => {
    actOne(...args); useMapStore.getState().markCleared('areas/act1-dark-wood');
  });
  const play = vi.mocked(playEarnedWave).getMockImplementation(); assert.ok(play);
  vi.mocked(playEarnedWave).mockImplementation((...args) => {
    const wave = play(...args);
    if (identities[args[0].challengeOrdinal]?.area !== prefixArea) return wave;
    usePlayerStore.getState().gainExperience(xpTotal(15));
    const afterAward = observeEarnedState();
    return { ...wave, afterAward, actualDelta: earnedDelta(wave.beforeAward, afterAward) };
  });
}

it.each(['sorceress-cold', 'amazon-bow', 'paladin-zeal'])(
  'retains all fresh prefixes, 47 actions and one eight-wave admission for %s', profileId => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  const create = vi.spyOn(creation, 'createCharacter'), runFive = vi.spyOn(actFive, 'runActFive');
  const report = runCampaign('act5', profileId, record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act5-complete'); expect(report.failure).toBeNull();
  expect(create).toHaveBeenCalledTimes(1); expect(runActOne).toHaveBeenCalledTimes(1);
  expect(runActTwo).toHaveBeenCalledTimes(1); expect(actThree.runActThree).toHaveBeenCalledTimes(1);
  expect(actFour.runActFour).toHaveBeenCalledTimes(1); expect(runFive).toHaveBeenCalledTimes(1);
  expect(identities.map(row => row.area)).toEqual([
    prefixArea, oasis, sanctuary, tomb, ...actThreeAreas, ...actFourAreas, throne
  ]);
  expect(new Set(identities.map(row => row.heroId))).toEqual(new Set([report.successor?.player.id]));
  expect(new Set(identities.map(row => row.mercId)).size).toBe(1); expect(identities[0]?.mercId).toBeTruthy();
  const selected = vi.mocked(runActOne).mock.calls[0]?.[0];
  expect(vi.mocked(runActTwo).mock.calls[0]?.[0]).toBe(selected);
  expect(vi.mocked(actThree.runActThree).mock.calls[0]?.[0]).toBe(selected);
  expect(vi.mocked(actFour.runActFour).mock.calls[0]?.[0]).toBe(selected);
  expect(runFive.mock.calls[0]?.[0]).toBe(selected);
  expect(report.questActions).toHaveLength(47);
  expect(report.questActions.slice(0, 21).map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(report.questActions.slice(21, 32).map(row => [row.action, row.id])).toEqual(actThree.actThreeActionOrder);
  expect(report.questActions.slice(32, 45).map(row => [row.action, row.id])).toEqual(actFour.actFourActionOrder);
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actFive.actFiveActionOrder);
  for (const [kind, field, start, end] of [
    ['fresh-act2-prefix', 'act2Entries', 0, 21], ['fresh-act3-prefix', 'act3Entries', 21, 32],
    ['fresh-act4-prefix', 'act4Entries', 32, 45]
  ] as const) expect(records.find(row => row.kind === kind)?.[field]).toEqual(report.questActions.slice(start, end));
  for (const kind of ['created', 'hire', 'stopped-native-checkpoint'])
    expect(records.filter(row => row.kind === kind)).toHaveLength(1);
  expect(playedIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(report.admissions).toBe(13); expect(report.stagedWaves).toBe(20);
  expect(report.waves.filter(row => row.area === throne).map(row => [row.ordinal, row.index, row.advance]))
    .toEqual(Array.from({ length: 8 }, (_, index) => [12, index, index === 7 ? 'victory' : 'next-wave']));
  expect(report.questSettlements.filter(row => row.act === 5).map(row => [row.ordinal, row.index, row.actionIndex, row.advance]))
    .toEqual([[12, 4, 46, 'next-wave'], [12, 7, 46, 'victory']]);
  expectEconomy(report, [...prefixXp, 40000], 8); expectMaterials(report, 8);
  expect(report.questAudit).toMatchObject({ successfulClaims: 11, reads: 1,
    explicitSkillPoints: 4, explicitStatPoints: 0 });
  const mercId = identities[0]?.mercId; assert.ok(mercId);
  expect(suffixEntries(report)[1]?.delta?.mercXp).toEqual({ [mercId]: 30000 });
  expect(report.successor?.map.questTitles).toEqual({ 'titles/slayer_of_baal': true });
  expect(report.successor?.map.questDifficulties).toEqual({ 'difficulty/nightmare': true });
  expect(report.successor?.map.selectedTitle).toBeNull(); expect(report.successor?.map.selectedDifficulty).toBe('normal');
  expect(report.successor?.map.nightmareClearedSubAreas).toEqual([]);
  expect(report.successor?.map.hellClearedSubAreas).toEqual([]);
  expect(report.successor?.map.challengeOrdinals.nightmare).toBe(0);
  expect(report.successor?.map.challengeOrdinals.hell).toBe(0);
  expect(report.successor?.endgame).toEqual(emptyEndgameState());
  expect(report.successor?.inventory.questItems[soulstone]?.state).toBe('consumed');
  expect(report.successor?.inventory.questItems[hammer]?.state).toBe('consumed');
  expect(report.successor?.map.questReceipts).toEqual({ [council]: true, [orb]: true, [izual]: true,
    [hephasto]: true, [shatter]: true, [diablo]: true, [throneProof]: true, [baalProof]: true });
  expectRestored(outer);
});

it('dispatches the explicit main-quest route with64 actions, five Act V areas and independent audits', () => {
  const report = runCampaign('act5', 'sorceress-cold', () => undefined, undefined, 'main-quests');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act5-complete');
  expect(report.questActions).toHaveLength(64);
  expect(identities.filter(row => row.act === 5).map(row => row.area)).toEqual([
    'areas/act5-bloody-foothills', 'areas/act5-frigid-highlands',
    'areas/act5-crystalline-passage', 'areas/act5-ancients-way', throne
  ]);
  expect(report.questAudit).toMatchObject({ successfulClaims: 15, reads: 1, scrollReads: 1,
    shenkProofs: 1, nihlathakProofs: 1, ancientsProofs: 1, throneProofs: 1, baalProofs: 1,
    explicitSkillPoints: 6 });
  expect(report.economyAudit).not.toBeNull();
});

it.each(['necromancer-bone-intended-v1', 'sorceress-cold'])(
  'dispatches route-first %s through all acts without generic preparation and retains each area audit', profileId => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  prepareRouteFirstFixture();
  const report = runCampaign('act5', profileId, row => { records.push(row); },
    undefined, 'main-quests', 'route-first-campaign-v1');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act5-complete'); expect(report.failure).toBeNull();
  expect(report.preparations).toEqual([]);
  expect(report.preparationAudit).toEqual({ stages: 0, admissions: 0, xp: 0, nonwinOrdinals: [] });
  expect(report.waves.every(row => row.phase === 'route')).toBe(true);
  expect(records.some(row => row.kind === 'campaign-training-start')).toBe(false);
  expect(report.actTwoAreaPreparation).toMatchObject({ mode: 'route-first-act2-v1', completed: true });
  expect(report.actTwoAreaPreparationAudit).toMatchObject({ completed: true, trainingAdmissions: 0, routeAreas: 6 });
  for (const [state, audit, count] of [
    [report.actThreeAreaPreparation, report.actThreeAreaPreparationAudit, 5],
    [report.actFourAreaPreparation, report.actFourAreaPreparationAudit, 3],
    [report.actFiveAreaPreparation, report.actFiveAreaPreparationAudit, 5]
  ] as const) {
    expect(state).toMatchObject({ entryPolicy: 'route-first-v1', completed: true, failureStatus: null });
    expect(state?.attempts.map(row => row.kind)).toEqual(Array.from({ length: count }, () => 'route'));
    expect(audit).toMatchObject({ completed: true, admissions: count, trainingAdmissions: 0, routeAreas: count });
  }
  expect(report.actThreeAreaPreparation?.attempts[0]?.fromLevel).toBeLessThan(
    report.actThreeAreaPreparation?.attempts[0]?.targetLevel ?? 0);
  expect(report.questActions).toHaveLength(64);
  expect(report.questActions.slice(0, 21).map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(report.questActions.slice(21, 32).map(row => [row.action, row.id])).toEqual(actThree.actThreeActionOrder);
  expect(report.questActions.slice(32, 45).map(row => [row.action, row.id])).toEqual(actFour.actFourActionOrder);
  expect(report.questActions.slice(45).map(row => [row.action, row.id])).toEqual(actFive.actFiveMainActionOrder);
  expect(report.questAudit).toMatchObject({ successfulClaims: 15, baalProofs: 1 });
  expect(report.economyAudit).not.toBeNull(); expectRestored(outer);
});

it('passes route-first training recovery to native combo selection without fleeing its second wave', () => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  prepareRouteFirstFixture();
  let routeLost = false, trainingLost = false;
  const admission = vi.mocked(startCampaignAdmission).getMockImplementation(); assert.ok(admission);
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const result = admission(act, area);
    // Both training attempts have two constructed waves; a draw stops the first at wave zero.
    return routeLost && act < 3 ? { ...result, handle: { ...result.handle, totalWaves: 2 } } : result;
  });
  const play = vi.mocked(playEarnedWave).getMockImplementation(); assert.ok(play);
  vi.mocked(playEarnedWave).mockImplementation((...args) => {
    const wave = play(...args), latest = [...records].reverse().find(row => row.kind === 'admission'); assert.ok(latest);
    const farm = latest.phase === 'farm';
    const lost = !routeLost && latest.area === marsh || farm && !trainingLost;
    if (lost) {
      if (farm) trainingLost = true;
      else {
        routeLost = true;
        useMapStore.setState(state => ({ clearedSubAreas: state.clearedSubAreas.filter(area => area !== marsh) }));
      }
      const outcome = wave.played.outcome; assert.ok(outcome);
      return { ...wave, advanceResult: 'defeat', played: { ...wave.played, outcome: {
        ...outcome, winner: null, finalEnemyTeam: outcome.finalEnemyTeam.map(unit => ({ ...unit, life: 1 }))
      } } };
    }
    if (!farm) return wave;
    if (wave.index === 0) {
      const hero = usePlayerStore.getState().player; assert.ok(hero);
      usePlayerStore.getState().gainExperience(xpTotal(hero.level + 1) - xpTotal(hero.level) - hero.experience);
    }
    const afterAward = observeEarnedState();
    return { ...wave, afterAward, actualDelta: earnedDelta(wave.beforeAward, afterAward),
      advanceResult: wave.index === 0 ? 'next-wave' : 'victory' };
  });
  const report = runCampaign('act3', 'necromancer-bone-intended-v1', row => { records.push(row); },
    undefined, undefined, 'route-first-campaign-v1');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act3-complete'); expect(report.fledWaves).toBe(0);
  const attempts = report.actThreeAreaPreparation?.attempts; assert.ok(attempts);
  expect(attempts.slice(0, 4).map(row => [row.kind, row.outcome])).toEqual([
    ['route', 'nonwin'], ['training', 'nonwin'], ['training', 'victory'], ['route', 'victory']
  ]);
  expect(attempts[2]?.trainingRecovery).toEqual({ policy: 'learned-offensive-curse-v1',
    area: attempts[1]?.area, triggerOrdinal: attempts[1]?.ordinal });
  expect(records.filter(row => row.kind === 'campaign-training-draw-recovery')).toHaveLength(1);
  expect(report.waves.filter(row => row.ordinal === attempts[2]?.ordinal).map(row => row.advance))
    .toEqual(['next-wave', 'victory']);
  expect(report.actThreeAreaPreparationAudit).toMatchObject({ completed: true, trainingAdmissions: 2, trainingNonwins: 1 });
  assert.ok(report.actThreeAreaPreparationAudit);
  expect(() => { assertCampaignRecovery(report.recovery, report.waves, report.gameplayStatus, new Set(),
    report.openingAudit ?? undefined, report.actTwoAreaPreparationAudit ?? undefined,
    [{ act: 3, nonwinOrdinals: report.actThreeAreaPreparationAudit?.nonwinOrdinals ?? [] }]); }).not.toThrow();
  expect(report.actFourAreaPreparation).toBeNull(); expect(report.actFiveAreaPreparation).toBeNull();
  expect(report.economyAudit).not.toBeNull(); expectRestored(outer);
});

it.each([3, 4, 5] as const)('retains route-first Act %s custody and audits after an admitted technical stop', act => {
  const outer = surroundingRealm();
  prepareRouteFirstFixture();
  const play = vi.mocked(playEarnedWave).getMockImplementation(); assert.ok(play);
  vi.mocked(playEarnedWave).mockImplementation((...args) => {
    if (identities[args[0].challengeOrdinal]?.act === act)
      throw new Error('Constructed route-first playback failure before publication');
    return play(...args);
  });
  const report = runCampaign('act5', 'necromancer-bone-intended-v1', () => undefined,
    undefined, 'main-quests', 'route-first-campaign-v1');
  expect(report.technicalStatus).toBe('failed');
  expect(report.failure).toContain('Constructed route-first playback failure');
  expect(report.failure).not.toContain('Checkpoint');
  const stages = [
    [3, report.actThreeAreaPreparation, report.actThreeAreaPreparationAudit],
    [4, report.actFourAreaPreparation, report.actFourAreaPreparationAudit],
    [5, report.actFiveAreaPreparation, report.actFiveAreaPreparationAudit]
  ] as const;
  for (const [owner, state, audit] of stages) {
    if (owner > act) { expect(state).toBeNull(); expect(audit).toBeNull(); }
    else if (owner < act) {
      expect(state?.completed).toBe(true); expect(audit?.completed).toBe(true);
    } else {
      expect(state).toMatchObject({ entryPolicy: 'route-first-v1', completed: false, failureStatus: 'technical' });
      expect(state?.attempts).toHaveLength(1);
      expect(state?.attempts[0]).toMatchObject({ kind: 'route', outcome: 'interrupted', failureStatus: 'technical' });
      expect(state?.nextOrdinal).toBe(report.successor?.map.challengeOrdinals.normal);
      expect(audit).toMatchObject({ completed: false, admissions: 1, trainingAdmissions: 0, routeAreas: 0 });
    }
  }
  expect(report.admissionHistory.at(-1)?.area).toBe(
    ({ 3: marsh, 4: plains, 5: 'areas/act5-bloody-foothills' } as const)[act]);
  expect(report.waves.some(row => row.ordinal === report.admissionHistory.at(-1)?.ordinal)).toBe(false);
  expect(report.economyAudit).not.toBeNull(); expectRestored(outer);
});

it('rejects route-first minimum Act V before character creation or recording', () => {
  const outer = surroundingRealm(), create = vi.spyOn(creation, 'createCharacter'), record = vi.fn();
  expect(() => runCampaign('act5', 'necromancer-bone-intended-v1', record,
    undefined, undefined, 'route-first-campaign-v1')).toThrow('main-quest Act V');
  expect(create).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled();
  expect(identities).toEqual([]); expectRestored(outer);
});

it('rejects an unknown full-route selection before character creation', () => {
  const create = vi.spyOn(creation, 'createCharacter');
  expect(() => { runCampaign('act5', 'sorceress-cold', () => undefined, undefined, 'unknown'); })
    .toThrow('Invalid Act V route');
  expect(create).not.toHaveBeenCalled(); expect(identities).toEqual([]);
});

it('retains the exact original budget when execution selection is absent', () => {
  const report = runCampaign('act5', 'sorceress-cold', () => undefined);
  expect(report.execution).toEqual({ mode: 'screen', maxAdmissions: 160,
    maxCombatMs: 36_000_000, maxWallMs: 600_000 });
  expect(report.preparations).toEqual([]);
  expect(report.profile).not.toHaveProperty('mercEquipmentPolicy');
});

it('rejects unknown execution selection before character creation or output recording', () => {
  const create = vi.spyOn(creation, 'createCharacter'), record = vi.fn();
  expect(() => { runCampaign('act5', 'sorceress-cold', record, undefined, 'main-quests', 'unknown'); })
    .toThrow('Invalid campaign execution');
  expect(create).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled(); expect(identities).toEqual([]);
});

it('earns four declared preparation stages under explicit bounds without changing the main-quest graph', () => {
  let target: number | null = null;
  const records: RecordRow[] = [];
  const play = vi.mocked(playEarnedWave).getMockImplementation(); assert.ok(play);
  vi.mocked(playEarnedWave).mockImplementation((...args) => {
    if (target === null) return play(...args);
    // This fake XP tests dispatch only. The observed award delta still uses native XP/points.
    const beforeAward = observeEarnedState(), hero = usePlayerStore.getState().player; assert.ok(hero);
    usePlayerStore.getState().gainExperience(Math.max(0, xpTotal(target) - xpTotal(hero.level) - hero.experience));
    const wave = play(...args), afterAward = observeEarnedState();
    return { ...wave, beforeAward, afterAward, actualDelta: earnedDelta(beforeAward, afterAward) };
  });
  const outer = surroundingRealm();
  const report = runCampaign('act5', 'sorceress-cold', row => {
    records.push(row);
    if (row.kind === 'campaign-training-start') target = (row.request as CampaignTrainingRequest).targetLevel;
    if (row.kind === 'campaign-training-terminal') target = null;
  }, undefined, 'main-quests', 'level-training-v1');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act5-complete');
  expect(report.execution).toEqual({ mode: 'level-training-v1', maxAdmissions: 1800,
    maxCombatMs: 216_000_000, maxWallMs: 1_500_000 });
  expect(report.preparations.map(row => [row.request.act, row.request.area, row.request.targetLevel,
    row.result?.status, row.result?.admissions, row.result?.terminalLevel])).toEqual([
    [1, 'areas/act1-den-of-evil', 14, 'target-earned', 1, 14],
    [2, oasis, 26, 'target-earned', 1, 26],
    [3, marsh, 40, 'target-earned', 1, 40],
    [4, plains, 55, 'target-earned', 1, 55]
  ]);
  expect(report.waves.filter(row => row.phase === 'farm')).toHaveLength(4);
  expect(report.questActions).toHaveLength(64); expect(report.economyAudit).not.toBeNull();
  expect(report.questAudit).toMatchObject({ successfulClaims: 15, scrollReads: 1, baalProofs: 1 });
  expect(report.successor?.map.challengeOrdinals.normal).toBe(report.admissions);
  expect(report.terminalLevel).toBe(55); expectRestored(outer);
  expect(report.preparationAudit).toMatchObject({ stages: 4, admissions: 4, nonwinOrdinals: [] });
  expect(report.profile).toHaveProperty('mercEquipmentPolicy', 'monotone-fielded-v1');
  expect(records.some(row => row.kind === 'merc-gear-decision')).toBe(true);
});

it('retains three settled training nonwins and prevents Act II without inventing its target level', () => {
  let training = false;
  const play = vi.mocked(playEarnedWave).getMockImplementation(); assert.ok(play);
  vi.mocked(playEarnedWave).mockImplementation((...args) => {
    const wave = play(...args);
    if (!training) return wave;
    const outcome = wave.played.outcome; assert.ok(outcome);
    return { ...wave, advanceResult: 'defeat', played: { ...wave.played, outcome: {
      ...outcome, winner: 'enemy', finalEnemyTeam: outcome.finalEnemyTeam.map(unit => ({ ...unit, life: 1 }))
    } } };
  });
  const outer = surroundingRealm();
  const report = runCampaign('act5', 'sorceress-cold', row => {
    if (row.kind === 'campaign-training-start') training = true;
    if (row.kind === 'campaign-training-terminal') training = false;
  }, undefined, 'main-quests', 'level-training-v1');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('nonwin');
  expect(report.failure).toBe('Campaign training retry-limit before Act 2');
  expect(report.preparations).toMatchObject([{ failureStatus: 'nonwin', result: {
    status: 'retry-limit', admissions: 3, wins: 0, nonwins: 3,
    consecutiveNonwins: 3, lastAttempt: 'nonwin' } }]);
  expect(report.terminalLevel).toBeLessThan(14); expect(report.questActions).toEqual([]);
  expect(identities.map(row => [row.act, row.area])).toEqual([[1, prefixArea],
    [1, 'areas/act1-den-of-evil'], [1, 'areas/act1-den-of-evil'], [1, 'areas/act1-den-of-evil']]);
  expect(report.totals.nonwins).toBe(3); expect(report.economyAudit).not.toBeNull();
  expect(report.questAudit).not.toBeNull(); expectRestored(outer);
  expect(report.preparationAudit).toMatchObject({ stages: 1, admissions: 3, nonwinOrdinals: [1, 2, 3] });
});

it('rejects an uncleared preparation area before spending points or admitting training', () => {
  const records: RecordRow[] = [];
  const report = runCampaign('act5', 'sorceress-cold', row => {
    records.push(row);
    if (row.kind === 'fresh-act1-prefix') useMapStore.setState(state => ({
      clearedSubAreas: state.clearedSubAreas.filter(area => area !== 'areas/act1-den-of-evil')
    }));
  }, undefined, 'main-quests', 'level-training-v1');
  expect(report.technicalStatus).toBe('failed');
  expect(report.failure).toContain('Preparation requires a previously cleared area');
  expect(report.preparations).toEqual([]); expect(identities).toHaveLength(1);
  expect(records.some(row => row.kind === 'campaign-training-start')).toBe(false);
  expect(report.economyAudit).not.toBeNull(); expect(report.questAudit).not.toBeNull();
});

it('retains an interrupted preparation at the new explicit wall budget without starting Act II', () => {
  const outer = surroundingRealm();
  const report = runCampaign('act5', 'sorceress-cold', row => {
    if (row.kind === 'settled-wave' && identities.at(-1)?.area === 'areas/act1-den-of-evil') wallTime = 1_500_001;
  }, undefined, 'main-quests', 'level-training-v1');
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget'); expect(report.wallMs).toBe(1_500_001);
  expect(report.preparations).toMatchObject([{ startOrdinal: 1, nextOrdinal: 2,
    result: null, failureStatus: 'budget' }]);
  expect(report.preparationAudit).toEqual({ stages: 1, admissions: 1, xp: 0, nonwinOrdinals: [] });
  expect(report.questActions).toEqual([]); expect(report.admissions).toBe(2);
  expect(report.economyAudit).not.toBeNull(); expectRestored(outer);
});

it.each([
  ['act1', 'nonwin'], ['act1', 'budget'], ['act1', 'technical'],
  ['act2', 'nonwin'], ['act2', 'budget'], ['act2', 'technical'],
  ['act3', 'nonwin'], ['act3', 'budget'], ['act3', 'technical'],
  ['act4', 'nonwin'], ['act4', 'budget'], ['act4', 'technical']
] as const)('never starts Act V after %s %s stops the shared invocation', (stage, status) => {
  const stop = () => {
    if (status === 'technical') throw new Error(`Constructed ${stage} technical stop`);
    throw new CampaignStop(status, `Constructed ${stage} ${status}`);
  };
  if (stage === 'act1') vi.mocked(runActOne).mockImplementation(stop);
  else if (stage === 'act2') vi.mocked(runActTwo).mockImplementation(stop);
  else if (stage === 'act3') vi.mocked(actThree.runActThree).mockImplementation(stop);
  else vi.mocked(actFour.runActFour).mockImplementation(stop);
  const outer = surroundingRealm(), runFive = vi.spyOn(actFive, 'runActFive');
  const report = runCampaign('act5', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe(status === 'technical' ? 'failed' : 'completed');
  expect(report.gameplayStatus).toBe(status === 'technical' ? 'incomplete' : status);
  expect(report.failure).toContain(`Constructed ${stage} ${status}`);
  expect(runFive).not.toHaveBeenCalled(); expect(playedIndices).toEqual([]);
  expect(identities.some(row => row.act === 5)).toBe(false);
  expect(report.questActions.some(row => row.id.startsWith('quests/act5-'))).toBe(false);
  expect(report.successor?.map.questProgress[eve]).toBeUndefined();
  expect(report.questActions).toHaveLength(stage === 'act4' ? 32 : stage === 'act3' ? 21 : 0);
  expect(report.questAudit).not.toBeNull(); expect(report.economyAudit).not.toBeNull();
  expectRestored(outer);
});

it.each(['missing-claim-entry', 'revived-stone'] as const)('rejects a corrupt %s Act IV boundary before Eve Start', fault => {
  vi.mocked(actFour.runActFour).mockImplementation((...args) => {
    const successor = actualActFour(...args);
    if (fault === 'missing-claim-entry') args[3].entries.pop();
    else {
      const items = useInventoryStore.getState().questItems, stone = items[soulstone]; assert.ok(stone);
      useInventoryStore.setState({ questItems: { ...items, [soulstone]: { ...stone, state: 'owned' } } });
    }
    return successor;
  });
  const outer = surroundingRealm(), runFive = vi.spyOn(actFive, 'runActFive');
  const report = runCampaign('act5', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(runFive).not.toHaveBeenCalled(); expect(playedIndices).toEqual([]);
  expect(report.successor?.map.questProgress[eve]).toBeUndefined(); expectRestored(outer);
});

it.each([0, 1, 2, 3, 4, 5, 6, 7])('retains the first %s suffix victories and stops on that wave nonwin', index => {
  nonwinIndex = index;
  const outer = surroundingRealm(), report = runCampaign('act5', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed'); expect(report.gameplayStatus).toBe('nonwin');
  expect(playedIndices).toEqual(Array.from({ length: index + 1 }, (_, value) => value));
  expect(identities.filter(row => row.act === 5)).toHaveLength(1);
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual([['start', eve]]);
  expect(report.waves.at(-1)).toMatchObject({ area: throne, index, outcome: 'defeat', advance: 'defeat' });
  expectEconomy(report, prefixXp, index + 1); expectMaterials(report, index + 1);
  expect(report.questAudit).not.toBeNull();
  expect(report.successor?.map.questReceipts[throneProof]).toBe(index > 4 ? true : undefined);
  expect(report.successor?.map.questReceipts[baalProof]).toBeUndefined();
  expect(report.successor?.map.questProgress[eve]?.objectives).toEqual({ 'obj-throne-waves': index > 4, 'obj-kill-baal': false });
  expect(report.successor?.map.questProgress[eve]?.rewardClaimed).not.toBe(true);
  expect(report.successor?.map.questTitles).toEqual({}); expect(report.successor?.map.questDifficulties).toEqual({});
  expect(report.successor?.map.clearedSubAreas).not.toContain(throne); expectRestored(outer);
});

it('retains the original wall budget and the staged unplayed next guard wave', () => {
  const outer = surroundingRealm();
  const report = runCampaign('act5', 'sorceress-cold', record => {
    if (record.kind === 'settled-wave' && playedIndices.at(-1) === 5) wallTime = 600_001;
  });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed'); expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign time budget reached between waves');
  expect(playedIndices).toEqual([0, 1, 2, 3, 4, 5]); expect(report.stagedWaves).toBe(19);
  expect(report.waves).toHaveLength(18); expect(suffixEntries(report)).toHaveLength(1);
  expect(report.successor?.map.questReceipts[throneProof]).toBe(true);
  expect(report.successor?.map.questReceipts[baalProof]).toBeUndefined();
  expectEconomy(report, prefixXp, 6); expectMaterials(report, 6); expectRestored(outer);
});

it.each(['playback-throne', 'observer-throne', 'logger-throne', 'playback-baal', 'observer-baal',
  'logger-baal', 'native-claim', 'claim-recorder', 'claim-recorder-checkpoint'] as const)(
  'retains committed source/income/entitlements after %s without continuation', trigger => {
  failurePoint = trigger;
  if (trigger === 'native-claim') {
    const claim = nativeClaims.claimQuestReward;
    vi.spyOn(nativeClaims, 'claimQuestReward').mockImplementation(id => {
      const result = claim(id);
      if (id === eve && result === 'ok') throw new Error('Constructed native-claim failure after publication');
      return result;
    });
  }
  const outer = surroundingRealm(), records: RecordRow[] = [];
  const report = runCampaign('act5', 'sorceress-cold', record => {
    records.push(record);
    if (record.kind === 'stopped-native-checkpoint' && trigger === 'claim-recorder-checkpoint')
      throw new Error('Constructed Act V checkpoint recorder failure');
    const atProof = record.kind === 'settled-wave' &&
      (trigger === 'logger-throne' && playedIndices.at(-1) === 4 || trigger === 'logger-baal' && playedIndices.at(-1) === 7);
    const atClaim = record.kind === 'quest-action' && record.action === 'claim' && record.id === eve &&
      (trigger === 'claim-recorder' || trigger === 'claim-recorder-checkpoint');
    if (atProof || atClaim) throw new Error(`Constructed ${trigger} recorder failure`);
  });
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(report.failure).toContain(`Constructed ${trigger}`);
  const afterClaim = trigger === 'native-claim' || trigger === 'claim-recorder' || trigger === 'claim-recorder-checkpoint';
  const atFirstProof = trigger.endsWith('-throne'), played = atFirstProof ? 5 : 8;
  expect(playedIndices).toEqual(Array.from({ length: played }, (_, index) => index));
  expect(suffixEntries(report)).toHaveLength(afterClaim ? 2 : 1);
  expectEconomy(report, afterClaim ? [...prefixXp, 40000] : prefixXp, played); expectMaterials(report, played);
  expect(report.questAudit).not.toBeNull();
  expect(report.successor?.map.questReceipts[throneProof]).toBe(true);
  expect(report.successor?.map.questReceipts[baalProof]).toBe(atFirstProof ? undefined : true);
  expect(report.successor?.map.questTitles).toEqual(afterClaim ? { 'titles/slayer_of_baal': true } : {});
  expect(report.successor?.map.questDifficulties).toEqual(afterClaim ? { 'difficulty/nightmare': true } : {});
  expect(report.successor?.map.selectedTitle).toBeNull(); expect(report.successor?.map.selectedDifficulty).toBe('normal');
  if (trigger.startsWith('playback-') || trigger.startsWith('observer-')) {
    const thrown = trigger.startsWith('playback-'), index = atFirstProof ? 4 : 7;
    expect(report.unobservedWaves).toEqual([{ phase: 'route', area: throne, ordinal: 12, index,
      logicalMs: thrown ? null : 1, xp: 1, items: 0 }]);
    expect(report.questSettlements.at(-1)).toMatchObject({ act: 5, area: throne, ordinal: 12, index,
      actionIndex: 46, nativeReturned: !thrown, winner: thrown ? null : 'player',
      heroLife: thrown ? null : 1, advance: thrown ? null : index === 7 ? 'victory' : 'next-wave' });
    expect(report.totals.unmeasuredWaves).toBe(thrown ? 1 : 0);
    expect(report.totals.combatMs).toBe(12 + played - (thrown ? 1 : 0));
    if (thrown) {
      expect(report.nativeWaveExceptions[0]?.error).toBe(`Error: Constructed ${trigger} failure after publication`);
      expect(report.totals.allEarnedXpPerCombatHour).toBeNull();
    }
  }
  if (afterClaim) expect(suffixEntries(report)[1]).toMatchObject({ result: trigger === 'native-claim' ? 'threw' : 'ok',
    delta: { xp: 40000 } });
  if (trigger === 'claim-recorder-checkpoint') expect(report.failure).toContain('Constructed Act V checkpoint recorder failure');
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1); expectRestored(outer);
});

it.each(['economy', 'quests'] as const)('retains an independent checkpoint when the %s audit fails', failedAudit => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  let injectedFailures = 0;
  const report = runCampaign('act5', 'sorceress-cold', record => {
    records.push(record);
    // First-boss observations also audit economy. Inject only at the terminal checkpoint.
    if (record.kind !== 'quest-action' || record.action !== 'claim' || record.id !== eve) return;
    if (failedAudit === 'economy') vi.spyOn(economy, 'auditCampaignEconomy').mockImplementationOnce(() => {
      injectedFailures++; throw new Error('Constructed independent economy audit failure');
    });
    else vi.spyOn(questAudit, 'auditCampaignQuests').mockImplementationOnce(() => {
      injectedFailures++; throw new Error('Constructed independent quests audit failure');
    });
  });
  expect(injectedFailures).toBe(1);
  expect(report.firstBossEntries.length).toBeGreaterThan(0);
  expect(report.firstBossEntries.every(entry => entry.costs.economyError === null)).toBe(true);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('act5-complete');
  expect(report.failure).toContain(`Constructed independent ${failedAudit} audit failure`);
  expect(failedAudit === 'economy' ? report.economyAudit : report.questAudit).toBeNull();
  expect(failedAudit === 'economy' ? report.questAudit : report.economyAudit).not.toBeNull();
  expect(report.successor?.map.questTitles).toEqual({ 'titles/slayer_of_baal': true });
  expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1); expectRestored(outer);
});

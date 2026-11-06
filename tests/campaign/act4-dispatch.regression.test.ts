/** Constructed runner wiring only: every combat/admission/proof here is fake, never earned evidence.
 * Act II/III/IV routes, explicit quest operations, Claims, point grants and cleanup stay native. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import * as creation from '@/features/character/createCharacter';
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
import { runCampaign } from './native-runner';
import { runActOne, CampaignStop } from './route';
import { runActTwo, actTwoActionOrder } from './act2-route';
import * as actThree from './act3-route';
import * as actFour from './act4-route';
import * as economy from './economy';
import * as questAudit from './quest-audit';
import { campaignProfiles } from './profiles';
import { publishConstructedActFourEncounter } from './act4-fixture';

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./act2-route', async original => {
  const actual = await original<typeof import('./act2-route')>();
  return { ...actual, runActTwo: vi.fn(actual.runActTwo) };
});
vi.mock('./act3-route', async original => {
  const actual = await original<typeof import('./act3-route')>();
  return { ...actual, runActThree: vi.fn(actual.runActThree) };
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
const chaos = 'areas/act4-chaos-sanctuary', suffixAreas = [plains, river, chaos] as const;
const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const hammer = `${forge}#objective:obj-kill-hephasto`, shatter = `${forge}#action:shatter-soulstone`;
const izual = `${fallen}#action:izual-victory`, hephasto = `${forge}#action:hephasto-victory`;
const diablo = `${terror}#action:diablo-victory`;
const prefixXp = [8000, 5000, 4500, 6000, 7000, 12000, 8000, 18000];
type FailurePoint = 'playback-hephasto' | 'observer-hephasto' | 'assertion-hephasto' | 'izual-proof' |
  'fallen-claim' | 'hammer' | 'shatter' | 'forge-claim' | 'diablo-proof' | 'terror-claim';
type RecordRow = Readonly<Record<string, unknown>>;
let restores: (() => void)[];
let pity: number;
let wallTime: number;
let failurePoint: FailurePoint | undefined;
let nonwin: { area: string; outcome: 'defeat' | 'draw'; afterProof?: boolean } | undefined;
let actualActTwo: typeof runActTwo;
let actualActThree: typeof actThree.runActThree;
let identities: { act: number; area: string; ordinal: number; heroId: string; mercId: string | null }[];

beforeEach(async () => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(runActTwo).mockReset(); vi.mocked(actThree.runActThree).mockReset();
  actualActTwo = (await vi.importActual<typeof import('./act2-route')>('./act2-route')).runActTwo;
  vi.mocked(runActTwo).mockImplementation(actualActTwo);
  actualActThree = (await vi.importActual<typeof import('./act3-route')>('./act3-route')).runActThree;
  vi.mocked(actThree.runActThree).mockImplementation(actualActThree);
  vi.mocked(startCampaignAdmission).mockReset(); vi.mocked(playEarnedWave).mockReset();
  vi.mocked(observeP15Wave).mockReset(); vi.mocked(assertCampaignSettlement).mockReset();
  identities = []; wallTime = 0; failurePoint = undefined; nonwin = undefined;
  vi.spyOn(performance, 'now').mockImplementation(() => wallTime);
  vi.mocked(runActOne).mockImplementation((_profile, record, enter, reward) => {
    enter(prefixArea, 'route');
    // Disclosed constructed clear/objective; actual Sisters Claim is the prefix income.
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const ordinal = identities.length, location = area.replace(/^areas\/act([1-5])-/, 'a$1-');
    identities.push({ act, area, ordinal, heroId: player.id, mercId: useMercStore.getState().fieldedMercId });
    useMapStore.getState().setCurrentLocation(act, location);
    return { location, handle: { runId: area, runSeed: 0, challengeOrdinal: ordinal, totalWaves: nonwin?.area === area && nonwin.afterProof ? 2 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const admission = identities[handle.challengeOrdinal]; assert.ok(admission);
    const beforeAward = observeEarnedState(), combat = observeStore(useCombatStore);
    const partial = nonwin?.area === admission.area && nonwin.afterProof === true;
    const lost = nonwin?.area === admission.area && (!partial || index === 1) ? nonwin.outcome : undefined;
    if (!lost) constructedEncounter(admission.act, admission.area, !partial);
    // Disclosed constructed native grants test retained ordinary income, never earned combat.
    const residual = (failurePoint === 'observer-hephasto' || failurePoint === 'playback-hephasto') &&
      admission.area === river;
    if (residual) {
      usePlayerStore.getState().gainExperience(1);
      useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
    }
    if (failurePoint === 'playback-hephasto' && admission.area === river)
      throw new Error('Constructed playback-hephasto failure after publication');
    const afterAward = observeEarnedState();
    // Only the retention wrapper reads these dummy units. No native recording or battle exists.
    const fakeHero = { id: admission.heroId, kind: 'hero', side: 'player', life: 1, mana: 1 } as
      EarnedWave['opening']['playerTeam'][number];
    const fakeEnemy = { id: 'constructed-hostile', kind: 'monster', side: 'enemy', life: 1 } as
      EarnedWave['opening']['enemyTeam'][number];
    const outcome = { winner: lost === 'draw' ? null : lost ? 'enemy' : 'player',
      finalPlayerTeam: [fakeHero], finalEnemyTeam: [{ ...fakeEnemy, life: lost ? 1 : 0 }] } as
      NonNullable<EarnedWave['played']['outcome']>;
    return unrecordedCampaignWave({ index, opening: { ...combat, playerTeam: [fakeHero], enemyTeam: [fakeEnemy],
      subAreaRunId: admission.area }, played: { ...combat, outcome },
      beforeAward, afterAward, afterAdvance: combat, advanceResult: lost ? 'defeat' : partial ? 'next-wave' : 'victory',
      terminalSimClockMs: 1,
      rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: residual ? { 'materials/scrap': 3 } : {} },
      actualDelta: earnedDelta(beforeAward, afterAward) });
  });
  vi.mocked(observeP15Wave).mockImplementation(wave => {
    if (failurePoint === 'observer-hephasto' && useMapStore.getState().currentSubAreaId === 'a4-river-of-flame')
      throw new Error('Constructed observer-hephasto failure after publication');
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
  vi.mocked(assertCampaignSettlement).mockImplementation(() => {
    if (failurePoint === 'assertion-hephasto' && useMapStore.getState().currentSubAreaId === 'a4-river-of-flame')
      throw new Error('Constructed assertion-hephasto failure after publication');
  });
});

afterEach(() => { vi.restoreAllMocks(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

/** Fake encounter effects only. Every explicit quest operation and Claim still uses native APIs. */
function constructedEncounter(act: number, area: string, clear = true) {
  const map = useMapStore.getState();
  if (act === 1) return;
  if (act === 2) {
    if (area === oasis) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.radament'] });
    else if (area === sanctuary) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.the-summoner'] });
    else if (area === tomb) map.recordBossKill({ actId: 'acts/act2', areaId: area,
      bossArchetypeId: 'monsters/act2.duriel' });
    else throw new Error(`Unexpected constructed Act II area ${area}`);
  } else if (act === 3) {
    if (area === travincal) useMapStore.setState({ questReceipts: { ...map.questReceipts, [council]: true } });
    if (area === durance) {
      expect(map.questReceipts[orb]).toBe(true);
      expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed');
      map.updateQuestProgress(guardian, { status: 'completed', objectives: { 'obj-kill-mephisto': true } });
    }
  } else {
    expect(act).toBe(4); publishConstructedActFourEncounter(area);
  }
  if (clear) map.markCleared(area);
}

function realm() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore),
    hydration: observeStore(useHydrationStore) };
}

function surroundingRealm() {
  vi.spyOn(Date, 'now').mockReturnValue(1793304123456);
  useHydrationStore.getState().setStatus('ready');
  expect(creation.createCharacter('A4 outer realm', 'amazon').ok).toBe(true);
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
  return report.questActions.slice(32);
}

it.each(Object.keys(campaignProfiles))('retains one fresh invocation and exact 21/32 boundaries for %s', profileId => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  const create = vi.spyOn(creation, 'createCharacter'), runFour = vi.spyOn(actFour, 'runActFour');
  const report = runCampaign('act4', profileId, record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act4-complete'); expect(report.failure).toBeNull();
  expect(create).toHaveBeenCalledTimes(1); expect(runActOne).toHaveBeenCalledTimes(1);
  expect(runActTwo).toHaveBeenCalledTimes(1); expect(actThree.runActThree).toHaveBeenCalledTimes(1);
  expect(runFour).toHaveBeenCalledTimes(1);
  for (const kind of ['created', 'hire', 'stopped-native-checkpoint'])
    expect(records.filter(row => row.kind === kind)).toHaveLength(1);
  expect(identities.map(row => row.area)).toEqual([prefixArea, oasis, sanctuary, tomb, ...actThreeAreas, ...suffixAreas]);
  expect(identities.map(row => row.act)).toEqual([1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4]);
  expect(report.waves.map(row => row.ordinal)).toEqual(Array.from({ length: 12 }, (_, index) => index));
  expect(new Set(identities.map(row => row.heroId))).toEqual(new Set([report.successor?.player.id]));
  expect(new Set(identities.map(row => row.mercId)).size).toBe(1); expect(identities[0]?.mercId).toBeTruthy();
  const selected = vi.mocked(runActOne).mock.calls[0]?.[0];
  expect(vi.mocked(runActTwo).mock.calls[0]?.[0]).toBe(selected);
  expect(vi.mocked(actThree.runActThree).mock.calls[0]?.[0]).toBe(selected);
  expect(runFour.mock.calls[0]?.[0]).toBe(selected);
  expect(report.questActions).toHaveLength(45);
  expect(report.questActions.slice(0, 21).map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(report.questActions.slice(21, 32).map(row => [row.action, row.id])).toEqual(actThree.actThreeActionOrder);
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actFour.actFourActionOrder);
  const copiedTwo = records.find(row => row.kind === 'fresh-act2-prefix')?.act2Entries;
  const copiedThree = records.find(row => row.kind === 'fresh-act3-prefix')?.act3Entries;
  expect(copiedTwo).toEqual(report.questActions.slice(0, 21));
  expect(copiedThree).toEqual(report.questActions.slice(21, 32));
  expectEconomy(report, [...prefixXp, 9000, 7000, 25000]);
  expect(report.questAudit).toMatchObject({ successfulClaims: 10, reads: 1,
    explicitSkillPoints: 4, explicitStatPoints: 0, councilProofs: 1, guardianCompletions: 1 });
  expect(report.successor?.inventory.questItems[soulstone]).toEqual({ itemId: 'items/soulstone_mephisto', state: 'consumed' });
  expect(report.successor?.inventory.questItems[hammer]).toEqual({ itemId: 'quest/hellforge_hammer', state: 'consumed' });
  expect(report.successor?.map.questReceipts).toEqual({ [council]: true, [orb]: true, [izual]: true,
    [hephasto]: true, [shatter]: true, [diablo]: true });
  const visits = suffixEntries(report).filter(row => row.action === 'visit');
  expect(visits.map(row => [row.id, row.before.currentSubAreaId, row.after.currentSubAreaId, row.after.currentAct]))
    .toEqual([[river, 'a4-river-of-flame', river, 4], [chaos, river, chaos, 4]]);
  expect(suffixEntries(report).find(row => row.id === shatter)?.before.currentSubAreaId).toBe(river);
  expect(suffixEntries(report).filter(row => row.action === 'interact').map(row => row.before.currentSubAreaId))
    .toEqual([chaos, chaos, chaos]);
  expect(report.questSettlements.filter(row => row.act === 4).map(row => [row.area, row.ordinal, row.actionIndex]))
    .toEqual([[plains, 9, 35], [river, 10, 36], [chaos, 11, 44]]);
  expectRestored(outer);
});

it.each([
  ['act1', 'nonwin'], ['act1', 'budget'], ['act1', 'technical'],
  ['act2', 'nonwin'], ['act2', 'budget'], ['act2', 'technical'],
  ['act3', 'nonwin'], ['act3', 'budget'], ['act3', 'technical']
] as const)('never starts Act IV after a constructed %s %s stop', (stage, status) => {
  const stop = () => {
    if (status === 'technical') throw new Error(`Constructed ${stage} technical stop`);
    throw new CampaignStop(status, `Constructed ${stage} ${status}`);
  };
  if (stage === 'act1') vi.mocked(runActOne).mockImplementation(stop);
  else if (stage === 'act2') vi.mocked(runActTwo).mockImplementation(stop);
  else vi.mocked(actThree.runActThree).mockImplementation(stop);
  const outer = surroundingRealm(), runFour = vi.spyOn(actFour, 'runActFour');
  const report = runCampaign('act4', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe(status === 'technical' ? 'failed' : 'completed');
  expect(report.gameplayStatus).toBe(status === 'technical' ? 'incomplete' : status);
  expect(report.failure).toContain(`Constructed ${stage} ${status}`);
  expect(runFour).not.toHaveBeenCalled(); expect(identities.some(row => row.act === 4)).toBe(false);
  expect(report.questActions.some(row => row.id.startsWith('quests/act4-'))).toBe(false);
  expect(report.successor?.map.questProgress[fallen]).toBeUndefined();
  expect(report.questActions).toHaveLength(stage === 'act3' ? 21 : 0);
  expect(report.questAudit).not.toBeNull(); expect(report.economyAudit).not.toBeNull();
  expectRestored(outer);
});

it.each(['access-only', 'missing-claim-entry'] as const)('rejects an incomplete %s Act III prefix before Starts', fault => {
  vi.mocked(actThree.runActThree).mockImplementation((profile, record, enter, actions) => {
    if (fault === 'access-only') { useMapStore.getState().markCleared(durance); return profile; }
    const successor = actualActThree(profile, record, enter, actions); actions.entries.pop();
    return successor;
  });
  const outer = surroundingRealm(), runFour = vi.spyOn(actFour, 'runActFour');
  const report = runCampaign('act4', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(runFour).not.toHaveBeenCalled(); expect(identities.some(row => row.act === 4)).toBe(false);
  expect(report.successor?.map.questProgress[fallen]).toBeUndefined();
  expectRestored(outer);
});

it.each([
  [plains, 'draw', false], [river, 'defeat', false], [chaos, 'defeat', false],
  [plains, 'defeat', true], [river, 'draw', true]
] as const)('stops fake suffix %s %s after proof=%s without later actions', (area, outcome, afterProof) => {
  nonwin = { area, outcome, afterProof };
  const outer = surroundingRealm(), stopIndex = suffixAreas.indexOf(area);
  const report = runCampaign('act4', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed'); expect(report.gameplayStatus).toBe('nonwin');
  expect(identities.filter(row => row.act === 4).map(row => row.area)).toEqual(suffixAreas.slice(0, stopIndex + 1));
  expect(report.waves.at(-1)).toMatchObject({ area, outcome, index: afterProof ? 1 : 0 });
  expect(report.successor?.map.clearedSubAreas).not.toContain(area);
  const length = area === plains ? 3 : area === river ? 4 : 12;
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actFour.actFourActionOrder.slice(0, length));
  expectEconomy(report, area === plains ? prefixXp : area === river ? [...prefixXp, 9000] : [...prefixXp, 9000, 7000]);
  expect(report.questAudit).not.toBeNull();
  const proof = area === plains ? izual : area === river ? hephasto : diablo;
  expect(report.successor?.map.questReceipts[proof]).toBe(afterProof ? true : undefined);
  if (area !== chaos) expect(report.successor?.inventory.questItems[hammer]).toBeUndefined();
  expect(report.successor?.map.questProgress[terror]?.rewardClaimed).not.toBe(true);
  expectRestored(outer);
});

it.each([
  ['playback-hephasto', false], ['observer-hephasto', false], ['assertion-hephasto', false],
  ['izual-proof', false], ['fallen-claim', false], ['hammer', false], ['shatter', false],
  ['forge-claim', false], ['diablo-proof', false], ['terror-claim', false],
  ['playback-hephasto', true], ['observer-hephasto', true], ['assertion-hephasto', true],
  ['izual-proof', true], ['fallen-claim', true], ['hammer', true], ['shatter', true],
  ['forge-claim', true], ['diablo-proof', true], ['terror-claim', true]
] as const)('retains native writes/income after %s (checkpoint failure=%s)', (trigger, failCheckpoint) => {
  failurePoint = trigger;
  const outer = surroundingRealm(), records: RecordRow[] = [];
  let checkpointAttempts = 0;
  const report = runCampaign('act4', 'sorceress-cold', record => {
    records.push(record);
    if (record.kind === 'stopped-native-checkpoint') {
      checkpointAttempts++; if (failCheckpoint) throw new Error('Constructed Act IV checkpoint recorder failure');
    }
    const atProof = record.kind === 'settled-wave' &&
      (trigger === 'izual-proof' && useMapStore.getState().currentSubAreaId === 'a4-plains-of-despair' ||
       trigger === 'diablo-proof' && useMapStore.getState().currentSubAreaId === 'a4-chaos-sanctuary');
    const atAction = record.kind === 'quest-action' &&
      (trigger === 'hammer' && record.action === 'recover' && record.id === hammer ||
       trigger === 'shatter' && record.action === 'execute' && record.id === shatter ||
       trigger === 'fallen-claim' && record.action === 'claim' && record.id === fallen ||
       trigger === 'forge-claim' && record.action === 'claim' && record.id === forge ||
       trigger === 'terror-claim' && record.action === 'claim' && record.id === terror);
    if (atProof || atAction) throw new Error(`Constructed ${trigger} recorder failure`);
  });
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(report.failure).toContain(`Constructed ${trigger}`); expect(checkpointAttempts).toBe(1);
  if (failCheckpoint) expect(report.failure).toContain('Constructed Act IV checkpoint recorder failure');
  else expect(report.failure).not.toContain('Checkpoint:');
  const actionCount = trigger === 'izual-proof' ? 3 : trigger === 'hammer' ? 6 : trigger === 'shatter' ? 7 :
    trigger === 'forge-claim' ? 8 : trigger === 'diablo-proof' ? 12 : trigger === 'terror-claim' ? 13 : 4;
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actFour.actFourActionOrder.slice(0, actionCount));
  expect(identities.filter(row => row.act === 4).map(row => row.area)).toEqual(
    suffixAreas.slice(0, trigger === 'izual-proof' || trigger === 'fallen-claim' ? 1 : actionCount >= 12 ? 3 : 2));
  const xp = trigger === 'izual-proof' ? prefixXp : actionCount === 13 ? [...prefixXp, 9000, 7000, 25000] :
    actionCount >= 8 ? [...prefixXp, 9000, 7000] : [...prefixXp, 9000];
  const residual = trigger === 'playback-hephasto' || trigger === 'observer-hephasto';
  expectEconomy(report, xp, residual ? 1 : 0);
  expect(report.questAudit).toMatchObject({ successfulClaims: xp.length - 1 });
  expect(report.successor?.map.questReceipts[izual]).toBe(true);
  if (actionCount >= 6) expect(report.successor?.inventory.questItems[hammer]?.state).toBe(actionCount >= 7 ? 'consumed' : 'owned');
  else expect(report.successor?.inventory.questItems[hammer]).toBeUndefined();
  expect(report.successor?.inventory.questItems[soulstone]?.state).toBe(actionCount >= 7 ? 'consumed' : 'owned');
  if (actionCount >= 7) expect(report.successor?.map.questReceipts[shatter]).toBe(true);
  if (actionCount >= 12) expect(report.successor?.map.questReceipts[diablo]).toBe(true);
  if (residual) {
    expect(report.unobservedWaves).toEqual([{ phase: 'route', area: river, ordinal: 10, index: 0,
      logicalMs: trigger === 'playback-hephasto' ? null : 1, xp: 1, items: 0 }]);
    expect(report.successor?.inventory.materials['materials/scrap'] ?? 0).toBe(report.questRewards.reduce(
      (total, delta) => total + (delta.materials['materials/scrap'] ?? 0), 0) + 3);
    const retained = report.questSettlements.find(row => row.area === river);
    expect(retained).toMatchObject({ actionIndex: 36, ordinal: 10,
      nativeReturned: trigger !== 'playback-hephasto', after: { receipts: { [hephasto]: true } } });
    if (trigger === 'playback-hephasto') {
      expect(retained).toMatchObject({ winner: null, heroLife: null, advance: null });
      expect(report.nativeWaveExceptions).toHaveLength(1);
      expect(report.nativeWaveExceptions[0]?.error).toBe('Error: Constructed playback-hephasto failure after publication');
      expect(report.totals.unmeasuredWaves).toBe(1); expect(report.totals.allEarnedXpPerCombatHour).toBeNull();
    } else {
      expect(retained).toMatchObject({ winner: 'player', heroLife: 1, advance: 'victory' });
      expect(report.totals.unmeasuredWaves).toBe(0); expect(report.totals.combatMs).toBe(11);
    }
  }
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expectRestored(outer);
});

it.each(['economy', 'quests'] as const)('attempts both checkpoint audits when the %s audit fails', failedAudit => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  let injectedFailures = 0;
  const report = runCampaign('act4', 'sorceress-cold', record => {
    records.push(record);
    // First-boss observations also audit economy. Inject only at the terminal checkpoint.
    if (record.kind !== 'quest-action' || record.action !== 'claim' || record.id !== terror) return;
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
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('act4-complete');
  expect(report.failure).toContain(`Constructed independent ${failedAudit} audit failure`);
  expect(failedAudit === 'economy' ? report.economyAudit : report.questAudit).toBeNull();
  expect(failedAudit === 'economy' ? report.questAudit : report.economyAudit).not.toBeNull();
  expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expectRestored(outer);
});

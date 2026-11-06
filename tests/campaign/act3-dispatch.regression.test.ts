/** Constructed runner wiring only: every combat/admission/proof here is fake, never earned evidence.
 * Act II/III routes, explicit quest operations, Claims, point grants and cleanup stay native. */
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

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./act2-route', async original => {
  const actual = await original<typeof import('./act2-route')>();
  return { ...actual, runActTwo: vi.fn(actual.runActTwo) };
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
const suffixAreas = [marsh, jungle, bazaar, travincal, durance] as const;
const prefixXp = [8000, 5000, 4500, 6000, 7000, 12000];
type FailurePoint = 'playback-council' | 'observer-council' | 'assertion-council' | 'logger-council' | 'orb' | 'guardian';
type RecordRow = Readonly<Record<string, unknown>>;
let restores: (() => void)[];
let pity: number;
let wallTime: number;
let failurePoint: FailurePoint | undefined;
let nonwin: { area: string; outcome: 'defeat' | 'draw' } | undefined;
let actualActTwo: typeof runActTwo;
let identities: { act: number; area: string; ordinal: number; heroId: string; mercId: string | null }[];

beforeEach(async () => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(runActTwo).mockReset();
  actualActTwo = (await vi.importActual<typeof import('./act2-route')>('./act2-route')).runActTwo;
  vi.mocked(runActTwo).mockImplementation(actualActTwo);
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
    return { location, handle: { runId: area, runSeed: 0, challengeOrdinal: ordinal, totalWaves: 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const admission = identities[handle.challengeOrdinal]; assert.ok(admission);
    const beforeAward = observeEarnedState(), combat = observeStore(useCombatStore);
    const lost = nonwin?.area === admission.area ? nonwin.outcome : undefined;
    if (!lost) constructedEncounter(admission.act, admission.area);
    // Disclosed constructed native grants check that playback/observer failures retain committed income.
    if ((failurePoint === 'observer-council' || failurePoint === 'playback-council') && admission.area === travincal)
      usePlayerStore.getState().gainExperience(1);
    if (failurePoint === 'playback-council' && admission.area === travincal) {
      useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
      throw new Error('Constructed playback-council failure after publication');
    }
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
      beforeAward, afterAward, afterAdvance: combat, advanceResult: lost ? 'defeat' : 'victory',
      terminalSimClockMs: 1,
      rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} },
      actualDelta: earnedDelta(beforeAward, afterAward) });
  });
  vi.mocked(observeP15Wave).mockImplementation(wave => {
    if (failurePoint === 'observer-council' && useMapStore.getState().currentSubAreaId === 'a3-travincal')
      throw new Error('Constructed observer-council failure after publication');
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
    if (failurePoint === 'assertion-council' && useMapStore.getState().currentSubAreaId === 'a3-travincal')
      throw new Error('Constructed assertion-council failure after publication');
  });
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
    else throw new Error(`Unexpected constructed Act II area ${area}`);
  } else {
    if (area === travincal) useMapStore.setState({ questReceipts: { ...map.questReceipts, [council]: true } });
    if (area === durance) {
      expect(map.questReceipts[orb]).toBe(true);
      expect(useInventoryStore.getState().questItems[will]?.state).toBe('consumed');
      map.updateQuestProgress(guardian, { status: 'completed', objectives: { 'obj-kill-mephisto': true } });
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
  expect(creation.createCharacter('A3 outer realm', 'amazon').ok).toBe(true);
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
  return report.questActions.slice(actTwoActionOrder.length);
}

it('keeps one fresh invocation, hero, hire, profile, action ledger and ordinal stream across all three acts', () => {
  const outer = surroundingRealm(), records: RecordRow[] = [];
  const create = vi.spyOn(creation, 'createCharacter'), runThree = vi.spyOn(actThree, 'runActThree');
  const report = runCampaign('act3', 'sorceress-cold', record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('act3-complete'); expect(report.failure).toBeNull();
  expect(create).toHaveBeenCalledTimes(1); expect(runActOne).toHaveBeenCalledTimes(1);
  expect(runActTwo).toHaveBeenCalledTimes(1); expect(runThree).toHaveBeenCalledTimes(1);
  expect(records.filter(row => row.kind === 'created')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'hire')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expect(identities.map(row => row.act)).toEqual([1, 2, 2, 2, 3, 3, 3, 3, 3]);
  expect(identities.map(row => row.area)).toEqual([prefixArea, oasis, sanctuary, tomb, ...suffixAreas]);
  expect(report.waves.map(wave => wave.ordinal)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(new Set(identities.map(row => row.heroId))).toEqual(new Set([report.successor?.player.id]));
  expect(new Set(identities.map(row => row.mercId)).size).toBe(1);
  expect(identities[0]?.mercId).toBeTruthy();
  expect(vi.mocked(runActOne).mock.calls[0]?.[0]).toBe(vi.mocked(runActTwo).mock.calls[0]?.[0]);
  expect(runThree.mock.calls[0]?.[0]).toBe(vi.mocked(runActTwo).mock.calls[0]?.[0]);
  expect(report.questActions.slice(0, actTwoActionOrder.length).map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actThree.actThreeActionOrder);
  expectEconomy(report, [...prefixXp, 8000, 18000]);
  expect(report.questAudit).toMatchObject({ successfulClaims: 7, reads: 1, explicitSkillPoints: 2,
    explicitStatPoints: 0, councilProofs: 1, guardianCompletions: 1 });
  const settlements = report.questSettlements.filter(row => row.act === 3);
  expect(settlements).toHaveLength(2);
  expect(settlements[0]).toMatchObject({ area: travincal, ordinal: 7, index: 0,
    actionIndex: actTwoActionOrder.length + 5, nativeReturned: true, winner: 'player', heroLife: 1,
    advance: 'victory', before: { receipts: {} }, after: { receipts: { [council]: true } } });
  expect(settlements[1]).toMatchObject({ area: durance, ordinal: 8, index: 0,
    actionIndex: actTwoActionOrder.length + 10, nativeReturned: true,
    before: { progress: { [guardian]: { status: 'inProgress', objectives: { 'obj-kill-mephisto': false } } } },
    after: { progress: { [guardian]: { status: 'completed', objectives: { 'obj-kill-mephisto': true } } } } });
  expect(report.successor?.inventory.questItems[soulstone]).toEqual({ itemId: 'items/soulstone_mephisto', state: 'owned' });
  expectRestored(outer);
});

it.each(['access-only', 'missing-claim-entry'] as const)('rejects an incomplete %s Act II prefix before Act III Starts', fault => {
  vi.mocked(runActTwo).mockImplementation((profile, record, enter, actions) => {
    if (fault === 'access-only') useMapStore.getState().markCleared(tomb);
    else { actualActTwo(profile, record, enter, actions); actions.entries.pop(); }
  });
  const outer = surroundingRealm(), runThree = vi.spyOn(actThree, 'runActThree');
  const report = runCampaign('act3', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(runThree).not.toHaveBeenCalled(); expect(identities.some(row => row.act === 3)).toBe(false);
  expect(report.successor?.map.questProgress[khalim]).toBeUndefined();
  expect(report.successor?.map.questProgress[guardian]).toBeUndefined();
  expect(report.questActions.some(row => row.id.startsWith('quests/act3-'))).toBe(false);
  expectRestored(outer);
});

it.each([
  ['act1', 'nonwin'], ['act1', 'budget'], ['act2', 'nonwin'], ['act2', 'budget']
] as const)('never starts Act III after a constructed %s %s stop', (stage, status) => {
  const stop = () => { throw new CampaignStop(status, `Constructed ${stage} ${status}`); };
  if (stage === 'act1') vi.mocked(runActOne).mockImplementation(stop);
  else vi.mocked(runActTwo).mockImplementation(stop);
  const outer = surroundingRealm(), runThree = vi.spyOn(actThree, 'runActThree');
  const report = runCampaign('act3', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe(status); expect(runThree).not.toHaveBeenCalled();
  expect(report.successor?.map.questProgress[khalim]).toBeUndefined();
  expect(report.questActions).toEqual([]); expect(identities.some(row => row.act === 3)).toBe(false);
  expectRestored(outer);
});

it.each([
  [marsh, 'draw'], [jungle, 'defeat'], [bazaar, 'defeat'], [travincal, 'defeat'], [durance, 'defeat']
] as const)('halts at the first fake suffix nonwin in %s without later actions', (area, outcome) => {
  nonwin = { area, outcome };
  const outer = surroundingRealm(), stopIndex = suffixAreas.indexOf(area);
  const report = runCampaign('act3', 'sorceress-cold', () => undefined);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed'); expect(report.gameplayStatus).toBe('nonwin');
  expect(identities.filter(row => row.act === 3).map(row => row.area)).toEqual(suffixAreas.slice(0, stopIndex + 1));
  expect(report.waves.at(-1)).toMatchObject({ area, outcome });
  expect(report.successor?.map.clearedSubAreas).not.toContain(area);
  const expectedActions = area === durance ? 10 : 2 + stopIndex;
  expect(suffixEntries(report).map(row => [row.action, row.id])).toEqual(actThree.actThreeActionOrder.slice(0, expectedActions));
  expectEconomy(report, area === durance ? [...prefixXp, 8000] : prefixXp);
  expect(report.successor?.inventory.questItems[soulstone]).toBeUndefined();
  expect(report.successor?.map.questProgress[guardian]?.rewardClaimed).not.toBe(true);
  expectRestored(outer);
});

it.each(['act2-boundary', 'after-orb'] as const)('retains the shared execution budget at %s', stop => {
  if (stop === 'act2-boundary') vi.mocked(runActTwo).mockImplementation((...args) => {
    actualActTwo(...args); wallTime = 600_001;
  });
  const outer = surroundingRealm();
  const report = runCampaign('act3', 'sorceress-cold', record => {
    if (stop === 'after-orb' && record.kind === 'quest-action' && record.action === 'execute' && record.id === orb)
      wallTime = 600_001;
  });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed'); expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign admission/time budget reached'); expect(report.wallMs).toBe(600_001);
  expect(identities.filter(row => row.act === 3).map(row => row.area))
    .toEqual(stop === 'act2-boundary' ? [] : suffixAreas.slice(0, 4));
  expect(suffixEntries(report)).toHaveLength(stop === 'act2-boundary' ? 2 : 10);
  expectEconomy(report, stop === 'act2-boundary' ? prefixXp : [...prefixXp, 8000]);
  if (stop === 'after-orb') {
    expect(report.successor?.inventory.questItems[will]?.state).toBe('consumed');
    expect(report.successor?.map.questReceipts).toEqual({ [council]: true, [orb]: true });
  }
  expect(report.successor?.inventory.questItems[soulstone]).toBeUndefined(); expectRestored(outer);
});

it.each([
  ['playback-council', false], ['observer-council', false], ['assertion-council', false],
  ['logger-council', false], ['orb', false], ['guardian', false],
  ['playback-council', true], ['observer-council', true], ['assertion-council', true],
  ['logger-council', true], ['orb', true], ['guardian', true]
] as const)('retains graph/income after %s failure (checkpoint failure=%s)', (trigger, failCheckpoint) => {
  failurePoint = trigger;
  const outer = surroundingRealm(), records: RecordRow[] = [];
  let checkpointAttempts = 0;
  const report = runCampaign('act3', 'sorceress-cold', record => {
    records.push(record);
    if (record.kind === 'stopped-native-checkpoint') {
      checkpointAttempts++; if (failCheckpoint) throw new Error('Constructed Act III checkpoint recorder failure');
    }
    const atCouncilLogger = trigger === 'logger-council' && record.kind === 'settled-wave' &&
      useMapStore.getState().currentSubAreaId === 'a3-travincal';
    const atOrb = trigger === 'orb' && record.kind === 'quest-action' && record.action === 'execute' && record.id === orb;
    const atGuardian = trigger === 'guardian' && record.kind === 'quest-action' && record.action === 'claim' && record.id === guardian;
    if (atCouncilLogger || atOrb || atGuardian) throw new Error(`Constructed ${trigger} recorder failure`);
  });
  expect(report.technicalStatus).toBe('failed'); expect(report.gameplayStatus).toBe('incomplete');
  expect(report.failure).toContain(`Constructed ${trigger}`);
  expect(checkpointAttempts).toBe(1);
  if (failCheckpoint) expect(report.failure).toContain('Constructed Act III checkpoint recorder failure');
  else expect(report.failure).not.toContain('Checkpoint:');
  const atClaim = trigger === 'guardian', afterOrb = trigger === 'orb' || atClaim;
  expect(identities.filter(row => row.act === 3).map(row => row.area)).toEqual(suffixAreas.slice(0, atClaim ? 5 : 4));
  expect(suffixEntries(report).map(row => [row.action, row.id]))
    .toEqual(actThree.actThreeActionOrder.slice(0, atClaim ? 11 : afterOrb ? 10 : 5));
  expectEconomy(report, atClaim ? [...prefixXp, 8000, 18000] : afterOrb ? [...prefixXp, 8000] : prefixXp,
    trigger === 'observer-council' || trigger === 'playback-council' ? 1 : 0);
  if (trigger === 'observer-council' || trigger === 'playback-council') expect(report.unobservedWaves).toEqual([
    { phase: 'route', area: travincal, ordinal: 7, index: 0,
      logicalMs: trigger === 'playback-council' ? null : 1, xp: 1, items: 0 }
  ]);
  if (trigger === 'playback-council') expect(report.successor?.inventory.materials['materials/scrap'] ?? 0)
    .toBe(report.questRewards.reduce(
      (total, delta) => total + (delta.materials['materials/scrap'] ?? 0), 0
    ) + 3);
  const settlements = report.questSettlements.filter(row => row.act === 3);
  expect(settlements).toHaveLength(atClaim ? 2 : 1);
  expect(settlements[0]).toMatchObject({ area: travincal, ordinal: 7,
    actionIndex: actTwoActionOrder.length + 5, nativeReturned: trigger !== 'playback-council',
    after: { receipts: { [council]: true } } });
  if (trigger === 'playback-council') expect(settlements[0]).toMatchObject({ winner: null, heroLife: null, advance: null });
  else expect(settlements[0]).toMatchObject({ winner: 'player', heroLife: 1, advance: 'victory' });
  expect(report.questAudit).toMatchObject({ successfulClaims: atClaim ? 7 : afterOrb ? 6 : 5,
    councilProofs: 1, guardianCompletions: atClaim ? 1 : 0,
    settlementExceptions: trigger === 'playback-council' ? 1 : 0 });
  expect(report.successor?.map.questReceipts).toEqual(afterOrb ? { [council]: true, [orb]: true } : { [council]: true });
  expect(report.successor?.inventory.questItems[will]?.state).toBe(afterOrb ? 'consumed' : undefined);
  expect(report.successor?.inventory.questItems[soulstone]?.state).toBe(atClaim ? 'owned' : undefined);
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expectRestored(outer);
});

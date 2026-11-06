/** Constructed guard wiring only: fake waves provide no native earned-combat proof. */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import * as creation from '@/features/character/createCharacter';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, observeStore, resetEarnedStores } from '../sim/production/earned-state';
import { playEarnedWave, type EarnedWave } from '../sim/production/earned-playback';
import { unrecordedCampaignWave } from './unrecorded-wave-fixture';
import { observeP15Wave, type P15Wave } from '../sim/contracts/p15-wave-observation';
import { claimCampaignQuest } from './actions';
import { startCampaignAdmission } from './admission';
import { assertCampaignSettlement } from './settlement';
import { runCampaign } from './native-runner';
import { runActOne } from './route';
import * as actTwoRoute from './act2-route';
import * as actThreeRoute from './act3-route';
import { runActFour } from './act4-route';

vi.mock('./route', async original => ({ ...await original<typeof import('./route')>(), runActOne: vi.fn() }));
vi.mock('./act2-route', async original => ({ ...await original<typeof import('./act2-route')>(), runActTwo: vi.fn() }));
vi.mock('./act3-route', async original => ({ ...await original<typeof import('./act3-route')>(), runActThree: vi.fn() }));
vi.mock('./act4-route', async original => ({ ...await original<typeof import('./act4-route')>(), runActFour: vi.fn() }));
vi.mock('./admission', () => ({ startCampaignAdmission: vi.fn() }));
vi.mock('../sim/production/earned-playback', async original => ({
  ...await original<typeof import('../sim/production/earned-playback')>(), playEarnedWave: vi.fn()
}));
vi.mock('../sim/contracts/p15-wave-observation', async original => ({
  ...await original<typeof import('../sim/contracts/p15-wave-observation')>(), observeP15Wave: vi.fn()
}));
vi.mock('./settlement', () => ({ assertCampaignSettlement: vi.fn() }));

const sisters = 'quests/act1-sisters-to-the-slaughter';
const prefixArea = 'areas/act1-blood-moor';
const suffixAreas = ['areas/act2-far-oasis', 'areas/act2-arcane-sanctuary', 'areas/act2-tomb-of-tal-rasha'];
const actThreeAreas = ['areas/act3-great-marsh', 'areas/act3-flayer-jungle', 'areas/act3-kurast-bazaar',
  'areas/act3-travincal', 'areas/act3-durance-of-hate'];
const actFourAreas = ['areas/act4-plains-of-despair', 'areas/act4-river-of-flame', 'areas/act4-chaos-sanctuary'];
const { runActTwo } = actTwoRoute, { runActThree } = actThreeRoute;
let restores: (() => void)[];
let pity: number;
let wallTime: number;
let logicalMsAt: (ordinal: number) => number;
let nativeActTwo: typeof import('./act2-route');
let nativeActThree: typeof import('./act3-route');

beforeEach(async () => {
  nativeActTwo = await vi.importActual<typeof import('./act2-route')>('./act2-route');
  nativeActThree = await vi.importActual<typeof import('./act3-route')>('./act3-route');
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  vi.mocked(runActOne).mockReset(); vi.mocked(runActTwo).mockReset(); vi.mocked(runActThree).mockReset();
  vi.mocked(runActFour).mockReset();
  vi.mocked(startCampaignAdmission).mockReset(); vi.mocked(playEarnedWave).mockReset();
  vi.mocked(observeP15Wave).mockReset(); vi.mocked(assertCampaignSettlement).mockReset();
  wallTime = 0; logicalMsAt = () => 1;
  vi.spyOn(performance, 'now').mockImplementation(() => wallTime);
  let ordinal = 0;
  // Dummy handles never start a native run or install a combat recording.
  vi.mocked(startCampaignAdmission).mockImplementation((_act, area) => ({
    location: area.replace(/^areas\/act([1-5])-/, 'a$1-'),
    handle: { runId: 'constructed-budget', runSeed: 0, challengeOrdinal: ordinal++, totalWaves: 1 }
  }));
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const state = observeEarnedState(), combat = observeStore(useCombatStore);
    return unrecordedCampaignWave({
      index, opening: combat, played: combat, beforeAward: state, afterAward: state, afterAdvance: combat,
      advanceResult: 'victory', terminalSimClockMs: logicalMsAt(handle.challengeOrdinal),
      rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} },
      actualDelta: { xp: 0, mercXp: {}, materials: {}, currencies: {},
        addedItems: [], removedItemIds: [], addedClears: [] }
    });
  });
  vi.mocked(observeP15Wave).mockImplementation(wave => {
    const metrics: P15Wave['metrics'] = {
      engineWinner: 'player', outcome: 'victory', logicalMs: wave.terminalSimClockMs,
      victoryOnlyTtkMs: wave.terminalSimClockMs, heroDied: false, heroLife: 1, heroMana: 1,
      heroEntryLife: 1, heroEntryMana: 1, minimumObservedMana: 1, zeroManaObserved: false,
      livingEnemies: [], directDamageBySource: {}, periodicDamageByTarget: {},
      periodicProvenance: { eventCount: 0, missingEventCount: 0, hpMsBySource: {}, hpMsByDamageType: {} }
    };
    // The runner consumes only metrics. This fake projection deliberately carries no native outcome.
    return { metrics } as P15Wave;
  });
  // Native settlement is outside this guard-only fixture and is tested separately.
  vi.mocked(assertCampaignSettlement).mockImplementation(() => undefined);
});

afterEach(() => { vi.restoreAllMocks(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

it('refuses recorded engine input from a constructed guard wave', () => {
  const wave = playEarnedWave({ runId: 'constructed-budget', runSeed: 0,
    challengeOrdinal: 0, totalWaves: 1 }, 0);
  expect(() => wave.engineInput).toThrow('Constructed campaign wave has no recorded engine input');
  expect(Object.hasOwn({ ...wave }, 'engineInput')).toBe(false);
});

function realm() {
  return { ...observeEarnedState(), combat: observeStore(useCombatStore),
    hydration: observeStore(useHydrationStore) };
}

it('retains the settled farm cost and admission history at the first boss boundary', () => {
  logicalMsAt = () => 4321;
  const admit = vi.mocked(startCampaignAdmission).getMockImplementation();
  if (!admit) throw new Error('Missing constructed admission fixture');
  vi.mocked(startCampaignAdmission).mockImplementation((...args) => {
    const result = admit(...args), map = useMapStore.getState();
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals,
      normal: result.handle.challengeOrdinal + 1 } });
    return result;
  });
  vi.mocked(runActOne).mockImplementation((_profile, _record, enter) => {
    enter(prefixArea, 'farm');
    useMapStore.getState().updateQuestProgress(sisters, { status: 'inProgress', objectives: {} });
    enter('areas/act1-catacombs', 'route');
  });
  const report = runCampaign('act1', 'sorceress-cold-intended-v1', row => {
    if (row.kind === 'campaign-first-boss-entry') throw new Error('Retained constructed boundary');
  });
  expect(report.failure).toContain('Retained constructed boundary');
  expect(report.admissions).toBe(1);
  expect(report.firstBossEntries).toMatchObject([{ ordinal: 1, disposition: 'candidate',
    costs: { combatMs: 4321, farmMs: 4321, routeMs: 0, admissions: 1, playedWaves: 1, complete: true } }]);
  expect(report.admissionHistory).toEqual([{ ordinal: 0, area: prefixArea, phase: 'farm', totalWaves: 1 }]);
  expect(vi.mocked(startCampaignAdmission)).toHaveBeenCalledTimes(1);
});

it('accounts for native capacity recovery before admitting the next campaign area', () => {
  // Constructed initial inventory; the salvage transaction and economy audit are native.
  const create = creation.createCharacter;
  vi.spyOn(creation, 'createCharacter').mockImplementation((...args) => {
    const result = create(...args);
    useInventoryStore.setState({ backpack: Array.from({ length: 101 }, (_unused, index) => ({
      id: `capacity-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
      level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0
    })) });
    return result;
  });
  const admit = vi.mocked(startCampaignAdmission).getMockImplementation();
  if (!admit) throw new Error('Missing constructed admission fixture');
  vi.mocked(startCampaignAdmission).mockImplementation((...args) => {
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useInventoryStore.getState().materials['materials/scrap']).toBe(101);
    return admit(...args);
  });
  const records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('intro', 'sorceress-cold', row => { records.push(row); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.admissions).toBe(1);
  expect(report.economyAudit).toEqual({ xp: 0, addedItems: 0, removedItems: 101 });
  expect(report.successor?.inventory.backpack).toEqual([]);
  expect(records.filter(row => row.kind === 'campaign-inventory-sink')).toHaveLength(1);
  expect(report.questRewards).toEqual([]);
});

it('preserves protected overflow and continues combat with existing gear', () => {
  const create = creation.createCharacter;
  vi.spyOn(creation, 'createCharacter').mockImplementation((...args) => {
    const result = create(...args);
    useInventoryStore.setState({
      backpack: Array.from({ length: 101 }, (_unused, index) => ({
        id: `protected-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'rare',
        level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0,
        affixes: [{ id: 'affix.armor.defense.flat', tier: 1, rolledValue: 3 }]
      })),
      stash: Array.from({ length: 500 }, (_unused, index) => ({
        id: `stash-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
        level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0
      }))
    });
    return result;
  });
  const records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('intro', 'sorceress-cold', row => { records.push(row); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.admissions).toBe(1);
  expect(report.economyAudit).toEqual({ xp: 0, addedItems: 0 });
  expect(report.successor?.inventory.backpack).toHaveLength(101);
  expect(report.successor?.inventory.stash).toHaveLength(500);
  expect(records.some(row => row.kind === 'campaign-capacity-boundary' &&
    row.capacity === 'protected-capacity-blocked')).toBe(true);
  expect(records.filter(row => row.kind === 'campaign-inventory-sink')).toEqual([]);
});

function surroundingRealm() {
  vi.spyOn(Date, 'now').mockReturnValue(1793304123456);
  useHydrationStore.getState().setStatus('ready');
  expect(creation.createCharacter('Budget realm', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(750);
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-cold-plains');
  useMapStore.getState().markCleared('areas/act1-blood-moor');
  useMetaStore.getState().setIdleTarget('a1-cold-plains'); setIdleEliteMisses(23);
  useHydrationStore.getState().setStatus('loading');
  return { state: realm(), now: Date.now, value: Date.now(), pity: getIdleEliteMisses() };
}

function constructedPrefix(admissions: number) {
  vi.mocked(runActOne).mockImplementation((_profile, record, enter, reward) => {
    for (let index = 0; index < admissions; index++) enter(prefixArea, 'route');
    // Constructed clear/objective evidence admits the suffix; only the Claim below is native.
    useMapStore.getState().markCleared('areas/act1-catacombs');
    useMapStore.getState().updateQuestProgress(sisters,
      { status: 'completed', objectives: { 'obj-kill-andariel': true } });
    claimCampaignQuest(sisters, record, reward);
  });
}

/** Native quest actions use disclosed constructed encounter prerequisites, never combat proof. */
function constructedActThreePrefix(actOneAdmissions: number) {
  constructedPrefix(actOneAdmissions);
  vi.mocked(runActTwo).mockImplementation((profile, record, enter, actions) => {
    nativeActTwo.runActTwo(profile, record, (area, phase) => {
      enter(area, phase);
      const map = useMapStore.getState(); map.setCurrentLocation(2, area);
      if (area === suffixAreas[0]) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
        archetypeIds: ['monsters/act2.radament'] });
      else if (area === suffixAreas[1]) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
        archetypeIds: ['monsters/act2.the-summoner'] });
      else if (area === suffixAreas[2]) map.recordBossKill({ actId: 'acts/act2', areaId: area,
        bossArchetypeId: 'monsters/act2.duriel' });
      else throw new Error(`Unexpected constructed Act II budget area ${area}`);
      useMapStore.getState().markCleared(area);
    }, actions);
  });
}

/** Actual prefix routes/actions; only the declared encounter effects and wave outcomes are fake. */
function constructedActFourBudgetPrefix(actOneAdmissions: number) {
  constructedActThreePrefix(actOneAdmissions);
  vi.mocked(runActThree).mockImplementation(nativeActThree.runActThree);
  const admitFake = vi.mocked(startCampaignAdmission).getMockImplementation();
  const playFake = vi.mocked(playEarnedWave).getMockImplementation();
  if (!admitFake || !playFake) throw new Error('Missing constructed Act IV budget fixtures');
  const admitted = new Map<number, { act: number; area: string }>();
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const next = admitFake(act, area); admitted.set(next.handle.challengeOrdinal, { act, area });
    useMapStore.getState().setCurrentLocation(act, next.location); return next;
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => {
    const next = playFake(handle, index), admission = admitted.get(handle.challengeOrdinal);
    if (!admission) throw new Error('Missing constructed budget admission');
    if (admission.act === 3) {
      const map = useMapStore.getState();
      if (admission.area.endsWith('travincal')) useMapStore.setState({ questReceipts: { ...map.questReceipts,
        'quests/act3-khalims-will#action:council-victory': true } });
      if (admission.area.endsWith('durance-of-hate')) map.updateQuestProgress('quests/act3-guardian', {
        status: 'completed', objectives: { 'obj-kill-mephisto': true } });
      useMapStore.getState().markCleared(admission.area);
    }
    const afterAward = observeEarnedState(), player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing constructed budget hero');
    // Only the graph-retention wrapper reads this dummy unit; there is no native combat recording.
    const hero = { id: player.id, kind: 'hero', side: 'player', life: 1, mana: 1 } as
      EarnedWave['opening']['playerTeam'][number];
    const outcome = { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [] } as
      NonNullable<EarnedWave['played']['outcome']>;
    return { ...next, opening: { ...next.opening, playerTeam: [hero] },
      played: { ...next.played, outcome }, afterAward, actualDelta: earnedDelta(next.beforeAward, afterAward) };
  });
}

function expectBudgetStop(report: ReturnType<typeof runCampaign>, outer: ReturnType<typeof surroundingRealm>,
  records: readonly Readonly<Record<string, unknown>>[], admissions: number, completedActTwo = false,
  completedActThree = false) {
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign admission/time budget reached');
  expect(report.admissions).toBe(admissions); expect(report.stagedWaves).toBe(admissions);
  expect(report.fledWaves).toBe(0); expect(report.waves).toHaveLength(admissions);
  expect(startCampaignAdmission).toHaveBeenCalledTimes(admissions);
  expect(playEarnedWave).toHaveBeenCalledTimes(admissions);
  expect(observeP15Wave).toHaveBeenCalledTimes(admissions);
  expect(assertCampaignSettlement).toHaveBeenCalledTimes(admissions);
  expect(report.waves.every(wave => wave.index === 0 && wave.advance === 'victory' && wave.xp === 0 && wave.items === 0)).toBe(true);
  expect(report.totals.earnings.waves).toEqual({ xp: 0, items: 0 });
  const xp = completedActTwo ? [8000, 5000, 4500, 6000, 7000, 12000, ...(completedActThree ? [8000, 18000] : [])] : [8000];
  expect(report.questRewards.map(delta => delta.xp)).toEqual(xp);
  expect(report.economyAudit).toEqual({ xp: xp.reduce((sum, amount) => sum + amount, 0),
    addedItems: completedActTwo ? report.questRewards.reduce((total, delta) => total + delta.addedItems.length, 0) : 1 });
  expect(report.successor?.map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(report.questActions.map(row => [row.action, row.id])).toEqual(completedActTwo ? [
    ...nativeActTwo.actTwoActionOrder, ...(completedActThree ? nativeActThree.actThreeActionOrder : [])] : []);
  expect(report.questActions.every(row => row.result === 'ok')).toBe(true); expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'admission')).toHaveLength(admissions);
  expect(records.filter(row => row.kind === 'fresh-act1-prefix')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
}

it.each([158, 159])('shares the 160-admission cap after %s prefix admissions and stops before admission 161', prefixCount => {
  constructedPrefix(prefixCount);
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActTwo).mockImplementation((_profile, _record, enter) => {
    for (const area of suffixAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 160);
  expect(runActOne).toHaveBeenCalledTimes(1); expect(runActTwo).toHaveBeenCalledTimes(1);
  expect(completed).toBe(160 - prefixCount); expect(attempted).toBe(completed + 1);
  expect(continued).toBe(false);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act))
    .toEqual([...Array<number>(prefixCount).fill(1), ...Array<number>(160 - prefixCount).fill(2)]);
  const ordinals = Array.from({ length: 160 }, (_unused, ordinal) => ordinal);
  expect(report.waves.map(wave => wave.ordinal)).toEqual(ordinals);
  for (const [challengeOrdinal, entry] of records.filter(row => row.kind === 'admission').entries())
    expect(entry.handle).toMatchObject({ challengeOrdinal });
  expect(report.waves[prefixCount]?.ordinal).toBe(prefixCount);
});

it('keeps the original wall-time budget when time expires before the first suffix admission', () => {
  constructedPrefix(1);
  let attempted = 0, continued = false;
  vi.mocked(runActTwo).mockImplementation((_profile, _record, enter) => {
    wallTime = 600_001;
    attempted++; enter(suffixAreas[0] ?? '', 'route');
    continued = true;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 1);
  expect(attempted).toBe(1); expect(continued).toBe(false); expect(report.wallMs).toBe(600_001);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([1]);
});

it.each([
  { label: 'exhausted by the prefix', prefixCount: 2, durations: [18_000_000, 18_000_000], suffixCount: 0 },
  { label: 'crossed by the first suffix wave', prefixCount: 1, durations: [35_999_999, 2], suffixCount: 1 }
])('shares played logical time when the limit is $label', ({ prefixCount, durations, suffixCount }) => {
  constructedPrefix(prefixCount); logicalMsAt = ordinal => durations[ordinal] ?? 1;
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActTwo).mockImplementation((_profile, _record, enter) => {
    for (const area of suffixAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, prefixCount + suffixCount);
  expect(attempted).toBe(suffixCount + 1); expect(completed).toBe(suffixCount); expect(continued).toBe(false);
  expect(report.waves.map(wave => wave.logicalMs)).toEqual(durations);
  expect(report.totals.combatMs).toBe(durations.reduce((total, duration) => total + duration, 0));
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act))
    .toEqual([...Array<number>(prefixCount).fill(1), ...Array<number>(suffixCount).fill(2)]);
});

it('stops between two fake suffix waves after accounting for the first partial wave', () => {
  constructedPrefix(1); logicalMsAt = ordinal => ordinal === 0 ? 35_999_999 : 2;
  const admitFake = vi.mocked(startCampaignAdmission).getMockImplementation();
  const playFake = vi.mocked(playEarnedWave).getMockImplementation();
  if (!admitFake || !playFake) throw new Error('Missing constructed budget fixtures');
  // Both admissions and all combat are fake; only the existing Sisters Claim is native.
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const admitted = admitFake(act, area);
    return { ...admitted, handle: { ...admitted.handle, totalWaves: act === 2 ? 2 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => ({
    ...playFake(handle, index),
    advanceResult: index + 1 < handle.totalWaves ? 'next-wave' : 'victory'
  }));
  let attempted = 0, continued = false;
  vi.mocked(runActTwo).mockImplementation((_profile, _record, enter) => {
    attempted++; enter(suffixAreas[0] ?? '', 'route');
    continued = true;
    attempted++; enter(suffixAreas[1] ?? '', 'route');
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act2', 'sorceress-cold', record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign time budget reached between waves');
  expect(attempted).toBe(1); expect(continued).toBe(false);
  expect(report.admissions).toBe(2); expect(report.stagedWaves).toBe(3); expect(report.fledWaves).toBe(0);
  expect(vi.mocked(startCampaignAdmission).mock.calls).toEqual([[1, prefixArea], [2, suffixAreas[0]]]);
  expect(vi.mocked(playEarnedWave).mock.calls.map(([handle, index]) => [handle.challengeOrdinal, index]))
    .toEqual([[0, 0], [1, 0]]);
  expect(observeP15Wave).toHaveBeenCalledTimes(2); expect(assertCampaignSettlement).toHaveBeenCalledTimes(2);
  expect(report.waves.map(wave => ({ ordinal: wave.ordinal, index: wave.index,
    advance: wave.advance, logicalMs: wave.logicalMs, xp: wave.xp, items: wave.items })))
    .toEqual([
      { ordinal: 0, index: 0, advance: 'victory', logicalMs: 35_999_999, xp: 0, items: 0 },
      { ordinal: 1, index: 0, advance: 'next-wave', logicalMs: 2, xp: 0, items: 0 }
    ]);
  expect(report.totals.combatMs).toBe(36_000_001); expect(report.totals.playedWaves).toBe(2);
  expect(report.totals.completedChallenges).toBe(1);
  expect(report.totals.earnings.waves).toEqual({ xp: 0, items: 0 });
  expect(report.questRewards.map(delta => delta.xp)).toEqual([8000]);
  expect(report.economyAudit).toEqual({ xp: 8000, addedItems: 1 });
  expect(report.successor?.map.questProgress[sisters]?.rewardClaimed).toBe(true);
  expect(report.questActions).toEqual([]); expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'admission')).toHaveLength(2);
  expect(records.filter(row => row.kind === 'staged-wave')).toHaveLength(3);
  expect(records.filter(row => row.kind === 'settled-wave')).toHaveLength(2);
  expect(records.filter(row => row.kind === 'stopped-native-checkpoint')).toHaveLength(1);
  expect(records.map(row => row.kind).slice(-3))
    .toEqual(['settled-wave', 'staged-wave', 'stopped-native-checkpoint']);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

it('rejects unknown requests before creation, routes, or any mocked native boundary', () => {
  const outer = surroundingRealm(), create = vi.spyOn(creation, 'createCharacter'), record = vi.fn();
  expect(() => runCampaign('act6', 'sorceress-cold', record)).toThrow('Unknown campaign phase');
  expect(() => runCampaign('act2', 'constructor', record)).toThrow('Unimplemented campaign profile');
  expect(create).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled();
  expect(runActOne).not.toHaveBeenCalled(); expect(runActTwo).not.toHaveBeenCalled();
  expect(startCampaignAdmission).not.toHaveBeenCalled(); expect(playEarnedWave).not.toHaveBeenCalled();
  expect(observeP15Wave).not.toHaveBeenCalled(); expect(assertCampaignSettlement).not.toHaveBeenCalled();
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

it.each([156, 157])('carries %s Act I plus three Act II admissions into the same Act III cap', actOneAdmissions => {
  constructedActThreePrefix(actOneAdmissions);
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActThree).mockImplementation((_profile, _record, enter) => {
    for (const area of actThreeAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act3', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 160, true);
  expect(runActOne).toHaveBeenCalledTimes(1); expect(runActTwo).toHaveBeenCalledTimes(1);
  expect(runActThree).toHaveBeenCalledTimes(1);
  expect(completed).toBe(160 - actOneAdmissions - 3); expect(attempted).toBe(completed + 1);
  expect(continued).toBe(false); expect(report.totals.unobservedWaves).toBe(0);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([
    ...Array<number>(actOneAdmissions).fill(1), ...Array<number>(3).fill(2),
    ...Array<number>(160 - actOneAdmissions - 3).fill(3)
  ]);
  expect(report.waves.map(row => row.ordinal)).toEqual(Array.from({ length: 160 }, (_unused, ordinal) => ordinal));
  expect(records.filter(row => row.kind === 'fresh-act2-prefix')).toHaveLength(1);
});

it('keeps elapsed wall time from both prior acts before the first Act III admission', () => {
  constructedActThreePrefix(1);
  let attempted = 0, continued = false;
  vi.mocked(runActThree).mockImplementation((_profile, _record, enter) => {
    wallTime = 600_001; attempted++; enter(actThreeAreas[0] ?? '', 'route'); continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act3', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 4, true);
  expect(attempted).toBe(1); expect(continued).toBe(false); expect(report.wallMs).toBe(600_001);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([1, 2, 2, 2]);
});

it.each([
  { label: 'exhausted across Act I and II', durations: [1, 12_000_000, 12_000_000, 11_999_999], suffixCount: 0 },
  { label: 'crossed by the first Act III wave', durations: [1, 1, 1, 35_999_996, 2], suffixCount: 1 }
])('carries all played logical time into Act III when $label', ({ durations, suffixCount }) => {
  constructedActThreePrefix(1); logicalMsAt = ordinal => durations[ordinal] ?? 1;
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActThree).mockImplementation((_profile, _record, enter) => {
    for (const area of actThreeAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act3', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 4 + suffixCount, true);
  expect(attempted).toBe(suffixCount + 1); expect(completed).toBe(suffixCount); expect(continued).toBe(false);
  expect(report.waves.map(row => row.logicalMs)).toEqual(durations);
  expect(report.totals.combatMs).toBe(durations.reduce((total, duration) => total + duration, 0));
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act))
    .toEqual([1, 2, 2, 2, ...Array<number>(suffixCount).fill(3)]);
});

it('retains the first Act III partial wave when the shared time cap stops its next wave', () => {
  constructedActThreePrefix(1); logicalMsAt = ordinal => [1, 1, 1, 35_999_996, 2][ordinal] ?? 1;
  const admitFake = vi.mocked(startCampaignAdmission).getMockImplementation();
  const playFake = vi.mocked(playEarnedWave).getMockImplementation();
  if (!admitFake || !playFake) throw new Error('Missing constructed Act III budget fixtures');
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const admitted = admitFake(act, area);
    return { ...admitted, handle: { ...admitted.handle, totalWaves: act === 3 ? 2 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => ({
    ...playFake(handle, index), advanceResult: index + 1 < handle.totalWaves ? 'next-wave' : 'victory'
  }));
  let attempted = 0, continued = false;
  vi.mocked(runActThree).mockImplementation((_profile, _record, enter) => {
    attempted++; enter(actThreeAreas[0] ?? '', 'route'); continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act3', 'sorceress-cold', record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign time budget reached between waves');
  expect(attempted).toBe(1); expect(continued).toBe(false);
  expect(report.admissions).toBe(5); expect(report.stagedWaves).toBe(6); expect(report.fledWaves).toBe(0);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([1, 2, 2, 2, 3]);
  expect(vi.mocked(playEarnedWave).mock.calls.map(([handle, index]) => [handle.challengeOrdinal, index]))
    .toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]);
  expect(report.waves.at(-1)).toMatchObject({ area: actThreeAreas[0], ordinal: 4, index: 0,
    advance: 'next-wave', logicalMs: 2, xp: 0, items: 0 });
  expect(report.totals).toMatchObject({ combatMs: 36_000_001, playedWaves: 5, completedChallenges: 4,
    unobservedWaves: 0, earnings: { waves: { xp: 0, items: 0 } } });
  expect(report.questRewards.map(delta => delta.xp)).toEqual([8000, 5000, 4500, 6000, 7000, 12000]);
  expect(report.economyAudit).toEqual({ xp: 42500,
    addedItems: report.questRewards.reduce((total, delta) => total + delta.addedItems.length, 0) });
  expect(report.questActions.map(row => [row.action, row.id])).toEqual(nativeActTwo.actTwoActionOrder);
  expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'admission')).toHaveLength(5);
  expect(records.filter(row => row.kind === 'staged-wave')).toHaveLength(6);
  expect(records.filter(row => row.kind === 'settled-wave')).toHaveLength(5);
  expect(records.map(row => row.kind).slice(-3)).toEqual(['settled-wave', 'staged-wave', 'stopped-native-checkpoint']);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

it.each([151, 152])('carries %s Act I plus eight Act II/III admissions into the same Act IV cap', actOneAdmissions => {
  constructedActFourBudgetPrefix(actOneAdmissions);
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActFour).mockImplementation((_profile, _record, enter) => {
    for (const area of actFourAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act4', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 160, true, true);
  expect(completed).toBe(160 - actOneAdmissions - 8); expect(attempted).toBe(completed + 1);
  expect(continued).toBe(false);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([
    ...Array<number>(actOneAdmissions).fill(1), 2, 2, 2, 3, 3, 3, 3, 3,
    ...Array<number>(completed).fill(4)
  ]);
  expect(report.waves.map(row => row.ordinal)).toEqual(Array.from({ length: 160 }, (_unused, ordinal) => ordinal));
  expect(records.filter(row => row.kind === 'fresh-act2-prefix')).toHaveLength(1);
  expect(records.filter(row => row.kind === 'fresh-act3-prefix')).toHaveLength(1);
  expect(report.questActions).toHaveLength(32);
  expect(report.successor?.inventory.questItems['quests/act3-guardian#reward:questItem'])
    .toEqual({ itemId: 'items/soulstone_mephisto', state: 'owned' });
  expect(report.questAudit).not.toBeNull();
});

it('keeps elapsed wall time from all three prior acts before the first Act IV admission', () => {
  constructedActFourBudgetPrefix(1);
  let attempted = 0, continued = false;
  vi.mocked(runActFour).mockImplementation((_profile, _record, enter) => {
    wallTime = 600_001; attempted++; enter(actFourAreas[0] ?? '', 'route'); continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act4', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 9, true, true);
  expect(attempted).toBe(1); expect(continued).toBe(false); expect(report.wallMs).toBe(600_001);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([1, 2, 2, 2, 3, 3, 3, 3, 3]);
});

it.each([
  { label: 'exhausted across Act I, II and III', durations: [...Array<number>(8).fill(1), 35_999_992], suffixCount: 0 },
  { label: 'crossed by the first Act IV wave', durations: [...Array<number>(8).fill(1), 35_999_991, 2], suffixCount: 1 }
])('carries all played logical time into Act IV when $label', ({ durations, suffixCount }) => {
  constructedActFourBudgetPrefix(1); logicalMsAt = ordinal => durations[ordinal] ?? 1;
  let attempted = 0, completed = 0, continued = false;
  vi.mocked(runActFour).mockImplementation((_profile, _record, enter) => {
    for (const area of actFourAreas) { attempted++; enter(area, 'route'); completed++; }
    continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act4', 'sorceress-cold', record => { records.push(record); });
  expectBudgetStop(report, outer, records, 9 + suffixCount, true, true);
  expect(attempted).toBe(suffixCount + 1); expect(completed).toBe(suffixCount); expect(continued).toBe(false);
  expect(report.waves.map(row => row.logicalMs)).toEqual(durations);
  expect(report.totals.combatMs).toBe(durations.reduce((total, duration) => total + duration, 0));
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act))
    .toEqual([1, 2, 2, 2, 3, 3, 3, 3, 3, ...Array<number>(suffixCount).fill(4)]);
});

it('retains the first Act IV partial wave when the original combat cap stops its next wave', () => {
  constructedActFourBudgetPrefix(1);
  logicalMsAt = ordinal => [...Array<number>(8).fill(1), 35_999_991, 2][ordinal] ?? 1;
  const admitFake = vi.mocked(startCampaignAdmission).getMockImplementation();
  const playFake = vi.mocked(playEarnedWave).getMockImplementation();
  if (!admitFake || !playFake) throw new Error('Missing constructed Act IV budget fixtures');
  vi.mocked(startCampaignAdmission).mockImplementation((act, area) => {
    const admitted = admitFake(act, area);
    return { ...admitted, handle: { ...admitted.handle, totalWaves: act === 4 ? 2 : 1 } };
  });
  vi.mocked(playEarnedWave).mockImplementation((handle, index) => ({
    ...playFake(handle, index), advanceResult: index + 1 < handle.totalWaves ? 'next-wave' : 'victory'
  }));
  let attempted = 0, continued = false;
  vi.mocked(runActFour).mockImplementation((_profile, _record, enter) => {
    attempted++; enter(actFourAreas[0] ?? '', 'route'); continued = true;
    return _profile;
  });
  const outer = surroundingRealm(), records: Readonly<Record<string, unknown>>[] = [];
  const report = runCampaign('act4', 'sorceress-cold', record => { records.push(record); });
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(report.gameplayStatus).toBe('budget');
  expect(report.failure).toBe('Campaign time budget reached between waves');
  expect(attempted).toBe(1); expect(continued).toBe(false);
  expect(report.admissions).toBe(10); expect(report.stagedWaves).toBe(11); expect(report.fledWaves).toBe(0);
  expect(vi.mocked(startCampaignAdmission).mock.calls.map(([act]) => act)).toEqual([1, 2, 2, 2, 3, 3, 3, 3, 3, 4]);
  expect(vi.mocked(playEarnedWave).mock.calls.map(([handle, index]) => [handle.challengeOrdinal, index]))
    .toEqual(Array.from({ length: 10 }, (_unused, ordinal) => [ordinal, 0]));
  expect(report.waves.at(-1)).toMatchObject({ area: actFourAreas[0], ordinal: 9, index: 0,
    advance: 'next-wave', logicalMs: 2, xp: 0, items: 0 });
  expect(report.totals).toMatchObject({ combatMs: 36_000_001, playedWaves: 10, completedChallenges: 9,
    unobservedWaves: 0, earnings: { waves: { xp: 0, items: 0 } } });
  expect(report.successor?.timestamp).toBe(1793304000000 + 36_000_001);
  expect(records.filter(row => row.kind === 'admission').map(row => row.startedAt))
    .toEqual([...Array.from({ length: 9 }, (_unused, index) => 1793304000000 + index),
      1793304000000 + 35_999_999]);
  expect(report.questRewards.map(delta => delta.xp)).toEqual([8000, 5000, 4500, 6000, 7000, 12000, 8000, 18000]);
  expect(report.economyAudit).toEqual({ xp: 68500,
    addedItems: report.questRewards.reduce((total, delta) => total + delta.addedItems.length, 0) });
  expect(report.questActions.map(row => [row.action, row.id])).toEqual([
    ...nativeActTwo.actTwoActionOrder, ...nativeActThree.actThreeActionOrder]);
  expect(report.questActions.every(row => row.result === 'ok')).toBe(true);
  expect(report.questAudit).not.toBeNull(); expect(report.exported).not.toBeNull();
  expect(records.filter(row => row.kind === 'admission')).toHaveLength(10);
  expect(records.filter(row => row.kind === 'staged-wave')).toHaveLength(11);
  expect(records.filter(row => row.kind === 'settled-wave')).toHaveLength(10);
  expect(records.map(row => row.kind).slice(-3)).toEqual(['settled-wave', 'staged-wave', 'stopped-native-checkpoint']);
  expect(realm()).toEqual(outer.state);
  expect(Date.now).toBe(outer.now); expect(Date.now()).toBe(outer.value);
  expect(getIdleEliteMisses()).toBe(outer.pity);
});

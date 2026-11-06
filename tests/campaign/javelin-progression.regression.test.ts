/** Supplied XP verifies native allocation/reset legality, not earned campaign viability. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useMapStore } from '@/stores/mapStore';
import { MAX_SIM_MS } from '@/engine/combat/combat';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { growCampaignBuild, equipCampaignGear } from './actions';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import type { Item } from '@/engine/types/items';
import { campaignProfiles } from './profiles';
import { earnedJavelinProfile, javelinTrainingRequest, javelinAcquisitionRequest, prepareEarnedJavelinProfile,
  prepareJavelinCompanion } from './javelin-progression';
import { campaignEconomy, auditCampaignEconomy } from './economy';
import type { CampaignProfile } from './policy';
import { campaignExecution, assertCampaignExecutionProfile } from './execution';
import { prepareJavelinTraining, auditJavelinTraining, prepareJavelinAcquisition,
  auditJavelinAcquisition, type JavelinTrainingCheckpoint } from './javelin-training';
import { CampaignStop } from './route';
import type { CampaignWave } from './policy';
import { campaignTimestampArgument } from './online-clock';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';

const profile: CampaignProfile = { ...campaignProfiles['amazon-javelin-poison2-impale1'],
  progressionPolicy: 'javelin-earned-v1' };
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
const save = () => { const state = snapshotStores(); assert.ok(state); return state; };
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304010000);
  expect(createCharacter('Javelin growth', 'amazon').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('hires unlocked native Holy Freeze at its own level, preserving the original companion and earned gear', () => {
  hireRogue();
  usePlayerStore.getState().gainExperience(xpTotal(24));
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockImplementation(act => act <= 2);
  const before = save();
  prepareJavelinCompanion(() => undefined);
  const after = save(), fielded = useMercStore.getState().getFieldedMerc(); assert.ok(fielded);
  expect(fielded.id).toBe('mercs/act2-holy-freeze');
  expect(fielded.level).toBe(12);
  expect(after.mercs.ownedMercs[0]).toEqual(before.mercs.ownedMercs[0]);
  const previousId = before.mercs.fieldedMercId; assert.ok(previousId);
  expect(after.mercs.mercEquipment[previousId]).toEqual(before.mercs.mercEquipment[previousId]);
  expect(after.player).toEqual(before.player);
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  prepareJavelinCompanion(() => undefined);
  expect(save()).toEqual(after);
});

it('keeps a native companion hire after recording fails and resumes without another hire', () => {
  hireRogue(); usePlayerStore.getState().gainExperience(xpTotal(24));
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
  const before = save();
  expect(() => { prepareJavelinCompanion(row => {
    if (row.kind === 'javelin-act2-companion') throw new Error('Recorder failed');
  }); }).toThrow('Recorder failed');
  expect(save().mercs.ownedMercs).toHaveLength(before.mercs.ownedMercs.length + 1);
  prepareJavelinCompanion(() => undefined);
  expect(save().mercs.ownedMercs).toHaveLength(before.mercs.ownedMercs.length + 1);
  expect(save().player).toEqual(before.player);
});

it('refuses companion preparation without earned Act II access or while combat is active', () => {
  const before = save();
  expect(() => { prepareJavelinCompanion(() => undefined); }).toThrow('access');
  expect(save()).toEqual(before);
  usePlayerStore.getState().gainExperience(xpTotal(24));
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(false);
  const locked = save();
  expect(() => { prepareJavelinCompanion(() => undefined); }).toThrow('access');
  expect(save()).toEqual(locked);
  vi.mocked(useMapStore.getState().isActUnlocked).mockReturnValue(true);
  useCombatStore.setState({ inCombat: true });
  const active = save();
  expect(() => { prepareJavelinCompanion(() => undefined); }).toThrow('idle');
  expect(save()).toEqual(active);
});

for (const level of [24, 28]) {
  it(`uses an owned shield only during the fixed-skill phase at level ${String(level)}`, () => {
    hireRogue();
    usePlayerStore.getState().gainExperience(xpTotal(level));
    growCampaignBuild(profile, () => undefined);
    useMapStore.getState().setCurrentLocation(2, 'a2-arcane-sanctuary');
    for (const slot of ['weapon', 'offhand'] as const) {
      const weapon: Item = { id: `phase-${slot}`, baseId: 'items/base/wp1h-short-sword',
        rarity: 'magic', level: 1, ilvl: 1, identified: true, equipped: false,
        affixes: [{ affixId: 'constructed-phase', values: new Map([['statMods.attack', 100]]) }] };
      useInventoryStore.getState().addItem(weapon);
      expect(useInventoryStore.getState().equipItem(weapon, slot).ok).toBe(true);
    }
    const shield: Item = { id: 'phase-shield', baseId: 'items/base/sh-buckler',
      rarity: 'magic', level: 1, ilvl: 1, identified: true, equipped: false,
      affixes: [{ affixId: 'constructed-phase', values: new Map([['statMods.defense', 300]]) }] };
    useInventoryStore.getState().addItem(shield);
    equipCampaignGear(() => undefined, profile);
    expect(useInventoryStore.getState().equipped.offhand?.id)
      .toBe(level === 24 ? shield.id : 'phase-offhand');
    expect(useInventoryStore.getState().equipped.weapon?.id).toBe('phase-weapon');
  });
}

it('grows through both native resets subject to the available point budget without changing other domains', () => {
  const initial = hero(), resetLevels: number[] = [];
  assert.ok(initial.respecsRemaining);
  for (let level = 1; level <= 46; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    const before = save();
    growCampaignBuild(profile, row => {
      if (row.kind === 'javelin-native-skill-reset') resetLevels.push(level);
    });
    const after = save(), player = hero();
    const skillBudget = Object.values(player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0) + player.skillPoints;
    expect(skillBudget).toBe(level + [12, 24, 36].filter(at => level >= at).length + 1);
    expect(player.coreStats).toEqual({ strength: initial.coreStats.strength,
      dexterity: initial.coreStats.dexterity + 2 * (level - 1),
      vitality: initial.coreStats.vitality + 2 * (level - 1), energy: initial.coreStats.energy + level - 1 });
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(before[key]);
    if (level === 12) {
      expect(player.skillLevels?.['amazon.poison_javelin']).toBe(9);
      expect(player.skillLevels?.['amazon.magic_arrow']).toBeUndefined();
    }
    if (level === 24) expect(player.skillLevels?.['amazon.lightning_strike']).toBe(20);
    if (level === 28) expect(player.skillLevels?.['amazon.impale']).toBe(5);
  }
  expect(resetLevels).toEqual([12, 24]);
  expect(hero().skillLevels).toMatchObject({ 'amazon.lightning_strike': 20, 'amazon.critical_strike': 1, 'amazon.impale': 17,
    'amazon.valkyrie': 1, 'amazon.decoy': 1, 'amazon.dodge': 2 });
  expect(hero().respecsRemaining?.skill).toBe(initial.respecsRemaining.skill - 2);
  const before = save(); growCampaignBuild(profile, () => undefined); expect(save()).toEqual(before);
});

it('retains a committed reset after recorder failure and resumes allocation without consuming another reset', () => {
  growCampaignBuild(profile, () => undefined);
  usePlayerStore.getState().gainExperience(xpTotal(12));
  const allowances = hero().respecsRemaining?.skill; assert.ok(allowances !== undefined);
  expect(() => { growCampaignBuild(profile, row => {
    if (row.kind === 'javelin-native-skill-reset') throw new Error('Recorder failed');
  }); }).toThrow('Recorder failed');
  expect(hero().skillLevels).toEqual({});
  expect(hero().respecsRemaining?.skill).toBe(allowances - 1);
  growCampaignBuild(profile, () => undefined);
  expect(hero().skillLevels?.['amazon.poison_javelin']).toBe(9);
  expect(hero().respecsRemaining?.skill).toBe(allowances - 1);
});

it('refuses an unavailable free reset before allocation, payment or gear changes', () => {
  growCampaignBuild(profile, () => undefined);
  usePlayerStore.getState().gainExperience(xpTotal(12));
  const player = hero();
  assert.ok(player.respecsRemaining);
  usePlayerStore.setState({ player: { ...player, respecsRemaining: { ...player.respecsRemaining, skill: 0 } } });
  const before = save();
  expect(() => { prepareEarnedJavelinProfile(profile, () => undefined); }).toThrow('free skill reset');
  expect(save()).toEqual(before);
});

it('keeps early fallback and pack/boss orders explicit without changing original registered profiles', () => {
  expect(earnedJavelinProfile(profile, 6).weaponPolicy).toBe('preserve-bow-fallback');
  expect(earnedJavelinProfile(profile, 12).weaponPolicy).toBeUndefined();
  expect(earnedJavelinProfile(profile, 24).priority).toEqual(['amazon.lightning_strike']);
  expect(earnedJavelinProfile(profile, 28).priority).toEqual(['amazon.lightning_strike', 'amazon.impale']);
  expect(campaignProfiles['amazon-javelin-poison2-impale1'].priority[0]).toBe('amazon.poison_javelin');
});

it('freezes bounded training only at declared route boundaries', () => {
  expect(javelinTrainingRequest(2, 'areas/act2-far-oasis')).toMatchObject({ act: 1,
    area: 'areas/act1-dark-wood', targetLevel: 20, maxAdmissions: 100, maxCombatMs: 7200000 });
  expect(javelinTrainingRequest(2, 'areas/act2-arcane-sanctuary')).toMatchObject({ targetLevel: 24, maxAdmissions: 160 });
  expect(javelinTrainingRequest(3, 'areas/act3-flayer-jungle')).toMatchObject({ act: 3,
    area: 'areas/act3-great-marsh', targetLevel: 28, maxAdmissions: 120, maxCombatMs: 8000000,
    maxConsecutiveNonwins: 3, maxTotalNonwins: 10 });
  expect(javelinTrainingRequest(3, 'areas/act3-durance-of-hate')).toBeNull();
  expect(javelinTrainingRequest(4, 'areas/act4-plains-of-despair')).toMatchObject({ act: 3,
    area: 'areas/act3-kurast-bazaar', targetLevel: 46, maxAdmissions: 400, maxCombatMs: 12600000 });
  expect(javelinTrainingRequest(5, 'areas/act5-crystalline-passage')).toMatchObject({ targetLevel: 55, maxAdmissions: 600 });
  expect(javelinTrainingRequest(1, 'areas/act1-blood-moor')).toBeNull();
  expect(() => earnedJavelinProfile(profile, 0)).toThrow('level');
});

it('requires explicit Javelin execution and rejects other profiles before creation', () => {
  expect(campaignExecution().mode).toBe('screen');
  const execution = campaignExecution('javelin-earned-v1');
  expect(() => { assertCampaignExecutionProfile(execution, 'act2', 'amazon-javelin-poison2-impale1'); }).not.toThrow();
  expect(() => { assertCampaignExecutionProfile(execution, 'act2', 'amazon-bow'); }).toThrow('Javelin');
});

it('parses explicit CLI clocks and rejects ambiguous or unsafe inputs', () => {
  expect(campaignTimestampArgument(undefined)).toBe(1793304000000);
  expect(campaignTimestampArgument('1793600000000')).toBe(1793600000000);
  expect(campaignTimestampArgument('0')).toBe(0);
  for (const value of ['', ' ', '-1', '+1', '1.0', '1e3', '01', 'Infinity', '9007199254740992'])
    expect(() => campaignTimestampArgument(value)).toThrow('timestamp');
});

it('reserves an entire native area before training and retains a settled budget checkpoint', () => {
  hireRogue();
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
  const request = javelinTrainingRequest(2, 'areas/act2-far-oasis'); assert.ok(request);
  const area = resolveSubArea(request.act, request.area); assert.ok(area);
  const attemptMs = area.waves.length * MAX_SIM_MS;
  const reserve = 6 * MAX_SIM_MS;
  const checkpoints: JavelinTrainingCheckpoint[] = [], waves: CampaignWave[] = [];
  let combatMs = 0;
  expect(() => { prepareJavelinTraining(profile, 2, 'areas/act2-far-oasis', () => undefined,
    (_act, id) => {
      const ordinal = useMapStore.getState().challengeOrdinals.normal;
      useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
      for (let index = 0; index < area.waves.length; index++) waves.push({ phase: 'farm', area: id,
        ordinal, index, outcome: 'victory', advance: index === area.waves.length - 1 ? 'victory' : 'next-wave',
        logicalMs: MAX_SIM_MS, xp: 0, items: 0, heroLife: 1, heroMana: 1 });
      combatMs += attemptMs;
    }, checkpoint => { checkpoints.push(checkpoint); }, () => combatMs); }).toThrow('combat budget');
  expect(checkpoints[0]).toMatchObject({ result: null, failureStatus: 'budget', terminalCombatMs: combatMs });
  expect(combatMs).toBeLessThanOrEqual(request.maxCombatMs);
  expect(combatMs + reserve).toBeGreaterThan(request.maxCombatMs);
  expect(auditJavelinTraining(checkpoints, waves)).toMatchObject({ stages: 1,
    admissions: Math.floor((request.maxCombatMs - reserve) / attemptMs) + 1, combatMs });
  const first = checkpoints[0]; assert.ok(first);
  expect(() => auditJavelinTraining([{ ...first, terminalCombatMs: combatMs + 1 }], waves)).toThrow();
});

it('retains earned points and reconciles fractional training clocks without replaying', () => {
  hireRogue();
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
  const checkpoints: JavelinTrainingCheckpoint[] = [], waves: CampaignWave[] = [];
  let combatMs = 0.1, admissions = 0;
  const enter = (_act: number, area: string) => {
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    const xp = xpTotal(20); usePlayerStore.getState().gainExperience(xp); admissions++; combatMs += 0.2;
    waves.push({ phase: 'farm', area, ordinal, index: 0, outcome: 'victory', advance: 'victory',
      logicalMs: 0.2, xp, items: 0, heroLife: 1, heroMana: 1 });
  };
  prepareJavelinTraining(profile, 2, 'areas/act2-far-oasis', () => undefined,
    enter, checkpoint => { checkpoints.push(checkpoint); }, () => combatMs);
  expect(checkpoints[0]?.result).toMatchObject({ status: 'target-earned', admissions: 1 });
  expect(hero().level).toBe(20);
  expect(hero().skillLevels?.['amazon.poison_javelin']).toBeGreaterThan(1);
  expect(auditJavelinTraining(checkpoints, waves)).toMatchObject({ stages: 1, admissions: 1, xp: xpTotal(20) });
  const first = checkpoints[0]; assert.ok(first);
  expect(() => auditJavelinTraining([{ ...first, terminalCombatMs: combatMs + 1 }], waves))
    .toThrow('Javelin training time mismatch');
  prepareJavelinTraining(profile, 2, 'areas/act2-far-oasis', () => undefined,
    enter, () => undefined, () => combatMs);
  expect(admissions).toBe(1);
});

it('keeps bounded post-Den acquisition separate from later stages and retains farm losses', () => {
  hireRogue(); usePlayerStore.getState().gainExperience(xpTotal(9));
  const map = useMapStore.getState();
  map.markCleared('areas/act1-blood-moor'); map.markCleared('areas/act1-den-of-evil');
  map.updateQuestProgress('quests/act1-den-of-evil', { status: 'completed', rewardClaimed: true });
  expect(javelinAcquisitionRequest()).toEqual({ act: 1, area: 'areas/act1-blood-moor', targetLevel: 12,
    maxAdmissions: 120, maxConsecutiveNonwins: 3, maxTotalNonwins: 10, maxCombatMs: 7200000 });
  const checkpoints: JavelinTrainingCheckpoint[] = [], waves: CampaignWave[] = [];
  let combatMs = 0;
  prepareJavelinAcquisition(profile, () => undefined, (act, area, phase) => {
    expect([act, area, phase]).toEqual([1, 'areas/act1-blood-moor', 'farm']);
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    const failed = ordinal === 0;
    const xp = failed ? 0 : xpTotal(12) - xpTotal(hero().level) - hero().experience;
    if (xp) usePlayerStore.getState().gainExperience(xp);
    combatMs += 100;
    waves.push({ phase, area, ordinal, index: 0, outcome: failed ? 'defeat' : 'victory',
      advance: failed ? 'defeat' : 'victory', logicalMs: 100, xp, items: 0,
      heroLife: failed ? 0 : 1, heroMana: 1 });
    if (failed) throw new CampaignStop('nonwin', 'Constructed acquisition loss',
      { area, phase, ordinal, index: 0, outcome: 'defeat' });
  }, checkpoint => { checkpoints.push(checkpoint); }, () => combatMs);
  expect(checkpoints).toHaveLength(1);
  expect(auditJavelinAcquisition(checkpoints, waves)).toMatchObject({ stages: 1, admissions: 2,
    combatMs: 200, nonwinOrdinals: [0] });
  expect(auditJavelinTraining([], waves)).toMatchObject({ stages: 0, admissions: 0 });
  expect(hero().level).toBe(12);
});

it('refuses post-Den acquisition before the claimed quest without allocating or admitting', () => {
  hireRogue(); usePlayerStore.getState().gainExperience(xpTotal(9));
  const before = save(), checkpoints: JavelinTrainingCheckpoint[] = [];
  const enter = vi.fn();
  expect(() => { prepareJavelinAcquisition(profile, () => undefined, enter,
    checkpoint => { checkpoints.push(checkpoint); }, () => 0); }).toThrow('claimed Den');
  expect(save()).toEqual(before); expect(enter).not.toHaveBeenCalled(); expect(checkpoints).toEqual([]);
});

function hireRogue() {
  const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight'); assert.ok(definition);
  expect(useMercStore.getState().hireMerc(definition).ok).toBe(true);
}


it('prepares at authored Act III gates within the original combined later allowance', () => {
  const bazaar = javelinTrainingRequest(3, 'areas/act3-kurast-bazaar');
  const council = javelinTrainingRequest(3, 'areas/act3-travincal');
  const plains = javelinTrainingRequest(4, 'areas/act4-plains-of-despair');
  expect(bazaar).toMatchObject({ act: 3, area: 'areas/act3-great-marsh', targetLevel: 35,
    maxAdmissions: 200, maxCombatMs: 7200000, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 });
  expect(council).toMatchObject({ act: 3, area: 'areas/act3-flayer-jungle', targetLevel: 40,
    maxAdmissions: 200, maxCombatMs: 9000000, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 });
  assert.ok(bazaar && council && plains);
  expect([bazaar, council, plains].reduce((sum, stage) => sum + stage.maxAdmissions, 0)).toBe(800);
  expect([bazaar, council, plains].reduce((sum, stage) => sum + stage.maxCombatMs, 0)).toBe(28800000);
});

it('requires a cleared Act III farm before mutation and stops as soon as the declared level is earned', () => {
  hireRogue(); usePlayerStore.getState().gainExperience(xpTotal(28));
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockImplementation(act => act <= 3);
  useMapStore.setState({ currentAct: 3, currentSubAreaId: 'a3-flayer-jungle',
    clearedSubAreas: ['areas/act3-flayer-jungle'] });
  const before = save(), checkpoints: JavelinTrainingCheckpoint[] = [];
  const entered: string[] = []; let combatMs = 0;
  const enter = (_act: number, area: string) => {
    entered.push(area);
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals,
      normal: state.challengeOrdinals.normal + 1 } }));
    usePlayerStore.getState().gainExperience(xpTotal(35) - xpTotal(28)); combatMs++;
  };
  expect(() => { prepareJavelinTraining(profile, 3, 'areas/act3-kurast-bazaar', () => undefined,
    enter, row => { checkpoints.push(row); }, () => combatMs); }).toThrow('cleared farm');
  expect(save()).toEqual(before); expect(entered).toEqual([]); expect(checkpoints).toEqual([]);
  useMapStore.getState().markCleared('areas/act3-great-marsh');
  prepareJavelinTraining(profile, 3, 'areas/act3-kurast-bazaar', () => undefined,
    enter, row => { checkpoints.push(row); }, () => combatMs);
  expect(entered).toEqual(['areas/act3-great-marsh']); expect(hero().level).toBe(35);
  expect(checkpoints[0]?.result).toMatchObject({ status: 'target-earned', admissions: 1, nonwins: 0 });
  prepareJavelinTraining(profile, 3, 'areas/act3-kurast-bazaar', () => undefined,
    enter, () => undefined, () => combatMs);
  expect(entered).toEqual(['areas/act3-great-marsh']);
});


it('uses available post-core points on legal paid-body support without a second reset or other-domain changes', () => {
  usePlayerStore.getState().gainExperience(xpTotal(24)); growCampaignBuild(profile, () => undefined);
  usePlayerStore.getState().gainExperience(xpTotal(38) - xpTotal(24));
  expect(usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 28,
    vitality: 28, energy: 14 }, hero())).toBe('ok');
  const before = save(), resets: unknown[] = [];
  growCampaignBuild(profile, row => { if (row.kind === 'javelin-native-skill-reset') resets.push(row); });
  const after = save(), learned = after.player.skillLevels; assert.ok(learned);
  expect(learned).toMatchObject({ 'amazon.lightning_strike': 20, 'amazon.impale': 8,
    'amazon.inner_sight': 1, 'amazon.slow_missiles': 1, 'amazon.decoy': 1,
    'amazon.avoid': 1, 'amazon.evade': 1, 'amazon.valkyrie': 1, 'amazon.dodge': 2 });
  expect(after.player.comboOrder).toEqual(['amazon.valkyrie', 'amazon.decoy', 'amazon.lightning_strike', 'amazon.impale']);
  const spent = Object.values(learned).reduce((sum, rank) => sum + rank, 0) -
    Object.values(before.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0);
  expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
  expect(after.player.respecsRemaining).toEqual(before.player.respecsRemaining); expect(resets).toEqual([]);
  expect(after.player.experience).toBe(before.player.experience);
  expect(after.player.coreStats).toEqual(before.player.coreStats);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(earnedJavelinProfile(profile, 29).priority).toEqual(['amazon.lightning_strike', 'amazon.impale']);
  const unchanged = save(); growCampaignBuild(profile, () => undefined); expect(save()).toEqual(unchanged);
});

it('keeps native gear and points at every entry while avoiding duplicate post-farm diagnostics for entry-owned preparation', () => {
  // Supplied XP/items isolate preparation ordering; this is not earned combat evidence.
  hireRogue(); usePlayerStore.getState().gainExperience(xpTotal(18));
  vi.spyOn(useMapStore.getState(), 'isActUnlocked').mockReturnValue(true);
  const baseline = captureEarnedRestorers();
  const run = (gearPreparedOnEntry: boolean) => {
    for (const restore of baseline) restore();
    const entries: ReturnType<typeof save>[] = [], rows: Readonly<Record<string, unknown>>[] = [];
    const record = (row: Readonly<Record<string, unknown>>) => { rows.push(row); };
    let combatMs = 0;
    prepareJavelinTraining(profile, 2, 'areas/act2-far-oasis', record, (act, area) => {
      useMapStore.getState().setCurrentLocation(act, area.replace(/^areas\/act([1-5])-/, 'a$1-'));
      growCampaignBuild(profile, record); equipCampaignGear(record, profile);
      entries.push(save());
      if (entries.length === 1) useInventoryStore.getState().addItem({ id: 'constructed-farm-upgrade',
        baseId: 'items/base/wp1h-short-sword', rarity: 'magic', level: 1, ilvl: 1,
        identified: true, equipped: false,
        affixes: [{ affixId: 'constructed-upgrade', values: new Map([['statMods.attack', 100]]) }] });
      const current = hero();
      usePlayerStore.getState().gainExperience(xpTotal(current.level + 1) - xpTotal(current.level) - current.experience);
      useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals,
        normal: state.challengeOrdinals.normal + 1 } }));
      combatMs++;
    }, () => undefined, () => combatMs, gearPreparedOnEntry);
    expect(entries).toHaveLength(2);
    const second = entries[1]; assert.ok(second);
    expect(Object.values(second.inventory.equipped).some(item => item?.id === 'constructed-farm-upgrade')).toBe(true);
    expect(hero().level).toBe(20);
    return { entries, after: save(), bytes: Buffer.byteLength(JSON.stringify(rows)) };
  };
  const legacy = run(false), prepared = run(true);
  expect(prepared.entries).toEqual(legacy.entries);
  expect(prepared.after).toEqual(legacy.after);
  expect(prepared.bytes).toBeLessThan(legacy.bytes);
});

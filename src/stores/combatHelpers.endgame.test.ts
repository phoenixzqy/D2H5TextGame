import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as award from '@/engine/loot/award';
import { mergeRewards } from '@/engine/loot/reward-plan';
import { xpForKill } from '@/engine/progression/xp';
import { beginWaveTransition, endWaveTransition } from './waveTransitionGuard';
import { prepareRecordedWaveInstallation } from './recordedWaveReceipt';
import * as combatEngine from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { emptyEndgameState } from '@/engine/endgame/state';
import { endgameDefinition } from '@/data/loaders/endgame';
import { abortSubAreaRun, advanceWaveOrFinish, startEndgameRun, recoverRecordedWavePublication,
  refreshActivePlayerCombatConfig, performCombatScreenTransition, readCombatTransitionRecovery } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { getIdleEliteMisses, setIdleEliteMisses } from './idleElitePity';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, useFormationStore] as const;
function run() {
  const value = combatRunLifecycle.activeRun;
  if (!value) throw new Error('Missing native endgame run');
  return value;
}
function drain() {
  for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function unlocked() {
  const campaign = campaignEvidence();
  useMapStore.setState({ questProgress: campaign.questProgress, questReceipts: campaign.questReceipts,
    questDifficulties: { 'difficulty/nightmare': true }, selectedDifficulty: 'nightmare',
    challengeOrdinals: { normal: 17, nightmare: 23 } });
}
beforeEach(() => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  loadDefaultSkills();
  registerSkill({ id: 'fixture.endgame-finisher', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100_000_000, 100_000_000] }] });
  const player = createMockPlayer('Native dungeon', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, id: 'native-endgame-hero', level: 99, comboOrder: ['fixture.endgame-finisher'] });
  useHydrationStore.getState().setStatus('ready'); setIdleEliteMisses(11);
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun(); resetRegistry(); setIdleEliteMisses(0);
  useHydrationStore.getState().setStatus('idle');
});

describe('native endgame origin and earned settlement authority', () => {
  it('refuses locked and unknown entry without simulation, ordinal or other effects', () => {
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const before = stores.map(store => store.getState());
    expect(() => startEndgameRun('ashen')).toThrow('Endgame locked');
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    unlocked(); const map = useMapStore.getState();
    expect(() => startEndgameRun('unknown')).toThrow('Unknown endgame modifier');
    expect(useMapStore.getState()).toBe(map); expect(engine).not.toHaveBeenCalled();
    expect(inspectRecordedWaves().pending).toBeNull();
  });

  it.each(['ashen', 'glacial'] as const)('settles all four %s waves once with normal loot, cache and no campaign effects', modifier => {
    unlocked(); const before = useMapStore.getState();
    const roll = vi.spyOn(award, 'rollKillRewards');
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const rolls = vi.spyOn(useMapStore.getState(), 'markCleared');
    const boss = vi.spyOn(useMapStore.getState(), 'recordBossKill');
    const kills = vi.spyOn(useMapStore.getState(), 'recordMonsterKills');
    const handle = startEndgameRun(modifier);
    expect(handle).toMatchObject({ runId: endgameDefinition.id, totalWaves: 4, attemptOrdinal: 0 });
    const native = run();
    expect(native.origin).toMatchObject({ kind: 'endgame', modifierId: modifier, attemptOrdinal: 0 });
    expect(Object.getOwnPropertyDescriptor(native, 'origin')).toMatchObject({ writable: false, configurable: false });
    expect(native.mode).toBe('manual'); expect(native.act).toBe(5);
    expect(useMapStore.getState().endgame).toEqual({ ...emptyEndgameState(), attemptOrdinal: 1 });
    for (let wave = 0; wave < 4; wave++) {
      const binding = inspectRecordedWaves().currentPublished?.binding;
      expect(binding?.origin).toBe(native.origin);
      expect(binding?.replayProfileId).toBe('normal');
      expect(binding?.endgameWave?.progress).toBe(native.endgameProgress);
      expect(binding?.councilEncounter).toBeUndefined(); expect(binding?.act5Encounter).toBeUndefined();
      expect(binding?.engineInput.enemyTeam.every(enemy => enemy.level === 90)).toBe(true);
      const inventory = useInventoryStore.getState();
      expect(advanceWaveOrFinish()).toBe('idle'); expect(useInventoryStore.getState()).toBe(inventory);
      drain(); expect(advanceWaveOrFinish()).toBe(wave === 3 ? 'victory' : 'next-wave');
      expect(useMapStore.getState().endgame.clearCounts[modifier]).toBe(wave === 3 ? 1 : 0);
    }
    expect(native.endgameProgress?.status).toBe('completed');
    const gem = modifier === 'ashen' ? 'gems/ruby/flawless' : 'gems/sapphire/flawless';
    const ordinary = roll.mock.results.map(result => {
      if (result.type !== 'return') throw new Error('Unexpected ordinary reward failure');
      return result.value;
    });
    expect(ordinary).toHaveLength(15);
    const expected = mergeRewards(...ordinary, { items: [], runeShards: 0, wishstones: 0, runes: 0,
      gems: 1, materials: { [gem]: 1 } });
    expect(useCombatStore.getState().runRewards).toEqual(expected);
    expect(useInventoryStore.getState().materials).toEqual(expected.materials);
    expect(useInventoryStore.getState().backpack).toEqual(expected.items);
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(expected.runeShards);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(expected.wishstones);
    expect(xp.mock.calls.reduce((sum, [amount]) => sum + amount, 0)).toBe(15 * xpForKill(90));
    expect(useMapStore.getState().questProgress).toBe(before.questProgress);
    expect(useMapStore.getState().questReceipts).toBe(before.questReceipts);
    expect(useMapStore.getState().clearedSubAreas).toBe(before.clearedSubAreas);
    expect(useMapStore.getState().nightmareClearedSubAreas).toBe(before.nightmareClearedSubAreas);
    expect(useMapStore.getState().challengeOrdinals).toBe(before.challengeOrdinals);
    expect(rolls).not.toHaveBeenCalled(); expect(boss).not.toHaveBeenCalled(); expect(kills).not.toHaveBeenCalled();
    expect(getIdleEliteMisses()).toBe(11);
    const inventory = useInventoryStore.getState(), state = useMapStore.getState().endgame;
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useInventoryStore.getState()).toBe(inventory); expect(useMapStore.getState().endgame).toBe(state);
  });

  it('retains original progress and payout identity across replay without another entry', () => {
    unlocked(); startEndgameRun('ashen');
    const original = inspectRecordedWaves().currentPublished, progress = run().endgameProgress;
    const state = useMapStore.getState().endgame;
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const replay = inspectRecordedWaves().currentPublished;
    expect(replay?.binding.endgameWave).toBe(original?.binding.endgameWave);
    expect(replay?.installation?.settlement.identity).toBe(original?.installation?.settlement.identity);
    expect(run().endgameProgress).toBe(progress); expect(useMapStore.getState().endgame).toBe(state);
  });

  it.each(['before', 'after'] as const)('recovers an entry setter throwing %s its write without simulating or incrementing again', when => {
    unlocked(); const oldRun = combatRunLifecycle.activeRun;
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const set = useMapStore.setState, error = new Error(`entry-${when}`);
    const spy = vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      if (when === 'after') set(...args);
      throw error;
    });
    expect(() => startEndgameRun('ashen')).toThrow(error);
    const pending = inspectRecordedWaves().pending;
    expect(pending?.phase).toBe('committedPendingPublication');
    expect(pending?.publicationFailure?.error).toBe(error);
    expect(pending?.installation?.metadataInstalled).toBe(when === 'after');
    if (when === 'before') expect(combatRunLifecycle.activeRun).toBe(oldRun);
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(when === 'after' ? 1 : 0);
    spy.mockRestore();
    if (!pending) throw new Error('Missing entry recovery receipt');
    recoverRecordedWavePublication(pending.receipt);
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
    expect(engine).toHaveBeenCalledTimes(1); expect(run()).toBe(pending.binding.candidateRun);
  });
  it('does not commit entry when native simulation fails', () => {
    unlocked(); const before = stores.map(store => store.getState());
    const error = new Error('native simulation failure');
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw error; });
    expect(() => startEndgameRun('ashen')).toThrow(error);
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(inspectRecordedWaves().pending).toBeNull(); expect(combatRunLifecycle.activeRun).toBeNull();
  });

  it.each(['draw', 'hero dead', 'original alive', 'original missing'] as const)(
    'refuses completion and income for a recorded %s despite generic winner flags', fault => {
      unlocked(); const actual = combatEngine.runBattleRecorded;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
        const recording = actual(input);
        const result = recording.result;
        return { ...recording, result: { ...result,
          winner: fault === 'draw' ? null : 'player',
          playerTeam: fault === 'hero dead' ? result.playerTeam.map(unit => ({ ...unit, life: 0 })) : result.playerTeam,
          enemyTeam: fault === 'original alive' ? result.enemyTeam.map(unit => ({ ...unit, life: 1 }))
            : fault === 'original missing' ? [] : result.enemyTeam } };
      });
      startEndgameRun('ashen'); const native = run(), inventory = useInventoryStore.getState(), player = usePlayerStore.getState();
      drain(); expect(advanceWaveOrFinish()).toBe('defeat');
      expect(native.endgameProgress?.status).toBe('failed');
      expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState()).toBe(player);
      expect(useMapStore.getState().endgame).toEqual({ ...emptyEndgameState(), attemptOrdinal: 1 });
      expect(combatRunLifecycle.activeRun).toBeNull();
      expect(startEndgameRun('ashen')?.attemptOrdinal).toBe(1);
    });

  it('keeps paid wave progress after next-wave staging fails and retries without repeating income', () => {
    unlocked(); startEndgameRun('ashen'); drain(); const native = run();
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('next staging'); });
    expect(advanceWaveOrFinish).toThrow('next staging');
    expect(native.endgameProgress?.nextWaveIndex).toBe(1);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('awaitingNextWave');
    const player = usePlayerStore.getState(), inventory = useInventoryStore.getState(), endgame = useMapStore.getState().endgame;
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(engine).toHaveBeenCalledTimes(2); expect(usePlayerStore.getState()).toBe(player);
    expect(useInventoryStore.getState()).toBe(inventory); expect(useMapStore.getState().endgame).toBe(endgame);
    expect(run().endgameProgress).toBe(native.endgameProgress);
  });

  it('preflights the terminal cache before income and restores a failed completion transaction', () => {
    unlocked(); startEndgameRun('ashen');
    for (let wave = 0; wave < 3; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
    drain(); useInventoryStore.setState({ materials: { 'gems/ruby/flawless': Number.MAX_SAFE_INTEGER } });
    const native = run(), progress = native.endgameProgress;
    const before = stores.map(store => store.getState()), state = useMapStore.getState().endgame;
    expect(advanceWaveOrFinish).toThrow();
    stores.forEach((store, index) => { expect(store.getState()).toEqual(before[index]); });
    expect(native.endgameProgress).toBe(progress); expect(useMapStore.getState().endgame).toBe(state);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
    expect(advanceWaveOrFinish).toThrow('settlementFailed');
  });

  it.each(['before', 'after'] as const)('restores all payout domains if the clear counter setter throws %s writing', when => {
    unlocked(); startEndgameRun('glacial');
    for (let wave = 0; wave < 3; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
    drain(); const native = run(), progress = native.endgameProgress;
    const before = stores.map(store => store.getState()), state = useMapStore.getState().endgame;
    const error = new Error('clear counter setter'), set = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      if (when === 'after') set(...args);
      throw error;
    });
    expect(advanceWaveOrFinish).toThrow(error);
    stores.forEach((store, index) => { expect(store.getState()).toEqual(before[index]); });
    expect(native.endgameProgress).toBe(progress); expect(useMapStore.getState().endgame).toBe(state);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  });

  it.each(['foreign', 'original'] as const)('parks a metadata-complete entry with %s state instead of overwriting it', replacement => {
    unlocked(); const before = useMapStore.getState().endgame;
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('publisher'); });
    expect(() => startEndgameRun('ashen')).toThrow('publisher');
    const pending = inspectRecordedWaves().pending;
    if (!pending) throw new Error('Missing pending entry');
    expect(pending.installation?.metadataInstalled).toBe(true);
    const state = replacement === 'original' ? before : { ...useMapStore.getState().endgame };
    useMapStore.setState({ endgame: state });
    const native = combatRunLifecycle.activeRun, combat = useCombatStore.getState();
    expect(() => { recoverRecordedWavePublication(pending.receipt); }).toThrow('bindingMismatch');
    expect(inspectRecordedWaves().pending?.phase).toBe('conflict');
    expect(useMapStore.getState().endgame).toBe(state); expect(combatRunLifecycle.activeRun).toBe(native);
    expect(useCombatStore.getState()).toBe(combat);
  });

  it('recognizes an exact after-state installed externally before retry and skips the entry setter', () => {
    unlocked(); vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => { throw new Error('before'); });
    expect(() => startEndgameRun('ashen')).toThrow('before'); vi.restoreAllMocks();
    const pending = inspectRecordedWaves().pending, intent = pending?.installation?.intent;
    if (!pending || intent?.kind !== 'newRun' || !intent.endgameEntry) throw new Error('Missing entry');
    useMapStore.setState({ endgame: intent.endgameEntry.stateAfterEntry });
    const setter = vi.spyOn(useMapStore, 'setState');
    recoverRecordedWavePublication(pending.receipt);
    expect(setter).not.toHaveBeenCalled(); expect(inspectRecordedWaves().pending).toBeNull();
  });

  it('checks entry again after selection consumption and before publishing combat', () => {
    unlocked(); const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing hero');
    armIronGolemSelection(player.id, 'unused-native-selection', true);
    const foreign = { ...emptyEndgameState(), attemptOrdinal: 8 };
    const stop = useIronGolemSelectionStore.subscribe(() => { useMapStore.setState({ endgame: foreign }); });
    const publisher = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    try { expect(() => startEndgameRun('ashen')).toThrow('bindingMismatch'); } finally { stop(); }
    expect(publisher).not.toHaveBeenCalled(); expect(useMapStore.getState().endgame).toBe(foreign);
    expect(inspectRecordedWaves().pending?.phase).toBe('conflict');
  });

  it('checks entry during final recognition after combat publisher observers', () => {
    unlocked(); const foreign = { ...emptyEndgameState(), attemptOrdinal: 8 };
    const stop = useCombatStore.subscribe(() => { useMapStore.setState({ endgame: foreign }); });
    try { expect(() => startEndgameRun('ashen')).toThrow('bindingMismatch'); } finally { stop(); }
    expect(useMapStore.getState().endgame).toBe(foreign);
    expect(inspectRecordedWaves().currentPublished).toBeNull();
    expect(inspectRecordedWaves().pending?.phase).toBe('conflict');
  });

  it('rejects foreign state at next-wave publication before settlement can become payable', () => {
    unlocked(); startEndgameRun('ashen'); drain();
    const publish = useCombatStore.getState().publishStagedRecordedBattle;
    const foreign = { ...useMapStore.getState().endgame };
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
      publish(value); useMapStore.setState({ endgame: foreign });
    });
    expect(advanceWaveOrFinish).toThrow('bindingMismatch');
    expect(useMapStore.getState().endgame).toBe(foreign);
    expect(inspectRecordedWaves().pending?.phase).toBe('conflict');
  });

  it('refuses a missing modifier without falling through to ordinary area entry', () => {
    unlocked(); useMapStore.setState({ selectedDifficulty: 'normal', currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor' });
    const before = stores.map(store => store.getState());
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    expect(() => { Reflect.apply(startEndgameRun, undefined, [undefined]); }).toThrow('Unknown endgame modifier');
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(engine).not.toHaveBeenCalled(); expect(combatRunLifecycle.activeRun).toBeNull();
  });

  it.each(['replay', 'retryNextWave'] as const)('refuses to adopt a foreign predecessor state during %s', action => {
    unlocked(); startEndgameRun('ashen');
    if (action === 'retryNextWave') {
      drain(); vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('staging'); });
      expect(advanceWaveOrFinish).toThrow('staging'); vi.restoreAllMocks();
    }
    const foreign = { ...useMapStore.getState().endgame };
    useMapStore.setState({ endgame: foreign });
    const before = stores.map(store => store.getState()), native = run(), progress = native.endgameProgress;
    const holder = inspectRecordedWaves(), engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    expect(() => {
      if (action === 'replay') refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      else advanceWaveOrFinish();
    }).toThrow('bindingMismatch');
    expect(engine).not.toHaveBeenCalled(); expect(inspectRecordedWaves()).toBe(holder);
    expect(native.endgameProgress).toBe(progress);
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(useMapStore.getState().endgame).toBe(foreign);
  });

  it('refuses direct receipt preparation with a foreign replay preimage', () => {
    unlocked(); startEndgameRun('ashen'); const native = run();
    const current = inspectRecordedWaves().currentPublished;
    if (!current) throw new Error('Missing publication');
    const foreign = { ...useMapStore.getState().endgame };
    const lease = beginWaveTransition(true), holder = inspectRecordedWaves();
    try {
      expect(() => prepareRecordedWaveInstallation({ ...current.binding, expectedActiveRun: native,
        endgameState: foreign }, { kind: 'replay' }, lease)).toThrow('bindingMismatch');
      expect(inspectRecordedWaves()).toBe(holder);
    } finally { endWaveTransition(lease); }
  });

  it('reports each entry recovery failure through the screen adapter while retaining the first diagnostic', () => {
    unlocked(); const first = new Error('first entry'), second = new Error('second entry');
    const setter = vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => { throw first; });
    expect(performCombatScreenTransition({ kind: 'endgame', modifierId: 'ashen' })).toBe(false);
    const pending = inspectRecordedWaves().pending;
    if (!pending) throw new Error('Missing pending entry');
    setter.mockImplementationOnce(() => { throw second; });
    expect(performCombatScreenTransition({ kind: 'retry', recovery: readCombatTransitionRecovery() })).toBe(false);
    expect(inspectRecordedWaves().pending?.publicationFailure?.error).toBe(first);
    setter.mockRestore();
    expect(performCombatScreenTransition({ kind: 'retry', recovery: readCombatTransitionRecovery() })).toBe(true);
    expect(inspectRecordedWaves().pending).toBeNull(); expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
  });

  it.each(['before', 'after'] as const)('never repeats Iron payment when entry fails %s its write', when => {
    unlocked(); const player = createMockPlayer('Native Iron', 'necromancer');
    usePlayerStore.getState().setPlayer({ ...player, id: 'native-iron', level: 99,
      coreStats: { strength: 15, dexterity: 25, vitality: 100, energy: 100 },
      comboOrder: ['necromancer.iron_golem', 'fixture.endgame-finisher'],
      skillLevels: { 'necromancer.iron_golem': 6, 'necromancer.blood_golem': 1 } });
    const item = { id: 'native-sacrifice', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false };
    useInventoryStore.setState({ backpack: [item] }); armIronGolemSelection('native-iron', item.id, true);
    const set = useMapStore.setState, error = new Error('entry after item debit');
    const setter = vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      if (when === 'after') set(...args);
      throw error;
    });
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    expect(() => startEndgameRun('ashen')).toThrow(error);
    const pending = inspectRecordedWaves().pending;
    if (!pending) throw new Error('Missing paid entry');
    expect(pending.binding.attestation?.sourceItemId).toBe(item.id);
    expect(useInventoryStore.getState().backpack).toHaveLength(0);
    const paid = useInventoryStore.getState().backpack; setter.mockRestore();
    recoverRecordedWavePublication(pending.receipt);
    expect(engine).toHaveBeenCalledTimes(1); expect(useInventoryStore.getState().backpack).toBe(paid);
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });

});

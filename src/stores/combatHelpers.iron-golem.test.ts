import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
/** Real producer integration with explicit test inventory/configuration and injected faults. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import * as engine from '@/engine/combat/combat';
import * as staging from './recordedWaveStaging';
import { exportCurrentSave, snapshotStores, flushSave } from './persistence';
import { WaveGuardError } from './waveTransitionGuard';
import { buildSummon, getSummon, registerSummon } from '@/engine/skills/summons';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun, refreshActivePlayerCombatConfig,
  advanceWaveOrFinish, recoverRecordedWavePublication, performCombatScreenTransition } from './combatHelpers';
import { inspectRecordedWaves, RecordedWaveReceiptError } from './recordedWaveReceipt';
import { combatRunLifecycle } from './combatRunLifecycle';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { armIronGolemSelection, clearIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';

const IRON = 'necromancer.iron_golem', ALIAS = 'skills-necromancer-iron-golem';
const BLOOD = 'necromancer.blood_golem', FINISH = 'fixture.paid-iron-finisher';
function item(id: string): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
    identified: true, equipped: false };
}
const start = () => startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, challengeOrdinal: 0 });
function hero(mana = 35, fields: Partial<Player> = {}) {
  const coreStats = { strength: 15, dexterity: 25, vitality: 100, energy: 100 };
  const p: Player = { ...createMockPlayer('Paid Iron', 'necromancer'), id: 'paid-iron-hero', level: 24,
    coreStats, derivedStats: { ...deriveStats(coreStats, 24), mana }, comboOrder: [ALIAS, IRON, FINISH],
    skillLevels: { [IRON]: 6, [BLOOD]: 1 }, ...fields };
  usePlayerStore.getState().setPlayer(p);
  return p;
}
function selected() {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing fixture hero');
  return armIronGolemSelection(p.id, 'sacrifice', true);
}
function published() {
  const current = inspectRecordedWaves().currentPublished;
  if (!current) throw new Error('Missing published receipt');
  return current;
}
function drain() {
  while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
}
beforeEach(() => {
  mockSyntheticEntryPools();
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', cooldown: 1, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  hero(); useInventoryStore.setState({ backpack: [item('before'), item('sacrifice'), item('after')] }); selected();
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills();
});

describe('selected-item Iron production commitment', () => {
  it('pays one exact live index after successful preparation at35MP with literal rank6 stats', () => {
    const inventory = useInventoryStore.getState(), gear = useMercStore.getState().mercEquipment;
    const source = inventory.backpack[1];
    expect(start()).not.toBeNull(); const { binding } = published();
    expect(useInventoryStore.getState().backpack).toEqual([inventory.backpack[0], inventory.backpack[2]]);
    expect(useInventoryStore.getState().backpack).toBe(binding.debitIntent?.expectedBackpack);
    expect(inventory.backpack).toHaveLength(3); expect(binding.debitIntent?.item).toBe(source);
    expect(useInventoryStore.getState().stash).toBe(inventory.stash);
    expect(useInventoryStore.getState().equipped).toBe(inventory.equipped);
    expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
    expect(useMercStore.getState().mercEquipment).toBe(gear);
    expect(binding.engineInput.ironGolem).toEqual({ sourceHeroId: 'paid-iron-hero', sourceItemId: 'sacrifice', life: 0, attack: 8, defense: 0 });
    expect(Object.isFrozen(binding.engineInput.ironGolem)).toBe(true);
    const summons = binding.recording.events.filter(e => e.kind === 'summon');
    expect(summons).toHaveLength(1);
    expect(summons[0]?.unit.stats).toMatchObject({ lifeMax: 340, attack: 54, defense: 63 });
    expect(binding.attestation).toMatchObject({ sourceHeroId: 'paid-iron-hero', sourceItemId: 'sacrifice', skillId: IRON, paidMp: 35 });
    expect(binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'paid-iron-hero', mana: 0, simClockMs: 0 })]);
    expect(binding.publication.ironGolemReplayLocked).toBe(true);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });

  it.each(['noSelection', 'missing', 'unidentified', 'poor', 'dead'] as const)('accepts and locks a %s attempt without paying or delaying its instruction', mode => {
    if (mode === 'noSelection') clearIronGolemSelection();
    if (mode === 'missing') armIronGolemSelection('paid-iron-hero', 'absent', true);
    if (mode === 'unidentified') useInventoryStore.setState({ backpack: [item('before'), { ...item('sacrifice'), identified: false }, item('after')] });
    if (mode === 'poor' || mode === 'dead') { const p = hero(mode === 'poor' ? 34 : 35);
      if (mode === 'dead') usePlayerStore.setState({ player: { ...p, derivedStats: { ...p.derivedStats, life: 0 } } }); selected(); }
    const backpack = useInventoryStore.getState().backpack;
    start(); const { binding } = published();
    expect(binding.publication.ironGolemReplayLocked).toBe(true);
    expect(binding.attestation).toBeNull(); expect(binding.debitIntent).toBeNull();
    expect(binding.recording.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(useInventoryStore.getState().backpack).toBe(backpack);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });
});

it.each(['backpack', 'stash', 'equipped', 'merc'] as const)('rejects duplicate ownership in %s without modifying any actual container', where => {
  const inv = useInventoryStore.getState(), source = inv.backpack[1];
  if (!source) throw new Error('Missing item');
  if (where === 'backpack') useInventoryStore.setState({ backpack: [...inv.backpack, source] });
  if (where === 'stash') useInventoryStore.setState({ stash: [source] });
  if (where === 'equipped') useInventoryStore.setState({ equipped: { weapon: source } });
  if (where === 'merc') useMercStore.setState({ mercEquipment: { unfielded: { weapon: source } } });
  const before = useInventoryStore.getState(), gear = useMercStore.getState().mercEquipment;
  start(); expect(published().binding.debitIntent).toBeNull(); expect(published().binding.attestation).toBeNull();
  expect(published().binding.engineInput.ironGolem).toBeUndefined();
  expect(published().binding.publication.ironGolemReplayLocked).toBe(true);
  expect(useInventoryStore.getState()).toBe(before); expect(useMercStore.getState().mercEquipment).toBe(gear);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
});

it.each(['foreignClass', 'belowLevel', 'unlearned', 'noPrerequisite', 'unslotted'] as const)('keeps %s configuration unlocked with no item input', mode => {
  hero(35, mode === 'foreignClass' ? { class: 'sorceress' } : mode === 'belowLevel' ? { level: 23 }
    : mode === 'unlearned' ? { skillLevels: { [BLOOD]: 1 } }
    : mode === 'noPrerequisite' ? { skillLevels: { [IRON]: 6 } } : { comboOrder: [FINISH] }); selected();
  const backpack = useInventoryStore.getState().backpack;
  start(); const { binding } = published(); expect(binding.publication.ironGolemReplayLocked).toBe(false);
  expect(binding.engineInput.ironGolem).toBeUndefined(); expect(binding.attestation).toBeNull();
  expect(useInventoryStore.getState().backpack).toBe(backpack);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
});

it('keeps a full living preload locked without item or mana payment', () => {
  const original = staging.stageRecordedWave;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(input => {
    const owner = input.snapshot.playerTeam[0]; if (!owner) throw new Error('Missing owner');
    const preload = buildSummon(owner, 'iron_golem'); if (!preload) throw new Error('Missing preload');
    return original({ ...input, snapshot: { ...input.snapshot, playerTeam: [...input.snapshot.playerTeam, { ...preload, id: 'fixture-full-preload' }] } });
  });
  const backpack = useInventoryStore.getState().backpack; start();
  expect(published().binding.publication.ironGolemReplayLocked).toBe(true);
  expect(published().binding.attestation).toBeNull(); expect(published().binding.debitIntent).toBeNull();
  expect(useInventoryStore.getState().backpack).toBe(backpack);
  expect(published().binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});

it('locks a qualified attempt made terminal by an earlier startup preparation without paying', () => {
  registerSkill({ id: 'fixture.terminal-startup', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 1, summonOnStart: true, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  usePlayerStore.getState().setComboOrder(['fixture.terminal-startup', IRON, FINISH]);
  const stage = staging.stageRecordedWave;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(input => {
    const enemy = input.snapshot.enemyTeam[0]; if (!enemy) throw new Error('Missing startup target');
    return stage({ ...input, snapshot: { ...input.snapshot, enemyTeam: [{ ...enemy,
      stats: { ...enemy.stats, physDodge: 0, magicDodge: 0 } }] } });
  });
  const backpack = useInventoryStore.getState().backpack; start();
  expect(published().binding.publication.ironGolemReplayLocked).toBe(true);
  expect(published().binding.attestation).toBeNull(); expect(published().binding.debitIntent).toBeNull();
  expect(published().binding.recording.outcome.winner).toBe('player');
  expect(useInventoryStore.getState().backpack).toBe(backpack);
});

it.each(['success', 'poor', 'noSelection'] as const)('replays exact locked %s input/recording without resolving, simulating or paying again', mode => {
  if (mode === 'poor') { hero(34); selected(); }
  if (mode === 'noSelection') clearIronGolemSelection();
  const simulate = vi.spyOn(engine, 'runBattleRecorded'); start(); const before = published();
  usePlayerStore.getState().setComboOrder([FINISH]);
  usePlayerStore.getState().respec({ getGold: () => 100000, spendGold: () => true });
  const rearm = armIronGolemSelection('paid-iron-hero', 'after', true);
  const inventory = useInventoryStore.getState();
  const setter = vi.spyOn(useInventoryStore, 'setState');
  useCombatStore.getState().advanceEvent();
  for (let retry = 0; retry < 2; retry++) {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true }); const current = published();
    expect(current.receipt).not.toBe(before.receipt);
    expect(current.binding.recording).toBe(before.binding.recording);
    expect(current.binding.publication).toBe(before.binding.publication);
    expect(current.binding.engineInput).toBe(before.binding.engineInput);
    expect(current.binding.attestation).toBeNull(); expect(current.binding.debitIntent).toBeNull();
    expect(current.installation?.settlement.identity).toBe(before.installation?.settlement.identity);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(useCombatStore.getState().ironGolemReplayLocked).toBe(true);
  }
  expect(simulate).toHaveBeenCalledTimes(1); expect(setter).not.toHaveBeenCalled();
  expect(useInventoryStore.getState()).toBe(inventory); expect(useIronGolemSelectionStore.getState().selection).toBe(rearm);
});

it('suppresses canonical and alias Iron added to an unlocked replay, then attempts it on the next accepted wave', () => {
  usePlayerStore.getState().setComboOrder([FINISH]); start(); const before = published();
  expect(before.binding.publication.ironGolemReplayLocked).toBe(false);
  usePlayerStore.getState().setComboOrder([ALIAS, IRON, FINISH]); const rearm = selected();
  const backpack = useInventoryStore.getState().backpack;
  refreshActivePlayerCombatConfig({ replayCurrentWave: true }); const replay = published();
  expect(replay.binding.engineInput.playerTeam[0]?.skillOrder).toEqual([FINISH]);
  expect(replay.binding.engineInput.ironGolem).toBeUndefined(); expect(replay.binding.attestation).toBeNull();
  expect(replay.binding.publication.ironGolemReplayLocked).toBe(false);
  expect(replay.installation?.settlement.identity).toBe(before.installation?.settlement.identity);
  expect(useIronGolemSelectionStore.getState().selection).toBe(rearm); expect(useInventoryStore.getState().backpack).toBe(backpack);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(published().binding.attestation?.sourceItemId).toBe('sacrifice');
  // Ordinary first-wave rewards coexist with the original inventory fixtures.
  expect(useInventoryStore.getState().backpack.filter(entry => ['before', 'sacrifice', 'after'].includes(entry.id))
    .map(entry => entry.id)).toEqual(['before', 'after']);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
});

function thrown(action: () => unknown) {
  let caught: unknown, didThrow = false;
  try { action(); } catch (error) { caught = error; didThrow = true; }
  expect(didThrow).toBe(true); return caught;
}
it.each([undefined, null, NaN, { error: 'debit' }].flatMap(error =>
  (['before', 'after'] as const).map(when => ({ when, error }))))('observes actual live ownership after debit throws $when write ($error)', ({ when, error }) => {
  const selection = useIronGolemSelectionStore.getState().selection, inventory = useInventoryStore.getState();
  const original = useInventoryStore.setState, simulate = vi.spyOn(engine, 'runBattleRecorded');
  const setter = vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(value => {
    if (when === 'after') original(value);
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- Assert arbitrary setter failure identity, including undefined.
    throw error;
  });
  const caught = thrown(start);
  if (when === 'before') {
    expect(caught).toBeInstanceOf(Error); expect(caught).toHaveProperty('name', 'UnpaidIronGolemDebitError');
    expect(Object.prototype.hasOwnProperty.call(caught, 'cause')).toBe(true);
    expect(Object.is((caught as Error).cause, error)).toBe(true);
    expect(inspectRecordedWaves().pending).toBeNull(); expect(inspectRecordedWaves().currentPublished).toBeNull();
    expect(useInventoryStore.getState()).toBe(inventory); expect(combatRunLifecycle.activeRun).toBeNull();
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    start(); expect(simulate).toHaveBeenCalledTimes(2); expect(setter).toHaveBeenCalledTimes(2);
  } else {
    expect(Object.is(caught, error)).toBe(true); const pending = inspectRecordedWaves().pending;
    if (!pending) throw new Error('Missing committed debit receipt');
    expect(pending.phase).toBe('committedPendingPublication'); expect(pending.debitFailure).toHaveProperty('error');
    expect(Object.is(pending.debitFailure?.error, error)).toBe(true);
    expect(useInventoryStore.getState().backpack).toBe(pending.binding.debitIntent?.expectedBackpack);
    expect(combatRunLifecycle.activeRun).toBeNull(); expect(useCombatStore.getState().inCombat).toBe(false);
    recoverRecordedWavePublication(pending.receipt);
    expect(published().receipt).toBe(pending.receipt); expect(published().binding).toBe(pending.binding);
    expect(simulate).toHaveBeenCalledTimes(1); expect(setter).toHaveBeenCalledTimes(1);
  }
  expect(useInventoryStore.getState().backpack.map(it => it.id)).toEqual(['before', 'after']);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
});

it('presents a canceled unpaid debit failure through the screen and retries explicitly', () => {
  const error = undefined, original = useInventoryStore.setState;
  const setter = vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- Original no-write throw is wrapped with an own undefined cause.
    throw error;
  });
  expect(performCombatScreenTransition({ kind: 'start', options: { subAreaId: 'areas/act1-blood-moor', runSeed: 7 } })).toBe(false);
  expect(inspectRecordedWaves().pending).toBeNull(); expect(useIronGolemSelectionStore.getState().selection).not.toBeNull();
  setter.mockImplementation(original); start();
  expect(useInventoryStore.getState().backpack.map(it => it.id)).toEqual(['before', 'after']);
});

it.each(['returned', 'throwing', 'authorityChanged'] as const)('parks a third-reference/changed-authority %s debit without compensation', mode => {
  const error = { error: 'conflicting subscriber' }, original = useInventoryStore.setState;
  let actual: Item[] | undefined;
  vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(value => {
    original(value); const backpack = useInventoryStore.getState().backpack;
    if (mode === 'authorityChanged') useIronGolemSelectionStore.setState({ selection: null });
    else { actual = [...backpack, item('unrelated-write')]; original({ backpack: actual }); }
    if (mode === 'throwing') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Preserve conflict error without compensating unknown writes.
      throw error;
    }
  });
  const caught = thrown(start); if (mode === 'throwing') expect(caught).toBe(error);
  const pending = inspectRecordedWaves().pending; expect(pending?.phase).toBe('conflict');
  if (mode !== 'authorityChanged') expect(useInventoryStore.getState().backpack).toBe(actual);
  else expect(useInventoryStore.getState().backpack).toBe(pending?.binding.debitIntent?.expectedBackpack);
  expect(combatRunLifecycle.activeRun).toBeNull(); expect(useCombatStore.getState().inCombat).toBe(false);
  const retained = useInventoryStore.getState(); abortSubAreaRun(); expect(useInventoryStore.getState()).toBe(retained);
});

it('refuses a silently unchanged setter deterministically and cancels only the unpaid preparation', () => {
  const before = useInventoryStore.getState(), selection = useIronGolemSelectionStore.getState().selection;
  vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => { /* Deliberate successful no-write fault. */ });
  expect(start).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
  expect(useInventoryStore.getState()).toBe(before); expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
  expect(inspectRecordedWaves().pending).toBeNull(); expect(combatRunLifecycle.activeRun).toBeNull();
  start(); expect(useInventoryStore.getState().backpack.map(it => it.id)).toEqual(['before', 'after']);
});

it.each(['sourceHeroId', 'sourceItemId', 'skillId', 'spawnedUnitId', 'paidMp'] as const)('rejects inconsistent staged %s attestation before any inventory setter', field => {
  const simulate = engine.runBattleRecorded;
  vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(input => {
    const actual = simulate(input), proof = actual.result.ironGolemPreparation;
    if (!proof) throw new Error('Missing successful actual preparation');
    const changed = field === 'paidMp' ? { ...proof, paidMp: NaN }
      : field === 'skillId' ? { ...proof, skillId: 'foreign.skill' as typeof IRON } : { ...proof, [field]: 'foreign-identity' };
    return { ...actual, result: { ...actual.result, ironGolemPreparation: changed } };
  });
  const before = useInventoryStore.getState(), selection = useIronGolemSelectionStore.getState().selection;
  const setter = vi.spyOn(useInventoryStore, 'setState');
  expect(start).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
  expect(setter).not.toHaveBeenCalled(); expect(useInventoryStore.getState()).toBe(before);
  expect(useIronGolemSelectionStore.getState().selection).toBe(selection); expect(inspectRecordedWaves().pending).toBeNull();
});

it('still debits a successfully prepared golem killed during the actual simulated wave', () => {
  const factory = getSummon('iron_golem'); if (!factory) throw new Error('Missing Iron factory');
  const stage = staging.stageRecordedWave;
  registerSummon('iron_golem', owner => ({ ...factory(owner),
    statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 10000 }] }));
  vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(input => stage({ ...input,
    snapshot: { ...input.snapshot,
      playerTeam: input.snapshot.playerTeam.map(unit => ({ ...unit, skillOrder: [IRON],
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
      enemyTeam: input.snapshot.enemyTeam.map(unit => ({ ...unit,
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })) } }));
  try {
    start(); const { binding } = published(), spawned = binding.attestation?.spawnedUnitId;
    expect(spawned).toBeDefined();
    expect(binding.recording.events.some(event => event.kind === 'death' && event.target === spawned)).toBe(true);
    expect(binding.recording.outcome.finalPlayerTeam.find(unit => unit.id === spawned)?.life).toBe(0);
    expect(binding.debitIntent?.item.id).toBe('sacrifice');
    expect(useInventoryStore.getState().backpack.map(entry => entry.id)).toEqual(['before', 'after']);
    expect(binding.recording.events.filter(event => event.kind === 'mana' && event.reason === 'summon-refund')).toEqual([]);
  } finally { registerSummon('iron_golem', factory); }
});

it.each(['throw', 'backpack', 'selection', 'hero'] as const)('keeps the item and unaccepted selection on paid staging %s failure', fault => {
  const stage = staging.stageRecordedWave, inventory = useInventoryStore.getState();
  const originalSelection = useIronGolemSelectionStore.getState().selection;
  let actualSelection = originalSelection;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(input => {
    const result = stage(input);
    expect(result.attestation).not.toBeNull();
    if (fault === 'throw') throw new Error('paid staging failed');
    if (fault === 'backpack') useInventoryStore.setState({ backpack: [...inventory.backpack] });
    if (fault === 'selection') {
      actualSelection = Object.freeze({ heroId: 'paid-iron-hero', itemId: 'after' });
      useIronGolemSelectionStore.setState({ selection: actualSelection });
    }
    if (fault === 'hero') {
      const player = usePlayerStore.getState().player;
      if (!player) throw new Error('Missing fixture player');
      usePlayerStore.setState({ player: { ...player, id: 'different-hero' } });
    }
    return result;
  });
  expect(start).toThrow(); expect(inspectRecordedWaves().pending).toBeNull();
  expect(inspectRecordedWaves().currentPublished).toBeNull(); expect(combatRunLifecycle.activeRun).toBeNull();
  expect(useInventoryStore.getState().backpack).toEqual(inventory.backpack);
  expect(useInventoryStore.getState().stash).toBe(inventory.stash);
  expect(useIronGolemSelectionStore.getState().selection).toBe(actualSelection);
});

it.each(['before', 'after'] as const)('recovers publication failure %s write after one successful item payment', when => {
  const original = useCombatStore.getState().publishStagedRecordedBattle, error = new Error('paid publisher');
  const setter = vi.spyOn(useInventoryStore, 'setState'), simulate = vi.spyOn(engine, 'runBattleRecorded');
  vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
    if (when === 'after') original(value); throw error;
  });
  expect(start).toThrow(error);
  const retained = when === 'before' ? inspectRecordedWaves().pending : inspectRecordedWaves().currentPublished;
  if (!retained) throw new Error('Missing paid receipt');
  expect(retained.binding.debitIntent?.item.id).toBe('sacrifice');
  expect(useInventoryStore.getState().backpack.map(entry => entry.id)).toEqual(['before', 'after']);
  if (when === 'before') recoverRecordedWavePublication(retained.receipt);
  expect(published().receipt).toBe(retained.receipt); expect(published().binding).toBe(retained.binding);
  expect(setter).toHaveBeenCalledTimes(1); expect(simulate).toHaveBeenCalledTimes(1);
});

it('uses fresh explicit selections and carried mana on new waves without automatically selecting another item', () => {
  hero(105); selected(); start(); const first = published(); drain();
  armIronGolemSelection('paid-iron-hero', 'after', true);
  expect(advanceWaveOrFinish()).toBe('next-wave'); const second = published();
  expect(second.binding.attestation?.sourceItemId).toBe('after');
  expect(second.binding.engineInput.playerTeam[0]?.mana).toBe(first.binding.recording.outcome.finalPlayerTeam[0]?.mana);
  expect(useInventoryStore.getState().backpack.filter(entry => ['before', 'sacrifice', 'after'].includes(entry.id))
    .map(entry => entry.id)).toEqual(['before']);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull(); drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(published().binding.publication.ironGolemReplayLocked).toBe(true);
  expect(published().binding.attestation).toBeNull(); expect(published().binding.debitIntent).toBeNull();
  expect(useInventoryStore.getState().backpack.filter(entry => ['before', 'sacrifice', 'after'].includes(entry.id))
    .map(entry => entry.id)).toEqual(['before']);
});

it('guards supported ownership, run and save operations throughout synchronous debit notification', async () => {
  const pendingSaves: (Promise<void> | null)[] = [];
  let notifications = 0;
  const stop = useInventoryStore.subscribe(state => {
    if (state.backpack.length !== 2) return;
    notifications++;
    expect(() => { state.discardItem('before'); }).toThrow(new WaveGuardError('itemDebitBusy'));
    expect(() => { useMercStore.getState().reset(); }).toThrow(new WaveGuardError('itemDebitBusy'));
    expect(() => start()).toThrow(new WaveGuardError('waveBusy'));
    expect(() => { abortSubAreaRun(); }).toThrow(new WaveGuardError('waveBusy'));
    expect(() => snapshotStores()).toThrow(new WaveGuardError('waveBusy'));
    expect(() => exportCurrentSave()).toThrow(new WaveGuardError('waveBusy'));
    pendingSaves.push(flushSave());
  });
  try { start(); } finally { stop(); }
  expect(notifications).toBe(1);
  for (const save of pendingSaves) await expect(save).rejects.toThrow(new WaveGuardError('waveBusy'));
  expect(useInventoryStore.getState().backpack.map(entry => entry.id)).toEqual(['before', 'after']);
  expect(published().binding.debitIntent?.item.id).toBe('sacrifice');
});

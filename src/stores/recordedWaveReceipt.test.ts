/** Synthetic receipt protocol fixtures; these do not exercise production item payment. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { synthDefaultPlan } from '@/engine/combat';
import { abortSubAreaRun, clearCombatAfterRestore, createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { clearCombatForHeroReplacement, combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import { useIronGolemSelectionStore, armIronGolemSelection, clearIronGolemSelection } from './ironGolemSelectionStore';
import { importIntoStores } from './persistence';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { captureIronGolemDebit } from './ironGolemDebit';
import { stageRecordedBattle } from './recordedBattlePublication';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  type WaveTransitionLease } from './waveTransitionGuard';
import {
  prepareRecordedWave, inspectRecordedWaves, assertPreparedRecordedWaveBinding,
  cancelPreparedRecordedWave, commitPreparedRecordedWave, recognizeRecordedWavePublication,
  abandonRecordedWaves, type RecordedWaveBinding, type RecordedWaveLive,
  RecordedWaveReceiptError, prepareRecordedWaveInstallation, readRecordedWaveInstallation,
  markRecordedWaveMetadataInstalled, observeRecordedWaveSelection, type RecordedWaveInstallIntent
} from './recordedWaveReceipt';

function requiredFixtureValue<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing required receipt fixture value');
  return value;
}

function fixture(debit = false, expectedActiveRun: ActiveRun | null = null, targetWaveIdx = 0) {
  const hero = expectedActiveRun?.playerUnit ?? playerToCombatUnit({
    ...createMockPlayer('Receipt', 'necromancer'), id: 'receipt-hero' });
  const enemy = createSimpleEnemy(1);
  const plan = synthDefaultPlan({ id: 'receipt-area', lootTable: 'loot/trash-act1', areaLevel: 1 },
    'monsters/act1.fallen', 1, 7);
  const candidateRun: ActiveRun = expectedActiveRun ?? { plan, act: 1, seed: 7, mode: 'manual',
    playerUnit: hero, waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 0 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [enemy] };
  const recording = { events, outcome };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map(), currentWave: targetWaveIdx + 1,
    totalWaves: candidateRun.plan.waves.length, subAreaRunId: candidateRun.plan.subAreaId,
    ironGolemReplayLocked: debit, resetRunRewards: true }, useCombatStore.getState());
  const selection = { heroId: hero.id, itemId: 'receipt-item' };
  const item = { id: selection.itemId, baseId: 'items/base/wp1h-short-sword',
    rarity: 'normal' as const, level: 1, identified: true, equipped: false };
  const ownership = { backpack: [item], stash: [], equipped: {}, mercEquipment: {} };
  const captured = captureIronGolemDebit(hero.id, selection, ownership);
  if (!captured.ok) throw new Error(captured.reason);
  const binding: RecordedWaveBinding = { candidateRun, expectedActiveRun, targetWaveIdx,
    heroId: hero.id, selection, ownership, debitIntent: debit ? captured.intent : null,
    engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] },
    attestation: debit ? { sourceHeroId: hero.id, sourceItemId: item.id,
      skillId: 'necromancer.iron_golem', spawnedUnitId: 'receipt-iron', paidMp: 35 } : null,
    recording, waveElapsedMs: 1200, publication };
  const live: RecordedWaveLive = { activeRun: expectedActiveRun, heroId: hero.id, selection, ownership };
  return { binding, live };
}
let lease: WaveTransitionLease;
let leaseLive = false;
function releaseLease() { endWaveTransition(lease); leaseLive = false; }
beforeEach(() => { abandonRecordedWaves(); lease = beginWaveTransition(true); leaseLive = true; });
afterEach(() => {
  if (leaseLive) releaseLease();
  abandonRecordedWaves();
  combatRunLifecycle.activeRun = null;
  useCombatStore.getState().reset();
  clearIronGolemSelection();
});

function publishedAndPending(phase: 'prepared' | 'committed' | 'conflict') {
  const first = fixture();
  const token = prepareRecordedWave(first.binding, lease);
  commitPreparedRecordedWave(token, lease, first.live);
  recognizeRecordedWavePublication(token, lease, install(first.binding));
  const next = fixture(true, first.binding.candidateRun, 1);
  const pending = prepareRecordedWave(next.binding, lease);
  if (phase !== 'prepared') commitPreparedRecordedWave(pending, lease, { ...next.live,
    ownership: { ...next.live.ownership,
      backpack: phase === 'committed' ? requiredFixtureValue(next.binding.debitIntent).expectedBackpack : [] } });
  combatRunLifecycle.activeRun = first.binding.candidateRun;
  return inspectRecordedWaves();
}

describe('receipt lifecycle cleanup', () => {
  it.each((['abort', 'hero', 'restore'] as const).flatMap(action =>
    (['prepared', 'committed', 'conflict'] as const).map(phase => ({ action, phase }))))(
    '$action clears both $phase slots before any notification and preserves gameplay roots', ({ action, phase }) => {
    const before = publishedAndPending(phase);
    expect(before.currentPublished).not.toBeNull();
    expect(before.pending).not.toBeNull();
    releaseLease();
    const gameplay = [useInventoryStore.getState(), usePlayerStore.getState(),
      useMercStore.getState(), useMapStore.getState()];
    let notifications = 0;
    const observe = () => {
      notifications++;
      expect(combatRunLifecycle.activeRun).toBeNull();
      expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    };
    const unsubscribe = [useCombatStore.subscribe(observe), useIronGolemSelectionStore.subscribe(observe)];
    try {
      if (action === 'restore') {
        const restore = reserveWaveRestore();
        try { clearCombatAfterRestore(restore); } finally { releaseWaveRestore(restore); }
      } else if (action === 'hero') clearCombatForHeroReplacement();
      else abortSubAreaRun();
    } finally { unsubscribe.forEach(stop => { stop(); }); }
    expect(notifications).toBeGreaterThan(0);
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    const after = [useInventoryStore.getState(), usePlayerStore.getState(),
      useMercStore.getState(), useMapStore.getState()];
    after.forEach((state, index) => { expect(state).toBe(gameplay[index]); });
  });

  it('preserves both slots and the run when an import fails decoding before installation', async () => {
    const before = publishedAndPending('committed');
    const run = combatRunLifecycle.activeRun;
    releaseLease();
    await expect(importIntoStores('{')).rejects.toThrow();
    await expect(importIntoStores('{}')).rejects.toThrow();
    expect(inspectRecordedWaves()).toBe(before);
    expect(combatRunLifecycle.activeRun).toBe(run);
  });

  it('clears receipts before a throwing reset subscriber observes hero replacement', () => {
    publishedAndPending('committed');
    releaseLease();
    const error = new Error('combat observer');
    const stop = useCombatStore.subscribe(() => { throw error; });
    try { expect(clearCombatForHeroReplacement).toThrow(error); } finally { stop(); }
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
  });

  it.each(['prepared', 'committed', 'conflict'] as const)('preserves both %s slots during busy abandonment and with released restore leases', phase => {
    const before = publishedAndPending(phase);
    const run = combatRunLifecycle.activeRun;
    for (const operation of [abandonRecordedWaves, abortSubAreaRun, clearCombatForHeroReplacement]) {
      expect(operation).toThrow('waveBusy');
      expect(inspectRecordedWaves()).toBe(before);
      expect(combatRunLifecycle.activeRun).toBe(run);
    }
    releaseLease();
    const restore = reserveWaveRestore();
    try {
      expect(abortSubAreaRun).toThrow('restorePending');
      expect(clearCombatForHeroReplacement).toThrow('restorePending');
      expect(abandonRecordedWaves).toThrow('restorePending');
    } finally { releaseWaveRestore(restore); }
    expect(() => { clearCombatAfterRestore(restore); }).toThrow('invalidLease');
    expect(inspectRecordedWaves()).toBe(before);
    expect(combatRunLifecycle.activeRun).toBe(run);
    abandonRecordedWaves();
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    expect(combatRunLifecycle.activeRun).toBe(run);
  });
});

function install(binding: RecordedWaveBinding) {
  const run = binding.candidateRun;
  run.waveIdx = binding.targetWaveIdx; run.waveElapsedMs = binding.waveElapsedMs;
  run.recording = binding.recording;
  return { activeRun: run, heroId: binding.heroId, combat: binding.publication };
}

describe('recorded wave receipt preparation', () => {
  it('captures exact inputs without writes and cancels only its pending preparation', () => {
    const { binding, live } = fixture();
    const before = useCombatStore.getState();
    const token = prepareRecordedWave(binding, lease);
    const pending = inspectRecordedWaves().pending;
    expect(pending?.receipt).toBe(token);
    expect(pending?.phase).toBe('prepared');
    expect(pending?.binding.engineInput).toBe(binding.engineInput);
    expect(pending?.binding.publication).toBe(binding.publication);
    expect(pending?.binding.selection).toBe(binding.selection);
    expect(pending?.binding.ownership.backpack).toBe(binding.ownership.backpack);
    expect(useCombatStore.getState()).toBe(before);
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(() => prepareRecordedWave(binding, lease)).toThrow(RecordedWaveReceiptError);
    assertPreparedRecordedWaveBinding(token, lease, live);
    cancelPreparedRecordedWave(token, lease, live.ownership);
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    expect(() => { cancelPreparedRecordedWave(token, lease, live.ownership); }).toThrow(RecordedWaveReceiptError);
  });

  it('keeps current published state while preparing or canceling its successor', () => {
    const first = fixture(); const token = prepareRecordedWave(first.binding, lease);
    expect(commitPreparedRecordedWave(token, lease, first.live)).toBe('committedPendingPublication');
    expect(recognizeRecordedWavePublication(token, lease, install(first.binding))).toBe(true);
    const current = inspectRecordedWaves().currentPublished;
    const next = fixture(false, first.binding.candidateRun, 1);
    const successor = prepareRecordedWave(next.binding, lease);
    expect(inspectRecordedWaves().currentPublished).toBe(current);
    cancelPreparedRecordedWave(successor, lease, next.live.ownership);
    expect(inspectRecordedWaves().currentPublished).toBe(current);
  });
});

describe('exact debit observation', () => {
  it('leaves a later public selection intact when canceling an unpaid stale preparation', () => {
    const { binding, live } = fixture(true);
    const token = prepareRecordedWave(binding, lease);
    releaseLease();
    const later = armIronGolemSelection(binding.heroId, 'later-item', true);
    lease = beginWaveTransition(true); leaseLive = true;
    expect(() => { assertPreparedRecordedWaveBinding(token, lease, { ...live, selection: later }); })
      .toThrow('bindingMismatch');
    cancelPreparedRecordedWave(token, lease, live.ownership);
    expect(useIronGolemSelectionStore.getState().selection).toBe(later);
    expect(inspectRecordedWaves().pending).toBeNull();
  });

  it('refuses ownership changes before payment without modifying the prepared holder', () => {
    const { binding, live } = fixture(true);
    const token = prepareRecordedWave(binding, lease);
    const before = inspectRecordedWaves();
    const ownership = { ...live.ownership, backpack: requiredFixtureValue(binding.debitIntent).expectedBackpack };
    expect(() => { assertPreparedRecordedWaveBinding(token, lease, { ...live, ownership }); }).toThrow('bindingMismatch');
    expect(() => { cancelPreparedRecordedWave(token, lease, ownership); }).toThrow('bindingMismatch');
    expect(inspectRecordedWaves()).toBe(before);
  });

  it('retains a no-debit ownership conflict without attempting inventory repair', () => {
    const { binding, live } = fixture();
    const token = prepareRecordedWave(binding, lease);
    const ownership = { ...live.ownership, backpack: [...live.ownership.backpack] };
    expect(commitPreparedRecordedWave(token, lease, { ...live, ownership })).toBe('conflict');
    expect(ownership.backpack).toHaveLength(1);
    expect(inspectRecordedWaves().pending?.binding.ownership.backpack).toBe(live.ownership.backpack);
  });

  it('retains an unpaid attempt and its first setter error, then recognizes only the exact debit array', () => {
    const { binding, live } = fixture(true);
    const token = prepareRecordedWave(binding, lease);
    const error = new Error('setter before write');
    expect(commitPreparedRecordedWave(token, lease, live, { error })).toBe('prepared');
    expect(inspectRecordedWaves().pending?.debitFailure?.error).toBe(error);
    assertPreparedRecordedWaveBinding(token, lease, live);
    const paid = { ...live, ownership: { ...live.ownership,
      backpack: requiredFixtureValue(binding.debitIntent).expectedBackpack } };
    expect(commitPreparedRecordedWave(token, lease, paid, { error: new Error('later') }))
      .toBe('committedPendingPublication');
    expect(inspectRecordedWaves().pending?.debitFailure?.error).toBe(error);
    expect(live.ownership.backpack).toHaveLength(1);
    expect(() => { cancelPreparedRecordedWave(token, lease, live.ownership); }).toThrow('wrongPhase');
  });

  it.each(['absent', 'clonedOriginal', 'stash', 'equipped', 'mercEquipment'] as const)(
    'enters conflict for %s ownership without inferring payment from item absence', change => {
      const { binding, live } = fixture(true);
      const token = prepareRecordedWave(binding, lease);
      const ownership = { ...live.ownership };
      if (change === 'absent') ownership.backpack = [];
      else if (change === 'clonedOriginal') ownership.backpack = [...ownership.backpack];
      else if (change === 'stash') ownership.stash = [];
      else if (change === 'equipped') ownership.equipped = {};
      else ownership.mercEquipment = {};
      expect(commitPreparedRecordedWave(token, lease, { ...live, ownership })).toBe('conflict');
      const before = inspectRecordedWaves();
      expect(() => commitPreparedRecordedWave(token, lease, live)).toThrow('wrongPhase');
      expect(() => { cancelPreparedRecordedWave(token, lease, live.ownership); }).toThrow('wrongPhase');
      expect(inspectRecordedWaves()).toBe(before);
      expect(live.ownership.backpack).toHaveLength(1);
    });

  it.each(['hero', 'run', 'selection', 'cursor', 'recording'] as const)(
    'preflight rejects changed %s without changing the holder and unpaid cancellation remains possible', change => {
      const previous = fixture().binding.candidateRun;
      const { binding, live } = fixture(true, previous, 1);
      const token = prepareRecordedWave(binding, lease);
      const before = inspectRecordedWaves();
      const changed = { ...live };
      if (change === 'hero') changed.heroId = 'another-hero';
      else if (change === 'run') changed.activeRun = null;
      else if (change === 'selection') changed.selection = { ...requiredFixtureValue(binding.selection) };
      else if (change === 'cursor') previous.waveIdx = 1;
      else previous.recording = binding.recording;
      const laterSelection = changed.selection;
      expect(() => { assertPreparedRecordedWaveBinding(token, lease, changed); }).toThrow('bindingMismatch');
      expect(() => commitPreparedRecordedWave(token, lease, changed)).toThrow('bindingMismatch');
      expect(inspectRecordedWaves()).toBe(before);
      cancelPreparedRecordedWave(token, lease, live.ownership);
      expect(inspectRecordedWaves().pending).toBeNull();
      expect(changed.selection).toBe(laterSelection);
    });

  it('enters conflict if selection changes after the exact debit, retaining the later instruction', () => {
    const { binding, live } = fixture(true);
    const token = prepareRecordedWave(binding, lease);
    const selection = { heroId: binding.heroId, itemId: 'later-item' };
    expect(commitPreparedRecordedWave(token, lease, { ...live, selection,
      ownership: { ...live.ownership, backpack: requiredFixtureValue(binding.debitIntent).expectedBackpack } })).toBe('conflict');
    expect(selection.itemId).toBe('later-item');
    expect(inspectRecordedWaves().pending?.binding.selection).toBe(binding.selection);
  });

  it('commits a nullable no-debit attempt only with unchanged authority and ownership', () => {
    const { binding, live } = fixture();
    const token = prepareRecordedWave({ ...binding, selection: null }, lease);
    const before = inspectRecordedWaves();
    expect(() => commitPreparedRecordedWave(token, lease, live)).toThrow('bindingMismatch');
    expect(inspectRecordedWaves()).toBe(before);
    expect(commitPreparedRecordedWave(token, lease, { ...live, selection: null }))
      .toBe('committedPendingPublication');
  });
});

describe('publication recovery', () => {
  it('retries the same payload under a new lease and retains first debit and publication errors separately', () => {
    const { binding, live } = fixture(true);
    const storeBefore = useCombatStore.getState();
    const token = prepareRecordedWave(binding, lease);
    const debitError = new Error('observer after exact debit');
    commitPreparedRecordedWave(token, lease, { ...live, ownership: { ...live.ownership,
      backpack: requiredFixtureValue(binding.debitIntent).expectedBackpack } }, { error: debitError });
    const publisherError = new Error('publisher before write');
    expect(recognizeRecordedWavePublication(token, lease, { activeRun: null,
      heroId: binding.heroId, combat: binding.publication }, { error: publisherError })).toBe(false);
    const pending = inspectRecordedWaves().pending;
    const oldLease = lease;
    releaseLease();
    lease = beginWaveTransition(true); leaseLive = true;
    const before = inspectRecordedWaves();
    expect(() => recognizeRecordedWavePublication(token, oldLease, install(binding))).toThrow('invalidLease');
    expect(inspectRecordedWaves()).toBe(before);
    expect(recognizeRecordedWavePublication(token, lease, install(binding), { error: new Error('later') })).toBe(true);
    const published = inspectRecordedWaves().currentPublished;
    expect(published?.receipt).toBe(token);
    expect(published?.phase).toBe('published');
    expect(published?.binding).toBe(pending?.binding);
    expect(published?.binding.engineInput).toBe(binding.engineInput);
    expect(published?.binding.recording).toBe(binding.recording);
    expect(published?.binding.attestation).toBe(binding.attestation);
    expect(published?.binding.publication).toBe(binding.publication);
    expect(published?.debitFailure?.error).toBe(debitError);
    expect(published?.publicationFailure?.error).toBe(publisherError);
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useCombatStore.getState()).toBe(storeBefore);
    expect(live.ownership.backpack).toHaveLength(1);
    expect(() => recognizeRecordedWavePublication(token, lease, install(binding))).toThrow('staleReceipt');
  });

  it.each(['events', 'outcome', 'reward', 'presentation', 'lock', 'run', 'hero', 'cursor', 'clock', 'recording'] as const)(
    'retains pending publication for a different %s even if other values match', change => {
      const { binding, live } = fixture();
      const token = prepareRecordedWave(binding, lease);
      commitPreparedRecordedWave(token, lease, live);
      const installed = install(binding);
      if (change === 'events') installed.combat = { ...binding.publication, recordedEvents: [...binding.recording.events] };
      else if (change === 'outcome') installed.combat = { ...binding.publication, outcome: { ...binding.recording.outcome } };
      else if (change === 'reward') installed.combat = { ...binding.publication, runRewards: { ...binding.publication.runRewards } };
      else if (change === 'presentation') installed.combat = { ...binding.publication,
        currentWavePresentation: { kind: 'trash' } };
      else if (change === 'lock') installed.combat = { ...binding.publication, ironGolemReplayLocked: true };
      else if (change === 'run') installed.activeRun = { ...binding.candidateRun };
      else if (change === 'hero') installed.heroId = 'other';
      else if (change === 'cursor') installed.activeRun.waveIdx = 1;
      else if (change === 'clock') installed.activeRun.waveElapsedMs++;
      else installed.activeRun.recording = { ...binding.recording };
      expect(recognizeRecordedWavePublication(token, lease, installed)).toBe(false);
      expect(inspectRecordedWaves().pending?.receipt).toBe(token);
      expect(inspectRecordedWaves().pending?.phase).toBe('committedPendingPublication');
      expect(inspectRecordedWaves().currentPublished).toBeNull();
      expect(recognizeRecordedWavePublication(token, lease, install(binding))).toBe(true);
    });

  it('captures the preceding cursor when the next candidate is the same run object', () => {
    const previous = fixture().binding.candidateRun;
    const { binding, live } = fixture(false, previous, 1);
    const token = prepareRecordedWave(binding, lease);
    expect(inspectRecordedWaves().pending?.binding.expectedWaveIdx).toBe(0);
    expect(binding.targetWaveIdx).toBe(1);
    assertPreparedRecordedWaveBinding(token, lease, live);
    expect(commitPreparedRecordedWave(token, lease, live)).toBe('committedPendingPublication');
    expect(recognizeRecordedWavePublication(token, lease, install(binding))).toBe(true);
  });
});

describe('receipt ownership and binding', () => {
  it('rejects foreign tokens, expired leases, wrong phases and occupied preparation without changing the holder', () => {
    const first = fixture();
    const stale = prepareRecordedWave(first.binding, lease);
    cancelPreparedRecordedWave(stale, lease, first.live.ownership);
    const token = prepareRecordedWave(first.binding, lease);
    let before = inspectRecordedWaves();
    expect(() => prepareRecordedWave(first.binding, lease)).toThrow('pendingReceipt');
    expect(() => { assertPreparedRecordedWaveBinding(stale, lease, first.live); }).toThrow('staleReceipt');
    expect(() => { cancelPreparedRecordedWave(stale, lease, first.live.ownership); }).toThrow('staleReceipt');
    expect(() => recognizeRecordedWavePublication(token, lease, install(first.binding))).toThrow('wrongPhase');
    expect(inspectRecordedWaves()).toBe(before);
    releaseLease();
    const expired = lease;
    lease = beginWaveTransition(true); leaseLive = true;
    for (const operation of [
      () => prepareRecordedWave(first.binding, expired),
      () => { assertPreparedRecordedWaveBinding(stale, expired, first.live); },
      () => { cancelPreparedRecordedWave(token, expired, first.live.ownership); },
      () => commitPreparedRecordedWave(token, expired, first.live),
      () => recognizeRecordedWavePublication(token, expired, install(first.binding))
    ]) {
      before = inspectRecordedWaves();
      expect(operation).toThrow('invalidLease');
      expect(inspectRecordedWaves()).toBe(before);
    }
  });

  it.each(['hero', 'negative', 'fractional', 'range', 'wave', 'total', 'area', 'events', 'outcome',
    'attestation', 'item', 'selection', 'ownership', 'unpaidAttestation'] as const)(
    'refuses an inconsistent %s preparation before creating a receipt', change => {
      const original = fixture(true).binding;
      let binding = original;
      if (change === 'hero') binding = { ...original, heroId: 'other' };
      else if (change === 'negative') binding = { ...original, targetWaveIdx: -1 };
      else if (change === 'fractional') binding = { ...original, targetWaveIdx: 0.5 };
      else if (change === 'range') binding = { ...original, targetWaveIdx: 1000 };
      else if (change === 'wave') binding = { ...original, publication: { ...original.publication, currentWave: 2 } };
      else if (change === 'total') binding = { ...original, publication: { ...original.publication, totalWaves: 1000 } };
      else if (change === 'area') binding = { ...original, publication: { ...original.publication, subAreaRunId: 'other' } };
      else if (change === 'events') binding = { ...original, publication: { ...original.publication, recordedEvents: [] } };
      else if (change === 'outcome') binding = { ...original, publication: { ...original.publication,
        outcome: { ...original.recording.outcome } } };
      else if (change === 'attestation') binding = { ...original, attestation: null };
      else if (change === 'item') binding = { ...original, attestation: { ...requiredFixtureValue(original.attestation), sourceItemId: 'other' } };
      else if (change === 'selection') binding = { ...original, selection: { ...requiredFixtureValue(original.selection) } };
      else if (change === 'ownership') binding = { ...original, ownership: { ...original.ownership, stash: [] } };
      else binding = { ...original, debitIntent: null };
      const before = inspectRecordedWaves();
      expect(() => prepareRecordedWave(binding, lease)).toThrow('bindingMismatch');
      expect(inspectRecordedWaves()).toBe(before);
    });

  it('binds a replacement candidate separately from the old active run', () => {
    const previous = fixture().binding.candidateRun;
    const { binding, live } = fixture();
    const token = prepareRecordedWave({ ...binding, expectedActiveRun: previous }, lease);
    assertPreparedRecordedWaveBinding(token, lease, { ...live, activeRun: previous });
    expect(() => { assertPreparedRecordedWaveBinding(token, lease,
      { ...live, activeRun: binding.candidateRun }); }).toThrow('bindingMismatch');
    commitPreparedRecordedWave(token, lease, { ...live, activeRun: previous });
    expect(recognizeRecordedWavePublication(token, lease, install(binding))).toBe(true);
  });

  it('freezes owned wrappers while leaving caller units, maps, arrays and inventories unfrozen', () => {
    const { binding } = fixture();
    const token = prepareRecordedWave(binding, lease);
    const holder = inspectRecordedWaves();
    for (const value of [token, holder, holder.pending, holder.pending?.binding,
      holder.pending?.binding.ownership]) expect(Object.isFrozen(value)).toBe(true);
    for (const value of [binding, binding.engineInput, binding.engineInput.playerTeam,
      binding.candidateRun, binding.candidateRun.playerUnit, binding.recording, binding.recording.events,
      binding.publication.unitNameMap, binding.ownership, binding.ownership.backpack,
      binding.ownership.backpack[0]]) expect(Object.isFrozen(value)).toBe(false);
    expect(binding.engineInput.playerTeam[0]).toBe(binding.candidateRun.playerUnit);
  });
});


describe('recorded wave installation intent', () => {
  it('captures immutable new-run intent and only resolves the exact old instruction', () => {
    const { binding, live } = fixture();
    const intent = { kind: 'newRun' as const, nextDefaultChallengeOrdinal: 17 };
    const token = prepareRecordedWaveInstallation(binding, intent, lease);
    commitPreparedRecordedWave(token, lease, live);
    const view = readRecordedWaveInstallation(token, lease);
    expect(view.binding).toBe(inspectRecordedWaves().pending?.binding);
    expect(view.intent).toEqual(intent); expect(Object.isFrozen(view.intent)).toBe(true);
    expect(view.metadataInstalled).toBe(false); expect(view.selectionProgress).toBe('pending');
    markRecordedWaveMetadataInstalled(token, lease);
    const firstError = new Error('selection before write');
    observeRecordedWaveSelection(token, lease, binding.selection, { error: firstError });
    expect(readRecordedWaveInstallation(token, lease).selectionProgress).toBe('pending');
    const rearm = { ...requiredFixtureValue(binding.selection) };
    observeRecordedWaveSelection(token, lease, rearm, { error: new Error('later observer') });
    const resolved = readRecordedWaveInstallation(token, lease);
    expect(resolved.metadataInstalled).toBe(true); expect(resolved.selectionProgress).toBe('resolved');
    expect(resolved.selectionFailure?.error).toBe(firstError);
    expect(binding.selection).not.toBe(rearm); expect(binding.selection).toEqual(rearm);
  });

  it('refuses invalid attempt relationships without leaving prepared residue', () => {
    const { binding } = fixture(); const before = inspectRecordedWaves();
    for (const intent of [{ kind: 'replay' as const },
      { kind: 'newWave' as const, carryPlayerTeam: binding.candidateRun.carryPlayerTeam },
      { kind: 'newRun' as const, nextDefaultChallengeOrdinal: -1 }]) {
      expect(() => prepareRecordedWaveInstallation(binding, intent, lease))
        .toThrow(new RecordedWaveReceiptError('bindingMismatch'));
      expect(inspectRecordedWaves()).toBe(before);
    }
  });

  it('requires metadata and selection resolution before exact publication promotion', () => {
    const { binding, live } = fixture();
    const token = prepareRecordedWaveInstallation(binding,
      { kind: 'newRun', nextDefaultChallengeOrdinal: null }, lease);
    commitPreparedRecordedWave(token, lease, live);
    const installed = install(binding); const error = new Error('publisher after write');
    expect(recognizeRecordedWavePublication(token, lease, installed, { error })).toBe(false);
    markRecordedWaveMetadataInstalled(token, lease);
    expect(recognizeRecordedWavePublication(token, lease, installed)).toBe(false);
    observeRecordedWaveSelection(token, lease, null);
    expect(recognizeRecordedWavePublication(token, lease, installed)).toBe(true);
    expect(inspectRecordedWaves().currentPublished?.publicationFailure?.error).toBe(error);
  });
});


it.each(['newRun', 'newWave', 'replay'] as const)('captures valid %s policy without mutating run, carry or caller intent', kind => {
  const run = fixture().binding.candidateRun;
  const { binding, live } = kind === 'newRun' ? fixture() : fixture(false, run, kind === 'newWave' ? 1 : 0);
  const carry = [...run.carryPlayerTeam];
  const intent: RecordedWaveInstallIntent = kind === 'newRun' ? { kind, nextDefaultChallengeOrdinal: null }
    : kind === 'newWave' ? { kind, carryPlayerTeam: carry } : { kind };
  const before = structuredClone(binding.candidateRun);
  const token = prepareRecordedWaveInstallation(binding, intent, lease);
  commitPreparedRecordedWave(token, lease, live);
  const view = readRecordedWaveInstallation(token, lease);
  expect(view.intent).toEqual(intent); expect(view.intent).not.toBe(intent);
  expect(Object.isFrozen(intent)).toBe(false); expect(Object.isFrozen(carry)).toBe(false);
  expect(binding.candidateRun).toEqual(before);
  if (view.intent.kind === 'newWave') expect(view.intent.carryPlayerTeam).toBe(carry);
  expect(view.selectionProgress).toBe(kind === 'replay' ? 'notRequired' : 'pending');
});

it.each(['sameRun', 'newRunWave', 'skippedWave', 'advancedReplay', 'paidReplay',
  'negative', 'fractional', 'unsafe', 'nonfinite'] as const)('rejects %s installation intent before any holder mutation', change => {
  const run = fixture().binding.candidateRun;
  let data = fixture(); let intent: RecordedWaveInstallIntent = { kind: 'newRun', nextDefaultChallengeOrdinal: 0 };
  if (change === 'sameRun') data = fixture(false, run);
  else if (change === 'newRunWave') data = fixture(false, null, 1);
  else if (change === 'skippedWave') { data = fixture(false, run, 2); intent = { kind: 'newWave', carryPlayerTeam: [] }; }
  else if (change === 'advancedReplay') { data = fixture(false, run, 1); intent = { kind: 'replay' }; }
  else if (change === 'paidReplay') { data = fixture(true, run); intent = { kind: 'replay' }; }
  else intent = { kind: 'newRun', nextDefaultChallengeOrdinal: change === 'negative' ? -1
    : change === 'fractional' ? 0.5 : change === 'unsafe' ? Number.MAX_SAFE_INTEGER + 1 : Infinity };
  const before = inspectRecordedWaves();
  expect(() => prepareRecordedWaveInstallation(data.binding, intent, lease)).toThrow('bindingMismatch');
  expect(inspectRecordedWaves()).toBe(before);
});

it('enforces install token, lease and phase authority without implicit progress', () => {
  const { binding, live } = fixture();
  const token = prepareRecordedWaveInstallation(binding, { kind: 'newRun', nextDefaultChallengeOrdinal: 0 }, lease);
  const prepared = inspectRecordedWaves();
  for (const action of [() => readRecordedWaveInstallation(token, lease),
    () => { markRecordedWaveMetadataInstalled(token, lease); }, () => { observeRecordedWaveSelection(token, lease, null); }]) {
    expect(action).toThrow('wrongPhase'); expect(inspectRecordedWaves()).toBe(prepared);
  }
  commitPreparedRecordedWave(token, lease, live);
  const committed = inspectRecordedWaves();
  expect(() => { observeRecordedWaveSelection(token, lease, null); }).toThrow('wrongPhase');
  expect(inspectRecordedWaves()).toBe(committed);
  const oldLease = lease; releaseLease();
  for (const action of [() => readRecordedWaveInstallation(token, oldLease),
    () => { markRecordedWaveMetadataInstalled(token, oldLease); }, () => { observeRecordedWaveSelection(token, oldLease, null); },
    () => prepareRecordedWaveInstallation(binding, { kind: 'replay' }, oldLease)]) {
    expect(action).toThrow('invalidLease'); expect(inspectRecordedWaves()).toBe(committed);
  }
  abandonRecordedWaves(); lease = beginWaveTransition(true); leaseLive = true;
  const empty = inspectRecordedWaves();
  for (const action of [() => readRecordedWaveInstallation(token, lease),
    () => { markRecordedWaveMetadataInstalled(token, lease); }, () => { observeRecordedWaveSelection(token, lease, null); }]) {
    expect(action).toThrow('staleReceipt'); expect(inspectRecordedWaves()).toBe(empty);
  }
});

it('requires explicit installation intent instead of accepting foundation-only receipts', () => {
  const { binding, live } = fixture(); const token = prepareRecordedWave(binding, lease);
  commitPreparedRecordedWave(token, lease, live); const before = inspectRecordedWaves();
  for (const action of [() => readRecordedWaveInstallation(token, lease),
    () => { markRecordedWaveMetadataInstalled(token, lease); }, () => { observeRecordedWaveSelection(token, lease, null); }]) {
    expect(action).toThrow('bindingMismatch'); expect(inspectRecordedWaves()).toBe(before);
  }
});

it('needs no selection setter for null instructions and keeps progress marks idempotent', () => {
  const original = fixture(); const binding = { ...original.binding, selection: null };
  const token = prepareRecordedWaveInstallation(binding, { kind: 'newRun', nextDefaultChallengeOrdinal: null }, lease);
  commitPreparedRecordedWave(token, lease, { ...original.live, selection: null });
  expect(readRecordedWaveInstallation(token, lease).selectionProgress).toBe('notRequired');
  markRecordedWaveMetadataInstalled(token, lease); const marked = inspectRecordedWaves();
  markRecordedWaveMetadataInstalled(token, lease); observeRecordedWaveSelection(token, lease, null);
  expect(inspectRecordedWaves()).toBe(marked);
  expect(recognizeRecordedWavePublication(token, lease, install(binding))).toBe(true);
});

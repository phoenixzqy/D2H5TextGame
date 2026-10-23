import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Guard from './waveTransitionGuard';

let guard: typeof Guard;
beforeEach(async () => {
  vi.resetModules();
  guard = await import('./waveTransitionGuard');
});

function refuses(operation: () => unknown, code: Guard.WaveGuardRefusal): void {
  try {
    operation();
    expect.fail(`Expected refusal: ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(guard.WaveGuardError);
    expect(error).toMatchObject({ code });
  }
}

describe('wave transition ownership', () => {
  it('rejects nested wave entry and preserves the first owner', () => {
    const lease = guard.beginWaveTransition(true);
    refuses(() => guard.beginWaveTransition(true), 'waveBusy');
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'waveBusy');
    expect(guard.endWaveTransition(lease)).toBe(false);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
    const next = guard.beginWaveTransition(true);
    expect(next).not.toBe(lease);
    guard.endWaveTransition(next);
  });

  it('refuses not-ready hydration without acquiring ownership', () => {
    refuses(() => guard.beginWaveTransition(false), 'hydrationNotReady');
    const lease = guard.beginWaveTransition(true);
    guard.endWaveTransition(lease);
  });

  it('checks active ownership before hydration and restore entry', () => {
    const lease = guard.beginWaveTransition(true);
    refuses(() => guard.beginWaveTransition(false), 'waveBusy');
    refuses(() => guard.reserveWaveRestore(), 'waveBusy');
    guard.endWaveTransition(lease);
    const restore = guard.reserveWaveRestore();
    refuses(() => guard.beginWaveTransition(false), 'restorePending');
    guard.releaseWaveRestore(restore);
  });

  it('does not let a stale wave lease release the next owner or discard its save request', () => {
    const old = guard.beginWaveTransition(true);
    guard.endWaveTransition(old);
    const current = guard.beginWaveTransition(true);
    expect(guard.deferWaveSaveIfBusy()).toBe(true);
    refuses(() => guard.endWaveTransition(old), 'invalidLease');
    refuses(() => guard.beginWaveTransition(true), 'waveBusy');
    expect(guard.endWaveTransition(current)).toBe(true);
    refuses(() => guard.endWaveTransition(current), 'invalidLease');
  });

  it('reserves restore immediately before queued async work starts and holds through failure cleanup', async () => {
    let releaseRead: (() => void) | undefined;
    const read = new Promise<void>(resolve => { releaseRead = resolve; });
    const reservation = guard.reserveWaveRestore();
    let cleaned = false;
    const pending = Promise.resolve().then(async () => {
      try {
        await read;
        throw new Error('read failed');
      } finally {
        refuses(() => guard.beginWaveTransition(true), 'restorePending');
        cleaned = true;
        guard.releaseWaveRestore(reservation);
      }
    });
    refuses(() => guard.beginWaveTransition(true), 'restorePending');
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'restorePending');
    expect(cleaned).toBe(false);
    releaseRead?.();
    await expect(pending).rejects.toThrow('read failed');
    expect(cleaned).toBe(true);
    const lease = guard.beginWaveTransition(true);
    guard.endWaveTransition(lease);
  });

  it('keeps every queued restore reserved until its exact owner releases', () => {
    const first = guard.reserveWaveRestore();
    const second = guard.reserveWaveRestore();
    expect(second).not.toBe(first);
    guard.releaseWaveRestore(first);
    refuses(() => { guard.releaseWaveRestore(first); }, 'invalidLease');
    refuses(() => guard.beginWaveTransition(true), 'restorePending');
    guard.releaseWaveRestore(second);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
  });

  it('coalesces busy save requests into one wake and clears ownership before the caller schedules', () => {
    expect(guard.deferWaveSaveIfBusy()).toBe(false);
    const lease = guard.beginWaveTransition(true);
    expect(guard.deferWaveSaveIfBusy()).toBe(true);
    expect(guard.deferWaveSaveIfBusy()).toBe(true);
    expect(guard.endWaveTransition(lease)).toBe(true);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
    expect(guard.deferWaveSaveIfBusy()).toBe(false);
    const next = guard.beginWaveTransition(true);
    expect(guard.endWaveTransition(next)).toBe(false);
  });

  it('does not turn restore suppression into a deferred wave save request', () => {
    const reservation = guard.reserveWaveRestore();
    expect(guard.deferWaveSaveIfBusy()).toBe(false);
    guard.releaseWaveRestore(reservation);
    const lease = guard.beginWaveTransition(true);
    expect(guard.endWaveTransition(lease)).toBe(false);
  });

  it('allows a caller finally block to release transition ownership after a staging error', () => {
    const lease = guard.beginWaveTransition(true);
    expect(() => {
      try { throw new Error('staging failed'); }
      finally { guard.endWaveTransition(lease); }
    }).toThrow('staging failed');
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
  });
});

describe('shared quest transaction ownership', () => {
  it('excludes snapshots, restores, nested quests and new waves until exact release and wakes one deferred save', () => {
    const lease = guard.beginQuestTransaction();
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'questBusy');
    refuses(() => guard.reserveWaveRestore(), 'questBusy');
    refuses(() => guard.beginWaveTransition(true), 'questBusy');
    refuses(() => guard.beginQuestTransaction(), 'questBusy');
    expect(guard.deferWaveSaveIfBusy()).toBe(true); expect(guard.deferWaveSaveIfBusy()).toBe(true);
    expect(guard.endQuestTransaction(lease)).toBe(true);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow(); expect(guard.deferWaveSaveIfBusy()).toBe(false);
    const next = guard.beginQuestTransaction();
    refuses(() => guard.endQuestTransaction(lease), 'invalidLease');
    expect(guard.endQuestTransaction(next)).toBe(false);
  });
  it('retains deferred save ownership until the outer accepted wave finishes', () => {
    const wave = guard.beginWaveTransition(true), quest = guard.beginQuestTransaction();
    expect(guard.deferWaveSaveIfBusy()).toBe(true); expect(guard.endQuestTransaction(quest)).toBe(false);
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'waveBusy');
    expect(guard.endWaveTransition(wave)).toBe(true); expect(guard.deferWaveSaveIfBusy()).toBe(false);
  });
  it('cannot enter during a reserved restore or the exact Iron debit', () => {
    const restore = guard.reserveWaveRestore(); refuses(() => guard.beginQuestTransaction(), 'restorePending');
    guard.releaseWaveRestore(restore);
    const wave = guard.beginWaveTransition(true); guard.beginIronGolemDebit(wave);
    refuses(() => guard.beginQuestTransaction(), 'itemDebitBusy'); guard.endIronGolemDebit(wave); guard.endWaveTransition(wave);
  });
});

describe('shared material transaction ownership', () => {
  it('excludes nested material actions, wave, restore, quest, item helpers and snapshots until release', () => {
    const lease = guard.beginMaterialTransaction(true);
    refuses(() => guard.beginMaterialTransaction(true), 'materialBusy');
    refuses(() => guard.beginWaveTransition(true), 'materialBusy');
    refuses(() => guard.reserveWaveRestore(), 'materialBusy');
    refuses(() => guard.beginQuestTransaction(), 'materialBusy');
    refuses(() => { guard.assertIronGolemOwnershipMutationAllowed(); }, 'materialBusy');
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'materialBusy');
    expect(guard.deferWaveSaveIfBusy()).toBe(true);
    expect(guard.endMaterialTransaction(lease)).toBe(true);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
    expect(guard.deferWaveSaveIfBusy()).toBe(false);
    const next = guard.beginMaterialTransaction(true);
    refuses(() => guard.endMaterialTransaction(lease), 'invalidLease');
    expect(guard.endMaterialTransaction(next)).toBe(false);
  });
  it('refuses during wave, restore, quest, Iron debit or hydration and retains each owner', () => {
    const wave = guard.beginWaveTransition(true);
    refuses(() => guard.beginMaterialTransaction(true), 'waveBusy');
    guard.beginIronGolemDebit(wave);
    refuses(() => guard.beginMaterialTransaction(true), 'itemDebitBusy');
    guard.endIronGolemDebit(wave); guard.endWaveTransition(wave);
    const restore = guard.reserveWaveRestore();
    refuses(() => guard.beginMaterialTransaction(true), 'restorePending'); guard.releaseWaveRestore(restore);
    const quest = guard.beginQuestTransaction();
    refuses(() => guard.beginMaterialTransaction(true), 'questBusy'); guard.endQuestTransaction(quest);
    refuses(() => guard.beginMaterialTransaction(false), 'hydrationNotReady');
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
  });
});


describe('exact Iron Golem debit ownership', () => {
  it('blocks ownership-changing actions only within the owned debit boundary', () => {
    const lease = guard.beginWaveTransition(true);
    expect(() => { guard.assertIronGolemOwnershipMutationAllowed(); }).not.toThrow();
    guard.beginIronGolemDebit(lease);
    refuses(() => { guard.assertIronGolemOwnershipMutationAllowed(); }, 'itemDebitBusy');
    refuses(() => guard.beginWaveTransition(true), 'waveBusy');
    refuses(() => guard.reserveWaveRestore(), 'waveBusy');
    refuses(() => { guard.assertWaveSnapshotAllowed(); }, 'waveBusy');
    guard.endIronGolemDebit(lease);
    expect(() => { guard.assertIronGolemOwnershipMutationAllowed(); }).not.toThrow();
    guard.endWaveTransition(lease);
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
  });

  it('preserves debit ownership and the save wake after nested debit or premature wave release', () => {
    const lease = guard.beginWaveTransition(true);
    guard.beginIronGolemDebit(lease);
    expect(guard.deferWaveSaveIfBusy()).toBe(true);
    refuses(() => { guard.beginIronGolemDebit(lease); }, 'itemDebitBusy');
    refuses(() => guard.endWaveTransition(lease), 'itemDebitBusy');
    refuses(() => { guard.assertIronGolemOwnershipMutationAllowed(); }, 'itemDebitBusy');
    guard.endIronGolemDebit(lease);
    expect(guard.endWaveTransition(lease)).toBe(true);
  });

  it('rejects stale wave leases for both debit boundaries without changing the active owner', () => {
    const old = guard.beginWaveTransition(true);
    guard.endWaveTransition(old);
    refuses(() => { guard.beginIronGolemDebit(old); }, 'invalidLease');
    refuses(() => { guard.endIronGolemDebit(old); }, 'invalidLease');
    const current = guard.beginWaveTransition(true);
    refuses(() => { guard.beginIronGolemDebit(old); }, 'invalidLease');
    refuses(() => { guard.endIronGolemDebit(current); }, 'invalidLease');
    guard.beginIronGolemDebit(current);
    refuses(() => { guard.endIronGolemDebit(old); }, 'invalidLease');
    refuses(() => { guard.assertIronGolemOwnershipMutationAllowed(); }, 'itemDebitBusy');
    guard.endIronGolemDebit(current);
    refuses(() => { guard.endIronGolemDebit(current); }, 'invalidLease');
    guard.endWaveTransition(current);
  });

  it('lets finally release debit and wave ownership after a setter or subscriber throws', () => {
    const lease = guard.beginWaveTransition(true);
    let wake = false;
    expect(() => {
      try {
        guard.beginIronGolemDebit(lease);
        try {
          guard.deferWaveSaveIfBusy();
          throw new Error('setter or observer failed');
        } finally { guard.endIronGolemDebit(lease); }
      } finally { wake = guard.endWaveTransition(lease); }
    }).toThrow('setter or observer failed');
    expect(wake).toBe(true);
    expect(() => { guard.assertIronGolemOwnershipMutationAllowed(); }).not.toThrow();
    expect(() => { guard.assertWaveSnapshotAllowed(); }).not.toThrow();
  });
});

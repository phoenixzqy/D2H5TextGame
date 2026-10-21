import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Selection from './ironGolemSelectionStore';
import type * as Guard from './waveTransitionGuard';

let selection: typeof Selection;
let guard: typeof Guard;
beforeEach(async () => {
  vi.resetModules();
  guard = await import('./waveTransitionGuard');
  selection = await import('./ironGolemSelectionStore');
});

function current() { return selection.useIronGolemSelectionStore.getState().selection; }
function arm(heroId = 'hero', itemId = 'sword') {
  return selection.armIronGolemSelection(heroId, itemId, true);
}
function wave(operation: (lease: Guard.WaveTransitionLease) => void): void {
  const lease = guard.beginWaveTransition(true);
  try { operation(lease); } finally { guard.endWaveTransition(lease); }
}
function restore(operation: (lease: Guard.WaveRestoreLease) => void): void {
  const lease = guard.reserveWaveRestore();
  try { operation(lease); } finally { guard.releaseWaveRestore(lease); }
}
function refuses(operation: () => unknown, code: Guard.WaveGuardRefusal): void {
  try {
    operation();
    expect.fail(`Expected refusal: ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(guard.WaveGuardError);
    expect(error).toMatchObject({ code });
  }
}

describe('transient acknowledged Iron Golem instruction', () => {
  it('starts empty and stores only the explicit hero and item IDs', () => {
    expect(current()).toBeNull();
    const armed = arm();
    expect(armed).toEqual({ heroId: 'hero', itemId: 'sword' });
    expect(current()).toBe(armed);
    expect(Object.isFrozen(armed)).toBe(true);
    expect(() => { Object.assign(armed, { itemId: 'other' }); }).toThrow(TypeError);
    expect(current()?.itemId).toBe('sword');
  });

  it('requires acknowledgement without replacing a previously armed instruction', () => {
    const armed = arm();
    expect(() => selection.armIronGolemSelection('other', 'armor', false))
      .toThrow(selection.IronGolemAcknowledgementError);
    expect(current()).toBe(armed);
    expect(() => selection.armIronGolemSelection('other', 'armor', false))
      .toThrow('acknowledgementRequired');
  });

  it('does not arm an empty selection without acknowledgement', () => {
    expect(() => selection.armIronGolemSelection('hero', 'sword', false))
      .toThrow(selection.IronGolemAcknowledgementError);
    expect(current()).toBeNull();
  });

  it('uses a fresh identity even when the same hero/item is explicitly rearmed', () => {
    const first = arm();
    const next = arm();
    expect(next).toEqual(first);
    expect(next).not.toBe(first);
    expect(current()).toBe(next);
  });

  it('allows a free explicit clear including when already empty', () => {
    arm();
    selection.clearIronGolemSelection();
    expect(current()).toBeNull();
    selection.clearIronGolemSelection();
    expect(current()).toBeNull();
  });

  it('notifies subscribers of arm and clear with the same captured references', () => {
    const changes: (Selection.IronGolemSelectionState['selection'])[] = [];
    const unsubscribe = selection.useIronGolemSelectionStore.subscribe(state => { changes.push(state.selection); });
    try {
      const armed = arm();
      selection.clearIronGolemSelection();
      expect(changes).toEqual([armed, null]);
      expect(changes[0]).toBe(armed);
    } finally { unsubscribe(); }
  });

  it('refuses arm and public clear during a wave without changing its instruction', () => {
    const armed = arm();
    wave(() => {
      refuses(() => arm('other', 'armor'), 'waveBusy');
      refuses(() => { selection.clearIronGolemSelection(); }, 'waveBusy');
      expect(current()).toBe(armed);
    });
    expect(arm('other', 'armor')).toBe(current());
  });

  it('refuses arm and public clear while restore is reserved before any await', () => {
    const armed = arm();
    restore(() => {
      refuses(() => arm(), 'restorePending');
      refuses(() => { selection.clearIronGolemSelection(); }, 'restorePending');
      expect(current()).toBe(armed);
    });
    selection.clearIronGolemSelection();
    expect(current()).toBeNull();
  });

  it('prioritizes transition ownership before acknowledgement validation', () => {
    wave(() => {
      refuses(() => selection.armIronGolemSelection('hero', 'sword', false), 'waveBusy');
      expect(current()).toBeNull();
    });
  });
});

describe('exact accepted-wave consumption', () => {
  it('clears the captured instruction once using the exact active wave owner', () => {
    const armed = arm();
    wave(lease => {
      expect(selection.consumeIronGolemSelection(armed, lease)).toBe(true);
      expect(current()).toBeNull();
      expect(selection.consumeIronGolemSelection(armed, lease)).toBe(false);
    });
  });

  it('accepts matching null as a no-op without inventing an item choice', () => {
    wave(lease => {
      expect(selection.consumeIronGolemSelection(null, lease)).toBe(true);
      expect(current()).toBeNull();
    });
  });

  it('does not consume a new same-ID instruction through an earlier capture', () => {
    const old = arm();
    const rearmed = arm();
    wave(lease => {
      expect(selection.consumeIronGolemSelection(old, lease)).toBe(false);
      expect(selection.consumeIronGolemSelection(null, lease)).toBe(false);
      expect(current()).toBe(rearmed);
    });
  });

  it('does not accept a structurally equal caller-created instruction', () => {
    const armed = arm();
    wave(lease => {
      expect(selection.consumeIronGolemSelection({ ...armed }, lease)).toBe(false);
      expect(current()).toBe(armed);
    });
  });

  it('validates wave lease before either matched or mismatched consumption', () => {
    const armed = arm();
    const stale = guard.beginWaveTransition(true);
    guard.endWaveTransition(stale);
    refuses(() => selection.consumeIronGolemSelection(armed, stale), 'invalidLease');
    wave(() => {
      refuses(() => selection.consumeIronGolemSelection(null, stale), 'invalidLease');
      refuses(() => selection.consumeIronGolemSelection(armed, {} as Guard.WaveTransitionLease), 'invalidLease');
      expect(current()).toBe(armed);
    });
  });

  it('retains the instruction when a caller staging error accepts no wave', () => {
    const armed = arm();
    expect(() => { wave(() => { throw new Error('staging failed'); }); }).toThrow('staging failed');
    expect(current()).toBe(armed);
    wave(lease => { expect(selection.consumeIronGolemSelection(armed, lease)).toBe(true); });
  });

  it('retains installed clearing if a synchronous observer throws after the write', () => {
    const armed = arm();
    const unsubscribe = selection.useIronGolemSelectionStore.subscribe(() => { throw new Error('observer'); });
    try {
      wave(lease => {
        expect(() => selection.consumeIronGolemSelection(armed, lease)).toThrow('observer');
        expect(current()).toBeNull();
        expect(selection.consumeIronGolemSelection(armed, lease)).toBe(false);
      });
    } finally { unsubscribe(); }
  });
});

describe('successful restore clearing', () => {
  it('clears only with an exact still-reserved restore owner', () => {
    arm();
    restore(lease => {
      selection.clearIronGolemSelectionAfterRestore(lease);
      expect(current()).toBeNull();
      selection.clearIronGolemSelectionAfterRestore(lease);
      expect(current()).toBeNull();
    });
  });

  it('rejects stale or fabricated restore owners while another restore remains reserved', () => {
    const stale = guard.reserveWaveRestore();
    guard.releaseWaveRestore(stale);
    const armed = arm();
    restore(lease => {
      refuses(() => { selection.clearIronGolemSelectionAfterRestore(stale); }, 'invalidLease');
      refuses(() => { selection.clearIronGolemSelectionAfterRestore({} as Guard.WaveRestoreLease); }, 'invalidLease');
      expect(current()).toBe(armed);
      selection.clearIronGolemSelectionAfterRestore(lease);
      expect(current()).toBeNull();
    });
  });

  it('keeps the instruction when a held restore fails and releases its owner', async () => {
    const armed = arm();
    let release: (() => void) | undefined;
    const read = new Promise<void>(resolve => { release = resolve; });
    const lease = guard.reserveWaveRestore();
    const failed = Promise.resolve().then(async () => {
      try { await read; throw new Error('import failed'); }
      finally { guard.releaseWaveRestore(lease); }
    });
    try {
      refuses(() => arm(), 'restorePending');
      expect(current()).toBe(armed);
    } finally {
      release?.();
      await expect(failed).rejects.toThrow('import failed');
    }
    expect(current()).toBe(armed);
    wave(owner => { expect(selection.consumeIronGolemSelection(armed, owner)).toBe(true); });
  });
});

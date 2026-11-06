/** Exercise actual public inventory ingress under the existing quest lease. */
import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from './inventoryStore';
import { beginQuestTransaction, endQuestTransaction } from './waveTransitionGuard';
import {
  beginQuestGemShardPublication, endQuestGemShardPublication,
  verifyQuestGemShardPublication, type QuestGemShardPublication
} from './questGemShardJournal';

const source = 'quests/side-act2-fara-favored';

function publication(run: (owner: QuestGemShardPublication) => void): void {
  const lease = beginQuestTransaction();
  let owner: QuestGemShardPublication | undefined;
  try {
    owner = beginQuestGemShardPublication(source, useInventoryStore.getState().currencies);
    run(owner);
  } finally {
    if (owner) endQuestGemShardPublication(owner);
    endQuestTransaction(lease);
  }
}

describe('finite quest gem-shard publication at the inventory boundary', () => {
  beforeEach(() => { useInventoryStore.setState({ currencies: {} }); });

  it('refuses real direct spending from the grant observer, then restores absence and permits retry', () => {
    publication(owner => {
      const unsubscribe = useInventoryStore.subscribe(state => {
        if (state.currencies['gem-shard'] === 1) state.spendCurrency('gem-shard', 1);
      });
      try {
        expect(() => { useInventoryStore.getState().addQuestGemShard(owner); }).toThrow('questBusy');
        expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
        verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, true);
      } finally { unsubscribe(); }
      useInventoryStore.getState().restoreQuestGemShard(owner);
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false);
      expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(false);
    });
    publication(owner => {
      useInventoryStore.getState().addQuestGemShard(owner);
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, true);
    });
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
  });

  it('attributes independent additions before an earlier throwing subscriber can skip observers', () => {
    useInventoryStore.setState({ currencies: { 'gem-shard': 7, opaque: 12 } });
    publication(owner => {
      let nested = false;
      const first = useInventoryStore.subscribe(state => {
        if (nested) throw new Error('earlier independent observer');
        nested = true;
        state.addCurrency('gem-shard', 4);
      });
      let laterReads = 0;
      const later = useInventoryStore.subscribe(() => { laterReads++; });
      try {
        expect(() => { useInventoryStore.getState().addQuestGemShard(owner); }).toThrow('earlier independent observer');
        expect(laterReads).toBe(0);
        expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 12, opaque: 12 });
      } finally { first(); later(); }
      useInventoryStore.getState().restoreQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 11, opaque: 12 });
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false);
    });
  });

  it.each([undefined, 0, 9])('preserves baseline %s and independent zero-key creation through rollback', baseline => {
    useInventoryStore.setState({ currencies: baseline === undefined ? {} : { 'gem-shard': baseline } });
    publication(owner => {
      useInventoryStore.getState().addQuestGemShard(owner);
      useInventoryStore.getState().addCurrency('gem-shard', 0);
      useInventoryStore.getState().restoreQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(baseline ?? 0);
      expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(true);
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false);
    });
  });

  it('keeps additions during rollback and restores only once', () => {
    publication(owner => {
      useInventoryStore.getState().addQuestGemShard(owner);
      let restored = false;
      const unsubscribe = useInventoryStore.subscribe(state => {
        if (!restored && !Object.hasOwn(state.currencies, 'gem-shard')) {
          restored = true;
          state.addCurrency('gem-shard', 3);
          state.addCurrency('opaque', 5);
        }
      });
      try { useInventoryStore.getState().restoreQuestGemShard(owner); }
      finally { unsubscribe(); }
      useInventoryStore.getState().restoreQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 3, opaque: 5 });
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false);
      expect(() => { useInventoryStore.getState().addQuestGemShard(owner); }).toThrow('invalidLease');
    });
  });

  it('fences negative and unsafe same-key additions while unrelated spending remains available', () => {
    useInventoryStore.setState({ currencies: { opaque: 10 } });
    publication(owner => {
      for (const amount of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => { useInventoryStore.getState().addCurrency('gem-shard', amount); }).toThrow();
      }
      expect(useInventoryStore.getState().spendCurrency('opaque', 3)).toBe(true);
      expect(useInventoryStore.getState().currencies).toEqual({ opaque: 7 });
      verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false);
    });
    useInventoryStore.getState().addCurrency('gem-shard', 4);
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 2)).toBe(true);
  });

  it('refuses forged or released owners without applying an independent debit', () => {
    let released: QuestGemShardPublication | undefined;
    publication(owner => {
      released = owner;
      expect(() => { useInventoryStore.getState().addQuestGemShard({} as QuestGemShardPublication); }).toThrow('invalidLease');
      useInventoryStore.getState().restoreQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies).toEqual({});
    });
    if (!released) throw new Error('Missing released publication');
    const releasedOwner = released;
    expect(() => { useInventoryStore.getState().addQuestGemShard(releasedOwner); }).toThrow('invalidLease');
    expect(useInventoryStore.getState().currencies).toEqual({});
  });

  it('detects an absent ingress and leaves an unknown overwrite untouched for explicit recovery', () => {
    publication(owner => {
      expect(() => { verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, true); }).toThrow();
      useInventoryStore.getState().restoreQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies).toEqual({});
      useInventoryStore.getState().addQuestGemShard(owner);
      useInventoryStore.setState({ currencies: { 'gem-shard': 123, opaque: 4 } });
      expect(() => { useInventoryStore.getState().restoreQuestGemShard(owner); }).toThrow('Unattributed');
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 123, opaque: 4 });
    });
  });

  it('refuses a grant that would overflow before reserving an owner', () => {
    useInventoryStore.setState({ currencies: { 'gem-shard': Number.MAX_SAFE_INTEGER } });
    expect(() => { publication(() => { throw new Error('must not run'); }); }).toThrow('Unsafe');
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(Number.MAX_SAFE_INTEGER);
    useInventoryStore.setState({ currencies: {} });
    publication(owner => {
      useInventoryStore.getState().addQuestGemShard(owner);
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
    });
  });
});

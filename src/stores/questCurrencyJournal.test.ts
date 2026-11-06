/** Variable wish amounts share the existing finite gem transaction boundary. */
import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from './inventoryStore';
import { beginQuestTransaction, endQuestTransaction } from './waveTransitionGuard';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication, verifyQuestCurrencyPublication,
  type QuestCurrencyPublication } from './questCurrencyJournal';

const source = 'quests/act1-search-for-cain';
function publication(run: (owner: QuestCurrencyPublication) => void) {
  const lease = beginQuestTransaction(); let owner: QuestCurrencyPublication | undefined;
  try { owner = beginQuestCurrencyPublication(source, 'wishstone', 20, useInventoryStore.getState().currencies); run(owner); }
  finally { if (owner) endQuestCurrencyPublication(owner); endQuestTransaction(lease); }
}

describe('finite currency owner boundary', () => {
  beforeEach(() => { useInventoryStore.setState({ currencies: {} }); });

  it.each([-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])('refuses invalid wish balance %s before reserving an owner', value => {
    useInventoryStore.setState({ currencies: { wishstone: value } });
    expect(() => { publication(() => { throw new Error('must not run'); }); }).toThrow(/Invalid/);
    useInventoryStore.setState({ currencies: {} });
    publication(owner => { useInventoryStore.getState().addQuestCurrency(owner); });
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 20 });
  });

  it('refuses inherited and accessor balances without invoking an accessor', () => {
    const lease = beginQuestTransaction(); let reads = 0;
    const accessor: Record<string, number> = {};
    Object.defineProperty(accessor, 'wishstone', { enumerable: true, get: () => { reads++; return 0; } });
    try {
      expect(() => beginQuestCurrencyPublication(source, 'wishstone', 20, Object.create({ wishstone: 0 }) as Record<string, number>)).toThrow('Inherited');
      expect(() => beginQuestCurrencyPublication(source, 'wishstone', 20, accessor)).toThrow('Invalid');
      expect(reads).toBe(0);
    } finally { endQuestTransaction(lease); }
  });

  it('attributes independent zero-key creation and additions during rollback', () => {
    publication(owner => {
      useInventoryStore.getState().addQuestCurrency(owner);
      useInventoryStore.getState().addCurrency('wishstone', 0);
      let fired = false;
      const stop = useInventoryStore.subscribe(state => {
        if (fired || state.currencies.wishstone !== 0) return;
        fired = true; state.addCurrency('wishstone', 3);
      });
      try { useInventoryStore.getState().restoreQuestCurrency(owner); } finally { stop(); }
      useInventoryStore.getState().restoreQuestCurrency(owner);
      expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 3 });
      verifyQuestCurrencyPublication(owner, useInventoryStore.getState().currencies, false);
      expect(() => { useInventoryStore.getState().addQuestCurrency(owner); }).toThrow('invalidLease');
    });
  });

  it('retains an unattributed overwrite for explicit recovery and releases the failed owner', () => {
    publication(owner => {
      useInventoryStore.getState().addQuestCurrency(owner);
      useInventoryStore.setState({ currencies: { wishstone: 123, opaque: 4 } });
      expect(() => { useInventoryStore.getState().restoreQuestCurrency(owner); }).toThrow('Unattributed');
      expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123, opaque: 4 });
    });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 3)).toBe(true);
  });

  it('retains source allowlists and exact +1 gem grants', () => {
    const lease = beginQuestTransaction();
    try {
      expect(() => beginQuestCurrencyPublication('quests/unknown', 'wishstone', 20, {})).toThrow('Unsupported');
      expect(() => beginQuestCurrencyPublication(source, 'gem-shard', 1, {})).toThrow('Unsupported');
      expect(() => beginQuestCurrencyPublication('quests/side-act2-fara-favored', 'gem-shard', 2, {})).toThrow('Unsupported');
    } finally { endQuestTransaction(lease); }
  });

  it.each(['quests/side-act1-gheeds-gamble', 'quests/side-act2-fara-favored'])('settles both currencies for %s while fencing other sources and preserving independent additions', quest => {
    const lease = beginQuestTransaction();
    const owners: QuestCurrencyPublication[] = [];
    try {
      const gem = beginQuestCurrencyPublication(quest, 'gem-shard', 1, {}); owners.push(gem);
      const wish = beginQuestCurrencyPublication(quest, 'wishstone', 10, {}); owners.push(wish);
      expect(() => beginQuestCurrencyPublication(source, 'wishstone', 20, {})).toThrow('questBusy');
      expect(() => beginQuestCurrencyPublication(quest, 'gem-shard', 1, {})).toThrow('questBusy');
      for (const key of ['gem-shard', 'wishstone']) expect(() => useInventoryStore.getState().spendCurrency(key, 0)).toThrow('questBusy');
      useInventoryStore.getState().addQuestGemShard(gem);
      useInventoryStore.getState().addQuestCurrency(wish);
      useInventoryStore.getState().addCurrency('gem-shard', 4);
      useInventoryStore.getState().addCurrency('wishstone', 3);
      useInventoryStore.getState().restoreQuestGemShard(gem);
      useInventoryStore.getState().restoreQuestCurrency(wish);
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 4, wishstone: 3 });
      for (const owner of owners) verifyQuestCurrencyPublication(owner, useInventoryStore.getState().currencies, false);
      endQuestCurrencyPublication(gem); owners.shift();
      expect(() => beginQuestCurrencyPublication('quests/bounty-act1-moor-cull', 'gem-shard', 1, useInventoryStore.getState().currencies)).toThrow('questBusy');
      expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
      expect(() => useInventoryStore.getState().spendCurrency('wishstone', 1)).toThrow('questBusy');
    } finally { for (const owner of owners) endQuestCurrencyPublication(owner); endQuestTransaction(lease); }
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

  it('attributes cross-currency additions before throwing observers and preserves them through both restorations', () => {
    const lease = beginQuestTransaction(), owners: QuestCurrencyPublication[] = [];
    try {
      const quest = 'quests/side-act1-gheeds-gamble';
      const gem = beginQuestCurrencyPublication(quest, 'gem-shard', 1, {}); owners.push(gem);
      const wish = beginQuestCurrencyPublication(quest, 'wishstone', 10, {}); owners.push(wish);
      let fired = false;
      const stop = useInventoryStore.subscribe(state => {
        if (fired) return; fired = true;
        state.addCurrency('wishstone', 3); state.addCurrency('gem-shard', 4); throw new Error('cross-currency observer');
      });
      try { expect(() => { useInventoryStore.getState().addQuestGemShard(gem); }).toThrow('cross-currency observer'); } finally { stop(); }
      useInventoryStore.getState().restoreQuestCurrency(wish);
      useInventoryStore.getState().restoreQuestGemShard(gem);
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 4, wishstone: 3 });
      for (const owner of owners) verifyQuestCurrencyPublication(owner, useInventoryStore.getState().currencies, false);
    } finally { for (const owner of owners) endQuestCurrencyPublication(owner); endQuestTransaction(lease); }
  });
});

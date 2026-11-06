import { describe, expect, it } from 'vitest';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import type { QuestItemLedger, QuestProgressData } from '../types/save';
import { countCountedQuestSources, hasCountedQuestClaimCompletion, hasCountedQuestClaimedConsumption,
  hasCountedQuestConsumption, validateCountedQuestGraphs, type CountedQuestDomain } from './counted-quest';

const domains = loadCountedQuestItems();
function fixture(domain: CountedQuestDomain, count: number, consumed = false, claimed = false, terminal = consumed) {
  const items: QuestItemLedger = Object.fromEntries(domain.sources.slice(0, count).map(source =>
    [source, { itemId: domain.itemId, state: consumed ? 'consumed' : 'owned' }]));
  const progress: Record<string, QuestProgressData> = { [domain.quest]: { id: domain.quest,
    status: terminal ? 'completed' : 'inProgress', rewardClaimed: claimed, objectives: { [domain.objective]: terminal } } };
  return { items, progress };
}
describe.each(domains)('finite counted graph $key', domain => {
  it('derives every partial count and preserves compatible unclaimed history', () => {
    for (let count = 0; count <= domain.sources.length; count++) {
      for (const terminal of [false, true]) {
        const { progress, items } = fixture(domain, count, false, false, terminal);
        expect(countCountedQuestSources(items, domain)).toEqual({ recovered: count, held: count, consumed: 0, total: domain.sources.length });
        if (count === domain.sources.length && domain.sink === 'claim' && !terminal) {
          expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).toThrow('Invalid');
        } else expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).not.toThrow();
        expect(hasCountedQuestClaimCompletion(progress, items, domain))
          .toBe(count === domain.sources.length && domain.sink === 'claim' && terminal);
      }
    }
  });
  it.each([false, true])('requires full consumption and separates the actual sink (claimed=%s)', claimed => {
    const { progress, items } = fixture(domain, domain.sources.length, true, claimed);
    expect(hasCountedQuestConsumption(progress, items, domain)).toBe(true);
    expect(hasCountedQuestClaimedConsumption(progress, items, domain)).toBe(claimed);
    expect(hasCountedQuestClaimCompletion(progress, items, domain)).toBe(domain.sink === 'town-delivery' && !claimed);
    if (domain.sink === 'claim' && !claimed) expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).toThrow('Invalid');
    else expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).not.toThrow();
  });
  it('keeps source-free claimed legacy inert and permits historical domain omission', () => {
    const { progress } = fixture(domain, 0, false, true, true);
    expect(() => { validateCountedQuestGraphs(progress, {}, [domain]); }).not.toThrow();
    expect(hasCountedQuestClaimCompletion(progress, {}, domain)).toBe(false);
    expect(hasCountedQuestClaimedConsumption(progress, {}, domain)).toBe(false);
    expect(() => { validateCountedQuestGraphs({}, fixture(domain, 1).items, []); }).not.toThrow();
  });
  it.each(['missing-row', 'wrong-id', 'missing-objective', 'extra-objective', 'wrong-item', 'bad-state',
    'partial-consumed', 'mixed', 'claimed-owned', 'claimed-partial', 'bad-claimed', 'locked', 'contradictory-flag'] as const)(
    'rejects contradictory %s', fault => {
      const { progress, items } = fixture(domain, domain.sources.length, false, false, true);
      const row = progress[domain.quest], source = domain.sources[0]; if (!row || !source) throw new Error('Missing fixture');
      if (fault === 'missing-row') Reflect.deleteProperty(progress, domain.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, domain.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', false);
      if (fault === 'wrong-item') Reflect.set(items[source] ?? {}, 'itemId', 'quest/foreign');
      if (fault === 'bad-state') Reflect.set(items[source] ?? {}, 'state', 'missing');
      if (fault === 'partial-consumed' || fault === 'mixed') {
        Reflect.set(items[source] ?? {}, 'state', 'consumed');
        if (fault === 'partial-consumed') for (const key of domain.sources.slice(1)) Reflect.deleteProperty(items, key);
      }
      if (fault === 'claimed-owned' || fault === 'claimed-partial') {
        Reflect.set(row, 'rewardClaimed', true);
        if (fault === 'claimed-partial') for (const key of domain.sources.slice(1)) Reflect.deleteProperty(items, key);
      }
      if (fault === 'bad-claimed') Reflect.set(row, 'rewardClaimed', undefined);
      if (fault === 'locked') Reflect.set(row, 'status', 'locked');
      if (fault === 'contradictory-flag') Reflect.set(row.objectives, domain.objective, false);
      expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).toThrow('Invalid');
      expect(hasCountedQuestClaimCompletion(progress, items, domain)).toBe(false);
      expect(hasCountedQuestClaimedConsumption(progress, items, domain)).toBe(false);
    });
  it.each(['source', 'item', 'state', 'row', 'objectives', 'objective', 'status', 'claimed'] as const)(
    'rejects %s descriptor faults without getter evaluation', field => {
      for (const fault of ['getter', 'hidden', 'symbol', 'inherited']) {
        const { progress, items } = fixture(domain, domain.sources.length, true, true), source = domain.sources[0];
        const row = progress[domain.quest]; if (!row || !source) throw new Error('Missing fixture');
        const target = field === 'source' ? items : field === 'item' || field === 'state' ? items[source]
          : field === 'row' ? progress : field === 'objective' ? row.objectives : row;
        const key = field === 'source' ? source : field === 'item' ? 'itemId' : field === 'row' ? domain.quest
          : field === 'objective' ? domain.objective : field === 'claimed' ? 'rewardClaimed' : field;
        if (!target) throw new Error('Missing target');
        const value: unknown = Reflect.get(target, key); let reads = 0;
        if (fault === 'getter') Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return value; } });
        if (fault === 'hidden') Object.defineProperty(target, key, { enumerable: false });
        if (fault === 'symbol') Reflect.set(target, Symbol('extra'), true);
        if (fault === 'inherited') { Reflect.deleteProperty(target, key); Object.setPrototypeOf(target, { [key]: value }); }
        expect(() => { validateCountedQuestGraphs(progress, items, [domain]); }).toThrow('Invalid');
        expect(hasCountedQuestClaimCompletion(progress, items, domain)).toBe(false);
        expect(hasCountedQuestClaimedConsumption(progress, items, domain)).toBe(false);
        expect(reads).toBe(0);
      }
    });
});

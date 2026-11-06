import { describe, expect, it } from 'vitest';
import { ACT2_CACHES, ACT2_CACHE_DOMAINS, act2CacheKeyForQuest, act2CacheKeyForSource,
  hasAct2CacheRetainedProof, validateAct2CacheGraphs, type Act2CacheKey } from './act2-cache-quests';
import type { QuestItemLedger, QuestProgressData } from '../types/save';

function fixture(key: Act2CacheKey) {
  const d = ACT2_CACHES[key];
  const progress: Record<string, QuestProgressData> = { [d.quest]: { id: d.quest, status: 'completed',
    objectives: { [d.objective]: true }, rewardClaimed: false } };
  const items: QuestItemLedger = { [d.source]: { itemId: d.itemId, state: 'owned' } };
  return { d, progress, items };
}
describe.each(['horazon', 'elzix'] as const)('retained %s cache graph', key => {
  it('admits only exact retained proof, both before and after Claim, under explicit domains', () => {
    const { d, progress, items } = fixture(key);
    expect(act2CacheKeyForQuest(d.quest)).toBe(key); expect(act2CacheKeyForSource(d.source)).toBe(key);
    expect(act2CacheKeyForSource(`${d.source}:1`)).toBeUndefined();
    expect(hasAct2CacheRetainedProof(key, progress, items, ACT2_CACHE_DOMAINS)).toBe(true);
    Reflect.set(progress[d.quest] ?? {}, 'rewardClaimed', true);
    expect(() => { validateAct2CacheGraphs(progress, items, ACT2_CACHE_DOMAINS); }).not.toThrow();
    expect(() => { validateAct2CacheGraphs(progress, items, []); }).toThrow('historical');
    expect(() => { validateAct2CacheGraphs(progress, {}, []); }).not.toThrow();
    expect(hasAct2CacheRetainedProof(key, progress, {}, ACT2_CACHE_DOMAINS)).toBe(false);
  });
  it.each(['missing-row', 'wrong-row', 'incomplete', 'false-objective', 'extra-objective', 'wrong-item', 'consumed',
    'extra-item-field', 'claimed-type', 'unknown-source', 'swapped-source'] as const)('rejects %s', fault => {
    const { d, progress, items } = fixture(key), row = progress[d.quest];
    if (!row) throw new Error('Missing fixture');
    if (fault === 'missing-row') Reflect.deleteProperty(progress, d.quest);
    if (fault === 'wrong-row') Reflect.set(row, 'id', ACT2_CACHES[key === 'horazon' ? 'elzix' : 'horazon'].quest);
    if (fault === 'incomplete') Reflect.set(row, 'status', 'inProgress');
    if (fault === 'false-objective') Reflect.set(row.objectives, d.objective, false);
    if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
    if (fault === 'wrong-item') Reflect.set(items[d.source] ?? {}, 'itemId', 'quest/foreign');
    if (fault === 'consumed') Reflect.set(items[d.source] ?? {}, 'state', 'consumed');
    if (fault === 'extra-item-field') Reflect.set(items[d.source] ?? {}, 'count', 1);
    if (fault === 'claimed-type') Reflect.set(row, 'rewardClaimed', 1);
    if (fault === 'unknown-source') Reflect.set(items, `${d.quest}#future`, { itemId: d.itemId, state: 'owned' });
    if (fault === 'swapped-source') Reflect.set(items, ACT2_CACHES[key === 'horazon' ? 'elzix' : 'horazon'].source, items[d.source]);
    expect(() => { validateAct2CacheGraphs(progress, items, ACT2_CACHE_DOMAINS); }).toThrow('Invalid');
    expect(hasAct2CacheRetainedProof(key, progress, items, ACT2_CACHE_DOMAINS)).toBe(false);
  });
  it.each(['source', 'item', 'row', 'objectives', 'objective', 'status', 'claimed'] as const)('never evaluates a %s getter', field => {
    const { d, progress, items } = fixture(key), row = progress[d.quest];
    if (!row) throw new Error('Missing fixture');
    const target = field === 'source' ? items : field === 'item' ? items[d.source] : field === 'row' ? progress
      : field === 'objective' ? row.objectives : row;
    const property = field === 'source' ? d.source : field === 'item' ? 'itemId' : field === 'row' ? d.quest
      : field === 'objective' ? d.objective : field === 'claimed' ? 'rewardClaimed' : field;
    let reads = 0;
    if (!target) throw new Error('Missing fixture target');
    Object.defineProperty(target, property, { enumerable: true, get() { reads++; throw new Error('getter evaluated'); } });
    expect(() => { validateAct2CacheGraphs(progress, items, ACT2_CACHE_DOMAINS); }).toThrow('Invalid'); expect(reads).toBe(0);
  });
});
it('allows either or both independent graphs and rejects forged or accessor domains without reads', () => {
  const a = fixture('horazon'), b = fixture('elzix');
  expect(() => { validateAct2CacheGraphs({ ...a.progress, ...b.progress }, { ...a.items, ...b.items }, ACT2_CACHE_DOMAINS); }).not.toThrow();
  expect(() => { validateAct2CacheGraphs(a.progress, a.items, [{ ...ACT2_CACHE_DOMAINS[0], key: 'horazon', quest: 'future', objective: a.d.objective, source: a.d.source, itemId: a.d.itemId }]); }).toThrow('domain');
  const domains = [...ACT2_CACHE_DOMAINS]; let reads = 0;
  Object.defineProperty(domains, '0', { enumerable: true, get() { reads++; return ACT2_CACHE_DOMAINS[0]; } });
  expect(() => { validateAct2CacheGraphs(a.progress, a.items, domains); }).toThrow('domain'); expect(reads).toBe(0);
});

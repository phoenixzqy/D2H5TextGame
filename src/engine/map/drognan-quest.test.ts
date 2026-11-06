import { describe, expect, it } from 'vitest';
import type { QuestItemLedger, QuestProgressData } from '../types/save';
import { DROGNAN, hasDrognanTome, validateDrognanQuestGraph } from './drognan-quest';
function recovered() {
  const progress: Record<string, QuestProgressData> = { [DROGNAN.quest]: { id: DROGNAN.quest,
    status: 'completed', rewardClaimed: false, objectives: { [DROGNAN.objective]: true } } };
  const items: QuestItemLedger = { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' } };
  return { progress, items };
}
describe('finite Drognan physical source graph', () => {
  it.each([false, true, undefined])('admits exact owned recovery before/after Claim (claimed=%s)', claimed => {
    const { progress, items } = recovered();
    const row = progress[DROGNAN.quest]; if (!row) throw new Error('Missing fixture');
    if (claimed === undefined) Reflect.deleteProperty(row, 'rewardClaimed'); else Reflect.set(row, 'rewardClaimed', claimed);
    expect(hasDrognanTome(progress, items)).toBe(true);
    expect(() => { validateDrognanQuestGraph(progress, items); }).not.toThrow();
  });
  it.each([false, true])('preserves proofless completed legacy history (claimed=%s)', claimed => {
    const { progress } = recovered(); Reflect.set(progress[DROGNAN.quest] ?? {}, 'rewardClaimed', claimed);
    expect(hasDrognanTome(progress, {})).toBe(false);
    expect(() => { validateDrognanQuestGraph(progress, {}); }).not.toThrow();
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'invalid-claimed', 'wrong-item', 'consumed', 'extra-item-field'] as const)('rejects contradictory %s', fault => {
      const { progress, items } = recovered(), row = progress[DROGNAN.quest];
      if (!row) throw new Error('Missing fixture');
      if (fault === 'missing-row') Reflect.deleteProperty(progress, DROGNAN.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      if (fault === 'false-objective') Reflect.set(row.objectives, DROGNAN.objective, false);
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, DROGNAN.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'extra', true);
      if (fault === 'invalid-claimed') Reflect.set(row, 'rewardClaimed', undefined);
      if (fault === 'wrong-item') Reflect.set(items[DROGNAN.source] ?? {}, 'itemId', 'foreign');
      if (fault === 'consumed') Reflect.set(items[DROGNAN.source] ?? {}, 'state', 'consumed');
      if (fault === 'extra-item-field') Reflect.set(items[DROGNAN.source] ?? {}, 'extra', true);
      expect(hasDrognanTome(progress, items)).toBe(false);
      expect(() => { validateDrognanQuestGraph(progress, items); }).toThrow('Invalid');
    });
  it.each(['source', 'item', 'row', 'objectives', 'objective'] as const)(
    'refuses a %s getter without executing it', field => {
      const { progress, items } = recovered(); let reads = 0;
      const row = progress[DROGNAN.quest]; if (!row) throw new Error('Missing fixture');
      const target = field === 'source' ? items : field === 'item' ? items[DROGNAN.source]
        : field === 'row' ? progress : field === 'objectives' ? row : row.objectives;
      const key = field === 'source' ? DROGNAN.source : field === 'item' ? 'itemId'
        : field === 'row' ? DROGNAN.quest : field === 'objectives' ? 'objectives' : DROGNAN.objective;
      if (!target) throw new Error('Missing fixture');
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(hasDrognanTome(progress, items)).toBe(false);
      expect(() => { validateDrognanQuestGraph(progress, items); }).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['hidden', 'symbol', 'inherited'] as const)('rejects %s source descriptors', fault => {
    const { progress, items } = recovered();
    if (fault === 'hidden') Object.defineProperty(items, DROGNAN.source, { enumerable: false });
    if (fault === 'symbol') Reflect.set(items, Symbol('source'), true);
    if (fault === 'inherited') {
      Reflect.deleteProperty(items, DROGNAN.source);
      Object.setPrototypeOf(items, { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' } });
    }
    expect(hasDrognanTome(progress, items)).toBe(false);
    expect(() => { validateDrognanQuestGraph(progress, items); }).toThrow('Invalid');
  });
});

import { describe, expect, it } from 'vitest';
import type { QuestProgressData } from '../types/save';
import { ACT5_ENCOUNTERS } from './act5-admission';
import { hasLarzukPresentation, LARZUK, validateLarzukQuestGraph } from './larzuk-quest';

function presented() {
  const encounter = ACT5_ENCOUNTERS.find(row => row.questId === LARZUK.prerequisite);
  if (!encounter) throw new Error('Missing Siege fixture');
  const progress: Record<string, QuestProgressData> = {
    [LARZUK.quest]: { id: LARZUK.quest, status: 'completed', rewardClaimed: false,
      objectives: { [LARZUK.objective]: true } },
    [LARZUK.prerequisite]: { id: LARZUK.prerequisite, status: 'completed', rewardClaimed: false,
      objectives: { [encounter.objectiveId]: true } }
  };
  return { progress, receipts: { [LARZUK.proof]: true as const, [encounter.proof]: true as const } };
}
describe('Larzuk presentation authority', () => {
  it('requires actual Siege victory independently of claiming its reward', () => {
    const { progress, receipts } = presented();
    expect(hasLarzukPresentation(progress, receipts, {})).toBe(true);
    expect(() => { validateLarzukQuestGraph(progress, receipts, {}); }).not.toThrow();
  });
  it.each(['id', 'status', 'objectives', 'rewardClaimed', LARZUK.objective])(
    'refuses prototype fallback for %s even on an otherwise plain JSON record', field => {
      const { progress, receipts } = presented(), row = progress[LARZUK.quest];
      if (!row) throw new Error('Missing side row');
      const target = field === LARZUK.objective ? row.objectives : row;
      const value: unknown = Reflect.get(target, field), old = Object.getOwnPropertyDescriptor(Object.prototype, field);
      Reflect.deleteProperty(target, field);
      if (field === LARZUK.objective) Reflect.set(target, 'unrelated', true);
      let accepted: boolean;
      try {
        // Isolate prototype-pollution sensitivity to this synchronous helper call.
        Object.defineProperty(Object.prototype, field, { configurable: true, value });
        accepted = hasLarzukPresentation(progress, receipts, {});
      } finally {
        if (old) Object.defineProperty(Object.prototype, field, old);
        else Reflect.deleteProperty(Object.prototype, field);
      }
      expect(accepted).toBe(false);
    });
  it('refuses missing own objectives without invoking an inherited getter', () => {
    const { progress, receipts } = presented(), row = progress[LARZUK.quest];
    if (!row) throw new Error('Missing side row');
    Reflect.deleteProperty(row, 'objectives');
    const old = Object.getOwnPropertyDescriptor(Object.prototype, 'objectives');
    let reads = 0, accepted = true;
    try {
      Object.defineProperty(Object.prototype, 'objectives', { configurable: true,
        get() { reads++; return { [LARZUK.objective]: true }; } });
      accepted = hasLarzukPresentation(progress, receipts, {});
    } finally {
      if (old) Object.defineProperty(Object.prototype, 'objectives', old);
      else Reflect.deleteProperty(Object.prototype, 'objectives');
    }
    expect(accepted).toBe(false);
    expect(reads).toBe(0);
  });
  it('leaves proofless legacy history inert without manufacturing a receipt', () => {
    const { progress } = presented(), receipts = {};
    expect(hasLarzukPresentation(progress, receipts, {})).toBe(false);
    expect(() => { validateLarzukQuestGraph(progress, receipts, {}); }).not.toThrow();
    expect(receipts).toEqual({});
  });
});

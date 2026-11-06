import { describe, expect, it } from 'vitest';
import type { QuestProgressData } from '../types/save';
import { LIVE_ACT5_DOMAIN } from '../save/act5-state';
import { hasWarbandEnlistment, WARBAND, validateWarbandQuestGraph } from './warband-quest';
function enlisted() {
  const progress: Record<string, QuestProgressData> = {
    [WARBAND.quest]: { id: WARBAND.quest, status: 'completed', rewardClaimed: false,
      objectives: { [WARBAND.objective]: true } },
    [WARBAND.prerequisite]: { id: WARBAND.prerequisite, status: 'completed', rewardClaimed: false,
      objectives: { [LIVE_ACT5_DOMAIN.rescueObjective]: true } }
  };
  const receipts = { ...Object.fromEntries(LIVE_ACT5_DOMAIN.cageProofs.map(proof => [proof, true as const])),
    [WARBAND.proof]: true as const };
  return { progress, receipts };
}
describe('finite Warband historical enlistment authority', () => {
  it('requires all rescued cages, independently of Rescue Claim and continued ownership', () => {
    const { progress, receipts } = enlisted();
    expect(hasWarbandEnlistment(progress, receipts, {})).toBe(true);
    expect(() => { validateWarbandQuestGraph(progress, receipts, {}); }).not.toThrow();
    for (const proof of LIVE_ACT5_DOMAIN.cageProofs) {
      const missing = { ...receipts }; Reflect.deleteProperty(missing, proof);
      expect(hasWarbandEnlistment(progress, missing, {})).toBe(false);
      expect(() => { validateWarbandQuestGraph(progress, missing, {}); }).toThrow('Invalid');
    }
  });
  it.each(['id', 'status', 'objectives', 'rewardClaimed', WARBAND.objective])(
    'refuses inherited %s without executing the getter', field => {
      const { progress, receipts } = enlisted(), row = progress[WARBAND.quest];
      if (!row) throw new Error('Missing fixture side row');
      const target = field === WARBAND.objective ? row.objectives : row;
      const value: unknown = Reflect.get(target, field), old = Object.getOwnPropertyDescriptor(Object.prototype, field);
      Reflect.deleteProperty(target, field);
      let reads = 0, accepted = true;
      try {
        Object.defineProperty(Object.prototype, field, { configurable: true, get() { reads++; return value; } });
        accepted = hasWarbandEnlistment(progress, receipts, {});
      } finally {
        if (old) Object.defineProperty(Object.prototype, field, old); else Reflect.deleteProperty(Object.prototype, field);
      }
      expect(accepted).toBe(false); expect(reads).toBe(0);
    });
  it.each(['side-row', 'rescue-row', 'objective', 'receipt'] as const)('rejects own %s accessor without invocation', field => {
    const { progress, receipts } = enlisted(); let reads = 0;
    const target = field === 'receipt' ? receipts : field === 'objective' ? progress[WARBAND.quest]?.objectives : progress;
    const key = field === 'receipt' ? WARBAND.proof : field === 'objective' ? WARBAND.objective
      : field === 'side-row' ? WARBAND.quest : WARBAND.prerequisite;
    if (!target) throw new Error('Missing fixture target');
    Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
    expect(hasWarbandEnlistment(progress, receipts, {})).toBe(false); expect(reads).toBe(0);
  });
  it('leaves completed proofless legacy history inert', () => {
    const { progress } = enlisted(), receipts = {};
    expect(hasWarbandEnlistment(progress, receipts, {})).toBe(false);
    expect(() => { validateWarbandQuestGraph(progress, receipts, {}); }).not.toThrow();
    expect(receipts).toEqual({});
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { QuestServiceLedger } from '../services/quest-services';
import { ANYA as A, ANYA_DOMAIN as D, hasAnyaEntitlement, hasAnyaTalkEligibility, validateAnyaQuestGraph } from './anya-quest';
function fixture(claimed = false) {
  const services: Record<string, QuestServiceLedger[string]> = claimed ? { [A.serviceSource]: { serviceId: 'personalize_item', state: 'available' } } : {};
  return { progress: { [A.quest]: { id: A.quest, status: 'completed' as const, rewardClaimed: claimed, objectives: { [A.objective]: true } },
    [A.prerequisite.quest]: { id: A.prerequisite.quest, status: 'completed' as const, rewardClaimed: true,
      objectives: Object.fromEntries(A.prerequisite.objectiveIds.map(id => [id, true])) } },
  items: { [A.prerequisite.potionSource]: { itemId: A.prerequisite.potionItemId, state: 'consumed' as const } },
  receipts: { [A.proof]: true as const, [A.prerequisite.inspectProof]: true as const, [A.prerequisite.potionSource]: true as const, [A.prerequisite.thawProof]: true as const },
  services };
}
function validate(f: ReturnType<typeof fixture>, domain = D) { validateAnyaQuestGraph(f.progress, f.items, f.receipts, f.services, domain); }
describe('finite Anya source graph', () => {
  it('accepts actual thaw of completed historical Prison without an original victory receipt', () => {
    const f = fixture(); validate(f); expect(hasAnyaTalkEligibility(f.progress, f.items, f.receipts, D)).toBe(true);
    expect(hasAnyaEntitlement(f.progress, f.items, f.receipts, D)).toBe(false);
  });
  it.each([{ entries: [] }, { entries: ['frostburn-gauntlet'] }, { entries: ['waterwalk'] }, { entries: ['frostburn-gauntlet', 'waterwalk'] }, { entries: ['waterwalk', 'frostburn-gauntlet'] }] as const)(
    'accepts independent claimed stock subset/order $entries', ({ entries }) => {
      const f = fixture(true); entries.forEach(id => { f.receipts[A.tradeProofs[id]] = true; }); validate(f);
      expect(hasAnyaEntitlement(f.progress, f.items, f.receipts, D)).toBe(true);
      f.services[A.serviceSource] = { serviceId: 'personalize_item', state: 'consumed', targetItemId: 'disposed-target' }; validate(f);
    });
  it('leaves source-free claimed legacy service readable and inert', () => {
    const f = fixture(true); Reflect.deleteProperty(f.receipts, A.proof); validate(f);
    validateAnyaQuestGraph(f.progress, f.items, f.receipts, f.services, undefined);
    expect(hasAnyaTalkEligibility(f.progress, f.items, f.receipts, D)).toBe(false);
    expect(hasAnyaEntitlement(f.progress, f.items, f.receipts, D)).toBe(false);
  });
  it.each([A.proof, ...Object.values(A.tradeProofs)])('explicit historical domain absence refuses future source %s', proof => {
    const f = fixture(true); f.receipts[proof] = true;
    expect(() => { validateAnyaQuestGraph(f.progress, f.items, f.receipts, f.services, undefined); }).toThrow('Anya');
  });
  it.each(['missing-inspect', 'missing-potion', 'missing-thaw', 'unconsumed', 'missing-main-objective', 'unclaimed-trade', 'missing-service', 'unclaimed-service', 'unknown-proof', 'item-proof'])(
    'refuses contradictory %s', mode => {
      const f = fixture(mode === 'missing-service');
      if (mode === 'missing-inspect') Reflect.deleteProperty(f.receipts, A.prerequisite.inspectProof);
      if (mode === 'missing-potion') Reflect.deleteProperty(f.receipts, A.prerequisite.potionSource);
      if (mode === 'missing-thaw') Reflect.deleteProperty(f.receipts, A.prerequisite.thawProof);
      if (mode === 'unconsumed') { const potion = f.items[A.prerequisite.potionSource]; if (!potion) throw new Error('Missing potion fixture'); Reflect.set(potion, 'state', 'held'); }
      if (mode === 'missing-main-objective') Reflect.deleteProperty(f.progress[A.prerequisite.quest]?.objectives ?? {}, 'obj-kill-nihlathak');
      if (mode === 'unclaimed-trade') f.receipts[A.tradeProofs.waterwalk] = true;
      if (mode === 'missing-service') Reflect.deleteProperty(f.services, A.serviceSource);
      if (mode === 'unclaimed-service') f.services[A.serviceSource] = { serviceId: 'personalize_item', state: 'available' };
      if (mode === 'unknown-proof') f.receipts[`${A.quest}#trade:other`] = true;
      if (mode === 'item-proof') Reflect.set(f.items, A.proof, { itemId: 'fake', state: 'held' });
      expect(() => { validate(f); }).toThrow('Anya');
    });
  it.each(['receipt', 'objective', 'service', 'domain'])( 'rejects accessor %s without execution', field => {
    const f = fixture(true), getter = vi.fn(() => true);
    const target = field === 'receipt' ? f.receipts : field === 'objective' ? f.progress[A.quest]?.objectives : field === 'service' ? f.services : structuredClone(D);
    if (!target) throw new Error('Missing fixture');
    Object.defineProperty(target, field === 'domain' ? 'quest' : field === 'objective' ? A.objective : field === 'service' ? A.serviceSource : A.proof,
      { enumerable: true, configurable: true, get: getter });
    expect(() => { field === 'domain' ? validateAnyaQuestGraph(f.progress, f.items, f.receipts, f.services, target as typeof D) : validate(f); }).toThrow('Anya');
    expect(getter).not.toHaveBeenCalled();
  });
  it('refuses inherited receipts and altered supplied finite authority', () => {
    const f = fixture(); Object.setPrototypeOf(f.receipts, { inherited: true }); expect(() => { validate(f); }).toThrow();
    const g = fixture(); expect(() => { validate(g, { ...D, proof: 'other' }); }).toThrow();
  });
});

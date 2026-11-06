import { describe, expect, it } from 'vitest';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';
import { TOWN_ENLISTMENTS, hasTownEnlistmentPrerequisite, hasTownEnlistmentProof,
  validateTownEnlistmentGraphs, type TownEnlistmentQuestDomain } from './town-enlistment-quest';

const domains = Object.values(TOWN_ENLISTMENTS);
function enlisted(domain: TownEnlistmentQuestDomain) {
  const progress: Record<string, QuestProgressData> = { [domain.quest]: { id: domain.quest,
    status: 'completed', rewardClaimed: false, objectives: { [domain.objective]: true } } };
  if (domain.prerequisite) progress[domain.prerequisite.quest] = { id: domain.prerequisite.quest,
    status: 'completed', rewardClaimed: false,
    objectives: Object.fromEntries(domain.prerequisite.objectiveIds.map(id => [id, true])) };
  const receipts: QuestActionReceipts = { [domain.proof]: true };
  return { progress, receipts };
}
describe.each(domains)('finite captain proof $quest', domain => {
  it.each([false, true, undefined])('retains proof before/after Claim (%s), independent of possession', claimed => {
    const { progress, receipts } = enlisted(domain), row = progress[domain.quest];
    if (!row) throw new Error('Missing fixture');
    if (claimed === undefined) Reflect.deleteProperty(row, 'rewardClaimed'); else Reflect.set(row, 'rewardClaimed', claimed);
    expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(true);
    expect(() => { validateTownEnlistmentGraphs(progress, receipts); }).not.toThrow();
  });
  it.each([false, true])('keeps proofless legacy history inert (%s)', claimed => {
    const { progress } = enlisted(domain); Reflect.set(progress[domain.quest] ?? {}, 'rewardClaimed', claimed);
    expect(hasTownEnlistmentProof(progress, {}, domain)).toBe(false);
    expect(() => { validateTownEnlistmentGraphs(progress, {}); }).not.toThrow();
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'false-proof', 'invalid-claimed'] as const)('rejects contradictory %s', fault => {
    const { progress, receipts } = enlisted(domain), row = progress[domain.quest];
    if (!row) throw new Error('Missing fixture');
    if (fault === 'missing-row') Reflect.deleteProperty(progress, domain.quest);
    if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
    if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
    if (fault === 'false-objective') Reflect.set(row.objectives, domain.objective, false);
    if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, domain.objective);
    if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
    if (fault === 'false-proof') Reflect.set(receipts, domain.proof, false);
    if (fault === 'invalid-claimed') Reflect.set(row, 'rewardClaimed', undefined);
    expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(false);
    expect(() => { validateTownEnlistmentGraphs(progress, receipts); }).toThrow('Invalid');
  });
  it.each(['proof', 'row', 'objectives', 'objective', 'status', 'claimed'] as const)(
    'rejects own %s getter without executing it', field => {
      const { progress, receipts } = enlisted(domain), row = progress[domain.quest]; let reads = 0;
      if (!row) throw new Error('Missing fixture');
      const target = field === 'proof' ? receipts : field === 'row' ? progress : field === 'objective' ? row.objectives : row;
      const key = field === 'proof' ? domain.proof : field === 'row' ? domain.quest : field === 'objective' ? domain.objective
        : field === 'claimed' ? 'rewardClaimed' : field;
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(false);
      expect(() => { validateTownEnlistmentGraphs(progress, receipts); }).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['proof', 'row', 'objectives', 'objective'] as const)('rejects hidden/symbol/inherited %s descriptors', field => {
    for (const fault of ['hidden', 'symbol', 'inherited']) {
      const { progress, receipts } = enlisted(domain), row = progress[domain.quest];
      if (!row) throw new Error('Missing fixture');
      const target = field === 'proof' ? receipts : field === 'row' ? progress : field === 'objective' ? row.objectives : row;
      const key = field === 'proof' ? domain.proof : field === 'row' ? domain.quest : field === 'objective' ? domain.objective : field;
      const value: unknown = Reflect.get(target, key);
      if (fault === 'hidden') Object.defineProperty(target, key, { enumerable: false });
      if (fault === 'symbol') Reflect.set(target, Symbol('extra'), true);
      if (fault === 'inherited') { Reflect.deleteProperty(target, key); Object.setPrototypeOf(target, { [key]: value }); }
      expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(false);
      expect(() => { validateTownEnlistmentGraphs(progress, receipts); }).toThrow('Invalid');
    }
  });
});
describe('finite main prerequisite authority', () => {
  it.each(domains.filter(domain => domain.prerequisite))('requires main completion and exact ordered flags for $quest', domain => {
    const main = domain.prerequisite; if (!main) throw new Error('Missing prerequisite');
    for (const fault of ['missing', 'wrong-id', 'in-progress', ...main.objectiveIds]) {
      const { progress, receipts } = enlisted(domain), row = progress[main.quest]; if (!row) throw new Error('Missing main');
      if (fault === 'missing') Reflect.deleteProperty(progress, main.quest);
      else if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      else if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      else Reflect.set(row.objectives, fault, false);
      expect(hasTownEnlistmentPrerequisite(progress, domain)).toBe(false);
      expect(() => { validateTownEnlistmentGraphs(progress, receipts); }).toThrow('Invalid');
    }
  });
  it('allows extra valid main flags without Claim, Book Read or main receipts', () => {
    const domain = TOWN_ENLISTMENTS.greiz, { progress, receipts } = enlisted(domain);
    Reflect.set(progress[domain.prerequisite?.quest ?? '']?.objectives ?? {}, 'historical-extension', false);
    expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(true);
  });
  it('uses supplied historical objective authority instead of live identities', () => {
    const domain = { ...TOWN_ENLISTMENTS.kashya, objective: 'historical-hire', prerequisite: {
      quest: 'historical-main', objectiveIds: ['historical-return'] } }, { progress, receipts } = enlisted(domain);
    expect(hasTownEnlistmentProof(progress, receipts, domain)).toBe(true);
    expect(hasTownEnlistmentProof(progress, receipts, TOWN_ENLISTMENTS.kashya)).toBe(false);
    expect(() => { validateTownEnlistmentGraphs(progress, receipts, [domain]); }).not.toThrow();
  });
  it('deeply freezes the finite registry and prerequisite arrays', () => {
    expect(Object.keys(TOWN_ENLISTMENTS)).toEqual(['kashya', 'greiz', 'asheara']);
    expect(Object.isFrozen(TOWN_ENLISTMENTS)).toBe(true);
    for (const domain of domains) {
      expect(Object.isFrozen(domain)).toBe(true);
      if (domain.prerequisite) {
        expect(Object.isFrozen(domain.prerequisite)).toBe(true);
        expect(Object.isFrozen(domain.prerequisite.objectiveIds)).toBe(true);
      }
    }
  });
});

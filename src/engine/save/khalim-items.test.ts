import { describe, expect, it } from 'vitest';
import type { QuestItemLedger, QuestProgressData } from '../types/save';
import { validateQuestActionReceipts, validateQuestItemLedger } from './validate';

const QUEST = 'quests/act3-khalims-will', GUARDIAN = 'quests/act3-guardian';
const source = (id: string) => `${QUEST}#objective:${id}`;
const CUBE = 'quests/act2-horadric-staff#objective:obj-cube', WILL = source('obj-transmute');
const COUNCIL = `${QUEST}#action:council-victory`, ORB = `${GUARDIAN}#action:break-compelling-orb`;
const parts = ['heart', 'brain', 'eye', 'flail'] as const;
const progress: Record<string, QuestProgressData> = {
  'quests/act2-horadric-staff': { id: 'quests/act2-horadric-staff', status: 'inProgress',
    objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
  [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: false,
    objectives: { 'obj-heart': true, 'obj-brain': true, 'obj-eye': true, 'obj-flail': true, 'obj-transmute': true } },
  [GUARDIAN]: { id: GUARDIAN, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-kill-mephisto': false } }
};
const owned: QuestItemLedger = {
  [CUBE]: { itemId: 'quest/horadric_cube', state: 'owned' },
  ...Object.fromEntries(parts.map(part => [source(`obj-${part}`), { itemId: `quest/khalims_${part}`, state: 'consumed' }])),
  [WILL]: { itemId: 'items/khalims_will', state: 'owned' }
};
const receipts = { [COUNCIL]: true };

describe('prospective Khalim item/action state', () => {
  it('retains owned and consumed real Will graphs while requiring the exact source context', () => {
    expect(validateQuestItemLedger(owned, progress, receipts)).toBe(owned);
    expect(() => validateQuestItemLedger(owned, progress)).toThrow();
    const consumed: QuestItemLedger = { ...owned, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' } };
    const orb = { ...receipts, [ORB]: true };
    expect(validateQuestItemLedger(consumed, progress, orb)).toBe(consumed);
    expect(validateQuestActionReceipts(orb, progress, consumed)).toBe(orb);
    expect(() => validateQuestActionReceipts(orb, progress)).toThrow();
    expect(validateQuestItemLedger({}, progress)).toEqual({});
    expect(validateQuestActionReceipts({}, progress)).toEqual({});
  });

  it.each(['missing-tool', 'wrong-tool-source', 'consumed-tool', 'missing-component', 'owned-component',
    'wrong-item', 'wrong-output-source', 'no-council', 'unrecorded-consumption', 'recorded-owned', 'recorded-missing'])(
    'rejects %s graph before normalization', fault => {
      const ledger = structuredClone(owned) as Record<string, { itemId: string; state: 'owned' | 'consumed' }>;
      const actions: Record<string, boolean> = { ...receipts };
      if (fault === 'missing-tool') Reflect.deleteProperty(ledger, CUBE);
      if (fault === 'wrong-tool-source') {
        Reflect.deleteProperty(ledger, CUBE);
        ledger[source('obj-cube')] = { itemId: 'quest/horadric_cube', state: 'owned' };
      }
      if (fault === 'consumed-tool') ledger[CUBE] = { itemId: 'quest/horadric_cube', state: 'consumed' };
      if (fault === 'missing-component') Reflect.deleteProperty(ledger, source('obj-eye'));
      if (fault === 'owned-component') ledger[source('obj-eye')] = { itemId: 'quest/khalims_eye', state: 'owned' };
      if (fault === 'wrong-item') ledger[WILL] = { itemId: 'quest/horadric_staff', state: 'owned' };
      if (fault === 'wrong-output-source') {
        Reflect.deleteProperty(ledger, WILL); ledger[`${GUARDIAN}#objective:obj-transmute`] = { itemId: 'items/khalims_will', state: 'owned' };
      }
      if (fault === 'no-council') Reflect.deleteProperty(actions, COUNCIL);
      if (fault === 'unrecorded-consumption') ledger[WILL] = { itemId: 'items/khalims_will', state: 'consumed' };
      if (fault === 'recorded-owned' || fault === 'recorded-missing') actions[ORB] = true;
      if (fault === 'recorded-missing') Reflect.deleteProperty(ledger, WILL);
      expect(() => validateQuestItemLedger(ledger, progress, actions)).toThrow();
      expect(() => validateQuestActionReceipts(actions, progress, ledger)).toThrow();
    });

  it.each(['missing', 'available', 'claimed-in-progress', 'incomplete-completed'])(
    'rejects Orb with %s Guardian history even with a real consumed input', fault => {
      const state = structuredClone(progress);
      if (fault === 'missing') Reflect.deleteProperty(state, GUARDIAN);
      else state[GUARDIAN] = { id: GUARDIAN,
        status: fault === 'available' ? 'available' : fault === 'incomplete-completed' ? 'completed' : 'inProgress',
        rewardClaimed: fault === 'claimed-in-progress', objectives: { 'obj-kill-mephisto': false } };
      expect(() => validateQuestActionReceipts({ ...receipts, [ORB]: true }, state,
        { ...owned, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' } })).toThrow();
    });
});

describe('retained Guardian reward in the same source graph', () => {
  const STONE = `${GUARDIAN}#reward:questItem`;
  const paidProgress = { ...progress, [GUARDIAN]: { id: GUARDIAN, status: 'completed' as const,
    rewardClaimed: true, objectives: { 'obj-kill-mephisto': true } } };
  const paidItems: QuestItemLedger = { ...owned, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' },
    [STONE]: { itemId: 'items/soulstone_mephisto', state: 'owned' } };
  const paidReceipts = { ...receipts, [ORB]: true };

  it('retains only the exact owned reward with its claimed source and actual Orb/Will graph', () => {
    expect(validateQuestItemLedger(paidItems, paidProgress, paidReceipts)).toBe(paidItems);
    expect(validateQuestActionReceipts(paidReceipts, paidProgress, paidItems)).toBe(paidReceipts);
  });

  it.each(['consumed', 'wrong-source', 'unclaimed', 'no-orb', 'missing-will'] as const)(
    'rejects %s retained reward state', fault => {
      const items = { ...paidItems }, rows = structuredClone(paidProgress), actions = { ...paidReceipts };
      if (fault === 'consumed') items[STONE] = { itemId: 'items/soulstone_mephisto', state: 'consumed' };
      if (fault === 'wrong-source') {
        Reflect.deleteProperty(items, STONE); items[`${QUEST}#reward:questItem`] = { itemId: 'items/soulstone_mephisto', state: 'owned' };
      }
      if (fault === 'unclaimed') rows[GUARDIAN].rewardClaimed = false;
      if (fault === 'no-orb') Reflect.deleteProperty(actions, ORB);
      if (fault === 'missing-will') Reflect.deleteProperty(items, WILL);
      expect(() => validateQuestItemLedger(items, rows, actions)).toThrow();
      expect(() => validateQuestActionReceipts(actions, rows, items)).toThrow();
    });
});

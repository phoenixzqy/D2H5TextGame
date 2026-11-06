import { expect, it } from 'vitest';
import { auditCampaignEconomy, type CampaignEconomy, type CampaignReward } from '../../campaign/economy';
import type { Item } from '@/engine/types/items';

const item: Item = { id: 'earned-1', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 2, ilvl: 2, baseRolls: { defense: 5 }, affixes: [], identified: true, equipped: false };
const initial: CampaignEconomy = { xp: 0, items: [], materials: {}, currencies: { 'rune-shard': 0 } };
const reward: CampaignReward = { xp: 60, addedItems: [item], removedItemIds: [],
  materials: { 'gems/ruby/chipped': 1 }, currencies: { 'rune-shard': 20 } };
const terminal: CampaignEconomy = { xp: 60, items: [{ ...item, equipped: true, equipSlot: 'head' }],
  materials: { 'gems/ruby/chipped': 1 }, currencies: { 'rune-shard': 20 } };

it('conserves XP, concrete material/currency identities and full items across native gear moves', () => {
  expect(auditCampaignEconomy(initial, terminal, [reward])).toEqual({ xp: 60, addedItems: 1 });
});

it('detects duplicate settlement, missing material credits and forged or lost item payloads', () => {
  expect(() => auditCampaignEconomy(initial, terminal, [reward, reward])).toThrow();
  expect(() => auditCampaignEconomy(initial, { ...terminal, xp: 120 }, [reward])).toThrow();
  expect(() => auditCampaignEconomy(initial, { ...terminal, materials: {} }, [reward])).toThrow();
  expect(() => auditCampaignEconomy(initial, { ...terminal, items: [] }, [reward])).toThrow();
  expect(() => auditCampaignEconomy(initial, { ...terminal,
    items: [{ ...item, baseRolls: { defense: 500 } }] }, [reward])).toThrow();
});

it('rejects duplicate owned identities and unjournaled spending', () => {
  expect(() => auditCampaignEconomy(initial, { ...terminal, items: [item, item] }, [reward])).toThrow();
  expect(() => auditCampaignEconomy(initial, { ...terminal, currencies: {} }, [reward])).toThrow();
});

it.each([
  ['gems/diamond/normal', 'gem'], ['runes/ort', 'rune'],
] as const)('audits earned %s insertion and rejects forged socket custody', (materialId, kind) => {
  const before: Item = { ...item, socketCapacity: 1, socketContents: [] };
  const after: Item = { ...before, socketContents: [{ kind, id: materialId }] };
  const start: CampaignEconomy = { ...initial, items: [before], materials: { [materialId]: 1 } };
  const end: CampaignEconomy = { ...initial, items: [after] };
  const socketInsertion = { ordinal: 1, materialId, before, after };
  const insertion: CampaignReward = { xp: 0, addedItems: [], removedItemIds: [], currencies: {},
    materials: { [materialId]: -1 }, socketInsertion };
  expect(auditCampaignEconomy(start, end, [insertion])).toEqual({ xp: 0, addedItems: 0, socketInsertions: 1 });
  expect(() => auditCampaignEconomy({ ...start, materials: {} }, end, [insertion])).toThrow();
  expect(() => auditCampaignEconomy(start, end, [insertion, insertion])).toThrow();
  const forged: Item = { ...after, baseRolls: { defense: 500 } };
  expect(() => auditCampaignEconomy(start, { ...end, items: [forged] },
    [{ ...insertion, socketInsertion: { ...socketInsertion, after: forged } }])).toThrow();
});

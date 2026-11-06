/** Constructed conservation checks; no native campaign win is inferred. */
import { expect, it } from 'vitest';
import type { Item } from '@/engine/types/items';
import { auditCampaignEconomy } from './economy';

const diamond = 'gems/diamond/chipped';
const blade = (): Item => ({ id: 'socketed-earned-blade', baseId: 'items/base/wp1h-short-sword',
  rarity: 'normal', level: 1, ilvl: 1, identified: true, equipped: true, socketCapacity: 2 });
function fixture() {
  const before = blade();
  const after: Item = { ...before, socketContents: [{ kind: 'gem', id: diamond }] };
  const initial = { xp: 0, items: [before], materials: { [diamond]: 2 }, currencies: {} };
  const terminal = { ...initial, items: [after], materials: { [diamond]: 1 } };
  const reward = { xp: 0, addedItems: [], removedItemIds: [], materials: { [diamond]: -1 }, currencies: {},
    socketInsertion: { ordinal: 1, materialId: diamond, before, after } };
  return { initial, terminal, reward };
}

it('conserves one native socket transform without crediting new loot or destroying the item', () => {
  const f = fixture();
  expect(auditCampaignEconomy(f.initial, f.terminal, [f.reward]))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 1 });
});

it('reconciles two sequential inserts on the same original earned item', () => {
  const f = fixture(), before = f.reward.socketInsertion.after;
  const after: Item = { ...before, socketContents: [...before.socketContents ?? [], { kind: 'gem', id: diamond }] };
  const second = { ...f.reward, socketInsertion: { ...f.reward.socketInsertion, ordinal: 2, before, after } };
  const terminal = { ...f.terminal, items: [after], materials: { [diamond]: 0 } };
  expect(auditCampaignEconomy(f.initial, terminal, [f.reward, second]))
    .toMatchObject({ xp: 0, addedItems: 0, socketInsertions: 2 });
});

it.each(['payload', 'material', 'capacity', 'unowned-gem', 'unknown-gem', 'xp'] as const)(
  'rejects a forged socket insertion %s', mutation => {
    const f = fixture();
    if (mutation === 'payload') {
      f.reward.socketInsertion.after = { ...f.reward.socketInsertion.after, baseRolls: { attack: 999 } };
      f.terminal.items = [f.reward.socketInsertion.after];
    }
    if (mutation === 'material') f.reward.materials[diamond] = 0;
    if (mutation === 'capacity') {
      f.reward.socketInsertion.before = { ...f.reward.socketInsertion.before, socketCapacity: 0 };
      f.initial.items = [f.reward.socketInsertion.before];
    }
    if (mutation === 'unowned-gem') f.initial.materials[diamond] = 0;
    if (mutation === 'unknown-gem') f.reward.socketInsertion.materialId = 'gems/unknown/chipped';
    if (mutation === 'xp') { f.reward.xp = 1; f.terminal.xp = 1; }
    expect(() => auditCampaignEconomy(f.initial, f.terminal, [f.reward])).toThrow();
  });

it('rejects reused action ordinals even if the two appended payloads are otherwise valid', () => {
  const f = fixture(), before = f.reward.socketInsertion.after;
  const after: Item = { ...before, socketContents: [...before.socketContents ?? [], { kind: 'gem', id: diamond }] };
  const second = { ...f.reward, socketInsertion: { ...f.reward.socketInsertion, before, after } };
  expect(() => auditCampaignEconomy(f.initial, { ...f.terminal, items: [after], materials: { [diamond]: 0 } },
    [f.reward, second])).toThrow();
});

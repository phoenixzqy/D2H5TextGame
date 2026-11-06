import { afterEach, describe, expect, it, vi } from 'vitest';
import sideDocument from '@/data/quests/side.json';
import mainDocument from '@/data/quests/main.json';
import { dialogues } from '@/data';
import { ANYA as A } from '@/engine/map/anya-quest';
import { captureAnyaAuthority, sameAnyaAuthority } from './anyaContract';
const undos: (() => void)[] = [];
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing authoring fixture'); return value; }
function change(target: object, key: string, value: unknown): void {
  const before = Object.getOwnPropertyDescriptor(target, key); undos.push(() => { if (before) Object.defineProperty(target, key, before); else Reflect.deleteProperty(target, key); }); Reflect.set(target, key, value);
}
afterEach(() => { undos.splice(0).reverse().forEach(undo => { undo(); }); vi.restoreAllMocks(); });
describe('exact authored Anya source contract', () => {
  it('pins real whole reward/NPC/dialogue/main authoring without modifying documents', () => {
    const before = structuredClone({ sideDocument, mainDocument, dialogues }); const authority = captureAnyaAuthority();
    expect(authority.quest.rewards).toEqual({ stat: { all_resist: 10 }, service: 'personalize_item', vendorUnlock: 'vendors/anya_uniques', wishstones: 10 });
    expect(sameAnyaAuthority(authority)).toBe(true); expect({ sideDocument, mainDocument, dialogues }).toEqual(before);
  });
  it.each(['xp', 'gold', 'extra-stat', 'wrong-resistance', 'wrong-service', 'wrong-vendor', 'missing-reward'] as const)('rejects complete reward-bag drift %s', mode => {
    const quest = required(sideDocument.quests.find(row => row.id === A.quest)), before = captureAnyaAuthority();
    const rewards: Record<string, unknown> = structuredClone(quest.rewards);
    if (mode === 'xp') rewards.xp = 1;
    if (mode === 'gold') rewards.gold = 0;
    if (mode === 'extra-stat') rewards.stat = { all_resist: 10, defense: 1 };
    if (mode === 'wrong-resistance') rewards.stat = { all_resist: 11 };
    if (mode === 'wrong-service') rewards.service = 'imbue_item';
    if (mode === 'wrong-vendor') rewards.vendorUnlock = 'other-vendor';
    if (mode === 'missing-reward') Reflect.deleteProperty(rewards, 'stat');
    change(quest, 'rewards', rewards); expect(() => captureAnyaAuthority()).toThrow(); expect(sameAnyaAuthority(before)).toBe(false);
  });
  it.each(['npc', 'objective', 'prerequisite', 'dialogue', 'main'] as const)('rejects exact %s drift', mode => {
    const quest = required(sideDocument.quests.find(row => row.id === A.quest));
    if (mode === 'npc') change(quest, 'giver', 'npc/malah');
    if (mode === 'objective') change(required(quest.objectives[0]), 'npcId', 'npc/malah');
    if (mode === 'prerequisite') change(quest, 'prerequisites', []);
    if (mode === 'dialogue') change(required(dialogues.find(row => row.id === A.dialogueId)), 'npcId', 'malah');
    if (mode === 'main') change(required(mainDocument.quests.find(row => row.id === A.prerequisite.quest)), 'giver', 'npc/anya');
    expect(() => captureAnyaAuthority()).toThrow();
  });
  it('rejects a reward getter before executing it', () => {
    const quest = required(sideDocument.quests.find(row => row.id === A.quest)), before = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
    const getter = vi.fn(() => before.value as unknown); Object.defineProperty(quest, 'rewards', { enumerable: true, configurable: true, get: getter });
    undos.push(() => { Object.defineProperty(quest, 'rewards', before); }); expect(() => captureAnyaAuthority()).toThrow(); expect(getter).not.toHaveBeenCalled();
  });
});

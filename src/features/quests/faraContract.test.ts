import { describe, expect, it } from 'vitest';
import sideDocument from '@/data/quests/side.json';
import { dialogues } from '@/data';
import { FARA } from '@/engine/map/fara-quest';
import { captureFaraAuthority, sameFaraAuthority } from './faraContract';
function quest() { const row = sideDocument.quests.find(row => row.id === FARA.quest); if (!row) throw new Error('Missing Fara row'); return row; }
describe('Fara complete canonical authority', () => {
  it('pins real dialogue, exact catalyst bag and preserved Radament prerequisite', () => {
    const authority = captureFaraAuthority(); expect(authority.quest.rewards).toEqual({ gemShards: 1, wishstones: 10 });
    expect(authority.quest.prerequisites).toEqual([FARA.prerequisite.quest]); expect(authority.dialogue).toMatchObject({ id: FARA.dialogueId, npcId: 'fara', services: [] });
    const row = quest(), name = row.name;
    try { Reflect.set(row, 'name', `${name} altered`); expect(sameFaraAuthority(authority)).toBe(false); }
    finally { Reflect.set(row, 'name', name); }
    expect(sameFaraAuthority(authority)).toBe(true);
  });
  it.each([{ gemShards: 0 }, { gemShards: 2 }, { gemShards: 1, xp: 0 }, { gemShards: 1, gold: 0 },
    { service: 'repair_discount' }, { gemShards: 1 }, { gemShards: 1, wishstones: 1 },
    { gemShards: 1, wishstones: 10, gold: 0 }, { 'gem-shard': 1 }, {}])('refuses entire unsupported bag %j', bag => {
    const row = quest(), before = row.rewards;
    try { Reflect.set(row, 'rewards', bag); expect(() => captureFaraAuthority()).toThrow(); }
    finally { Reflect.set(row, 'rewards', before); }
  });
  it.each(['quest-reward', 'prerequisite', 'dialogue'] as const)('refuses raw %s getters before loader evaluation', field => {
    const row = quest(), dialogue = dialogues.find(doc => doc.id === FARA.dialogueId);
    if (!dialogue) throw new Error('Missing Fara dialogue');
    const target = field === 'dialogue' ? dialogue : row, property = field === 'dialogue' ? 'greetings' : field === 'prerequisite' ? 'prerequisites' : 'rewards';
    const descriptor = Object.getOwnPropertyDescriptor(target, property); if (!descriptor) throw new Error('Missing field'); let reads = 0;
    try {
      Object.defineProperty(target, property, { configurable: true, enumerable: true, get() { reads++; return descriptor.value as unknown; } });
      expect(() => captureFaraAuthority()).toThrow(); expect(reads).toBe(0);
    } finally { Object.defineProperty(target, property, descriptor); }
  });
});

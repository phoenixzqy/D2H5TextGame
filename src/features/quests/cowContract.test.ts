import { describe, expect, it } from 'vitest';
import sideDocument from '@/data/quests/side.json';
import itemDocument from '@/data/quests/items.json';
import monsters from '@/data/monsters/act1.json';
import { subAreas } from '@/data';
import { cowRuntime } from '@/data/loaders/cow-runtime';
import { COW } from '@/engine/map/cow-quest';
import { captureCowAuthority, sameCowAuthority } from './cowContract';
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Cow authority fixture'); return value; }
const quest = () => required(sideDocument.quests.find(row => row.id === COW.quest));
describe('finite complete Cow source authority', () => {
  it('pins real source, recipe, exact native roster and deeply frozen leaf manifest', () => {
    const authority = captureCowAuthority(); expect(authority.quest.rewards).toEqual({ xp: 6000, wishstones: 10 });
    expect(authority.legItem).toMatchObject({ kind: 'portalIngredient', requiresAreaClear: true });
    expect(authority.runtime.actions.receiveTome.npcId).toBe(COW.npc); expect(Object.isFrozen(cowRuntime)).toBe(true);
    expect(Object.isFrozen(cowRuntime.recipe.inputs[0])).toBe(true); expect(sameCowAuthority(authority)).toBe(true);
  });
  it.each([{ xp: 0 }, { xp: 6001 }, { xp: 6000, gold: 0 }, { xp: 6000, wishstones: 1 }, {}])('refuses unsupported whole reward bag %j', bag => {
    const row = quest(), before = row.rewards;
    try { Reflect.set(row, 'rewards', bag); expect(() => captureCowAuthority()).toThrow(); }
    finally { Reflect.set(row, 'rewards', before); }
  });
  it.each(['source', 'recipe', 'clone', 'roster'] as const)('refuses authored %s mutation with no fallback', fault => {
    const authority = captureCowAuthority();
    const item = required(itemDocument.items.find(row => row.id === COW.legItemId));
    const monster = required(monsters.find(row => row.id === COW.king));
    const area = required(subAreas.find(row => row.id === COW.area)), encounter = required(area.questEncounters?.find(row => row.id === COW.encounter));
    const target = fault === 'source' ? item : fault === 'recipe' ? required(quest().objectives[1]) : fault === 'clone' ? monster : encounter;
    const property = fault === 'source' ? 'sourceObjectiveId' : fault === 'recipe' ? 'recipe' : fault === 'clone' ? 'skills' : 'level';
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    try { Reflect.set(target, property, fault === 'clone' ? [] : fault === 'roster' ? 14 : 'forged'); expect(sameCowAuthority(authority)).toBe(false); }
    finally { if (descriptor) Object.defineProperty(target, property, descriptor); else Reflect.deleteProperty(target, property); }
    expect(sameCowAuthority(authority)).toBe(true);
  });
  it.each(['rewards', 'objectives'] as const)('rejects raw %s accessor before evaluating it', property => {
    const row = quest(), descriptor = required(Object.getOwnPropertyDescriptor(row, property)); let reads = 0;
    try { Object.defineProperty(row, property, { configurable: true, enumerable: true, get() { reads++; return descriptor.value as unknown; } });
      expect(() => captureCowAuthority()).toThrow(); expect(reads).toBe(0);
    } finally { Object.defineProperty(row, property, descriptor); }
  });
});

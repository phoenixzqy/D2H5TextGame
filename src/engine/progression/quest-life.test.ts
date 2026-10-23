import { describe, expect, it } from 'vitest';
import { resolveQuestLifeBonus } from './quest-life';
import { deriveEquippedPlayerStats } from './equipped-stats';
import { deriveStats } from './stats';
import type { QuestItemLedger, QuestProgressData } from '../types/save';
import type { Item } from '../types/items';

const QUEST = 'quests/act3-golden-bird';
const JADE = `${QUEST}#objective:obj-find-figurine`;
const BIRD = `${QUEST}#objective:obj-give-cain`;
const POTION = `${QUEST}#reward:questItem`;
const row: QuestProgressData = { id: QUEST, status: 'completed', rewardClaimed: true,
  objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } };
const ledger: QuestItemLedger = {
  [JADE]: { itemId: 'quest/jade_figurine', state: 'consumed' },
  [BIRD]: { itemId: 'quest/golden_bird', state: 'consumed' },
  [POTION]: { itemId: 'items/potion_of_life_q', state: 'consumed' }
};
const coreStats = { strength: 10, dexterity: 25, vitality: 37, energy: 63 };
const hero = { coreStats, derivedStats: { ...deriveStats(coreStats, 13), life: 13 } };
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Golden Bird fixture');
  return value;
}

describe('permanent Golden Bird Life from actual consumed sources', () => {
  it('requires the exact consumed Potion, both real hand-ins and all own completion facts', () => {
    expect(resolveQuestLifeBonus({ [QUEST]: row }, ledger)).toBe(20);
    const progressCases: Record<string, QuestProgressData>[] = [
      {}, { [QUEST]: { ...row, id: 'quests/wrong' } },
      { [QUEST]: { ...row, status: 'inProgress' } },
      { [QUEST]: { ...row, rewardClaimed: false } },
      { [QUEST]: { ...row, objectives: {} } },
      { [QUEST]: { ...row, objectives: { ...row.objectives, 'obj-give-cain': false } } },
      { [QUEST]: Object.create(row) as QuestProgressData },
      { [QUEST]: { ...row, objectives: null } as unknown as QuestProgressData },
      { [QUEST]: { ...row, objectives: Object.create(row.objectives) as Record<string, boolean> } },
      Object.create({ [QUEST]: row }) as Record<string, QuestProgressData>
    ];
    for (const progress of progressCases) expect(resolveQuestLifeBonus(progress, ledger)).toBe(0);
    const ledgerCases: QuestItemLedger[] = [
      {}, { ...ledger, [POTION]: { itemId: 'items/potion_of_life_q', state: 'owned' } },
      { [POTION]: required(ledger[POTION]) },
      { ...ledger, [BIRD]: { itemId: 'quest/golden_bird', state: 'owned' } },
      { ...ledger, [JADE]: { itemId: 'quest/golden_bird', state: 'consumed' } },
      { ...ledger, [POTION]: { itemId: 'items/book_of_skill', state: 'consumed' } },
      Object.create(ledger) as QuestItemLedger,
      { ...ledger, [POTION]: Object.create(required(ledger[POTION])) as QuestItemLedger[string] }
    ];
    for (const receipts of ledgerCases) expect(resolveQuestLifeBonus({ [QUEST]: row }, receipts)).toBe(0);
  });

  it('composes after equipment once, preserves current Life and never mutates the source', () => {
    const equipped: Record<string, Item> = { amulet: {
      id: 'life-amulet', baseId: 'items/base/amu-tin', rarity: 'rare', level: 1,
      identified: true, equipped: true,
      affixes: [{ affixId: 'life', values: new Map([['statMods.life', 31]]) }]
    } };
    const before = structuredClone({ hero, equipped, row, ledger });
    const baseline = deriveEquippedPlayerStats(hero, 13, equipped);
    expect(baseline.lifeMax).toBe(deriveStats(coreStats, 13).lifeMax + 31);
    const result = deriveEquippedPlayerStats(hero, 13, equipped, { [QUEST]: row }, ledger);
    expect(result.lifeMax).toBe(baseline.lifeMax + 20);
    expect(result.life).toBe(13);
    expect(deriveEquippedPlayerStats({ ...hero, derivedStats: result }, 13, equipped,
      { [QUEST]: row }, ledger)).toEqual(result);
    expect({ hero, equipped, row, ledger }).toEqual(before);
  });

  it('refuses unsafe participating Life arithmetic', () => {
    const equipped: Record<string, Item> = { amulet: {
      id: 'unsafe-life', baseId: 'items/base/amu-tin', rarity: 'rare', level: 1,
      identified: true, equipped: true,
      affixes: [{ affixId: 'life', values: new Map([['statMods.life', Number.MAX_SAFE_INTEGER]]) }]
    } };
    expect(() => deriveEquippedPlayerStats(hero, 13, equipped, { [QUEST]: row }, ledger)).toThrow(/Life/);
  });
});

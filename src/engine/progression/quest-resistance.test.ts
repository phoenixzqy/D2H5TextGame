import { describe, expect, it } from 'vitest';
import main from '@/data/quests/main.json';
import { loadQuests } from '@/data/loaders/quests';
import { deriveStats } from './stats';
import { deriveEquippedPlayerStats } from './equipped-stats';
import { resolveQuestResistanceBonus } from './quest-resistance';
import type { QuestProgressData } from '../types/save';
import type { Item } from '../types/items';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing required test fixture');
  return value;
}

const SUN = 'quests/act2-tainted-sun';
const row: QuestProgressData = { id: SUN, status: 'completed',
  objectives: { 'obj-destroy-altar': true }, rewardClaimed: true };
const coreStats = { strength: 10, dexterity: 25, vitality: 37, energy: 63 };
const hero = { coreStats, derivedStats: { ...deriveStats(coreStats, 13), life: 120, mana: 102 } };
function gear(fire: number, cold: number): Record<string, Item> {
  return { amulet: { id: 'resist-amulet', baseId: 'items/base/amu-tin', rarity: 'rare',
    level: 1, identified: true, equipped: true, affixes: [{ affixId: 'legacy-resists',
      values: new Map([['resistances.fire', fire], ['resistances.cold', cold]]) }] } };
}

describe('authored permanent Tainted Sun resistance', () => {
  it('authors the existing XP plus a closed fire/cold pair', () => {
    expect(loadQuests().find(q => q.id === SUN)?.rewards).toEqual({
      xp: 4500, stat: { fire_resist: 30, cold_resist: 30 }
    });
  });
  it('requires all own canonical completion and claim facts', () => {
    expect(resolveQuestResistanceBonus({ [SUN]: row })).toEqual({ fire: 30, cold: 30 });
    const negatives: Readonly<Record<string, QuestProgressData>>[] = [
      {}, { [SUN]: null as unknown as QuestProgressData },
      { [SUN]: { ...row, objectives: null } as unknown as QuestProgressData },
      { [SUN]: { ...row, rewardClaimed: false } },
      { [SUN]: { ...row, status: 'inProgress' } },
      { [SUN]: { ...row, id: 'quests/wrong' } },
      { [SUN]: { ...row, objectives: {} } },
      { [SUN]: { ...row, objectives: { 'obj-destroy-altar': false } } },
      { [SUN]: Object.create(row) as QuestProgressData },
      { [SUN]: { ...row, objectives: undefined } as unknown as QuestProgressData },
      Object.create({ [SUN]: row }) as Record<string, QuestProgressData>,
      { [SUN]: { ...row, objectives: Object.create({ 'obj-destroy-altar': true }) as Record<string, boolean> } }
    ];
    for (const progress of negatives) expect(resolveQuestResistanceBonus(progress)).toEqual({ fire: 0, cold: 0 });
  });
  it('reads the validated authored amounts rather than hardcoding the bonus', () => {
    const quest = required(main.quests.find(q => q.id === SUN));
    const descriptor = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
    try {
      Object.defineProperty(quest, 'rewards', { ...descriptor, value: { xp: 4500,
        stat: { fire_resist: 17, cold_resist: 23 } } });
      expect(resolveQuestResistanceBonus({ [SUN]: row })).toEqual({ fire: 17, cold: 23 });
    } finally { Object.defineProperty(quest, 'rewards', descriptor); }
  });
  it('composes raw over-cap and negative fractional gear once, without healing or input mutation', () => {
    const equipped = gear(91, -12.5), before = structuredClone({ hero, equipped, row });
    const projected = deriveEquippedPlayerStats(hero, 13, equipped, { [SUN]: row });
    expect(projected.resistances).toEqual({ fire: 121, cold: 17.5, lightning: 0,
      poison: 0, physical: 0, arcane: 0 });
    expect(projected.life).toBe(120); expect(projected.mana).toBe(102);
    expect(deriveEquippedPlayerStats({ ...hero, derivedStats: projected }, 13, equipped, { [SUN]: row })).toEqual(projected);
    expect({ hero, equipped, row }).toEqual(before);
    expect(deriveEquippedPlayerStats(hero, 13, equipped).resistances).toMatchObject({ fire: 91, cold: -12.5 });
  });
  it.each([Number.MAX_VALUE, Number.MAX_SAFE_INTEGER - 1])('refuses unsafe participating fire arithmetic %s', value => {
    expect(() => deriveEquippedPlayerStats(hero, 13, gear(value, 0), { [SUN]: row })).toThrow();
  });
});

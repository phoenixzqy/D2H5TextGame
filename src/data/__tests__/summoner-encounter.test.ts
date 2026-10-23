import { describe, expect, it } from 'vitest';
import { resolveChallengeWavePlan, resolveWavePlan } from '@/engine/combat/sub-area-run';
import type { SubAreaDef } from '@/engine/types/maps';
import en from '@/i18n/locales/en/quests.json';
import zh from '@/i18n/locales/zh-CN/quests.json';
import act2 from '../maps/sub-areas/act2.json';
import { loadQuests } from '../loaders/quests';

const areaId = 'areas/act2-arcane-sanctuary';
const summoner = 'monsters/act2.the-summoner';
const area = act2.find(row => row.id === areaId) as SubAreaDef;

describe('Arcane Sanctuary named encounter and ordered objectives', () => {
  it.each(['manual', 'idle'] as const)('%s resolves one Summoner and three ordinary guards', mode => {
    const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 123,
      challengeOrdinal: 0, fallbackArchetypeId: 'monsters/act2.horror-mage', fallbackLevel: 23 });
    const boss = plan.waves.at(-1);
    expect(boss?.spawns.map(row => [row.archetypeId, row.tier])).toEqual([
      [summoner, 'boss'], ...Array.from({ length: 3 }, () => ['monsters/act2.undead-flayer', 'trash'])
    ]);
    expect(boss?.spawns.map(row => row.level)).toEqual([28, 28, 28, 28]);
    expect(boss?.lootTable).toBe('loot/mini-act2');
    expect(plan.defaultLootTable).toBe('loot/trash-act2');
  });

  it('uses the named Summoner and original table in the legacy authored final wave', () => {
    const boss = resolveWavePlan(area, 'monsters/act2.horror-mage', 23, 123).waves.at(-1);
    expect(boss?.spawns.map(row => [row.archetypeId, row.tier, row.level]))
      .toEqual([[summoner, 'boss', 24]]);
    expect(boss?.lootTable).toBe('loot/mini-act2');
  });

  it('binds both objectives to the real map, with a separate journal action after the kill', () => {
    const quest = loadQuests().find(row => row.id === 'quests/act2-arcane-sanctuary');
    expect(quest?.objectives.map(row => [row.id, row.type, row.targetId, row.areaId])).toEqual([
      ['obj-find-summoner', 'kill', summoner, areaId],
      ['obj-read-journal', 'interact', 'objects/horazon_journal', areaId]
    ]);
    expect(quest?.rewards).toEqual({ xp: 7000, skillPoints: 1 });
  });

  it.each([
    ['en', en.byId['act2-arcane-sanctuary'], ['Defeat the Summoner', "Read Horazon's journal"]],
    ['zh-CN', zh.byId['act2-arcane-sanctuary'], ['击败召唤师', '阅读赫拉森的日记']]
  ] as const)('%s labels the two actions in their actual order', (_locale, copy, expected) => {
    expect([copy.obj1, 'obj2' in copy ? copy.obj2 : undefined]).toEqual(expected);
  });
});

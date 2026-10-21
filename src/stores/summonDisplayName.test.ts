import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { CombatUnit } from '@/engine/combat/types';
import { resolveSummonDisplayName } from './summonDisplayName';
import { resolveCombatUnitDisplayName } from './combatHelpers';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

// Literal bilingual names, independent of the production translation resources.
const names = [
  ['skeleton', 'Skeleton Warrior', '骷髅战士'],
  ['clay_golem', 'Clay Golem', '黏土石魔'],
  ['blood_golem', 'Blood Golem', '鲜血石魔'],
  ['iron_golem', 'Iron Golem', '钢铁石魔'],
  ['fire_golem', 'Fire Golem', '火焰石魔'],
  ['skeletal_mage', 'Skeletal Mage', '骷髅法师'],
  ['revived', 'Revived Minion', '复生仆从'],
  ['valkyrie', 'Valkyrie', '女武神'],
  ['dire_wolf', 'Dire Wolf', '恐狼'],
  ['minion', 'Minion', '仆从'],
  ['raven', 'Raven', '乌鸦'],
  ['spirit_wolf', 'Spirit Wolf', '灵狼'],
  ['grizzly', 'Grizzly', '灰熊'],
  ['poison_creeper', 'Poison Creeper', '剧毒藤蔓'],
  ['carrion_vine', 'Carrion Vine', '食腐藤蔓'],
  ['solar_creeper', 'Solar Creeper', '太阳藤蔓'],
  ['shadow_warrior', 'Shadow Warrior', '影子战士'],
  ['shadow_master', 'Shadow Master', '影子大师']
] as const;
function unit(id: string): CombatUnit {
  return { id, name: 'Untranslated template fallback', side: 'player', kind: 'summon',
    summonOwnerId: 'owner', level: 1, tier: 'trash', life: 1, mana: 0,
    stats: { life: 1, lifeMax: 1, mana: 0, manaMax: 0, attack: 1, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`supported combat summon names ${locale}`, () => {
    it.each(names)('localizes %s in explicit and legacy cards and summon logs', async (template, en, zh) => {
      const previous = i18n.language;
      try {
        await i18n.changeLanguage(locale);
        const expected = locale === 'en' ? en : zh;
        expect(i18n.getResource(locale, 'combat', `summons.${template}`)).toBe(expected);
        const legacy = unit(`owner-summon-${template}-7`);
        // Explicit template identity takes precedence over an unrelated legacy ID.
        const explicit: CombatUnit = { ...unit('owner-summon-unknown-template-8'), summonTemplateId: template };
        for (const summon of [explicit, legacy]) {
          expect(resolveSummonDisplayName(summon)).toBe(expected);
          expect(resolveCombatUnitDisplayName(summon)).toBe(expected);
          expect(eventToLocalizedLogEntry({ kind: 'summon', owner: 'owner', summonId: template, unit: summon },
            new Map([['owner', 'Summoner']])))
            .toEqual({ type: 'system', actorId: 'owner', actorName: 'Summoner',
              message: locale === 'en' ? `Summoner summons ${expected}.` : `Summoner 召唤了 ${expected}。` });
        }
      } finally { await i18n.changeLanguage(previous); }
    });
    it.each(['owner-summon-unknown-template-9', 'unrecognized-unit'])('preserves unknown name fallback for %s', async id => {
      const previous = i18n.language;
      try {
        await i18n.changeLanguage(locale);
        const summon = unit(id);
        expect(resolveSummonDisplayName(summon)).toBe('Untranslated template fallback');
        expect(resolveCombatUnitDisplayName(summon)).toBe('Untranslated template fallback');
        expect(eventToLocalizedLogEntry({ kind: 'summon', owner: 'owner', summonId: 'unknown-template', unit: summon },
          new Map([['owner', 'Summoner']]))?.message)
          .toBe(locale === 'en' ? 'Summoner summons Untranslated template fallback.' : 'Summoner 召唤了 Untranslated template fallback。');
      } finally { await i18n.changeLanguage(previous); }
    });
  });
}

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN_common from './locales/zh-CN/common.json';
import zhCN_character from './locales/zh-CN/character.json';
import zhCN_combat from './locales/zh-CN/combat.json';
import zhCN_inventory from './locales/zh-CN/inventory.json';
import zhCN_skills from './locales/zh-CN/skills.json';
import zhCN_settings from './locales/zh-CN/settings.json';
import zhCN_town from './locales/zh-CN/town.json';
import zhCN_map from './locales/zh-CN/map.json';
import zhCN_mercs from './locales/zh-CN/mercs.json';
import zhCN_gacha from './locales/zh-CN/gacha.json';
import zhCN_quests from './locales/zh-CN/quests.json';
import zhCN_monsters from './locales/zh-CN/monsters.json';
import zhCN_items from './locales/zh-CN/items.json';
import zhCN_maps from './locales/zh-CN/maps.json';
import zhCN_rarity from './locales/zh-CN/rarity.json';
import zhCN_damageTypes from './locales/zh-CN/damage-types.json';
import zhCN_card from './locales/zh-CN/card.json';

import en_common from './locales/en/common.json';
import en_character from './locales/en/character.json';
import en_combat from './locales/en/combat.json';
import en_inventory from './locales/en/inventory.json';
import en_skills from './locales/en/skills.json';
import en_settings from './locales/en/settings.json';
import en_town from './locales/en/town.json';
import en_map from './locales/en/map.json';
import en_mercs from './locales/en/mercs.json';
import en_gacha from './locales/en/gacha.json';
import en_quests from './locales/en/quests.json';
import en_monsters from './locales/en/monsters.json';
import en_items from './locales/en/items.json';
import en_maps from './locales/en/maps.json';
import en_rarity from './locales/en/rarity.json';
import en_damageTypes from './locales/en/damage-types.json';
import en_card from './locales/en/card.json';

const resources = {
  'zh-CN': {
    common: zhCN_common,
    character: zhCN_character,
    combat: zhCN_combat,
    inventory: zhCN_inventory,
    skills: zhCN_skills,
    settings: zhCN_settings,
    town: zhCN_town,
    map: zhCN_map,
    mercs: zhCN_mercs,
    gacha: zhCN_gacha,
    quests: zhCN_quests,
    monsters: zhCN_monsters,
    items: zhCN_items,
    maps: zhCN_maps,
    rarity: zhCN_rarity,
    'damage-types': zhCN_damageTypes,
    card: zhCN_card
  },
  en: {
    common: en_common,
    character: en_character,
    combat: en_combat,
    inventory: en_inventory,
    skills: en_skills,
    settings: en_settings,
    town: en_town,
    map: en_map,
    mercs: en_mercs,
    gacha: en_gacha,
    quests: en_quests,
    monsters: en_monsters,
    items: en_items,
    maps: en_maps,
    rarity: en_rarity,
    'damage-types': en_damageTypes,
    card: en_card
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'zh-CN',
    defaultNS: 'common',
    ns: ['common', 'character', 'combat', 'inventory', 'skills', 'settings', 'town', 'map', 'mercs', 'gacha', 'quests', 'monsters', 'items', 'maps', 'rarity', 'damage-types', 'card'],
    interpolation: {
      escapeValue: false // React already escapes
    },
    react: {
      useSuspense: true
    }
  })
  .catch((err: unknown) => {
    console.error('i18n initialization failed:', err);
  });

export default i18n;

import { createInstance } from 'i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as loot from '@/data/loaders/loot';
import type { Item, UniqueItemDef } from '@/engine/types/items';
import { resolveItemDisplay } from './itemDisplay';
import { tDataKey, tItemName } from './i18nKey';

const i18n = createInstance();
const unique: UniqueItemDef = { id: 'items/unique/ormus-charm', baseId: 'items/base/small-charm',
  name: 'items.unique.ormus-charm.name', reqLevel: 1, stats: { statMods: { life: 20, mana: 10 } },
  flavor: 'items.unique.ormus-charm.flavor' };
const definitions = loot.loadUniques().filter(row => row.id !== unique.id);
const sword: Item = { id: 'historical', baseId: 'items/base/wp1h-short-sword', uniqueId: unique.id,
  rarity: 'unique', level: 32, identified: true, equipped: false };
beforeAll(async () => {
  await i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['items', 'inventory'],
    resources: {
      en: { items: { base: { 'wp1h-short-sword': 'Short Sword', 'small-charm': 'Small Charm' },
        unique: { 'ormus-charm': { name: 'Ormus’s Charm', flavor: 'A keepsake.' } } } },
      'zh-CN': { items: { base: { 'wp1h-short-sword': '短剑', 'small-charm': '小护符' },
        unique: { 'ormus-charm': { name: '奥玛斯的护符', flavor: '一份纪念。' } } } }
    } });
});
afterEach(() => { vi.restoreAllMocks(); });

describe.each(['en', 'zh-CN'] as const)('concrete unique presentation %s', locale => {
  it('keeps an old mismatched Ormus string from acquiring the charm name, package or flavor', () => {
    vi.spyOn(loot, 'loadUniques').mockReturnValue([...definitions, unique]);
    const t = i18n.getFixedT(locale), before = structuredClone(sword);
    const display = resolveItemDisplay(sword, t);
    expect(tItemName(t, sword)).toBe(locale === 'en' ? 'Short Sword' : '短剑');
    expect(display.name).toBe(tItemName(t, sword));
    expect(display.unique).toBeUndefined(); expect(display.flavor).toBeUndefined();
    expect(display.definitionStatLines).toEqual([]); expect(sword).toEqual(before);
  });
  it('shows the bound charm and preserves correctly bound existing unique presentation', () => {
    vi.spyOn(loot, 'loadUniques').mockReturnValue([...definitions, unique]);
    const t = i18n.getFixedT(locale), charm = { ...sword, baseId: unique.baseId };
    const display = resolveItemDisplay(charm, t);
    expect(display.unique).toEqual(unique);
    expect(display.name).toBe(locale === 'en' ? 'Ormus’s Charm' : '奥玛斯的护符');
    expect(tItemName(t, charm)).toBe(display.name);
    expect(display.flavor).toBe(locale === 'en' ? 'A keepsake.' : '一份纪念。');
    expect(display.definitionStatLines.map(line => [line.key, line.value]))
      .toEqual([['statMods.life', 20], ['statMods.mana', 10]]);
    const pelta = definitions.find(row => row.id === 'items/unique/pelta-lunata');
    if (!pelta) throw new Error('Missing Pelta fixture');
    const known = { ...sword, baseId: pelta.baseId, uniqueId: pelta.id };
    expect(resolveItemDisplay(known, t).unique).toEqual(pelta);
    expect(tItemName(t, known)).toBe(tDataKey(t, pelta.name));
  });
  it('preserves unknown identities and ordinary generated names', () => {
    const t = i18n.getFixedT(locale), item = { ...sword, uniqueId: 'items/unique/unknown',
      generatedName: { prefix: 'Old', suffix: 'keepsake' } };
    const before = structuredClone(item), display = resolveItemDisplay(item, t);
    expect(display.unique).toBeUndefined();
    expect(display.name).toBe(`Old ${locale === 'en' ? 'Short Sword' : '短剑'} keepsake`);
    expect(tItemName(t, item)).toBe(display.name); expect(item).toEqual(before);
  });
});

/**
 * Unit tests for tDataKey — verifies that dotted data-key strings like
 * `skills.necromancer.confuse.desc` are routed to the correct i18next
 * namespace and return the localized string (not the raw key).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '@/i18n';
import { tDataKey, tItemName } from './i18nKey';
import { resolveItemDisplay } from './itemDisplay';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';

/** Wait for i18next to finish loading all namespaces. */
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => { i18n.on('initialized', resolve); });
  }
});

describe.each(['en', 'zh-CN'] as const)('runeword item names %s', locale => {
  const item: Item = { id: 'named-word', baseId: 'items/base/weapon-staff', rarity: 'runeword',
    level: 20, identified: true, equipped: false, runewordId: 'runewords/leaf' };

  it.each(socketRunewords)('identifies $id consistently in lists and detail headings', word => {
    const t = i18n.getFixedT(locale, 'inventory');
    const instance = { ...item, runewordId: word.id };
    const expected = t(`items:runeword.${word.id.split('/').pop() ?? ''}`);
    expect(expected).not.toContain('runeword.');
    expect(tItemName(t, instance)).toBe(expected);
    expect(resolveItemDisplay(instance, t).name).toBe(expected);
  });

  it('shows the authored Leaf name instead of its staff base or generated affixes', () => {
    const named = { ...item, generatedName: { prefix: 'Old', suffix: 'name' } };
    const t = i18n.getFixedT(locale, 'inventory');
    const expected = locale === 'en' ? 'Leaf' : '叶子';
    expect(tItemName(t, named)).toBe(expected);
    expect(resolveItemDisplay(named, t).name).toBe(expected);
    expect(named.generatedName).toEqual({ prefix: 'Old', suffix: 'name' });
  });

  it('preserves base and generated names for plain sockets and unknown word IDs', () => {
    const t = i18n.getFixedT(locale, 'inventory');
    const baseName = locale === 'en' ? 'Staff' : '法杖';
    const { runewordId: _word, ...plain } = item;
    const ordinary = { ...plain, rarity: 'normal' as const,
      socketContents: [{ kind: 'rune' as const, id: 'runes/tir' }] };
    const unknown = { ...item, runewordId: 'runewords/unknown',
      generatedName: { prefix: 'Old', suffix: 'name' } };
    expect(tItemName(t, ordinary)).toBe(baseName);
    expect(resolveItemDisplay(ordinary, t).name).toBe(baseName);
    expect(tItemName(t, unknown)).toBe(`Old ${baseName} name`);
    expect(resolveItemDisplay(unknown, t).name).toBe(`Old ${baseName} name`);
  });
});

describe('tDataKey', () => {
  // ── Bug 1 ─────────────────────────────────────────────────────────────────
  // skills.necromancer.confuse.desc is an i18n key stored in the JSON data.
  // Before the fix it rendered verbatim; after the fix it must resolve to the
  // localized description in both supported locales.

  it('resolves skills.necromancer.confuse.desc to non-key in zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    const t = i18n.getFixedT('zh-CN');
    const result = tDataKey(t, 'skills.necromancer.confuse.desc');
    // Must NOT equal the raw key
    expect(result).not.toBe('skills.necromancer.confuse.desc');
    // Must be a non-empty translated string
    expect(result.length).toBeGreaterThan(0);
    // Exact authored template; the Skills view supplies dynamic duration and payment values.
    expect(result).toBe('诅咒所有存活敌人，持续{{duration}}。受诅咒者发动新的攻击时，会选择仍敌对我方的其他存活敌人；吸引优先于迷乱。没有合适敌人时恢复正常选敌。不会使我方或已转化的盟友自相残杀。再次施放刷新持续时间，不叠加。消耗{{mana}}点法力；冷却{{cooldown}}秒。');
  });

  it('resolves skills.necromancer.confuse.desc to non-key in en', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.getFixedT('en');
    const result = tDataKey(t, 'skills.necromancer.confuse.desc');
    expect(result).not.toBe('skills.necromancer.confuse.desc');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe('Curses all living enemies for {{duration}}. Their new attacks target other living enemies still hostile to your party. Attract takes priority over Confuse. If no eligible enemy remains, ordinary targeting resumes. Your party and converted allies never turn against each other. Refreshes without stacking. Pays {{mana}} MP; {{cooldown}} s cooldown.');
  });

  // ── Bug 2 ─────────────────────────────────────────────────────────────────
  // Merc / monster skill IDs like mskill-war-cry were shown raw in the UI.
  // The fix adds a mercs:skillName.<id> lookup in both locales.

  it('resolves mercs.skillName.mskill-war-cry to non-key in zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    const t = i18n.getFixedT('zh-CN');
    const result = tDataKey(t, 'mercs.skillName.mskill-war-cry');
    expect(result).not.toBe('mercs.skillName.mskill-war-cry');
    expect(result).toBe('战吼');
  });

  it('resolves mercs.skillName.mskill-war-cry to non-key in en', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.getFixedT('en');
    const result = tDataKey(t, 'mercs.skillName.mskill-war-cry');
    expect(result).not.toBe('mercs.skillName.mskill-war-cry');
    expect(result).toBe('War Cry');
  });

  // ── Safe literal pass-through ─────────────────────────────────────────────
  // tDataKey must not corrupt plain English strings stored in JSON that are
  // not i18n keys (the majority of skill descriptions).

  it('passes through a plain non-key string unchanged', async () => {
    await i18n.changeLanguage('zh-CN');
    const t = i18n.getFixedT('zh-CN');
    const literal = 'Fires an arcane-imbued arrow that costs no ammunition.';
    expect(tDataKey(t, literal)).toBe(literal);
  });

  it('returns the key itself for an empty string', async () => {
    await i18n.changeLanguage('zh-CN');
    const t = i18n.getFixedT('zh-CN');
    expect(tDataKey(t, '')).toBe('');
  });
});

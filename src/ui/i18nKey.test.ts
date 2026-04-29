/**
 * Unit tests for tDataKey — verifies that dotted data-key strings like
 * `skills.necromancer.confuse.desc` are routed to the correct i18next
 * namespace and return the localized string (not the raw key).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '@/i18n';
import { tDataKey } from './i18nKey';

/** Wait for i18next to finish loading all namespaces. */
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => { i18n.on('initialized', resolve); });
  }
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
    // zh-CN translation is "使敌人互相攻击。"
    expect(result).toBe('使敌人互相攻击。');
  });

  it('resolves skills.necromancer.confuse.desc to non-key in en', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.getFixedT('en');
    const result = tDataKey(t, 'skills.necromancer.confuse.desc');
    expect(result).not.toBe('skills.necromancer.confuse.desc');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe('Causes enemies to attack each other.');
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

import { afterEach, describe, expect, it } from 'vitest';
import i18n from './index';

afterEach(async () => {
  await i18n.changeLanguage('zh-CN');
});

describe('document language', () => {
  it('declares the initial Chinese resource language', () => {
    expect(i18n.resolvedLanguage).toBe('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('follows rendered language changes in both directions', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.settings')).toBe('Settings');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('zh-CN');
    expect(i18n.t('nav.settings')).toBe('设置');
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('declares the resource language when a regional locale falls back', async () => {
    await i18n.changeLanguage('en-US');
    expect(i18n.resolvedLanguage).toBe('en');
    expect(i18n.t('nav.settings')).toBe('Settings');
    expect(document.documentElement.lang).toBe('en');
  });
});

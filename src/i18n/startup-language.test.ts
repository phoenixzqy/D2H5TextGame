import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Transform the real store graph outside the individual bootstrap assertions.
beforeAll(async () => { await import('@/stores/metaStore'); }, 15000);

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
});

async function expectStartup(locale: 'en' | 'zh-CN') {
  const { default: i18n } = await import('./index');
  const { useMetaStore } = await import('@/stores/metaStore');
  expect(i18n.resolvedLanguage).toBe(locale);
  expect(document.documentElement.lang).toBe(locale);
  expect(i18n.t('nav.settings')).toBe(locale === 'en' ? 'Settings' : '设置');
  expect(useMetaStore.getState().settings.locale).toBe(locale);
  return { i18n, useMetaStore };
}

describe('startup language before a character exists', () => {
  it('defaults to Chinese on an English browser', async () => {
    await expectStartup('zh-CN');
  });

  it('retains the selected English language across a new startup', async () => {
    const { default: previous } = await import('./index');
    await previous.changeLanguage('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    vi.resetModules();
    const { useMetaStore } = await expectStartup('en');
    // Startup preference must not redefine explicit store-reset defaults.
    useMetaStore.getState().reset();
    expect(useMetaStore.getState().settings.locale).toBe('zh-CN');
  });

  it.each(['zh-CN', 'unsupported'])('starts safely with cached %s', async cached => {
    localStorage.setItem('i18nextLng', cached);
    await expectStartup('zh-CN');
  });

  it('starts in Chinese when preference reads fail', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });
    await expectStartup('zh-CN');
  });
});

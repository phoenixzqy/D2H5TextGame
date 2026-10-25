import { expect, it } from 'vitest';
import i18n from '@/i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
for (const locale of ['en', 'zh-CN'] as const)
  it('localizes live Feral buff and positive heal messages in ' + locale, async () => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const names = new Map([['hero', 'Hero']]);
      expect(
        eventToLocalizedLogEntry(
          { kind: 'buff', target: 'hero', buffId: 'feral-rage', statusBacked: true },
          names
        )?.message
      ).toBe(locale === 'en' ? 'Hero gains buff: Feral Rage.' : 'Hero 获得增益：野性狂暴。');
      expect(
        eventToLocalizedLogEntry({ kind: 'heal', target: 'hero', amount: 4 }, names)?.message
      ).toBe(locale === 'en' ? 'Hero recovers 4 HP.' : 'Hero 恢复了 4 点生命。');
      expect(
        eventToLocalizedLogEntry({ kind: 'buff', target: 'hero', buffId: 'unknown-fixture' }, names)
          ?.message
      ).toBe(
        locale === 'en' ? 'Hero gains buff: unknown-fixture.' : 'Hero 获得增益：unknown-fixture。'
      );
    } finally {
      await i18n.changeLanguage(previous);
    }
  });

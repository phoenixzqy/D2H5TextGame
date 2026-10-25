import { expect, it } from 'vitest';
import i18n from '@/i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
for (const locale of ['en', 'zh-CN'] as const) {
  it(`localizes real Conversion status in logs and skill details (${locale})`, async () => {
    await i18n.changeLanguage(locale);
    const log = eventToLocalizedLogEntry({ kind: 'status', target: 'Monster', statusId: 'converted' });
    expect(log?.message).toContain(locale === 'en' ? 'Converted' : '已转化');
    expect(i18n.t('damage-types:status.converted')).toBe(locale === 'en' ? 'Converted' : '已转化');
    expect(log?.message).not.toMatch(/effect\.status|undefined/);
  });
}

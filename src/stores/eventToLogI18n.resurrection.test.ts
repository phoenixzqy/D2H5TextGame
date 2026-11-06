import { afterEach, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { CombatUnit } from '@/engine/combat/types';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

const previous = i18n.language;
afterEach(async () => { await i18n.changeLanguage(previous); });
for (const locale of ['en', 'zh-CN'] as const) {
  it(`localizes a distinct resurrection event, corpse debit and skill description in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const base = playerToCombatUnit(createMockPlayer('Fixture', 'sorceress'));
    const unit: CombatUnit = { ...base, id: 'body', side: 'enemy', kind: 'monster' };
    const log = eventToLocalizedLogEntry({ kind: 'revive', source: 'shaman', target: 'body', unit },
      new Map([['shaman', 'Shaman'], ['body', 'Fallen']]));
    expect(log).toMatchObject({ type: 'system', actorId: 'shaman', actorName: 'Shaman',
      targetId: 'body', targetName: 'Fallen',
      message: locale === 'en' ? 'Shaman revives Fallen.' : 'Shaman复活了Fallen。' });
    expect(log).not.toHaveProperty('value');
    const consumed = eventToLocalizedLogEntry({ kind: 'message',
      messageKey: 'combat:corpses.consumedResurrection', params: { count: 2, corpseId: 'body' } });
    expect(consumed?.message).toContain(locale === 'en' ? 'Remaining: 2' : '剩余：2');
    expect(i18n.t('combat:effect.revive')).toBe(locale === 'en' ? 'Revived' : '已复活');
    const description = i18n.t('skills:monster.resurrect-fallen.desc');
    expect(description).toContain(locale === 'en' ? 'Each ally can return once' : '每名盟友只能复活一次');
    expect(description).toContain(locale === 'en' ? '5 seconds' : '5秒');
    expect(description).not.toMatch(/skills:|undefined|NaN/);
  });
}

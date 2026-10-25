import { expect, it } from 'vitest';
import i18n from '@/i18n';
import type { BattleEvent } from '@/engine/combat/combat';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

for (const locale of ['en', 'zh-CN'] as const) {
  it.each(['damage', 'dot'] as const)(`names actual Cyclone prevention without inventing Bone Armor (${locale}, %s)`, async kind => {
    await i18n.changeLanguage(locale);
    const event: BattleEvent = kind === 'dot'
      ? { kind, target: 'Hero', amount: 40, cycloneAbsorbed: 40 }
      : { kind, source: 'Enemy', target: 'Hero', damageType: 'fire', amount: 40,
        cycloneAbsorbed: 40, crit: false, dodged: false };
    const log = eventToLocalizedLogEntry(event);
    expect(log?.message).toContain(locale === 'en' ? "Hero's Cyclone Armor prevents 40 damage." : 'Hero的旋风装甲减免了40点伤害。');
    expect(log?.message).not.toMatch(/Bone Armor|骨甲/);
    const mixed = eventToLocalizedLogEntry({ ...event, absorbed: 12 });
    expect(mixed?.message).toContain(locale === 'en' ? 'Bone Armor absorbs 12 damage.' : '骨甲吸收了12点伤害。');
    expect(mixed?.message).toContain(locale === 'en' ? 'Cyclone Armor prevents 40 damage.' : '旋风装甲减免了40点伤害。');
  });
}

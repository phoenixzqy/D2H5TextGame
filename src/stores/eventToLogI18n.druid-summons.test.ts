import { expect, it } from 'vitest';
import i18n from '@/i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

for (const locale of ['en', 'zh-CN'] as const)
  it('localizes real Druid summon control and recovery in ' + locale, async () => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const names = new Map([
        ['vine', 'Vine'],
        ['target', 'Target']
      ]);
      expect(
        eventToLocalizedLogEntry(
          { kind: 'action', actor: 'vine', skillId: null, ...{ corpseRecovery: true as const } },
          names
        )?.message
      ).toBe(
        locale === 'en' ? 'Vine draws recovery from a corpse.' : 'Vine 从尸体中汲取恢复之力。'
      );
      expect(
        eventToLocalizedLogEntry({ kind: 'status', target: 'target', statusId: 'blind' }, names)
          ?.message
      ).toContain(locale === 'en' ? 'Blinded' : '致盲');
      for (const [key, en, zh] of [
        [
          'consumedCarrion',
          'Carrion Vine consumes a corpse to restore its owner’s life. Remaining: 0.',
          '食尸藤消耗一具尸体恢复主人生命。剩余尸体：0。'
        ],
        [
          'consumedSolar',
          'Solar Creeper consumes a corpse to restore its owner’s mana. Remaining: 0.',
          '太阳藤消耗一具尸体恢复主人法力。剩余尸体：0。'
        ]
      ] as const) {
        expect(
          eventToLocalizedLogEntry(
            {
              kind: 'message',
              messageKey: 'combat:corpses.' + key,
              params: { count: 0, corpseId: 'actual-body' }
            },
            names
          )?.message
        ).toBe(locale === 'en' ? en : zh);
      }
      expect(
        eventToLocalizedLogEntry(
          { kind: 'mana', target: 'target', mana: 150, reason: 'solar-creeper' },
          names
        )
      ).toBeNull();
    } finally {
      await i18n.changeLanguage(previous);
    }
  });

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

const cases = [
  {
    classId: 'assassin',
    slug: 'fade',
    canonical: 'assassin.fade',
    rows: [
      ['All Resist', '全抗', 2],
      ['Magical Dodge', '魔法闪避', 0.5]
    ]
  },
  {
    classId: 'assassin',
    slug: 'venom',
    canonical: 'assassin.venom',
    rows: [['Poison Damage', '毒素伤害', 3]]
  }
] as const;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useFormationStore];
beforeEach(() => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const) {
  describe('Assassin shadow details ' + locale, () => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    for (const c of cases) {
      it(c.canonical + ' shows exact current/next effects and native rank-up', () => {
        const fresh = createMockPlayer('Constructed mastery display fixture', c.classId);
        act(() => {
          usePlayerStore
            .getState()
            .setPlayer({
              ...fresh,
              level: 30,
              skillPoints: 1,
              comboOrder: [],
              skillLevels: { 'assassin.burst_of_speed': 1, 'assassin.fade': 1, [c.canonical]: 1 }
            });
        });
        render(
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={null}>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkillsScreen />
              </MemoryRouter>
            </Suspense>
          </I18nextProvider>
        );
        fireEvent.click(screen.getByTestId('skill-node-skills-' + c.classId + '-' + c.slug));
        const panel = screen.getByTestId('skill-detail-panel');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Automatically' : '自动生效');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'next wave' : '下一波');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
        expect(panel).not.toHaveTextContent('{{');
        if (c.slug === 'venom') {
          expect
            .soft(panel)
            .toHaveTextContent(locale === 'en' ? 'successful basic hit' : '普攻命中');
          expect.soft(panel).toHaveTextContent(locale === 'en' ? '5 seconds' : '5秒');
          expect.soft(panel).toHaveTextContent(locale === 'en' ? '5% Attack' : '5%攻击');
        }
        const value = (title: string, label: string) => {
          const section = within(panel)
            .getByRole('heading', { name: title, level: 3 })
            .closest('section');
          if (!section) throw new Error('Missing mastery detail section');
          return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
        };
        for (const [en, zh, bonus] of c.rows) {
          const label = locale === 'en' ? en : zh;
          expect(value(locale === 'en' ? 'Current' : '当前', label)).toHaveTextContent(
            String(bonus) + '%'
          );
          expect(value(locale === 'en' ? 'Next Level' : '下一级', label)).toHaveTextContent(
            String(bonus * 2) + '%'
          );
        }
        fireEvent.click(within(panel).getByRole('button'));
        expect(usePlayerStore.getState().player?.skillLevels?.[c.canonical]).toBe(2);
        expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
        for (const [en, zh, bonus] of c.rows) {
          expect(
            value(locale === 'en' ? 'Current' : '当前', locale === 'en' ? en : zh)
          ).toHaveTextContent(String(bonus * 2) + '%');
        }
      });
    }
  });
}

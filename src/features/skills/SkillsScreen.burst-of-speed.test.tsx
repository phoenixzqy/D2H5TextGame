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
    slug: 'burst-of-speed',
    canonical: 'assassin.burst_of_speed',
    rows: [
      ['Attack Speed', '攻击速度', 2],
      ['Physical Dodge', '物理闪避', 0.5]
    ]
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
  describe('Paid Burst details ' + locale, () => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    for (const c of cases) {
      it(c.canonical + ' shows exact current/next effects and native rank-up', () => {
        const fresh = createMockPlayer('Constructed mastery display fixture', c.classId);
        act(() => {
          usePlayerStore.getState().setPlayer({
            ...fresh,
            level: 30,
            skillPoints: 1,
            comboOrder: [],
            skillLevels: { 'assassin.claw_mastery': 1, [c.canonical]: 1 }
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
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'paid cast' : '支付法力');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? '10 seconds' : '10秒');
        expect
          .soft(panel)
          .toHaveTextContent(locale === 'en' ? 'active priority' : '主动技能优先序');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'next wave' : '下一波');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
        expect(panel).not.toHaveTextContent('{{');
        expect(panel).not.toHaveTextContent(locale === 'en' ? 'movement speed' : '移动速度');
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

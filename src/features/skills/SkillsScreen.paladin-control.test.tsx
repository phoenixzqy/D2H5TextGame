import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';
const cases = [
  { slug: 'zeal', min: 40, max: 60, growth: 4 },
  { slug: 'smite', min: 30, max: 45, growth: 3 },
  { slug: 'charge', min: 80, max: 120, growth: 8 },
  { slug: 'fist-of-heavens', min: 100, max: 150, growth: 10 }
] as const;
beforeEach(() => {
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const)
  describe(locale + ' actual Paladin targeting/control descriptions', () => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    describe.each(cases)('$slug', (c) => {
      it.each([0, 1, 2, 20])('rank%i renders true damage and target/control rules', (rank) => {
        const en = locale === 'en',
          id = 'paladin.' + c.slug.replaceAll('-', '_');
        act(() => {
          usePlayerStore.getState().setPlayer({
            ...createMockPlayer('Synthetic Paladin UI', 'paladin'),
            level: 30,
            skillPoints: 4,
            skillLevels: {
              'paladin.sacrifice': 1,
              'paladin.smite': 1,
              'paladin.holy_bolt': 1,
              'paladin.blessed_hammer': 1,
              [id]: rank
            },
            comboOrder: []
          });
        });
        const before = structuredClone(usePlayerStore.getState().player);
        render(
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={null}>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkillsScreen />
              </MemoryRouter>
            </Suspense>
          </I18nextProvider>
        );
        fireEvent.click(screen.getByTestId('skill-node-skills-paladin-' + c.slug));
        const panel = screen.getByTestId('skill-detail-panel'),
          growth = c.growth * Math.max(0, rank - 1);
        expect(panel).toHaveTextContent(String(c.min + growth) + ' ~ ' + String(c.max + growth));
        if (c.slug === 'zeal') {
          expect(panel).toHaveTextContent(en ? 'Max targets' : '目标上限');
          expect(panel).toHaveTextContent(en ? 'up to 3' : '最多 3');
          expect(panel).toHaveTextContent(en ? 'cross' : '十字');
        } else {
          expect(panel).toHaveTextContent('1 s'.replace('s', en ? 's' : '秒'));
          expect(panel).toHaveTextContent(en ? 'Misses apply no' : '未命中不附加');
          if (c.slug === 'fist-of-heavens')
            expect(panel).toHaveTextContent(en ? 'Repeated Paralyze can fail' : '重复麻痹可能失败');
          else expect(panel).toHaveTextContent(en ? '0.5 s' : '0.5 秒');
          if (c.slug === 'charge')
            expect(panel).toHaveTextContent(en ? 'position stays the same' : '位置不变');
        }
        expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
        if (c.slug === 'charge') expect(panel).not.toHaveTextContent(en ? '1 turn' : '1 回合');
        if (rank === 20)
          expect(panel).toHaveTextContent(en ? 'Max level reached.' : '已达到最高等级。');
        if (rank > 0 && rank < 20)
          expect(
            within(panel).getByRole('heading', { name: en ? 'Next Level' : '下一级', level: 3 })
          ).toBeVisible();
        expect(usePlayerStore.getState().player).toEqual(before);
      });
    });
  });

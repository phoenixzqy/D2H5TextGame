import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from '@/features/skills/SkillsScreen';

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
  it.each([0, 1, 18, 20])(
    `shows ordered Ice Arrow damage and freeze/chill rules (${locale}, rank%i)`,
    async (rank) => {
      await i18n.changeLanguage(locale);
      act(() => {
        usePlayerStore
          .getState()
          .setPlayer({
            ...createMockPlayer('Synthetic Ice Arrow preview', 'amazon'),
            level: 30,
            skillPoints: 2,
            comboOrder: [],
            skillLevels: { 'skills-amazon-ice-arrow': rank }
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
      fireEvent.click(screen.getByTestId('skill-node-skills-amazon-ice-arrow'));
      const panel = screen.getByTestId('skill-detail-panel'),
        safe = Math.max(1, rank);
      for (const phrase of locale === 'en'
        ? [
            'single-target attempt',
            `${String(55 + 5 * (safe - 1))}–${String(80 + 5 * (safe - 1))}`,
            'Cold base damage',
            'Freeze for 1 s',
            'bosses: 0.5 s',
            'Chill for 2 s',
            '50%',
            '15 MP',
            '1 s cooldown'
          ]
        : [
            '单体攻击',
            `${String(55 + 5 * (safe - 1))}～${String(80 + 5 * (safe - 1))}`,
            '冰冷基础伤害',
            '冰封1 秒',
            '首领0.5 秒',
            '冰冻减速持续2 秒',
            '50%',
            '15 点法力',
            '冷却1 秒'
          ])
        expect(panel).toHaveTextContent(phrase);
      if (rank === 20)
        expect(panel).toHaveTextContent(
          locale === 'en' ? 'Max level reached.' : '已达到最高等级。'
        );
      expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\.|combat:summons/);
      expect(usePlayerStore.getState().player).toEqual(before);
    }
  );

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

function section(panel: HTMLElement, name: string) {
  const node = within(panel).getByRole('heading', { name, level: 3 }).closest('section');
  if (!node) throw new Error('Missing presentation section');
  return node;
}
function value(panel: HTMLElement, label: string) {
  const node = within(panel).getByText(label, { selector: 'dt', exact: true }).nextElementSibling;
  if (!node) throw new Error('Missing presentation row');
  return node;
}
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
  describe('Sacrifice ' + locale + ' life tradeoff', () => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    it.each([0, 1, 2, 20])('rank%i renders current/next/MAX cost and lethal rules', (rank) => {
      const en = locale === 'en';
      act(() => {
        usePlayerStore.getState().setPlayer({
          ...createMockPlayer('Synthetic Sacrifice UI', 'paladin'),
          level: 30,
          skillPoints: 2,
          skillLevels: { 'paladin.sacrifice': rank },
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
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-sacrifice'));
      const panel = screen.getByTestId('skill-detail-panel'),
        current = section(
          panel,
          rank === 0 ? (en ? 'Learned at Lv. 1' : '学习后 Lv.1') : en ? 'Current' : '当前'
        );
      expect(value(current, en ? 'Self damage' : '自身伤害')).toHaveTextContent('8%');
      expect(value(current, en ? 'Self damage' : '自身伤害')).toHaveTextContent('1');
      expect(panel).toHaveTextContent(en ? 'can kill' : '可能致死');
      expect(panel).toHaveTextContent(
        en ? 'Absorption and overkill do not count' : '吸收伤害和过量伤害不计入'
      );
      expect(panel).toHaveTextContent(
        en ? 'bypasses your defenses and shields' : '无视自身减伤与护盾'
      );
      expect(panel).toHaveTextContent(
        `${String(40 + 4 * Math.max(0, rank - 1))} ~ ${String(60 + 4 * Math.max(0, rank - 1))}`
      );
      if (rank > 0) {
        const next = section(panel, en ? 'Next Level' : '下一级');
        if (rank === 20)
          expect(next).toHaveTextContent(en ? 'Max level reached.' : '已达到最高等级。');
        else expect(value(next, en ? 'Self damage' : '自身伤害')).toHaveTextContent('8%');
      }
      expect(panel.textContent).not.toMatch(/\{\{|details\.|undefined|NaN/);
      expect(usePlayerStore.getState().player).toEqual(before);
    });
  });

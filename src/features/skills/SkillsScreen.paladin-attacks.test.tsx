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
  describe.each(['holy-bolt', 'blessed-hammer', 'vengeance'])(
    `Paladin %s ${locale} details`,
    (slug) => {
      beforeEach(async () => {
        await i18n.changeLanguage(locale);
      });
      it.each([0, 1, 2, 20])(
        'renders truthful current/next/preview/MAX rules at allocated rank%i',
        (rank) => {
          const id = 'paladin.' + slug.replaceAll('-', '_'),
            en = locale === 'en';
          act(() => {
            usePlayerStore.getState().setPlayer({
              ...createMockPlayer('Synthetic Paladin UI', 'paladin'),
              level: 30,
              skillPoints: 2,
              comboOrder: [],
              skillLevels: {
                'paladin.holy_bolt': 1,
                'paladin.sacrifice': 1,
                'paladin.zeal': 1,
                [id]: rank
              }
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
          fireEvent.click(screen.getByTestId('skill-node-skills-paladin-' + slug));
          const panel = screen.getByTestId('skill-detail-panel');
          const current = section(
            panel,
            rank === 0 ? (en ? 'Learned at Lv. 1' : '学习后 Lv.1') : en ? 'Current' : '当前'
          );
          if (slug === 'holy-bolt') {
            expect(value(current, en ? 'Life recovery' : '生命恢复')).toHaveTextContent('50%');
            expect(panel).toHaveTextContent(en ? 'actual enemy HP removed' : '直接实际生命损失');
            expect(panel).toHaveTextContent(
              en ? 'Absorbed damage and overkill do not count' : '吸收伤害和过量伤害不计入'
            );
            const growth = 5 * Math.max(0, rank - 1);
            expect(panel).toHaveTextContent(`${String(50 + growth)} ~ ${String(70 + growth)}`);
          }
          if (slug === 'blessed-hammer') {
            expect(value(current, en ? 'Magic resist bypass' : '魔抗穿透')).toHaveTextContent(
              en ? 'Flat MR only' : '仅固定魔法抗性'
            );
            expect(panel).toHaveTextContent(en ? 'percentage resistance' : '百分比抗性');
            expect(panel).toHaveTextContent(en ? 'all enemies' : '所有敌人');
          }
          if (slug === 'vengeance') {
            expect(value(current, en ? 'Composite strike' : '复合打击')).toHaveTextContent(
              en ? 'Shared hit and critical roll' : '共用命中与暴击判定'
            );
            expect(value(current, en ? 'Burn per stack' : '每层燃烧')).toHaveTextContent(
              en ? 'Fire component' : '火焰分量'
            );
            const growth = 3 * Math.max(0, rank - 1);
            expect(panel).toHaveTextContent(
              en
                ? `${String(30 + growth)} ~ ${String(50 + growth)} Fire`
                : `${String(30 + growth)} ~ ${String(50 + growth)} 点火焰`
            );
            expect(panel).toHaveTextContent(en ? 'Chill for 2 s' : '冰缓 2 秒');
            expect(panel).toHaveTextContent(en ? 'Paralyze for 1 s' : '麻痹 1 秒');
            expect(panel).toHaveTextContent(en ? 'A miss applies none' : '未命中不附加');
          }
          if (rank > 0) {
            const next = section(panel, en ? 'Next Level' : '下一级');
            if (rank === 20)
              expect(next).toHaveTextContent(en ? 'Max level reached.' : '已达到最高等级。');
            else if (slug === 'blessed-hammer')
              expect(value(next, en ? 'Magic resist bypass' : '魔抗穿透')).toHaveTextContent(
                en ? 'Flat MR only' : '仅固定魔法抗性'
              );
            else if (slug === 'vengeance')
              expect(value(next, en ? 'Composite strike' : '复合打击')).toHaveTextContent(
                en ? 'Shared hit and critical roll' : '共用命中与暴击判定'
              );
          }
          expect(panel.textContent).not.toMatch(/\{\{|details\.|undefined|NaN/);
          expect(usePlayerStore.getState().player).toEqual(before);
        }
      );
    }
  );

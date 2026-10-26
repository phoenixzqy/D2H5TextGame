import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 18, 20])(
  `shows finite actual Terror rules and current/next/MAX payment (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Terror preview', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-necromancer-terror': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-terror'));
    const panel = screen.getByTestId('skill-detail-panel');
    const cooldown = rank === 18 ? 2.1 : rank === 20 ? 2 : 3;
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'fear for 1 s', '0.5 s against bosses and chapter bosses',
        'preventing scheduled actions and interrupting channels', 'Pays 7 MP', `${String(cooldown)} s cooldown`,
        'Refreshes without stacking']
      : ['所有存活敌人', '持续1 秒', '首领与章节首领持续0.5 秒',
        '阻止其按原计划行动并打断引导', '消耗7 点法力', `${String(cooldown)} 秒冷却`, '刷新持续时间，不叠加'])
      expect(panel).toHaveTextContent(phrase);
    if (rank === 18) {
      const next = screen.getByRole('heading', { name: locale === 'en' ? 'Next Level' : '下一级' }).closest('section');
      if (!next) throw new Error('Missing next-rank section');
      expect(next).toHaveTextContent(locale === 'en' ? '2.1 s' : '2.1 秒');
      expect(within(next).getByText(locale === 'en' ? 'Enemy effect duration' : '敌方效果持续时间').parentElement)
        .toHaveTextContent(locale === 'en' ? '1 s' : '1 秒');
    }
    if (locale === 'zh-CN') expect(panel.textContent).not.toMatch(/\bterror\b/i);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

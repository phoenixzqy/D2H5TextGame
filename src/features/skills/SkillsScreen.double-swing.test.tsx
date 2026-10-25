import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 2, 20])(
  `shows truthful Double Swing passes and damage per attempt (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Double Swing UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [],
      skillLevels: { 'skills-barbarian-bash': 1, ...(rank === 0 ? {} : { 'barbarian.double_swing': rank }) } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-double-swing'));
    const panel = screen.getByTestId('skill-detail-panel');
    const growth = 4 * Math.max(0, rank - 1);
    for (const phrase of locale === 'en'
      ? ['up to 3 living enemies', 'densest cross', '2 independent attempts',
        String(40 + growth) + '–' + String(60 + growth) + ' Physical base damage per attempt',
        'skip dead originals', 'once per cast', 'next wave', 'Attack attempts per target']
      : ['最多3名存活敌人', '十字', '2次攻击',
        String(40 + growth) + '～' + String(60 + growth) + '点物理基础伤害',
        '跳过已死原目标', '每次施放', '下一波', '每名目标攻击次数'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });

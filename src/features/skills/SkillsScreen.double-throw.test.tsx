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
  `shows truthful Double Throw passes and damage per attempt (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Double Throw UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [],
      skillLevels: { 'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1, ...(rank === 0 ? {} : { 'barbarian.double_throw': rank }) } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-double-throw'));
    const panel = screen.getByTestId('skill-detail-panel');
    const growth = 5 * Math.max(0, rank - 1);
    for (const phrase of locale === 'en'
      ? ['2 total independent throws', 'first two living enemies', 'enemy summons first',
        String(50 + growth) + '–' + String(75 + growth) + ' Physical base damage per attempt',
        'lone original can receive both', 'outside the original pool', 'once per cast', 'next wave', 'Attack attempts per cast']
      : ['总计2次独立投掷', '最先两名存活敌人', '优先敌方召唤物',
        String(50 + growth) + '～' + String(75 + growth) + '点物理基础伤害',
        '唯一原目标可承受两次', '原目标池以外', '每次施放', '下一波', '每次施放攻击次数'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });

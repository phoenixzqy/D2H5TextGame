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
  `shows truthful Frenzy passes and damage per attempt (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Frenzy UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [],
      skillLevels: { 'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1, 'skills-barbarian-double-throw': 1, ...(rank === 0 ? {} : { 'barbarian.frenzy': rank }) } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-frenzy'));
    const panel = screen.getByTestId('skill-detail-panel');
    const growth = 8 * Math.max(0, rank - 1);
    for (const phrase of locale === 'en'
      ? ['2 independent attempts', 'same original enemy', '5% attack speed', 'up to 5 stacks', '6 s',
        String(85 + growth) + '–' + String(120 + growth) + ' Physical base damage per attempt',
        'Misses', 'once per cast', 'next wave', 'Attack attempts per cast']
      : ['2次独立攻击', '同一原目标', '5%攻击速度', '最多5层', '6 秒',
        String(85 + growth) + '～' + String(120 + growth) + '点物理基础伤害',
        '未命中', '每次施放', '下一波', '每次施放攻击次数'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });

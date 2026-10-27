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

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 18, 20])(
  `shows finite actual Slow Missiles rules and current/next/MAX payment (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Slow Missiles preview', 'amazon'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-amazon-slow-missiles': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-amazon-slow-missiles'));
    const panel = screen.getByTestId('skill-detail-panel'), cost = Math.round(10 - .1 * (Math.max(1, rank) - 1));
    const cooldown = Math.max(1, Number((3 - .05 * (Math.max(1, rank) - 1)).toFixed(1)));
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'for 6 s', '33% normal speed', 'shots already in flight',
        'enemy attack cadence stay unchanged', 'defenses resolve on impact', `Pay ${String(cost)} MP`, `${String(cooldown)} s cooldown`]
      : ['所有存活敌人', '6 秒', '正常速度的33%', '已发射',
        '敌人出手频率不变', '防御在命中时结算', `消耗${String(cost)} 点法力`, `冷却${String(cooldown)} 秒`]) expect(panel).toHaveTextContent(phrase);
    if (rank === 18) expect(panel).toHaveTextContent(locale === 'en' ? 'Next LevelMana Cost8' : '下一级法力消耗8');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

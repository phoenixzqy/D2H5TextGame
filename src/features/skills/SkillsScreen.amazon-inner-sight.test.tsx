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
  `shows finite actual Inner Sight rules and current/next/MAX payment (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Inner Sight preview', 'amazon'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-amazon-inner-sight': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-amazon-inner-sight'));
    const panel = screen.getByTestId('skill-detail-panel'), cost = Math.round(5 - .05 * (Math.max(1, rank) - 1));
    const cooldown = Math.max(1, Number((3 - .05 * (Math.max(1, rank) - 1)).toFixed(1)));
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'for 8 s', 'ordinary Defense by 25%', 'Physical, Fire, Poison and Thorns',
        'stronger Inner Sight applies once', `Pay ${String(cost)} MP`, `${String(cooldown)} s cooldown`]
      : ['所有存活敌人', '持续8 秒', '普通防御降低25%', '物理、火焰、毒素与荆棘',
        '仅取较强效果生效一次', `消耗${String(cost)} 点法力`, `${String(cooldown)} 秒冷却`]) expect(panel).toHaveTextContent(phrase);
    if (rank === 18) expect(panel).toHaveTextContent(locale === 'en' ? 'Next LevelMana Cost4' : '下一级法力消耗4');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

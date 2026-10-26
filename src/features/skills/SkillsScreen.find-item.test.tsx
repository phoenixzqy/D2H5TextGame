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
  `Find Item explains paid shared-corpse chance and victory collection (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic search UI', 'barbarian'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels: {
        'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-find-item'));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    const chance = 20 + at - 1, cost = Math.round(7 - .1 * (at - 1));
    for (const phrase of locale === 'en'
      ? [`${String(chance)}%`, `${String(cost)} MP`, 'one shared enemy corpse', 'Search success chance',
        'ordinary loot roll', 'victory', 'Failure still', 'no extra XP', 'defeat or flee', 'next wave']
      : [`${String(chance)}%`, `${String(cost)} 点法力`, '一具共享敌人尸体', '搜索成功率',
        '普通掉落', '胜利', '失败仍', '不额外增加经验', '战败或逃跑', '下一波']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(panel).not.toHaveTextContent(locale === 'en' ? 'Magic Find' : '魔法寻找');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(`${String(20 + rank)}%`);
  });

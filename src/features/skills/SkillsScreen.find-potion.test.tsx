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
  `Find Potion explains finite shared-body recovery and actual current/next/MAX ranks (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic recovery UI', 'barbarian'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels: { 'skills-barbarian-find-potion': rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-find-potion'));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    const life = Number((10 + .5 * (at - 1)).toFixed(4)), mana = Number((5 + .25 * (at - 1)).toFixed(4));
    for (const phrase of locale === 'en'
      ? [`${String(life)}%`, `${String(mana)}%`, 'one shared enemy corpse', '2 MP', 'rounded down',
        'no potion item', 'net mana', 'next wave', 'Life recovered', 'Mana recovered']
      : [`${String(life)}%`, `${String(mana)}%`, '一具共享敌人尸体', '2 点法力', '向下取整',
        '不生成药水物品', '净法力', '下一波', '生命恢复', '法力恢复']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(panel).not.toHaveTextContent(locale === 'en' ? 'Magic Find' : '魔法寻找');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    if (rank > 0 && rank < 20) {
      const nextLife = Number((10 + .5 * rank).toFixed(4));
      expect(panel).toHaveTextContent(`${String(nextLife)}%`);
    }
  });

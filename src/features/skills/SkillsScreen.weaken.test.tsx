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
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 18, 20])(
  `shows finite actual Weaken rules and current/next/MAX payment (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Weaken preview', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-necromancer-weaken': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-weaken'));
    const panel = screen.getByTestId('skill-detail-panel'), cost = Math.round(6 - .2 * (Math.max(1, rank) - 1));
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'for 3 s', 'outgoing direct damage by 33%', 'before resistance and flat mitigation',
        'AttackSpeed and existing damage-over-time rates stay unchanged', `Pays ${String(cost)} MP`, '3 s cooldown']
      : ['所有存活敌人', '持续3 秒', '对外直接伤害降低33%', '抗性与固定减伤之前',
        '攻击速度与已有持续伤害速率保持不变', `消耗${String(cost)} 点法力`, '3 秒冷却']) expect(panel).toHaveTextContent(phrase);
    if (rank === 18) expect(panel).toHaveTextContent(locale === 'en' ? 'Next LevelMana Cost2' : '下一级法力消耗2');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

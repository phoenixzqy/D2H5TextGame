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
  `shows actual Dim Vision duration, accuracy, payment and current/next/MAX (${locale},rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Dim Vision preview', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-necromancer-dim-vision': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-dim-vision'));
    const panel = screen.getByTestId('skill-detail-panel'), cost = rank < 2 ? 9 : rank === 18 ? 6 : 5;
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'for 3 s', 'Physical / thorns hit chance by 50 percentage points', '5% minimum',
        'Successful-hit damage', 'existing damage-over-time rates stay unchanged', 'only the stronger penalty', `Pays ${String(cost)} MP`]
      : ['所有存活敌人', '持续3 秒', '物理与荆棘命中率降低50个百分点', '最低5%', '命中后的伤害',
        '已有持续伤害速率保持不变', '仅取较强惩罚', `消耗${String(cost)}点法力`]) expect(panel).toHaveTextContent(phrase);
    if (rank === 18) expect(panel).toHaveTextContent(locale === 'en' ? 'Next LevelMana Cost5' : '下一级法力消耗5');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

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
  `shows native Hammer Arcane/Stun rules (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Hammer UI', 'assassin'),
      level: 30, skillPoints: 2, comboOrder: [],
      skillLevels: rank === 0 ? {} : { 'assassin.psychic_hammer': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-assassin-psychic-hammer'));
    const panel = screen.getByTestId('skill-detail-panel'), growth = 3 * Math.max(0, rank - 1);
    expect(panel).toHaveTextContent(String(30 + growth) + ' ~ ' + String(45 + growth));
    for (const phrase of locale === 'en'
      ? ['one enemy', 'Arcane base damage', 'Stun for 1 s', 'bosses: 0.5 s', 'without moving', 'Misses apply no Stun', 'next wave']
      : ['一名敌人', '奥术基础伤害', '眩晕1 秒', '首领0.5 秒', '位置不变', '未命中不附加眩晕', '下一波'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });

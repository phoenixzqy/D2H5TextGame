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
  `shows truthful paid Leap control and follow-up (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Leap UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [],
      skillLevels: rank === 0 ? {} : { 'barbarian.leap': rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-leap'));
    const panel = screen.getByTestId('skill-detail-panel'), bonus = String(Math.max(1, rank));
    for (const phrase of locale === 'en'
      ? ['all living enemies', 'Stun for 1 s', 'bosses: 0.5 s', 'without moving',
        'Physical damage by ' + bonus + '% for 3 s', 'no direct damage', 'cannot be recast', 'next wave']
      : ['全部存活敌人', '眩晕1 秒', '首领0.5 秒', '位置不变', '物理伤害提高' + bonus + '%，持续3 秒',
        '不造成直接伤害', '期间不会重施', '下一波'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    for (const key of ['combat:effect.buff.leap', 'combat:effect.status.leap'])
      expect(i18n.t(key)).toBe(locale === 'en' ? 'Leap' : '跳跃');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });

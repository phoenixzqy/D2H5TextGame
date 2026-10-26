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
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 20])(
  `Grim Ward explains real corpse, finite pulses and one-active limits (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic ward UI', 'barbarian'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels: { 'skills-barbarian-find-potion': 1,
        'skills-barbarian-find-item': 1, 'skills-barbarian-grim-ward': rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-grim-ward'));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank), duration = 6 + .5 * (at - 1);
    for (const phrase of locale === 'en'
      ? ['one shared enemy corpse', `${String(duration)}s`, 'every 2s', '1s', 'bosses: 0.5s', 'one active ward',
        'wave ends', 'Ward duration', 'Fear per pulse']
      : ['一具共享敌人尸体', `${String(duration)}秒`, '每2秒', '1秒', '首领为0.5秒', '一个生效图腾',
        '本波结束', '图腾持续时间', '每次恐惧']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(panel).not.toHaveTextContent(locale === 'en' ? 'Magic Find' : '魔法寻找');
    if (rank === 1) expect(panel).toHaveTextContent(locale === 'en' ? '6.5s' : '6.5秒');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
  });

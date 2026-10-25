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
for (const locale of ['en', 'zh-CN'] as const) for (const skill of ['concentrate', 'berserk', 'stun'] as const) {
  it.each([0, 1, 2, 20])(`shows actual ${skill} behavior (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic attack UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'skills-barbarian-bash': 1,
        'skills-barbarian-stun': 1, 'skills-barbarian-concentrate': 1,
        ['skills-barbarian-' + skill]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-' + skill));
    const panel = screen.getByTestId('skill-detail-panel');
    const expected = skill === 'concentrate'
      ? locale === 'en' ? ['Defense by ' + String(Math.max(1, rank) * 5) + '% for 1 s', 'even if the attack misses', '10 MP']
        : ['防御提高' + String(Math.max(1, rank) * 5) + '%，持续1 秒', '未命中也会', '10 点法力']
      : skill === 'berserk' ? locale === 'en' ? ['100% of Attack', 'entire hit as Arcane', '20 MP']
        : ['100%攻击力', '全部转为奥术', '20 点法力']
        : locale === 'en' ? ['Stun for 1 s', 'bosses: 0.5 s', 'Misses do not', '8 MP']
          : ['眩晕1 秒', '首领0.5 秒', '未命中不会', '8 点法力'];
    for (const phrase of expected) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

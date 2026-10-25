import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

const descriptions = {
  en: '8 seconds', 'zh-CN': '持续8秒'
} as const;
function mount(rank: number) {
  const levels: Record<string, number> = { 'paladin.sacrifice': 1, 'paladin.zeal': 1, 'paladin.vengeance': 1 };
  if (rank > 0) levels['paladin.conversion'] = rank;
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Conversion UI', 'paladin'),
    level: 30, skillPoints: 2, skillLevels: levels, comboOrder: [] }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-paladin-conversion'));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 19, 20])(`explains Conversion duration, eligibility and expiry (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale); const panel = mount(rank);
    expect(panel).toHaveTextContent(descriptions[locale]);
    expect(panel).toHaveTextContent(locale === 'en' ? 'bosses take damage only' : '首领只受伤害');
    expect(panel).toHaveTextContent(locale === 'en' ? 'original enemy identity' : '保留原敌人身份');
    if (locale === 'zh-CN') expect(panel).toHaveTextContent('已转化');
    expect(panel.textContent).not.toMatch(/\{\{|skills:|details\.passiveStat/);
    if (rank === 0) {
      const before = structuredClone(usePlayerStore.getState().player);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['paladin.conversion']).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
    }
  });
}

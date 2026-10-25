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

function mount(rank: number) {
  const levels: Record<string, number> = { 'amazon.cold_arrow': 1, 'amazon.ice_arrow': 1 };
  if (rank > 0) levels['amazon.freezing_arrow'] = rank;
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Freeze UI', 'amazon'),
    level: 30, skillPoints: 2, skillLevels: levels, comboOrder: [] }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-amazon-freezing-arrow'));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 19, 20])(`explains actual Freezing Arrow area, chance and fixed lifecycle (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale); const panel = mount(rank);
    for (const text of locale === 'en'
      ? ['3×3', '15%', 'Chill for 2 seconds', 'Freeze for 1 second', '0.5 seconds', 'landed target']
      : ['3×3', '15%', '冰冷持续2秒', '冰冻持续1秒', '0.5秒', '每个命中目标']) {
      expect(panel).toHaveTextContent(text);
    }
    expect(panel.textContent).not.toMatch(/cone|锥形|\{\{|skills:|details\.passiveStat/);
    if (rank === 0) {
      const before = structuredClone(usePlayerStore.getState().player);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['amazon.freezing_arrow']).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
    }
  });
}

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

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 19, 20])(`explains paid finite Cloak and actual Blind (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Cloak UI', 'assassin'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { 'assassin.psychic_hammer': 1,
        ...(rank > 0 ? { 'assassin.cloak_of_shadows': rank } : {}) } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-assassin-cloak-of-shadows'));
    const panel = screen.getByTestId('skill-detail-panel');
    for (const text of locale === 'en'
      ? ['paid cast', '8 seconds', '3%', '0.5', '20 percentage points', 'all current enemies', 'cannot refresh', 'next wave']
      : ['支付法力', '8秒', '3%', '0.5', '20个百分点', '当前所有敌人', '不会重复施放', '下一波'])
      expect(panel).toHaveTextContent(text);
    expect(panel.textContent).not.toMatch(/\{\{|skills:|details\.passiveStat|cloak-of-shadows/);
    if (rank === 0) {
      const before = structuredClone(usePlayerStore.getState().player);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['assassin.cloak_of_shadows']).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
    }
  });
}

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
  act(() => {
    usePlayerStore.getState().setPlayer({
      ...createMockPlayer('Synthetic Dragon Talon UI', 'assassin'),
      level: 30,
      skillPoints: 2,
      skillLevels: rank > 0 ? { 'assassin.dragon_talon': rank } : {},
      comboOrder: []
    });
  });
  render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkillsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
  fireEvent.click(screen.getByTestId('skill-node-skills-assassin-dragon-talon'));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => {
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 19, 20])(
    `explains Dragon Talon per-attempt damage and original target limits (${locale}, rank%i)`,
    async (rank) => {
      await i18n.changeLanguage(locale);
      const panel = mount(rank);
      for (const text of locale === 'en'
        ? [
            'Up to 3 independent Physical kick attempts',
            'per attempt',
            'original target',
            'Misses consume attempts',
            'caster dies',
            'once per cast',
            'Attack attempts per cast'
          ]
        : [
            '最多3次独立物理踢击尝试',
            '每次尝试',
            '原目标',
            '未命中也消耗次数',
            '施法者死亡',
            '每次施放仅',
            '每次施放攻击次数'
          ])
        expect(panel).toHaveTextContent(text);
      expect(panel.textContent).not.toMatch(/\{\{|skills:|details\.strikesPerCast/);
      const growth = 4 * Math.max(0, rank - 1);
      expect(panel).toHaveTextContent(`${String(40 + growth)} ~ ${String(60 + growth)}`);
      if (rank > 0 && rank < 20)
        expect(panel).toHaveTextContent(`${String(44 + growth)} ~ ${String(64 + growth)}`);
      if (rank === 20)
        expect(panel).toHaveTextContent(
          locale === 'en' ? 'Max level reached.' : '已达到最高等级。'
        );
      if (rank === 0) {
        const before = structuredClone(usePlayerStore.getState().player);
        fireEvent.click(within(panel).getByRole('button'));
        expect(usePlayerStore.getState().player?.skillLevels?.['assassin.dragon_talon']).toBe(1);
        expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
        expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
      }
    }
  );
}

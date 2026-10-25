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
      ...createMockPlayer('Synthetic Blade Fury UI', 'assassin'),
      level: 30,
      skillPoints: 2,
      skillLevels:
        rank > 0
          ? { 'assassin.blade_sentinel': 1, 'assassin.blade_fury': rank }
          : { 'assassin.blade_sentinel': 1 },
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
  fireEvent.click(screen.getByTestId('skill-node-skills-assassin-blade-fury'));
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
  it.each([0, 1, 19, 20])(`shows Physical Blade Fury cone without Fire Blast copy (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const panel = mount(rank);
    const min = 40 + 4 * Math.max(0, rank - 1), max = 60 + 4 * Math.max(0, rank - 1);
    for (const text of locale === 'en'
      ? [`${String(min)} ~ ${String(max)} Physical damage per enemy`, 'one apex cell',
        'three adjacent cells in the next row', 'most enemies', 'foremost row',
        'leftmost column', 'Each enemy rolls separately', 'paid once per cast',
        'Cone: 1 cell, then 3 in the next row']
      : [`每个敌人造成 ${String(min)} ~ ${String(max)} 点物理伤害`, '一个顶点格',
        '下一排的三个相邻格', '最多敌人', '最前排', '最左列',
        '每个敌人独立判定', '每次施放仅支付一次', '锥形：1格，下一排3格'])
      expect(panel).toHaveTextContent(text);
    expect(panel.textContent).not.toMatch(/\{\{|skills:|details\.cone|cone-2|fire trap|Burn|火焰陷阱|灼烧/);
    const sections = Array.from(panel.querySelectorAll('section'));
    const shape = locale === 'en' ? 'Cone: 1 cell, then 3 in the next row' : '锥形：1格，下一排3格';
    expect(sections.filter(section => section.textContent.includes(shape)))
      .toHaveLength(rank > 0 && rank < 20 ? 2 : 1);
    if (rank > 0 && rank < 20)
      expect(panel).toHaveTextContent(`${String(min + 4)} ~ ${String(max + 4)}`);
    if (rank === 20)
      expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    if (rank === 0) {
      const before = structuredClone(usePlayerStore.getState().player);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['assassin.blade_fury']).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
    }
  });
}

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

const id = 'skills-amazon-plague-javelin';
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: 'en' | 'zh-CN', rank: number) {
  await i18n.changeLanguage(locale);
  act(() => { usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Synthetic Plague preview', 'amazon'), level: 30, skillPoints: 1,
    comboOrder: [], skillLevels: { 'skills-amazon-jab': 1, 'skills-amazon-poison-javelin': 1, [id]: rank }
  }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkillsScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-' + id));
  return screen.getByTestId('skill-detail-panel');
}
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 19, 20])(`explains paid Plague, finite Poison and pre-cast Epidemic (${locale}, rank%s)`, async rank => {
    const panel = await arrange(locale, rank), before = structuredClone(usePlayerStore.getState().player);
    const min = 30 + 3 * (Math.max(1, rank) - 1), max = 50 + 3 * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en' ? [
      `${String(min)}–${String(max)} Poison base damage`, 'up to three living enemies in one row',
      '3 Poison stacks', '5% of the final hit per second', '5 s', '10 stacks',
      'Plague adds no extra periodic damage', '50%', 'all its living allies',
      'already has 10 active Poison stacks before the cast', '100%', 'once per cast',
      '25 MP', '2 s cooldown', 'Misses apply neither status'
    ] : [
      `${String(min)}～${String(max)} 点毒素基础伤害`, '同一行至多三个存活敌人',
      '3层中毒', '最终命中伤害的5%', '5 秒', '10层', '瘟疫不额外造成持续伤害',
      '50%', '所有存活友方', '施放前已具有10层生效中的中毒', '100%', '每次施放至多触发一次',
      '25 点法力', '2 秒冷却', '未命中不施加这两种状态'
    ]) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
  it(`allocates the final Plague rank with actual damage and stable payment (${locale})`, async () => {
    const panel = await arrange(locale, 19);
    fireEvent.click(within(panel).getByRole('button', { name: locale === 'en' ? /^Allocate$/ : /^分配$/ }));
    expect(usePlayerStore.getState().player?.skillLevels?.[id]).toBe(20);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
    for (const phrase of locale === 'en'
      ? ['Lv. 20/20', 'Max level reached.', '87–107 Poison base damage', '25 MP', '2 s cooldown']
      : ['等级 20/20', '已达到最高等级。', '87～107 点毒素基础伤害', '25 点法力', '2 秒冷却'])
      expect(panel).toHaveTextContent(phrase);
  });
}

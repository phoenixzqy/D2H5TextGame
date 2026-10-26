import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from '@/features/skills/SkillsScreen';

const id = 'skills-necromancer-poison-dagger';
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: 'en' | 'zh-CN', rank: number) {
  await i18n.changeLanguage(locale);
  act(() => { usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Synthetic Poison Dagger UI', 'necromancer'),
    level: 30, skillPoints: 2, comboOrder: [], skillLevels: { [id]: rank }
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
  it.each([0, 1, 2, 19, 20])(`shows actual Dagger damage, payment and Poison rules (${locale}, rank%s)`, async rank => {
    const panel = await arrange(locale, rank), before = structuredClone(usePlayerStore.getState().player);
    const min = 25 + 5 * (Math.max(1, rank) - 1), max = 40 + 5 * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en' ? [
      `${String(min)}–${String(max)} Poison base damage`, 'one prioritized living enemy',
      'Poison resistance and Defense', 'magic resist does not', 'one Poison stack',
      '5 MP', '1 s cooldown once', 'Misses apply no Poison',
      '5% of the final hit per second', '5 s', '10 stacks', 'keeps its original rate'
    ] : [
      `${String(min)}～${String(max)} 点毒素基础伤害`, '优先顺序中的一个存活敌人',
      '毒素抗性与防御', '不受魔法抵抗减免', '1层中毒', '5 点法力', '1 秒冷却',
      '未命中不施加中毒', '最终命中伤害的5%', '5 秒', '10层', '保留原伤害率'
    ]) expect(panel).toHaveTextContent(phrase);
    if (rank > 0 && rank < 20)
      expect(panel).toHaveTextContent(`${String(min + 5)} ~ ${String(max + 5)}`);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
  it(`allocates the actual final Dagger rank and shows MAX with unchanged5MP/1s (${locale})`, async () => {
    const panel = await arrange(locale, 19);
    fireEvent.click(within(panel).getByRole('button', { name: locale === 'en' ? 'Allocate' : '分配', exact: true }));
    expect(usePlayerStore.getState().player?.skillLevels?.[id]).toBe(20);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(1);
    expect(panel).toHaveTextContent(locale === 'en' ? 'Lv. 20/20' : '等级 20/20');
    expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel).toHaveTextContent(locale === 'en' ? '120–135 Poison base damage' : '120～135 点毒素基础伤害');
    expect(panel).toHaveTextContent(locale === 'en' ? '5 MP' : '5 点法力');
    expect(panel).toHaveTextContent(locale === 'en' ? '1 s cooldown' : '1 秒冷却');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
  });
}

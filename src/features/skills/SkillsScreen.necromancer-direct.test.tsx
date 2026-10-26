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

const spells = [
  { slug: 'teeth', min: 20, max: 35, growth: 4, cost: 7, cooldown: 1 },
  { slug: 'bone-spear', min: 60, max: 90, growth: 7, cost: 20, cooldown: 1 },
  { slug: 'bone-spirit', min: 110, max: 160, growth: 12, cost: 30, cooldown: 2 },
  { slug: 'poison-nova', min: 20, max: 30, growth: 4, cost: 25, cooldown: 3 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const spell of spells) {
  it.each([0, 1, 2, 20])(`shows truthful ${spell.slug} targeting/payment/mitigation (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic bone/poison UI', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-necromancer-' + spell.slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-' + spell.slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const min = spell.min + spell.growth * (Math.max(1, rank) - 1), max = spell.max + spell.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)} ${spell.slug === 'poison-nova' ? 'Poison' : 'Arcane'} base damage`, `${String(spell.cost)} MP`, `${String(spell.cooldown)} s cooldown once`]
      : [`${String(min)}～${String(max)} 点${spell.slug === 'poison-nova' ? '毒素' : '奥术'}基础伤害`, `${String(spell.cost)} 点法力`, `${String(spell.cooldown)} 秒冷却`]) expect(panel).toHaveTextContent(phrase);
    const recipient = spell.slug === 'teeth' ? (locale === 'en' ? 'first two prioritized living enemies' : '前两个存活敌人')
      : spell.slug === 'poison-nova' ? (locale === 'en' ? 'every living enemy' : '每个存活敌人')
        : (locale === 'en' ? 'one living enemy' : '一个存活敌人');
    expect(panel).toHaveTextContent(recipient);
    expect(panel).toHaveTextContent(locale === 'en' ? (spell.slug === 'poison-nova' ? 'Poison resistance and Defense' : 'Arcane resistance and magic resist')
      : spell.slug === 'poison-nova' ? '毒素抗性与防御' : '奥术抗性与魔法抵抗');
    if (spell.slug === 'poison-nova') for (const phrase of locale === 'en'
      ? ['2 Poison stacks', '5% of the final hit per second', '5 s', '10 stacks', 'Misses apply no Poison']
      : ['2 层中毒', '最终命中伤害的5%', '5 秒', '10层', '未命中不施加中毒']) expect(panel).toHaveTextContent(phrase);
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(`${String(min + spell.growth)} ~ ${String(max + spell.growth)}`);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

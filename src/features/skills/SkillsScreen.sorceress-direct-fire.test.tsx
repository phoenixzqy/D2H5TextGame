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
  { slug: 'fire-bolt', min: 30, max: 45, growth: 4, cost: 8, cooldown: 1 },
  { slug: 'fire-ball', min: 70, max: 100, growth: 7, cost: 20, cooldown: 1 },
  { slug: 'meteor', min: 100, max: 150, growth: 10, cost: 50, cooldown: 4 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const spell of spells) {
  it.each([0, 1, 2, 20])(`shows actual ${spell.slug} recipients/payment/Burn (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic direct fire UI', 'sorceress'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-sorceress-' + spell.slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + spell.slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const min = spell.min + spell.growth * (Math.max(1, rank) - 1), max = spell.max + spell.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)}`, `${String(spell.cost)} MP`, `${String(spell.cooldown)} s cooldown once`,
        'Fire resistance and Defense', '10% of the final hit', 'minimum 1', '3 s', '5 stacks']
      : [`${String(min)}${spell.slug === 'meteor' ? '–' : '～'}${String(max)}`, `${String(spell.cost)} 点法力`,
        `${String(spell.cooldown)} 秒冷却`, '火焰抗性与普通防御', '最终命中伤害的10%', '最低1点', '3 秒', '5层'])
      expect(panel).toHaveTextContent(phrase);
    for (const phrase of locale === 'en'
      ? ['extends duration', 'keeps its original rate', 'Misses apply no Burn']
      : ['延长持续时间', '保留原伤害率', '未命中不施加燃烧']) expect(panel).toHaveTextContent(phrase);
    expect(panel).toHaveTextContent(spell.slug === 'meteor'
      ? locale === 'en' ? 'per living enemy, including separated and overflow targets' : '每个存活敌人独立判定一次，包括分散或超出阵列的敌人'
      : locale === 'en' ? 'One single-target attempt' : '单体独立判定一次');
    if (spell.slug === 'meteor') for (const phrase of locale === 'en'
      ? ['Burn then Armor Melt', 'Defense by 30% for 3 s', 'initial hit before Armor Melt']
      : ['燃烧与护甲熔毁', '普通防御降低30%', '初次命中在护甲熔毁生效前']) expect(panel).toHaveTextContent(phrase);
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(`${String(min + spell.growth)} ~ ${String(max + spell.growth)}`);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

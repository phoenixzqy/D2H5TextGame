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
  { slug: 'ice-bolt', min: 30, max: 45, growth: 4, cost: 10, cooldown: 1 },
  { slug: 'frost-nova', min: 25, max: 35, growth: 3, cost: 20, cooldown: 3 },
  { slug: 'frozen-orb', min: 60, max: 90, growth: 6, cost: 30, cooldown: 2 },
  { slug: 'blizzard', min: 85, max: 125, growth: 8, cost: 35, cooldown: 4 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const spell of spells) {
  it.each([0, 1, 2, 20])(`shows actual ${spell.slug} targeting/payment/Chill (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic cold attack UI', 'sorceress'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-sorceress-' + spell.slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + spell.slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const min = spell.min + spell.growth * (Math.max(1, rank) - 1), max = spell.max + spell.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)} Cold base damage`, `${String(spell.cost)} MP`,
        `${String(spell.cooldown)} s cooldown once`, 'Chill for 2 s', 'Attack Speed by 50%', 'Misses apply no Chill']
      : [`${String(min)}～${String(max)} 点冰冷基础伤害`, `${String(spell.cost)} 点法力`,
        `${String(spell.cooldown)} 秒冷却`, '持续2 秒', '攻击速度降低50%', '未命中不施加减速'])
      expect(panel).toHaveTextContent(phrase);
    const target = spell.slug === 'ice-bolt' ? locale === 'en' ? 'One single-target' : '单体独立判定一次'
      : spell.slug === 'frozen-orb' ? locale === 'en' ? 'one apex cell' : '一个顶点格'
      : locale === 'en' ? 'per living enemy' : '每个存活敌人';
    expect(panel).toHaveTextContent(target);
    if (spell.slug === 'frozen-orb') for (const phrase of locale === 'en'
      ? ['three adjacent cells in the next row', 'foremost row', 'leftmost column', 'Cone: 1 cell, then 3 in the next row']
      : ['下一排的三个相邻格', '最前排', '最左列', '锥形：1格，下一排3格']) expect(panel).toHaveTextContent(phrase);
    if (spell.slug === 'frost-nova') for (const phrase of locale === 'en'
      ? ['10% chance of Freeze for 1 s', 'bosses: 0.5 s']
      : ['10%概率冰封1 秒', '首领0.5 秒']) expect(panel).toHaveTextContent(phrase);
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(`${String(min + spell.growth)} ~ ${String(max + spell.growth)}`);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

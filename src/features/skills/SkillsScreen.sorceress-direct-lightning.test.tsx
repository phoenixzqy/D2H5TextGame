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
  { slug: 'charged-bolt', min: 25, max: 40, growth: 3, cost: 8, cooldown: 1 },
  { slug: 'lightning', min: 45, max: 80, growth: 6, cost: 15, cooldown: 1 },
  { slug: 'nova', min: 40, max: 60, growth: 4, cost: 18, cooldown: 2 },
  { slug: 'chain-lightning', min: 50, max: 70, growth: 5, cost: 25, cooldown: 2 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const spell of spells) {
  it.each([0, 1, 2, 20])(`shows actual ${spell.slug} recipients/payment/control (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic direct lightning UI', 'sorceress'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-sorceress-' + spell.slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + spell.slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const min = spell.min + spell.growth * (Math.max(1, rank) - 1), max = spell.max + spell.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)} Lightning base damage`, `${String(spell.cost)} MP`, `${String(spell.cooldown)} s cooldown once`,
        'Lightning resistance and magic resist']
      : [`${String(min)}～${String(max)} 点闪电基础伤害`, `${String(spell.cost)} 点法力`, `${String(spell.cooldown)} 秒冷却`,
        '闪电抗性与魔法抵抗']) expect(panel).toHaveTextContent(phrase);
    const recipient = {
      'charged-bolt': locale === 'en' ? 'One bolt attempt at each of the first two prioritized living enemies' : '向优先顺序中的前两个存活敌人各发射一枚闪电弹',
      lightning: locale === 'en' ? 'One single-target attempt' : '对单体敌人独立判定一次',
      nova: locale === 'en' ? 'One independent attempt per living enemy, including separated and overflow targets' : '对每个存活敌人独立判定一次，包括分散或超出阵列的敌人',
      'chain-lightning': locale === 'en' ? 'Bounces between up to 5 distinct living enemies' : '在最多 5 个不同的存活敌人之间弹射'
    }[spell.slug];
    expect(panel).toHaveTextContent(recipient);
    if (spell.slug === 'chain-lightning') for (const phrase of locale === 'en'
      ? ['nearest unvisited enemy', 'Misses and lethal hits do not stop the chain', 'Paralyze for 1 s', '5 s', '50%', 'Misses apply no Paralyze']
      : ['最近的尚未弹射过的敌人', '未命中或击杀不会中断弹射', '麻痹 1 秒', '5 秒', '50%', '未命中不施加麻痹']) expect(panel).toHaveTextContent(phrase);
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(`${String(min + spell.growth)} ~ ${String(max + spell.growth)}`);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

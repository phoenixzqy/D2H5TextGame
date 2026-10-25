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

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
const skills = ['howl', 'taunt', 'battle-cry'] as const;
for (const locale of ['en', 'zh-CN'] as const) for (const slug of skills) {
  it.each([0, 1, 2, 20])(`shows actual ${slug} target/payment/control behavior (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Barbarian AOE UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-barbarian-' + slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-' + slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const effective = Math.max(1, rank);
    const cost = Math.round((slug === 'howl' ? 4 : slug === 'taunt' ? 3 : 6) -
      (slug === 'battle-cry' ? .1 : .05) * (effective - 1));
    for (const phrase of locale === 'en'
      ? ['Pay ' + String(cost) + ' MP', 'Changes apply next wave', 'for 1 s']
      : ['消耗' + String(cost) + ' 点法力', '调整从下一波生效', '持续1 秒']) expect(panel).toHaveTextContent(phrase);
    if (slug === 'howl') for (const phrase of locale === 'en'
      ? ['interrupts scheduled actions', 'bosses: 0.5 s', 'No movement']
      : ['中断行动', '首领0.5 秒', '不会移动']) expect(panel).toHaveTextContent(phrase);
    if (slug === 'taunt') for (const phrase of locale === 'en'
      ? ['living caster', 'single-target', 'Area attacks']
      : ['存活施法者', '单体', '范围攻击']) expect(panel).toHaveTextContent(phrase);
    if (slug === 'battle-cry') for (const phrase of locale === 'en'
      ? ['direct damage by ' + String(25 + effective - 1) + '%', 'Defense by ' + String(50 + 2 * (effective - 1)) + '%']
      : ['直接伤害降低' + String(25 + effective - 1) + '%', '防御降低' + String(50 + 2 * (effective - 1)) + '%']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

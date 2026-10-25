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
const skills = [
  { slug: 'bash', min: 50, max: 70, growth: 5, cost: 5, cooldown: 1, stun: false },
  { slug: 'whirlwind', min: 60, max: 90, growth: 6, cost: 25, cooldown: 2, stun: false },
  { slug: 'leap-attack', min: 70, max: 100, growth: 7, cost: 20, cooldown: 3, stun: true },
  { slug: 'war-cry', min: 30, max: 50, growth: 3, cost: 30, cooldown: 3, stun: true }
] as const;
for (const locale of ['en', 'zh-CN'] as const) for (const skill of skills) {
  it.each([0, 1, 2, 20])(`shows actual ${skill.slug} target/payment/control behavior (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Barbarian AOE UI', 'barbarian'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-barbarian-' + skill.slug]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-' + skill.slug));
    const panel = screen.getByTestId('skill-detail-panel');
    const min = skill.min + skill.growth * (Math.max(1, rank) - 1);
    const max = skill.max + skill.growth * (Math.max(1, rank) - 1);
    const targets = skill.slug === 'bash'
      ? locale === 'en' ? 'One single-target' : '对单体独立判定一次'
      : locale === 'en' ? 'One independent attempt per living enemy' : '对每个存活敌人分别独立判定一次';
    for (const phrase of [targets, locale === 'en' ? `${String(min)}–${String(max)}` : `${String(min)}～${String(max)}`,
      locale === 'en' ? `${String(skill.cost)} MP` : `${String(skill.cost)} 点法力`,
      locale === 'en' ? `${String(skill.cooldown)} s cooldown once` : `${String(skill.cooldown)} 秒冷却`]) expect(panel).toHaveTextContent(phrase);
    if (skill.stun) for (const phrase of locale === 'en'
      ? ['Stun for 1 s', 'bosses: 0.5 s', 'Misses do not stun']
      : ['眩晕1 秒', '首领0.5 秒', '未命中不会眩晕']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

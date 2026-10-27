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

const skills = [
  { slug: 'magic-arrow', min: 35, max: 50, growth: 4, mana: 5, en: 'Arcane', zh: '奥术' },
  { slug: 'lightning-bolt', min: 50, max: 75, growth: 5, mana: 15, en: 'Lightning', zh: '闪电' },
  { slug: 'fire-arrow', min: 35, max: 55, growth: 4, mana: 8, en: 'Fire', zh: '火焰' },
  { slug: 'cold-arrow', min: 35, max: 55, growth: 4, mana: 10, en: 'Cold', zh: '冰冷' }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: 'en' | 'zh-CN', slug: string, rank: number) {
  await i18n.changeLanguage(locale);
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Amazon single-hit preview', 'amazon'),
    level: 30, skillPoints: 1, comboOrder: [], skillLevels: {
      'skills-amazon-jab': 1, 'skills-amazon-power-strike': 1, ['skills-amazon-' + slug]: rank
    } }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-amazon-' + slug));
  return screen.getByTestId('skill-detail-panel');
}
for (const locale of ['en', 'zh-CN'] as const) for (const skill of skills) {
  it.each([0, 1, 19, 20])(`explains actual ${skill.slug} damage, recipient and payload (${locale}, rank%i)`, async rank => {
    const panel = await arrange(locale, skill.slug, rank), before = structuredClone(usePlayerStore.getState().player);
    const min = skill.min + skill.growth * (Math.max(1, rank) - 1), max = skill.max + skill.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? ['One single-target attempt', `${String(min)}–${String(max)} ${skill.en} base damage`, `${String(skill.mana)} MP`, '1 s cooldown']
      : ['对单个存活敌人判定一次', `${String(min)}～${String(max)} 点${skill.zh}基础伤害`, `${String(skill.mana)} 点法力`, '1 秒冷却'])
      expect(panel).toHaveTextContent(phrase);
    if (skill.slug === 'magic-arrow') for (const phrase of locale === 'en'
      ? ['bow or crossbow', 'no ammunition', 'Arcane resistance and magic resist']
      : ['弓或弩', '不消耗弹药', '奥术抗性与魔法抵抗']) expect(panel).toHaveTextContent(phrase);
    if (skill.slug === 'lightning-bolt') expect(panel).toHaveTextContent(locale === 'en'
      ? 'Lightning resistance and magic resist' : '闪电抗性与魔法抵抗');
    if (skill.slug === 'fire-arrow') for (const phrase of locale === 'en'
      ? ['Fire resistance and Defense', '10% of the final hit per second', '3 s', '5 stacks', 'keeps its original rate', 'Misses apply no Burn']
      : ['火焰抗性与防御', '每层每秒造成最终命中伤害的10%', '3 秒', '5层', '保留原伤害率', '未命中不施加燃烧']) expect(panel).toHaveTextContent(phrase);
    if (skill.slug === 'cold-arrow') for (const phrase of locale === 'en'
      ? ['Cold resistance and magic resist', 'Chill for 2 s', '50%', 'refreshes without stacking', 'Misses apply no Chill']
      : ['冰冷抗性与魔法抵抗', '冰冷持续2 秒', '50%', '刷新持续时间而不叠加', '未命中不施加冰冷']) expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
  it(`allocates the final ${skill.slug} rank and shows exact MAX damage (${locale})`, async () => {
    const panel = await arrange(locale, skill.slug, 19);
    fireEvent.click(within(panel).getByRole('button', { name: locale === 'en' ? /^Allocate$/ : /^分配$/ }));
    expect(usePlayerStore.getState().player?.skillLevels?.['skills-amazon-' + skill.slug]).toBe(20);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
    expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    const min = skill.min + skill.growth * 19, max = skill.max + skill.growth * 19;
    expect(panel).toHaveTextContent(locale === 'en' ? `${String(min)}–${String(max)} ${skill.en} base damage`
      : `${String(min)}～${String(max)} 点${skill.zh}基础伤害`);
  });
}

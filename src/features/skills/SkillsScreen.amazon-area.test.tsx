import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
const skills = [
  {
    slug: 'fend',
    min: 70,
    max: 95,
    growth: 6,
    mana: 25,
    cooldown: 2,
    en: 'in a cross',
    zh: '十字范围内最多5名'
  },
  {
    slug: 'exploding-arrow',
    min: 55,
    max: 80,
    growth: 5,
    mana: 15,
    cooldown: 2,
    en: '3×3 explosion',
    zh: '3×3爆炸覆盖最多9名'
  },
  {
    slug: 'immolation-arrow',
    min: 90,
    max: 130,
    growth: 8,
    mana: 30,
    cooldown: 3,
    en: 'pyre leaves Burn on struck foes',
    zh: '火堆使被击中的敌人持续燃烧'
  },
  {
    slug: 'lightning-fury',
    min: 60,
    max: 90,
    growth: 6,
    mana: 30,
    cooldown: 3,
    en: 'every original living enemy',
    zh: '连锁经过每名原始存活敌人'
  }
] as const;
beforeEach(() => {
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
async function arrange(locale: 'en' | 'zh-CN', slug: string, rank: number) {
  await i18n.changeLanguage(locale);
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find((s) => s.id === id);
    if (!row) throw new Error('Missing native prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  const id = 'skills-amazon-' + slug;
  add(id);
  levels[id] = rank;
  act(() => {
    usePlayerStore
      .getState()
      .setPlayer({
        ...createMockPlayer('Synthetic Amazon area preview', 'amazon'),
        level: 30,
        skillPoints: 1,
        comboOrder: [],
        skillLevels: levels
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
  fireEvent.click(screen.getByTestId('skill-node-' + id));
  return screen.getByTestId('skill-detail-panel');
}
for (const locale of ['en', 'zh-CN'] as const)
  for (const skill of skills) {
    it.each([0, 1, 19, 20])(
      `explains ${skill.slug} actual area/rank/payment ${locale} rank%i`,
      async (rank) => {
        const panel = await arrange(locale, skill.slug, rank),
          before = structuredClone(usePlayerStore.getState().player);
        const min = skill.min + skill.growth * (Math.max(1, rank) - 1),
          max = skill.max + skill.growth * (Math.max(1, rank) - 1);
        for (const phrase of locale === 'en'
          ? [
              `${String(min)}–${String(max)}`,
              `${String(skill.mana)} MP`,
              `${String(skill.cooldown)} s cooldown`,
              skill.en
            ]
          : [
              `${String(min)}～${String(max)} 点`,
              `${String(skill.mana)} 点法力`,
              `冷却${String(skill.cooldown)} 秒`,
              skill.zh
            ])
          expect(panel).toHaveTextContent(phrase);
        if (skill.slug === 'lightning-fury')
          expect(panel).toHaveTextContent(
            locale === 'en' ? 'nearest grid neighbor' : '按格子距离选择最近'
          );
        expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
        expect(usePlayerStore.getState().player).toEqual(before);
      }
    );
    it(`allocates final ${skill.slug} rank and shows exact MAX ${locale}`, async () => {
      const panel = await arrange(locale, skill.slug, 19);
      fireEvent.click(
        within(panel).getByRole('button', { name: locale === 'en' ? /^Allocate$/ : /^分配$/ })
      );
      expect(usePlayerStore.getState().player?.skillLevels?.['skills-amazon-' + skill.slug]).toBe(
        20
      );
      expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
      expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
      expect(panel).toHaveTextContent(locale === 'en' ? skill.en : skill.zh);
      const min = skill.min + skill.growth * 19,
        max = skill.max + skill.growth * 19;
      expect(panel).toHaveTextContent(
        locale === 'en' ? `${String(min)}–${String(max)}` : `${String(min)}～${String(max)} 点`
      );
    });
  }

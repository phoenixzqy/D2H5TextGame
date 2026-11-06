import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';
import skills from '@/data/skills/assassin.json';

const spells = [
  { slug: 'fire-blast', min: 50, max: 70, growth: 5, mana: 25, cd: 2 },
  { slug: 'fists-of-fire', min: 45, max: 70, growth: 5, mana: 5, cd: 1 },
  { slug: 'dragon-tail', min: 70, max: 100, growth: 120, mana: 13, cd: 2 },
  { slug: 'wake-of-fire', min: 60, max: 85, growth: 5, mana: 17, cd: 2 },
  { slug: 'wake-of-inferno', min: 90, max: 130, growth: 7, mana: 25, cd: 3 },
  { slug: 'phoenix-strike', min: 40, max: 60, growth: 4, mana: 40, cd: 3 }
] as const;
const copy = {
  en: {
    current: 'Current',
    next: 'Next Level',
    preview: 'Learned at Lv. 1',
    damage: 'Fire attack',
    trapDamage: 'Fire damage per pulse',
    mana: 'Mana Cost',
    cd: 'Cooldown',
    rate: 'Burn per stack',
    value: '10% of final hit/s (min. 1)',
    duration: 'Burn duration',
    seconds: '3 s',
    stacks: 'Maximum Burn stacks',
    prose: 'rounded down, minimum 1',
    maxed: 'Max level reached.'
  },
  'zh-CN': {
    current: '当前',
    next: '下一级',
    preview: '学习后 Lv.1',
    damage: '火焰攻击',
    trapDamage: '每次脉冲火焰伤害',
    mana: '法力消耗',
    cd: '冷却',
    rate: '每层燃烧',
    value: '最终命中伤害的10%/秒（最低1点）',
    duration: '燃烧持续',
    seconds: '3 秒',
    stacks: '燃烧层数上限',
    prose: '向下取整，最低1点',
    maxed: '已达到最高等级。'
  }
} as const;
function arrange(slug: string, rank: number) {
  const fresh = createMockPlayer('Synthetic Assassin fire UI', 'assassin');
  const skillLevels: Record<string, number> = {};
  const add = (id: string) => {
    const row = skills.find((s) => s.id === id);
    if (!row) throw new Error('Missing actual prerequisite');
    if (id !== 'skills-assassin-' + slug || rank > 0)
      skillLevels['assassin.' + id.slice('skills-assassin-'.length).replaceAll('-', '_')] =
        id === 'skills-assassin-' + slug ? rank : 1;
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
  };
  add('skills-assassin-' + slug);
  act(() => {
    usePlayerStore
      .getState()
      .setPlayer({ ...fresh, level: 30, skillLevels, skillPoints: 2, comboOrder: [] });
  });
}
function mount(slug: string) {
  render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkillsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
  fireEvent.click(screen.getByTestId('skill-node-skills-assassin-' + slug));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string) {
  const s = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!s) throw new Error('Missing Assassin fire stat section');
  return s;
}
function row(panel: HTMLElement, label: string) {
  const node = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!node) throw new Error('Missing Assassin fire stat row');
  return node;
}
beforeEach(() => {
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

for (const locale of ['en', 'zh-CN'] as const) {
  describe.each(spells)(`Assassin $slug details (${locale})`, (spell) => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    it.each([1, 2, 20])('shows truthful hit and Burn rules at rank %i', (rank) => {
      arrange(spell.slug, rank);
      const panel = mount(spell.slug),
        text = copy[locale];
      const current = section(panel, text.current),
        growth = spell.growth * (rank - 1);
      const damageLabel = spell.slug === 'wake-of-fire' || spell.slug === 'wake-of-inferno'
        ? text.trapDamage : text.damage;
      expect(row(current, damageLabel).textContent.trim()).toBe(
        `${String(spell.min + growth)} ~ ${String(spell.max + growth)}`
      );
      expect(row(current, text.mana)).toHaveTextContent(String(spell.mana));
      expect(row(current, text.cd)).toHaveTextContent(
        `${String(spell.cd)} ${locale === 'en' ? 's' : '秒'}`
      );
      expect(row(current, text.rate)).toHaveTextContent(
        spell.slug === 'phoenix-strike'
          ? locale === 'en'
            ? '10% of final Fire component/s (min. 1)'
            : '最终火焰分量的10%/秒（最低1点）'
          : text.value
      );
      expect(row(current, text.duration)).toHaveTextContent(text.seconds);
      expect(row(current, text.stacks)).toHaveTextContent(/^5$/);
      expect(panel).toHaveTextContent(text.prose);
      if (spell.slug === 'phoenix-strike') {
        for (const label of locale === 'en'
          ? ['Cold attack', 'Lightning attack']
          : ['冰冷攻击', '闪电攻击']) {
          expect(row(current, label).textContent.trim()).toBe(
            `${String(spell.min + growth)} ~ ${String(spell.max + growth)}`
          );
        }
      }
      expect(panel.textContent).not.toMatch(/\{\{|details\.burn|damage-types:/);
      const next = section(panel, text.next);
      if (rank === 20) expect(next).toHaveTextContent(text.maxed);
      else
        expect(row(next, text.rate)).toHaveTextContent(
          spell.slug === 'phoenix-strike'
            ? locale === 'en'
              ? '10% of final Fire component/s (min. 1)'
              : '最终火焰分量的10%/秒（最低1点）'
            : text.value
        );
    });
    it('previews and allocates rank one without refilling resources or adding a combo', () => {
      arrange(spell.slug, 0);
      const before = structuredClone(usePlayerStore.getState().player);
      const panel = mount(spell.slug),
        text = copy[locale];
      expect(row(section(panel, text.preview), text.rate)).toHaveTextContent(
        spell.slug === 'phoenix-strike'
          ? locale === 'en'
            ? '10% of final Fire component/s (min. 1)'
            : '最终火焰分量的10%/秒（最低1点）'
          : text.value
      );
      expect(usePlayerStore.getState().player).toEqual(before);
      fireEvent.click(within(panel).getByRole('button'));
      expect(
        usePlayerStore.getState().player?.skillLevels?.[
          'assassin.' + spell.slug.replaceAll('-', '_')
        ]
      ).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
      expect(row(section(panel, text.current), text.rate)).toHaveTextContent(
        spell.slug === 'phoenix-strike'
          ? locale === 'en'
            ? '10% of final Fire component/s (min. 1)'
            : '最终火焰分量的10%/秒（最低1点）'
          : text.value
      );
    });
  });
}

for (const locale of ['en', 'zh-CN'] as const) {
  it.each([0, 1, 2, 20])(`BUG207 Fire Blast cone summary and rank rows (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    arrange('fire-blast', rank);
    const panel = mount('fire-blast'), summary = panel.querySelector('p.rounded'), text = copy[locale];
    const min = 50 + 5 * Math.max(0, rank - 1), max = 70 + 5 * Math.max(0, rank - 1);
    for (const phrase of locale === 'en'
      ? ['fire trap', 'explodes once', `${String(min)} ~ ${String(max)} Fire damage per enemy`,
        'one apex cell', 'three adjacent cells in the next row', 'most enemies', 'foremost row', 'leftmost column']
      : ['火焰陷阱', '爆炸一次', `每个敌人造成 ${String(min)} ~ ${String(max)} 点火焰伤害`,
        '一个顶点格', '下一排的三个相邻格', '最多敌人', '最前排', '最左列'])
      expect(summary).toHaveTextContent(phrase);
    const label = locale === 'en' ? 'Area shape' : '作用范围';
    const value = locale === 'en' ? 'Cone: 1 cell, then 3 in the next row' : '锥形：1格，下一排3格';
    expect(row(section(panel, rank === 0 ? text.preview : text.current), label)).toHaveTextContent(value);
    if (rank > 0 && rank < 20) expect(row(section(panel, text.next), label)).toHaveTextContent(value);
    expect(panel.textContent).not.toMatch(/\{\{|details\.cone|cone-2/);
  });
  it.each([0, 1, 2, 20])(
    `BUG206 Phoenix main summary includes every component (${locale}, rank%i)`,
    async (rank) => {
      await i18n.changeLanguage(locale);
      arrange('phoenix-strike', rank);
      const panel = mount('phoenix-strike'),
        summary = panel.querySelector('p.rounded');
      const min = 40 + 4 * Math.max(0, rank - 1),
        max = 60 + 4 * Math.max(0, rank - 1);
      expect(summary).toBeInTheDocument();
      for (const type of locale === 'en'
        ? ['Fire', 'Cold', 'Lightning']
        : ['点火焰', '点冰冷', '点闪电'])
        expect(summary).toHaveTextContent(`${String(min)} ~ ${String(max)} ${type}`);
      for (const text of locale === 'en'
        ? [
            'one hit and critical roll',
            'separate modifiers and mitigation',
            'Chill for 2 s',
            'Paralyze for 1 s',
            'A miss applies none'
          ]
        : [
            '共用一次命中与暴击判定',
            '分别计算增益和减伤',
            '冰缓 2 秒',
            '麻痹 1 秒',
            '未命中不附加任何效果'
          ])
        expect(summary).toHaveTextContent(text);
      expect(summary?.textContent).not.toMatch(/\{\{|details\.descriptionComposite/);
    }
  );
}

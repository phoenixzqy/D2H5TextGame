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

const spells = [
  {
    slug: 'werewolf-maul',
    min: 80,
    max: 120,
    growth: 8,
    mana: 15,
    cd: 1,
    status: 'bleed',
    fraction: 10,
    duration: 3,
    cap: 1
  },
  {
    slug: 'rabies',
    min: 50,
    max: 75,
    growth: 5,
    mana: 12,
    cd: 2,
    status: 'poison',
    fraction: 5,
    duration: 5,
    cap: 10
  },
  {
    slug: 'fire-claws',
    min: 70,
    max: 100,
    growth: 6,
    mana: 9,
    cd: 1,
    status: 'burn',
    fraction: 10,
    duration: 3,
    cap: 5
  }
] as const;
const copy = {
  en: {
    current: 'Current',
    next: 'Next Level',
    preview: 'Learned at Lv. 1',
    damage: 'Fire attack',
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
function labels(locale: 'en' | 'zh-CN', spell: (typeof spells)[number]) {
  const status =
    locale === 'en'
      ? { bleed: 'Bleed', poison: 'Poison', burn: 'Burn' }[spell.status]
      : { bleed: '流血', poison: '中毒', burn: '燃烧' }[spell.status];
  return {
    ...copy[locale],
    damage:
      locale === 'en'
        ? { bleed: 'Physical attack', poison: 'Poison attack', burn: 'Fire attack' }[spell.status]
        : { bleed: '物理攻击', poison: '毒素攻击', burn: '火焰攻击' }[spell.status],
    rate: locale === 'en' ? `${status} per stack` : `每层${status}`,
    value:
      locale === 'en'
        ? `${String(spell.fraction)}% of final hit/s (min. 1)`
        : `最终命中伤害的${String(spell.fraction)}%/秒（最低1点）`,
    duration: locale === 'en' ? `${status} duration` : `${status}持续`,
    seconds: `${String(spell.duration)} ${locale === 'en' ? 's' : '秒'}`,
    stacks: locale === 'en' ? `Maximum ${status} stacks` : `${status}层数上限`
  };
}
function arrange(slug: string, rank: number) {
  const fresh = createMockPlayer('Synthetic Druid attack UI', 'druid');
  const skillLevels = Object.fromEntries(
    spells
      .filter((s) => rank > 0 || s.slug !== slug)
      .map((s) => ['druid.' + s.slug.replaceAll('-', '_'), 1])
  );
  const canonical = 'druid.' + slug.replaceAll('-', '_');
  if (rank > 0) skillLevels[canonical] = rank;
  act(() => {
    usePlayerStore
      .getState()
      .setPlayer({
        ...fresh,
        level: 30,
        skillLevels: {
          'druid.werewolf': 1,
          'druid.lycanthropy': 1,
          'druid.werebear': 1,
          'druid.feral_rage': 1,
          ...skillLevels
        },
        skillPoints: 2,
        comboOrder: []
      });
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
  fireEvent.click(screen.getByTestId('skill-node-skills-druid-' + slug));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string) {
  const s = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!s) throw new Error('Missing Druid attack stat section');
  return s;
}
function row(panel: HTMLElement, label: string) {
  const node = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!node) throw new Error('Missing Druid attack stat row');
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
  describe.each(spells)(`Druid $slug details (${locale})`, (spell) => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    it.each([1, 2, 20])('shows truthful hit and periodic rules at rank %i', (rank) => {
      arrange(spell.slug, rank);
      const panel = mount(spell.slug),
        text = labels(locale, spell);
      const current = section(panel, text.current),
        growth = spell.growth * (rank - 1);
      expect(row(current, text.damage).textContent.trim()).toBe(
        `${String(spell.min + growth)} ~ ${String(spell.max + growth)}`
      );
      expect(row(current, text.mana)).toHaveTextContent(String(spell.mana));
      expect(row(current, text.cd)).toHaveTextContent(
        `${String(spell.cd)} ${locale === 'en' ? 's' : '秒'}`
      );
      expect(row(current, text.rate)).toHaveTextContent(text.value);
      expect(row(current, text.duration)).toHaveTextContent(text.seconds);
      expect(row(current, text.stacks)).toHaveTextContent(new RegExp(`^${String(spell.cap)}$`));
      expect(panel).toHaveTextContent(text.prose);
      expect(panel.textContent).not.toMatch(/\{\{|details\.burn|damage-types:/);
      const min = spell.min + growth,
        max = spell.max + growth;
      const description = within(panel).getByText(
        locale === 'en'
          ? new RegExp(`${String(min)}–${String(max)}.*damage`)
          : new RegExp(`${String(min)}–${String(max)}.*伤害`),
        { selector: 'p' }
      );
      const explanation =
        spell.slug === 'werewolf-maul'
          ? locale === 'en'
            ? 'any form'
            : '任何形态'
          : spell.slug === 'rabies'
            ? locale === 'en'
              ? 'On death'
              : '死亡时'
            : locale === 'en'
              ? 'single Fire hit'
              : '单次火焰命中';
      expect(description).toHaveTextContent(explanation);
      const next = section(panel, text.next);
      if (rank === 20) expect(next).toHaveTextContent(text.maxed);
      else expect(row(next, text.rate)).toHaveTextContent(text.value);
    });
    it('previews and allocates rank one without refilling resources or adding a combo', () => {
      arrange(spell.slug, 0);
      const before = structuredClone(usePlayerStore.getState().player);
      const panel = mount(spell.slug),
        text = labels(locale, spell);
      expect(row(section(panel, text.preview), text.rate)).toHaveTextContent(text.value);
      expect(usePlayerStore.getState().player).toEqual(before);
      fireEvent.click(within(panel).getByRole('button'));
      expect(
        usePlayerStore.getState().player?.skillLevels?.['druid.' + spell.slug.replaceAll('-', '_')]
      ).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
      expect(row(section(panel, text.current), text.rate)).toHaveTextContent(text.value);
    });
  });
}

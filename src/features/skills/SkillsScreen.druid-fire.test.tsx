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
  { slug: 'firestorm', min: 40, max: 60, growth: 4, mana: 20, cd: 2 },
  { slug: 'molten-boulder', min: 45, max: 65, growth: 4, mana: 12, cd: 2 },
  { slug: 'fissure', min: 60, max: 90, growth: 400, mana: 20, cd: 3 },
  { slug: 'volcano', min: 80, max: 115, growth: 7, mana: 27, cd: 4 },
  { slug: 'armageddon', min: 110, max: 160, growth: 9, mana: 35, cd: 5 }
] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', preview: 'Learned at Lv. 1',
    damage: 'Fire attack', mana: 'Mana Cost', cd: 'Cooldown', rate: 'Burn per stack',
    value: '10% of final hit/s (min. 1)', duration: 'Burn duration', seconds: '3 s',
    stacks: 'Maximum Burn stacks', prose: 'rounded down, minimum 1', maxed: 'Max level reached.' },
  'zh-CN': { current: '当前', next: '下一级', preview: '学习后 Lv.1',
    damage: '火焰攻击', mana: '法力消耗', cd: '冷却', rate: '每层燃烧',
    value: '最终命中伤害的10%/秒（最低1点）', duration: '燃烧持续', seconds: '3 秒',
    stacks: '燃烧层数上限', prose: '向下取整，最低1点', maxed: '已达到最高等级。' }
} as const;
function arrange(slug: string, rank: number) {
  const fresh = createMockPlayer('Synthetic Druid fire UI', 'druid');
  const skillLevels = Object.fromEntries(spells.filter(s => rank > 0 || s.slug !== slug)
    .map(s => ['druid.' + s.slug.replaceAll('-', '_'), 1]));
  const canonical = 'druid.' + slug.replaceAll('-', '_');
  if (rank > 0) skillLevels[canonical] = rank;
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30,
    skillLevels, skillPoints: 2, comboOrder: [] }); });
}
function mount(slug: string) {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkillsScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-druid-' + slug));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string) {
  const s = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!s) throw new Error('Missing Druid fire stat section');
  return s;
}
function row(panel: HTMLElement, label: string) {
  const node = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!node) throw new Error('Missing Druid fire stat row');
  return node;
}
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe.each(spells)(`Druid $slug details (${locale})`, spell => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each([1, 2, 20])('shows truthful hit and Burn rules at rank %i', rank => {
      arrange(spell.slug, rank); const panel = mount(spell.slug), text = copy[locale];
      const current = section(panel, text.current), growth = spell.growth * (rank - 1);
      expect(row(current, text.damage).textContent.trim()).toBe(`${String(spell.min + growth)} ~ ${String(spell.max + growth)}`);
      expect(row(current, text.mana)).toHaveTextContent(String(spell.mana));
      expect(row(current, text.cd)).toHaveTextContent(`${String(spell.cd)} ${locale === 'en' ? 's' : '秒'}`);
      expect(row(current, text.rate)).toHaveTextContent(text.value);
      expect(row(current, text.duration)).toHaveTextContent(text.seconds);
      expect(row(current, text.stacks)).toHaveTextContent(/^5$/);
      expect(panel).toHaveTextContent(text.prose);
      expect(panel.textContent).not.toMatch(/\{\{|details\.burn|damage-types:/);
      const next = section(panel, text.next);
      if (rank === 20) expect(next).toHaveTextContent(text.maxed);
      else expect(row(next, text.rate)).toHaveTextContent(text.value);
    });
    it('previews and allocates rank one without refilling resources or adding a combo', () => {
      arrange(spell.slug, 0);
      const before = structuredClone(usePlayerStore.getState().player);
      const panel = mount(spell.slug), text = copy[locale];
      expect(row(section(panel, text.preview), text.rate)).toHaveTextContent(text.value);
      expect(usePlayerStore.getState().player).toEqual(before);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['druid.' + spell.slug.replaceAll('-', '_')]).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
      expect(row(section(panel, text.current), text.rate)).toHaveTextContent(text.value);
    });
  });
}

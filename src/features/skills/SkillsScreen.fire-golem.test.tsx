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
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) describe('Fire Golem details ' + locale, () => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  it.each([0, 1, 19, 20])('explains real ordinary Fire/Burn at allocation%i', rank => {
    act(() => { usePlayerStore.getState().setPlayer({
      ...createMockPlayer('Synthetic Fire Golem details', 'necromancer'), level: 30, skillPoints: 1,
      skillLevels: { 'necromancer.clay_golem': 1, 'necromancer.golem_mastery': 1,
        'necromancer.blood_golem': 1, 'necromancer.iron_golem': 1,
        ...(rank > 0 ? { 'necromancer.fire_golem': rank } : {}) }, comboOrder: []
    }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-fire-golem'));
    const panel = screen.getByTestId('skill-detail-panel');
    for (const phrase of locale === 'en'
      ? ['Fire', '10%', 'rounded down', 'minimum 1', '3 s', '5 stacks', 'refresh', 'whole batch', 'no retry']
      : ['火焰', '10%', '向下取整', '最低1', '3 秒', '5层', '刷新', '整批', '不再重试'])
      expect(panel).toHaveTextContent(phrase);
    const headings = rank === 0 ? [locale === 'en' ? 'Learned at Lv. 1' : '学习后 Lv.1']
      : rank === 20 ? [locale === 'en' ? 'Current' : '当前']
      : [locale === 'en' ? 'Current' : '当前', locale === 'en' ? 'Next Level' : '下一级'];
    for (const heading of headings) {
      const section = within(panel).getByRole('heading', { name: heading, level: 3 }).closest('section');
      if (!section) throw new Error('Missing rank section');
      const row = within(section).getByText(locale === 'en' ? 'Summon attack type' : '召唤物攻击类型', { selector: 'dt' });
      expect(row.nextElementSibling).toHaveTextContent(locale === 'en' ? 'Fire' : '火焰');
      expect(section).toHaveTextContent('10%'); expect(section).toHaveTextContent('35');
    }
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\.|combat:/);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
});

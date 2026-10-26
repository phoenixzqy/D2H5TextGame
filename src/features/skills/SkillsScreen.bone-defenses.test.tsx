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

type Locale = 'en' | 'zh-CN';
type Defense = 'bone-wall' | 'bone-prison';
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: Locale, defense: Defense, rank: number) {
  await i18n.changeLanguage(locale);
  const id = 'skills-necromancer-' + defense;
  act(() => { usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Synthetic bone defense preview', 'necromancer'),
    level: 30, skillPoints: 2, comboOrder: [], skillLevels: {
      'skills-necromancer-bone-armor': 1, 'skills-necromancer-bone-wall': 1, [id]: rank
    }
  }); });
  const before = structuredClone(usePlayerStore.getState().player);
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-' + id));
  expect(usePlayerStore.getState().player).toEqual(before);
  return screen.getByTestId('skill-detail-panel');
}
function stat(section: HTMLElement, label: string) {
  return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
}
for (const locale of ['en', 'zh-CN'] as const) for (const defense of ['bone-wall', 'bone-prison'] as const) {
  it.each([[0, 40, 17, 27, 4], [1, 40, 17, 27, 4], [6, 90, 16, 26, 3.8],
    [12, 150, 15, 25, 3.5], [20, 230, 13, 23, 3]] as const)(
    `shows truthful current/next/MAX defense and prices (${locale}, ${defense}, rank%i)`, async (rank, capacity, wallCost, prisonCost, cooldown) => {
      const panel = await arrange(locale, defense, rank), wall = defense === 'bone-wall';
      const before = structuredClone(usePlayerStore.getState().player);
      const section = within(panel).getByRole('heading', {
        name: rank === 0 ? (locale === 'en' ? 'Learned at Lv. 1' : '学习后 Lv.1') : (locale === 'en' ? 'Current' : '当前'), level: 3
      }).closest('section');
      if (!section) throw new Error('Missing defense rank section');
      if (wall) {
        expect(stat(section, locale === 'en' ? 'Barrier capacity' : '骨墙吸收量')).toHaveTextContent(String(capacity));
        expect(stat(section, locale === 'en' ? 'Barrier duration' : '骨墙持续时间')).toHaveTextContent(locale === 'en' ? '6 s' : '6 秒');
        for (const phrase of locale === 'en'
          ? ['personal barrier', 'after mitigation, before Energy Shield and Bone Armor',
            'neither stacks nor refreshes while active', 'after exhaustion or expiry and cooldown',
            'Remaining capacity and time carry between waves']
          : ['个人骨墙', '先于能量护盾与白骨护甲结算', '生效期间不叠加、不刷新',
            '耗尽或到期且冷却结束后可再次施放', '剩余吸收量与时间延续至下一波'])
          expect(panel).toHaveTextContent(phrase);
        if (rank > 0 && rank < 20) {
          const next = within(panel).getByRole('heading', { name: locale === 'en' ? 'Next Level' : '下一级', level: 3 }).closest('section');
          if (!next) throw new Error('Missing next Wall capacity');
          expect(stat(next, locale === 'en' ? 'Barrier capacity' : '骨墙吸收量')).toHaveTextContent(String(capacity + 10));
        }
      } else {
        expect(stat(section, locale === 'en' ? 'Enemy effect duration' : '敌方效果持续时间')).toHaveTextContent(locale === 'en' ? '2 s' : '2 秒');
        expect(stat(section, locale === 'en' ? 'Boss / chapter boss effect duration' : '首领 / 章节首领效果持续时间')).toHaveTextContent(locale === 'en' ? '1 s' : '1 秒');
        for (const phrase of locale === 'en'
          ? ['all living enemies for 2 s', '1 s against bosses and chapter bosses',
            'preventing scheduled actions and interrupting channels', 'Already-launched non-channel spells continue',
            'Reapplication replaces the trap without stacking']
          : ['所有存活敌人', '持续2 秒', '首领与章节首领持续1 秒', '阻止其按原计划行动并打断引导',
            '已发出的非引导法术继续生效', '再次施加替换原骨牢，不叠加'])
          expect(panel).toHaveTextContent(phrase);
      }
      expect(panel).toHaveTextContent(locale === 'en' ? `${String(wall ? wallCost : prisonCost)} MP` : `${String(wall ? wallCost : prisonCost)} 点法力`);
      expect(panel).toHaveTextContent(locale === 'en' ? `Cooldown: ${String(cooldown)} s` : `冷却${String(cooldown)} 秒`);
      if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
      expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
      if (locale === 'zh-CN') expect(panel.textContent).not.toMatch(/bone[ -](?:wall|prison)/i);
      expect(usePlayerStore.getState().player).toEqual(before);
    });
  it(`allocates the real final rank without changing base stats (${locale}, ${defense})`, async () => {
    const panel = await arrange(locale, defense, 19), before = structuredClone(usePlayerStore.getState().player);
    fireEvent.click(within(panel).getByRole('button', { name: locale === 'en' ? /^Allocate$/ : /^分配$/ }));
    const after = usePlayerStore.getState().player;
    expect(after?.skillLevels?.['skills-necromancer-' + defense]).toBe(20);
    expect(after?.skillPoints).toBe(1);
    expect(after?.coreStats).toEqual(before?.coreStats);
    expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel).toHaveTextContent(locale === 'en' ? 'Cooldown: 3 s' : '冷却3 秒');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
  });
}

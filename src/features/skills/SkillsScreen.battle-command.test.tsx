import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
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
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 2, 20])(
  `Battle Command explains finite learned-party potency (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const skillLevels = { 'skills-barbarian-howl': 1, 'skills-barbarian-shout': 1,
      'skills-barbarian-battle-orders': 1, 'skills-barbarian-battle-command': rank };
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Command UI', 'barbarian'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-battle-command'));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    for (const phrase of locale === 'en'
      ? ['current living allies', 'already-learned skills', 'Permanent allocations', 'does not stack or refresh',
        'Later arrivals', 'remaining duration', 'fresh challenge']
      : ['当前存活盟友', '已学技能', '永久加点', '不会叠加或刷新', '后来加入', '剩余时间', '新的挑战']) {
      expect(panel).toHaveTextContent(phrase);
    }
    const section = within(panel).getByRole('heading', { name: locale === 'en'
      ? rank === 0 ? 'Learned at Lv. 1' : 'Current'
      : rank === 0 ? '学习后 Lv.1' : '当前' }).closest('section');
    if (!section) throw new Error('Missing current/learn preview');
    const rows = within(section).getAllByRole('term').map(term => term.parentElement);
    expect(rows.find(value => value?.textContent.includes(locale === 'en' ? 'Learned skill ranks' : '已学技能等级')))
      .toHaveTextContent('+1');
    expect(rows.find(value => value?.textContent.includes(locale === 'en' ? 'Command duration' : '指挥持续时间')))
      .toHaveTextContent(locale === 'en' ? `${String(8 + .5 * (at - 1))} s` : `${String(8 + .5 * (at - 1))} 秒`);
    expect(within(section).getByText(locale === 'en' ? 'Applies' : '附加', { exact: true }).parentElement)
      .toHaveTextContent(locale === 'en' ? 'Battle Command' : '战斗指挥');
    expect(panel).toHaveTextContent(locale === 'en' ? `${String(Math.round(11 - .1 * (at - 1)))} MP`
      : `${String(Math.round(11 - .1 * (at - 1)))} 点法力`);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    if (rank > 0 && rank < 20) expect(panel).toHaveTextContent(locale === 'en'
      ? `${String(8 + .5 * rank)} s` : `${String(8 + .5 * rank)} 秒`);
    expect(usePlayerStore.getState().player?.skillLevels).toEqual(skillLevels);
  });

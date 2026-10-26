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
for (const id of ['confuse', 'attract'] as const) for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 19, 20])(
  `shows finite ${id} targeting rules and actual current/next/MAX payment (${locale},rank%i)`, async rank => {
    const english = locale === 'en'; await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic targeting preview', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: {
        'skills-necromancer-dim-vision': 1, 'skills-necromancer-confuse': 1, ['skills-necromancer-' + id]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-' + id));
    const panel = screen.getByTestId('skill-detail-panel');
    for (const phrase of english
      ? ['for 3 s', 'living enemies still hostile to your party', 'Attract takes priority over Confuse',
        'ordinary targeting resumes', 'converted allies', 'Refreshes without stacking']
      : ['持续3 秒', '仍敌对我方的其他存活敌人', '吸引优先于迷乱', '恢复正常选敌', '已转化的盟友', '刷新持续时间，不叠加'])
      expect(panel).toHaveTextContent(phrase);
    if (id === 'attract') expect(panel).toHaveTextContent(english ? 'never targets itself' : '不会攻击自己');
    const mana = id === 'attract' ? 17 : rank < 2 ? 13 : rank === 19 ? 9 : 8;
    const cooldown = id === 'confuse' || rank < 2 ? 3 : rank === 19 ? 2.1 : 2;
    expect(panel).toHaveTextContent(english ? `Pays ${String(mana)} MP` : `消耗${String(mana)}点法力`);
    expect(panel).toHaveTextContent(english ? `${String(cooldown)} s cooldown` : `冷却${String(cooldown)}秒`);
    for (const [heading, cost, cd] of [
      ...(rank > 0 ? [[english ? 'Current' : '当前', mana, cooldown] as const] : []),
      ...(rank < 20 ? [[rank === 0 ? (english ? 'Learned at Lv. 1' : '学习后 Lv.1') : (english ? 'Next Level' : '下一级'), id === 'attract' ? 17 : rank === 19 ? 8 : 13,
        id === 'confuse' || rank < 2 ? 3 : 2] as const] : [])
    ]) {
      const section = screen.getByRole('heading', { name: heading }).closest('section');
      if (!section) throw new Error('Missing rank section');
      for (const [label, value] of [[english ? 'Enemy effect duration' : '敌方效果持续时间', english ? '3 s' : '3 秒'],
        [english ? 'Mana Cost' : '法力消耗', String(cost)], [english ? 'Cooldown' : '冷却', `${String(cd)} ${english ? 's' : '秒'}`]]) {
        if (!label || !value) throw new Error('Missing preview oracle');
        expect(within(section).getByText(label, { exact: true }).parentElement?.querySelector('dd')).toHaveTextContent(value);
      }
    }
    if (rank === 20) expect(panel).toHaveTextContent(english ? 'Max level reached.' : '已达到最高等级。');
    if (!english) expect(panel.textContent).not.toMatch(/\b(?:Confuse|Attract)\b/);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });

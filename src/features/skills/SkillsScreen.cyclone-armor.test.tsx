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

const copy = {
  en: { current: 'Current', next: 'Next Level', preview: 'Learned at Lv. 1',
    reduction: 'Damage Reduction', resistance: 'All Resistance Points',
    prose: 'does not heal or refill resources', max: 'Max level reached.' },
  'zh-CN': { current: '当前', next: '下一级', preview: '学习后 Lv.1',
    reduction: '伤害减免', resistance: '全抗（百分点）',
    prose: '不会治疗或补充资源', max: '已达到最高等级。' }
} as const;
function section(panel: HTMLElement, title: string) {
  const value = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!value) throw new Error('Missing Cyclone detail section'); return value;
}
function value(panel: HTMLElement, label: string) {
  const node = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!node) throw new Error('Missing Cyclone detail value'); return node.textContent;
}
function mount(rank: number) {
  const levels: Record<string, number> = { 'druid.arctic_blast': 1 };
  if (rank > 0) levels['druid.cyclone_armor'] = rank;
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Cyclone UI', 'druid'),
    level: 30, skillPoints: 2, skillLevels: levels, comboOrder: [] }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-druid-cyclone-armor'));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  it.each([1, 2, 20])(`shows actual current/next Cyclone defense and lifecycle (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale); const panel = mount(rank), text = copy[locale];
    const current = section(panel, text.current);
    expect(value(current, text.reduction)).toBe(String(rank * 2.5) + '%');
    expect(value(current, text.resistance)).toBe(String(rank));
    const next = section(panel, text.next);
    if (rank === 20) expect(next).toHaveTextContent(text.max);
    else {
      expect(value(next, text.reduction)).toContain(String((rank + 1) * 2.5) + '%');
      expect(value(next, text.resistance)).toContain(String(rank + 1));
    }
    expect(panel).toHaveTextContent(text.prose);
    expect(panel.textContent).not.toMatch(/\{\{|skills:|details\.passiveStat/);
  });
  it(`previews and learns Cyclone without changing resources or combo (${locale})`, async () => {
    await i18n.changeLanguage(locale); const panel = mount(0), text = copy[locale];
    expect(value(section(panel, text.preview), text.reduction)).toBe('2.5%');
    const before = structuredClone(usePlayerStore.getState().player);
    fireEvent.click(within(panel).getByRole('button'));
    expect(usePlayerStore.getState().player?.skillLevels?.['druid.cyclone_armor']).toBe(1);
    expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
    expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
  });
}

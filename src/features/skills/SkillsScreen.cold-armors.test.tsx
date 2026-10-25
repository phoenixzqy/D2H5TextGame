import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const slug of ['shiver-armor', 'chilling-armor']) {
  it.each([0, 1, 2, 20])(`${slug} truthful bilingual paid/counter preview (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic armor UI', 'sorceress'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-sorceress-' + slug]: rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + slug));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank), shiver = slug === 'shiver-armor';
    const min = (shiver ? 12 : 24) + (shiver ? 3 : 4) * (at - 1), max = (shiver ? 18 : 36) + (shiver ? 3 : 4) * (at - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)} Cold base damage`, 'Freeze for 1 s', 'bosses: 0.5 s',
        'Missed counters do not Freeze', 'Costs', 'Until this run ends', 'can coexist']
      : [`${String(min)}～${String(max)} 点冰冷基础伤害`, '冻结 1 秒', '首领：0.5 秒',
        '反击未命中不施加冻结', '消耗', '持续至本轮结束', '可与其他冰甲共存']) expect(panel).toHaveTextContent(phrase);
    expect(panel).toHaveTextContent(locale === 'en' ? (shiver ? 'direct Physical hit' : 'direct hostile hit')
      : (shiver ? '直接物理攻击' : '直接敌方攻击'));
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
  });
}

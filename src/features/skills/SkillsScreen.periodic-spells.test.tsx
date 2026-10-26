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
for (const locale of ['en', 'zh-CN'] as const) for (const spell of ['blaze', 'fire-wall', 'thunder-storm', 'inferno']) {
  it.each([0, 1, 2, 20])(`${spell} previews per-pulse damage, finite time and one payment (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic spell UI', 'sorceress'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels: { ['skills-sorceress-' + spell]: rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + spell));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    const growth = spell === 'inferno' ? 4 : spell === 'blaze' ? 5 : spell === 'fire-wall' ? 6 : 7;
    const min = (spell === 'inferno' ? 35 : spell === 'blaze' ? 60 : 70) + growth * (at - 1);
    const max = (spell === 'inferno' ? 55 : spell === 'blaze' ? 85 : spell === 'fire-wall' ? 100 : 110) + growth * (at - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)}`, 'per pulse', '3 s', 'every 1 s', '3 pulses', 'immediately', 'one payment',
        ...(spell === 'inferno' ? ['two-row cone', 'actions are occupied', 'interrupts without a refund', 'next wave'] : ['all living enemies'])]
      : [`${String(min)}～${String(max)}`, '每次脉冲', '3 秒', '每 1 秒', '共 3 次', '立即', '只支付一次',
        ...(spell === 'inferno' ? ['两排锥形', '占用施法者行动', '打断且不返还法力', '下一波'] : ['所有存活敌人'])]) expect(panel).toHaveTextContent(phrase);
    expect(panel).toHaveTextContent(locale === 'en' ? (spell === 'thunder-storm' ? 'Paralyze' : 'Burn')
      : (spell === 'thunder-storm' ? '麻痹' : '灼烧'));
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
  });
}

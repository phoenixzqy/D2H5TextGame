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
for (const locale of ['en', 'zh-CN'] as const) for (const id of ['teleport', 'enchant'] as const) {
  it.each([0, 1, 2, 20])(`${id} shows finite paid current/next/MAX bonuses (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic paid buff UI', 'sorceress'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-sorceress-' + id]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-' + id));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    const phrases = id === 'teleport' ? (locale === 'en'
      ? [`${String(at)} percentage points`, '1 s', 'magical dodge', 'without moving', 'next wave']
      : [`${String(at)} 个百分点`, '1 秒', '魔法闪避', '位置不变', '下一波']) : (locale === 'en'
      ? [`${String(at * 2)}% of Attack`, '10 s', 'direct Physical hit', 'Capture', 'shared hit', 'next wave']
      : [`攻击力的 ${String(at * 2)}%`, '10 秒', '直接物理攻击', '施放时记录', '共用命中', '下一波']);
    for (const text of phrases) expect(panel).toHaveTextContent(text);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
}

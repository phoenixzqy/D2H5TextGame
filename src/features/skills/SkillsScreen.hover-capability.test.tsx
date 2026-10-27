import { Suspense } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

afterEach(() => {
  cleanup(); vi.unstubAllGlobals(); usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const) it.each([false, true])(
  `preserves selection, keyboard previews and legal allocation with hover capability %s (${locale})`, async hover => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: hover, media }));
    await i18n.changeLanguage(locale);
    usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready');
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic hover fixture', 'assassin'),
      level: 30, skillPoints: 20, skillLevels: { 'assassin.tiger_strike': 1 },
      comboOrder: ['skills-assassin-tiger-strike'] }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    const tiger = screen.getByTestId('skill-node-skills-assassin-tiger-strike');
    const other = screen.getByTestId('skill-node-skills-assassin-wake-of-inferno');
    fireEvent.click(tiger);
    const panel = within(screen.getByTestId('skill-detail-panel'));
    const selected = locale === 'en' ? 'Tiger Strike' : '虎击';
    const preview = locale === 'en' ? 'Wake of Inferno' : '炼狱复苏';
    fireEvent.mouseEnter(other);
    expect(panel.getByRole('heading', { level: 2 })).toHaveTextContent(hover ? preview : selected);
    fireEvent.mouseLeave(other);
    expect(panel.getByRole('heading', { level: 2 })).toHaveTextContent(selected);
    fireEvent.focus(other);
    expect(panel.getByRole('heading', { level: 2 })).toHaveTextContent(preview);
    fireEvent.keyDown(other, { key: 'Tab' }); fireEvent.blur(other);
    expect(panel.getByRole('heading', { level: 2 })).toHaveTextContent(selected);
    if (!hover) fireEvent.mouseEnter(other);
    fireEvent.click(panel.getByRole('button', { name: locale === 'en' ? 'Allocate' : '分配' }));
    expect(usePlayerStore.getState().player?.skillLevels?.['assassin.tiger_strike']).toBe(2);
    expect(usePlayerStore.getState().player?.skillLevels?.['assassin.wake_of_inferno']).toBeUndefined();
    expect(usePlayerStore.getState().player?.skillPoints).toBe(19);
    expect(panel.getByRole('heading', { level: 2 })).toHaveTextContent(selected);
  });

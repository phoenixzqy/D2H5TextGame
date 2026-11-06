import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { useMetaStore, useMercStore, useInventoryStore, usePlayerStore, useCombatStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { GachaScreen } from './GachaScreen';

beforeEach(() => {
  vi.useFakeTimers(); useMetaStore.getState().reset(); useMercStore.getState().reset();
  useInventoryStore.getState().reset(); useCombatStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Reveal', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  useInventoryStore.setState({ currencies: { wishstone: 100 } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function draw() {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><GachaScreen /></MemoryRouter></Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('gacha-pull-10'));
}
it('reveals sequentially, then skips without charging or rolling again', () => {
  draw(); const list = screen.getByTestId('gacha-results');
  expect(list.querySelectorAll('li')).toHaveLength(1);
  expect(useMetaStore.getState().recruitmentState.totalPulls).toBe(10);
  expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  act(() => { vi.advanceTimersByTime(250); });
  expect(list.querySelectorAll('li')).toHaveLength(2);
  const history = useMetaStore.getState().recruitmentState.history;
  fireEvent.click(screen.getByTestId('gacha-skip-reveal'));
  expect(list.querySelectorAll('li')).toHaveLength(10);
  expect(screen.queryByTestId('gacha-skip-reveal')).not.toBeInTheDocument();
  expect(useMetaStore.getState().recruitmentState.history).toBe(history);
  expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
});
it('shows all paid results immediately when reduced motion is requested', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  draw(); expect(screen.getByTestId('gacha-results').querySelectorAll('li')).toHaveLength(10);
  expect(screen.queryByTestId('gacha-skip-reveal')).not.toBeInTheDocument();
});

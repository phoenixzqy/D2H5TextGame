import { beforeEach, expect, it } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AppRoutes } from './routes';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';

beforeEach(() => {
  usePlayerStore.getState().setPlayer(createMockPlayer('Recruitment route', 'sorceress'));
  useHydrationStore.getState().setStatus('ready'); useInventoryStore.getState().reset();
  useMercStore.getState().reset(); useMetaStore.getState().reset();
});
function at(path: string) {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
}
it('opens recruitment from its production route with the earned wallet', () => {
  useInventoryStore.setState({ currencies: { wishstone: 90 } }); at('/gacha');
  expect(screen.getByTestId('gacha-screen')).toBeInTheDocument();
  expect(screen.getByTestId('gacha-pull-10')).toBeEnabled();
});
it('lets the player reach wishstone recruitment from the roster', () => {
  at('/mercs'); fireEvent.click(screen.getByTestId('merc-gacha-link'));
  expect(screen.getByTestId('gacha-screen')).toBeInTheDocument();
});
it('keeps recruitment behind the existing character guard', () => {
  usePlayerStore.getState().reset(); at('/gacha');
  expect(screen.queryByTestId('gacha-screen')).not.toBeInTheDocument();
  expect(screen.getByTestId('home-new-game')).toBeInTheDocument();
});

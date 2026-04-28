/**
 * GachaScreen smoke tests — verifies banner data renders and `pullGacha`
 * action mutates the merc store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { GachaScreen } from './GachaScreen';
import { useMetaStore, useMercStore } from '@/stores';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter>
          <GachaScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('GachaScreen', () => {
  beforeEach(() => {
    act(() => {
      useMetaStore.getState().reset();
      useMercStore.getState().reset();
    });
  });

  it('renders pull buttons disabled when wallet is empty', () => {
    renderScreen();
    expect(screen.getByTestId('gacha-pull-1')).toBeDisabled();
    expect(screen.getByTestId('gacha-pull-10')).toBeDisabled();
  });

  it('runs a single pull and adds a merc to the roster', () => {
    act(() => {
      useMetaStore.getState().addGachaCurrency(1000);
    });
    renderScreen();

    const before = useMercStore.getState().ownedMercs.length;
    fireEvent.click(screen.getByTestId('gacha-pull-1'));
    const after = useMercStore.getState().ownedMercs.length;
    expect(after).toBeGreaterThanOrEqual(before + 1);
    expect(screen.getByTestId('gacha-results')).toBeInTheDocument();
  });

  it('runs a 10-pull and lists ten reveals', () => {
    act(() => {
      useMetaStore.getState().addGachaCurrency(10_000);
    });
    renderScreen();
    fireEvent.click(screen.getByTestId('gacha-pull-10'));
    const list = screen.getByTestId('gacha-results');
    expect(list.querySelectorAll('li').length).toBe(10);
  });
});

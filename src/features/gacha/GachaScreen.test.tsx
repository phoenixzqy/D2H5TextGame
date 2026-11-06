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
import { useMetaStore, useMercStore, useInventoryStore, usePlayerStore, useCombatStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GachaScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('GachaScreen', () => {
  it('retains the saved history when the screen is remounted', () => {
    act(() => { useMetaStore.getState().addGachaCurrency(90); });
    const mounted = renderScreen();
    fireEvent.click(screen.getByTestId('gacha-pull-10'));
    const history = useMetaStore.getState().recruitmentState.history;
    expect(history).toHaveLength(10);
    mounted.unmount(); renderScreen();
    expect(screen.getByTestId('gacha-recent').querySelectorAll('li')).toHaveLength(10);
    expect(useMetaStore.getState().recruitmentState.history).toBe(history);
    expect(screen.getByTestId('gacha-copy-history')).toBeEnabled();
  });
  beforeEach(() => {
    act(() => {
      useMetaStore.getState().reset();
      useMercStore.getState().reset();
      useInventoryStore.getState().reset();
      useCombatStore.getState().reset();
      usePlayerStore.getState().setPlayer(createMockPlayer('Recruitment', 'sorceress'));
      useHydrationStore.getState().setStatus('ready');
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
    fireEvent.click(screen.getByTestId('gacha-skip-reveal'));
    const list = screen.getByTestId('gacha-results');
    expect(list.querySelectorAll('li').length).toBe(10);
  });

  it('shows earned wishstones, pays exactly the displayed ten-pull cost and updates both buttons', () => {
    useInventoryStore.setState({ currencies: { wishstone: 90 } });
    renderScreen();
    expect(screen.getByText('💠 90')).toBeInTheDocument();
    expect(screen.getByTestId('gacha-pull-10')).toBeEnabled();
    fireEvent.click(screen.getByTestId('gacha-pull-10'));
    fireEvent.click(screen.getByTestId('gacha-skip-reveal'));
    expect(screen.getByTestId('gacha-results').querySelectorAll('li')).toHaveLength(10);
    expect(screen.getByText('💠 0')).toBeInTheDocument();
    expect(screen.getByTestId('gacha-pull-1')).toBeDisabled();
    expect(screen.getByTestId('gacha-pull-10')).toBeDisabled();
  });

  it('displays conserved legacy value without moving it just by opening recruitment', () => {
    useInventoryStore.setState({ currencies: { wishstone: 5 } });
    useMetaStore.getState().updateGachaState({ currency: 5 });
    renderScreen();
    expect(screen.getByText('💠 10')).toBeInTheDocument();
    expect(screen.getByTestId('gacha-pull-1')).toBeEnabled();
    expect(useInventoryStore.getState().currencies.wishstone).toBe(5);
    expect(useMetaStore.getState().gachaState.currency).toBe(5);
  });

  it.each(['en', 'zh-CN'])('shows localized refusal feedback in %s', async locale => {
    await i18n.changeLanguage(locale);
    useInventoryStore.setState({ currencies: { wishstone: 100 } });
    useHydrationStore.getState().setStatus('loading');
    renderScreen();
    fireEvent.click(screen.getByTestId('gacha-pull-1'));
    expect(screen.getByRole('alert')).toHaveTextContent(locale === 'en'
      ? 'Recruitment could not be completed.' : '暂时无法完成招募。');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(100);
    expect(screen.queryByTestId('gacha-results')).not.toBeInTheDocument();
  });
});

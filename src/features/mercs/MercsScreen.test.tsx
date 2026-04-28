/**
 * MercsScreen smoke tests — verifies roster joins runtime mercs with their
 * static defs and that "Set as Fielded" flips the active merc.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { MercsScreen } from './MercsScreen';
import { useMercStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter>
          <MercsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('MercsScreen', () => {
  beforeEach(() => {
    act(() => {
      useMercStore.getState().reset();
    });
  });

  it('shows empty state when no mercs are owned', () => {
    renderScreen();
    expect(screen.getByTestId('mercs-screen').textContent).toMatch(
      /尚未|no mercenaries/i
    );
  });

  it('renders an owned merc and toggles fielded state', () => {
    const pool = loadMercPool();
    const def = pool.pool[0];
    if (!def) throw new Error('merc pool is empty');
    act(() => {
      useMercStore.getState().addMerc(createMercFromDef(def));
    });
    renderScreen();

    const card = screen.getByTestId(`merc-card-${def.id}`);
    expect(card).toBeInTheDocument();

    const button = screen.getByTestId(`merc-field-${def.id}`);
    fireEvent.click(button);
    expect(useMercStore.getState().fieldedMercId).not.toBeNull();
  });
});

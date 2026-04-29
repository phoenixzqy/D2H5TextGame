/**
 * HomeScreen.test — verifies the "新游戏 / New Game" button navigates
 * to /character/new (Bug #14 regression).
 */
import { describe, it, expect } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '@/i18n';
import { HomeScreen } from './HomeScreen';

function renderHome() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route
              path="/character/new"
              element={<div data-testid="character-create-route">create</div>}
            />
          </Routes>
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('HomeScreen — new game button (Bug #14)', () => {
  it('navigates to /character/new on click', async () => {
    renderHome();
    const btn = await screen.findByTestId('home-new-game');
    act(() => {
      fireEvent.click(btn);
    });
    expect(screen.getByTestId('character-create-route')).toBeDefined();
  });
});

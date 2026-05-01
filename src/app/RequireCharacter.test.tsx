/**
 * RequireCharacter RTL — mirrors the redirect-guard half of
 * tests/e2e/welcome-gate.spec.ts ("direct navigation to /town
 * redirects to home").
 *
 * Asserts that:
 *   - With no player in the store, hitting any guarded route renders
 *     a <Navigate to="/" replace />, landing the user on the title screen.
 *   - With a player set, the children render as-is.
 *
 * What stays Playwright-only (documented for P08):
 *   - URL-bar address (`page.url()` / `window.location.href`) — that's a
 *     real-history concern and the in-memory router doesn't update it.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireCharacter } from './RequireCharacter';
import { usePlayerStore } from '@/stores';
import { createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';

function Harness({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={[initialPath]}
    >
      <Routes>
        <Route path="/" element={<div data-testid="home-screen">home</div>} />
        <Route
          path="/town"
          element={
            <RequireCharacter>
              <div data-testid="town-screen">town</div>
            </RequireCharacter>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireCharacter>
              <div data-testid="inventory-screen">inv</div>
            </RequireCharacter>
          }
        />
        <Route
          path="/skills"
          element={
            <RequireCharacter>
              <div data-testid="skills-screen">skills</div>
            </RequireCharacter>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('<RequireCharacter> — route guard', () => {
  beforeEach(() => {
    act(() => { usePlayerStore.getState().reset(); });
  });

  it('redirects to "/" when no player is set (route: /town)', () => {
    render(<Harness initialPath="/town" />);
    expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('town-screen')).toBeNull();
  });

  it('redirects to "/" when no player is set (route: /inventory)', () => {
    render(<Harness initialPath="/inventory" />);
    expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('inventory-screen')).toBeNull();
  });

  it('redirects to "/" when no player is set (route: /skills)', () => {
    render(<Harness initialPath="/skills" />);
    expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('skills-screen')).toBeNull();
  });

  it('renders children when a player is set', () => {
    const cls: CharacterClass = 'barbarian';
    act(() => { usePlayerStore.getState().setPlayer(createMockPlayer('Hero', cls)); });
    render(<Harness initialPath="/town" />);
    expect(screen.getByTestId('town-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });

  it('after store reset, subsequent guarded routes redirect again', () => {
    act(() => { usePlayerStore.getState().setPlayer(createMockPlayer('Hero', 'sorceress')); });
    const { unmount } = render(<Harness initialPath="/inventory" />);
    expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
    unmount();
    act(() => { usePlayerStore.getState().reset(); });
    render(<Harness initialPath="/inventory" />);
    expect(screen.getByTestId('home-screen')).toBeInTheDocument();
  });
});

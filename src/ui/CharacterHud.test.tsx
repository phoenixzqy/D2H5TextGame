/**
 * CharacterHud.test — renders avatar, name, level, and HP/MP/XP bars
 * driven by the player store. Verifies hide-on-combat behaviour.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { CharacterHud } from './CharacterHud';
import { usePlayerStore } from '@/stores';
import { createMockPlayer } from '@/features/character/createMockPlayer';

function renderAt(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[path]}>
          <Routes>
            <Route path="*" element={<CharacterHud />} />
          </Routes>
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('CharacterHud', () => {
  beforeEach(() => {
    act(() => { usePlayerStore.getState().reset(); });
  });

  it('renders nothing when no player exists', () => {
    const { container } = renderAt('/town');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders name, level, and three bars when a player is set', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderAt('/town');
    const hud = screen.getByTestId('character-hud');
    expect(hud).toBeInTheDocument();
    expect(hud).toHaveTextContent('Korlic');
    expect(hud).toHaveTextContent('1'); // level

    const hp = screen.getByTestId('hud-hp');
    const mp = screen.getByTestId('hud-mp');
    const xp = screen.getByTestId('hud-xp');
    expect(hp).toHaveAttribute('role', 'progressbar');
    expect(mp).toHaveAttribute('role', 'progressbar');
    expect(xp).toHaveAttribute('role', 'progressbar');
    // Mock barbarian (post deriveStats fix): life 150/150, mana 65/65, xp 0/100
    expect(hp).toHaveAttribute('aria-valuenow', '150');
    expect(hp).toHaveAttribute('aria-valuemax', '150');
    expect(mp).toHaveAttribute('aria-valuenow', '65');
    expect(mp).toHaveAttribute('aria-valuemax', '65');
    expect(xp).toHaveAttribute('aria-valuenow', '0');
    expect(xp).toHaveAttribute('aria-valuemax', '100');
  });

  it('reflects updated HP/XP after store mutation', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });
    renderAt('/town');

    act(() => {
      usePlayerStore.getState().setPlayer({
        ...player,
        derivedStats: { ...player.derivedStats, life: 20 },
        experience: 50,
      });
    });

    expect(screen.getByTestId('hud-hp')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByTestId('hud-xp')).toHaveAttribute('aria-valuenow', '50');
  });

  it('navigates to /character when clicked', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    const seen: string[] = [];
    function Probe() {
      const loc = useLocation();
      seen.push(loc.pathname);
      return null;
    }

    render(
      <I18nextProvider i18n={i18n}>
        <Suspense fallback={null}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/town']}>
            <CharacterHud />
            <Probe />
          </MemoryRouter>
        </Suspense>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByTestId('character-hud'));
    expect(seen[seen.length - 1]).toBe('/character');
  });

  it('hides on combat screen', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderAt('/combat');
    expect(screen.queryByTestId('character-hud')).toBeNull();
  });

  it('hides on home and character creation routes', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderAt('/');
    expect(screen.queryByTestId('character-hud')).toBeNull();

    renderAt('/character/new');
    expect(screen.queryByTestId('character-hud')).toBeNull();

    renderAt('/character');
    expect(screen.queryByTestId('character-hud')).toBeNull();
  });

  it('hides on /dev and any /dev/* route', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderAt('/dev');
    expect(screen.queryByTestId('character-hud')).toBeNull();

    renderAt('/dev/items');
    expect(screen.queryByTestId('character-hud')).toBeNull();

    renderAt('/dev/classes/sorceress');
    expect(screen.queryByTestId('character-hud')).toBeNull();
  });

  it('still renders on routes that merely contain "dev" as a substring', () => {
    const player = createMockPlayer('Korlic', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderAt('/town');
    expect(screen.queryByTestId('character-hud')).toBeInTheDocument();
  });
});

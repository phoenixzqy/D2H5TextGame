/**
 * CharacterScreen.test — verifies all stat groups render from
 * usePlayerStore + useInventoryStore for a freshly-created Barbarian.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { CharacterScreen } from './CharacterScreen';
import { useInventoryStore, usePlayerStore } from '@/stores';
import { createMockPlayer } from './createMockPlayer';
import type { Item } from '@/engine/types/items';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter initialEntries={['/character']}>
          <CharacterScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('CharacterScreen', () => {
  beforeEach(() => {
    act(() => {
      usePlayerStore.getState().reset();
      useInventoryStore.getState().reset();
    });
  });

  it('shows a placeholder when no character exists', () => {
    renderScreen();
    expect(screen.getByTestId('character-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('char-core-stats')).toBeNull();
  });

  it('renders all stat groups for a fresh Barbarian', () => {
    const player = createMockPlayer('Bul Kathos', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderScreen();

    expect(screen.getByTestId('char-name')).toHaveTextContent('Bul Kathos');
    expect(screen.getByTestId('char-class')).toBeInTheDocument();
    expect(screen.getByTestId('char-level')).toHaveTextContent('1');

    // core stats panel exists with all four attributes
    const core = screen.getByTestId('char-core-stats');
    expect(core).toBeInTheDocument();
    // Barbarian: str 30, dex 20, vit 25, energy 10
    expect(core).toHaveTextContent('30');
    expect(core).toHaveTextContent('20');
    expect(core).toHaveTextContent('25');
    expect(core).toHaveTextContent('10');

    expect(screen.getByTestId('char-stat-points')).toHaveTextContent('0');
    expect(screen.getByTestId('char-skill-points')).toHaveTextContent('1');

    expect(screen.getByTestId('char-derived-stats')).toBeInTheDocument();
    expect(screen.getByTestId('char-resistances')).toBeInTheDocument();
  });

  it('shows equipped items with rarity colors when inventory has them', () => {
    const player = createMockPlayer('Bul Kathos', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    const sword: Item = {
      id: 'item-1',
      baseId: 'items/base/wp1h-short-sword',
      rarity: 'unique',
      level: 5,
      identified: true,
      equipped: false,
    };
    act(() => {
      useInventoryStore.getState().addItem(sword);
      useInventoryStore.getState().equipItem(sword);
    });

    renderScreen();

    const equip = screen.getByTestId('char-equipment');
    expect(equip).toBeInTheDocument();
    expect(equip).toHaveTextContent('items/base/wp1h-short-sword');
    // unique => text-d2-unique class on the RarityText span
    const span = equip.querySelector('.text-d2-unique');
    expect(span).not.toBeNull();
  });

  it('shows the empty-state when nothing is equipped', () => {
    const player = createMockPlayer('Bul Kathos', 'barbarian');
    act(() => { usePlayerStore.getState().setPlayer(player); });

    renderScreen();

    expect(screen.queryByTestId('char-equipment')).toBeNull();
    // Empty-state copy renders (default fallback if zh-CN not loaded yet)
    expect(screen.getByTestId('character-screen').textContent).toMatch(
      /(尚未装备任何物品|No items equipped)/,
    );
  });
});

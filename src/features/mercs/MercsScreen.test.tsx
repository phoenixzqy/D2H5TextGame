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
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

  it('hires an act-specific merc without opening gacha', () => {
    renderScreen();

    const hireButton = screen.getAllByRole('button', { name: /招募|hire/i })[0];
    if (!hireButton) throw new Error('hire button not found');
    fireEvent.click(hireButton);

    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
    expect(useMercStore.getState().fieldedMercId).toBe(useMercStore.getState().ownedMercs[0]?.id);
  });

  it('blocks dismissing a merc that still has equipment', () => {
    const pool = loadMercPool();
    const def = pool.pool[0];
    if (!def) throw new Error('merc pool is empty');
    act(() => {
      const merc = createMercFromDef(def);
      useMercStore.getState().addMerc(merc);
      useMercStore.setState((s) => ({
        mercEquipment: {
          ...s.mercEquipment,
          [merc.id]: {
            weapon: { id: 'item-1', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: true, affixes: [] },
          },
        },
      }));
    });
    renderScreen();

    fireEvent.click(screen.getByTestId(`merc-dismiss-${def.id}`));

    expect(screen.getByText(/先卸下|Unequip every item/i)).toBeInTheDocument();
    expect(screen.queryByTestId(`merc-dismiss-confirm-${def.id}`)).not.toBeInTheDocument();
    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
  });
});

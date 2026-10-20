/** Earned mercenary core stats remain visible as runtime progression changes. */
import { beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { MercsScreen } from './MercsScreen';

function expectStats(card: HTMLElement, strength: number, dexterity: number, vitality: number) {
  for (const [label, value] of [['STR', strength], ['DEX', dexterity], ['VIT', vitality]] as const) {
    expect(within(card).getByText(label).parentElement).toHaveTextContent(`${label}${String(value)}`);
  }
}

describe('MercsScreen live earned core stats', () => {
  beforeEach(() => { useMercStore.getState().reset(); });

  it.each([true, false])('shows current core stats through a real level-up (known definition=%s)', (known) => {
    const def = loadMercPool().pool.find(merc => merc.id === 'mercs/act1-rogue-inner-sight');
    if (!def) throw new Error('Missing authored Inner Sight mercenary');
    const fresh = createMercFromDef(def);
    const merc = known ? fresh : { ...fresh, id: 'legacy-unknown-rogue' };
    useMercStore.getState().addMerc(merc);
    // Explicit canonical progress isolates the display defect from missing defaults.
    useMercStore.setState({ mercProgress: { [merc.id]: { experience: 0, experienceToNextLevel: 304 } } });
    render(
      <I18nextProvider i18n={i18n}>
        <Suspense fallback={null}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MercsScreen />
          </MemoryRouter>
        </Suspense>
      </I18nextProvider>
    );
    const card = screen.getByTestId(`merc-card-${merc.id}`);
    expectStats(card, 12, 22, 16);
    act(() => {
      expect(useMercStore.getState().addExperience(merc.id, 304)).toEqual({ levelsGained: 1, newLevel: 4 });
    });
    expect(useMercStore.getState().ownedMercs[0]?.coreStats).toEqual({ strength: 13, dexterity: 25, vitality: 16, energy: 15 });
    expectStats(card, 13, 25, 16);
    expect(within(card).getByTestId(`merc-xp-${merc.id}`)).toHaveTextContent('0 / 527');
  });
});

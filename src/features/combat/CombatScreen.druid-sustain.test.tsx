import { afterEach, beforeEach, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit, abortSubAreaRun } from '@/stores/combatHelpers';
import {
  useCombatStore,
  useMapStore,
  useMetaStore,
  usePlayerStore,
  useInventoryStore
} from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';
const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore];
beforeEach(() => {
  abortSubAreaRun();
  for (const s of stores) s.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  abortSubAreaRun();
  for (const s of stores) s.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const) {
  it(
    'shows a localized positive Feral stack and removes it with playback state in ' + locale,
    async () => {
      await i18n.changeLanguage(locale);
      const fresh = { ...createMockPlayer('Feral chip fixture', 'druid'), level: 30 };
      usePlayerStore.getState().setPlayer(fresh);
      const hero = {
        ...playerToCombatUnit(fresh),
        statuses: [
          {
            id: 'feral-rage',
            sourceId: fresh.id,
            stacks: 3,
            remaining: 8,
            appliedAtMs: 1700,
            expiresAtMs: 9700,
            feralRage: true as const
          }
        ]
      };
      useCombatStore.setState({
        inCombat: true,
        isPaused: true,
        playerTeam: [hero],
        enemyTeam: []
      });
      render(
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={null}>
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <CombatScreen />
            </MemoryRouter>
          </Suspense>
        </I18nextProvider>
      );
      const card = screen.getByTestId('unit-card-' + hero.id);
      const chip = within(card).getByTestId('unit-effect-chips').firstElementChild;
      expect.soft(chip).toHaveTextContent(locale === 'en' ? 'Feral Rage' : '野性狂暴');
      expect.soft(chip).toHaveClass('text-blue-200');
      act(() => {
        useCombatStore.setState({ playerTeam: [{ ...hero, statuses: [] }] });
      });
      expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
    }
  );
}

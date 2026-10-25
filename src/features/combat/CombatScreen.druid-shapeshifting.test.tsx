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
import { refreshDruidForm } from '@/engine/skills/druid-shapeshifting';
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
for (const locale of ['en', 'zh-CN'] as const)
  for (const form of ['werewolf', 'werebear'] as const) {
    it(
      'shows a localized positive paid ' + form + ' form and removes it with playback in ' + locale,
      async () => {
        await i18n.changeLanguage(locale);
        const fresh = {
          ...createMockPlayer('Paid form chip fixture', 'druid'),
          level: 30,
          skillLevels: { 'druid.werewolf': 1, 'druid.werebear': 1, 'druid.lycanthropy': 1 },
          comboOrder: ['druid.' + form]
        };
        usePlayerStore.getState().setPlayer(fresh);
        const hero = refreshDruidForm(playerToCombatUnit(fresh), form);
        useCombatStore.setState({
          inCombat: true,
          isPaused: true,
          playerTeam: [hero],
          enemyTeam: [],
          recordedEvents: [
            {
              kind: 'buff',
              target: hero.id,
              buffId: form,
              statusBacked: true,
              simClockMs: 0,
              uiDelayMs: 0
            }
          ],
          eventCursor: 1
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
        expect.soft(chip).toHaveTextContent(i18n.t('skills:druid.' + form + '.name'));
        expect.soft(chip).toHaveClass('text-blue-200');
        expect
          .soft(within(card).getByTestId('combat-event-fx'))
          .toHaveTextContent(i18n.t('skills:druid.' + form + '.name'));
        act(() => {
          useCombatStore.setState({ playerTeam: [{ ...hero, statuses: [] }] });
        });
        expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
      }
    );
  }

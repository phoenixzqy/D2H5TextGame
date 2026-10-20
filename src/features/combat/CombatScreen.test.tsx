import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { CombatScreen } from './CombatScreen';

beforeEach(() => {
  abortSubAreaRun();
  useCombatStore.getState().reset();
  useMapStore.getState().reset();
  useMetaStore.getState().reset();
  usePlayerStore.getState().reset();
});

afterEach(() => {
  cleanup();
  abortSubAreaRun();
  useCombatStore.getState().reset();
  usePlayerStore.getState().reset();
  useMetaStore.getState().reset();
});

describe('combat terminal outcome copy', () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    it.each(['draw', 'defeat', 'victory'] as const)('%s preserves its actual terminal label in ' + locale, async (result) => {
      await i18n.changeLanguage(locale);
      const player = createMockPlayer('TerminalCopy', 'sorceress');
      const hero = playerToCombatUnit(player);
      const winner = result === 'draw' ? null : result === 'defeat' ? 'enemy' : 'player';
      usePlayerStore.getState().setPlayer(player);
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      useCombatStore.setState({
        inCombat: false,
        playerTeam: [hero],
        playbackComplete: true,
        outcome: { winner, finalPlayerTeam: [hero], finalEnemyTeam: [] },
        runVictory: result === 'victory',
        runDefeat: result !== 'victory'
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

      const panel = screen.getByTestId(result === 'victory' ? 'victory-panel' : 'defeat-panel');
      const titleKey = result === 'draw' ? 'event.draw' : result === 'victory' ? 'runVictoryTitle' : 'runDefeatTitle';
      expect(within(panel).getByRole('heading')).toHaveTextContent(i18n.t(`combat:${titleKey}`));
      expect(within(panel).getByTestId('return-to-map')).toBeEnabled();
      expect(within(panel).getByTestId('return-to-town')).toBeEnabled();
      expect(useCombatStore.getState().outcome?.winner).toBe(winner);
      if (result !== 'victory') {
        expect(screen.queryByTestId('continue-next-subarea')).not.toBeInTheDocument();
        expect(screen.queryByTestId('victory-panel')).not.toBeInTheDocument();
      }
    });
  }
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import type { CombatUnit } from '@/engine/combat/types';
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


/** UI-only playback fixtures; no campaign, recovery or timing behavior is injected. */
describe('live combat resource display', () => {
  function fixture(): CombatUnit {
    const player = createMockPlayer('ResourceDisplay', 'sorceress');
    usePlayerStore.getState().setPlayer(player);
    return { ...playerToCombatUnit(player), id: 'visible-hero', kind: 'hero',
      life: 64, mana: 53,
      stats: { ...player.derivedStats, life: 120, lifeMax: 128, mana: 0, manaMax: 106 },
      gridPosition: { row: 1, col: 1 } };
  }

  function renderTeams(team: readonly CombatUnit[], enemy: readonly CombatUnit[] = []) {
    useCombatStore.setState({ inCombat: true, isPaused: true, playbackComplete: false,
      playerTeam: [...team], enemyTeam: [...enemy], recordedEvents: [], eventCursor: 0,
      currentWave: 1, totalWaves: 3,
      outcome: { winner: 'player', finalPlayerTeam: team.map(unit => ({ ...unit, mana: 1 })),
        finalEnemyTeam: enemy } });
    return render(
      <I18nextProvider i18n={i18n}>
        <Suspense fallback={null}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CombatScreen />
          </MemoryRouter>
        </Suspense>
      </I18nextProvider>
    );
  }

  for (const locale of ['en', 'zh-CN'] as const) {
    it('uses live hero MP and true maxima after preceding merc/summon in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      const before = structuredClone(hero);
      const merc: CombatUnit = { ...hero, id: 'visible-merc', kind: 'merc', mana: 77,
        stats: { ...hero.stats, manaMax: 999 }, gridPosition: { row: 1, col: 0 } };
      const summon: CombatUnit = { ...hero, id: 'visible-summon', kind: 'summon',
        summonOwnerId: hero.id, mana: 88, gridPosition: { row: 1, col: 2 } };
      const enemy: CombatUnit = { ...hero, id: 'visible-enemy', side: 'enemy', kind: 'monster',
        life: 50, stats: { ...hero.stats, life: 50, lifeMax: 200 },
        gridPosition: { row: 0, col: 1 } };
      renderTeams([merc, summon, hero], [enemy]);

      expect.soft(screen.getByTestId('unit-card-visible-hero').querySelector('.bg-red-600'))
        .toHaveStyle({ width: '50%' });
      expect.soft(screen.getByTestId('unit-card-visible-enemy').querySelector('.bg-red-600'))
        .toHaveStyle({ width: '25%' });
      const resources = screen.getByRole('group', { name: i18n.t('combat:mp') });
      expect(within(resources).getByText('53 / 106', { exact: true })).toBeVisible();
      const bar = within(resources).getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '53');
      expect(bar).toHaveAttribute('aria-valuemax', '106');
      expect(bar).toHaveStyle({ width: '50%' });
      expect(hero).toEqual(before);

      act(() => { useCombatStore.setState({ playerTeam: [merc, summon, { ...hero, mana: 0 }] }); });
      expect(within(resources).getByText('0 / 106', { exact: true })).toBeVisible();
      expect(within(resources).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      act(() => { useCombatStore.setState({ playerTeam: [merc, summon, { ...hero, mana: 61 }] }); });
      expect(within(resources).getByText('61 / 106', { exact: true })).toBeVisible();
      expect(useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === hero.id)?.mana).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(102);
    });

    it('preserves extra-row cell identity and first stacked representative in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      const merc: CombatUnit = { ...hero, id: 'stack-merc', kind: 'merc', gridPosition: { row: 0, col: 0 } };
      const first: CombatUnit = { ...hero, id: 'stack-first', name: 'First Summon', kind: 'summon',
        summonOwnerId: hero.id, gridPosition: { row: 3, col: 2 } };
      const second: CombatUnit = { ...first, id: 'stack-second', name: 'Second Summon' };
      const team = [merc, first, second, hero];
      const before = structuredClone(team);
      renderTeams(team);
      const grid = screen.getByTestId('allies-grid');
      expect(grid.children).toHaveLength(12);
      expect(screen.getByTestId('enemies-grid').children).toHaveLength(9);
      expect(within(screen.getByTestId('player-grid-cell-1-1')).getByTestId('unit-card-visible-hero')).toBeVisible();
      expect(within(screen.getByTestId('player-grid-cell-0-0')).getByTestId('unit-card-stack-merc')).toBeVisible();
      const stack = screen.getByTestId('player-grid-cell-3-2');
      expect(grid.children[11]).toBe(stack);
      expect(within(stack).getByTestId('unit-card-stack-first')).toBeVisible();
      expect(within(stack).queryByTestId('unit-card-stack-second')).not.toBeInTheDocument();
      expect(within(stack).getByText('+1', { exact: true })).toBeVisible();
      expect(useCombatStore.getState().playerTeam).toEqual(before);
      expect(team).toEqual(before);
    });

    it('omits hero MP without a hero in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      renderTeams([{ ...hero, id: 'merc-only', kind: 'merc' }]);
      expect(screen.queryByRole('group', { name: i18n.t('combat:mp') })).not.toBeInTheDocument();
      expect(screen.getByTestId('unit-card-merc-only')).toBeVisible();
    });

    it('omits zero-capacity MP without hiding its hero in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      renderTeams([{ ...hero, mana: 0, stats: { ...hero.stats, mana: 50, manaMax: 0 } }]);
      expect(screen.queryByRole('group', { name: i18n.t('combat:mp') })).not.toBeInTheDocument();
      expect(screen.getByTestId('unit-card-visible-hero')).toBeVisible();
    });
  }
});

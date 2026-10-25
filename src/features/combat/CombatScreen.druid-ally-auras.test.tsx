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
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { applyEventToTeams, stageStatusPlayback } from '@/stores/combatPlayback';
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
  it(
    'shows actual positive localized allied aura chips and removes them through playback in ' +
      locale,
    async () => {
      await i18n.changeLanguage(locale);
      const fresh = {
        ...createMockPlayer('Aura chip fixture', 'druid'),
        level: 30,
        skillLevels: { 'druid.oak_sage': 20, 'druid.heart_of_wolverine': 20 },
        comboOrder: []
      };
      usePlayerStore.getState().setPlayer(fresh);
      const source = playerToCombatUnit(fresh),
        hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
        dot = {
          id: 'ignite',
          sourceId: 'fixture',
          stacks: 1,
          remaining: -1,
          expiresAtMs: 1000,
          dotPerStack: 1
        };
      const hero = { ...source, life: 1, statuses: [hold, dot] },
        merc = {
          ...source,
          id: 'merc',
          name: 'Original ally',
          kind: 'merc' as const,
          gridPosition: { row: 0, col: 0 },
          life: 100,
          statuses: [hold]
        },
        enemy = {
          ...source,
          id: 'target',
          side: 'enemy' as const,
          kind: 'monster' as const,
          statuses: [hold]
        };
      const out = runBattleRecorded({
        seed: 7,
        playerTeam: [hero, merc],
        enemyTeam: [enemy],
        druidAllyAuras: {
          sourceHeroId: hero.id,
          fieldedMercCombatId: merc.id,
          oakRank: 20,
          heartRank: 20
        }
      });
      let statusPlayback = stageStatusPlayback([hero, merc], [enemy], out.events);
      let teams = {
        playerTeam: [hero, merc] as readonly CombatUnit[],
        enemyTeam: [enemy] as readonly CombatUnit[]
      };
      const removal = out.events.findIndex(
        (e) => e.kind === 'status-state' && e.target === merc.id && e.simClockMs === 1000
      );
      expect(removal).toBeGreaterThan(2);
      for (const event of out.events.slice(0, 3)) {
        const next = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, statusPlayback);
        statusPlayback = next.statusPlayback ?? statusPlayback;
        teams = next;
      }
      useCombatStore.setState({
        inCombat: true,
        isPaused: true,
        playerTeam: [...teams.playerTeam],
        enemyTeam: [...teams.enemyTeam],
        statusPlayback,
        recordedEvents: out.events,
        eventCursor: 3
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
      const card = screen.getByTestId('unit-card-merc');
      for (const key of ['oak-sage', 'heart-of-wolverine']) {
        const chip = within(card).getByText(i18n.t('skills:druid.' + key + '.name'));
        expect.soft(chip).toHaveClass('text-blue-200');
      }
      for (const event of out.events.slice(3, removal + 1)) {
        const next = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, statusPlayback);
        statusPlayback = next.statusPlayback ?? statusPlayback;
        teams = next;
      }
      act(() => {
        useCombatStore.setState({
          playerTeam: [...teams.playerTeam],
          enemyTeam: [...teams.enemyTeam],
          statusPlayback,
          eventCursor: removal + 1
        });
      });
      for (const key of ['oak-sage', 'heart-of-wolverine'])
        expect(
          within(card).queryByText(i18n.t('skills:druid.' + key + '.name'))
        ).not.toBeInTheDocument();
    }
  );

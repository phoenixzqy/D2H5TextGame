import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { CombatUnit } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { applyEventToTeams } from '@/stores/combatPlayback';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
const previous = i18n.language;
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(async () => {
  cleanup(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
  await i18n.changeLanguage(previous);
});
for (const locale of ['en', 'zh-CN'] as const) {
  it(`replaces a recent death FX with localized revival on the same enemy card in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const player = createMockPlayer('Revival FX fixture', 'sorceress');
    usePlayerStore.getState().setPlayer(player);
    const hero = playerToCombatUnit(player);
    const source: CombatUnit = { ...hero, id: 'shaman', name: 'Shaman', side: 'enemy', kind: 'monster',
      gridPosition: { row: 0, col: 0 } };
    const body: CombatUnit = { ...hero, id: 'body', name: 'Fallen', side: 'enemy', kind: 'monster',
      life: 0, statuses: [], gridPosition: { row: 0, col: 1 } };
    const restored: CombatUnit = { ...body, life: body.stats.lifeMax };
    const events: RecordedBattleEvent[] = [
      { kind: 'death', target: 'body', simClockMs: 1000, uiDelayMs: 50 },
      { kind: 'action', actor: 'shaman', skillId: 'monster.resurrect_fallen', simClockMs: 2000, uiDelayMs: 50 },
      { kind: 'message', messageKey: 'combat:corpses.consumedResurrection', params: { count: 0 }, simClockMs: 2000, uiDelayMs: 50 },
      { kind: 'revive', source: 'shaman', target: 'body', unit: restored, simClockMs: 2000, uiDelayMs: 50 },
      { kind: 'status-state', target: 'body', statuses: [], simClockMs: 2000, uiDelayMs: 0 }
    ];
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [source, body],
      recordedEvents: events, eventCursor: 1, playbackComplete: false });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
    const card = screen.getByTestId('unit-card-body');
    expect(within(card).getByTestId('combat-event-fx')).toHaveTextContent(locale === 'en' ? 'Down' : i18n.t('combat:effect.death'));
    const revive = events[3];
    if (!revive) throw new Error('Missing fixture revival');
    const result = applyEventToTeams([hero], [source, body], revive);
    act(() => { useCombatStore.setState({ enemyTeam: [...result.enemyTeam], eventCursor: events.length }); });
    expect(screen.getAllByTestId('unit-card-body')).toHaveLength(1);
    expect(screen.getByTestId('unit-card-body')).toBe(card);
    const cue = within(card).getByTestId('combat-event-fx');
    expect(cue).toHaveTextContent(locale === 'en' ? 'Revived' : '已复活');
    expect(cue).toHaveClass('text-green-100');
    expect(within(card).getByRole('progressbar', { name: locale === 'en' ? 'HP' : '生命' }))
      .toHaveAttribute('aria-valuenow', String(restored.life));
    expect(useCombatStore.getState().playbackComplete).toBe(false);
  });
}

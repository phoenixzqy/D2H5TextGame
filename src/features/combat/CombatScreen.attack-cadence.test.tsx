import { afterEach, beforeEach, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
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
  it('shows only consumed hero cadence with localized gear contribution in ' + locale, async () => {
    await i18n.changeLanguage(locale);
    const player = createMockPlayer('Cadence display', 'assassin');
    usePlayerStore.getState().setPlayer(player);
    const hero = playerToCombatUnit(player);
    const events = [
      { kind: 'cadence-state' as const, target: hero.id, periodMs: 1700, equipmentAttackSpeedPct: .11, simClockMs: 0, uiDelayMs: 200 },
      { kind: 'cadence-state' as const, target: 'merc', periodMs: 400, simClockMs: 0, uiDelayMs: 50 },
      { kind: 'cadence-state' as const, target: hero.id, periodMs: 1380, equipmentAttackSpeedPct: .11, simClockMs: 1700, uiDelayMs: 1700 },
      { kind: 'cadence-state' as const, target: hero.id, periodMs: 1700, equipmentAttackSpeedPct: .11, simClockMs: 11700, uiDelayMs: 3000 }
    ];
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [],
      recordedEvents: events, eventCursor: 0, playbackComplete: false });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CombatScreen />
      </MemoryRouter></Suspense></I18nextProvider>);
    expect(screen.queryByTestId('hero-attack-cadence')).not.toBeInTheDocument();
    act(() => { useCombatStore.setState({ eventCursor: 2 }); });
    const indicator = screen.getByTestId('hero-attack-cadence');
    expect(indicator).toHaveTextContent(locale === 'en' ? 'Attack interval: 1.7s' : '攻击间隔：1.7秒');
    expect(indicator).toHaveTextContent(locale === 'en' ? 'Attack Speed from gear: +11%' : '装备攻击速度：+11%');
    expect(indicator).not.toHaveAttribute('aria-live');
    // Playback controls cannot multiply the scheduler interval.
    const playbackSpeed = screen.getByRole('button', { name: i18n.t('combat:speed') });
    act(() => { playbackSpeed.click(); playbackSpeed.click(); });
    expect(indicator).toHaveTextContent('1.7');
    act(() => { useCombatStore.setState({ eventCursor: 3 }); });
    expect(indicator).toHaveTextContent('1.38');
    expect(indicator).not.toHaveTextContent('1.7');
    act(() => { useCombatStore.setState({ eventCursor: 4 }); });
    expect(indicator).toHaveTextContent('1.7');
    const customEvent = { kind: 'cadence-state' as const, target: hero.id, periodMs: 1452, simClockMs: 0, uiDelayMs: 200 };
    const custom = [customEvent];
    act(() => { useCombatStore.setState({ recordedEvents: custom, eventCursor: 1 }); });
    expect(indicator).toHaveTextContent('1.452');
    expect(indicator).not.toHaveTextContent(locale === 'en' ? 'gear' : '装备');
    const negative = [{ ...customEvent, equipmentAttackSpeedPct: -.1234 }];
    act(() => { useCombatStore.setState({ recordedEvents: negative }); });
    expect(indicator).toHaveTextContent('-12.3%');
    act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, life: 0 }] }); });
    expect(screen.queryByTestId('hero-attack-cadence')).not.toBeInTheDocument();
    act(() => { useCombatStore.setState({ playerTeam: [hero], recordedEvents: [], eventCursor: 0 }); });
    expect(screen.queryByTestId('hero-attack-cadence')).not.toBeInTheDocument();
    act(() => { useCombatStore.setState({ recordedEvents: [{ kind: 'turn-start', turn: 1, simClockMs: 0, uiDelayMs: 200 }], eventCursor: 1 }); });
    expect(screen.queryByTestId('hero-attack-cadence')).not.toBeInTheDocument();
  });
}

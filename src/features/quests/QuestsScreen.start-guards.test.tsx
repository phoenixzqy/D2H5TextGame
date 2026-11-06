import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { QuestsScreen } from './QuestsScreen';

const questId = 'quests/act1-den-of-evil';
const originals = { map: useMapStore.getState(), combat: useCombatStore.getState(),
  inventory: useInventoryStore.getState(), player: usePlayerStore.getState(), hydration: useHydrationStore.getState() };

function showJournal() {
  render(<I18nextProvider i18n={i18n}><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <QuestsScreen />
  </MemoryRouter></I18nextProvider>);
}

describe.each(['en', 'zh-CN'])('guarded quest start (%s)', locale => {
  beforeEach(async () => {
    useMapStore.getState().reset(); useInventoryStore.getState().reset();
    usePlayerStore.getState().setPlayer(createMockPlayer('Journal visitor', 'sorceress'));
    useCombatStore.setState({ inCombat: false, subAreaRunId: null });
    useHydrationStore.getState().setStatus('ready');
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    act(() => {
      useMapStore.setState(originals.map, true); useCombatStore.setState(originals.combat, true);
      useInventoryStore.setState(originals.inventory, true); usePlayerStore.setState(originals.player, true);
      useHydrationStore.setState(originals.hydration, true);
    });
  });

  it.each(['loading', 'no-player', 'combat', 'wave', 'restore'])('refuses %s without writing progress and permits a later start', mode => {
    showJournal();
    const before = useMapStore.getState().questProgress;
    const wave = mode === 'wave' ? beginWaveTransition(true) : null;
    const restore = mode === 'restore' ? reserveWaveRestore() : null;
    act(() => {
      if (mode === 'loading') useHydrationStore.getState().setStatus('loading');
      if (mode === 'no-player') usePlayerStore.setState({ player: null });
      if (mode === 'combat') useCombatStore.setState({ inCombat: true });
    });
    try {
      fireEvent.click(screen.getByTestId(`quest-start-${questId}`));
      expect(useMapStore.getState().questProgress).toBe(before);
      const feedback = screen.getByTestId(`quest-feedback-${questId}`);
      const key = mode === 'loading' ? 'not-ready' : mode === 'combat' ? 'combat-active'
        : mode === 'no-player' ? 'no-player' : 'busy';
      expect(feedback).toHaveTextContent(i18n.t(`questItems.feedback.${key}`, { ns: 'inventory' }));
    } finally {
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
    act(() => {
      useHydrationStore.getState().setStatus('ready');
      usePlayerStore.getState().setPlayer(createMockPlayer('Journal visitor', 'sorceress'));
      useCombatStore.setState({ inCombat: false });
    });
    fireEvent.click(screen.getByTestId(`quest-start-${questId}`));
    expect(useMapStore.getState().questProgress[questId]).toEqual({ id: questId,
      status: 'inProgress', objectives: { 'obj-clear-den': false, 'obj-return': false } });
    expect(screen.getByTestId(`quest-feedback-${questId}`).textContent).toMatch(/Quest added|任务已加入追踪/);
  });

  it('explains a failed publication without reporting success', () => {
    showJournal();
    const unsubscribe = useMapStore.subscribe(state => {
      if (state.questProgress[questId]?.status === 'inProgress') throw new Error('publication refused');
    });
    try {
      fireEvent.click(screen.getByTestId(`quest-start-${questId}`));
      expect(useMapStore.getState().questProgress[questId]).toBeUndefined();
      expect(screen.getByTestId(`quest-feedback-${questId}`)).toHaveTextContent(
        i18n.t('feedback.start.grant-failed', { ns: 'quests' }));
    } finally { unsubscribe(); }
  });
});

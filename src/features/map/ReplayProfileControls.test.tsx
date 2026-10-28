import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { beginQuestTransaction, endQuestTransaction } from '@/stores/waveTransitionGuard';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { ReplayProfileControls } from './ReplayProfileControls';

const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore] as const;

function eligible(): void {
  // Source-complete constructed history; no Nightmare record, earned-play or balance claim.
  const { questProgress, questReceipts, questItems } = campaignEvidence();
  useMapStore.setState({ questProgress, questReceipts });
  useInventoryStore.setState({ questItems });
}

function renderControls() {
  return render(<I18nextProvider i18n={i18n}><ReplayProfileControls /></I18nextProvider>);
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

beforeEach(async () => {
  __resetPersistenceForTests(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  usePlayerStore.getState().setPlayer(createMockPlayer('Replay controls', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  __resetPersistenceForTests();
});

describe('ReplayProfileControls source authority', () => {
  it.each([
    { language: 'en', normal: 'Normal', nightmare: 'Nightmare', hell: 'Hell',
      requirement: 'Complete Eve of Destruction in Normal and claim its reward to unlock Hell. Nightmare progress is not required.',
      selected: 'Selected: Normal' },
    { language: 'zh-CN', normal: '普通', nightmare: '噩梦', hell: '地狱',
      requirement: '完成普通难度的「毁灭前夕」并领取奖励后解锁地狱，无需先通关噩梦。',
      selected: '当前选择：普通' }
  ])('exposes three named pressed/disabled controls and a described Hell requirement in $language', async copy => {
    await i18n.changeLanguage(copy.language);
    renderControls();
    expect(screen.getByRole('button', { name: copy.normal, pressed: true })).toBeEnabled();
    expect(screen.getByRole('button', { name: copy.nightmare, pressed: false })).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.hell, pressed: false })).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.hell })).toHaveAccessibleDescription(copy.requirement);
    expect(screen.getByRole('status')).toHaveTextContent(copy.selected);
  });

  it('selects Hell from the real historical Eve graph while Nightmare stays locked and no rewards appear', () => {
    eligible();
    const inventory = useInventoryStore.getState(), before = useMapStore.getState();
    renderControls();
    const hell = screen.getByRole('button', { name: 'Hell' });
    expect(hell).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Nightmare' })).toBeDisabled();
    hell.focus(); expect(hell).toHaveFocus();
    fireEvent.click(hell);
    expect(useMapStore.getState().selectedDifficulty).toBe('hell');
    expect(screen.getByRole('button', { name: 'Hell', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Normal', pressed: false })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Selected: Hell');
    expect(useMapStore.getState().questDifficulties).toBe(before.questDifficulties);
    expect(useMapStore.getState().questReceipts).toBe(before.questReceipts);
    expect(useInventoryStore.getState()).toBe(inventory);
  });

  it('reacts to source proofs, reciprocal items, service authority and the full endgame graph', () => {
    eligible(); renderControls();
    const original = useMapStore.getState(), inventory = useInventoryStore.getState();
    const hell = screen.getByRole('button', { name: 'Hell' });
    expect(hell).toBeEnabled();
    act(() => { useMapStore.setState({ questReceipts: {} }); });
    expect(hell).toBeDisabled();
    act(() => { useMapStore.setState({ questReceipts: original.questReceipts }); });
    expect(hell).toBeEnabled();
    act(() => { useInventoryStore.setState({ questItems: {
      'quests/act5-prison-of-ice#action:receive-potion': { itemId: 'quest/malahs_potion', state: 'owned' }
    } }); });
    expect(hell).toBeDisabled();
    act(() => { useInventoryStore.setState({ questItems: inventory.questItems }); });
    expect(hell).toBeEnabled();
    act(() => { useInventoryStore.setState({ questServices: { 'forged-service': {} } as unknown as typeof inventory.questServices }); });
    expect(hell).toBeDisabled();
    act(() => { useInventoryStore.setState({ questServices: inventory.questServices }); });
    expect(hell).toBeEnabled();
    act(() => { useMapStore.setState({ endgame: { ...original.endgame, achievementRewardClaimed: true } }); });
    expect(hell).toBeDisabled();
    act(() => { useMapStore.setState({ endgame: original.endgame }); });
    expect(hell).toBeEnabled();
  });

  it.each(['loading', 'no-player', 'combat', 'run'] as const)('disables selection for observable readiness: %s', state => {
    eligible(); renderControls();
    act(() => {
      if (state === 'loading') useHydrationStore.getState().setStatus('loading');
      if (state === 'no-player') usePlayerStore.getState().reset();
      if (state === 'combat') useCombatStore.setState({ inCombat: true });
      if (state === 'run') useCombatStore.setState({ subAreaRunId: 'constructed-active-marker' });
    });
    for (const value of ['normal', 'nightmare', 'hell']) expect(screen.getByTestId(`replay-profile-${value}`)).toBeDisabled();
  });

  it.each(['profile', 'items', 'services', 'hero'] as const)('clears stale refusal feedback after %s context changes', change => {
    eligible(); renderControls();
    const lease = beginQuestTransaction();
    try { fireEvent.click(screen.getByRole('button', { name: 'Hell' })); } finally { endQuestTransaction(lease); }
    expect(screen.getByRole('status')).toHaveTextContent('Another quest action is still finishing.');
    act(() => {
      if (change === 'profile') useMapStore.setState({ selectedDifficulty: 'hell' });
      if (change === 'items') useInventoryStore.setState({ questItems: {} });
      if (change === 'services') useInventoryStore.setState({ questServices: {} });
      if (change === 'hero') usePlayerStore.getState().setPlayer(createMockPlayer('Another hero', 'sorceress'));
    });
    expect(screen.getByRole('status')).toHaveTextContent(change === 'profile' ? 'Selected: Hell' : 'Selected: Normal');
    expect(screen.getByRole('status')).not.toHaveTextContent('Another quest action');
  });

  it('retains recovery feedback after the selector blocks persistence and hydration', () => {
    eligible(); renderControls();
    const unsubscribe = useMapStore.subscribe((state, previous) => {
      if (state.selectedDifficulty !== previous.selectedDifficulty) throw new Error('publication or rollback observer');
    });
    try { fireEvent.click(screen.getByRole('button', { name: 'Hell' })); } finally { unsubscribe(); }
    expect(useHydrationStore.getState().status).toBe('error');
    expect(screen.getByRole('status')).toHaveTextContent('The action could not be restored. Stop here and reload your last saved game.');
    expect(screen.getByRole('button', { name: 'Hell' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Normal' })).toBeDisabled();
  });
});

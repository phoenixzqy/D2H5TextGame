import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { EndgamePanel } from './EndgamePanel';
import { QuestTitleControls } from '@/features/town/QuestTitleControls';
import { TownScreen } from '@/features/town/TownScreen';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, startEndgameRun } from '@/stores/combatHelpers';
import { reserveWaveRestore, releaseWaveRestore, beginMaterialTransaction, endMaterialTransaction } from '@/stores/waveTransitionGuard';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores } from '@/stores/persistence';

vi.mock('@/stores/save-adapter', () => ({ saveSave: () => Promise.resolve() }));

function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function unlocked() {
  const campaign = campaignEvidence();
  useMapStore.setState({ questProgress: campaign.questProgress, questReceipts: campaign.questReceipts });
}
beforeEach(async () => {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of [useMapStore, useInventoryStore, usePlayerStore, useCombatStore]) store.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Dungeon owner', 'sorceress'));
  useHydrationStore.getState().setStatus('ready'); await i18n.changeLanguage('en');
});
afterEach(() => { cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); useHydrationStore.getState().setStatus('idle'); });
function mount() { render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><EndgamePanel /><QuestTitleControls /><Location /></MemoryRouter>); }
describe('endgame player controls', () => {
  it.each(['en', 'zh-CN'])('follows live hero, hydration and battle readiness without remounting in %s', async locale => {
    unlocked(); useMapStore.setState({ endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: false } });
    await i18n.changeLanguage(locale); mount();
    const hero = usePlayerStore.getState().player;
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    act(() => { usePlayerStore.setState({ player: null }); });
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    expect(screen.getByTestId('endgame-entry-readiness')).toHaveTextContent(i18n.t('endgame:feedback.no-player'));
    act(() => { usePlayerStore.setState({ player: hero }); });
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    act(() => { useHydrationStore.getState().setStatus('idle'); });
    expect(screen.getByTestId('endgame-entry-readiness')).toHaveTextContent(i18n.t('endgame:feedback.not-ready'));
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    act(() => { useHydrationStore.getState().setStatus('ready'); useCombatStore.setState({ inCombat: true }); });
    expect(screen.getByTestId('endgame-entry-readiness')).toHaveTextContent(i18n.t('endgame:feedback.combat-active'));
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    act(() => { useCombatStore.setState({ inCombat: false }); });
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
    act(() => { startEndgameRun('ashen'); });
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    act(() => { abortSubAreaRun(); useCombatStore.getState().endCombat(); });
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    expect(screen.getByTestId('location')).toHaveTextContent('');
  });
  it.each(['en', 'zh-CN'])('recovers after the last asynchronous restore/material owner releases in %s', async locale => {
    unlocked(); useMapStore.setState({ endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: false } });
    await i18n.changeLanguage(locale); mount();
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    const first = reserveWaveRestore(), last = reserveWaveRestore();
    try {
      try {
        await act(async () => { await Promise.resolve(); });
        expect(screen.getByTestId('endgame-enter')).toBeDisabled();
        expect(screen.getByTestId('endgame-claim')).toBeDisabled();
        expect(screen.getByTestId('endgame-entry-readiness')).toHaveTextContent(i18n.t('endgame:feedback.busy'));
      } finally { await act(async () => { releaseWaveRestore(first); await Promise.resolve(); }); }
      expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    } finally { await act(async () => { releaseWaveRestore(last); await Promise.resolve(); }); }
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    const material = beginMaterialTransaction(true);
    try {
      await act(async () => { await Promise.resolve(); });
      expect(screen.getByTestId('endgame-enter')).toBeDisabled();
      expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    } finally { await act(async () => { endMaterialTransaction(material); await Promise.resolve(); }); }
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
  });
  it.each(['en', 'zh-CN'])('blocks exhausted entry while preserving an independently earned Claim in %s', async locale => {
    unlocked(); useMapStore.setState({ endgame: { attemptOrdinal: Number.MAX_SAFE_INTEGER,
      clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: false } });
    await i18n.changeLanguage(locale); mount();
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    expect(screen.getByTestId('endgame-entry-readiness')).toHaveTextContent(i18n.t('endgame:feedback.exhausted'));
    expect(screen.getByTestId('endgame-claim')).toBeEnabled();
    fireEvent.click(screen.getByTestId('endgame-claim'));
    expect(useMapStore.getState().endgame.achievementRewardClaimed).toBe(true);
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(Number.MAX_SAFE_INTEGER);
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/ruby/perfect': 1, 'gems/sapphire/perfect': 1 });
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
  });
  it.each(['en', 'zh-CN'])('refreshes native campaign validation and recovers after save import in %s', async locale => {
    unlocked(); await i18n.changeLanguage(locale);
    const source = exportCurrentSave();
    if (source === null) throw new Error('Expected an exportable native fixture');
    mount(); expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    act(() => { useMapStore.setState({ selectedDifficulty: 'nightmare' }); });
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    expect(screen.getByTestId('endgame-lock')).toHaveTextContent(i18n.t('endgame:invalid'));
    await act(async () => { await importIntoStores(source); });
    expect(screen.getByTestId('endgame-enter')).toBeEnabled();
    expect(screen.queryByTestId('endgame-lock')).not.toBeInTheDocument();
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(0);
  });
  it('shows the earned lock and refuses entry/Claim before campaign completion', () => {
    mount(); expect(screen.getByTestId('endgame-lock')).toBeVisible();
    expect(screen.getByTestId('endgame-enter')).toBeDisabled();
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    expect(screen.getByTestId('location')).toHaveTextContent('');
  });
  it.each(['en', 'zh-CN'])('selects a modifier and routes explicit manual entry in %s', async locale => {
    unlocked(); await i18n.changeLanguage(locale); mount();
    fireEvent.click(screen.getByTestId('endgame-modifier-glacial'));
    fireEvent.click(screen.getByTestId('endgame-enter'));
    expect(screen.getByTestId('location')).toHaveTextContent('?endgame=glacial');
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(0);
    expect(screen.getByTestId('endgame-panel').textContent).not.toMatch(/endgame[.:]|modifiers\./);
  });
  it.each(['en', 'zh-CN'])('claims actual eligible rewards then selects the cosmetic title in %s', async locale => {
    unlocked(); useMapStore.setState({ endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: false } });
    await i18n.changeLanguage(locale); mount();
    expect(screen.queryByTestId('quest-title-riftwalker')).toBeNull();
    fireEvent.click(screen.getByTestId('endgame-claim'));
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/ruby/perfect': 1, 'gems/sapphire/perfect': 1 });
    expect(screen.getByTestId('endgame-claim')).toBeDisabled();
    fireEvent.click(screen.getByTestId('quest-title-riftwalker'));
    expect(useMapStore.getState().selectedTitle).toBe('titles/worldstone-adapt');
    expect(screen.getByTestId('quest-title-riftwalker')).toHaveAttribute('aria-pressed', 'true');
    cleanup();
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TownScreen /></MemoryRouter>);
    expect(screen.getByTestId('town-screen').querySelector('header'))
      .toHaveTextContent(`Dungeon owner · ${i18n.t('town:titles.riftwalker')}`);
  });
  it('reports material overflow without granting either the materials or title', () => {
    unlocked(); useMapStore.setState({ endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: false } });
    useInventoryStore.setState({ materials: { 'gems/ruby/perfect': Number.MAX_SAFE_INTEGER } }); mount();
    fireEvent.click(screen.getByTestId('endgame-claim'));
    expect(within(screen.getByTestId('endgame-panel')).getByRole('status')).toHaveTextContent(/could not/i);
    expect(useMapStore.getState().endgame.achievementRewardClaimed).toBe(false);
    expect(screen.queryByTestId('quest-title-riftwalker')).toBeNull();
  });
});

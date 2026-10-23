import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { loadTownNpcs } from '@/data/loaders/towns';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { TownScreen } from './TownScreen';

let hydrationBefore = useHydrationStore.getState();
const QUEST = 'quests/act1-den-of-evil';
const recordNpcTalk = useMapStore.getState().recordNpcTalk;
const talk = vi.fn(recordNpcTalk);

function TownRoutes() {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<TownScreen />} />
          <Route path="/quests" element={<div data-testid="quests-destination" />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
}

function renderTown() { return render(<TownRoutes />); }

function progress() { return useMapStore.getState().questProgress[QUEST]; }
function rewards() {
  const { backpack, stash, equipped, currencies } = useInventoryStore.getState();
  return { player: usePlayerStore.getState().player, backpack, stash, equipped, currencies };
}

describe.each(['zh-CN', 'en'] as const)('TownScreen %s', (locale) => {
  beforeEach(async () => {
    hydrationBefore = useHydrationStore.getState();
    useHydrationStore.getState().setStatus('ready');
    useMapStore.getState().reset();
    usePlayerStore.getState().reset();
    useInventoryStore.getState().reset();
    usePlayerStore.getState().setPlayer(createMockPlayer('Town visitor', 'sorceress'));
    talk.mockClear();
    useMapStore.setState({ recordNpcTalk: talk });
    await i18n.changeLanguage(locale);
  });

  afterEach(() => { act(() => {
    useMapStore.setState({ recordNpcTalk });
    useHydrationStore.setState({ status: hydrationBefore.status, error: hydrationBefore.error });
  }); });

  it('uses all authored NPCs and emits one event only on each opening click', async () => {
    const view = renderTown();
    expect(talk).not.toHaveBeenCalled();
    const akara = screen.getByRole('button', { name: locale === 'en' ? 'Akara' : '阿卡拉' });
    fireEvent.click(akara);
    expect(talk).toHaveBeenCalledTimes(1);
    expect(talk).toHaveBeenCalledWith('npc/akara');
    expect(akara).toHaveFocus();
    expect(screen.getByRole('region', { name: locale === 'en' ? 'Akara' : '阿卡拉' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('dialogue.den.untracked', { ns: 'town' }));
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getAllByTestId(/^town-npc-/)).toHaveLength(5);
    for (const npc of loadTownNpcs(1)) {
      expect(screen.getByTestId(`town-npc-${npc.portraitId}`)).toHaveAccessibleName(i18n.t(npc.nameKey, { ns: 'town' }));
    }
    expect(screen.getByRole('status')).not.toHaveTextContent(/heal|identify|trade|治疗|鉴定|交易/i);
    view.rerender(<TownRoutes />);
    await act(async () => { await i18n.changeLanguage(locale === 'en' ? 'zh-CN' : 'en'); });
    expect(talk).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
    expect(screen.getByTestId('town-npc-akara')).toHaveFocus();
    expect(talk).toHaveBeenCalledTimes(1);
  });

  it('does not bank early talk or grant rewards; correct return completes before explicit claim', () => {
    renderTown();
    const originalRewards = rewards();
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(progress()).toBeUndefined();
    act(() => { useMapStore.getState().updateQuestProgress(QUEST, {
      status: 'inProgress', objectives: { 'obj-clear-den': false, 'obj-return': false }
    }); });
    const earlyState = useMapStore.getState();
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(useMapStore.getState()).toBe(earlyState);
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('dialogue.den.preclear', { ns: 'town' }));
    act(() => { useMapStore.getState().markCleared('areas/act1-den-of-evil'); });
    expect(progress()?.objectives).toEqual({ 'obj-clear-den': true, 'obj-return': false });
    const beforeWrong = useMapStore.getState();
    fireEvent.click(screen.getByTestId('town-npc-charsi'));
    expect(useMapStore.getState()).toBe(beforeWrong);
    expect(screen.getByRole('status')).not.toHaveTextContent(i18n.t('dialogue.den.readyToClaim', { ns: 'town' }));
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(progress()).toEqual({ id: QUEST, status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true } });
    expect(rewards()).toEqual(originalRewards);
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('dialogue.den.readyToClaim', { ns: 'town' }));
    const complete = useMapStore.getState();
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(useMapStore.getState()).toBe(complete);
    expect(rewards()).toEqual(originalRewards);
    expect(talk).toHaveBeenCalledTimes(5);
    act(() => { expect(claimQuestReward(QUEST)).toBe('ok'); });
    const claimedRewards = rewards();
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('dialogue.den.claimed', { ns: 'town' }));
    expect(rewards()).toEqual(claimedRewards);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(rewards()).toEqual(claimedRewards);
  });

  it('offers explicit Quests navigation without claiming or another talk event', () => {
    renderTown();
    fireEvent.click(screen.getByTestId('town-npc-akara'));
    const before = rewards();
    fireEvent.click(screen.getByTestId('town-conversation-quests'));
    expect(screen.getByTestId('quests-destination')).toBeInTheDocument();
    expect(rewards()).toEqual(before);
    expect(talk).toHaveBeenCalledTimes(1);
  });

  it('hides an unauthored act and restores focus to the current NPC after an act round trip', () => {
    renderTown();
    const originalAkara = screen.getByTestId('town-npc-akara');
    fireEvent.click(originalAkara);
    expect(screen.getByTestId('town-conversation')).toBeVisible();
    act(() => { useMapStore.getState().setCurrentLocation(5, 'areas/act5-town'); });
    expect(screen.queryAllByTestId(/^town-npc-/)).toHaveLength(0);
    expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
    expect(screen.getByTestId('town-screen')).toHaveTextContent(i18n.t('noNpcs', { ns: 'town' }));
    expect(screen.getByTestId('town-screen')).not.toHaveTextContent(/Akara|阿卡拉|Den of Evil|邪恶巢穴/);
    act(() => { useMapStore.getState().setCurrentLocation(1, 'areas/act1-town'); });
    const currentAkara = screen.getByTestId('town-npc-akara');
    expect(currentAkara).not.toBe(originalAkara);
    expect(originalAkara).not.toBeInTheDocument();
    expect(screen.getByTestId('town-conversation')).toBeVisible();
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    expect(currentAkara).toHaveFocus();
    expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
    expect(talk).toHaveBeenCalledTimes(1);
    expect(talk).toHaveBeenCalledWith('npc/akara');
  });

  it('opens all four Act IV conversations without paying, consuming, or starting quests, and keeps Cain act-specific', () => {
    useMapStore.getState().setCurrentLocation(4, 'areas/act4-town');
    const before = rewards();
    const ledger = useInventoryStore.getState().questItems;
    const quests = useMapStore.getState().questProgress;
    const receipts = useMapStore.getState().questReceipts;
    renderTown();
    expect(screen.getAllByTestId(/^town-npc-/)).toHaveLength(4);
    const names = locale === 'en'
      ? ['Deckard Cain', 'Halbu', 'Jamella', 'Tyrael'] : ['迪卡·凯恩', '海尔布', '贾梅拉', '泰瑞尔'];
    ['cain', 'halbu', 'jamella', 'tyrael'].forEach((slug, index) => {
      const name = names[index];
      if (!name) throw new Error('Missing Act IV NPC fixture name');
      const npc = screen.getByTestId(`town-npc-${slug}`);
      expect(npc).toHaveAccessibleName(name);
      fireEvent.click(npc);
      expect(npc).toHaveFocus();
      expect(screen.getByRole('region', { name })).toBeVisible();
      expect(screen.getByRole('status')).toHaveTextContent(i18n.t(`dialogue.greetings.act4.${slug}`, { ns: 'town' }));
      expect(useMapStore.getState().questProgress).toBe(quests);
      expect(useMapStore.getState().questReceipts).toBe(receipts);
      expect(useInventoryStore.getState().questItems).toBe(ledger);
      expect(rewards()).toEqual(before);
      fireEvent.click(screen.getByTestId('town-conversation-close'));
      expect(npc).toHaveFocus();
    });
    expect(talk).toHaveBeenCalledTimes(4);
    fireEvent.click(screen.getByTestId('town-npc-cain'));
    expect(screen.getByRole('status')).toHaveTextContent(locale === 'en' ? 'Both are consumed' : '两件物品都会消耗');
    expect(screen.getByRole('status')).not.toHaveTextContent(/Jade Figurine|玉制小雕像/);
    act(() => { useMapStore.getState().setCurrentLocation(3, 'areas/act3-town'); });
    expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('town-npc-cain'));
    expect(screen.getByTestId('town-conversation')).toHaveTextContent(locale === 'en' ? 'Jade Figurine' : '玉制小雕像');
    expect(screen.getByTestId('town-conversation')).not.toHaveTextContent(/Hellforge|地狱熔炉/);
  });

  it('shows Atma in Act II with the authored Far Oasis route and no implicit quest or reward', () => {
    useMapStore.getState().setCurrentLocation(2, 'areas/act2-town');
    const before = rewards();
    const questsBefore = useMapStore.getState().questProgress;
    renderTown();
    expect(loadTownNpcs(2).map(npc => npc.id)).toEqual(['npc/atma']);
    expect(screen.getAllByTestId(/^town-npc-/)).toHaveLength(1);
    const atma = screen.getByRole('button', { name: locale === 'en' ? 'Atma' : '阿特玛' });
    fireEvent.click(atma);
    expect(talk).toHaveBeenCalledTimes(1);
    expect(talk).toHaveBeenCalledWith('npc/atma');
    expect(atma).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(locale === 'en' ? 'beneath the Far Oasis' : '遥远绿洲下方');
    expect(screen.getByRole('status')).not.toHaveTextContent(/sewer|下水道|repair|修理/i);
    expect(useMapStore.getState().questProgress).toBe(questsBefore);
    expect(rewards()).toEqual(before);
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    expect(atma).toHaveFocus();
  });
});

/**
 * QuestsScreen smoke tests — verifies real quests from `quests/main.json` and
 * `quests/side.json` are surfaced and that statuses from `useMapStore`
 * override the default.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { QuestsScreen } from './QuestsScreen';
import { useMapStore } from '@/stores';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/persistence';
import { createMockPlayer } from '@/features/character/createMockPlayer';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <QuestsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe.each(['zh-CN', 'en'] as const)('QuestsScreen %s', locale => {
  let hydrationBefore = useHydrationStore.getState();
  beforeEach(async () => {
    hydrationBefore = useHydrationStore.getState();
    act(() => {
      useMapStore.getState().reset();
      useInventoryStore.getState().reset();
      usePlayerStore.getState().setPlayer(createMockPlayer('Quest visitor', 'sorceress'));
      useHydrationStore.getState().setStatus('ready');
    });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    useHydrationStore.setState({ status: hydrationBefore.status, error: hydrationBefore.error });
    usePlayerStore.getState().reset();
    useInventoryStore.getState().reset();
  });

  it('renders the main quest tab with real Act 1 quests by default', () => {
    renderScreen();
    // "Den of Evil" is the first main quest in act1.
    expect(screen.getByTestId('quest-quests/act1-den-of-evil')).toBeInTheDocument();
    expect(screen.getByTestId('quest-quests/act1-sisters-burial-grounds'))
      .toBeInTheDocument();
  });

  it('renders side quests when the side tab is selected', () => {
    renderScreen();
    const sideTab = screen.getByRole('tab', { name: /支线|side/i });
    fireEvent.click(sideTab);
    const quest = screen.getByTestId('quest-quests/side-act1-charsis-imbue');
    expect(quest).toBeInTheDocument();
    expect(quest.textContent).toMatch(/查西的灌注|Charsi's Imbue/);
    expect(quest.textContent).not.toContain('items/imbued_rare_random');
  });

  it('reflects in-progress status from useMapStore', () => {
    act(() => {
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', {
        status: 'inProgress',
        objectives: { 'obj-clear-den': false }
      });
    });
    renderScreen();
    const card = screen.getByTestId('quest-quests/act1-den-of-evil');
    expect(card.textContent).toMatch(/进行中|in progress/i);
  });

  it('starts an available quest and shows feedback', () => {
    renderScreen();
    const start = screen.getByTestId('quest-start-quests/act1-den-of-evil');
    fireEvent.click(start);
    expect(useMapStore.getState().questProgress['quests/act1-den-of-evil']?.status).toBe('inProgress');
    expect(screen.getByTestId('quest-feedback-quests/act1-den-of-evil')).toHaveTextContent(/任务已加入追踪|Quest added/);
  });

  it('keeps an unsupported service unclaimed and displays a localized refusal on every attempt', () => {
    const id = 'quests/side-act1-cains-favor';
    act(() => { useMapStore.getState().completeQuest(id); });
    renderScreen();
    fireEvent.click(screen.getByRole('tab', { name: /支线|side/i }));
    const claim = screen.getByTestId(`quest-claim-${id}`);
    expect(claim).toBeEnabled();
    const before = usePlayerStore.getState().player;
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
    expect(usePlayerStore.getState().player).toBe(before);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(locale === 'en'
      ? 'This reward cannot be delivered yet. Nothing was claimed.'
      : '该奖励暂时无法发放，尚未领取。');
    expect(claim).toBeEnabled();
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
  });

  it('claims real Den rewards once and disables the settled claim button', () => {
    const id = 'quests/act1-den-of-evil';
    act(() => { useMapStore.getState().completeQuest(id); });
    renderScreen();
    const claim = screen.getByTestId(`quest-claim-${id}`);
    fireEvent.click(claim);
    const hero = usePlayerStore.getState().player;
    expect(hero?.level).toBe(2);
    expect(hero?.experience).toBe(400);
    expect(hero?.skillPoints).toBe(3);
    expect(hero?.statPoints).toBe(5);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(/奖励已领取|Rewards claimed/);
    expect(claim).toBeDisabled();
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toBe(hero);
  });

  it('shows not-ready refusal and allows a later retry after hydration finishes', () => {
    const id = 'quests/act1-den-of-evil';
    act(() => {
      useMapStore.getState().completeQuest(id);
      useHydrationStore.getState().setStatus('loading');
    });
    renderScreen();
    const claim = screen.getByTestId(`quest-claim-${id}`);
    expect(claim).toBeEnabled();
    const hero = usePlayerStore.getState().player;
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toBe(hero);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(locale === 'en'
      ? 'Save data is loading or being replaced. Try again when it finishes.'
      : '存档正在载入或替换，请完成后重试。');
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    expect(claim).toBeDisabled();
  });

  it('provides localized feedback for every new refusal without raw translation keys', () => {
    for (const result of ['no-player', 'not-ready', 'unsupported-rewards', 'claim-in-progress', 'grant-failed']) {
      const key = `feedback.claim.${result}`;
      expect(i18n.exists(key, { ns: 'quests', lng: locale })).toBe(true);
      expect(i18n.t(key, { ns: 'quests', lng: locale })).not.toContain(key);
    }
  });
});

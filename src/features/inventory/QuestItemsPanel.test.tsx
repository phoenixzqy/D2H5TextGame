import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import * as actions from '@/features/quests/claimReward';
import { useInventoryStore, usePlayerStore, useMapStore, useMercStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { InventoryScreen } from './InventoryScreen';

const quest = 'quests/act2-radaments-lair';
const source = `${quest}#reward:questItem`;
function mount(children: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {children}
  </MemoryRouter></I18nextProvider>);
}
function claim() { expect(actions.claimQuestReward(quest)).toBe('ok'); }
function panel() { return screen.getByTestId('quest-items-panel'); }
function readButton() { return within(panel()).getByRole('button'); }
const stores = [useInventoryStore, usePlayerStore, useMapStore, useMercStore] as const;

describe.each(['en', 'zh-CN'] as const)('quest item player flow %s', locale => {
  const english = locale === 'en';
  beforeEach(async () => {
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Reader', 'sorceress'));
    useMapStore.setState({ questProgress: { [quest]: { id: quest, status: 'completed',
      objectives: { 'obj-kill-radament': true } } } });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => { for (const store of stores) store.getState().reset(); });
  });

  it('shows a localized empty panel and does not invent a book from claimed progress', () => {
    useMapStore.getState().markQuestRewardClaimed(quest);
    mount(<InventoryScreen />);
    expect(panel()).toHaveTextContent(english ? 'No quest items yet.' : '尚无任务物品。');
    expect(within(panel()).queryByRole('button')).not.toBeInTheDocument();
  });

  it('previews the item, claims with full bags, and Reads once with focus and live feedback', () => {
    const item = { id: 'gear', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false };
    useInventoryStore.setState({
      backpack: Array.from({ length: 100 }, (_, n) => ({ ...item, id: `bag-${String(n)}` })),
      stash: Array.from({ length: 500 }, (_, n) => ({ ...item, id: `stash-${String(n)}` }))
    });
    const { backpack, stash } = useInventoryStore.getState();
    const quests = mount(<QuestsScreen />);
    const card = screen.getByTestId(`quest-${quest}`);
    expect(card).toHaveTextContent(english ? 'Book of Skill' : '技能之书');
    expect(card).toHaveTextContent('5000');
    expect(card.textContent).not.toMatch(/questItem|items\/book_of_skill|questItems\./);
    fireEvent.click(within(card).getByRole('button', { name: english ? 'Claim Reward' : '领取奖励' }));
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
    const claimed = usePlayerStore.getState().player;
    if (!claimed) throw new Error('Claimed player missing');
    quests.unmount();
    mount(<InventoryScreen />);
    expect(panel()).toHaveTextContent(english ? 'Book of Skill' : '技能之书');
    expect(panel()).toHaveTextContent(english ? '1 skill point' : '1 个技能点');
    const button = readButton();
    button.focus();
    fireEvent.click(button);
    expect(usePlayerStore.getState().player).toEqual({ ...claimed, skillPoints: claimed.skillPoints + 1 });
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('consumed');
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent(english ? 'Already read' : '已阅读');
    expect(within(panel()).getByRole('status')).toHaveTextContent(english ? 'Gained 1 skill point.' : '获得 1 个技能点。');
    fireEvent.click(button);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(claimed.skillPoints + 1);
    expect(within(panel()).getByRole('status')).toHaveTextContent(english ? 'already read' : '已经阅读');
    expect(useInventoryStore.getState().backpack).toBe(backpack);
    expect(useInventoryStore.getState().stash).toBe(stash);
    expect(panel().textContent).not.toMatch(/quests\/|items\/|questItems\./);
  });

  it('announces loading refusal and allows a later retry through the real Read boundary', () => {
    claim();
    useHydrationStore.getState().setStatus('loading');
    mount(<InventoryScreen />);
    const before = usePlayerStore.getState().player;
    fireEvent.click(readButton());
    expect(within(panel()).getByRole('status')).toHaveTextContent(english ? 'Save data is loading' : '存档正在载入');
    expect(usePlayerStore.getState().player).toBe(before);
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    fireEvent.click(readButton());
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('consumed');
  });

  it('makes normal failures retryable and reports restoration failures distinctly', () => {
    claim();
    const action = vi.spyOn(actions, 'readQuestItem').mockReturnValueOnce('grant-failed');
    mount(<InventoryScreen />);
    fireEvent.click(readButton());
    expect(within(panel()).getByRole('status')).toHaveTextContent(english ? 'Try again.' : '请重试。');
    expect(readButton()).not.toHaveAttribute('aria-disabled', 'true');
    action.mockImplementationOnce(() => { throw new AggregateError([], 'Injected restore failure'); });
    fireEvent.click(readButton());
    expect(within(panel()).getByRole('status')).toHaveTextContent(english ? 'Check your skill points and quest items' : '请检查技能点与任务物品');
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
    fireEvent.click(readButton());
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('consumed');
  });

  it('shows actual claimed state after an exceptional restoration failure', () => {
    const original = actions.claimQuestReward;
    vi.spyOn(actions, 'claimQuestReward').mockImplementationOnce(id => {
      expect(original(id)).toBe('ok');
      throw new AggregateError([], 'Injected failure after changed state');
    });
    mount(<QuestsScreen />);
    const card = screen.getByTestId(`quest-${quest}`);
    fireEvent.click(within(card).getByRole('button'));
    expect(within(card).getByRole('status')).toHaveTextContent(english ? 'Check your skill points and quest items' : '请检查技能点与任务物品');
    expect(within(card).getByRole('button')).toBeDisabled();
    expect(useInventoryStore.getState().questItems[source]?.state).toBe('owned');
  });
});

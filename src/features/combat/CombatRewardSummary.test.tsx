import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { KillRewards } from '@/engine/loot/award';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore] as const;
const empty: KillRewards = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };

// Presentation fixtures only: these do not establish earned acquisition.
function mount(rewards: KillRewards, victory = true, winner: 'player' | 'enemy' | null = victory ? 'player' : 'enemy') {
  useCombatStore.setState({ runVictory: victory, runDefeat: !victory, runRewards: rewards,
    outcome: { winner, finalPlayerTeam: [], finalEnemyTeam: [] } });
  return render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CombatScreen />
  </MemoryRouter></I18nextProvider>);
}

describe.each(['en', 'zh-CN'] as const)('combat reward identities %s', locale => {
  const english = locale === 'en';
  beforeEach(async () => {
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    act(() => { for (const store of stores) store.getState().reset(); });
  });

  it('shows material-only victory loot with exact translated identities and no shard inference', () => {
    mount({ ...empty, runes: 2, gems: 3, materials: {
      'runes/el': 2, 'gems/ruby/perfect': 3, 'materials/scrap': Number.MAX_SAFE_INTEGER
    } });
    const summary = screen.getByTestId('loot-summary');
    expect(summary).toHaveAccessibleName(english ? 'Loot' : '战利品');
    const rows = within(summary).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(english ? '+2 El' : '+2 艾尔符文');
    expect(rows[1]).toHaveTextContent(english ? '+3 Perfect Ruby' : '+3 完美的红宝石');
    expect(rows[2]).toHaveTextContent(`+${new Intl.NumberFormat(locale).format(Number.MAX_SAFE_INTEGER)} ${english ? 'Scrap' : '废料'}`);
    expect(summary).not.toHaveTextContent(english ? 'Rune Shards' : '符文碎片');
    expect(summary.textContent).not.toMatch(/items\.|\brune\b|\bgem\b/);
    expect(within(summary).queryByTestId('loot-items')).not.toBeInTheDocument();
  });

  it('shows localized wishstones when they are the only reward', () => {
    mount({ ...empty, wishstones: 1000 });
    const summary = screen.getByTestId('loot-summary');
    expect(summary).toHaveTextContent(english ? '+1,000 Wishstones' : '+1,000 祈愿石');
    expect(summary).not.toHaveTextContent(english ? 'Rune Shards' : '符文碎片');
    expect(summary.textContent).not.toMatch(/\bwishstone\b/);
  });

  it('preserves gear and the separate shard amount without repeating rune/gem summaries', () => {
    const rewards: KillRewards = { ...empty, runeShards: 7, runes: 2, gems: 3, wishstones: 4,
      materials: { 'runes/el': 2, 'gems/ruby/perfect': 3 },
      items: [{ id: 'reward-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 12,
        identified: true, equipped: false }] };
    const before = structuredClone(rewards);
    mount(rewards);
    const summary = screen.getByTestId('loot-summary');
    expect(within(summary).getAllByText(english ? '+7 Rune Shards' : '+7 符文碎片')).toHaveLength(1);
    expect(summary).not.toHaveTextContent(english ? '+9 Rune Shards' : '+9 符文碎片');
    expect(summary).toHaveTextContent(english ? '+2 El' : '+2 艾尔符文');
    expect(summary).toHaveTextContent(english ? '+3 Perfect Ruby' : '+3 完美的红宝石');
    expect(summary).toHaveTextContent(english ? '+4 Wishstones' : '+4 祈愿石');
    const gear = within(summary).getByTestId('loot-items');
    expect(gear).toHaveTextContent(english ? 'Cap' : '帽子');
    expect(gear).toHaveTextContent('[rare · iLvl 12]');
    expect(within(gear).getByRole('listitem')).toHaveClass('text-yellow-300');
    expect(summary.textContent).not.toMatch(/\brune\b|\bgem\b|\bwishstone\b/);
    expect(rewards).toEqual(before);
    expect(useCombatStore.getState().runRewards).toBe(rewards);
  });

  it('omits an empty summary rather than displaying aggregate-only counts', () => {
    mount({ ...empty, runes: 2, gems: 3 });
    expect(screen.queryByTestId('loot-summary')).not.toBeInTheDocument();
  });

  it.each(['defeat', 'draw'] as const)('shows retained completed-wave loot on %s without changing the committed bag', result => {
    const rewards: KillRewards = { ...empty, runeShards: 7, wishstones: 4,
      runes: 2, gems: 3, materials: { 'runes/el': 2, 'gems/ruby/perfect': 3 },
      items: [{ id: 'retained-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 12,
        identified: true, equipped: false }] };
    const before = structuredClone(rewards);
    mount(rewards, false, result === 'draw' ? null : 'enemy');
    expect(screen.getByTestId('defeat-panel')).toHaveTextContent(i18n.t(result === 'draw'
      ? 'combat:event.draw' : 'combat:runDefeatTitle'));
    const summary = within(screen.getByTestId('defeat-panel')).getByTestId('loot-summary');
    expect(summary).toHaveTextContent(english
      ? 'Loot from completed waves is kept.' : '已完成波次的战利品已保留。');
    expect(summary).toHaveTextContent(english ? '+7 Rune Shards' : '+7 符文碎片');
    expect(summary).toHaveTextContent(english ? '+4 Wishstones' : '+4 祈愿石');
    expect(summary).toHaveTextContent(english ? '+2 El' : '+2 艾尔符文');
    expect(summary).toHaveTextContent(english ? '+3 Perfect Ruby' : '+3 完美的红宝石');
    expect(within(summary).getByTestId('loot-items')).toHaveTextContent(english ? 'Cap' : '帽子');
    expect(within(summary).getAllByRole('listitem')).toHaveLength(3);
    expect(rewards).toEqual(before);
    expect(useCombatStore.getState().runRewards).toBe(rewards);
  });

  it('omits empty defeat loot and its retained-loot explanation', () => {
    mount(empty, false);
    expect(screen.getByTestId('defeat-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('loot-summary')).not.toBeInTheDocument();
    expect(screen.queryByText(english
      ? 'Loot from completed waves is kept.' : '已完成波次的战利品已保留。')).not.toBeInTheDocument();
  });

  it('does not present a terminal reward summary during an unfinished run', () => {
    mount({ ...empty, wishstones: 4 });
    act(() => { useCombatStore.setState({ runVictory: false, runDefeat: false }); });
    expect(screen.queryByTestId('loot-summary')).not.toBeInTheDocument();
  });
});

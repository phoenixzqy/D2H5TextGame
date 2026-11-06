/** P17a04 supersedes the four transient lastClosedAt helper tests.
 * Engine accrual/cap tests remain in engine/idle/offline-bonus.test.ts.
 * Real hook, UI, projection and exact-import orchestration; only disk is fake.
 */
import { createElement, Fragment, StrictMode } from 'react';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IdleState, SaveCurrent } from '@/engine/types/save';
import type { SaveRecord } from '@/stores/save-adapter';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return {
    state,
    get: () => Promise.resolve(state.record),
    put: (record: SaveRecord) => { state.record = structuredClone(record); return Promise.resolve(); },
    delete: () => { state.record = undefined; return Promise.resolve(); }
  };
});
vi.mock('dexie', () => ({ default: class {
  version() {
    return { stores: () => Object.assign(this, { saves: disk }) };
  }
} }));

import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMetaStore, usePlayerStore } from '@/stores';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from '@/stores/persistence';
import { OfflineBonusBanner, OfflineBonusChip } from './OfflineBonusBanner';
import { useOfflineBonus } from './useOfflineBonus';

const NOW = 1_792_454_400_000;
const rawBonus: IdleState = {
  lastOnline: NOW - 86_400_000, offlineTime: 123,
  activeMultiplier: 1.32, multiplierSecondsRemaining: 4800, idleTarget: 'den'
};

function seed(bonus: IdleState = rawBonus, anchor = NOW): void {
  useMetaStore.setState({ idleState: bonus, idleBonusAnchor: anchor });
}

function renderVariants(): ReturnType<typeof render> {
  return render(createElement(I18nextProvider, { i18n },
    createElement(Fragment, null, createElement(OfflineBonusBanner), createElement(OfflineBonusChip))));
}

function expectBonus(snapshot: ReturnType<typeof useOfflineBonus>, multiplier: number, seconds: number): void {
  expect(snapshot.active).toBe(multiplier > 1 && seconds > 0);
  expect(snapshot.multiplier).toBeCloseTo(multiplier, 12);
  expect(snapshot.currentPct).toBeCloseTo(multiplier - 1, 12);
  expect(snapshot.remainingSeconds).toBeCloseTo(seconds, 12);
}

beforeEach(async () => {
  __resetPersistenceForTests();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  useMetaStore.getState().reset();
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Bonus UI', 'sorceress'));
  disk.state.record = undefined;
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  __resetPersistenceForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('persisted offline-bonus UI authority', () => {
  it('mounts an aged persisted bonus with no transient close timestamp and shows current values', () => {
    seed();
    vi.setSystemTime(NOW + 600_000);
    renderVariants();
    expect(screen.getByTestId('offline-bonus-banner')).toHaveTextContent('+28% XP / Magic Find');
    expect(screen.getByTestId('offline-bonus-banner')).toHaveTextContent('next 70 min');
    expect(screen.getByTestId('offline-bonus-chip')).toHaveAccessibleName('+28% XP and Magic Find for 70 min');
    expect(screen.getByTestId('offline-bonus-chip')).toHaveTextContent('+28% XP/MF · 70m');
    const meters = screen.getAllByRole('meter', { name: 'Current XP and Magic Find bonus' });
    expect(meters).toHaveLength(2);
    for (const meter of meters) {
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '50');
      expect(Number(meter.getAttribute('aria-valuenow'))).toBeCloseTo(28, 8);
      expect(meter).toHaveAttribute('aria-valuetext', '+28% XP and Magic Find for 70 min');
      expect(Number.parseFloat((meter.firstElementChild as HTMLElement).style.width)).toBeCloseTo(56, 8);
    }
    act(() => { vi.advanceTimersByTime(600_000); });
    for (const meter of meters) {
      expect(Number(meter.getAttribute('aria-valuenow'))).toBeCloseTo(24, 8);
      expect(Number.parseFloat((meter.firstElementChild as HTMLElement).style.width)).toBeCloseTo(48, 8);
    }
    expect(useMetaStore.getState().idleState).toBe(rawBonus);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW);
  });

  it('projects aged mounts and later remounts without publication or refreshing the source', () => {
    seed();
    vi.setSystemTime(NOW + 600_000);
    const before = useMetaStore.getState();
    const publish = vi.fn();
    const stop = useMetaStore.subscribe(publish);
    const first = renderHook(useOfflineBonus);
    expectBonus(first.result.current, 1.28, 4200);
    first.unmount();
    vi.setSystemTime(NOW + 1_200_000);
    const second = renderHook(useOfflineBonus);
    expectBonus(second.result.current, 1.24, 3600);
    act(() => { vi.advanceTimersByTime(30_000); });
    expectBonus(second.result.current, 1.238, 3570);
    expect(useMetaStore.getState()).toBe(before);
    expect(useMetaStore.getState().idleState).toBe(rawBonus);
    expect(publish).not.toHaveBeenCalled();
    stop();
  });

  it('does not invent a bonus from an inactive historical tuple', () => {
    seed({ ...rawBonus, activeMultiplier: 1, multiplierSecondsRemaining: 0 }, NOW - 36_000_000);
    const hook = renderHook(useOfflineBonus);
    expectBonus(hook.result.current, 1, 0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('samples the actual render clock on a mounted tuple replacement between ticks', () => {
    seed();
    const hook = renderHook(useOfflineBonus);
    vi.setSystemTime(NOW + 10_000);
    act(() => { seed({ ...rawBonus, activeMultiplier: 1.4, multiplierSecondsRemaining: 100 }, NOW + 5000); });
    expectBonus(hook.result.current, 1.38, 95);
  });

  it('responds when the same raw tuple receives only a new online anchor', () => {
    seed();
    vi.setSystemTime(NOW + 600_000);
    const hook = renderHook(useOfflineBonus);
    expectBonus(hook.result.current, 1.28, 4200);
    act(() => { useMetaStore.setState({ idleBonusAnchor: NOW + 600_000 }); });
    expectBonus(hook.result.current, 1.32, 4800);
  });

  it('immediately displays real exact-import replacements at their publication time', async () => {
    seed();
    const hook = renderHook(useOfflineBonus);
    vi.setSystemTime(NOW + 10_000);
    const source = snapshotStores();
    if (!source) throw new Error('Missing ordinary character fixture');
    const replacement: SaveCurrent = { ...source,
      meta: { ...source.meta, idleState: { ...rawBonus, activeMultiplier: 1.2, multiplierSecondsRemaining: 20 } } };
    await act(async () => { await importIntoStores(JSON.stringify(replacement)); });
    expectBonus(hook.result.current, 1.2, 20);
    expect(useMetaStore.getState().idleState).toEqual(replacement.meta.idleState);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW + 10_000);
    await act(async () => {
      await importIntoStores(JSON.stringify({ ...replacement, meta: { ...replacement.meta,
        idleState: { ...rawBonus, activeMultiplier: 1, multiplierSecondsRemaining: 0 } } }));
    });
    expectBonus(hook.result.current, 1, 0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('metadata changes and parent renders use actual time without refreshing the bonus', () => {
    seed();
    const hook = renderHook(useOfflineBonus);
    vi.setSystemTime(NOW + 10_000);
    act(() => { useMetaStore.getState().setIdleTarget('another'); });
    expectBonus(hook.result.current, 1.32 - 0.32 * 10 / 4800, 4790);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW);
    vi.setSystemTime(NOW + 20_000);
    act(() => { useMetaStore.getState().updateSettings({ soundEnabled: false }); });
    hook.rerender();
    expectBonus(hook.result.current, 1.32 - 0.32 * 20 / 4800, 4780);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW);
  });

  it('keeps tiny bonuses active and hides both variants exactly at a short expiry', () => {
    seed({ ...rawBonus, activeMultiplier: 1.004, multiplierSecondsRemaining: 20 });
    const hook = renderHook(useOfflineBonus);
    renderVariants();
    expect(hook.result.current.active).toBe(true);
    expect(screen.getByTestId('offline-bonus-chip')).toHaveTextContent('+0%');
    act(() => { vi.advanceTimersByTime(19_999); });
    expect(hook.result.current.active).toBe(true);
    act(() => { vi.advanceTimersByTime(1); });
    expectBonus(hook.result.current, 1, 0);
    expect(screen.queryByTestId('offline-bonus-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('offline-bonus-chip')).not.toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps scheduling across rollback when a delivered wake leaves the projection unchanged', () => {
    seed();
    vi.setSystemTime(NOW - 60_000);
    const before = useMetaStore.getState();
    const publish = vi.fn();
    const stop = useMetaStore.subscribe(publish);
    const hook = renderHook(useOfflineBonus);
    expectBonus(hook.result.current, 1.32, 4800);
    act(() => { vi.advanceTimersByTime(30_000); });
    expectBonus(hook.result.current, 1.32, 4800);
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(60_000); });
    expectBonus(hook.result.current, 1.318, 4770);
    act(() => { vi.advanceTimersByTime(4_770_000); });
    expectBonus(hook.result.current, 1, 0);
    expect(vi.getTimerCount()).toBe(0);
    expect(useMetaStore.getState()).toBe(before);
    expect(publish).not.toHaveBeenCalled();
    stop();
  });

  it('reprojects immediately on visibility return when timer delivery was throttled', () => {
    seed();
    const hook = renderHook(useOfflineBonus);
    const before = useMetaStore.getState();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.setSystemTime(NOW + 600_000);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expectBonus(hook.result.current, 1.28, 4200);
    expect(useMetaStore.getState()).toBe(before);
  });

  it('cleans the surviving StrictMode timer on unmount and starts none while inactive', () => {
    seed();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const hook = renderHook(useOfflineBonus, { wrapper: StrictMode });
    expect(vi.getTimerCount()).toBe(1);
    hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const visibleHandlers = add.mock.calls.filter(([type]) => type === 'visibilitychange').map(([, handler]) => handler);
    expect(visibleHandlers).toHaveLength(2);
    for (const handler of visibleHandlers) expect(remove).toHaveBeenCalledWith('visibilitychange', handler);
    seed({ ...rawBonus, activeMultiplier: 1, multiplierSecondsRemaining: 0 });
    renderHook(useOfflineBonus, { wrapper: StrictMode });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('localizes the visible compact unit and accessible current bonus in Chinese', async () => {
    await i18n.changeLanguage('zh-CN');
    seed();
    vi.setSystemTime(NOW + 600_000);
    renderVariants();
    expect(screen.getByTestId('offline-bonus-banner')).toHaveTextContent('离线加成 +28% 经验／魔法寻获');
    expect(screen.getByTestId('offline-bonus-banner')).toHaveTextContent('剩余 70 分钟');
    expect(screen.getByTestId('offline-bonus-chip')).toHaveTextContent('+28% 经验／魔法寻获 · 70分钟');
    expect(screen.getByTestId('offline-bonus-chip')).toHaveAccessibleName('+28% 经验与魔法寻获加成，剩余 70 分钟');
    expect(screen.getAllByRole('meter', { name: '当前经验与魔法寻获加成' })).toHaveLength(2);
  });
});

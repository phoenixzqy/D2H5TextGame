import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { EquipPicker } from '@/features/inventory/EquipPicker';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const realRecompute = usePlayerStore.getState().recomputeDerived;
const oneHanded = 'items/base/wp1h-short-sword';
const twoHanded = 'items/base/wp2h-two-handed-sword';
const shieldBase = 'items/base/sh-buckler';

function item(id: string, baseId = 'items/base/helm-cap', fields: Partial<Item> = {}): Item {
  return {
    id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'retained', values: new Map([['statMods.life', 3]]) }],
    ...fields
  };
}

function seed(count: number, candidate: Item, equipped: Record<string, Item | null>): Item[] {
  const backpack = [candidate, ...Array.from({ length: count - 1 }, (_, i) => item(`filler-${String(i)}`))];
  useInventoryStore.setState({ backpack, equipped, stash: [item('stashed')], currencies: { shard: 17 } });
  return backpack;
}

function watchAction(action: () => unknown) {
  const recompute = vi.fn(realRecompute);
  usePlayerStore.setState({ recomputeDerived: recompute });
  const before = useInventoryStore.getState();
  const playerBefore = usePlayerStore.getState();
  const originalContents = structuredClone({ backpack: before.backpack, equipped: before.equipped });
  const publish = vi.fn();
  const unsubscribe = useInventoryStore.subscribe(publish);
  try {
    return { result: action(), before, playerBefore, originalContents, publish, recompute };
  } finally {
    unsubscribe();
  }
}

function expectUnmutated(outcome: ReturnType<typeof watchAction>): void {
  expect(outcome.before.backpack).toEqual(outcome.originalContents.backpack);
  expect(outcome.before.equipped).toEqual(outcome.originalContents.equipped);
  expect(useInventoryStore.getState().stash).toBe(outcome.before.stash);
  expect(useInventoryStore.getState().currencies).toBe(outcome.before.currencies);
}

function expectRefusal(outcome: ReturnType<typeof watchAction>, reason: string): void {
  expect(outcome.result).toEqual({ ok: false, reason });
  expect(useInventoryStore.getState()).toBe(outcome.before);
  expect(usePlayerStore.getState()).toBe(outcome.playerBefore);
  expect(outcome.publish).not.toHaveBeenCalled();
  expect(outcome.recompute).not.toHaveBeenCalled();
  expectUnmutated(outcome);
}

function expectSuccess(outcome: ReturnType<typeof watchAction>, backpack: Item[]): void {
  expect(outcome.result).toEqual({ ok: true });
  const after = useInventoryStore.getState();
  expect(after.backpack).toEqual(backpack);
  expect(outcome.publish).toHaveBeenCalledTimes(1);
  expect(outcome.recompute).toHaveBeenCalledTimes(1);
  expect(outcome.recompute).toHaveBeenCalledWith(after.equipped);
  expectUnmutated(outcome);
}

function renderScreen(): void {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <InventoryScreen />
      </MemoryRouter>
    </I18nextProvider>
  );
}

const weapon = item('old-weapon', oneHanded, { equipped: true, rarity: 'magic' });
const shield = item('old-shield', shieldBase, { equipped: true });

beforeEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.setState({ recomputeDerived: realRecompute });
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Capacity', 'barbarian'));
});

afterEach(() => {
  cleanup();
  useInventoryStore.getState().reset();
  usePlayerStore.setState({ recomputeDerived: realRecompute });
  usePlayerStore.getState().reset();
});

describe('hero equipment capacity uses actual net displacement', () => {
  it.each([99, 100, 101])('allows empty-slot equip from backpack %i', (count) => {
    const candidate = item('candidate');
    const backpack = seed(count, candidate, {});
    const outcome = watchAction(() => useInventoryStore.getState().equipItem(candidate));
    expectSuccess(outcome, backpack.slice(1));
    expect(useInventoryStore.getState().equipped).toEqual({ head: { ...candidate, equipped: true } });
    expect(useInventoryStore.getState().equipped.head?.affixes).toBe(candidate.affixes);
  });

  it.each([100, 101])('allows a one-for-one weapon swap from backpack %i', (count) => {
    const candidate = item('candidate', oneHanded);
    const backpack = seed(count, candidate, { weapon, offhand: shield });
    const outcome = watchAction(() => useInventoryStore.getState().equipItem(candidate));
    expectSuccess(outcome, [...backpack.slice(1), { ...weapon, equipped: false }]);
    expect(useInventoryStore.getState().equipped).toEqual({ weapon: { ...candidate, equipped: true }, offhand: shield });
  });

  it.each([99, 100, 101])('checks the two-handed swap final count from backpack %i', (count) => {
    const candidate = item('candidate', twoHanded);
    const backpack = seed(count, candidate, { weapon, offhand: shield });
    // A stale one-handed caller must not undercount authoritative displacement.
    const outcome = watchAction(() => useInventoryStore.getState().equipItem({ ...candidate, baseId: oneHanded }));
    if (count >= 100) expectRefusal(outcome, 'backpack_full');
    else {
      expectSuccess(outcome, [...backpack.slice(1), { ...weapon, equipped: false }, { ...shield, equipped: false }]);
      expect(useInventoryStore.getState().equipped).toEqual({ weapon: { ...candidate, equipped: true }, offhand: null });
    }
  });

  it.each([100, 101])('allows offhand replacing an equipped two-handed weapon at %i', (count) => {
    const candidate = item('candidate', shieldBase);
    const old = item('old-two-handed', twoHanded, { equipped: true });
    const backpack = seed(count, candidate, { weapon: old, offhand: null });
    const outcome = watchAction(() => useInventoryStore.getState().equipItem(candidate));
    expectSuccess(outcome, [...backpack.slice(1), { ...old, equipped: false }]);
    expect(useInventoryStore.getState().equipped).toEqual({ weapon: null, offhand: { ...candidate, equipped: true } });
  });

  it.each([99, 100, 101])('unequips only when backpack %i has room', (count) => {
    const backpack = seed(count, item('candidate'), { weapon });
    const outcome = watchAction(() => useInventoryStore.getState().unequipItem('weapon'));
    if (count >= 100) expectRefusal(outcome, 'backpack_full');
    else {
      expectSuccess(outcome, [...backpack, { ...weapon, equipped: false }]);
      expect(useInventoryStore.getState().equipped).toEqual({ weapon: null });
    }
  });

  it.each(['missing', 'no-slot', 'requirements', 'empty-unequip'] as const)('retains %s precedence when full', (kind) => {
    const candidate = kind === 'no-slot'
      ? item('candidate', 'items/base/not-real')
      : kind === 'requirements'
        ? item('candidate', oneHanded, { rarity: 'unique', uniqueId: 'items/unique/rixots-keen' })
        : item('candidate', twoHanded);
    seed(100, candidate, { weapon, offhand: shield });
    const outcome = watchAction(() => kind === 'empty-unequip'
      ? useInventoryStore.getState().unequipItem('head')
      : useInventoryStore.getState().equipItem(kind === 'missing' ? { ...candidate, id: 'missing' } : candidate));
    const reason = kind === 'missing' ? 'not_in_backpack' : kind === 'no-slot' ? 'no_slot'
      : kind === 'requirements' ? 'requirements_not_met' : 'not_found';
    expectRefusal(outcome, reason);
  });
});

describe.each(['en', 'zh-CN'] as const)('hero equipment capacity feedback %s', (locale) => {
  const message = locale === 'en'
    ? 'Backpack is full. Make room before moving or removing equipment.'
    : '背包已满，请腾出空间后再转移物品或卸下装备。';

  it('retains backpack detail on refusal and permits retry after discard', async () => {
    await i18n.changeLanguage(locale);
    const candidate = item('candidate', twoHanded);
    const backpack = seed(100, candidate, { weapon, offhand: shield });
    renderScreen();
    fireEvent.click(screen.getByTestId('inv-item-candidate'));
    const detail = screen.getByTestId('inv-detail-panel');
    const before = useInventoryStore.getState();
    fireEvent.click(screen.getByTestId('inv-primary-action'));
    expect(screen.getByTestId('inventory-toast')).toHaveTextContent(message);
    expect(screen.getByTestId('inv-detail-panel')).toBe(detail);
    expect(screen.getByTestId('inv-item-candidate')).toHaveAttribute('aria-pressed', 'true');
    expect(useInventoryStore.getState()).toBe(before);
    act(() => { useInventoryStore.getState().discardItem('filler-0'); });
    fireEvent.click(screen.getByTestId('inv-primary-action'));
    expect(screen.queryByTestId('inv-detail-panel')).not.toBeInTheDocument();
    expect(useInventoryStore.getState().backpack).toEqual([
      ...backpack.slice(2), { ...weapon, equipped: false }, { ...shield, equipped: false }
    ]);
  });

  it('announces refused unequip, retains gear, and retries after discard', async () => {
    await i18n.changeLanguage(locale);
    const backpack = seed(100, item('candidate'), { weapon });
    renderScreen();
    fireEvent.click(screen.getByRole('tab', { name: /Equipment|装备/ }));
    const slot = screen.getByTestId('equip-slot-weapon');
    const before = useInventoryStore.getState();
    fireEvent.click(within(slot).getByRole('button', { name: /^(Unequip|卸下)$/ }));
    expect(screen.getByTestId('inventory-toast')).toHaveTextContent(message);
    expect(useInventoryStore.getState()).toBe(before);
    expect(screen.getByTestId('equip-slot-weapon')).toBe(slot);
    act(() => { useInventoryStore.getState().discardItem('filler-0'); });
    fireEvent.click(within(slot).getByRole('button', { name: /^(Unequip|卸下)$/ }));
    expect(useInventoryStore.getState().backpack).toEqual([
      backpack[0], ...backpack.slice(2), { ...weapon, equipped: false }
    ]);
    expect(useInventoryStore.getState().equipped.weapon).toBeNull();
  });

  it('keeps the picker candidate and announces the refusal inside the dialog', async () => {
    await i18n.changeLanguage(locale);
    const candidate = item('candidate', twoHanded);
    seed(100, candidate, { weapon, offhand: shield });
    const close = vi.fn();
    const failed = vi.fn();
    const view = render(<I18nextProvider i18n={i18n}><EquipPicker slot="weapon" onClose={close} onEquipFailed={failed} /></I18nextProvider>);
    const confirm = screen.getByTestId('equip-picker-confirm');
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    const error = within(screen.getByTestId('equip-picker')).getByTestId('equip-picker-error');
    expect(error.parentElement).toHaveAttribute('aria-live', 'polite');
    expect(error).toHaveTextContent(message);
    expect(screen.getByTestId('equip-picker-row-candidate')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('candidate-item-header')).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
    expect(failed).toHaveBeenCalledWith(candidate, 'backpack_full');
    await act(() => i18n.changeLanguage(locale === 'en' ? 'zh-CN' : 'en'));
    expect(error).toHaveTextContent(locale === 'en' ? '背包已满，请腾出空间后再转移物品或卸下装备。' : 'Backpack is full. Make room before moving or removing equipment.');
    // Candidate change clears an obsolete error; a legal no-growth swap stays enabled.
    act(() => { useInventoryStore.getState().addItem(item('one-handed', oneHanded)); });
    fireEvent.click(screen.getByTestId('equip-picker-row-one-handed'));
    expect(screen.queryByTestId('equip-picker-error')).not.toBeInTheDocument();
    expect(confirm).toBeEnabled();
    fireEvent.click(screen.getByTestId('equip-picker-row-candidate'));
    fireEvent.click(confirm);
    expect(screen.getByTestId('equip-picker-error')).toBeInTheDocument();
    view.rerender(<I18nextProvider i18n={i18n}><EquipPicker slot="head" onClose={close} onEquipFailed={failed} /></I18nextProvider>);
    expect(screen.queryByTestId('equip-picker-error')).not.toBeInTheDocument();
    view.rerender(<I18nextProvider i18n={i18n}><EquipPicker slot="weapon" onClose={close} onEquipFailed={failed} /></I18nextProvider>);
    fireEvent.click(screen.getByTestId('equip-picker-row-candidate'));
    act(() => { useInventoryStore.getState().discardItem('filler-0'); useInventoryStore.getState().discardItem('filler-1'); });
    fireEvent.click(confirm);
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('equip-picker-error')).not.toBeInTheDocument();
    expect(useInventoryStore.getState().equipped.weapon?.id).toBe(candidate.id);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore, usePlayerStore, useMapStore, useMercStore, useCombatStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { EquipPicker } from './EquipPicker';

const stores = [useInventoryStore, usePlayerStore, useMapStore, useMercStore, useCombatStore] as const;
const weapons = (count: number): Item[] => Array.from({ length: count }, (_, index) => ({
  id: `paged-weapon-${String(index)}`, baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
  level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
  baseRolls: { attack: 10 + index }
}));
const picker = (slot: 'weapon' | null = 'weapon') => <I18nextProvider i18n={i18n}>
  <EquipPicker slot={slot} onClose={() => undefined} />
</I18nextProvider>;
const row = (index: number) => screen.getByTestId(`equip-picker-row-paged-weapon-${String(index)}`);
const rows = () => within(screen.getByTestId('candidate-list')).getAllByRole('option');

describe.each(['en', 'zh-CN'] as const)('bounded equipment picker %s', locale => {
  const en = locale === 'en';
  beforeEach(async () => {
    __resetPersistenceForTests();
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Paged picker', 'barbarian'));
    await i18n.changeLanguage(locale);
  });
  afterEach(() => { act(() => { for (const store of stores) store.getState().reset(); }); });

  it('bounds option rows while every candidate remains reachable and browsing preserves holdings', () => {
    const backpack = weapons(103);
    useInventoryStore.setState({ backpack, materials: { 'runes/el': 3 }, currencies: { 'rune-shard': 17 } });
    const before = useInventoryStore.getState();
    render(picker());
    expect(rows()).toHaveLength(50);
    const visited = rows().map(option => option.dataset.testid);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Next page' : '下一页' }));
    expect(rows()).toHaveLength(50);
    expect(row(50)).toHaveAttribute('aria-selected', 'true');
    visited.push(...rows().map(option => option.dataset.testid));
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    expect(rows()).toHaveLength(3);
    expect(row(100)).toHaveAttribute('aria-posinset', '101');
    expect(row(100)).toHaveAttribute('aria-setsize', '103');
    visited.push(...rows().map(option => option.dataset.testid));
    expect(new Set(visited).size).toBe(103);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Previous page' : '上一页' }));
    expect(row(50)).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('button', { name: en ? 'First page' : '首页' }));
    expect(row(0)).toHaveAttribute('aria-selected', 'true');
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('keeps focus and comparison on the chosen instance across keyboard page boundaries', () => {
    useInventoryStore.setState({ backpack: weapons(103) });
    render(picker());
    fireEvent.click(row(49)); row(49).focus();
    fireEvent.keyDown(row(49), { key: 'ArrowDown' });
    expect(row(50)).toHaveFocus();
    expect(row(50)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('stat-compare-table')).toHaveTextContent('60');
    fireEvent.keyDown(row(50), { key: 'ArrowUp' });
    expect(row(49)).toHaveFocus();
    fireEvent.keyDown(row(49), { key: 'End' });
    expect(row(102)).toHaveFocus();
    expect(rows()).toHaveLength(3);
    fireEvent.keyDown(row(102), { key: 'ArrowDown' });
    expect(row(102)).toHaveFocus();
    fireEvent.keyDown(row(102), { key: 'Home' });
    expect(row(0)).toHaveFocus();
    fireEvent.keyDown(row(0), { key: 'ArrowUp' });
    expect(row(0)).toHaveFocus();
  });

  it('opens the page of the first eligible item and retains disabled reasons on other pages', () => {
    const backpack = weapons(57).map((item, index) => index < 55
      ? { ...item, baseId: 'items/base/wp1h-war-sword' } : item);
    useInventoryStore.setState({ backpack });
    render(picker());
    expect(row(55)).toHaveAttribute('aria-selected', 'true');
    expect(rows()).toHaveLength(7);
    expect(screen.getByTestId('equip-picker-confirm')).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: en ? 'First page' : '首页' }));
    expect(row(0)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('equip-picker-confirm')).toBeDisabled();
    expect(screen.getByTestId('equip-picker-disabled-reason')).not.toBeEmptyDOMElement();
    expect(useInventoryStore.getState().backpack).toBe(backpack);
  });

  it('equips the exact off-first-page instance using the native store', () => {
    const backpack = weapons(103);
    useInventoryStore.setState({ backpack });
    render(picker());
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    fireEvent.click(row(102));
    fireEvent.click(screen.getByTestId('equip-picker-confirm'));
    const after = useInventoryStore.getState();
    expect(after.equipped.weapon?.id).toBe('paged-weapon-102');
    expect(after.backpack).toEqual(backpack.slice(0, 102));
    expect(new Set([...after.backpack.map(item => item.id), after.equipped.weapon?.id]).size).toBe(103);
  });

  it('recovers when the selected item disappears and reopens without retaining an invalid page', () => {
    const backpack = weapons(103);
    useInventoryStore.setState({ backpack });
    const mounted = render(picker());
    fireEvent.click(screen.getByRole('button', { name: en ? 'Last page' : '末页' }));
    act(() => { useInventoryStore.setState({ backpack: backpack.slice(0, 2) }); });
    expect(rows()).toHaveLength(2);
    expect(row(0)).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    mounted.rerender(picker(null));
    act(() => { useInventoryStore.setState({ backpack }); });
    mounted.rerender(picker());
    expect(rows()).toHaveLength(50);
    expect(row(0)).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps to a requested page without losing focus, rejects empty input and translates live', async () => {
    const backpack = weapons(103);
    useInventoryStore.setState({ backpack });
    render(picker());
    const input = screen.getByRole('spinbutton', { name: en ? 'Page' : '页码' });
    input.focus();
    fireEvent.change(input, { target: { value: '3' } });
    expect(row(100)).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '' } });
    expect(row(100)).toHaveAttribute('aria-selected', 'true');
    await act(async () => { await i18n.changeLanguage(en ? 'zh-CN' : 'en'); });
    expect(screen.getByRole('button', { name: en ? '末页' : 'Last page' })).toBeDisabled();
    expect(row(100)).toHaveAttribute('aria-selected', 'true');
    expect(useInventoryStore.getState().backpack).toBe(backpack);
  });
});

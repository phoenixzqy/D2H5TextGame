import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

function items(prefix: string, count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'magic',
    level: 1, identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'retained', values: new Map([['coreStats.vitality', index + 1]]) }]
  }));
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Capacity', 'sorceress'));
  useInventoryStore.setState({ currencies: { 'rune-shard': 17, 'gem-shard': 3 } });
});

describe('guarded manual inventory transfers', () => {
  it.each([
    ['stash', 499, true], ['stash', 500, false], ['stash', 501, false],
    ['backpack', 99, true], ['backpack', 100, false], ['backpack', 101, false]
  ] as const)('transfers into %s at %i only when there is room', (target, count, allowed) => {
    const source = target === 'stash' ? 'backpack' : 'stash';
    const sourceItems = items('source', source === 'backpack' ? 101 : 501);
    const targetItems = items('target', count);
    useInventoryStore.setState({ [source]: sourceItems, [target]: targetItems });
    const before = useInventoryStore.getState();
    const player = usePlayerStore.getState();
    const moved = sourceItems.at(-1);
    if (!moved) throw new Error('Missing source item');
    const notify = vi.fn();
    const unsubscribe = useInventoryStore.subscribe(notify);
    const result = target === 'stash' ? before.moveToStash(moved.id) : before.moveToBackpack(moved.id);
    unsubscribe();
    const after = useInventoryStore.getState();
    if (allowed) {
      expect(result).toEqual({ ok: true });
      expect(after[source]).toEqual(sourceItems.slice(0, -1));
      expect(after[target]).toEqual([...targetItems, moved]);
      expect(after[target].at(-1)).toBe(moved);
      expect(notify).toHaveBeenCalledTimes(1);
    } else {
      expect(result).toEqual({ ok: false, reason: target === 'stash' ? 'stash_full' : 'backpack_full' });
      expect(after).toBe(before);
      expect(after.backpack).toBe(before.backpack);
      expect(after.stash).toBe(before.stash);
      expect(notify).not.toHaveBeenCalled();
    }
    expect(after.equipped).toBe(before.equipped);
    expect(after.currencies).toBe(before.currencies);
    expect(usePlayerStore.getState()).toBe(player);
    expect(sourceItems.at(-1)).toBe(moved);
    expect(targetItems).toHaveLength(count);
  });

  it.each(['stash', 'backpack'] as const)('returns missing-source failure without publishing to %s', (target) => {
    useInventoryStore.setState({ [target]: items('full', target === 'stash' ? 500 : 100) });
    const before = useInventoryStore.getState();
    const notify = vi.fn();
    const unsubscribe = useInventoryStore.subscribe(notify);
    const result = target === 'stash' ? before.moveToStash('missing') : before.moveToBackpack('missing');
    unsubscribe();
    expect(result).toEqual({ ok: false, reason: 'not_found' });
    expect(useInventoryStore.getState()).toBe(before);
    expect(notify).not.toHaveBeenCalled();
  });
});

describe.each(['en', 'zh-CN'] as const)('ordinary transfer feedback %s', (locale) => {
  it.each(['stash', 'backpack'] as const)('retains selection after full %s refusal and retries after room is made', async (target) => {
    await i18n.changeLanguage(locale);
    const source = target === 'stash' ? 'backpack' : 'stash';
    const sourceItems = items('source', 2);
    const targetItems = items('target', target === 'stash' ? 500 : 100);
    useInventoryStore.setState({ [source]: sourceItems, [target]: targetItems });
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <InventoryScreen />
        </MemoryRouter>
      </I18nextProvider>
    );
    if (source === 'stash') fireEvent.click(screen.getByRole('tab', { name: /Stash|仓库/ }));
    const before = useInventoryStore.getState();
    fireEvent.click(screen.getByTestId('inv-item-source-1'));
    const selected = screen.getByTestId('inv-detail-panel');
    fireEvent.click(screen.getByTestId('inv-secondary-action'));
    const message = target === 'stash'
      ? locale === 'en' ? 'Stash is full. Make room before transferring items.' : '仓库已满，请腾出空间后再转移物品。'
      : locale === 'en' ? 'Backpack is full. Make room before moving or removing equipment.' : '背包已满，请腾出空间后再转移物品或卸下装备。';
    expect(screen.getByTestId('inventory-toast')).toHaveTextContent(message);
    expect(useInventoryStore.getState()).toBe(before);
    expect(screen.getByTestId('inv-detail-panel')).toBe(selected);
    expect(screen.getByTestId('inv-item-source-1')).toHaveAttribute('aria-pressed', 'true');
    // The browser scenario makes room through ordinary discard controls. Here a
    // real store discard keeps the selected source mounted for the retry.
    act(() => { useInventoryStore.getState().discardItem('target-0'); });
    fireEvent.click(screen.getByTestId('inv-secondary-action'));
    expect(screen.queryByTestId('inv-detail-panel')).not.toBeInTheDocument();
    const after = useInventoryStore.getState();
    expect(after[source]).toEqual(sourceItems.slice(0, 1));
    expect(after[target]).toEqual([...targetItems.slice(1), sourceItems[1]]);
    expect(after.currencies).toBe(before.currencies);
    expect(after.equipped).toBe(before.equipped);
  });
});

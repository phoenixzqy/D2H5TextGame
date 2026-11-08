import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode, type ReactNode } from 'react';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import type { Item } from '@/engine/types/items';
import { InventoryScreen } from './InventoryScreen';
import { stubResizeObserver } from '@/test/layoutShims';

// Position subscriptions are outside this focus boundary; browser checks keep real tooltips.
vi.mock('@/ui', async importOriginal => ({
  ...(await importOriginal<typeof import('@/ui')>()),
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const stores = [useInventoryStore, usePlayerStore, useMercStore, useMapStore, useCombatStore] as const;
const item: Item = {
  id: 'focus-item', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: []
};
const mount = () => render(<StrictMode><MemoryRouter><I18nextProvider i18n={i18n}><InventoryScreen /></I18nextProvider></MemoryRouter></StrictMode>);

describe.each(['en', 'zh-CN'] as const)('inventory detail keyboard focus %s', locale => {
  const en = locale === 'en';
  let desktop = false;
  beforeEach(async () => {
    stubResizeObserver();
    desktop = false;
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: desktop && (media === '(min-width: 768px)' || media === '(min-width: 1024px)'), media,
      addEventListener: vi.fn(), removeEventListener: vi.fn()
    }));
    __resetPersistenceForTests();
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Focus', 'sorceress'));
    useInventoryStore.setState({ backpack: [item], stash: [{ ...item, id: 'stash-focus-item' }] });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => { for (const store of stores) store.getState().reset(); });
  });

  it('never hides the focused card while entering the mobile sheet', async () => {
    const hiddenFocus: Element[] = [];
    const setAttribute = Object.getOwnPropertyDescriptor(Element.prototype, 'setAttribute')?.value as Element['setAttribute'];
    const observer = vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name, value) {
      if (name === 'aria-hidden' && value === 'true' && this.contains(document.activeElement)) hiddenFocus.push(this);
      setAttribute.call(this, name, value);
    });
    try {
      mount();
      const card = screen.getByTestId('inv-item-focus-item');
      card.focus(); fireEvent.click(card);
      const dialog = screen.getByRole('dialog', { name: en ? 'Details' : '详情' });
      await waitFor(() => { expect(dialog).toHaveFocus(); });
      expect(hiddenFocus).toEqual([]);
      expect(card.closest('[aria-hidden="true"]')).not.toBeNull();
      fireEvent.keyDown(dialog, { key: 'Escape' });
      await waitFor(() => { expect(card).toHaveFocus(); });
      expect(card.closest('[aria-hidden="true"]')).toBeNull();
    } finally { observer.mockRestore(); }
  });

  it('names the mobile sheet, enters safely and restores Backpack and Stash cards on every dismissal', async () => {
    mount();
    const before = structuredClone({ backpack: useInventoryStore.getState().backpack, stash: useInventoryStore.getState().stash });
    for (const source of ['backpack', 'stash'] as const) {
      if (source === 'stash') fireEvent.click(screen.getByRole('tab', { name: en ? /^Stash/ : /^仓库/ }));
      const card = screen.getByTestId(source === 'backpack' ? 'inv-item-focus-item' : 'inv-item-stash-focus-item');
      for (const method of ['escape', 'close', 'backdrop'] as const) {
        card.focus(); fireEvent.click(card);
        const dialog = screen.getByRole('dialog', { name: en ? 'Details' : '详情' });
        await waitFor(() => { expect(dialog).toHaveFocus(); });
        expect(within(dialog).getByTestId('inv-discard-action')).not.toHaveFocus();
        if (method === 'escape') fireEvent.keyDown(dialog, { key: 'Escape' });
        else fireEvent.click(method === 'close' ? within(dialog).getByTestId('inv-detail-close') : (dialog.parentElement ?? document.body));
        expect(screen.queryByRole('dialog', { name: en ? 'Details' : '详情' })).not.toBeInTheDocument();
        await waitFor(() => { expect(card).toHaveFocus(); });
      }
    }
    expect({ backpack: useInventoryStore.getState().backpack, stash: useInventoryStore.getState().stash }).toEqual(before);
  });

  it('dismisses the discard confirmation before the sheet and restores both focus levels', async () => {
    mount();
    const card = screen.getByTestId('inv-item-focus-item');
    card.focus(); fireEvent.click(card);
    const sheet = screen.getByRole('dialog', { name: en ? 'Details' : '详情' });
    await waitFor(() => { expect(sheet).toHaveFocus(); });
    const discard = within(sheet).getByTestId('inv-discard-action');
    discard.focus(); fireEvent.click(discard);
    const confirm = screen.getByTestId('inv-discard-confirm').closest('[role="dialog"]');
    await waitFor(() => { expect(confirm).toHaveFocus(); });
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByTestId('inv-discard-confirm')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: en ? 'Details' : '详情' })).toBeInTheDocument();
    await waitFor(() => { expect(discard).toHaveFocus(); });
    fireEvent.keyDown(discard, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: en ? 'Details' : '详情' })).not.toBeInTheDocument();
    await waitFor(() => { expect(card).toHaveFocus(); });
    expect(useInventoryStore.getState().backpack).toEqual([item]);
  });

  it.each(['backpack', 'stash'] as const)('previews and salvages a %s item from its detail sheet without discarding it', async source => {
    mount();
    if (source === 'stash') fireEvent.click(screen.getByRole('tab', { name: en ? /^Stash/ : /^仓库/ }));
    const selected = useInventoryStore.getState()[source][0];
    if (!selected) throw new Error('Missing selected gear');
    fireEvent.click(screen.getByTestId(source === 'backpack' ? 'inv-item-focus-item' : 'inv-item-stash-focus-item'));
    const sheet = screen.getByRole('dialog', { name: en ? 'Details' : '详情' });
    fireEvent.click(within(sheet).getByTestId('inv-salvage-action'));
    const preview = screen.getByRole('dialog', { name: en ? 'Preview action' : '预览操作' });
    await waitFor(() => { expect(within(preview).getByRole('button', { name: en ? 'Cancel' : '取消' })).toHaveFocus(); });
    expect(preview).toHaveTextContent(en ? 'Scrap' : '废料');
    expect(useInventoryStore.getState()[source]).toContainEqual(selected);
    fireEvent.click(within(preview).getByRole('button', { name: en ? 'Confirm' : '确认' }));
    expect(useInventoryStore.getState()[source]).not.toContainEqual(selected);
    expect(useInventoryStore.getState().materials['materials/scrap']).toBeGreaterThan(0);
  });

  it('retains the desktop sidebar and allows deselection from the card', () => {
    desktop = true;
    mount();
    const card = screen.getByTestId('inv-item-focus-item');
    card.focus(); fireEvent.click(card);
    expect(screen.getByRole('complementary', { name: en ? 'Details' : '详情' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(card);
    expect(screen.queryByRole('complementary', { name: en ? 'Details' : '详情' })).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });
});

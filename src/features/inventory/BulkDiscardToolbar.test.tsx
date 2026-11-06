import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { BulkDiscardToolbar } from './BulkDiscardToolbar';

function item(id: string, rarity: Item['rarity'] = 'normal', ilvl = 1): Item {
  return { id, rarity, ilvl, baseId: 'items/base/helm-cap', level: 1, identified: true, equipped: false };
}

describe.each(['en', 'zh-CN'])('BulkDiscardToolbar current counts and confirmation (%s)', locale => {
  it('excludes crafting investments and refreshes an open confirmation after socketing', async () => {
    const previousLocale = i18n.language;
    try {
      await act(async () => { await i18n.changeLanguage(locale); });
      const onDiscard = vi.fn();
      const junk = item('junk');
      const candidate = item('candidate');
      const invested: Item[] = [item('word', 'runeword'),
        { ...item('rune'), socketContents: [{ kind: 'rune', id: 'runes/el' }] },
        { ...item('gem', 'magic'), socketContents: [{ kind: 'gem', id: 'gems/ruby/chipped' }] }];
      const view = (candidateItem: Item) => <I18nextProvider i18n={i18n}>
        <BulkDiscardToolbar backpack={[junk, candidateItem, ...invested]}
          equipped={{ head: item('equipped', 'rare', 20) }} onDiscard={onDiscard} />
      </I18nextProvider>;
      const { rerender } = render(view(candidate));
      expect(screen.getByTestId('bulk-discard-normal')).toHaveTextContent('(2)');
      expect(screen.getByTestId('bulk-discard-magic')).toBeDisabled();
      expect(screen.getByTestId('bulk-discard-belowTier')).toHaveTextContent('(2)');
      fireEvent.click(screen.getByTestId('bulk-discard-belowTier'));
      expect(screen.getByRole('dialog')).toHaveTextContent(locale === 'en'
        ? 'Unique, set and runeword items, and equipment with inserted runes or gems, are always preserved.'
        : '暗金、套装、符文之语及已镶嵌符文或宝石的装备始终保留。');
      rerender(view({ ...candidate, socketContents: [{ kind: 'rune', id: 'runes/el' }] }));
      expect(screen.getByTestId('bulk-discard-normal')).toHaveTextContent('(1)');
      expect(within(screen.getByTestId('bulk-discard-preview')).getAllByRole('listitem')).toHaveLength(1);
      fireEvent.click(screen.getByTestId('bulk-discard-confirm'));
      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(onDiscard).toHaveBeenCalledWith(['junk']);
    } finally {
      await act(async () => { await i18n.changeLanguage(previousLocale); });
    }
  });

  it('refreshes counts and an open preview after backpack and equipment changes', async () => {
    const previousLocale = i18n.language;
    try {
      await act(async () => { await i18n.changeLanguage(locale); });
      const onDiscard = vi.fn();
      const first = item('first');
      const second = item('second', 'magic', 5);
      const protectedItem = item('protected', 'unique');
      const view = (backpack: readonly Item[], equipped: Record<string, Item | null>) => (
        <I18nextProvider i18n={i18n}>
          <BulkDiscardToolbar backpack={backpack} equipped={equipped} onDiscard={onDiscard} />
        </I18nextProvider>
      );
      const { rerender } = render(view([first, second, protectedItem], { head: item('equipped', 'rare', 10) }));
      expect(screen.getByTestId('bulk-discard-normal')).toHaveTextContent('(1)');
      expect(screen.getByTestId('bulk-discard-magic')).toHaveTextContent('(1)');
      expect(screen.getByTestId('bulk-discard-rare')).toBeDisabled();
      expect(screen.getByTestId('bulk-discard-belowTier')).toHaveTextContent('(2)');
      fireEvent.click(screen.getByTestId('bulk-discard-belowTier'));
      expect(within(screen.getByTestId('bulk-discard-preview')).getAllByRole('listitem')).toHaveLength(2);
      rerender(view([second, protectedItem], { head: item('equipped', 'rare', 5) }));
      expect(screen.getByTestId('bulk-discard-normal')).toBeDisabled();
      expect(screen.getByTestId('bulk-discard-belowTier')).toHaveTextContent('(0)');
      expect(within(screen.getByTestId('bulk-discard-preview')).queryAllByRole('listitem')).toHaveLength(0);
      rerender(view([second, protectedItem], { head: item('equipped', 'rare', 6) }));
      expect(screen.getByTestId('bulk-discard-belowTier')).toHaveTextContent('(1)');
      expect(within(screen.getByTestId('bulk-discard-preview')).getAllByRole('listitem')).toHaveLength(1);
      fireEvent.click(screen.getByTestId('bulk-discard-confirm'));
      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(onDiscard).toHaveBeenCalledWith(['second']);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      await act(async () => { await i18n.changeLanguage(previousLocale); });
    }
  });

  it('limits preview names while confirming every current eligible item', async () => {
    const previousLocale = i18n.language;
    try {
      await act(async () => { await i18n.changeLanguage(locale); });
      const backpack = Array.from({ length: 12 }, (_, index) => item(`normal-${String(index)}`));
      const onDiscard = vi.fn();
      render(<I18nextProvider i18n={i18n}>
        <BulkDiscardToolbar backpack={[...backpack, item('set', 'set')]} equipped={{}} onDiscard={onDiscard} />
      </I18nextProvider>);
      expect(screen.getByTestId('bulk-discard-normal')).toHaveTextContent('(12)');
      fireEvent.click(screen.getByTestId('bulk-discard-normal'));
      const preview = within(screen.getByTestId('bulk-discard-preview')).getAllByRole('listitem');
      expect(preview).toHaveLength(11);
      expect(preview[10]).toHaveTextContent(i18n.t('inventory:bulk.andMore', { count: 2 }));
      fireEvent.click(screen.getByTestId('bulk-discard-confirm'));
      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(onDiscard).toHaveBeenCalledWith(backpack.map(entry => entry.id));
    } finally {
      await act(async () => { await i18n.changeLanguage(previousLocale); });
    }
  });
});

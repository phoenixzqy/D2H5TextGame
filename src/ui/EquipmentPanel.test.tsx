import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { EquipmentPanel } from './EquipmentPanel';

const cap: Item = { id: 'equipped-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: true, equipSlot: 'head' };

describe.each(['en', 'zh-CN'] as const)('EquipmentPanel independent actions (%s)', locale => {
  it.each(['Enter', ' '] as const)('does not intercept %s on Details or Unequip', async key => {
    await i18n.changeLanguage(locale);
    const select = vi.fn(), details = vi.fn(), unequip = vi.fn();
    render(<I18nextProvider i18n={i18n}><EquipmentPanel equipped={{ head: cap }}
      slotOrder={['head']} onSlotClick={select} onViewSlot={details} onUnequip={unequip} /></I18nextProvider>);
    for (const name of [locale === 'en' ? 'Details' : '详情', locale === 'en' ? 'Unequip' : '卸下']) {
      const action = screen.getByRole('button', { name });
      action.focus();
      // jsdom omits native keyboard-to-click synthesis. First prove the key
      // remains unhandled, then deliver that native click separately.
      expect(fireEvent.keyDown(action, { key })).toBe(true);
      expect(select).not.toHaveBeenCalled();
      fireEvent.keyUp(action, { key });
      fireEvent.click(action);
    }
    expect(details.mock.calls).toEqual([['head']]);
    expect(unequip.mock.calls).toEqual([['head']]);
    expect(select).not.toHaveBeenCalled();
  });

  it('exposes separate named native buttons and preserves an empty slot picker', async () => {
    await i18n.changeLanguage(locale);
    const select = vi.fn(), details = vi.fn(), unequip = vi.fn();
    render(<I18nextProvider i18n={i18n}><EquipmentPanel equipped={{ head: cap }}
      slotOrder={['head', 'boots']} onSlotClick={select} onViewSlot={details} onUnequip={unequip} /></I18nextProvider>);
    const head = screen.getByRole('group', { name: locale === 'en' ? 'Head' : '头部' });
    const buttons = within(head).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      expect(button.parentElement?.closest('button, [role="button"]')).toBeNull();
    }
    fireEvent.click(within(head).getByRole('button', { name: locale === 'en' ? 'Head' : '头部' }));
    const boots = screen.getByRole('group', { name: locale === 'en' ? 'Boots' : '靴子' });
    expect(within(boots).getAllByRole('button')).toHaveLength(1);
    fireEvent.click(within(boots).getByRole('button'));
    expect(select.mock.calls).toEqual([['head'], ['boots']]);
    expect(details).not.toHaveBeenCalled();
    expect(unequip).not.toHaveBeenCalled();
  });
});

it('keeps read-only slots noninteractive while retaining optional detail actions', async () => {
  await i18n.changeLanguage('en');
  const details = vi.fn();
  render(<I18nextProvider i18n={i18n}><EquipmentPanel equipped={{ head: cap }}
    slotOrder={['head', 'boots']} onViewSlot={details} /></I18nextProvider>);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  expect(details.mock.calls).toEqual([['head']]);
  expect(screen.getByText('Empty')).toBeInTheDocument();
});

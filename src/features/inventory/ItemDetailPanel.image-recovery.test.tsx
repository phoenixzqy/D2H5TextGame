import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { getItemIconUrl } from '@/ui/imageHelpers';
import { ItemDetailPanel } from './ItemDetailPanel';

const helm: Item = { id: 'recovery-helm', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: false, socketCapacity: 0 };
const sword: Item = { ...helm, id: 'recovery-sword', baseId: 'items/base/wp1h-short-sword' };
const discard = vi.fn();
const close = vi.fn();
const detail = (item: Item) => <I18nextProvider i18n={i18n}>
  <ItemDetailPanel item={item} playerLevel={10}
    playerCoreStats={{ strength: 50, dexterity: 50, vitality: 50, energy: 50 }}
    onDiscard={discard} onClose={close} />
</I18nextProvider>;

function image(): HTMLImageElement {
  const found = screen.getByTestId('inv-detail-panel').querySelector('img');
  if (!found) throw new Error('Expected item artwork');
  return found;
}

describe.each(['en', 'zh-CN'])('inventory detail artwork recovery in %s', locale => {
  beforeEach(async () => { vi.clearAllMocks(); await i18n.changeLanguage(locale); });

  it('falls back after failure and retries the same source only on reconnection', () => {
    render(detail(helm));
    const first = image();
    expect(first).toHaveAttribute('src', getItemIconUrl(helm));
    const panel = screen.getByTestId('inv-detail-panel');
    fireEvent.online(window);
    expect(image()).toBe(first);
    fireEvent.error(first);
    expect(panel.querySelector('img')).toBeNull();
    expect(panel).toHaveTextContent('?');
    fireEvent.offline(window);
    expect(panel.querySelector('img')).toBeNull();
    fireEvent.online(window);
    const retried = image();
    expect(retried).not.toBe(first);
    expect(retried).toHaveAttribute('src', getItemIconUrl(helm));
    expect(retried).toHaveClass('object-contain');
    fireEvent.online(window);
    expect(image()).toBe(retried);
    fireEvent.error(retried);
    expect(panel.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByTestId('inv-detail-close'));
    expect(close).toHaveBeenCalledOnce();
    expect(discard).not.toHaveBeenCalled();
  });

  it('loads the next selected item after failure without waiting for reconnection', () => {
    expect(getItemIconUrl(sword)).not.toBe(getItemIconUrl(helm));
    const { rerender } = render(detail(helm));
    fireEvent.error(image());
    expect(screen.getByTestId('inv-detail-panel').querySelector('img')).toBeNull();
    rerender(detail(sword));
    expect(image()).toHaveAttribute('src', getItemIconUrl(sword));
    fireEvent.error(image());
    expect(screen.getByTestId('inv-detail-panel').querySelector('img')).toBeNull();
    rerender(detail(helm));
    expect(image()).toHaveAttribute('src', getItemIconUrl(helm));
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { ItemTooltip } from '@/ui/ItemTooltip';
import { ItemDetailPanel } from './ItemDetailPanel';

const item = (socketCapacity: number): Item => ({ id: 'instance-capacity', baseId: 'items/base/helm-cap',
  rarity: 'normal', level: 1, identified: true, equipped: false, socketCapacity });
function show(value: Item) {
  return render(<I18nextProvider i18n={i18n}><ItemTooltip item={value} />
    <ItemDetailPanel item={value} playerLevel={10} playerCoreStats={{ strength: 50, dexterity: 50, vitality: 50, energy: 50 }}
      onDiscard={vi.fn()} onClose={vi.fn()} /></I18nextProvider>);
}

describe.each(['en', 'zh-CN'])('native item service presentation in %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  it('renders zero instance sockets even when the actual base template has two', () => {
    show(item(0));
    expect(within(screen.getByTestId('item-tooltip')).queryByText(i18n.t('items:tooltip.sockets', { value: 2 }))).toBeNull();
    expect(screen.getByTestId('inv-detail-panel').textContent).not.toContain('[ ]');
  });
  it('renders the transformed instance capacity and safely renders personalization as text', () => {
    show({ ...item(1), personalizedBy: { characterId: 'hero', name: '<b>Owner</b>' } });
    expect(screen.getByTestId('item-tooltip')).toHaveTextContent(i18n.t('items:tooltip.sockets', { value: 1 }));
    expect(screen.getByTestId('inv-detail-panel').textContent.match(/\[ \]/g)).toHaveLength(1);
    for (const id of ['item-tooltip-personalization', 'inv-detail-personalization']) {
      expect(screen.getByTestId(id)).toHaveTextContent('<b>Owner</b>');
      expect(screen.getByTestId(id).querySelector('b')).toBeNull();
    }
  });
  it('renders a preserved legacy item without inventing native socket capacity', () => {
    const { socketCapacity: _capacity, ...legacy } = item(0);
    render(<I18nextProvider i18n={i18n}><ItemTooltip item={legacy} legacyInspection /></I18nextProvider>);
    expect(screen.getByText(i18n.t('inventory:quarantine.socketCapacityUnknown'))).toBeInTheDocument();
    expect(screen.getByTestId('item-tooltip')).not.toHaveTextContent(i18n.t('items:tooltip.sockets', { value: 2 }));
  });
});

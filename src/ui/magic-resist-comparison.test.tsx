import { afterEach, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ItemComparePanel } from '@/features/inventory/ItemComparePanel';
import { compareEquip } from '@/features/inventory/compareEquip';
import { deriveStats } from '@/engine/progression/stats';
import { EquippedItemModal } from './EquippedItemModal';
import type { Item } from '@/engine/types/items';

const plain: Item = { id: 'plain-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 2,
  baseRolls: { defense: 7 }, affixes: [] };
const diamond: Item = { ...plain, id: 'diamond-cap',
  socketContents: [{ kind: 'gem', id: 'gems/diamond/chipped' }] };
const coreStats = { strength: 20, dexterity: 25, vitality: 20, energy: 30 };
const derivedStats = deriveStats(coreStats, 6, { flatMagicResist: 2 });
const owner = { level: 6, coreStats, derivedStats };

afterEach(async () => { await i18n.changeLanguage('en'); });

it.each(['en', 'zh-CN'] as const)('shows a localized flat-MR gain and +2 net summary in %s', async locale => {
  await i18n.changeLanguage(locale);
  const comparison = compareEquip(owner, diamond, 'head', { head: plain });
  render(<I18nextProvider i18n={i18n}>
    <ItemComparePanel compare={comparison} selectedName="Diamond cap" equippedAfter={[diamond]} />
  </I18nextProvider>);
  const label = locale === 'en' ? 'Magic Resist' : '魔法防御';
  const row = screen.getByRole('rowheader', { name: label }).closest('tr');
  if (!row) throw new Error('Missing Magic Resist row');
  const cells = within(row).getAllByRole('cell');
  const candidateCell = cells[1];
  if (!candidateCell) throw new Error('Missing candidate Magic Resist cell');
  expect(cells[0]).toHaveTextContent(/^0$/);
  expect(candidateCell).toHaveTextContent('2');
  expect(within(candidateCell).getByTestId('stat-delta')).toHaveAttribute('data-trend', 'up');
  expect(within(candidateCell).getByTestId('stat-delta')).toHaveTextContent('(+2)');
  expect(candidateCell).not.toHaveTextContent('%');
  expect(screen.getByTestId('net-summary')).toHaveAttribute('data-trend', 'up');
  expect(screen.getByTestId('net-summary')).toHaveTextContent('2');
});

it.each(['en', 'zh-CN'] as const)('shows canonical MR in equipped-item inspection in %s', async locale => {
  await i18n.changeLanguage(locale);
  render(<I18nextProvider i18n={i18n}>
    <EquippedItemModal slot="head" item={diamond} onClose={() => undefined} />
  </I18nextProvider>);
  const socketStats = screen.getByTestId('item-tooltip-socket-stats');
  expect(socketStats).toHaveTextContent(locale === 'en' ? 'Magic Resist' : '魔法抗性');
  expect(socketStats).toHaveTextContent('2');
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});

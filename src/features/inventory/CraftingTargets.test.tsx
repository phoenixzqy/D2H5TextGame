import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { useState } from 'react';
import i18n from '@/i18n';
import type { HistoricalItem } from '@/engine/save/historical-items';
import { CraftingTargets, type CraftingTarget } from './CraftingTargets';

const entries: readonly CraftingTarget[] = Array.from({ length: 301 }, (_, index) => ({
  item: { id: `gear-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
    identified: true, equipped: false, ...(index === 300 ? { generatedName: { prefix: 'Final', suffix: 'Witness' } } : {}) },
  origin: index === 300 ? 'Stash' : 'Backpack'
}));

function Targets({ values = entries, multiple = true }: {
  readonly values?: readonly CraftingTarget[];
  readonly multiple?: boolean;
}) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  return <I18nextProvider i18n={i18n}><CraftingTargets entries={values} selected={selected}
    multiple={multiple} onChange={setSelected} /></I18nextProvider>;
}

describe.each(['en', 'zh-CN'] as const)('crafting equipment search %s', locale => {
  const en = locale === 'en';
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  afterEach(() => { vi.restoreAllMocks(); });
  const search = (value: string) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
  const labels = () => screen.getAllByRole('checkbox').map(input => input.closest('label')?.textContent);

  it('localizes only the visible page when opening or clearing a whitespace search', () => {
    const translate = vi.spyOn(i18n, 't');
    render(<Targets />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    expect(translate.mock.calls.filter(([key]) => key === 'items:base.helm-cap')).toHaveLength(12);
    search('#gear-300');
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    translate.mockClear();
    search(' \t ');
    expect(labels()).toEqual(entries.slice(0, 12).map(({ item, origin }) => `${en ? 'Cap' : '帽子'} · #${item.id} ${origin}`));
    expect(translate.mock.calls.filter(([key]) => key === 'items:base.helm-cap')).toHaveLength(12);
  });

  it('opens lazy native inspection independently of selection and clears it when the row leaves the page', async () => {
    const blade: CraftingTarget = { origin: 'Backpack', item: {
      id: 'blade', baseId: 'items/base/wp1h-short-sword', rarity: 'runeword', level: 1,
      identified: true, equipped: false, socketCapacity: 2, runewordId: 'runewords/steel',
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }]
    } };
    render(<Targets values={[blade, ...entries]} />);
    expect(screen.queryByTestId('item-tooltip')).not.toBeInTheDocument();
    const row = screen.getByRole('checkbox', { name: /#blade/ }).closest('li');
    if (!row) throw new Error('Missing target row');
    const open = within(row).getByRole('button', { name: `${en ? 'Details' : '详情'} #blade` });
    fireEvent.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(within(row).getByRole('checkbox')).not.toBeChecked();
    expect(within(row).getByTestId('item-tooltip-damage')).toBeInTheDocument();
    expect(within(row).getByTestId('item-tooltip-socket-stats')).toBeInTheDocument();
    const order = within(row).getByRole('list', { name: en ? 'Socket order' : '镶嵌顺序' });
    expect(within(order).getAllByRole('listitem').map(item => item.textContent)).toEqual(en ? ['Tir', 'El'] : ['泰尔符文', '艾尔符文']);
    fireEvent.click(within(row).getByRole('checkbox'));
    fireEvent.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('item-tooltip')).not.toBeInTheDocument();
    expect(within(row).getByRole('checkbox')).toBeChecked();
    fireEvent.click(open);
    await act(async () => { await i18n.changeLanguage(en ? 'zh-CN' : 'en'); });
    expect(within(row).getByRole('button', { name: `${en ? '详情' : 'Details'} #blade` })).toHaveAttribute('aria-expanded', 'true');
    expect(within(row).getByRole('list', { name: en ? '镶嵌顺序' : 'Socket order' })).toBeInTheDocument();
    search('#gear-300');
    expect(screen.queryByTestId('item-tooltip')).not.toBeInTheDocument();
    search('');
    expect(screen.getByRole('checkbox', { name: /#blade/ })).toBeChecked();
    expect(screen.queryByTestId('item-tooltip')).not.toBeInTheDocument();
  });

  it('shows preserved inspection with ordered inactive runes and removes stale details with the source', () => {
    const preservedItem: HistoricalItem = {
      id: 'old', baseId: 'items/base/armor-quilted', rarity: 'runeword', level: 1,
      identified: true, equipped: false, socketCapacity: 2, runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol']
    };
    const old: CraftingTarget = { origin: 'Stash', preservedRunes: ['runes/ort', 'runes/sol'], item: preservedItem };
    const view = render(<Targets values={[old]} />);
    fireEvent.click(screen.getByRole('button', { name: `${en ? 'Details' : '详情'} #old` }));
    const order = screen.getByRole('list', { name: en ? 'Preserved rune order' : '保留的符文顺序' });
    expect(within(order).getAllByRole('listitem').map(item => item.textContent)).toEqual(en ? ['Ort', 'Sol'] : ['欧特符文', '索尔符文']);
    expect(screen.getByText(en ? 'Preserved word (inactive): Lore' : '保留的符文之语（未生效）：知识')).toBeInTheDocument();
    expect(screen.getByText(en ? 'Socket capacity: 2' : '镶嵌孔数：2')).toBeInTheDocument();
    expect(screen.queryByTestId('item-tooltip-socket-stats')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    view.rerender(<Targets values={[]} />);
    expect(screen.queryByTestId('item-tooltip')).not.toBeInTheDocument();
  });

  it('keeps exact selections across ordered pages, nonblank search and clearing', () => {
    render(<Targets />);
    fireEvent.click(screen.getByLabelText(/#gear-0\b/));
    fireEvent.click(screen.getByRole('button', { name: en ? 'Next' : '下一页' }));
    expect(labels()[0]).toContain('#gear-12');
    search('#GEAR-300');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    search('');
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    expect(labels()[0]).toContain('#gear-0');
    search('#gear-300');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('2');
  });

  it('searches localized names, generated names and origins beyond the first page', () => {
    render(<Targets />);
    search('final');
    expect(labels()).toEqual([`Final ${en ? 'Cap' : '帽子'} Witness · #gear-300 Stash`]);
    search(en ? 'cap' : '帽子');
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    search('sTaSh');
    expect(labels()[0]).toContain('#gear-300');
    search('no such equipment');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(en ? 'No matching items.' : '没有匹配的物品。')).toBeInTheDocument();
  });

  it('refreshes current source order and clamps the visible page after removal', () => {
    const view = render(<Targets />);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Next' : '下一页' }));
    view.rerender(<Targets values={entries.slice(299)} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(labels()[0]).toContain('#gear-299');
    expect(labels()[1]).toContain('#gear-300');
    expect(screen.queryByRole('button', { name: en ? 'Next' : '下一页' })).not.toBeInTheDocument();
  });

  it('keeps single selection and updates localized matches when the language changes', async () => {
    render(<Targets multiple={false} />);
    fireEvent.click(screen.getByLabelText(/#gear-0\b/));
    search('#gear-300');
    fireEvent.click(screen.getByRole('checkbox'));
    search('');
    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
    await act(async () => { await i18n.changeLanguage(en ? 'zh-CN' : 'en'); });
    search(en ? '帽子' : 'cap');
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    search('#gear-300');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});

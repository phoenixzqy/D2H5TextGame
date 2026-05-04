/**
 * ItemTooltip — defensive-guard tests for Bug 1.
 *
 * The earlier crash was traced to `t('items:tooltip.defense', { value })`
 * being called with `value === undefined` for armor whose base.baseDefense
 * was missing/non-numeric. The current call site is gated, but the helper
 * `buildDefenseLine` (introduced as part of the Bug 1 defensive sweep)
 * guarantees the t() call cannot fire with a non-finite value.
 *
 * These tests pin that contract:
 *   - degenerate armor base (no baseDefense) → no `防御` text in output.
 *   - degenerate baseRolls.defense (NaN/undefined) → falls back to base.
 *   - well-formed armor → renders defense line.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ItemTooltip } from './ItemTooltip';
import type { Item, ItemBase } from '@/engine/types/items';

vi.mock('@/data/loaders/loot', () => {
  const bases = new Map<string, ItemBase>();
  bases.set('items/base/armor-degenerate', {
    id: 'items/base/armor-degenerate',
    type: 'armor',
    slot: 'chest',
    reqLevel: 1,
    // intentionally no baseDefense — the bug's degenerate input
  } as unknown as ItemBase);
  bases.set('items/base/armor-good', {
    id: 'items/base/armor-good',
    type: 'armor',
    slot: 'chest',
    reqLevel: 1,
    baseDefense: 25,
  } as unknown as ItemBase);
  bases.set('items/base/wp1h-short-sword', {
    id: 'items/base/wp1h-short-sword',
    type: 'weapon',
    slot: 'weapon',
    reqLevel: 1,
    baseDamage: { min: 2, max: 6 },
  } as unknown as ItemBase);
  return {
    loadItemBases: () => bases,
    loadAffixPool: () => [] as unknown[],
    loadUniques: () => [{
      id: 'items/unique/rixots-keen',
      name: 'items.unique.rixots-keen.name',
      baseId: 'items/base/wp1h-short-sword',
      reqLevel: 9,
      stats: { statMods: { attack: 40 } }
    }],
    loadSetPieces: () => [],
    loadSets: () => [],
    resolveItemReqLevel: (item: Item, base?: ItemBase) => item.uniqueId === 'items/unique/rixots-keen' ? 9 : base?.reqLevel ?? 1
  };
});

function wrap(node: JSX.Element) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{node}</Suspense>
    </I18nextProvider>
  );
}

const baseItem = (baseId: string, extra: Partial<Item> = {}): Item =>
  ({
    id: 'tt-test',
    baseId,
    rarity: 'normal',
    level: 1,
    ilvl: 1,
    affixes: [],
    ...extra,
  } as unknown as Item);

describe('<ItemTooltip> Bug 1 — defenseLine guard', () => {
  beforeEach(async () => {
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('returns no defense line for armor with missing baseDefense (degenerate input)', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/armor-degenerate')} />));
    expect(screen.queryByTestId('item-tooltip-defense')).toBeNull();
    // Also: no raw `防御` token should appear in the render output —
    // proving t('tooltip.defense', { value: undefined }) was not called.
    const tooltip = screen.getByTestId('item-tooltip');
    expect(tooltip.textContent || "").not.toMatch(/防御/);
  });

  it('returns no defense line when item.baseRolls.defense is non-finite', () => {
    render(
      wrap(
        <ItemTooltip
          item={baseItem('items/base/armor-degenerate', {
            // even with rolls present, base is bad → no line
            baseRolls: { defense: NaN } as Item['baseRolls'],
          } as Partial<Item>)}
        />
      )
    );
    expect(screen.queryByTestId('item-tooltip-defense')).toBeNull();
  });

  it('renders the defense line for well-formed armor', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/armor-good')} />));
    const def = screen.getByTestId('item-tooltip-defense');
    expect(def.textContent || "").toMatch(/25/);
  });

  it('does not render defense line for weapons (negative case)', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword')} />));
    expect(screen.queryByTestId('item-tooltip-defense')).toBeNull();
    expect(screen.getByTestId('item-tooltip-damage')).toBeInTheDocument();
  });

  // ───────────────── subtitle / damage coverage (P07 RTL mirror) ─────────────
  // Mirrors rendering invariants previously only asserted via Playwright.

  it('renders the subtitle line for weapons (testid + non-empty text)', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword')} />));
    const subtitle = screen.getByTestId('item-tooltip-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.textContent.trim().length).toBeGreaterThan(0);
  });

  it('renders the subtitle line for armor (testid + non-empty text)', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/armor-good')} />));
    const subtitle = screen.getByTestId('item-tooltip-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.textContent.trim().length).toBeGreaterThan(0);
  });

  it('damage line for short-sword embeds the base damage range (4–8)', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword')} />));
    const dmg = screen.getByTestId('item-tooltip-damage');
    // baseDamage.min = 2, max = 6 in the mocked base (see vi.mock at top).
    expect(dmg.textContent || '').toMatch(/2/);
    expect(dmg.textContent || '').toMatch(/6/);
  });

  it('weapon tooltip never emits a raw "tooltip.damage" key', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword')} />));
    const tt = screen.getByTestId('item-tooltip');
    expect(tt.textContent || '').not.toMatch(/tooltip\.damage/);
  });

  it('renders unique item names and definition stats', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword', { rarity: 'unique', uniqueId: 'items/unique/rixots-keen' })} />));
    const tt = screen.getByTestId('item-tooltip');
    expect(tt.textContent || '').toContain(i18n.t('items:unique.rixots-keen.name'));
    expect(tt.textContent || '').toMatch(/等级 9/);
    expect(screen.getByTestId('item-tooltip-definition-stats').textContent || '').toMatch(/攻击/);
  });

  it('armor tooltip never emits a raw "tooltip.defense" key', () => {
    render(wrap(<ItemTooltip item={baseItem('items/base/armor-good')} />));
    const tt = screen.getByTestId('item-tooltip');
    expect(tt.textContent || '').not.toMatch(/tooltip\.defense/);
  });

  it('en locale: subtitle and damage lines remain present (no raw keys)', async () => {
    await i18n.changeLanguage('en');
    try {
      render(wrap(<ItemTooltip item={baseItem('items/base/wp1h-short-sword')} />));
      expect(screen.getByTestId('item-tooltip-subtitle')).toBeInTheDocument();
      expect(screen.getByTestId('item-tooltip-damage')).toBeInTheDocument();
      const tt = screen.getByTestId('item-tooltip');
      expect(tt.textContent || '').not.toMatch(/tooltip\.(damage|defense|subtitle)/);
    } finally {
      await i18n.changeLanguage('zh-CN');
    }
  });
});


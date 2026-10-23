import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { ItemTooltip } from './ItemTooltip';
import { ItemDetailPanel } from '@/features/inventory/ItemDetailPanel';
import { compareEquip } from '@/features/inventory/compareEquip';
import { deriveStats } from '@/engine/progression/stats';
import type { Item } from '@/engine/types/items';

const coreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20 };
const item: Item = { id: 'visible-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
  level: 60, identified: true, equipped: false, socketCapacity: 4, baseRolls: { defense: 64 },
  runewordId: 'runewords/exile',
  socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };

describe.each(['en', 'zh-CN'] as const)('Exile visible effect %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  it.each(['tooltip', 'detail'] as const)('shows the actual self-only grant in %s', surface => {
    if (surface === 'tooltip') render(<ItemTooltip item={item} />);
    else render(<ItemDetailPanel item={item} playerLevel={60} playerCoreStats={coreStats}
      onDiscard={() => undefined} onClose={() => undefined} />);
    expect(screen.getByText(locale === 'en' ? 'While equipped: +20% Defense (self only)' : '装备时：自身防御 +20%')).toBeVisible();
  });
  it('compares candidate total defense using the same post-flat multiplier', () => {
    const player = { level: 60, coreStats, derivedStats: deriveStats(coreStats, 60) };
    const comparison = compareEquip(player, item, 'offhand', {});
    expect(comparison.stats.defense.current).toBe(197);
    expect(comparison.stats.defense.candidate).toBeCloseTo(577.2, 12);
    expect(comparison.stats.defense.delta).toBeCloseTo(380.2, 12);
  });
});

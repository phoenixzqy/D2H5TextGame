import { describe, expect, it, vi } from 'vitest';
// Synthetic sources exercise every named duplicate through legal helm/shield
// placement. They do not represent real word combinations or earned balance.
vi.mock('@/data/items/runewords.json', async importOriginal => {
  const actual = await importOriginal<{ default: readonly Record<string, unknown>[] }>();
  const grants = actual.default.flatMap(word => word.grants as readonly Record<string, unknown>[] | undefined ?? []);
  return { default: actual.default.map(word => word.id === 'runewords/dream'
    ? { ...word, grants: grants.map(grant => ({ ...grant, rank: 1 })) }
    : word.id === 'runewords/exile' ? { ...word, grants } : word) };
});
import { resolveEquippedRunewordGrants } from '@/engine/items/runeword-grants';
import { aggregateEquipmentMods } from '@/engine/progression/equipment-mods';
import type { Item } from '@/engine/types/items';

const shield: Item = { id: 'high', baseId: 'items/base/sh-monarch', rarity: 'runeword',
  level: 70, runewordId: 'runewords/exile', socketCapacity: 4, identified: true, equipped: false,
  socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
const helm: Item = { id: 'low', baseId: 'items/base/helm-war-hat', rarity: 'runeword',
  level: 70, runewordId: 'runewords/dream', socketCapacity: 3, identified: true, equipped: false,
  socketContents: ['io', 'jah', 'pul'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };

describe('all ten named adaptation ownership controls', () => {
  it.each(['skill-fire-bolt', 'aura-conviction', 'skill-lycanthropy', 'aura-thorns-aura',
    'skill-fade', 'aura-redemption', 'aura-holy-shock', 'skill-blaze', 'aura-defiance',
    'skill-chain-lightning'])('deduplicates %s by rank and removes absent sources', id => {
    const high = resolveEquippedRunewordGrants({ offhand: shield }).find(grant => grant.id === id);
    expect(high).toBeDefined();
    if (!high) throw new Error(`Missing high grant ${id}`);
    expect(resolveEquippedRunewordGrants({ head: helm, offhand: shield }).filter(grant => grant.id === id)).toEqual([high]);
    expect(resolveEquippedRunewordGrants({ offhand: shield, head: helm }).filter(grant => grant.id === id)).toEqual([high]);
    expect(resolveEquippedRunewordGrants({ head: helm }).find(grant => grant.id === id)?.rank).toBe(1);
    expect(resolveEquippedRunewordGrants({ backpack: shield, stash: helm, head: shield })).toEqual([]);
    expect(resolveEquippedRunewordGrants({})).toEqual([]);
  });
  it('never sums the duplicated stat grants and freezes nested damage tuning', () => {
    expect(aggregateEquipmentMods({ head: helm, offhand: shield })).toMatchObject({
      defensePct: .2, lifePct: .15, attackSpeedPct: .05, magicDodge: .025
    });
    const grant = resolveEquippedRunewordGrants({ offhand: shield })
      .find(row => row.id === 'aura-conviction');
    expect(grant && 'increasedDamagePct' in grant && Object.isFrozen(grant.increasedDamagePct)).toBe(true);
  });
});

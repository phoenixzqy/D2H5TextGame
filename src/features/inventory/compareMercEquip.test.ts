import { describe, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadItemBases } from '@/data/loaders/loot';
import { createMercFromDef } from '@/stores/mercFactory';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { projectMercenaryStars } from '@/engine/progression/merc-stars';
import type { Item } from '@/engine/types/items';
import { clearEquipTrend, prepareCompareMercEquip } from './compareEquip';

const sword: Item = { id: 'sword', baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
  level: 1, identified: true, equipped: false, baseRolls: { attack: 25 } };

function mercenary() {
  const def = loadMercPool().pool[0];
  if (!def) throw new Error('Missing mercenary');
  return createMercFromDef(def);
}

describe('mercenary equipment comparison', () => {
  it('preserves authored mercenary stats and matches canonical gear projection for both sides', () => {
    const merc = projectMercenaryStars(mercenary(), 3);
    const equipment = { weapon: sword };
    const candidate = { ...sword, id: 'new-sword', baseRolls: { attack: 51 } };
    const before = structuredClone(merc);
    const result = prepareCompareMercEquip(merc, equipment)(candidate, 'weapon');
    const current = deriveEquippedMercStats(merc, equipment);
    const next = deriveEquippedMercStats(merc, { weapon: candidate });
    for (const [key, delta] of Object.entries(result.stats)) {
      expect(delta).toEqual({ current: current[key as keyof typeof result.stats],
        candidate: next[key as keyof typeof result.stats],
        delta: next[key as keyof typeof result.stats] - current[key as keyof typeof result.stats] });
    }
    expect(result.current).toBe(sword);
    expect(merc).toEqual(before);
  });

  it('only labels a clear improvement or decline, including fractional changes', () => {
    const result = prepareCompareMercEquip(mercenary(), {})(sword, 'weapon');
    const neutral = { ...result, stats: Object.fromEntries(Object.entries(result.stats).map(([key, stat]) =>
      [key, { ...stat, delta: 0 }])) as typeof result.stats };
    const withAttack = (delta: number) => ({ ...neutral, stats: { ...neutral.stats,
      attack: { ...neutral.stats.attack, delta } } });
    expect(clearEquipTrend(withAttack(0.1))).toBe('up');
    expect(clearEquipTrend(withAttack(-0.1))).toBe('down');
    expect(clearEquipTrend({ ...withAttack(1), stats: { ...withAttack(1).stats,
      defense: { ...neutral.stats.defense, delta: -1 } } })).toBeNull();
    expect(clearEquipTrend(neutral)).toBeNull();
  });

  it('keeps offhand when replacing a mercenary weapon with a two-handed weapon', () => {
    const merc = mercenary();
    const base = [...loadItemBases().values()].find(entry => entry.handedness === 'twoHanded');
    if (!base) throw new Error('Missing two-handed base');
    const offhand = { ...sword, id: 'offhand', baseRolls: { attack: 10 } };
    const candidate = { ...sword, id: 'two-handed', baseId: base.id, baseRolls: { attack: 40 } };
    const result = prepareCompareMercEquip(merc, { weapon: sword, offhand })(candidate, 'weapon');
    expect(result.stats.attack.candidate).toBe(deriveEquippedMercStats(merc, { weapon: candidate, offhand }).attack);
    expect(result.stats.attack.delta).toBe(15);
  });
});

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compareEquip, prepareCompareEquip } from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import * as questLife from '@/engine/progression/quest-life';
import * as questResistance from '@/engine/progression/quest-resistance';
import type { SaveV17 } from '@/engine/types/save';

const earned = JSON.parse(gunzipSync(readFileSync(
  'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-catacombs24-native-export.json.gz'
)).toString('utf8')) as SaveV17;

afterEach(() => { vi.restoreAllMocks(); });

describe('prepared inventory comparisons', () => {
  it('keeps exact canonical deltas for sampled earned-character gear candidates', () => {
    const { player, inventory, map } = earned;
    const bases = loadItemBases();
    const compare = prepareCompareEquip(player, inventory.equipped, bases,
      map.questProgress, inventory.questItems, map.questReceipts);
    // Existing real-equip parity tests independently cover displacement and rings.
    for (const base of [...bases.values()].filter(base => base.slot).slice(0, 50)) {
      const item = { id: `candidate-${base.id}`, baseId: base.id, rarity: 'normal' as const,
        level: 1, identified: true, equipped: false };
      if (!base.slot) throw new Error('Expected gear slot');
      expect(compare(item, base.slot)).toEqual(compareEquip(player, item, base.slot,
        inventory.equipped, bases, map.questProgress, inventory.questItems, map.questReceipts));
    }
  });

  it('resolves quest entitlements once for a whole backpack comparison batch', () => {
    const life = vi.spyOn(questLife, 'resolveQuestLifeBonus');
    const sun = vi.spyOn(questResistance, 'resolveQuestResistanceBonus');
    const act5 = vi.spyOn(questResistance, 'resolveAct5ResistanceBonus');
    const { player, inventory, map } = earned;
    const bases = loadItemBases();
    const compare = prepareCompareEquip(player, inventory.equipped, bases,
      map.questProgress, inventory.questItems, map.questReceipts);
    for (const item of inventory.backpack.slice(0, 100)) {
      const slot = bases.get(item.baseId)?.slot;
      if (slot) compare(item, slot);
    }
    expect(life).toHaveBeenCalledTimes(1);
    expect(sun).toHaveBeenCalledTimes(1);
    expect(act5).toHaveBeenCalledTimes(1);
  });

  it('prepares new quest and player state without reusing an old entitlement snapshot', () => {
    const { player, inventory, map } = earned;
    const bases = loadItemBases();
    const item = inventory.backpack[0];
    if (!item) throw new Error('Missing earned item');
    const slot = bases.get(item.baseId)?.slot;
    if (!slot) throw new Error('Missing earned slot');
    const prior = prepareCompareEquip(player, inventory.equipped, bases,
      map.questProgress, inventory.questItems, map.questReceipts);
    const changed = { ...player, level: player.level + 1,
      coreStats: { ...player.coreStats, vitality: player.coreStats.vitality + 5 } };
    const next = prepareCompareEquip(changed, inventory.equipped, bases);
    expect(next(item, slot)).toEqual(compareEquip(changed, item, slot, inventory.equipped, bases));
    expect(next(item, slot).stats.lifeMax.current).not.toBe(prior(item, slot).stats.lifeMax.current);
  });
});

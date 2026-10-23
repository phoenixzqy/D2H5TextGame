import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadGameData } from '../loader';
import { loadAwardPools, loadItemBases, loadTreasureClasses, resolveItemReqLevel } from '../loaders/loot';
import basesJson from '../items/bases.json';
import treasureClassesJson from '../loot/treasure-classes.json';
import enItems from '../../i18n/locales/en/items.json';
import zhItems from '../../i18n/locales/zh-CN/items.json';
import { rollKillRewards, type KillRewardInput } from '../../engine/loot/award';
import { computeStats } from '../../engine/items/computeStats';
import { isTwoHanded } from '../../engine/inventory/equipValidator';
import { createRng } from '../../engine/rng';
import { resolveItemIcon } from '../../ui/cardAssets';

const trainingId = 'items/base/weapon-bow-training';
const tcId = 'loot/trash-act1';

function kill(monsterLevel: number): KillRewardInput {
  return { treasureClassId: tcId, tier: 'trash', monsterLevel, magicFind: 0, goldFind: 0, act: 1 };
}

function acquire(monsterLevel: number, seed = 167) {
  return rollKillRewards(kill(monsterLevel), loadAwardPools(), createRng(seed));
}

function withoutItemIds(rewards: ReturnType<typeof acquire>) {
  return { ...rewards, items: rewards.items.map(({ id: _id, ...item }) => item) };
}

describe('P08a05a actual legal Amazon training-bow content and loot', () => {
  it('loads the legal level-one bow through the central strict-schema content boundary', async () => {
    const data = await loadGameData();
    const base = data.itemBases.get(trainingId);
    expect(base).toEqual({ id: trainingId, name: 'items.base.weapon-bow-training',
      type: 'weapon', slot: 'weapon', weaponType: 'bow', handedness: 'twoHanded',
      reqLevel: 1, sockets: 0, maxSockets: 0, canHaveAffixes: true,
      baseDamage: { min: 8, max: 18, breakdown: { physical: 18 } } });
    expect(loadItemBases().get(trainingId)).toEqual(base);
    expect(isTwoHanded(base)).toBe(true);
    expect(resolveItemReqLevel({ baseId: trainingId })).toBe(1);
    expect(basesJson.filter(row => row.id === trainingId)).toHaveLength(1);
  });

  it('preserves existing higher-level bow and crossbow upgrades', () => {
    const bases = loadItemBases();
    expect(bases.get('items/base/weapon-bow')).toMatchObject({ reqLevel: 10,
      weaponType: 'bow', handedness: 'twoHanded', baseDamage: { min: 10, max: 24, breakdown: { physical: 24 } } });
    expect(bases.get('items/base/weapon-crossbow')).toMatchObject({ reqLevel: 15,
      weaponType: 'crossbow', handedness: 'twoHanded', baseDamage: { min: 16, max: 34, breakdown: { physical: 34 } } });
  });

  it('loads exactly one appended normal-weight pick with inclusive monster-level window one to ten', () => {
    const picks = loadTreasureClasses().get(tcId)?.picks;
    expect(picks?.filter(pick => pick.baseId === trainingId)).toEqual([
      { type: 'item', baseId: trainingId, rarity: 'normal', weight: 100, qlvlMin: 1, qlvlMax: 10 }
    ]);
    expect(treasureClassesJson.find(tc => tc.id === tcId)?.entries.at(-1)).toEqual({
      type: 'item', itemBase: trainingId, rarity: 'normal', weight: 100, minLevel: 1, maxLevel: 10
    });
  });

  it.each([1, 10])('actually awards the normal bow from ordinary trash at monster level %s with seed167', monsterLevel => {
    // Actual TC/noDrop/PRNG: .9365939784 passes trash noDrop, .9879116535 selects the appended bow.
    // Item ID consumes draw3; draw4 .6778261340 rolls 15 in the authored 8–18 range.
    const rewards = acquire(monsterLevel);
    expect(rewards.items).toHaveLength(1);
    expect(rewards.items[0]).toMatchObject({ baseId: trainingId, rarity: 'normal', level: monsterLevel,
      ilvl: monsterLevel, baseRolls: { attack: 15 }, affixes: [], identified: true, equipped: false });
    const item = rewards.items[0];
    if (!item) throw new Error('Expected actual seeded item');
    expect(item).not.toHaveProperty('equipSlot');
    expect(item).not.toHaveProperty('uniqueId');
    expect(item).not.toHaveProperty('setPieceId');
    expect(item).not.toHaveProperty('runewordId');
    expect(computeStats(item, loadItemBases().get(item.baseId),
      new Map(loadAwardPools().affixes.map(affix => [affix.id, affix]))).attack).toBe(15);
  });

  it('excludes the bow at monster level eleven while retaining a real existing drop', () => {
    const rewards = acquire(11);
    expect(rewards.items.map(item => item.baseId)).toEqual(['items/base/amu-brass']);
  });

  it('keeps the ordinary trash noDrop result for seed6 without asserting absent currencies', () => {
    // First draw .5257466112 is below the existing trash noDrop chance .6.
    expect(acquire(1, 6).items).toEqual([]);
  });

  it('provides the authored name in both item locales', () => {
    const key = 'weapon-bow-training';
    expect(Reflect.get(enItems.base, key)).toBe('Training Bow');
    expect(Reflect.get(zhItems.base, key)).toBe('训练弓');
  });

  it('resolves the authored bow through the existing bow asset file', () => {
    expect(loadItemBases().get(trainingId)?.weaponType).toBe('bow');
    const icon = resolveItemIcon(trainingId);
    expect(icon).toBe(resolveItemIcon('items/base/weapon-bow'));
    expect(icon).toMatch(/^\/assets\//);
    if (!icon) throw new Error('Expected real bow asset');
    expect(existsSync(path.join(process.cwd(), 'public', icon.slice(1)))).toBe(true);
  });

  it('repeats real seeded rewards across A/B/A without mutating authored content, pools or input', () => {
    const pools = loadAwardPools();
    const input = kill(1);
    const before = structuredClone({ pools, input, basesJson, treasureClassesJson });
    const a = rollKillRewards(input, pools, createRng(167));
    expect(a.items.map(item => item.baseId)).toEqual([trainingId]);
    rollKillRewards(kill(10), pools, createRng(6));
    const a2 = rollKillRewards(input, pools, createRng(167));
    expect(withoutItemIds(a2)).toEqual(withoutItemIds(a));
    expect(a2.items[0]?.id).not.toBe(a.items[0]?.id);
    expect({ pools, input, basesJson, treasureClassesJson }).toEqual(before);
  });
});

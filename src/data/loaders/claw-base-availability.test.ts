import { expect, it } from 'vitest';
import { loadItemBases, loadTreasureClasses } from './loot';
import { createRng } from '@/engine/rng';
import { rollDrops } from '@/engine/loot/drop-roller';
import { rollQuestTableRewards } from '@/engine/loot/award';
import { loadAwardPools } from './loot';
import { rollItem } from '@/engine/loot/rollItem';
import en from '@/i18n/locales/en/items.json';
import zh from '@/i18n/locales/zh-CN/items.json';

it.each([
  ['katar', 'short-sword'], ['wrist-blade', 'scimitar'], ['greater-claws', 'long-sword'],
  ['hand-scythe', 'war-sword'], ['feral-claws', 'phase-blade'], ['runic-talons', 'legend-sword'],
])('acquires localized %s claws at the matching %s tier through actual drop and materialization', (claw, sword) => {
  const bases = loadItemBases(), id = 'items/base/wp1h-' + claw, base = bases.get(id);
  const peer = bases.get('items/base/wp1h-' + sword);
  if (!base || !peer) throw new Error('Missing progression base');
  expect(base).toMatchObject({ type: 'weapon', slot: 'weapon', weaponType: 'claw', handedness: 'oneHanded',
    baseDamage: peer.baseDamage, reqLevel: peer.reqLevel, maxSockets: peer.maxSockets });
  expect(en.base).toHaveProperty('wp1h-' + claw); expect(zh.base).toHaveProperty('wp1h-' + claw);
  const tables = [...loadTreasureClasses().values()].filter(tc => tc.picks.some(pick => pick.baseId === id));
  expect(tables.length).toBeGreaterThan(0);
  for (const tc of tables) {
    const clawPick = tc.picks.find(pick => pick.baseId === id);
    if (!clawPick) throw new Error('Missing acquisition entry');
    const sourceBase = claw === 'hand-scythe' ? 'items/base/wp1h-long-sword'
      : claw === 'runic-talons' ? 'items/base/wp1h-phase-blade' : peer.id;
    expect(tc.picks).toContainEqual(expect.objectContaining({ type: clawPick.type, baseId: sourceBase,
      rarity: clawPick.rarity, qlvlMin: clawPick.qlvlMin, qlvlMax: clawPick.qlvlMax }));
    expect(clawPick.weight).toBeGreaterThan(0);

  }
  const tc = tables.find(tc => tc.picks.some(pick => pick.baseId === id && pick.qlvlMax >= base.reqLevel)); if (!tc) throw new Error('Missing ordinary acquisition table');
  const pick = tc.picks.find(pick => pick.baseId === id); if (!pick) throw new Error('Missing pick');
  const level = Math.max(pick.qlvlMin, base.reqLevel);
  let acquired = 0;
  for (let seed = 1; seed <= 1024; seed++) {
    const rng = createRng(seed);
    for (const drop of rollDrops({ tc, tier: 'trash', monsterLevel: level, magicFind: 0 }, rng)) {
      if (drop.kind !== 'item' || drop.baseId !== id) continue;
      const item = rollItem(drop, { bases, affixes: [] }, rng);
      expect(item).toMatchObject({ baseId: id, level });
      expect(item?.socketCapacity).toBeLessThanOrEqual(base.maxSockets ?? 0);
      acquired++;
    }
  }
  expect(acquired).toBeGreaterThan(0);
});

it('keeps claws out of forced unique/set rows until matching templates are implemented', () => {
  const bases = loadItemBases();
  for (const tc of loadTreasureClasses().values()) {
    expect(tc.picks.filter(pick => pick.baseId && bases.get(pick.baseId)?.weaponType === 'claw' &&
      (pick.rarity === 'unique' || pick.rarity === 'set'))).toEqual([]);
  }
});
it('materializes every real Baal quest-cache selection across 64 seeds without rarity downgrade', () => {
  const pools = loadAwardPools(); let uniqueCount = 0;
  for (let seed = 1; seed <= 64; seed++) {
    const rewards = rollQuestTableRewards({ tableId: 'loot/baal-q', ilvl: 82, picks: 5 }, pools, createRng(seed));
    expect(rewards, 'Baal quest cache seed ' + String(seed)).toBeDefined();
    if (!rewards) throw new Error('Required cache failed strict materialization');
    uniqueCount += rewards.items.filter(item => item.rarity === 'unique').length;
  }
  expect(uniqueCount).toBeGreaterThan(0);
});

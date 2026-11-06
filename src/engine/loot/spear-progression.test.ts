/** Constructed content/reward contracts; no earned acquisition or campaign credit. */
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { existsSync } from 'node:fs';
import path from 'node:path';
import policy from '../../../tests/fixtures/spear-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import baseSchema from '@/data/schema/item-base.schema.json';
import dropSchema from '@/data/schema/drop-table.schema.json';
import rawTables from '@/data/loot/treasure-classes.json';
import { resolveItemIcon } from '@/ui/cardAssets';
import en from '@/i18n/locales/en/items.json';
import zh from '@/i18n/locales/zh-CN/items.json';
import { computeStats } from '../items/computeStats';
import { createRng } from '../rng';
import { rollKillRewards } from './award';
import { rollItem } from './rollItem';

const pools = loadAwardPools();
const newIds = new Set(policy.tiers.map(tier => tier.baseId));
const curve = [
  ['weapon-trident', 10, 10, 24, 2],
  ['weapon-military-fork', 24, 22, 48, 3],
  ['weapon-war-fork', 35, 32, 62, 4],
  ['weapon-mancatcher', 52, 50, 95, 5]
] as const;
function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing authored spear progression');
  return value;
}

describe('BUG661 ordinary spear weapon progression', () => {
  it('provides a two-handed spear upgrade at each established equipment tier', () => {
    expect([...pools.bases.values()].filter(base => base.weaponType === 'spear')
      .map(base => base.reqLevel).sort((a, b) => a - b)).toEqual([1, 10, 24, 35, 52]);
  });

  it.each(policy.tables)('$id offers one equip-eligible spear upgrade throughout its finite envelope', row => {
    const table = required(pools.treasureClasses.get(row.id));
    const added = table.picks.filter(pick => newIds.has(pick.baseId ?? ''));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const eligible = added.filter(pick => pick.weight > 0 && pick.qlvlMin <= level && pick.qlvlMax >= level);
      expect(eligible, `${row.id}/L${String(level)}`).toHaveLength(1);
      const pick = required(eligible[0]);
      const base = required(pools.bases.get(required(pick.baseId)));
      expect(base.reqLevel).toBeLessThanOrEqual(level);
      expect(base.weaponType).toBe('spear');
      expect(base.handedness).toBe('twoHanded');
      // BUG678 restores random ordinary rarity; fixed quest caches retain guarantees.
        expect(pick.rarity).toBe(row.id.endsWith('-q') ? row.rarity : undefined);
      expect(pick.weight).toBe(row.weightPerFamily);
    }
    for (const level of [row.minLevel - 1, row.maxLevel + 1, 123]) {
      expect(added.filter(pick => pick.qlvlMin <= level && pick.qlvlMax >= level)).toEqual([]);
    }
  });

  it.each(policy.tables)('$id materializes each declared spear tier through native seeded rewards', row => {
    const table = required(pools.treasureClasses.get(row.id));
    const questActs: Record<string, number> = { 'loot/duriel-q': 2, 'loot/mephisto-q': 3, 'loot/diablo-q': 4 };
    const act = Number(/act([1-5])/.exec(row.id)?.[1] ?? required(questActs[row.id])) as 1 | 2 | 3 | 4 | 5;
    for (const tier of policy.tiers) {
      const level = Math.max(row.minLevel, tier.from);
      if (level > Math.min(row.maxLevel, tier.to)) continue;
      const pick = required(table.picks.find(pick => pick.baseId === tier.baseId));
      // Availability is checked above; this isolated production pick tests item
      // materialization without claiming production acquisition probability.
      const rewards = rollKillRewards({ act, monsterLevel: level, tier: 'chapter-boss',
        treasureClassId: row.id, magicFind: 0, goldFind: 0 }, {
        ...pools, treasureClasses: new Map([[row.id, { ...table, picks: [pick] }]])
      }, createRng(3286157777));
      expect(rewards.items.length).toBeGreaterThan(0);
      const base = required(pools.bases.get(tier.baseId));
      for (const item of rewards.items) {
        expect(item).toMatchObject({ baseId: tier.baseId, ilvl: level });
        expect(row.id.endsWith('-q') ? [row.rarity] : ['normal', 'magic', 'rare', 'set', 'unique'])
          .toContain(item.rarity);
        expect(item.socketCapacity).toBeLessThanOrEqual(required(base.maxSockets));
        expect(item.baseRolls?.attack).toBeGreaterThanOrEqual(required(base.baseDamage).min);
        expect(item.baseRolls?.attack).toBeLessThanOrEqual(required(base.baseDamage).max);
      }
    }
  });

  it.each(curve)('%s follows the two-handed curve, projects native Attack and has bilingual art',
    (slug, level, min, max, sockets) => {
      const base = required(pools.bases.get(`items/base/${slug}`));
      const validate = new Ajv2020({ strict: true }).compile(baseSchema);
      expect(validate(base), JSON.stringify(validate.errors)).toBe(true);
      expect(base).toMatchObject({ reqLevel: level, sockets, maxSockets: sockets,
        metal: true, canHaveAffixes: true, weaponType: 'spear', handedness: 'twoHanded' });
      expect(base.baseDamage).toEqual({ min, max, breakdown: { physical: max } });
      for (const rarity of ['normal', 'magic', 'rare'] as const) {
        const item = required(rollItem({ baseId: base.id, rarity, ilvl: level }, pools, createRng(3286157777)));
        expect(item.socketCapacity).toBeLessThanOrEqual(sockets);
        expect(item.baseRolls?.attack).toBeGreaterThanOrEqual(min);
        expect(item.baseRolls?.attack).toBeLessThanOrEqual(max);
        const native = computeStats(item, base, new Map(pools.affixes.map(affix => [affix.id, affix])));
        expect(native.attack).toBeGreaterThanOrEqual(required(item.baseRolls?.attack));
        const affixCount = item.affixes?.length ?? 0;
        expect(affixCount).toBeGreaterThanOrEqual(rarity === 'normal' ? 0 : rarity === 'magic' ? 2 : 4);
        expect(affixCount).toBeLessThanOrEqual(rarity === 'normal' ? 0 : rarity === 'magic' ? 2 : 6);
      }
      expect((en.base as Record<string, string>)[slug]).toBeTruthy();
      expect((zh.base as Record<string, string>)[slug]).toBeTruthy();
      const icon = required(resolveItemIcon(base.id));
      expect(icon).toContain('staff');
      expect(existsSync(path.join(process.cwd(), 'public', icon))).toBe(true);
    });

  it('validates changed tables with the existing strict schema', () => {
    const validate = new Ajv2020({ strict: true }).compile(dropSchema);
    for (const row of policy.tables) {
      expect(validate(required(rawTables.find(table => table.id === row.id))), JSON.stringify(validate.errors)).toBe(true);
    }
  });
});

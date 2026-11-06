/** Current-source content/reward contracts; these calls grant no campaign credit. */
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { existsSync } from 'node:fs';
import path from 'node:path';
import policy from '../../../tests/fixtures/ranged-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import dropSchema from '@/data/schema/drop-table.schema.json';
import baseSchema from '@/data/schema/item-base.schema.json';
import rawTables from '@/data/loot/treasure-classes.json';
import { resolveItemIcon } from '@/ui/cardAssets';
import en from '@/i18n/locales/en/items.json';
import zh from '@/i18n/locales/zh-CN/items.json';
import { createRng } from '../rng';
import { rollKillRewards } from './award';

const pools = loadAwardPools();
const rangedIds = new Set(policy.tiers.flatMap(tier => [tier.bow, tier.crossbow]));
const newTiers = [
  ['weapon-composite-bow', 'weapon-heavy-crossbow', 24, 22, 48, 3],
  ['weapon-great-bow', 'weapon-siege-crossbow', 35, 32, 62, 4],
  ['weapon-ward-bow', 'weapon-demon-crossbow', 52, 50, 95, 5]
] as const;

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing authored ranged content');
  return value;
}

describe('BUG502 ordinary ranged weapon progression', () => {
  it.each(policy.tables)('$id offers equip-eligible ranged loot throughout its declared envelope', row => {
    const table = required(pools.treasureClasses.get(row.id));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const ranged = table.picks.filter(pick => rangedIds.has(pick.baseId ?? '') &&
        pick.weight > 0 && pick.qlvlMin <= level && pick.qlvlMax >= level);
      expect(ranged.length, `${row.id}/L${String(level)}`).toBe(level < 15 ? 1 : 2);
      for (const pick of ranged) {
        const base = required(pools.bases.get(required(pick.baseId)));
        expect(base.reqLevel).toBeLessThanOrEqual(level);
        expect(base.handedness).toBe('twoHanded');
        // BUG678 restores random ordinary rarity; fixed quest caches retain guarantees.
        expect(pick.rarity).toBe(row.id.endsWith('-q') ? row.rarity : undefined);
        expect(pick.weight).toBe(row.weightPerFamily);
      }
    }
    for (const level of [row.minLevel - 1, row.maxLevel + 1]) {
      // The starter in Act I is an unchanged historical entry, not a new tier.
      expect(table.picks.filter(pick => rangedIds.has(pick.baseId ?? '') &&
        pick.qlvlMin <= level && pick.qlvlMax >= level)).toEqual([]);
    }
  });

  it.each(policy.tables)('$id materializes a ranged reward through the real seeded award path', row => {
    const questActs: Record<string, number> = { 'loot/duriel-q': 2, 'loot/mephisto-q': 3, 'loot/diablo-q': 4 };
    const act = Number(/act([1-5])/.exec(row.id)?.[1] ?? required(questActs[row.id])) as 1 | 2 | 3 | 4 | 5;
    const rng = createRng(2839233830), level = Math.min(row.maxLevel, Math.max(row.minLevel, 15));
    const items = Array.from({ length: 96 }, () => rollKillRewards({ act,
      monsterLevel: level, tier: 'chapter-boss', treasureClassId: row.id,
      magicFind: 0, goldFind: 0 }, pools, rng).items).flat();
    const ranged = items.filter(item => rangedIds.has(item.baseId));
    expect(ranged.length).toBeGreaterThan(0);
    for (const item of ranged) {
      expect(row.id.endsWith('-q') ? [row.rarity] : ['normal', 'magic', 'rare', 'set', 'unique'])
        .toContain(item.rarity);
      expect(item.ilvl).toBe(level);
      expect(required(pools.bases.get(item.baseId)).reqLevel).toBeLessThanOrEqual(level);
      expect(item.baseRolls?.attack).toBeGreaterThan(0);
    }
  });

  it.each(newTiers)('%s/%s use the established two-handed curve and existing icon',
    (bow, crossbow, req, min, max, sockets) => {
      const validate = new Ajv2020().compile(baseSchema);
      for (const slug of [bow, crossbow]) {
        const base = required(pools.bases.get(`items/base/${slug}`));
        expect(validate(base), JSON.stringify(validate.errors)).toBe(true);
        expect(base.reqLevel).toBe(req);
        expect(base.baseDamage).toEqual({ min, max, breakdown: { physical: max } });
        expect(base.sockets).toBe(sockets);
        expect(base.maxSockets).toBe(sockets);
        expect(base.canHaveAffixes).toBe(true);
        expect(base.weaponType).toBe(slug === bow ? 'bow' : 'crossbow');
        expect((en.base as Record<string, string>)[slug]).toBeTruthy();
        expect((zh.base as Record<string, string>)[slug]).toBeTruthy();
        const icon = required(resolveItemIcon(base.id));
        expect(icon).toContain('bow');
        expect(existsSync(path.join(process.cwd(), 'public', icon))).toBe(true);
      }
    });

  it('validates changed tables against the existing strict drop schema', () => {
    const validate = new Ajv2020().compile(dropSchema);
    for (const row of policy.tables) {
      const table = required(rawTables.find(table => table.id === row.id));
      expect(validate(table), JSON.stringify(validate.errors)).toBe(true);
    }
  });
});

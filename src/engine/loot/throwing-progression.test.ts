/** Constructed content/reward contracts; no earned acquisition or campaign credit. */
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { existsSync } from 'node:fs';
import path from 'node:path';
import policy from '../../../tests/fixtures/throwing-progression-v1.json';
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
  ['weapon-balanced-knife', 8, 7, 13],
  ['weapon-war-dart', 22, 14, 24],
  ['weapon-battle-dart', 32, 20, 32],
  ['weapon-winged-knife', 50, 32, 55],
  ['weapon-winged-axe', 60, 45, 75]
] as const;
function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing authored throwing progression');
  return value;
}

describe('BUG658 ordinary throwing weapon progression', () => {
  it('provides a one-handed throwing upgrade at each established equipment tier', () => {
    expect([...pools.bases.values()].filter(base => base.weaponType === 'throwing')
      .map(base => base.reqLevel).sort((a, b) => a - b)).toEqual([1, 8, 22, 32, 50, 60]);
  });

  it.each(policy.tables)('$id offers one equip-eligible throwing upgrade throughout its finite envelope', row => {
    const table = required(pools.treasureClasses.get(row.id));
    const added = table.picks.filter(pick => newIds.has(pick.baseId ?? ''));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const eligible = added.filter(pick => pick.weight > 0 && pick.qlvlMin <= level && pick.qlvlMax >= level);
      expect(eligible, `${row.id}/L${String(level)}`).toHaveLength(1);
      const pick = required(eligible[0]);
      const base = required(pools.bases.get(required(pick.baseId)));
      expect(base.reqLevel).toBeLessThanOrEqual(level);
      expect(base.weaponType).toBe('throwing');
      expect(base.handedness).toBe('oneHanded');
      // BUG678 restores random ordinary rarity; fixed quest caches retain guarantees.
        expect(pick.rarity).toBe(row.id.endsWith('-q') ? row.rarity : undefined);
      expect(pick.weight).toBe(row.weightPerFamily);
    }
    for (const level of [row.minLevel - 1, row.maxLevel + 1, 123]) {
      expect(added.filter(pick => pick.qlvlMin <= level && pick.qlvlMax >= level)).toEqual([]);
    }
  });

  it.each(policy.tables)('$id materializes throwing gear through the actual seeded award path', row => {
    const questActs: Record<string, number> = { 'loot/duriel-q': 2, 'loot/mephisto-q': 3, 'loot/diablo-q': 4 };
    const act = Number(/act([1-5])/.exec(row.id)?.[1] ?? required(questActs[row.id])) as 1 | 2 | 3 | 4 | 5;
    const rng = createRng(3286157777);
    const items = Array.from({ length: 96 }, () => rollKillRewards({ act,
      monsterLevel: row.minLevel, tier: 'chapter-boss', treasureClassId: row.id,
      magicFind: 0, goldFind: 0 }, pools, rng).items).flat();
    const throwing = items.filter(item => newIds.has(item.baseId));
    expect(throwing.length).toBeGreaterThan(0);
    for (const item of throwing) {
      const base = required(pools.bases.get(item.baseId));
      expect(item).toMatchObject({ ilvl: row.minLevel, socketCapacity: 0 });
      expect(row.id.endsWith('-q') ? [row.rarity] : ['normal', 'magic', 'rare', 'set', 'unique'])
        .toContain(item.rarity);
      expect(base.reqLevel).toBeLessThanOrEqual(row.minLevel);
      expect(item.baseRolls?.attack).toBeGreaterThanOrEqual(required(base.baseDamage).min);
      expect(item.baseRolls?.attack).toBeLessThanOrEqual(required(base.baseDamage).max);
    }
  });

  it.each(curve)('%s follows the one-handed curve, projects native Attack and has bilingual art',
    (slug, level, min, max) => {
      const base = required(pools.bases.get(`items/base/${slug}`));
      const validate = new Ajv2020({ strict: true }).compile(baseSchema);
      expect(validate(base), JSON.stringify(validate.errors)).toBe(true);
      expect(base).toMatchObject({ reqLevel: level, sockets: 0, maxSockets: 0,
        metal: true, canHaveAffixes: true, weaponType: 'throwing', handedness: 'oneHanded' });
      expect(base.baseDamage).toEqual({ min, max, breakdown: { physical: max } });
      for (const rarity of ['normal', 'magic', 'rare'] as const) {
        const item = required(rollItem({ baseId: base.id, rarity, ilvl: level }, pools, createRng(3286157777)));
        expect(item.socketCapacity).toBe(0);
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
      expect(icon).toContain('dagger');
      expect(existsSync(path.join(process.cwd(), 'public', icon))).toBe(true);
    });

  it('validates changed tables with the existing strict schema', () => {
    const validate = new Ajv2020({ strict: true }).compile(dropSchema);
    for (const row of policy.tables) {
      expect(validate(required(rawTables.find(table => table.id === row.id))), JSON.stringify(validate.errors)).toBe(true);
    }
  });
});

/** Constructed source coverage; no earned acquisition, campaign or pacing credit. */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import policy from '../../../tests/fixtures/shield-progression-v1.json';
import currentTables from '@/data/loot/treasure-classes.json';
import schema from '@/data/schema/drop-table.schema.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { restorePreArmorProgression } from '@/test/armorProgressionPolicy';
import { restorePreShieldProgression } from '@/test/shieldProgressionPolicy';
import { createRng } from '../rng';
import { pickTcPick } from './drop-roller';

const rawTables = restorePreArmorProgression(currentTables);
const pools = loadAwardPools();
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing declared shield progression');
  return value;
}

describe('BUG791 ordinary usable shield tiers', () => {
  it.each(policy.tables)('$id offers its current usable tier throughout the finite source envelope', row => {
    const table = required(pools.treasureClasses.get(row.id));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const tier = required(policy.tiers.find(tier => tier.from <= level && level <= tier.to));
      const eligible = table.picks.filter(pick => pick.baseId === tier.baseId && pick.weight > 0 &&
        pick.qlvlMin <= level && level <= pick.qlvlMax);
      expect(eligible, `${row.id}/L${String(level)}`).toHaveLength(1);
      expect(required(pools.bases.get(tier.baseId))).toMatchObject({ type: 'armor', slot: 'offhand', reqLevel: tier.from });
      expect(required(eligible[0])).not.toHaveProperty('rarity');
    }
  });

  it('appends exactly29 missing bands in14tables and preserves the whole predecessor', () => {
    expect(policy.tables).toHaveLength(18);
    expect(policy.tables.filter(row => row.additions.length)).toHaveLength(14);
    expect(policy.tables.flatMap(row => row.additions)).toHaveLength(29);
    const validate = new Ajv2020({ strict: true }).compile(schema);
    for (const row of policy.tables) {
      const table = required(rawTables.find(table => table.id === row.id));
      expect(validate(table), JSON.stringify(validate.errors)).toBe(true);
      expect(table.entries).toHaveLength(row.originalEntryCount + row.additions.length);
      expect(table.entries.slice(row.originalEntryCount)).toEqual(row.additions.map(band => ({
        type: 'item', itemBase: band.baseId, weight: row.weightPerFamily, minLevel: band.from, maxLevel: band.to
      })));
      expect(table.entries.slice(0, row.originalEntryCount).some(entry => entry.type === 'item' &&
        entry.itemBase?.startsWith('items/base/sh-') && entry.weight > 0 && !Object.hasOwn(entry, 'rarity'))).toBe(true);
      for (const band of row.additions) {
        expect(band.from).toBeGreaterThanOrEqual(row.minLevel);
        expect(band.from).toBeGreaterThanOrEqual(required(pools.bases.get(band.baseId)).reqLevel);
        expect(band.to).toBeLessThanOrEqual(row.maxLevel);
        expect(band.from).toBeLessThanOrEqual(band.to);
        expect(table.entries.slice(0, row.originalEntryCount).some(entry => entry.itemBase === band.baseId &&
          entry.weight > 0 && entry.minLevel <= band.to && entry.maxLevel >= band.from)).toBe(false);
      }
    }
    expect(createHash('sha256').update(JSON.stringify(restorePreShieldProgression(currentTables))).digest('hex'))
      .toBe(policy.predecessorJsonSha256);
  });

  it.each(policy.tables.flatMap(row => row.additions.map(band => ({ ...row, band }))))(
    '$id natively selects $band.baseId at both inclusive edges in the unmodified table', row => {
      const table = required(pools.treasureClasses.get(row.id));
      for (const level of new Set([row.band.from, row.band.to])) {
        const eligible = table.picks.filter(pick => pick.weight > 0 && pick.qlvlMin <= level && level <= pick.qlvlMax);
        const selected = required(eligible.find(pick => pick.baseId === row.band.baseId &&
          pick.qlvlMin === row.band.from && pick.qlvlMax === row.band.to));
        const index = eligible.indexOf(selected);
        const total = eligible.reduce((sum, pick) => sum + pick.weight, 0);
        const prefix = eligible.slice(0, index).reduce((sum, pick) => sum + pick.weight, 0);
        // Declared inverse-CDF midpoint proves a positive native interval;
        // this is not a searched seed or an acquisition probability sample.
        expect(pickTcPick(table, level, { ...createRng(7), next: () => (prefix + selected.weight / 2) / total }))
          .toEqual(selected);
        expect(selected).not.toHaveProperty('rarity');
      }
    });
});

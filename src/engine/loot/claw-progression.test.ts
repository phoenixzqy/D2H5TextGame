/** Constructed availability checks; no campaign, acquisition-odds or pacing credit. */
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import policy from '../../../tests/fixtures/claw-progression-v1.json';
import rawTables from '@/data/loot/treasure-classes.json';
import dropSchema from '@/data/schema/drop-table.schema.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { restorePreClawProgression } from '@/test/clawProgressionPolicy';
import { restorePreShieldProgression } from '@/test/shieldProgressionPolicy';
import { createRng } from '../rng';
import { pickTcPick } from './drop-roller';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
afterEach(__resetRollItemSeqForTests);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing declared claw progression');
  return value;
}

describe('BUG790 ordinary current-tier claw coverage', () => {
  it.each(policy.tables)('$id offers its current usable claw throughout its finite source envelope', row => {
    const table = required(pools.treasureClasses.get(row.id));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const tier = required(policy.tiers.find(tier => tier.from <= level && level <= tier.to));
      const eligible = table.picks.filter(pick => pick.baseId === tier.baseId && pick.weight > 0 &&
        pick.qlvlMin <= level && level <= pick.qlvlMax);
      expect(eligible, `${row.id}/L${String(level)}`).toHaveLength(1);
      expect(required(pools.bases.get(tier.baseId))).toMatchObject({ weaponType: 'claw', handedness: 'oneHanded' });
      expect(required(pools.bases.get(tier.baseId)).reqLevel).toBeLessThanOrEqual(level);
    }
  });

  it('appends exactly49 missing bands in23 tables and preserves the entire predecessor', () => {
    const preShieldTables = restorePreShieldProgression(rawTables);
    const validate = new Ajv2020({ strict: true }).compile(dropSchema);
    expect(policy.tables.filter(row => row.additions.length)).toHaveLength(23);
    expect(policy.tables.flatMap(row => row.additions)).toHaveLength(49);
    for (const row of policy.tables) {
      const raw = required(preShieldTables.find(table => table.id === row.id));
      expect(validate(raw), JSON.stringify(validate.errors)).toBe(true);
      expect(raw.entries).toHaveLength(row.originalEntryCount + row.additions.length);
      expect(raw.entries.slice(row.originalEntryCount)).toEqual(row.additions.map(addition => ({
        type: 'item', itemBase: addition.baseId, weight: row.weightPerFamily,
        ...(row.id.endsWith('-q') ? { rarity: 'rare' } : {}), minLevel: addition.from, maxLevel: addition.to
      })));
      for (const addition of row.additions) {
        expect(addition.from).toBeGreaterThanOrEqual(row.minLevel);
        expect(addition.to).toBeLessThanOrEqual(row.maxLevel);
        const base = required(pools.bases.get(addition.baseId));
        expect(addition.from).toBeGreaterThanOrEqual(base.reqLevel);
        const previous = raw.entries.slice(0, row.originalEntryCount);
        expect(previous.some(entry => entry.itemBase === addition.baseId && entry.weight > 0 &&
          entry.minLevel <= addition.to && entry.maxLevel >= addition.from)).toBe(false);
      }
    }
    const keys = [...new Set(preShieldTables.flatMap(table => [
      ...Object.keys(table), ...table.entries.flatMap(entry => Object.keys(entry))
    ]))].sort();
    expect(createHash('sha256').update(JSON.stringify(restorePreClawProgression(preShieldTables), keys)).digest('hex'))
      .toBe(policy.predecessorCanonicalSha256);
  });

  it.each(policy.tables.flatMap(row => row.additions.map(addition => ({ ...row, addition }))))(
    '$id selects $addition.baseId at both inclusive band edges using the unmodified native table', row => {
      const table = required(pools.treasureClasses.get(row.id));
      for (const level of new Set([row.addition.from, row.addition.to])) {
        const eligible = table.picks.filter(pick => pick.weight > 0 && pick.qlvlMin <= level && level <= pick.qlvlMax);
        const selected = required(eligible.find(pick => pick.baseId === row.addition.baseId &&
          pick.qlvlMin === row.addition.from && pick.qlvlMax === row.addition.to));
        const index = eligible.indexOf(selected);
        const total = eligible.reduce((sum, pick) => sum + pick.weight, 0);
        const prefix = eligible.slice(0, index).reduce((sum, pick) => sum + pick.weight, 0);
        // A declared inverse-CDF midpoint proves this real interval is selectable;
        // this is not a searched seed or an acquisition probability observation.
        const rng = { ...createRng(7), next: () => (prefix + selected.weight / 2) / total };
        expect(pickTcPick(table, level, rng)).toEqual(selected);
        expect(selected.rarity).toBe(row.id.endsWith('-q') ? 'rare' : undefined);
      }
    });
});

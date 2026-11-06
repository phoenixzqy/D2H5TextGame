/** Real authored loot contracts; constructed rewards grant no campaign credit. */
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import rawTables from '@/data/loot/treasure-classes.json';
import dropSchema from '@/data/schema/drop-table.schema.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { restorePreMFRarities } from '@/test/magicFindPolicy';
import { restorePreClawProgression } from '@/test/clawProgressionPolicy';
import { restorePreShieldProgression } from '@/test/shieldProgressionPolicy';
import policy from '../../../tests/fixtures/magic-find-rarity-v1.json';
import { createRng } from '../rng';
import { rollDrops } from './drop-roller';
import { rollKillRewards } from './award';
import { __resetRollItemSeqForTests } from './rollItem';

afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
const pools = loadAwardPools();
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing production MF contract data');
  return value;
}

describe('BUG678 production Magic Find', () => {
  it('changes precisely491 declared rarity properties and preserves every other authored field', () => {
    expect(policy.tables).toHaveLength(31);
    expect(policy.tables.flatMap(row => row.bands.flatMap(band => band.indices))).toHaveLength(491);
    for (const row of policy.tables) {
      const raw = required(rawTables.find(table => table.id === row.id));
      const loaded = required(pools.treasureClasses.get(row.id));
      for (const band of row.bands) for (const index of band.indices) {
        const entry = required(raw.entries[index]);
        expect(entry.type).toBe('item');
        expect(entry).not.toHaveProperty('rarity');
        expect(required(loaded.picks[index])).not.toHaveProperty('rarity');
      }
    }
    // Parse/stringify removes formatting; the whole predecessor hash includes
    // ordering, fixed rewards, bases, weights, quantities and every level gate.
    // Later claw/shield/armor/two-handed additive deltas are removed in reverse
    // order. Their exact predecessor checks are retained in tests/static evidence;
    // keep the MF predecessor hash unchanged.
    const reconstructed = restorePreMFRarities(restorePreClawProgression(restorePreShieldProgression(rawTables)));
    const keys = [...new Set(rawTables.flatMap(table => [
      ...Object.keys(table), ...table.entries.flatMap(entry => Object.keys(entry))
    ]))].sort();
    expect(createHash('sha256').update(JSON.stringify(reconstructed, keys)).digest('hex'))
      .toBe(policy.predecessorCanonicalSha256);
  });

  it('validates every shipped table with the unchanged strict schema', () => {
    const validate = new Ajv2020({ strict: true }).compile(dropSchema);
    for (const table of rawTables) expect(validate(table), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([1, 2, 3, 4, 5])('gear MF and the offline multiplier affect real Act%i equipment', act => {
    const tc = required(pools.treasureClasses.get(`loot/trash-act${String(act)}`));
    // Choose the first eligible real base. A fixed inverse-CDF roll between
    // independently calculated white thresholds makes each MF effect observable.
    const level = Math.min(...tc.picks.filter(pick => pick.type === 'item').map(pick => pick.qlvlMin));
    const roll = (mf: number, bonus: number, unit: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(unit);
      return rollDrops({ tc, tier: 'trash', monsterLevel: level,
        magicFind: mf, magicFindMultiplier: bonus }, rng);
    };
    // At .6 gear MF crosses white→magic; at .5 only the offline bonus
    // crosses that boundary. No substituted treasure class.
    expect(roll(0, 1, 0.6)).toMatchObject([{ rarity: 'normal' }]);
    expect(roll(300, 1, 0.6)).toMatchObject([{ rarity: 'magic' }]);
    expect(roll(300, 1, 0.5)).toMatchObject([{ rarity: 'normal' }]);
    expect(roll(300, 1.5, 0.5)).toMatchObject([{ rarity: 'magic' }]);
  });

  it('materializes boosted rarity on a real ordinary pick through complete kill rewards', () => {
    const rng = createRng(7);
    vi.spyOn(rng, 'chance').mockReturnValue(false);
    vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(0.5);
    const result = rollKillRewards({ act: 1, tier: 'trash', monsterLevel: 1,
      treasureClassId: 'loot/trash-act1', magicFind: 300, magicFindMultiplier: 1.5,
      goldFind: 0 }, pools, rng);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ baseId: 'items/base/weapon-spear', rarity: 'magic', ilvl: 1 });
    expect(result.items[0]?.affixes).toHaveLength(2);
  });
});

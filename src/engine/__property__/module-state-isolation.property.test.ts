/**
 * F4 / P05b — Module-state isolation property test.
 *
 * Purpose: empirically prove that the engine's module-level state
 * (`itemSeq` counter in `loot/rollItem.ts`, plus the implicit module
 * graph reused by `vitest`'s `isolate: false` mode) does not leak across
 * iterations within a single Vitest worker.
 *
 * What this guards:
 *   - The P05a audit (`docs/perf/p05a-engine-state-audit.md` §5)
 *     concluded `isolate: false` is safe for `src/engine/**`. This file
 *     is the **runtime evidence** for that claim. If a future PR
 *     introduces hidden module state that diverges between runs, this
 *     test should fail before CI does.
 *
 * Strategy:
 *   1. For seeds 1..50, run a representative deterministic engine flow
 *      (RNG → damage pipeline → drop-roller → rollItem) and capture a
 *      compact fingerprint per seed — INCLUDING `item.id`, so the
 *      fingerprint is sensitive to the module-level `itemSeq` counter.
 *   2. Run the SAME loop a second time in the SAME test file (i.e. the
 *      same Vitest worker, the same module graph). Reset only the
 *      documented test escape hatch (`__resetRollItemSeqForTests`).
 *   3. Assert byte-identical fingerprints — proving determinism is a
 *      function of (seed, reset state) alone, not of execution order.
 *   4. Assert different seeds produce different fingerprints (no
 *      collapsing to a single value), proving the rng is actually
 *      varied and isn't being clobbered by a leaked singleton.
 *   5. Assert that omitting the reset between iterations DOES change
 *      the fingerprint — proving this test would actually catch a
 *      real isolate:false regression (the previous version excluded
 *      item.id from the fingerprint and would have passed even if
 *      module state leaked).
 *
 * Speed: ~50 seeds × 4 cheap calls × 4 cases. Designed to add <200ms
 * to the engine project budget.
 *
 * @see docs/perf/p05a-engine-state-audit.md
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { createRng } from '../rng';
import { resolveDamage, type DamageInput } from '../combat/damage';
import {
  pickTcBase,
  rollRarity,
  type TreasureClass,
} from '../loot/drop-roller';
import {
  rollItem,
  __resetRollItemSeqForTests,
  type ItemRollPools,
} from '../loot/rollItem';
import type { ItemBase, Affix } from '../types/items';

// ---- Minimal fixtures (kept inline — no data deps) -------------------------

const TC: TreasureClass = {
  id: 'iso-test-tc',
  picks: [
    { baseId: 'short-sword', weight: 10, qlvlMin: 1, qlvlMax: 99 },
    { baseId: 'leather-cap', weight: 8, qlvlMin: 1, qlvlMax: 99 },
    { baseId: 'small-shield', weight: 5, qlvlMin: 1, qlvlMax: 99 },
  ],
};

const BASES: ReadonlyMap<string, ItemBase> = new Map<string, ItemBase>([
  [
    'short-sword',
    {
      id: 'short-sword',
      name: 'Short Sword',
      type: 'weapon',
      slot: 'weapon',
      reqLevel: 1,
      canHaveAffixes: true,
      baseDamage: { min: 2, max: 5, breakdown: { physical: 5 } },
      weaponType: 'sword',
      handedness: 'oneHanded',
    } as ItemBase,
  ],
  [
    'leather-cap',
    {
      id: 'leather-cap',
      name: 'Leather Cap',
      type: 'armor',
      slot: 'head',
      reqLevel: 1,
      canHaveAffixes: true,
      baseDefense: 6,
    } as ItemBase,
  ],
  [
    'small-shield',
    {
      id: 'small-shield',
      name: 'Small Shield',
      type: 'armor',
      slot: 'offhand',
      reqLevel: 1,
      canHaveAffixes: true,
      baseDefense: 4,
    } as ItemBase,
  ],
]);

const AFFIXES: readonly Affix[] = [
  {
    id: 'pre-strong',
    kind: 'prefix',
    appliesTo: [],
    stat: 'attack',
    rarityWeights: { magic: 10, rare: 10 },
    tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 5 }],
    i18nKey: 'affix.pre-strong',
  } as Affix,
  {
    id: 'suf-of-the-bear',
    kind: 'suffix',
    appliesTo: [],
    stat: 'life',
    rarityWeights: { magic: 10, rare: 10 },
    tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 5 }],
    i18nKey: 'affix.suf-of-the-bear',
  } as Affix,
];

const POOLS: ItemRollPools = { bases: BASES, affixes: AFFIXES };

const DAMAGE_BASE: DamageInput = {
  baseMin: 5,
  baseMax: 12,
  flatBonus: 2,
  increasedPct: 0.25,
  comboMult: 1,
  type: 'physical',
  critChance: 0.15,
  critMult: 2,
  defenderResistances: {
    physical: 10,
    fire: 0,
    cold: 0,
    lightning: 0,
    poison: 0,
    arcane: 0,
  },
  defenderArmor: 8,
  defenderMagicResist: 0,
  defenderDodge: 0.05,
};

/**
 * Deterministic engine flow exercising the modules most likely to
 * harbor leaked state: rng, damage, drop-roller (rarity weighting), and
 * rollItem (module-level itemSeq counter).
 */
/**
 * Build a fingerprint for one seed.
 *
 * @param seed       - rng seed
 * @param includeId  - when true, includes `item.id`. The id encodes the
 *   module-level `itemSeq` counter, so any fingerprint that includes it
 *   becomes sensitive to leaked module state. Tests that want to *prove*
 *   isolation pass `true`; the order-independence test passes `false`
 *   because by-design the itemSeq is order-dependent (audit §3).
 */
function fingerprintForSeed(seed: number, includeId: boolean): string {
  const rng = createRng(seed);

  // 1. damage pipeline — rng drives hit/dodge/crit
  const dmg = resolveDamage(DAMAGE_BASE, rng);

  // 2. drop-roller: rarity selection + base pick
  const rarity = rollRarity(100, 'elite', rng);
  const baseId = pickTcBase(TC, 25, rng) ?? 'short-sword';

  // 3. rollItem — touches itemSeq module state via nextItemId
  const item = rollItem({ baseId, rarity, ilvl: 25 }, POOLS, rng);

  const affixSig =
    item?.affixes
      ?.map((a) =>
        'rolledValue' in a ? `${a.id}:${String(a.rolledValue)}` : `legacy:${a.affixId}`,
      )
      .join('|') ?? '';
  return [
    seed,
    dmg.hit ? 1 : 0,
    dmg.dodged ? 1 : 0,
    dmg.crit ? 1 : 0,
    dmg.final,
    rarity,
    baseId,
    item?.baseRolls?.attack ?? 0,
    item?.baseRolls?.defense ?? 0,
    item?.affixes?.length ?? 0,
    affixSig,
    // item.id embeds the module-level itemSeq counter. Including it here
    // is what makes this test capable of catching a "module state leaked
    // across iterations" regression — without it, the fingerprint would
    // be identical whether or not __resetRollItemSeqForTests was called.
    includeId ? (item?.id ?? '') : '',
  ].join('/');
}

describe('module-state isolation (P05b / F4 — guards isolate:false safety)', () => {
  beforeEach(() => {
    // Only documented test reset hatch. Audit §3 confirms registry /
    // aliases / summons need no reset because no production code mutates
    // them between runs.
    __resetRollItemSeqForTests();
  });

  it('produces identical fingerprints for the same seed across two passes in one worker', () => {
    const seeds = Array.from({ length: 50 }, (_, i) => i + 1);
    const passA = seeds.map((s) => fingerprintForSeed(s, true));

    __resetRollItemSeqForTests();
    const passB = seeds.map((s) => fingerprintForSeed(s, true));

    expect(passB).toEqual(passA);
  });

  it('different seeds produce diverse fingerprints (no singleton collapsing them)', () => {
    const seeds = Array.from({ length: 50 }, (_, i) => i + 1);
    const unique = new Set(seeds.map((s) => fingerprintForSeed(s, true)));
    // Lower bound is conservative; realistic uniqueness is ~95%+. We
    // just need to catch the pathological "everything collapses to one
    // fingerprint" failure mode.
    expect(unique.size).toBeGreaterThan(20);
  });

  it('out-of-order seed evaluation matches in-order evaluation (no hidden accumulator)', () => {
    const seeds = Array.from({ length: 50 }, (_, i) => i + 1);
    // includeId:false because itemSeq is order-dependent by design (audit §3).
    const inOrder = seeds.map((s) => fingerprintForSeed(s, false));

    __resetRollItemSeqForTests();
    const reverseSeeds = [...seeds].reverse();
    const reverseFingerprints = reverseSeeds.map((s) => fingerprintForSeed(s, false));
    const reverseBySeed = new Map<number, string>();
    reverseSeeds.forEach((s, i) => {
      const fp = reverseFingerprints[i];
      if (fp !== undefined) reverseBySeed.set(s, fp);
    });
    const reordered = seeds.map((s) => reverseBySeed.get(s));

    expect(reordered).toEqual(inOrder);
  });

  it('without the module-state reset, fingerprints diverge — proving the test would catch a real leak', () => {
    // Pass A: reset the itemSeq counter before EACH seed → every item
    // gets id `it-<rng>-1`. This is what a properly-isolated worker
    // would look like.
    const seeds = Array.from({ length: 50 }, (_, i) => i + 1);
    const passA: string[] = [];
    for (const s of seeds) {
      __resetRollItemSeqForTests();
      passA.push(fingerprintForSeed(s, true));
    }

    // Pass B: same seeds, but DO NOT reset between iterations. itemSeq
    // accumulates 1, 2, 3, ... so seed N's item.id encodes seq N.
    // If the production engine ever leaked state across vitest
    // iterations under `isolate:false`, this is the shape of failure
    // we'd see — and the assertion below would fail in pass A vs pass B
    // form.
    __resetRollItemSeqForTests();
    const passB = seeds.map((s) => fingerprintForSeed(s, true));

    // Aggregate fingerprints must differ. Stronger: every seed past the
    // first must differ between the two passes (since rng portion of
    // item.id is identical for the same seed but the seq suffix is 1
    // in passA and i+1 in passB).
    expect(passB.join('|')).not.toEqual(passA.join('|'));
    const divergences = passA.reduce(
      (n, fp, i) => (fp === passB[i] ? n : n + 1),
      0,
    );
    // Seed index 0 collides (both have seq=1); the remaining 49 must diverge.
    expect(divergences).toBe(seeds.length - 1);
  });
});

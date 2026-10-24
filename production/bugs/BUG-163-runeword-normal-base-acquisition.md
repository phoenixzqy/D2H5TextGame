# BUG-163 — Compatible runeword bases lack ordinary acquisition sources

Severity: High. Status: open. Found before the content fix on `b596c88` /
production source `59f2590`. Affects D10/F06/P12 and G4.
Owners: content-designer / engine-dev / QA. Reproduction is a Node/Vitest
data/engine check; browser, viewport and locale do not affect the mismatch.

The complete catalog audit in BUG162 establishes compatible authored bases,
not their normal-item acquisition. The new
`src/data/loaders/runeword-base-availability.test.ts` checks the actual matcher,
authored maximum capacities and positive-weight normal-item picks at levels
spawned by real campaign plans (all29 areas,13 challenge count residues).

1. Load the real bases, recipes and treasure classes on the affected source.
2. Resolve all29 actual areas with seed0 and challenge ordinals0–12. Collect
   positive-weight normal picks eligible at actual spawned monster levels.
3. Run `npx vitest run src/data/loaders/runeword-base-availability.test.ts`;
   intersect those sources with the public matcher's compatible bases.

Expected: all35 recipes have a compatible attainable normal base. Actual:
Insight, Infinity, Heart of the Oak, Breath of the Dying, Beast and Last Wish
have compatible bases but no reachable normal source. Obedience separately
has no compatible base at all (BUG162). Unique/set picks cannot substitute:
their downgrade is rare, and a white base is required for a word.

Root cause: recipe predicates, base capacities and normal acquisition were
validated separately. Add a normal acquisition source for the existing
Thunder Maul and a source-backed five-socket polearm (BUG162). Preserve the
closed recipes, every existing base and pick, capacity RNG and finite loot
domains. The catalog regression must stay green without synthetic bases,
forged capacities or weakened restrictions. Functional acquisition/crafting
evidence does not establish earned campaign affordability or pacing.

Original failure: task-owned `obedience-base380/catalog-red.log` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`.
Root retains it through campaign/full-v1 consumers and removes it afterward.

Validation follow-up: the first post-addition full suite has11666 passes,
eight failures and two existing skips. All eight failures are the literal
75-base expectation in `nightmare-affix-eligibility.test.ts`; the source
addition makes76. Update only that count, retaining the per-base magic/rare
affix, level99–102 and nonempty-bonus assertions. This is a stale test fixture,
not evidence of an affix generation defect. Original full output remains in
the task's `unit-full.log`; do not replace or suppress its failures.

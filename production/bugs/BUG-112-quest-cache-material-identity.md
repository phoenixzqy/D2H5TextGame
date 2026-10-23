# BUG-112 — Preserve concrete rune identities from quest caches

- Status: Fix implemented; final integrated validation in progress.
- Severity: High (blocks earning usable rune stacks; anonymous balances cannot recover identity).
- Owner: engine-dev; inventory/save consumers follow the D10 material contract.
- Build: `e6b577f48e209f2ffd8d5b971f3f9b3dc09a16f5`.
- Environment: Vitest 1.6.1, engine project, Node; browser/viewport/locale not applicable.
- Seed: `createRng(41)`; actual production award pools and authored rune picks.
- Affected systems: treasure-class materialization, quest caches, downstream material ownership.

## Reproduction

1. Load production `loadAwardPools()` and select an actual rune pick from
   `loot/countess-runes`, such as its authored `runes/ral` entry.
2. Restrict that table to the unchanged selected pick. Call
   `rollQuestTableRewards({ tableId: 'loot/countess-runes', ilvl: 12, picks: 1 }, pools, createRng(41))`.
3. Compare with `rollDrops` using the same seed, one pick, noDrop0 and the
   identical authored entry. Check both the concrete identity and following RNG.
4. Run the regression file:

   ```sh
   node node_modules/vitest/vitest.mjs run --project engine src/engine/loot/material-rewards.test.ts --poolOptions.threads.maxThreads=1 --poolOptions.threads.minThreads=1
   ```

Expected: raw `runes/ral` becomes `materials: { 'runes/ral': 1 }`; the numeric
`runes: 1` is a summary of that stack. No shard payment or extra identity RNG
draw occurs. Repeated IDs aggregate with safe integer arithmetic. A strict cache
containing an unknown, wrong-kind or malformed concrete identity refuses the
whole bag, including when earlier picks were valid.

Actual: raw `rollDrops` retains `itemId: 'runes/ral'` and following RNG is
unchanged, but `rollQuestTableRewards` returns only
`{ items: [], runeShards: 0, wishstones: 0, runes: 1, gems: 0 }`. The identity is
gone. Unknown/wrong-kind IDs also become numeric rune/gem counts rather than
refusing the strict bag. Existing grant consumers fold those counts into shard
currencies, so the specific rune cannot be used or reconstructed later.

## RED evidence

The focused run exits1: **34 failed / 8 passed / 42 total**, 565ms. Its failures
are runtime assertions, with all25 actual authored rune outcomes across
Countess, Hellforge, Baal, Andariel, Duriel, Mephisto and Diablo covered. Real
catalog membership, direct-drop identities and following RNG assertions pass
before each missing-material assertion. Duplicate count overflow already
refuses correctly. The suite also covers repeated identical IDs, the exact
maximum safe stack, malformed/wrong-kind IDs and a mixed valid/invalid bag.

Diagnostic log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-d10-material-red.8adqs303/red.log`
(SHA256 `e862c24b4cc0101ff959d1a6a24f76b86f9612d3ec7758146a3c079f8cebc628`).
The root integration agent consumed this diagnostic. The QA owner removed the exact file and its empty task-owned directory; absence was verified. The original hash above identifies the consumed RED evidence; the temporary path is no longer present.

Regression: [`material-rewards.test.ts`](../../src/engine/loot/material-rewards.test.ts).

## Root cause and scope

`materializeDrops` in `src/engine/loot/award.ts` ignores direct rune/gem
`itemId` and accumulates only numeric totals. Preserve canonical material IDs
through acquisition, then integrate checked ownership, versioned persistence
and every live grant consumer before claiming earned material-stash acceptance.
Never infer historical IDs from legacy folded shard balances.

## Fix and verification

The acquisition path retains explicit rune/gem IDs, samples generic identities from reviewed JSON pools using the existing conditional variate, and carries a validated concrete ledger through whole-bag planning. Native, quest and idle grants pay actual shard/wishstone currencies separately. v18 persists exact material holdings; historical anonymous balances remain unchanged.

The independent42-case regression and all210 loot tests passed after the acquisition fix. Final shared ownership validation adds stash, hero and merc gear collision checks; final engine validation passes4826 tests in134 files. Source/UI/save/sim integration is separately tracked in `docs/plans/evidence/d10-materials-integration.md`.

Earned browser acquisition and full material-stash acceptance remain pending. This fix does not establish socket insertion, runewords, gem recipes or crafting acceptance.

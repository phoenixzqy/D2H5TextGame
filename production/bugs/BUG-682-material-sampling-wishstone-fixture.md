# BUG-682 — Give the material-sampling fixture its native wishstone stream

- **Status:** Fixed and verified locally 2026-11-04; no commit created.
- **Severity:** Low; stale test fixture, no gameplay defect established.
- **Owner / affected systems:** Root / loot regression tests.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
- **Environment:** WSL Node/Vitest; browser, viewport and locale independent.
- **Seed:** Six scripted loot variates `[.5, 1 - Number.EPSILON / 2, .9, 0, 0, .5]`.

## Reproduction

1. Run the engine project for `src/engine/loot/material-sampling.test.ts`.
2. Observe `overrides a shared authored Normal table with actual live Act V Hell context`.

**Expected:** Six loot draws verify the actual Act V Hell material context;
the existing wishstone coin uses the separate native currency stream.
**Actual:** The fixture omits that stream, so `applyWishstoneChance` requests a
seventh loot draw and the fixture throws `Unexpected additional RNG draw`.
This input uses tier `boss` and `loot/material-test`, so the new configured
chapter-boss material branch does not execute. Native combat already supplies
the distinct wishstone RNG in `prepareLootForVictory`.

Evidence: `p17-boss-material-bundles-v1/affected-loot.log` and
`stale-sampling-red.log` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Fix the fixture to provide and assert its own wishstone stream, retaining all
six original loot draws and concrete material assertions.

## Local resolution

The fixture now supplies a distinct scripted wishstone RNG and verifies one
coin draw and zero wishstones while preserving its original six loot draws
and concrete rune/gem assertions. The final affected run passes199/199 tests
across11files, including all12 material-sampling cases. Strict scoped types and
explicit lint pass. The original isolated failure remains in the packet;
production reward behavior was not changed for this fixture correction.

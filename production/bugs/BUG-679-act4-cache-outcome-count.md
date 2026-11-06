# BUG-679 — Exercise all fourteen Diablo quest-cache outcomes

- **Status:** Fixed locally on retained source at HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`; uncommitted.
- **Severity:** Low; stale QA fixture prevents checking nine existing outcomes.
- **Owner / affected systems:** Root / loot regression coverage.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
- **Environment:** WSL, Vitest Node engine project; browser/viewport/locale independent.
- **Seed:** 41, used to materialize each selectable cache outcome.

## Reproduction

1. Run `src/engine/loot/act4-quest-cache.test.ts`.
2. Observe its hardcoded five-outcome assertion for `loot/diablo-q`.

**Expected:** Assert the fourteen authored outcomes and materialize every one,
retaining exact base, rarity, item-level and currency checks.

**Actual:** The test fails before its materialization loop: expected five picks,
received fourteen. Earlier weapon-progression additions expanded the cache.
The current MF correction does not change this table.

## Evidence

Closure: [production MF evidence](../../docs/plans/evidence/p17-real-magic-find.md).
All three `src/engine/loot/act4-quest-cache.test.ts` cases pass. The complete
authored cache matches its predecessor; this correction changes only tests.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-real-mf-v1`.
`affected.log` retains the failure; `cache-predecessor-proof.json` proves the
entire cache is identical to the pre-MF snapshot and already had fourteen picks.
The original test is retained under `before/src/engine/loot/`.

Updating the count exposed a second fixture assumption: four progression entries
are intentionally ineligible at item level61. `affected-green.log` retains that
failure. The runtime correctly returns no reward for those isolated choices.

Correction: assert fourteen total authored outcomes, assert that each ineligible
choice yields no reward at61, then materialize every outcome at its nearest
eligible level. Keep all base/rarity/currency assertions and check the actual
selected item level. No production table or reward rule changes.

# BUG-361 — Author independent material chances in validated JSON

Status: Fixed in `f6eb6cebb13d9d8dfab5ebb9cba0a0ff05ad854e`. No forge hold/label/status applied.
Severity: Low — tuning-source contract gap; no incorrect live drop established.
Found: 2026-10-28 UTC.
Build: `07933d8f9fdcc1fa7ea9c392fc293d76f81495e3`.
Environment: Node 24.21.0/npm 11.19.0. Browser, viewport, locale and RNG seed are not applicable to this static source-contract reproduction.
Owners: content-designer / engine-dev; producer reviews.

## Reproduction

1. Inspect `src/engine/loot/orbs-and-currency.ts`: `RUNE_CHANCE` and `GEM_CHANCE` author all seven tier probabilities in TypeScript.
2. Inspect `src/data/loot/material-economy.json` and its schema: material pools are authored and validated there, but independent drop chances are absent.
3. Observe that changing loaded economy data cannot change those gates. This contradicts the project requirement that numerical tuning live in JSON.

Expected: one schema-validated economy record authors each tier's independent rune/gem chance; the runtime consumes that record.
Actual: the independent gates are hardcoded outside the loaded economy contract.
Suspected root cause: the pool extraction left the original chance maps in the reward function.
Workaround: change TypeScript; this does not meet the authoring requirement.

Evidence: root retains `source-reproduction.json` in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-material-chances-9wx3ydph`, binding the exact original maps and source SHA256. No gameplay or acquisition experiment ran for this reproduction.


## Correction and validation — 2026-10-28 UTC

The implementation commit above moves the exact unchanged probabilities into the
closed schema-validated material economy and consumes them directly, removing
both hardcoded maps. No reward, sampling, RNG-order or save behavior is tuned.

Regression: [material-chances.test.ts](../../tests/sim/production/material-chances.test.ts).
The unchanged focused suite first fails26 cases on the original code, then passes
all75 (including41 new cases) after the correction. Independent real-loader
original/final probes match all1680 complete outputs and following RNG draws.
Engine10,736/full21,293 (same two existing skips)/typecheck/lint all pass.
[Evidence](../../docs/plans/evidence/material-chance-authoring.md) records exact
raw reports, hashes, review, cleanup and acceptance limits. This closes the
JSON-authoring gap only; earned economy and full-v1 acceptance remain open.

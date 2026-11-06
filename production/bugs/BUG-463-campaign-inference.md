# BUG-463 — Give campaign loop values explicit domain types

Status: fixed locally and verified; no commit. Severity: Medium (verification).

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained
local changes, Node24.21.0/TypeScript5.9.3/WSL. Browser, viewport, locale and
RNG seed are not applicable to static checking of the native campaign harness.

## Reproduction

1. Run TypeScript with the external `tsconfig-maintained-opening-v1.json`.
2. Run explicit campaign-file ESLint with `--no-ignore`.

Expected: loop-selected mercenary and previous opening cycle have their domain
types under strict checking; no inferred `any` enters downstream projections.

Actual: TS7022 at `merc-gear.ts`'s selected mercenary and `opening-audit.ts`'s
previous cycle propagates inferred `any` into candidate calculations. ESLint
reports34 unsafe operations. Behavioral regressions alone did not detect this.

Evidence: `p15-maintained-opening-types-v1.log` and
`p15-maintained-opening-lint-v1.log`, with completed exit receipts, in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

Affected system: campaign QA, root sole writer. Correct inference at the two
origin values with existing domain types; preserve assertions and calculations.
The previous cycle has its explicit domain type; merc candidates have a typed
projection contract and the fielded ID is captured outside the loop. Initial
merc annotation alone did not remove callback inference failures, recorded in
the v2 logs. Scoped TypeScript11.811s and explicit-file lint12.992s pass in the
v3 receipts. Adapter/audit/dispatch40PASS preceded the final candidate typing.
No gameplay-data edit, suppression, commit or publication.

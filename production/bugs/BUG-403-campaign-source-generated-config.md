# BUG-403 — Campaign source collection hashes transient Vite config modules

- Severity: Medium — valid measurements fail provenance when another local check loads its config.
- Status: Fixed and verified locally; causal regression, strict types, full lint and independent review pass; v3 clean campaign measurement accepted technically, with its gameplay draw preserved.
- Environment: local WSL Vitest1.6.1/Vite5, native earned campaign harness.

## Reproduction

Start a local Vitest check alongside a campaign measurement. Vite briefly writes
`vitest.config.ts.timestamp-<milliseconds>-<hex>.mjs` at the repository root.
If source collection observes it before asynchronous deletion, the unchanged
production source fails the terminal source-stability assertion.

Expected: hash real source/config inputs; build-loader temporary output is not
an authored config input. Real config edits must still invalidate a measurement.
Actual: the broad root Vite/Vitest config-name matcher selects generated modules.

## Evidence and intended correction

Retained `p15-earned-act5-amazon-javelin-poison2-v2` in the root-owned
`d2-counted-source-z3jj3xa1` packet: only root generated file
`vitest.config.ts.timestamp-1793362201298-a89bf1938b17b8.mjs` disappears.
Data and campaign manifests are stable. V1 was separately invalidated by an
actual CombatScreen source edit. Neither attempt is acceptance evidence.

Exclude only the exact root filename pattern produced by installed Vite's
config loader. Keep real config coverage, recursive source hashing and strict
missing-file failures. Version and disclose the changed collection policy.
Regression checks must distinguish real configs, exact generated modules,
malformed near-matches and matching-looking names under `src`.

## Correction and verification

The collector excludes only installed Vite's exact generated root timestamp
module shape. Policy `production-source-v2` discloses the exclusion. Real root
config modules/workspaces, malformed near matches and same-looking names under
`src` remain inputs; missing selected files still fail. No production source
coverage or campaign outcome assertion was relaxed.

RED:4intended generated-file failures/19passes; GREEN:23passes/10unrelated skipped
cases in the explicit diagnostic provenance describe. Real config add/edit/delete
and generated-file neutrality are tested, including actual observed names and
empty random-hex suffix. Scoped strict types and final full zero-warning ESLint
pass; independent review APPROVE. Retained `bug403-provenance-*` receipts/logs
preserve failed setup attempts as well. V1/v2 campaign attempts remain invalidated.

## Clean measurement

Fresh `p15-earned-act5-amazon-javelin-poison2-v3` passes the native harness and
source-stability assertions while the ordinary unit check runs concurrently.
The unchanged 720s wrapper exits 0 after 70.268s, with no timeout or owned descendants
remaining. Policy `production-source-v2`, all 2015 source entries and all 55 campaign
entries match before/after. SourceTreeHash is
`fb073384807db251dba81a94bc947d5bbb48a3b86a7785d9b0ee2c8dca1e18e4`;
dataHash is `bcf423217db17794f8e4dd2a6f01f78e00797686fe3a6a736acec0c24b756390`.
Both snapshots truthfully record dirty Git state. Exact identities are retained in
[v3 identities](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-javelin-poison2-v3-identities-v1.json),
with the [terminal receipt](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-earned-act5-amazon-javelin-poison2-v3-run-exit.json).

The valid bounded screen stops at its first nonwin: Dark Wood W4 draws at 60000ms,
after 302 wins/303 played waves; hero 325 HP/71 MP, two Dark Stalkers retain 81+7 HP,
and the nonwin pays 0 XP/0 items. The compressed journal repeats v2's raw trajectory
byte-for-byte; v2 remains invalidated. This verifies the collector correction,
not route completion, a causal balance improvement, or earned build viability.
No input, route, budget, outcome assertion or reward was changed for v3; no retry
followed. Root retains the evidence through umbrella acceptance.

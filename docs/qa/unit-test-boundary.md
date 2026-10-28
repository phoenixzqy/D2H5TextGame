# Ordinary unit tests and production diagnostics

Default Vitest commands run the `engine`, `ui` and `sim-contracts` projects in
`vitest.workspace.ts`. The contracts project contains constructed classification
controls and helpers; it does not prepare saved gameplay realms or run policies.

`vitest.diagnostics.workspace.ts` separately retains the original production
diagnostic tests. `test:sim:contracts`, `sim:production`, `sim:earned` and
`sim:modes` explicitly select that workspace. Their historical names do not make
them ordinary unit checks. Diagnostic execution requires its own applicable
authorization and prerequisites; these commands remain prohibited in the current
plan execution. Do not list/discover them through Vitest as a safety check.

The root `vitest.config.ts` runs `assertUnitTestBoundary` before loading ordinary
tests. The check parses source as data using the installed TypeScript parser.
It audits supported default discovery and setup, aliases, runtime imports and
re-exports, literal/local-const dynamic imports, mock loaders and literal globs.
Erased type imports do not introduce runtime dependencies. It rejects runtime
edges into `tests/sim` outside `contracts`, unresolved loads, unsupported startup
or resolution settings, duplicate/computed configuration keys and source symlinks.
New configuration forms require extending and reviewing the audit first.

This structural preflight is not a JavaScript sandbox: declared installed
packages are trusted, and arbitrary evaluated/generated code is outside its
model. Keep ordinary tests dependency-clean and review new runtime loaders.
The preflight audits the default workspace; it does not authorize an explicit
diagnostic workspace or arbitrary CLI configuration override.

Run the source-only audit with `node scripts/check-unit-test-boundary.mjs` and
its temporary-source regression controls with `npm run test:boundary`.
The latter removes each exact temporary fixture directory and asserts absence.
CI runs those controls before its existing ordinary coverage gate.

[BUG-371](../../production/bugs/BUG-371-ordinary-suite-closed-harnesses.md)
preserves the historical unfiltered-suite boundary breach. A later ordinary unit
pass covers the revised default inventory; it cannot reclassify that stopped run
as passing or establish earned gameplay, pacing, balance or release acceptance.

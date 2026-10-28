# Fresh-lineage filesystem root resolution

Date: 2026-10-28 UTC. Base: `876cef98a4705761eb9a8624cf3c079e90e1cf3e`.
Status: current-source root-expression correction validated; corrected implementation
approved. The original native collection failure remains terminal.
This fixes test-tooling ancestry resolution only; no native experiment is run.

## Cause and minimal correction

Installed Vitest 1.6.1 `NormalizeURLPlugin`
(`node_modules/vitest/dist/vendor/cli-api.OdDWuB7Y.js:10272`) replaces the
`import.meta.url` base in a literal `new URL(relative, import.meta.url)` with
`self.location` for non-SSR transforms. Its jsdom base uses an HTTP origin,
which Node's `fileURLToPath` rejects. Vite-node otherwise supplies a file URL
for module metadata (`node_modules/vite-node/dist/client.mjs:261`).

The current `.once.ts` source now converts `import.meta.url` directly with
`fileURLToPath`, then uses `dirname` and `resolve` for filesystem ancestry.
Only the `node:path` import and root initializer change. No exception handler,
URL fallback, dependency, runner setting, timeout or product behavior changes.

## Regression and safety boundary

The new ordinary `fresh-lineage-root.test.ts` uses real jsdom under the existing
sim-contracts project. It reads the actual native entry as source text and
extracts its root initializer with the installed TypeScript parser. An AST
allowlist admits only literal strings, `import.meta.url`, `resolve`, `dirname`,
`fileURLToPath` and `new URL`; all other expressions are rejected before execution.
The generated module contains only fixed Node path/URL imports and that single
exported expression. The native entry, policy, launcher and stores are never
imported. Eight negative controls reject process calls, imports, nested effects,
interpolated effects, generic type arguments on calls/new, duplicate roots and
a missing root. Generic import-type strings are rejection-only parser inputs;
they never reach module emission or execution.

Two generated checkout roots have the same four-directory source nesting:
one ordinary path and one with spaces/Chinese characters. Their modules are
loaded through installed Vitest/Vite, asserting the exact filesystem ancestor.
Unique disposable fixtures live inside the claimed checkout's existing Vite
serving boundary. Exact file/directory paths are tracked and removed after
owned import promises settle; no recursive/shared-directory removal occurs.

The first `primary-red` run fails to load fixtures outside Vite's serving root:
two failed/six passed, native1. It is fixture-setup evidence, not target RED.
After moving fixtures inside the existing boundary, the unchanged old source
expression fails both actual root assertions with `ERR_INVALID_URL_SCHEME`:
`primary-red-target`, native1, two failed/six passed. After the two-line correction,
the identical regression passes all eight cases: `primary-green`, native0.
No native experiment is used for either RED or GREEN.

## Implementation review correction

Independent review found URL-01: the initial AST guard ignored TypeScript
`typeArguments` when emitting raw JavaScript. An import type inside generic
arguments could therefore be interpreted as executable JavaScript. The actual
root initializer contained no such syntax, and no unsafe import was observed.
Two rejection-only cases first fail against the old guard (eight passed/two
failed, native1); rejecting type arguments on both call/new makes all ten
focused checks pass, native0. The stale full-final run was cancelled by SIGINT
to its verified task-owned Vitest PID, native130, with no acceptance credit.
All five owned processes were verified absent before code edits. Independent
corrected-source review approves with security pass/no findings, receipt SHA256
`c34421626190a708607462d72cca72c269f3e2e6370d9068f3cd0effe8f314c7`.

## Current validation

Final checks all return native0:

| Check | Result | Wall time |
| --- | --- | --- |
| Focused primary-guard-green (session 10473) | 10 passed | 4.516s |
| Unfiltered full-reviewed (session 36377) | 21,252 passed, two skipped; 994 files | 936.992s |
| Typecheck-final (session 19530) | no errors | 108.587s |
| Lint-final (session 68427) | zero warnings | 202.575s |

All four preserve the same 1,873 executable/data/config/test inputs at
`2cc2afac6cbffdadfd26c6688895e15ebdbc5cfa8a1e34c2d59483c31922d4fc`.
Both exact skipped full names remain unchanged (each begins with one suite-space
in the JSON report):

- `fresh-campaign-continuation.test.ts`: ` runs one declared authentic saved-domain Rocky Waste continuation and restores its caller`
- `fresh-campaign-economy.test.ts`: ` runs one bounded authenticated earned farming policy and restores its caller`

No `.once.ts` entry appears in ordinary discovery. All checks have zero before/after
source differences and zero historical packet differences. A read-only cleanup
assertion initially compared JSON `title` with the leading-space `fullName`;
correcting the report-field comparison verified these unchanged skips without
changing source or rerunning tests.

This is a new current-source map, intentionally distinct from the historical
frozen experiment map; no historical approval is claimed for the changed source.

## Historical result and acceptance limits

The sole native attempt remains terminal collection failure at commit
`876cef98`, with no registered test or gameplay observation. Its original source
and frozen manifest/reviews/launcher record remain unchanged in Git and its
retained packet. All historical packet file hashes match before/after each new
validation. The old manifest now differs from current source, and its exclusive
launcher record still spends the sole invocation. No launcher/preflight was
executed, marker removed, manifest/approval rewritten or replacement policy made.

Passing the root-only regression does not prove full native-entry collection,
creation/save/load, combat, fresh progression, earnings or actual IndexedDB/browser
behavior. The earlier failed attempt and its acceptance limits remain unchanged.
Other open bugs, 212 bounded/one unverified skill inventory, earned economy/
affordability/pacing, 14 builds × five acts, whole-app locales/devices/a11y/
performance/PWA, actual CI and human/soak/full-v1 acceptance remain unresolved.
H3 stays terminal failed-no-app; no browser retry/new card, publication, merge
or deployment. The umbrella goal and claimed worktree remain active.

## Evidence retention and cleanup

Raw RED/GREEN/final logs/results/maps, reviewed plan, reviews and exact cleanup
receipts remain under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-url-collection-yqldjuhh`
through unfinished goal/review consumers; root owns eventual verified cleanup.
All 84 logged fixture file/directory paths are verified absent, including dangling
symlinks; no fragment directory remains in the source parent. Recorded full-run
process identities have exited. The applied scratch draft is removed after prior
reader release; exact absence is recorded in `final-boundary-cleanup.json`, with
cleanup failures[]. Shared caches and the claimed worktree are retained.

# BUG-650 — Check the complete Vite tooling project

Status: fixed in retained working tree (not committed). Severity: Medium.
Owner: technical-director.

## Reproduction

Source: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working changes, 2026-11-03, WSL/Node CLI.
Browser, viewport, locale and combat seed: not applicable.

1. Run `node node_modules/typescript/bin/tsc --noEmit --project
   tsconfig.node.json --tsBuildInfoFile <task-local temporary file>`.
2. Observe exit 2: TS2802 in `scripts/precompile-save-validators.ts:36`
   and three TS6307 errors at `vite.config.ts:9–11`.

Expected: the project's supported Node runtime and all imported build scripts
are checked. The normal `npm run typecheck` must also cover tooling.

Actual: the tooling project defaults to ES5 and omits the three precompilation
scripts imported by Vite. Its iterable loop cannot compile at that target;
composite project membership rejects the imports. The normal typecheck runs
only the app project and does not check the referenced tooling project.

Evidence: root tool session `14254`, exit 2 in 1.950 seconds. Exact diagnostics
and pre-change source hashes are retained under prefix
`p19-tooling-types-v1` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The diagnostic's temporary build-info directory was verified removed.

Affected systems: Node/Vite/Vitest/Playwright tooling types; no gameplay
behavior or browser failure is inferred. BUG-089's unsupported workspace
worker setting has already been moved to the root and is not this failure.

Root cause: the standalone tooling configuration and validation entry point
were not updated when the build-time validator scripts were added.

## Repair plan

Use the existing ES2022 target (compatible with the declared Node >=20
runtime), explicitly include the three imported scripts, keep strict/composite
checks, place normal compiler metadata in the dependency cache, and add the
tooling project to the standard typecheck command. Verify this project only;
reserve the combined app check for the final source gate.

Plan review: ready. Security check: pass; local compiler configuration and
validation only, with no dependency, network, permission or CI change. Preserve
the existing root worker bound and all accumulated source changes. No commit,
push, installation, browser run or campaign replay is needed.

## Resolution — 2026-11-03

`tsconfig.node.json` now targets ES2022 and lists all three imported validator
scripts. Strict/composite checks remain enabled. The ordinary build-info path
is `node_modules/.cache/tsconfig.node.tsbuildinfo`. `package.json` now runs
`tsc --noEmit && tsc --noEmit --project tsconfig.node.json` for `typecheck`,
so tooling errors cannot be hidden behind a successful app-only check.

The original tooling command passes (exit 0, 1.906 seconds), with its build
metadata redirected to a task-local temporary directory and then removed.
The checker produced composite metadata; both source-membership and iteration
errors are gone without suppressions or reduced compiler checks. The six
inspected Vitest/Vite/validator source inputs retain their pre-change hashes.
`p19-tooling-types-v1-green.json` records the command, output, source hashes and
verified cleanup beside the RED receipt. Root retains these two receipts
through umbrella review and owns eventual cleanup.

No app-wide typecheck, unit suite, build, browser or combat run is claimed for
this tooling-only fix. Combined app/tooling validation remains a final-source
gate. The existing reproduction command is the regression check; no new
implementation-mirroring test was added. Full private v1 remains incomplete.

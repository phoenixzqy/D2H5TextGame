# BUG-598 — Register precompiler directory watches outside module loads

Status: Fixed locally; independent umbrella review pending. Severity: High (development gameplay boot blocked; production build remains usable).
Owner: root, technical-director/frontend responsibility.

## Reproduction

Source authority49 `efd2948569458e464c2292415e852731ab255548d497f8ba73cc49bbb4447537`;
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Local Vite5 development server,
Chromium147, desktop1280×800/mobile360×640, fresh zh-CN startup. No engine seed applies.

1. Start the configured Vite development server with a clean task-owned cache.
2. Open the game or run the save-management/offline-bonus-reopen browser tests.
3. Vite transforms the generated authored validator virtual modules.

Expected: all virtual modules resolve and the ordinary game boots.
Actual: Vite import analysis fails to resolve `src/data/schema` as an import
from the authored virtual module. A separate actual HTTP check of the save plugin
passes; it has no proven directory-import defect and is unchanged. The affected
E2E run was stopped at this boot error;
it is not evidence of failed save/reopen behavior.

## Evidence and diagnosis

External packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-storage-e2e-v1.log`/JSON/retained failure traces; `bug598-plan-v1.json`.
The interrupted Playwright process3888201 exited130 after task-owned SIGINT.

Vite5's LoadPluginContext.addWatchFile adds each watched path to `_addedImports`.
Import analysis resolves those entries as module dependencies. A directory has
no module entry, so directory watch registration inside load prevents boot.
Move only directory registration to buildStart, whose context registers watcher
paths without adding module imports. Keep actual file dependencies in load and
all invalidation/recovery logic. No validator or save-format change is required.

Workaround: the production build works. Development boot must be repaired before
normal local browser verification can continue. No user answer is required.

## Local fix and verification — 2026-11-02

Move only authored schema-directory registration into buildStart. Keep actual
file dependencies in load and existing invalidation/failure/recovery behavior.
The two authored HTTP-import regressions fail before the fix; all53focused
cases pass afterward (`bug598-red-v6.json`, `bug598-green-v1.json`). Scoped
strict types and changed-file lint pass. The save-plugin HTTP control passes.

`bug598-live-watch-v2.json` verifies real operating-system edit/failure/repair
events through HTTP and SSR, with metadata retained and no stale validator
fallback. The earlier v1 diagnostic disabled HMR and timed out waiting for an
HMR event; correcting that driver configuration required no application change.
All14targeted save/offline browser cases pass across the final scoped runs,
after the separate BUG599test timing correction. Authority50 records the fix.

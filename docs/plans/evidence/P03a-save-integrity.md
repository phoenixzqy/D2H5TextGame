# P03a — Save integrity

Status: accepted implementation slice, 2026-10-20.
Base `9e0ef64`; implementation commits `6f1dafd`, `76db166` (integrated source head).
Documentation-only ledger/evidence updates follow that source head.
This accepts P03a, not full D12, F14 restart coverage, G1 or G6.

## Behavior and prior failure

Save/Export capture current live progress before the 500 ms debounce. Import
migrates and validates before replacing anything, orders behind old writes,
persists before live replacement, resets transient combat, restores all slices
and reseeds item IDs. Invalid imports preserve disk/live progress. Storage
failures remain visible; live export and navigation preserve unsaved progress.
Corrupt/future startup saves are protected against automatic overwrites.
Delete clears every character domain only after disk deletion succeeds; a
failed delete resumes saving and reports the error.

Initial reproduced result: 5 failed / 6 passed in save-management tests:
first Save missing, stale currency, imported character not hydrated, malformed
v7 accepted, corrupt hydration partially changes player. See
`production/bugs/BUG-001-save-management-integrity.md` (repository root).
Review found unsafe player levels, canceled autosave after failed delete,
recovery navigation reload, and native Map validation bypass. All have
regressions; Map bypass was reproduced as 3 failed / 22 passed before fixing.

## Verification

Node 24.21.0, npm 11.19.0, Linux Ubuntu 26.04, Vitest 1.6.1, Playwright 1.59.1.
Browser: exact locked Chromium headless-shell revision 1217, 147.0.7727.15.
Installation required Playwright's `ubuntu24.04-x64` host override on this
unsupported host; the matching binary launched and all listed cases executed.
These are local runtime results, not supported-host CI or final performance proof.

| Command | Exit / result |
| --- | --- |
| `npm run test:engine` | 0; 37 files, 342 tests passed, 5.08 s |
| `npx vitest run src/stores/save-management.test.tsx src/stores/persistence.test.ts --reporter=dot` | 0; 33 passed, 6.38 s |
| `npm test -- --reporter=dot` | 0; 85 files, 796 passed, 1 existing skipped, 26.33 s |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, including engine purity |
| `npm run build` | 0; 12.97 s; existing chunk-size and optional manifest precache warnings remain |
| `E2E_PORT=4287 npx playwright test tests/e2e/save-management.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-save-management-results-layout` | 0; 10 passed, 35.4 s |

Unit/build/browser commands ran concurrently; timings are wall-clock evidence,
not comparable budget benchmarks. Existing RTL act/router warnings remain.
The skipped merc XP case remains P13, not newly disabled by this work.

Browser tests use ordinary creation/settings/navigation/export/import controls.
Imported names exercise save transport, not earned campaign progression.
Both en and zh-CN round-trip immediately and after reload. Malformed import
preserves live/disk state. Layout covers 360×640, 412×915, 640×360,
1280×800, 1920×1080 without horizontal overflow and with 44 px export targets.
The recovery test injects an IndexedDB platform write failure, then navigates
normally and exports the latest unsaved sound preference. It does not inject
game-store state. An earlier run caught a banner covering desktop navigation
(9 passed / 1 failed); reserving layout space yielded the final 10/10.

## Independent review and security

QA/reviewer `qa_save_review`: approved core source after all four findings
were resolved; no remaining blockers found. Producer: approved final reserved
notice layout in ScreenShell/HomeScreen; requested this durable evidence.
Reviewers inspected source; command execution belongs to the root integrator.

Security check: pass. Scope: owner plan, local save/import/export changes and
review findings. No actionable unsafe request found. Imports are untrusted,
structurally validated before IO/state replacement; no new network export,
dependencies, credential handling or validation bypass.

## Remaining and artifacts

Full offline timing/last-active authority and real close/reopen bonus remain
P17; no claim of production offline cache acceptance. Cross-tab simultaneous
writers are outside this single-session ordering proof. Full campaign, every
skill, inventory overflow/crafting, quests, economy and endgame remain pending.

Disposable task-owned E2E outputs, build output and Vite cache are removed
after validation, retaining this report and regression sources. Shared browser
cache and installed dependencies remain installed. Worktree source/history
remain on `feat/playable-foundations`; no PR/push/merge performed.

# P17b01 — Production offline gameplay acceptance

## Current physical-format verification — 2026-11-04

All four original desktop1280×800/mobile360×640 × en/zh-CN cases pass on the
current logical-save33 source: **4/4 in28.2s**, no retries/skips/flaky results.
Only the test's native readonly observer changes: decode `encoding:'json-v1'`
payloads, retain unencoded object reads, reject unsupported/invalid envelopes.
Every whole-save, activated-worker, SW document/loaded-JS response, offline
navigation/combat/save, locale/overflow and reconnect assertion remains intact.

BUG-673's original observer demonstrably failed before any combat by comparing
the physical JSON string with an exported object. Its failed report/trace and
before/after source remain in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-native-reader-v1`.
`browser-green.json`, `results-summary.json` and scoped type/lint logs bind the
passing verification. Production output/source hashes are those of the
[integrated offline reward slice](p17-integrated-rewards.md), reused without a
second build. Its one production change fixes passive Settings-notification
input interception (BUG-672). All five repository bridge scans pass.

All consumers are terminal and preview ports4326/4396closed. Exact task-created
builds, unexpected `dist` (verified unchanged against its original766-file
manifest), both temporary configs and types config were removed and verified
absent. Packet `cleanup-closure.json` records exact paths and no failures. Root
retains both evidence packets and the active human2 worktree through umbrella
review, and owns eventual evidence cleanup/release. No install/CI/publication,
game/save-format edit, broader suite or completed campaign replay occurred.
Other old observers, worker replacement at final source, physical installation,
idle/MF and full P17/v1 acceptance remain separate requirements.

Dependency head: `6354bd8` (runtime source through `e21545c`). Four-file slice:
dedicated production config, offline browser spec, D12 control and this report.
No runtime, dependency, CI, save schema or gameplay data changed.

## Acceptance and results

The dedicated config lives under `tests/pwa`, outside the existing development
and bridge-enabled production test discovery. Its webServer always runs
`npm run check:test-bridge-shake` before preview and never reuses a server.
That guard clears VITE_E2E, builds production and scans emitted JavaScript for
test-bridge identifiers. Browser assertions also require no `window.__GAME__`
before and after offline reload. The config is covered by the existing tests
TypeScript project; no compiler/lint exclusion was introduced.

Fresh ordinary Sorceress creation and locale selection establish a real Save
and downloaded backup. Require an activated worker controlling the document,
then freeze the clock, verify the complete saved payload and disable context
network. Both offline reloads require successful service-worker document and
entry/loaded JavaScript responses, complete exported/real-IDB save equality,
current localized settings and no page errors. Downloads are deleted after use.

Offline Town, inventory, skills, mercenaries and map all render without overflow;
the latter four were first visited offline. Enter Blood Moor through the map,
use ordinary Skip and require numeric wave1 advancement or a terminal run panel.
End/flee through ordinary controls before final Save/export/IDB and same-clock
offline reload. The outcome-derived postcombat baseline proves persistence;
it is not an independent reward or balance oracle. No log-text outcome guesses,
game bridges, injected game/storage/lifecycle writes or forced clicks.

| Check | Observed result |
| --- | --- |
| `PWA_PORT=4326 npx playwright test --config=tests/pwa/playwright.config.ts --output=/tmp/d2h5-p17b01-browser-final` | 4/4 passed, 37.4 s; en/zh-CN × desktop1280×800/mobile360×640; fresh guarded production build included |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, including engine-purity scan |
| `npx eslint --no-ignore tests/pwa/playwright.config.ts tests/pwa/offline-gameplay.spec.ts --max-warnings=0` | Passed on final source; tests are normally ignored by repository lint |
| Combined runtime unit gate at `e21545c` | 112 files, 1275 passed / 1 existing merc-XP skip, 34.07 s |
| Combined runtime engine gate at `e21545c` | 42 files, 497 passed, 8.43 s |

Unit and engine gates ran concurrently; durations exceed their15s/3s budgets
and are not performance certification. Subsequent changes through this slice
are browser tests/control/evidence only. Existing large-chunk, stale Browserslist
and optional2.57MB art-manifest precache warnings remain. Host is Ubuntu26.04,
Node24.21.0, Playwright1.59.1/shared Chromium147; unsupported-host caveat remains,
so these results do not replace supported-host or physical-device certification.

## Failed attempts and review

First attempt failed4/4 at a premature harness state assertion:
serviceWorker.ready may resolve with its active worker still activating. Wait
for actual document controller.state=activated with a bounded poll. Second
attempt failed4/4 because the test expected an18character name despite the
shipped input's16character limit. Use the valid name `Offline hero`. Neither
failure was a runtime defect or a gameplay RED. Third attempt passed4/4 in38.1s.
Producer then required unconditional offline Town coverage; final source adds
that visit and a stricter numeric-wave assertion. Final matrix passed above.

Root source/control review and producer independent final source review APPROVE.
Security check: pass; trusted local acceptance commands, readonly native save
observation and ordinary shipped controls, with no new credentials/permissions,
dependencies, remote writes or runtime debug surface.

## Limits and cleanup

This accepts the warmed production-cache reload/navigation/combat/save path.
It does not certify installation prompts, Lighthouse, service-worker replacement
across two versions, unavailable optional-art explanation, earned campaign,
fullG6/P17 or v1. Existing UI copy/support and update-safety gaps remain open.

After all consumers/processes finished, removed and verified absent:
root worktree2 `dist`, `node_modules/.vite`, `/tmp/d2h5-p17b01-browser-1`,
`/tmp/d2h5-p17b01-browser-2`, `/tmp/d2h5-p17b01-browser-3`,
`/tmp/d2h5-p17b01-browser-final`. Failed harness traces/screenshots were disposable;
their decisive failures and corrections are recorded above. Playwright stopped
its own server; no task server remains. Shared tools/browser caches retained.

# P17a07 — Ordinary close/reopen bonus acceptance

Base: `88189a2`, including lifecycle `22e2461`, shared UI and BUG-023 fix.
Ownership: this evidence report and `tests/e2e/offline-bonus-reopen.spec.ts` only.
Runtime is unchanged. This slice does not accept full P17 or v1.

## Acceptance protocol

Use ordinary character creation, locale selection, downloaded export, import
dialog and Save controls to establish one known inactive v7 tuple. Verify the
Save completes and the real IndexedDB payload equals the complete expected
fixture before closing the page. Storage observation uses native readonly
transactions; no game bridge, injected store/storage writes, forced pointer
actions or injected lifecycle events.

The installed Playwright clock is context-wide. Install and pause once, retain
the same BrowserContext/IndexedDB, then close the old application page before
creating a new blank page and setting its wall clock. Navigate only afterward.
No storage clear occurs after setup. Every new page has a pageerror listener.

- A = 1792454400000: saved inactive tuple 1/0, offlineTime 123.
- B = A+3600000: new page startup persists/displays 1.08/1200, adds exactly one
  hour to offlineTime, and preserves every unrelated save field. A second actual
  page close/new page at the same B must preserve complete expected equality.
- C = B+600000: deliver online timers without a write-producing action. Poll the
  real saved payload for a timestamp in [B+570000,C]; compare the entire payload
  to the known B fixture explicitly decayed to that bounded timestamp. Then
  ordinary Save at frozen C must durably contain exactly 1.04/600.
- D = C+180000: close before advancing away time. Startup preserves the stronger
  existing 1.04/600 and adds exactly three minutes to offlineTime. Same-D actual
  close/reopen must retain complete expected equality again.

Each reopen verifies translated banner, compact chip, accessible label, saved
locale and no horizontal overflow. Both en/zh-CN run in the configured desktop
1280×800 and mobile 360×640 projects.

## Validation

The first ordinary browser execution passed all four cases in 26.9 seconds.
No failed harness attempts, weakened complete-save oracles, new-test RED claim
or runtime fix. This accepts the existing page-startup/checkpoint wiring.

| Check | Result |
| --- | --- |
| `E2E_PORT=4324 npx playwright test tests/e2e/offline-bonus-reopen.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p17a07-browser-1` | 4/4 passed, 26.9 s |
| `npm test -- --reporter=dot` | 111 files, 1256 passed / 1 existing skipped, 38.51 s |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, including engine-purity scan |
| `npx eslint --no-ignore tests/e2e/offline-bonus-reopen.spec.ts --max-warnings=0` | Passed; browser specs are normally ignored by repository lint |
| Production build | Not rerun for this test/document-only slice. Unchanged runtime's prior passing build is recorded in BUG-024 (6.67 s), at the dependency source head. |

Unit validation ran alongside the browser/type/lint checks. The 15-second full
unit budget remains unmet; these are observed wall-clock results, not a budget
benchmark. Existing React act/router and Browserslist-data warnings remain.
The single mercenary-XP skip predates this slice.

The complete payload oracle preserves the known character, player stats,
backpack/equipment, currencies, mercenaries/formation, map/quests, settings,
gacha state and every other unrelated field through both away intervals.
Startup's real disk record is checked before the ordinary export at every
reopen. Quiet online proof reads disk before the later explicit Save, so Save
cannot disguise a missing periodic checkpoint. Expected decay is calculated
from known B values and the independently bounded checkpoint timestamp.

Security check: pass. Scope is the approved local acceptance test and evidence;
only native readonly storage observation, ordinary validated import/save UI,
trusted Playwright clock control and task-owned local outputs are introduced.
No dependencies, credentials, permissions, CI, runtime or save format changed.

Independent root and producer final source/control reviews: approved with no
material findings. Both reviewed the complete test and evidence.

## Limits and artifacts

This proves ordinary development-server page close/new-page startup and quiet
periodic checkpoint wiring against real IndexedDB. It does not guarantee an
IndexedDB pagehide write completes after browser/process termination, prove
production service-worker/offline PWA behavior, award earned progression, or
accept reward integration, background combat catchup or full P17/v1.

All task processes and evidence consumers finished before cleanup. Removed and
verified absent:

- `/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-4/node_modules/.vite`
- `/tmp/d2h5-p17a07-browser-1`

The test deletes every downloaded export in its helper. Cleanup had no failures.
Installed dependencies and shared caches remain.

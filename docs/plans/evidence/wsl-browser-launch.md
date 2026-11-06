# WSL browser verification and owner scope update

Verified 2026-10-29 in the existing `feat/playable-foundations` worktree.
The owner removed CI from the current work and requested removal of its GitHub
Action. The owner will playtest after implementation. Local implementation and
automated verification can continue without those being implementation holds.

## Browser diagnosis

WSL2 has working X11/Wayland and installed Chromium. The historical
[H3 failure](hell-browser-prerequisite-failure.md) remains a failed attempt;
its attempt limit does not prohibit this newly authorized investigation.

The installed full Chromium executable was tested with two temporary roots.
The long root reproduces the fatal `Socket path too long` error. The same
executable launches successfully with the task-owned short root
`/tmp/d2w-gws4k1ce`, in both headed and headless modes. This establishes the
temporary socket path as the cause of this reproduced launch failure.

The default headless shell also launches successfully. The default headed path
points to an absent `chromium-1217` full-browser binary; this investigation uses
the already installed `chromium-1248/chrome-linux64/chrome`, which reports
Chromium 156.0.8078.4. No browser/dependency installation or global environment
change is needed. Scope `TMPDIR` to a short task-owned path for persistent-context
launches and select an installed executable for headed verification.

## Observed app checks

| Check | Result | Scope |
| --- | --- | --- |
| Existing `smoke.spec.ts`, desktop and mobile projects | 3 passed; zero skipped, unexpected or flaky; 23.012 seconds | Home/title/start control and mobile horizontal-overflow assertions |
| Headed desktop, 1280×800 | Pass | Public character creation, acknowledged Save, export, actual browser close/reopen, Continue and exact restored character name |
| Headed mobile, 360×640 | Pass | Same public flow and real browser persistence boundary |

The two final headed cases complete in 28.715 seconds, with no page or browser-
console errors and no horizontal page overflow in the captured town views.
All four final screenshots were inspected. Scrollable content, the tall mobile
navigation and the existing NPC fallback remain visible; this is not full UX,
accessibility or art acceptance.

These are development-server checks with real Chromium and IndexedDB. The DEV
test bridge is present by design but is never used; there is no store injection,
imported fixture, seeded gear, supplied combat seed or earned campaign claim.
Production/PWA/offline, full-domain persistence equality, import, Cobra-specific
browser scenarios, earned balance/pacing and full-v1 acceptance remain open.

## Retained failed predecessors

The first default headed probe fails because its expected executable is absent.
A first app driver incorrectly expects the test bridge to be absent in DEV;
`src/app/main.tsx` proves that assumption wrong. Its unchanged failure is retained.

An export-only close/reopen driver passes desktop but does not find Continue on
mobile. Export does not await a database Save, so the final driver uses the public
Save control and asserts its Saved acknowledgement before closing. The earlier
failure remains retained; the final pass does not prove that closing before an
acknowledged Save is durable or establish a cause for that earlier observation.
No product source or existing assertions were changed to obtain these results.

## Delivery and evidence

`.github/workflows/ci.yml` is removed as requested. The current
[acceptance contract](../playable-target.md) and [runbook](../goal-runbook.md)
use local validation and schedule owner playtesting after implementation.
Historical CI results and failed experiment records remain historical evidence.

The exact scripts, native logs, JSON reports, fresh-character exports, inspected
screenshots, source delta and cleanup receipt are retained under:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-wsl-browser-1kiidzl6`

Root owns retention through unfinished acceptance and eventual exact-path
cleanup. Disposable profiles, browser temporary files, task-local Vite cache and
smoke output are removed after the owned processes terminate; exact verification
is recorded in `cleanup.json`. Existing source, worktree and shared caches remain.

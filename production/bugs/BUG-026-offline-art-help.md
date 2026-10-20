# BUG-026 — Explain optional artwork availability while offline

- **Severity:** Medium — offline gameplay works, but Settings gives no explanation when uncached artwork may be unavailable.
- **Status:** Fixed in this BUG-026 commit (SHA supplied in handoff), 2026-10-20.
- **Affected systems / owner:** frontend-dev; Settings and localized capability copy.
- **Build:** `1167e52` dependency head, including the dedicated production PWA config/spec from `f7b6346`.
- **Environment:** Linux, Playwright Chromium desktop 1280×800, locale en; actual fresh guarded production build, activated controlling service worker, no game bridge. No seeded engine fixture is involved.

## Reproduction

1. Run `PWA_PORT=4328 npx playwright test --config=tests/pwa/playwright.config.ts --project=pwa-desktop --grep 'production en$' --output=/tmp/d2h5-p17b02-red`.
2. Create the ordinary Sorceress character, select English, await activated service-worker document control, freeze the save clock and Save/export through normal controls.
3. Disable context network without reloading. Observe `navigator.onLine === false`.
4. Require the localized Settings explanation that uncached artwork may be unavailable while combat and saves remain usable.

## Expected and actual

Expected: a visible localized offline capability note on network loss, also present when Settings first mounts offline, removed on return online. This does not assert that any particular image actually failed.

Actual: at2026-10-20 06:42UTC, the new production browser assertion failed before runtime changes: `getByTestId('offline-art-help')` was not found after the 5000ms visibility timeout. The online absence and native offline-state checks had passed. The Settings snapshot still showed the ordinary English language/save controls with no artwork explanation. One test failed; this is the requested behavioral RED, not a cache or image-failure reproduction.

Initial diagnostic artifacts: `/tmp/d2h5-p17b02-red/offline-gameplay-saved-cha-00925-ts-offline-in-production-en-pwa-desktop/test-failed-1.png`, `error-context.md` and `trace.zip` in the same directory. These disposable task-owned artifacts were removed after review; this report retains the decisive assertion/result.

## Root cause, security and scope

Settings neither observes the browser's initial connectivity flag nor subscribes to online/offline changes, and has no localized capability copy. Fix at the mounted Settings UI with owned event listeners and cleanup. No game data, cache/image fallback, asset source, save/schema or network policy changes.

Security check: pass. The task adds local UI state and translated text; browser checks use ordinary controls and read-only real save observation. No credentials, permission change, external communication, test-bridge surface or validation bypass.

## Resolution and validation

Settings now initializes from navigator.onLine, owns online/offline listeners,
resamples after listener installation and removes both listeners on unmount.
A localized plain-text note explains optional artwork availability only while
offline. No domain store publication, runtime image mapping or cache change.
Root and producer independently approved the exact five-file source/test/control
change before commit; their reviews were read-only.

| Check | Observed result |
| --- | --- |
| `PWA_PORT=4328 npx playwright test --config=tests/pwa/playwright.config.ts --output=/tmp/d2h5-p17b02-green` | 4/4 passed,56.4s; en/zh-CN × desktop1280×800/mobile360×640 |
| Guarded production build | Passed through the dedicated config's fresh `check:test-bridge-shake` build/scan; reuseExistingServer remains false |
| `npm test -- --reporter=dot --silent` | 112files,1275passed/1existing skip,36.52s |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, including engine-purity scan |
| `npx eslint --no-ignore tests/pwa/offline-gameplay.spec.ts --max-warnings=0` | Passed; browser specs are normally ignored by repository lint |

Browser coverage keeps all prior production SW document/JavaScript-response,
no-bridge, frozen-clock, complete IDB/export save equality, unvisited offline
screens, numeric wave/terminal outcome, ordinary flee/return controls and
horizontal overflow assertions. New checks require online note absence, native
offline flag after context network loss, localized note before reload with
unchanged document time origin, complete-save equality, offline reload and
Settings remount, then native online restoration, note removal and unchanged
complete save/export. No game/storage/lifecycle injection or forced clicks.
Downloads are deleted in the existing helper's finally block.

The unit suite ran concurrently with the browser/type/lint checks and exceeds
its15s budget; functional acceptance does not establish timing-budget acceptance.
No test or budget was weakened, and no mirrored unit test was added for this
small reversible note. Existing stale Browserslist, large-chunk and optional
2.57MB art-manifest precache warnings remain. Host Node24.21.0/Playwright1.59.1;
this local Chromium emulation is not physical-device certification.

After all processes and review consumers finished, task-owned `dist`,
`node_modules/.vite/vitest`, its empty `.vite` parent, `/tmp/d2h5-p17b02-red` and
`/tmp/d2h5-p17b02-green` were removed and absence verified. No task spill files,
repository test-results/playwright-report/downloads or live preview server
remain. Shared installed tools and pre-existing node_modules were preserved.

This closes the offline capability explanation only. Full P17/v1,
installation/Lighthouse, service-worker update safety, earned campaign and
observed image-failure acceptance remain separate.

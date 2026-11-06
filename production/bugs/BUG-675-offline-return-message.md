# BUG-675 — Announce the reconciled offline return

- **Status:** Fixed locally; umbrella P17/v1 acceptance remains open.
- **Severity:** Medium; bonus is applied, but launch feedback required by the spec is absent.
- **Owner / affected systems:** Root / persistence hydration and idle UI.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
- **Environment:** WSL; Vitest lifecycle reproduction, Chromium desktop/mobile, en/zh-CN. No combat seed.

## Reproduction

1. Save a normally created character and close the app for at least one minute.
2. Reopen; allow startup's bonus reconciliation to commit.
3. Read the launch feedback.

**Expected:** `docs/design/idle-offline.md` §5.2 requires localized returning-player
feedback showing the actual absence and applicable XP/MF bonus/window. A retained
stronger old bonus must be described truthfully. No direct offline income.

**Actual:** Startup publishes the hydrated character/bonus but no return receipt;
App has no returning-player message. No component can distinguish this return's
absence from the saved cumulative `offlineTime` counter.

## Evidence

`src/stores/persistence.offline.test.ts`: original source fails12 assertions and
passes58 existing cases. Exact source snapshots and `lifecycle-red.log` retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-return-toast-v1`.

## Scope

Publish only from successful durable startup reconciliation; transient hydration
metadata stays outside save format and autosave subscriptions. Suppress sub-minute
and rollback announcements. Successful exact restore/import/delete clears stale
feedback. Dismissal/remount cannot accrue or reissue the startup bonus. UI must be
bilingual, keyboard accessible, mobile-safe, and leave ordinary navigation usable.

## Resolution and verification

Transient hydration metadata publishes the actual absence and chosen bonus/window
only after durable startup reconciliation, locale loading and store installation.
The globally mounted polite toast supports keyboard dismissal and does not intercept
ordinary navigation. No save-format/reward-formula change or additional timer.

117 affected unit cases, scoped strict types/explicit lint and production build pass.
Four production desktop/mobile × en/zh-CN browser cases pass in29.1s, no retries,
skips or page errors. Real page closure/offline SW return, exact complete-save
no-income comparisons, five-size reflow,44px close target and dismissal/reopen
are verified. Original RED12/58 and all logs remain. Local source/control and
capture review finds no material issue; independent umbrella acceptance is open.
See [evidence](../../docs/plans/evidence/p17-offline-return-toast.md).
Exact temporary configs/build/results removed and port4398 closed; root retains
required packet/worktree through umbrella review and owns eventual cleanup/release.

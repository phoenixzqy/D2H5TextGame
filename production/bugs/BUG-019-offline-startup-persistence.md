# BUG-019 — Reconcile persisted returning-player bonus at startup

Severity: High (returning-player bonus never accrues across actual restart).
Status: fixed in P17a02 (implementation commit recorded in execution ledger), 2026-10-20.
Affected systems: persistence/store owner; follow-up frontend/reward integration.
Base: `8117744`; Node24.21.0, Vitest1.6.1/jsdom. Both locales share this store
path; no viewport or RNG is involved in the fixed-clock reproduction.

## Reproduction and evidence

1. Store a valid v7 character at timestamp1792440000000 with matching
   idleState.lastOnline, multiplier1/remaining0 and offlineTime123.
2. Set the local clock to1792454400000 (four hours later), reset live stores
   as a new page would, then call production `initPersistence()`.
3. Inspect the saved/live idle tuple. It remains1/0 with the old lastOnline,
   rather than persisting1.32/4800 and reanchoring to the current time.
4. Concurrent page initialization calls also independently load/publish the
   character (four reads rather than one hasSave/loadSave pair).

Initial command: `npx vitest run --project ui src/stores/persistence.offline.test.ts`.
Behavioral RED3/3 at05:52:34 UTC,3.56s: four-hour tuple unchanged; duplicate
reads; no reconciliation write before live publication. No runtime patch had
been made. The tests use real orchestration and save-adapter, replacing only
Dexie IO; they do not validate a browser restart by themselves.

Expanded13-case baseline check against the original `8117744` persistence
source:10failed/3passed,4.99s at05:55:45 UTC. This check ran after implementing
the initial three-case fix, temporarily restoring only this task-owned source
inside the claimed worktree; final source was restored in finally. It confirms
the additional read-delayed import/raw-restore races. Write-delayed cases on
that old source fail because no startup reconciliation write exists; they are
new ordering acceptance cases, not a claim of an old write-path regression.
The exact scratch backup `/tmp/d2h5-p17a02-persistence-final.ts` was removed and
absence verified after restoration. One intermediate overflow fixture used a
newer zero save timestamp, which correctly avoided overflow; corrected the
fixture to negative MAX_VALUE for both anchors, without changing runtime logic.

Root cause: startup restores idleState unchanged, while the UI hook derives
an unrelated transient window from unpersisted lastClosedAt. The latter also
remains follow-up scope; this slice corrects startup persistence authority.

## Expected behavior and approved scope

Root/producer approved four files: persistence.ts, new offline startup tests,
D12 control and this report. Reconcile via existing pure v7 arithmetic against
max(lastOnline,save.timestamp). Sample now once, persist the updated tuple and
timestamp before publishing any domain/locale or ready state. Preserve every
nonidle value and grant no XP/items/currency. Failed storage/arithmetic retains
disk/domain references/locale and blocks writes with observable recovery error.

Cache one complete page-lifetime initialization flight. Serialize startup,
raw hydration, import and delete in invocation order: Settings is accessible
while startup IO is pending, so a late startup snapshot must never overwrite
the user's replacement. Import and raw hydration retain exact P03a semantics,
with no offline accrual; replacement reserves its existing exclusion immediately.
Queue rejection must reach its caller and leave later operations usable.

This child does not establish UI/reward authority, periodic online/close
checkpoints, hidden-tick interval ownership, PWA or complete P17. It does not
claim all routes exclude gameplay/character changes during startup. Cached
startup errors recover through exact import or full reload, not same-page init
retry. Delayed IO ordering and failure cases are required regression coverage.

Security check PASS: validated local-save arithmetic and operation ordering;
no remote IO, credentials, permissions, CI or agent-behavior changes.

## Validation and review

Root and producer independently APPROVE the final source/test/D12 contract.
Final focused/related command above with additional persistence.test.ts and
save-management.test.tsx:48passed in3.94s (13new+35existing). Full unit
107files/1160passed/1existing merc-XP skip,38.74s (>15s budget); typecheck,
lint, forced changed-file lint and production build pass17.42s. Lint initially
caught test callback/undefined-gate style; corrected without suppressions or
assertion changes. Existing React/router and build large-chunk/2.57MB manifest
precache warnings remain. No browser/PWA/performance acceptance follows from
these results. Browser restart proof belongs to subsequent shared UI/reward/
lifecycle integration; exact final evidence/cleanup is retained in ledger.

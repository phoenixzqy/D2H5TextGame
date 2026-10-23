# Book of Skill Claim and Read transactions

2026-10-23. Builds on definitions `94e66eb` and v12 storage `2d0d94f`.
This implements the feature boundary; Inventory UI, Atma, localized quest copy
and earned Act II acceptance remain unfinished.

Claim grants the authored5000XP and an owned unread book, with no immediate
quest skill point. Read accepts the exact source-bound owned entitlement,
grants the JSON-defined one skill point and persists its consumed receipt;
it grants no XP. The ledger is independent of backpack/stash capacity.
Both operations share one transaction lock, including all restoration attempts,
and honor readiness and Iron Golem ownership guards. Full ledger validation
precedes writes. Production hero/merc XP progression and safe-integer preflight
prevent partial or overflowing rewards. Restoration attempts cover every
participating store; an AggregateError reports restoration failure explicitly.

BUG098 exposed Date/Map and inherited native ledger shapes accepted or erased
before validation: genuine6RED/74controls. Plain or null-prototype records,
own-key source/objective checks and raw validation before normalization fix
the boundary for transactions and save decoding.

The initial transaction run had25failures/9controls. A subsequent mercenary
oracle incorrectly assumed the authored Rogue starts at level1; it now compares
the real before-state plus3750XP. Persistence exercises Claim, Save/reset,
Continue/import unread, Read, Save/reset, Continue and repeated consumed import
with exact player/inventory equality and no duplicated XP or skill points.
Failure injection covers grant stages, rollback, nested operations in both
directions, restoration failure/retry, unrelated ledger corruption, full gear
containers and arithmetic limits. Initial type-narrowing and lint failures were
corrected; their logs remain with the successful runs.

Final frozen source/tests: focused242tests/6files, engine4283/110 and
**full8850/287 pass** (195.54s, over the documented test budget). Typecheck,
lint and production build pass. All four production JS chunks pass the five
test-bridge patterns. Existing chunk-size and manifest-precache warnings remain;
this is not performance acceptance. Independent QA APPROVE/security PASS with
no material findings. No browser or server was started for this slice.

Raw logs, bridge scan and cleanup/ownership receipts remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-book-transactions-egvdwhnu`.
All validation handles are terminal and review readers released. Exact disposable
dist cleanup removed760files/41062213bytes; remaining[]/failures[]. Twenty
diagnostic files remain through D11/C2/full-v1 consumers; root removes them after
those consumers finish. Shared caches and original checkout remain untouched.

No UI, integrated browser, earned C2–C4 or full G0–G7 acceptance follows.
Local implementation only; umbrella goal and worktree claim remain active.

# BUG-515 — Reconcile two old fixture assertions with accepted source contracts

Status: local uncommitted fixture corrections; affected checks passed. Severity: Low. Owner: root / QA.
Environment: WSL, Node24.21; pure engine, no browser/locale dependency.
Base HEAD: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, current dirty source.

Reproduction: run the three files recorded by `bug514-green-v1-exit.json`.
The focused enemy cooldown regression passes; two unrelated literal fixtures
fail. Fixture seeds are7 for planner roles and46 for player summon stats.
Exact command, failures and before-source bytes are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

Expected: assertions retain the established BUG506 Sarina boss/trash/trash/
trash/trash roles and BUG496 owner-level summon growth. Actual: the old caster
fixture still expects five bosses; the Skeleton fixture still expects level1
body stats for a level5 owner. Both values are established before any summon
death, so the BUG514 death-refund side check cannot produce either difference.

Correct tests only: explicit per-case escort tier (ActIII trash, ActV boss),
and literal Skeleton rank6/owner5 values282HP/91Attack/35Defense
(rank-only162/35/19 plus four levels of30/14/4). Preserve count, identity,
source, rank, level and all outcome/immutability checks. No production change.
See `docs/plans/decisions/P15-skeleton-owner-growth-v1.md` and the retained
BUG506 regression/evidence. This reconciles stale assertions, not a balance
change or relaxation. Run the corrected cases and scoped types/lint only;
retain the other39 passing cases from the original affected run.

Security check: pass; local fixture literals only. Independent review remains
open; root is the sole writer. No campaign or full-suite completion inferred.

## Completed local verification

Completed: bug515-corrected-v1 passes3cases (corrected Sarina and Skeleton
assertions plus the parameterized control); bug515-types-v1/lint-v1 pass.
The original39 unaffected passes remain retained. Before bytes and all failure
logs remain in the packet. No production balance values changed.

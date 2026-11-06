# BUG-410 — Give Fallen Panic Flee a real death-triggered reaction

Status: fixed locally; 67focused/247combined cases, strict types and scoped lint PASS.
Full sweep terminal; all35initial failures covered by final focused PASS. Severity: High.
Owners: engine-dev/content-designer; game-designer/QA.

Environment: private implementation worktree, HEAD b5a0898 with existing local
changes, Node24.21.0, locale/viewport independent pure engine; seed7.

1. Build bundled Fallen/Dark One/Devilkin through the native factory/default registry.
2. Observe their first normal action with no shaman death.
3. Expose Panic-only with an original shaman dying to periodic damage at500ms;
   inspect native dodge inputs and resulting status-state timeline.

Actual: generic Weak Melee suppresses both Panic and ordinary attacks. Exposed
Panic casts without a death, creates a permanent marker, and grants neither
physical nor magical dodge. Native CD4 disagrees with authored CD5.
Expected: the bounded [adopted contract](../../docs/plans/decisions/P15-fallen-panic-v1.md),
including once-per-wave shaman-death reaction and actual finite dodge.

Evidence: `src/engine/combat/monster-panic.test.ts`, initial32cases21RED/11controls;
packet `d2-counted-source-z3jj3xa1/p15-panic-red-v1{.log,-exit.json}` under the
session zai-temp root. Wrapper exit1 is expected assertion failure, no timeout
or live owned descendants. Tests directly observe bundled action suppression,
missing dodge, invalid original qualification and marker/registry acceptance.
No numerical or campaign acceptance inferred. Source cause: stub-only semantics
and no battle-owned trigger/expiry state; reordering alone cannot repair it.


Implementation, retained intermediate failures, independent APPROVE and exact
artifact ownership are recorded in [P15 evidence](../../docs/plans/evidence/p15-fallen-panic.md).
No numerical/campaign acceptance; BUG087 remains open for84numeric rows.


Full sweep collection:1186files/25178tests,25143PASS/35initial failures in the
same14repaired files. Final17files/247PASS covers all initial failed files;
strict types v2 PASS7.733s. Aggregate evidence is reconciled explicitly, not
reported as a clean one-shot invocation. See linked Panic evidence.

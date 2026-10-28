# BUG-339 — Require Countess originals in their actual final teams

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — malformed victory evidence can satisfy a quest proof predicate.
Owner: root quest integrator / engine-dev.
Affected systems: Countess original-actor victory evidence (not wired live yet).

## Reproduction

Base `b7bf3595912f7c461ad825382c989baaa91b8adc` plus the uncommitted
Countess pure slice; Vitest1.6.1/jsdom, seed7, constructed engine fixtures.
No browser viewport, locale-dependent strings or earned gameplay involved.

1. Capture the canonical level13 Countess and a living original hero.
2. Mark that original Countess dead in a player-winner outcome.
3. Move the original hero into finalEnemyTeam, move the Countess into
   finalPlayerTeam, or swap both arrays. Preserve their original side tags.
4. Evaluate hasOriginalCountessVictory.

Expected: all three malformed final layouts refuse. Each original must appear
exactly once in its proper team, with no cross-team duplicate identity.
Actual: all three return true. The cross-team duplicate control already refuses.

## Evidence and cause

Independent design_contracts review identified that the predicate concatenates
the teams and trusts each unit's side tag. The new causal run
`final-team-membership-red` reproduces3 failures/1 passing duplicate control,
exit1/4.056s wrapper. Source/tests/log/process/receipt and review are retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/`.
Root owns verified retention/exact cleanup after dependent consumers finish.

Correct membership in the predicate while preserving immutable captured IDs,
kind/side/life/source checks and cross-team duplicate rejection. No live quest
admission, proof publication or Claim implementation is credited by this helper.

## Final correction

The original hero and Countess must each appear exactly once in their proper final team, including cross-team duplicate rejection. Regressions: src/engine/map/countess-admission.test.ts and countess-boundary.test.ts.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.

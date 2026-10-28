# BUG-345 — Countess request falls through to ordinary combat

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — wrong encounter starts; quest source is inaccessible in the map.
Owner: root quest integrator / frontend.
Affected systems: map action, combat route admission and terminal continuation.

## Reproduction

Base b7bf3595 plus uncommitted Countess backend, Vitest/jsdom with real native
recordings, constructed strong gear fixture and tracked Countess row. Both en
and zh-CN are covered; no genuine gameplay or balance evidence is claimed.

Run `npx vitest run src/features/combat/CombatScreen.countess.test.tsx`.
Enter `/combat?questEncounter=act1-dw-countess` with an inherited Dark Wood idle
target; also try unknown, empty, duplicate and mixed endgame values, and stale
proof, untracked, wrong-area and Nightmare states.

Expected: map offers an explicit manual Countess action, invalid/stale requests
refuse without mutation, and the optional run never loops or offers ordinary
next-area continuation.
Actual: map action is absent; the screen parses only endgame and starts its
ordinary/idle path for quest encounter parameters.12/12UI cases fail before
correction. Evidence: `countess-ui-red.log` and immutable process/receipt under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/`.

## Correction and validation

Parse finite encounter requests with mixed/duplicate refusal. Select the
explicit manual source through the existing guarded transition. Preserve
trusted in-flight origins/recovery, block reused unrelated runs, localize map,
refusal and location copy, and suppress idle/ordinary continuation. Root owns
retained diagnostic artifacts through review and exact cleanup.

Follow-up UI run:3fail/11pass. Refusal heading used an incorrect i18n path
for both locales, and an unrelated in-flight run was correctly refused but
rendered the dungeon refusal instead of quest refusal. Exact pending Countess
publication recovery passed. Correct the two presentation classifications.
Evidence: `countess-ui-followup-red.log`.

Independent UI review found two P1 boundaries: invalid quest queries were ignored
with any existing origin; Countess map travel changed location before readiness,
combat or lease admission. Add causal live-origin and guarded-travel tests before
repair. The prior whole lint passes, build passes, and typecheck reports one
request-parser union narrowing error (BUG340). Heading failures also reveal the
new refusal screen inherited a non-heading title; give that title an h1.

## Final correction

Finite localized query parsing, guarded travel before mutation, existing-origin refusal and trusted queryless recovery are integrated. The optional source never inherits idle or ordinary continuation. Regressions: src/features/combat/CombatScreen.countess.test.tsx,20Countess cases within69passing UI/map/combat tests. Production browser8/8 and independent UI rereview APPROVE.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.

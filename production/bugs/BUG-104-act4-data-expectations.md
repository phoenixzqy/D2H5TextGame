# BUG-104 — Align closed data expectations with the Act IV contract

Status: correction verified; fix commit recorded in the Act IV delivery evidence.
Severity: Low (test assertions; no observed player-facing defect).
Owner: root / QA.

## Reproduction

At `409f0918b62a8b32a9aba0aa7a0815cdadfa0cff`, run
`npm test -- --cache=false`. Node/Vitest; browser, viewport, locale and seed
are not applicable to these deterministic data-loader assertions.

Expected: catalog tests match the ratified Act IV definitions while still
rejecting definition drift. Actual: four assertions retain the Act III-only
Soulstone shape, single-action domain, item list and reward-kind count.
The run has 9674 passing and four failing tests.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a4-delivery-lsw5xgtt/final-full.log`.
Affected files: `src/data/loaders/{guardian-source,khalim-source,quest-items,quests}.test.ts`.

## Root cause and correction

[The Act IV contract](../../docs/plans/decisions/D11-compact-act4-contract.md)
explicitly adds the two-input Hellforge action, reciprocal Soulstone consumer,
source-bound Hammer and generic gemShards reward. Update exact expectations
accordingly. Keep invalid-action fixtures otherwise complete so their negative
assertions exercise the intended mutation rather than a missing Act IV action.
No product behavior or source validation is relaxed.

## Verification

Focused374/4 PASS; complete9678/338 PASS (239.65s), engine4501/123 PASS
(63.60s), typecheck and full lint PASS. No skipped/disabled assertions or
runtime changes. Root-owned logs `catalog-focused.log` and `corrected-*.log`
remain in the diagnostic directory above. Independent QA correction review
APPROVE/security PASS; reviewer ran no tests.

# BUG-350 — Verify the restored Imbue Claim campaign graph

Status: Fixed in `8b72ca433a7537fe3db189fb9b844797b278abea`; final integrated checks/reviews pass; evidence retained.
Severity: Medium — routine failure can leave unrelated campaign damage unreported.
Owner: root quest integrator / QA.
Affected systems: D11 main and side Imbue Claim rollback.

## Reproduction

Base988883ee plus current uncommitted D11 implementation. Constructed real-store
Vitest fixture, Normal side Claim with actual consumed Malus and Present proof,
no Baal reward. No genuine save, earned gameplay, replay or browser acceptance.

1. Subscribe to inventory publication.
2. When its side charge appears, set questDifficulties to
   { 'difficulty/nightmare': true } without campaign proof, then throw once.
3. Inspect the result after all named participants restore.

Expected: restore scoped participants, preserve the unrelated unlock write,
and throw AggregateError because the full campaign graph remains invalid.
Actual from independent source review: restoration skips graph validation and
returns ordinary grant-failed. A related existing test also inserts an invalid
unrelated ledger source while expecting routine failure; it must retain the
write while expecting explicit unresolved damage.

## Evidence and correction

Independent design_contracts read-only review found the omitted final graph
check in src/features/quests/imbueClaim.ts. Task evidence root:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-imbue-db_hdus5.

Add ledger and full current campaign validation after all-attempt scoped
restoration. Preserve staged publication: the charge precedes claimed-last.
Do not erase unrelated observer writes or infer entitlement. Native imbue-claim-restoration-red failed2/passed22, exit1; both injected observers reached the missing AggregateError boundary. Corrected imbue-claim-restoration-green passed147tests/6files, exit0, unchanged inputs. Independent actual corrected source review APPROVE. Final integration remains pending.

## Final integrated verification — 2026-10-27

Fixed in `8b72ca433a7537fe3db189fb9b844797b278abea`. The focused regressions
remain in the test paths above. Final whole typecheck/lint/build, engine10,340/395,
full20,656/977(twoexistingoptinskips), and production browser8Charsi+4level-up
cases pass on unchanged1,848runtime/test inputs. Independent source binding,
browser-artifact and combined packet reviews APPROVE/readersreleased.

[Final evidence and exact retained paths](../../docs/plans/evidence/d11-charsi-selected-imbue.md)
records original failures,64persistence pairs, verified771-member retention and
exact raw cleanup with remaining[]/failures[]. This is bounded constructed
functionality, not earned/balance/full-v1 acceptance.

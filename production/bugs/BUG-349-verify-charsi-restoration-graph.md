# BUG-349 — Verify the restored Charsi campaign graph

Status: Fixed in `8b72ca433a7537fe3db189fb9b844797b278abea`; final integrated checks/reviews pass; evidence retained.
Severity: High — rollback can return a routine grant-failed while replay selection remains invalid.
Owner: root quest integrator / engine-dev / QA.
Affected systems: D11 Charsi Present/Restore/Imbue scoped rollback.

## Reproduction

Base988883ee plus local Charsi implementation. Native Vitest1.6.1 UI project;
constructed real-store fixture, no browser/viewport, no genuine save or replay.
Use canonical campaignEvidence to unlock Nightmare, earn the source in Normal,
select one ordinary native normal weapon, then switch to unlocked replay.
The item/source exact D11 seed is used; no global or combat RNG is advanced.

1. Run the new unresolved campaign graph case in charsiImbue.test.ts.
2. During the inventory publication observer, delete difficulty/nightmare and throw.
3. Inspect the result after all item/source/hero/map participant restorations.

Expected: preserve the unrelated unlock deletion, restore all named participants,
and throw an AggregateError explicitly reporting that campaign validation still
fails. Returning grant-failed must not claim verified restoration.
Actual from source inspection: the final restoration check compares only named
preimages/ownership and omits the campaign graph. A routine grant-failed can
therefore leave Nightmare selected without its unlock. Native causal proof and
correction follow below; no implementation acceptance is claimed yet.

## Evidence and root cause

Owned root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-imbue-db_hdus5.
Independent design_contracts read-only review found the omitted graph() boundary.
Add graph validation to the existing all-attempt final verification. Do not erase
unrelated writes or infer entitlement as a workaround. Keep original failures.

Native charsi-restoration-red reaches the observer and fails at the missing
AggregateError assertion:1failure/54passes, exit1, unchanged inputs. All named
participants restore, but the original implementation does not report the
unresolved graph damage. The correction adds graph() to the existing final
all-attempt restoration check. Native charsi-restoration-green passed194tests/6files, exit0, unchanged inputs (receipt runId fc1ed54e-5796-4d0f-be54-967e36921122). Both sources and weapon/armor success cases are covered. Independent corrected actual source review APPROVE; final integration remains pending.

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

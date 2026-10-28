# BUG-348 — Verify source-bound imbue Claims and restore participating proof

Status: Fixed in `8b72ca433a7537fe3db189fb9b844797b278abea`; final integrated checks/reviews pass; evidence retained.
Severity: High — a dropped charge or XP grant can still consume a promised reward.
Owner: root quest integrator / engine-dev / QA.
Affected systems: current23 imbue source graph, main/side whole-bundle Claim.

## Reproduction

Base988883ee plus the prepared D11 graph/Claim regressions and initial current-only
source admission. Environment: local native Vitest1.6.1 engine/UI projects;
constructed real-store fixtures, en/zh resources, no browser/viewport or RNG action.
No genuine progression is used.

1. Run `npm test -- src/engine/save/imbue-source-graph.test.ts src/features/quests/imbueClaim.test.ts`.
2. Give the main row its actual consumed Malus graph, or side its exact Present receipt.
3. Inject a silent charge drop, silent hero/merc XP failure, or deep proof mutation during Claim.

Expected: independent exact charges, main3500hero/2625previously-fieldedmercXP,
side charge only; failed publication restores participating preimages and does
not consume Claim. Acquisition refuses replay while historical claimed requests
remain write-free.
Actual: initial66cases produce47failures/19passes. After current-only graph
admission,47pass/19fail: seven current save schema refusals and twelve Claim
failures. Main silent charge/heroXP/mercXP failures return ok, deep mutation is
not restored, replay acquisition is available, and side still authors an
unsupported random item. Several initial refusal passes were vacuous; the later
main publication failures actually reach their injected boundaries.

## Evidence and cause

Root retains exact native process/input/log/receipt evidence in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-imbue-db_hdus5`:
`imbue-graph-claim-red` and `imbue-graph-first` prefixes. No timeout/assertion/
discovery/worker/skip weakening occurred.

Generic Claim's shallow snapshots and claimed-only postcondition cannot provide
the D11 participating graph/XP/charge contract. Use a bounded source transaction
with deep scoped preimages, captured merc recipient, checks after every payment,
claimed-last, and all-attempt verified restoration. Current23 alone must admit
Present; literal22 and version-only migration remain frozen. No workaround or
repeated Claim is authorized for genuine saves.

## Independent review: refuse before construction

Read-only source review found that the new exact Imbue bundle guard follows
unique/profile/table materialization. A supported but forbidden unique itemDrop
can advance the item ID sequence before returning unsupported-rewards. Prepared
main/side regressions observe the real rollUniqueItem constructor without
replacing its behavior; snapshots alone cannot detect this allocation. Move the
one exact-bundle guard before resolution/materialization, retain final bounded
publish dispatch, and prove causal RED then GREEN. Correction pending.

## Local correction and causal verification

Current-only graph admission and bounded deep Claim publication now pass all
45 graph cases and 23 Claim cases; existing Cain Claim and en/zh level-up
regressions bring imbue-allocation-green to92 passing tests/four files, native
exit0 with unchanged inputs. Main/side allocation regressions first failed
causally (imbue-allocation-red:2 failures/21passes) because the real native
rollUniqueItem constructor ran once before refusal. Moving the single exact
bundle guard immediately after parsing, before profile resolution/materialization,
removes that side effect. Independent source rereview: APPROVE, no remaining
material finding in this bounded graph/Claim slice.

The earlier imbue-source-engine run was interrupted (tool exit143, no native
receipt, both recorded PIDs absent), so it supplies no passing engine/full gate.
Preserve its original log/process/input files. Present/Restore/selected-instance
use/UI, browser/save-close-Continue and integrated gates remain open. No earned
progression or balance acceptance is claimed by these constructed fixtures.

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

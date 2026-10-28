# BUG-351 — Scope Charsi action feedback to the displayed context

Status: Fixed in `8b72ca433a7537fe3db189fb9b844797b278abea`; final integrated checks/reviews pass; evidence retained.
Severity: Medium — stale success copy; no reward or action authority bypass.
Owner: root frontend integrator / QA.
Affected systems: new Charsi Present/Restore/Imbue panel.

## Reproduction

Base988883ee plus current uncommitted Charsi UI. Constructed real-store React
fixture in Vitest; no browser, genuine save, earned progression or replay.

1. Render Charsi with a real Malus hand-in and an eligible normal backpack item.
2. Explicitly Present it and observe the successful unchanged-item message.
3. While the panel remains mounted, replace the actual hero with an equal
   same-ID object, remove the Present receipt, or change difficulty.

Expected: do not display a previous action's success in the changed context.
Actual from source inspection: local feedback remains ok, and the empty-panel
guard uses that old value. The old Present success survives context/proof loss.
The ordinary Settings import route probably unmounts Town first; a real browser
import reproduction is not claimed. Source/item witnesses still refuse stale
operations, so the defect is display-only.

## Correction and evidence

Independent frontend_log_release follow-up confirmed the bounded display state.
Capture the actual hero reference and act/difficulty after each action returns.
Display feedback only while they match; successful Present additionally requires
its retained receipt. Do not clear success merely because Present became
unavailable after completing it. Preserve actionable failure/guard messages.
Task evidence root:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-imbue-db_hdus5.
Native charsi-feedback-red failed3/passed11, exit1, unchanged inputs: actual successful Present messages remained visible after hero replacement, receipt deletion and difficulty change. The correction scopes feedback after the action returns; native charsi-feedback-green passed95/3files, exit0, unchanged inputs. Independent frontend source rereview APPROVE; production-browser and full integration remain pending.

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

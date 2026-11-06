# Counted-reader candidate rejected — 2026-11-03

The counted-reader candidate passed correctness checks but failed the frozen
browser selection rule. Mobile transfer median increased from 937.327 ms to
1015.112 ms (+8.30%); desktop decreased from 203.831 ms to 196.412 ms. All four
candidate files were restored byte-for-byte, preserving the selected stable-card
fix and all unrelated work. All 2,147 baseline production inputs authenticate
after restoration. BUG592 remains open; no performance acceptance is claimed.

## Candidate and bounded verification

A retained profile showed duplicate authored counted-definition loading inside
one complete live-ledger query. The candidate returned that query's freshly
validated definitions, preserving fresh reads, accessor rejection and full-ledger
validation. Native/historical validation defaults were unchanged; there was no
cross-request cache or save-format change.

The duplicate-load regression failed on the original code (two loader calls
instead of one). All 293 distinct affected candidate cases then passed: save
validation 121, counted loader 12, inventory pagination 10, quest-items panel 16,
counted actions 33, counted claim 91 and counters 10. Initial scoped TypeScript
and lint failed on the new fixture's readonly/dynamic delete. Replacing it with
Reflect.deleteProperty fixed that fixture; its single affected case, scoped
TypeScript and explicit lint passed. Nine name-filter exclusions in the red and
corrective runs are not additional test passes. Passing checks were not repeated
after exact restoration to the authenticated baseline.

One real-Chromium comparison reused the retained stable-card baseline and the
same independently earned 8,540-backpack/499-stash save. Ordinary UI import and
transfer preserved complete public/native saves, surviving card identity,
100 rendered cards and access to the last item in all four contexts. There were
no page/console errors or horizontal overflow. Mobile samples at 360×640,
zh-CN and 4× CPU were 1015.112, 1062.533 and 915.164 ms; desktop at 1280×800,
en and 1× CPU was 196.412 ms. Mobile longest tasks were 389–468 ms. These are
profiled development-localhost measurements on a shared host, not representative
device or release-budget acceptance. No timing retries were run.

## Provenance and disposition

The frozen plan required a lower mobile median and desktop no more than 110%
of baseline. Mobile failed; the candidate is rejected even though functional
checks and the desktop condition passed. All four candidate snapshots and all
2,147 measured source hashes authenticate. The exact four before snapshots were
restored and every baseline input rechecked. Authored gameplay data is unchanged.

Browser session 88287 exited 0; its report records successful cleanup. Exact
candidate Vite and test caches are absent. Required raw results, source snapshots,
CPU profiles and screenshots remain under the root-owned evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
indexed by `bug592-counted-reader-v1-closure.json`. Root retains these through
umbrella review and owns eventual cleanup, together with the existing human2
worktree. No disposable task cache remains.

No combat, training, purchases, canonical progression or CE-family allowance
was consumed or renewed. Act V remains 13/19 main quest actions and formal
balance 0/210 encounter cells. Private v1, BUG611 build viability, BUG592 runtime
performance and independent review remain open. Browser launch works; CI is
excluded and no user answer is pending. Reuse this rejection evidence and do not
repeat this candidate or completed campaign checks.

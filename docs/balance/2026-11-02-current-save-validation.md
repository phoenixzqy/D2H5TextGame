# Current-save validation scan — 2026-11-02

Current-version saves now enter the complete public validator directly, avoiding
the migration path's redundant descriptor scan. Historical decoding keeps its
existing migration and validation sequence. The restoration/cache-repair tail
is extracted unchanged into a private helper. No save version, data, snapshot
isolation, validation policy or durable write ordering changes.

## Verification

The regression reproduces two graph scans before the fix and one afterward.
Mutation-after-decode cases still reject hidden, symbol, prototype, Map-key,
Map-value and Set-value getters without executing them, and reject cycles.
All 164 affected cases across eight files pass: validation, descriptor safety,
recruitment33, respec21, socket19, historical sockets, frozen32 and persistence
lifecycle. Scoped strict types, changed-file ESLint and engine purity pass.
No campaign or unrelated test suite is replayed.

One production build is compared to the exact archived preceding build in one
Chromium instance with the same HTTP implementation and fresh contexts. Public
Import → Save → Export → controlled reload → Export preserves the complete
7,413-item earned save at desktop1280×800/en and mobile360×640/zh-CN. Both have
one startup save read, an activated service worker, no errors or horizontal
overflow. Desktop and mobile screenshots were inspected.

| Profile | Reload before → after | Import before → after | Longest reload task before → after |
| --- | ---: | ---: | ---: |
| Desktop | 2,199 → 1,788 ms | 2,166 → 1,202 ms | 929 → 590 ms |
| Mobile, 4×CPU | 7,682 → 7,580 ms | 4,579 → 5,259 ms | 3,559 → 3,081 ms |

These are single profiled localhost samples, not device, percentile or budget
acceptance. Mobile import is slower in this sample; BUG592 remains open. Nine
alternating native decode timings have medians1,098→766ms but substantial
warmup/variance; do not infer a general percentage improvement from them.

## Provenance and retention

Authority48 checks all2,139 implementation inputs. Only validate.ts and its
regression test change from authority47; all authored data and the canonical
earned70/Normal1314/Hell961/7,413-item checkpoint remain byte-identical.
Current source hash: c86b5d0da3de5d4a9e624309d465058617c9352b00019a99b6dfbc5aa00cfb59.

Evidence is retained under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1:
`bug592-current-*` reports, drivers/configs, RED failures, source snapshots,
screenshots/CPU profiles and exact gzip production assets; authority48.
The comparison process6281 exited0. Its owned build/candidate/baseline caches
are absent; the owned type-info file was removed and the test cache is absent.
Root retains this required packet and the active worktree through umbrella
review, and owns eventual cleanup/release.

The 14-route chronology evidence is also closed into the current handoff,
without replaying combat or rewards. Recruitment/economy is the next substantive
track. Runtime/storage/inventory budgets, current14-build fairness/holdouts,
retry/manual-idle,30–50active-hour pacing and integratedG0–G7/two-hour soak/
independent review remain before owner playtest. Accepted balance0; full-v1
active. Browser works; CI excluded; no pending answer or external blocker.

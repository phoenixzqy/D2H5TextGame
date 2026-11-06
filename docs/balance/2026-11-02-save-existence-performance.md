# Save existence and single-load startup — 2026-11-02

BUG592 now checks the exact IndexedDB primary key without fetching its payload.
Startup uses one ordinary validated nullable load to handle both present and
missing storage, removing its separate existence preflight. There is no cached
existence result or validated-state exemption. Save decoding, migrations, offline
reconciliation, write serialization, restore leases and publication ordering
remain in force. Empty damaged runtime still requires recovery; storage failures
remain observable. No save version, data, schema, reward or combat rule changes.

## Evidence

The unchanged authority38 earned save reproduces eight full native IndexedDB
gets for eight existence checks, plus two full gets during Settings startup.
Focused RED has exactly two resource failures: one unnecessary value read by
`hasSave()` and two full reads during concurrent initialization instead of one.
An initial external Vitest config failed to discover tests; its output is
retained and excluded from test evidence.

Final affected coverage is 158 distinct passing cases across six save/startup/
offline/checkpoint/receipt suites. The first GREEN has 156 passes and two stale
fixtures that delay a second read. Those fixtures now delay the sole load;
import/delete ordering assertions remain, with an added null-player assertion
while storage is pending. All four parameterized ordering cases pass on rerun.
Filtered assertions never count as passes. Final global strict types and scoped
four-file lint pass. No unaffected suite, engine simulation or campaign runs.

Real Chromium147 uses desktop1280×800/en and mobile360×640/zh-CN with4×CPU.
The same public file import, explicit Save, ready-gated reload and public export
preserve all7,413backpack items and the complete native migrated33 save. Only the
declared desktop locale differs. Actual native IndexedDB get/count wrappers
record calls without changing arguments or results. Empty storage returns false;
existing saves return true. Both contexts have no page/console errors or
horizontal overflow. Screenshot inspection shows intact Settings/save controls;
this is not full accessibility or release acceptance.

| Diagnostic | Desktop before → after | 4×CPU mobile before → after |
| --- | --- | --- |
| Median existence check, eight calls | 32 → 1 ms | 137 → 2 ms |
| Full value reads for eight checks | 8 → 0 | 8 → 0 |
| Native key-count requests for eight checks | 0 → 8 | 0 → 8 |
| Full value reads during startup | 2 → 1 | 2 → 1 |
| Ready-gated reload, with CPU profiling | 3.454 → 3.488 s | 10.337 → 10.073 s |
| Longest reload task | 1.113 → 1.199 s | 5.173 → 5.022 s |

These are development-server diagnostics with automation/profiling overhead,
not physical-device Web Vitals or acceptance percentiles. Desktop reload does
not improve; no uniform startup speedup is claimed. The change removes measured
storage/deserialization waste. Cold startup still needs material work.

A separate Python readback checks every current source manifest input, exact
four-file source delta, both native browser result sets, original driver hashes,
actual test assertion statuses, unchanged canonical earned70/Hell961 source and
exact disposable cleanup. It is an independent calculation by root, not an
independent reviewer. Authority39 has2,130inputs, source hash
`bb0d92b22cfed57f4a4a71773eed5b73aee475af5f7d57f0e5d1a6d2208dec04`;
data hash remains
`f52d5e4ff3995f9b5b23ac13f168e744ad22ca0c7be0d50985adc204ecc862dd`.

## Rejected schema screenings

Before this storage fix, bounded in-memory screens investigate the retained
schema compilation hotspot. Moving rules to referenced functions is refused by
unchanged strict typing; it is not integrated or worked around. Required-field
loops and combined required/enum loops preserve exact admissions/errors across
287 authored rows and1,157 variants, but measured20-catalog validation takes
2,426/2,661ms versus1,154ms baseline. These single warm Node screens do not
justify a browser candidate. No schema/compiler option change is kept, and no
unaffected tests or repeated campaign runs follow those rejected probes.

## Handoff and cleanup

Ongoing retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Required stems: `bug592-save-existence-*`, `bug592-browser-existence-v1-baseline*`,
`bug592-browser-existence-v2-candidate*` and both browser drivers, plus
`bug592-schema-functions-probe-v1*` and `bug592-schema-loops-probe-v1*`.
All raw failures, corrected results, source captures, CPU profiles and screenshots
remain reviewable. The exact test/browser caches, task tsbuildinfo and generated
external-config modules are absent; all owned processes are terminal. Root
retains this packet and active human2 worktree through full-v1/umbrella review,
and owns eventual removal/release. No agents, installs, commits, pushes or CI.

BUG592, startup/storage/runtime budgets and soak remain open. Representative
funding/Hell income variance, chronological14-build fairness/holdouts, defeat/
retry/manual-idle,30–50active-game-hour pacing and integratedG0–G7/independent
review/later ownerplaytest remain required. Accepted balance0; no pending answer
or external blocker. Decision60/handoffv12/indexv11 are current; goal stays active.

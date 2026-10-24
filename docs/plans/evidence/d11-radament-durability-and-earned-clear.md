# D11 — Radament calibration and genuine earned clear

2026-10-24; runtime `28f6a9e2d029cb30f3d29a9df71a3cb19edb15a7`, local only.
Root implementation/self-review/audit; independent design/source/QA acceptance
pending. Full private v1 remains the objective.

## Implemented calibration

[Decision](../decisions/D11-radament-durability-v1.md) records one frozen candidate:
only Radament's JSON life820–1020→500–620 and growth82–102→50–62 change.
No formula, attack, mitigation, skill order, mummy, loot, deadline or save change.
The correctly calculated but uncalibrated native22 boss envelope falls from
7626–9486HP to4650–5766HP. This is an explicit new root numeric reconciliation,
not recovered prior approval or an arithmetic correctness claim.

The [balance report](../../balance/2026-10-24-radament-durability.md) retains the
bounded before/after results and outstanding coverage. The exact current earned
input, equipment/points and ordinal256 apply in both revisions. Native full-area
screen1–32 improves17→32wins; separate holdout33–64 improves17→31wins. Boss
victory p50/p95 is36.244/42.432s and40.664/46.852s after tuning; no deaths.
All64 first-four-wave pairs have identical outcomes, durations, XP and gear
counts. The separate optimistic1000boss-wave sample improves515→991wins.
One native holdout and nine isolated draws remain, not hidden or retried.

## Causal regression and final checks

Two production-data regression tests fail before the JSON edit and pass after.
They exercise the actual planner's22boss/four ordinary mummies, the Normal22
and Nightmare42 life envelopes, every non-life field and following RNG.

Initial typecheck passed; full lint rejected an unnecessary guard after a test
type assertion. The lookup is now checked before its assertion. That setup-only
correction preserves the original behavioral RED; original failed logs remain.
Corrected scoped lint and final serial validation all pass:

| Check | Result | Wall time |
| --- | --- | ---: |
| Typecheck |pass|31.459s|
| Full lint / engine purity |pass|72.103s|
| Engine |5483tests /164files pass|56.811s|
| Full unit |11283tests /425files pass; two existing skips|362.325s|
| Production build, VITE_E2E unset |pass; all7JS files bridge-free|10.799s|

1076source/config/test hashes remain unchanged throughout validation and the
browser run;760built files and3browser inputs have no drift. Full Vitest reports
361.07s. Existing test-time, bundle and PWA precache budgets remain unresolved;
no broader gate follows from these successful checks.

## Actual earned attempt256

Production Chromium en360×640 imports the unchanged actual attempt255 final,
raw SHA256 `5105a89cc1584baa2a4aea3140147965d1c54bb2570c16e29d70512df7a32573`.
There are no extra transfers, allocations, farming, supplied runSeed, bridge,
Skip or playback-speed changes. Historical Date is pinned while native timers
run; this is not an ordinary-clock first-clear pacing measurement.

Exactly one ordinary Enter consumes256→257. All five native waves win:

| Wave | Hero XP | New gear |
| --- | ---: | ---: |
|1|3060|6|
|2|3600|7|
|3|3990|95|
|4|4400|39|
|5, original Radament and guards|1100|5|

Native settlement marks Far Oasis cleared and the tracked original Radament
objective completed. Explicit Claim separately grants5000XP and one unread
bound Book, with no immediate quest skill point. Reading it grants exactly one
unspent point and leaves its consumed receipt. Precombat, victory-unclaimed,
claimed-unread and consumed states each pass exact Save-close-new-page Continue.

Final: L24/XP81002, one unspent skill point,6124unique owned gear. All5972
ancestral item payloads are conserved;152new items,21150total heroXP,
22564shards,45wishstones, El/Amn/Sol/Dol and six gems are genuinely earned.
Current120HP/102MP, equipment/priority/allocations, crafting receipts and
Nightmare0/endgame0 remain preserved. Radament is completed/claimed and its Book
consumed. Next Normal ordinal is257. Never restore an earlier save to replay256.

Root audit validates18native save records and all four durable pairs. Browser
retries, page/console errors and diagnostic errors are zero. Source/built/input
drift is empty. These observations establish this historical earned continuation;
they do not establish fresh-current C2, on-level balance or an earned later act.

## Retention and remaining work

[Retained final](fixtures/earned-radament-attempt256/retained-final.json.gz), raw
SHA256 `a22721de7f38951892de573d7994ccab3d4ddfa44b62148a28a5afff426012ee`,
and [manifest](fixtures/earned-radament-attempt256/manifest.json) preserve lineage.
The verified raw archive has75original records /1,644,383bytes, SHA256
`29ce21b090f562c6524f1b0f8c5505ca2f8e09652221780d958cd8ec7cb0f2d7`.
Retention stdout was finalized after archive closure; its archived empty record
and final hash are explicitly distinguished in manifest postArchiveMetadata.

All task processes are terminal and preview4407 is closed. Exact task-owned
`dist` is removed; `downloads` is absent; cleanup remaining[]/failures[]. Raw
diagnostics remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-calibration-79tbdt04`
for independent review and full-v1 campaign consumers. Root removes that exact
retained diagnostic set after those consumers finish; shared caches are preserved.

Next use the genuine final/next257 to advance the remaining ActII campaign,
including Arcane Sanctuary/Duriel, and inspect the next actual damage/power
envelope before further tuning. No blind retry or simulated-state promotion.
C0/C1 remain accepted. Earned ActsII–V/C2, seven classes/all213skills/builds,
economy/30–50active-hour pacing, C3/C4 and fullG0–G7 remain open.

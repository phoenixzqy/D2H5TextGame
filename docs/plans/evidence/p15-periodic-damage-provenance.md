# P15 — Periodic damage provenance

2026-11-05; BUG-748 fixed locally. Full private v1 remains unfinished.

Retained Druid Act III events lost periodic source/status/type at the pooled
damage boundary. New `dot.provenance` preserves committed rate × overlap
integrals in HP-ms, interval bounds, raw whole damage and pooled fractional
carry. Expired sources survive intervals without emissions and quiet gaps.
Speculative lethal searches do not collect reporting data. Damage arithmetic,
absorption, timing, event order, RNG and Blood Golem recovery are unchanged.

These are not per-source integer or post-absorption HP shares. Carry may come
from an earlier interval. Totals cover intervals ending in emitted dots;
terminal fractions that never emit are outside report totals. Missing damage
types remain unknown. P15 wave and population reports keep actual periodic
damage separate, aggregate observed integrals and count missing provenance
events and historical waves. Historical records are not backfilled. The new
event field is optional; save format/version is unchanged.

## Verification

Original RED results reproduce missing provenance at engine/report boundaries.
The 92 distinct affected cases pass: six provenance, 40 periodic timing,
23 Holy Shield, seven wave observation and 16 population cases. The final
six-case engine run covers the last source/type identity assertion; earlier
runs overlap and add no extra coverage count. Scoped strict TypeScript 5.9.3
checks 919 files with zero diagnostics; explicit six-file ESLint passes.

Source self-review covers committed-only capture, immutable earlier events,
expiry/gaps, mixed identities/types, carry conservation, shield separation,
determinism and legacy unknown coverage. No material issue remains in this
slice. Security check passes: local additive diagnostics, no dependency,
network, credential, permission or CI change. This is root self-review, not
independent acceptance. No broad suite, campaign replay, new population sample,
browser/server or balance tuning was needed. Exhausted budgets remain closed.

## Evidence custody

Exact retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-periodic-provenance-yavz9r44`.
It holds the plan, original implementation copies, incremental diff, final
source snapshots/hashes, RED/GREEN/type/lint logs and closeout/inventory receipts.
All three final check handles exited 0; no task server/browser/cache was created
and no disposable artifact remains in the packet. Root retains the packet
through full-v1 acceptance, then removes it after consumers finish.

Historical campaign counts remain 14/14 intended Normal builds and 210/210
checkpoint sources; formal balance acceptance remains 0/210. This change adds
diagnostic coverage only. Next address outstanding progression, acquisition and
active-hour pacing from retained evidence without renewing exhausted runs.

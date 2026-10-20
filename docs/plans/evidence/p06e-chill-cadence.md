# P06e — advertised Chill action cadence

Status: scoped engine repair; full private-v1 acceptance remains open.
Chill now applies its authored 0.5 attack-speed multiplier without mutating base
stats. Remaining action progress survives onset/refresh/expiry; Freeze continues
to suppress attempts without pausing the clock. No campaign, earned-clear,
balance or previous native-draw causality claim follows from this repair.

## Contract and causal evidence

[D04](../decisions/D04-chill-cadence-v1.md) defines exact half-open activity,
phase preservation, actor reselection, fractional clocks and tie/deadline rules.
Card A (84a0388) adds the closed JSON definition/schema and validated immutable-copy
loader. Its missing-import RED ran zero assertions; it is representation-only.
Actual Card B authored Ice Bolt/Frost Nova apply Chill at 1300 ms then incorrectly
act at 1700 ms. The independent oracle is 30100/17, 3700, 5400 ms. Original frozen RED
has 20 failures/3 controls, 2.455 s; one startup-at-zero fixture assertion was separately
wrong. Independent QA/producer approved its correction before corrected RED:
20 failures/3 controls, 2.597 s. BUG-053 was filed before the runtime patch.

Runtime SHA f9aed90b5b9e68fcf235d7064b23048c5bfc8fae400ca217da6fcad260988f9b
replaces raw due times with private atomic `{at,period}` records. One scheduling
helper serves initial units, native summons and post-action attempts; changed
periods rescale nonnegative remaining progress. Startup effects, shared status/
death/mana settlement and action effects reconcile schedules; actors are then
reselected. Death removes its schedule. No public API/save/RNG/stat mutation.

The 23 timing cases cover actual authored skills, legacy/future/refresh/expiry,
hero/merc/summons, clamps/fractions, exact ties, Freeze, genuine terminal/rebased
crosswave, lethal/orphan ordering and inclusive 60000 ms. Existing Frost fixtures
were independently approved at SHA 9fe69fdc0e2c933c4ae4b728b3adf27fc0a6f287f713b0f192e4b0a944da9828;
all damage/mana/status/cooldown/RNG assertions remain. The complete 154-event
no-Chill recording and result match prepatch exactly. Normal/recorded replay
and input immutability remain tested.

## Final validation and preserved failures

Final timing test 9d3afdbde44b2db8c00e4dc03e4090d69c088a7c97dae790110531e2ab3bd5f0
includes independently approved type/lint-only amendments: explicit discriminant
predicate, callback braces and identical pure target factory. Prior types-b
exit2 and lint-b exit1 are retained; no assertion or oracle was removed.

| Final command | Observed result |
| --- | --- |
| Engine | 1131 actual passes/59 files,9.275s |
| Full unit with coverage | 3314 actual passes/163 files,62.703s |
| Typecheck | exit0,20.938s |
| Lint including engine purity | exit0,56.504s |
| Engine coverage | lines/statements94.6%,functions94.54%,branches90.65%; unchanged80%gate |
| Production build and bridge-removal guard | exit0,8.640s; four clean JS chunks |

Repository 3 s/15 s engine/full targets remain exceeded; no budgets were weakened.
The first bridge command was interrupted by wrapper size-monitor file deletion
during its clean build, not a product assertion failure; exact dist removal then
Card A bridge rerun passed 8.791 s/four chunks. The first final coverage command hit
the unchanged 64 MiB combined artifact cap at 65.438 s because the existing 40.9 MB
task bundle remained. Exact owned processes received TERM; no survivors. Its
logs, metadata, process identities and partial instrumentation are retained.
After verified task-owned dist removal and compression of partial instrumentation,
the identical final coverage command passed with 7.6 MB monitored total. These
interruptions do not count as successful validation.

Each command is bounded at 30/120/120/90/90/210 s for focused/engine/full/types/
lint/build plus 2 s exact-owned cleanup; 32 MiB per report/log, 64 MiB combined RAW/
dist/.vite. The Linux subreaper checks ancestry and PID birth identity. No
broad process signals or shared-cache cleanup. Production build follows all
source/test fingerprint consumers and their reader releases.

## Independent review and retention

Producer, QA and GD/TD APPROVE the exact runtime, frozen tests and affected
Frost fixtures. Producer/QA separately approve every post-freeze test correction.
Final production build follows all source/test fingerprint consumer releases;
existing chunk-size, art-manifest precache and Browserslist warnings remain.
Final durable packet review follows below.
[Packet](fixtures/p06e-chill-cadence/packet.json) indexes every retained archive
record by exact bytes/SHA256, including original failures, source snapshots,
command/process metadata and complete recordings. Disposable RAW/build/cache
cleanup follows consumer release; a separate closing ledger records results.
Full P02/P06–P10/C0–C4/G0–G7, ordinary Den/Andariel/idle, campaign pacing,
all-skill behavior and balance remain open. No push/PR/merge/deployment.

Producer and QA independently APPROVE the complete durable packet:
98390f1b424b996c4b61fb935cdd807f39642b2070295c5f9dd933bf9d712da5;
archive8a5f98f34b3427c8c5ac3c27da4ccbd5064e848db61c457866a824c0ef8f8b7e.
All 125 regular records/7,636,918 uncompressed bytes/2,632,957 compressed bytes,
20 command records, stage-correct sources, partial coverage instrumentation and
complete control payloads verified. All 2,732 recorded process identities were
absent/nonlive. All readers released before cleanup. The archived documentation
snapshot predates this review note and final spacing-only editorial corrections.

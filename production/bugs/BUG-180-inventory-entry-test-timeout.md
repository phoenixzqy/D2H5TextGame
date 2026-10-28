# BUG-180 — Investigate intermittent player/inventory import timeouts

Severity: Low. Status: unresolved intermittent test timing; no gameplay failure established.
Owner: qa-engineer / technical-director (root sole writer).

Observed 2026-10-24 on baseline39ebb35 plus the uncommitted Bone Armor change.
Environment: Vitest1.6.1, jsdom UI project, normal four-thread bounded workspace;
no browser, viewport, locale or engine seed applies to this module-entry test.

1. Run `npm test -- --reporter=dot` across the complete workspace.
2. Observe `playerStore.experience-equipment.test.ts`'s inventory-first entry case.

Expected: cold inventory/player imports initialize, equip the controlled item and
preserve its MF/GF after XP, within the unchanged5000ms test bound.
Actual: one full-run case times out;510files/12138tests pass, one test fails,
and two pre-existing tests remain skipped. Full process575.578s/exit1. No import
cycle exception, wrong stat assertion or gameplay failure was reported.

The unchanged13-case file passes immediately in isolation, exit0/9.262s overall;
player-first1747ms and inventory-first1505ms. Thus this observation is intermittent,
not a proven deterministic cycle or a diagnosed Bone Armor regression. CPU/load
context alone does not establish the cause. No timeout, assertion, worker setting,
discovery scope or runtime source has been changed to obtain a pass.

Evidence: retained Bone Armor fixtures `raw.tar.gz`, members `full-final.log`,
`full-final.result.json`, `full-final-input-audit.json` and
`entry-order-diagnostic.log`/`.result.json`. All1222frozen source/test/config
hashes, HEAD/Git status and760build hashes were exact throughout the failed run.
The original failure must remain retained even if the controlled retry passes.

Next: one complete unchanged retry; retain its exact outcome. If this recurs,
profile the cold import path under the full workload before proposing a fix.
Workaround: no complete-suite workaround established. Independent QA acceptance
and existing test-time budgets remain open. Root-cause status remains unresolved.

Controlled complete retry: same code/command/timeout/assertions/four-thread
settings, exit0/429.22s process (427.85s Vitest),12139PASS/511files/two existing
skips. The13-case entry file completes in3880ms. All1222input hashes and Git
state remain exact during retry. `full-retry.log`/`.result.json` and
`input-audit-final.json` retain that result. This does not diagnose or fix the
intermittent failure; status stays unresolved. No runtime/test source was patched.

Paladin batch recurrence, baseline2b5608b plus the initial aura implementation:
the complete `npm test` run reports12227PASS/twoFAIL/two existing skips,
514passed/onefailed file,557.274s process. Both player-first and inventory-first
entry cases exceed the unchanged5000ms limit. Typecheck/lint overlapped an early
part of this run; overlap is observed context, not an established cause.

After all build/browser/type/lint/engine jobs terminate, the unchanged13-case file
passes in isolation (10.013s process); player-first1921ms, inventory-first1798ms.
An independently discovered native aura allocation-ID defect is repaired before
the final complete run, so that run is not an unchanged-source retry. The import
test, its assertions,5000ms limit, discovery and worker settings remain unchanged.
Final complete run on fdbbd55 passes12229tests/515files/two existing skips,
539.135s process; the13-case file takes3862ms. All1222 source/test/config hashes,
HEAD/Git state and760 production file hashes stay exact through final validation.

[Paladin evidence](../../docs/plans/evidence/d05-paladin-stat-auras.md) retains the
original failed full run (`aura-full.*`), isolated diagnostic
(`aura-entry-order-diagnostic.*`), final full run (`aura-full-final.*`) and source
audits. Status remains unresolved: no import-cycle/stat assertion failure or
gameplay defect is established, and no timing/source workaround was introduced.
Profile the cold import path under the full workload before proposing a source fix.


Sanctuary first-full recurrence over a03fed2: player-first entry case timed out at unchanged5000ms (13-case file, one failure). The complete full also retains76historical-byte failures and one stale aura assertion, reported separately under BUG183/BUG181. No timeout, worker, discovery or import assertion is changed. Original full-final.log/result and exact before/after integrity live in the Sanctuary task evidence root; isolated reproduction and corrected-source full remain pending.


Sanctuary follow-up at `5586d34`: unchanged13-case file passes in isolation;
corrected full passes 12430tests/531files plus two existing skips in
426.676seconds. No import implementation/assertion, timeout, worker or
discovery change was made. The original full timeout remains retained under
[Sanctuary evidence](../../docs/plans/evidence/d05-paladin-sanctuary.md); this
intermittent issue remains open. Exact source/build/genuine snapshots prove both
full attempts stayed unchanged during their respective runs.


Telekinesis batch recurrence (2026-10-25), `d030f410` plus the authored Telekinesis
repair: the first full run again reports inventory-first exceeding the unchanged
5000ms limit; the13-case file takes12879ms. The first full exits1 after1290.77s:16275passed/one failure/two existing
skips,733passing files/one failing. The unchanged13-case file then passes alone
(13.73s). With this task's other checks terminal, the full run on the same product
and strengthened Telekinesis-only comparator exits0:16276passed/734files/two
existing skips,1035.57s. The import file takes5326ms across both entry cases;
neither individual case exceeds its unchanged5000ms bound. Preserve `full.log`,
`import-timeout-diagnostic.log` and `full-quiet.log` in the required local archive
linked from [Telekinesis evidence](../../docs/plans/evidence/d04-telekinesis.md).
The later causal-comparator correction changes only a separate Vitest test;
it does not alter this module-entry test, product code or production build.
No diagnosed root cause, timeout increase or source workaround is claimed.


Poison Dagger recurrence (2026-10-26), frozen `bee044a8`: player-first exceeds
unchanged5000ms during the first full run overlapping types/lint/browser.
The already-failed owned Vitest process is identified and gracefully interrupted;
exit130 after399.589s is an interrupted attempt, not a full pass/final failure
summary. Original log SHA256:
`bd91df47a2a1fa9b58722d9957f455a9f917a0b484225b9f1c1d392f84d454f8`.
The unchanged13-case file then passes alone in10.532s. The unchanged full run
alone passes18100tests/834files/two existing skips in1132.935s; the13-case
file completes in5633ms total, with both individual cases within5000ms.
All4855tracked input hashes and HEAD remain exact throughout. No source,
timeout, worker, discovery, assertion or skip is changed. CPU/load contention
remains an unproven hypothesis; no gameplay defect or import-cycle exception is
established. Status stays unresolved. Complete failed/isolation/exclusive receipts
and owned-process interruption evidence live in the required Dagger retention
linked from [its evidence](../../docs/plans/evidence/d04-poison-dagger.md).


Countess recurrence (2026-10-27), base `b7bf3595912f7c461ad825382c989baaa91b8adc`
plus frozen Countess inputs: corrected full original35945 reports both player-first
and inventory-first exceeding the unchanged5000ms limit; the13-case file takes
10755ms. The process is still running, so final counts/exit are pending. The
preceding complete full9837 passed this unchanged entry-order file and failed
only the separately corrected stale Sun spy expectation (BUG341).

No other root test/build/type/lint/browser job overlaps corrected35945. A host
load observation (55.48/40.37/25.46 on16logical CPUs) is context, not proof of
contention as cause. No import-cycle exception or equipment-stat assertion
failure is reported. Source, timeout, assertions, discovery, workers and skips
remain unchanged. Preserve `final-full-corrected.log`, terminal receipt when
available and `corrected-full-timeout-observation.json` in the Countess evidence
packet. Root owns archival/exact cleanup. Final frozen input/genuine-save
rehash, isolated reduction and one unchanged controlled full comparison remain
pending; no Countess or full-v1 acceptance follows from interim output.


Countess corrected35945 is now terminal/consumed, exit1 after1835.35s Vitest:
20,422passed/two entry-order timeouts/two existing skips,966passing files/one
failing of967. All1833frozen inputs and protected genuine fixture remain exact.
The unchanged native13-case file passes alone (12.98s total; player-first2903ms,
inventory-first2441ms), retaining5000ms per-case limit and all original assertions.
The two-case scratch CPU profile completes without import-cycle exceptions. Its
first cold import6363ms includes fresh transform/inspector overhead; second2685ms.
AJV code generation/compile samples are substantial in both. This isolated probe
does not identify the full-workload timeout cause or replace native acceptance.
No product/import/config/timeout/discovery/worker/skip change was made.

Producer-reviewed sequencing permits an explicit full-gate-pending local Countess
checkpoint, then Malus integration after this terminal audit/native reduction.
No Countess acceptance or evidence cleanup occurs before a successful expanded
integrated full and fresh exact-snapshot checks/reviews. Both original failures,
manifests, receipts and CPU profiles remain required evidence. BUG180 remains
unresolved; next full workload can supply a controlled current-snapshot result,
not an unchanged comparison to a pre-integration source tree.

### Later expanded integrated workload

The unchanged5000ms test bound passes within the final1840-input Countess/Malus
full run:20,514tests/972files/two existing skips, native exit0. All inputs
and protected genuine saves match before/after. This later pass does not
establish the cause of the earlier intermittent import timeout or resolve
BUG180. Both failed workloads and diagnostics remain retained; see the
[final combined evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27).

### H2 native Hell full-second recurrence — 2026-10-27

On the historical5332-input H2 freeze
`cf87793bc93d58ab73ab339393c786a9ef31db00c2774b146adf061d39a05388`,
root consumed full-second91212 exit1 after1854.737331s:21,172passed/1failed/
2existing skips;986/987files. All5332 before/after inputs remain unchanged. The
sole failure is player-first exceeding the unchanged5000ms bound; the13-case
file takes9569ms. The preceding full-first passed this entry file and failed
eight separately reviewed stale assertions in six other files. No
initialization-cycle exception or equipment-stat assertion failure is reported.
Terminal receipt `h2-full-second-root-terminal.json`, SHA-256
`a32f805d09b02a4d597e453fec46ea4e798bec3cf2b3760e82c14465cf65d9a5`,
binds the actual failed result; [H2 evidence](../../docs/plans/evidence/hell-native-integration.md)
links its raw artifacts and source-only investigation.

The subsequent v2 full-workload profiler92197 was root-stopped after77.802787s
(native exit-2) following116 observed UI zero-test setup failures. Neither entry
case was reached; no native result/profile/metadata or gameplay evidence was
produced. Its terminal receipt SHA-256 is
`d75b9670fb6a2ffcadfccaca4f7d92e9564653d52b8f859257d825732ae96fcb`.
Root's static setup explanation is an HTTP URL passed to `fileURLToPath` before
the target guard after jsdom NormalizeURLPlugin rewrites `new URL` against
`self.location`; the exact thrown stack was not retained. This explains a
source-level diagnostic hazard, not the original timeout's timing cause.

At that source-only investigation checkpoint no runtime/import source, target
timeout, assertion, worker, discovery or skip had changed. The later measured
compile-only change below supersedes only the runtime-source statement, not
the retained failed attempts or the unknown cause of the earlier timeout.

### Count-only diagnostic and compile-only follow-up — 2026-10-27

Root consumed instrumented full-v3 session8379: native/outer0 after1250.773529s,
21,173passed/2existing skips/987files. All13 original target cases passed and
both profile/metadata captures completed. All5332 inputs and Git state remain
unchanged; remaining owned group members are[], and both wrapper/native PIDs
are absent. `h2-import-profiler-v3-root-terminal.json` binds the consumed result.
This instrumented diagnostic grants no full/H2 acceptance. Its raw terminal
receipt retains an inherited prepared-only limit contradicted by actual native
terminal fields; preserve it as stale metadata, not an execution fact.

Independent review narrows actual stack counts to save-module evaluation plus
explicit Ajv compile ancestry:1307/3123 player-first and1267/2746 inventory-first.
The broader inventory save+Ajv count is1269 and must not be relabelled entirely
as compile ancestry. The player profile's raw-2us delta remains untouched; the
original weighted analyzer rejected it and no weighted attribution was computed.
Sample fractions are not CPU/wall-time fractions, saved time, per-declaration
costs or proof that compilation solely caused the earlier uninstrumented timeout.

The independently reviewed compile-only candidate was first applied to
`src/engine/save/validate.ts`, SHA-256
`0e79bb676a248223e7a444735cb376f229f7a30c0a6ca9015341df8b7ad0362c`.
All20 schema expressions remain eagerly constructed in the original order;
first use memoizes the original typed raw Ajv validator. Schemas/options,
validation/error boundaries and migrations are unchanged. No timeout/worker/
discovery/skip workaround was introduced.

Regression-v2 session87561 failed a temporary spy result-record identity
assertion before its resource assertion; it is a preserved test defect, not
resource RED. Corrected v3 test SHA-256
`762af8c33e61abfb706d67f47c07b8ea20513457cba358e68aa5479ced239107`
reached real validator/fixture/error preconditions, then baseline19068 native1
failed the zero structural-save-compiles-at-import resource assertion. After
the exact runtime change,52325 native0 passed. Independent targeted evidence
review SHA-256 `8f00a71855ddd4d246dba11ee10139f029726dc1ddd8563699abdcd3490826b8`
confirms this narrow RED/GREEN. Rejected calls have explicit nonmutation
snapshots; successful calls check acceptance/equality and raw error clearing,
with broader save suites supplying additional nonmutation coverage.

Affected83753 then passed1228 assertions/40files, native0, all5333 inputs
unchanged on snapshot `48b534d3e78c3fdb5789e6c20be5e1fc0ef0e790cad94c6e6922dc67845be6f3`.
Pre-cleanup typecheck98175 and build76346 are consumed native0 on unchanged5333
inputs. Required native H2 checks now pass; final docs/inventory and independent
exact H2 packet review remain pending. Final docs/inventory and exact H2 packet gate
also remain pending. BUG180 stays unresolved: neither targeted resource GREEN
nor affected tests establishes resolution of the earlier full-workload timeout,
total speedup, saved time, bug closure or H2/full-v1 acceptance.

Engine96409 passed10,735 assertions/401files before the exact reviewed type
cleanup; lint73517's three redundant-annotation errors remain retained.
After cleanup, typecheck40015, lint26336 and build2368 all passed native0.
Uninstrumented full27446 passed21,174 assertions/988files with2existing skips
in1280.293275s. All four final checks preserve unchanged5333 inputs on snapshot
`b63bcdfce5e051f2d3be206cdead07881cce853a9ed63efa21f6bc34465b3dc0`.
Earlier runtime outcomes retain their executed hashes and erasure-only mapping.
Required native H2 checks now pass; final applied docs/inventory and producer
approval of the exact H2 packet remain pending. No bug closure, browser/H3,
earned acquisition, CI or full-v1 acceptance is claimed.


### Prayer final full recurrence — 2026-10-28

On base `79d58fae1e876b271c18e580449a8e62d40d6403` plus the uncommitted Prayer
repair, unfiltered full-final exits 1 after 2280.441251s. Individual assertions
report 21,525 passed, three failed and two existing skips across 1,007 files.
Both original module-entry cases exceed the unchanged 5000ms deadline:
player-first 5049ms and inventory-first 5003ms; the 13-case file reports 11 passes
and two failures (10096ms). Neither reports an initialization-cycle exception
or equipment-stat assertion mismatch. The third failure is a material-source
report timeout, recorded separately in BUG-366.

All 2,045 executable inputs remain unchanged at
`680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3`.
Engine-final passes 10,959 cases / 409 files, including the untouched save-schema
test; its full-suite assertion also passes, with a reported duration of 5095ms.
No timing repair or cause is inferred from those passes. Prior Prayer-stage
save timeouts remain retained separately.

Root retains exact full logs/report/maps/native receipt and test-summary-final.json
(SHA256 `0b0c8bf51e20ec8ed21cc397b0b7e870cad9706c3840b0b5054cb60a0a670958`)
at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-prayer-9d0e935j`.
The read-only full-runtime-observation.json records contemporaneous CPU pressure;
it does not establish host-load causality, an import bottleneck or a Prayer
regression. No timeout/assertion/worker/discovery/configuration/dependency change,
prewarm or production optimization is applied. The reviewed native module-entry
CPU reduction is prepared only and requires a final expanded-failure review
before execution. BUG180 and Prayer's full validation remain open.


### Prayer CPU diagnostic checkpoint — 2026-10-28

After the expanded terminal-failure review, the one permitted native UI-only
13-case CPU diagnostic completes with exit0. All cases pass, including
player-first2431ms and inventory-first1912ms, under unchanged5,000ms deadlines,
setup, workers, isolation and module resets. Both valid coordinator/worker
profiles are retained in the same packet under native-entry-profile/; exact
2,045 input hashes remain unchanged. The source is now preserved as unaccepted
checkpoint `af71980f69561a472fdf033088ceb7f0209bb465`.

Weighted worker Ajv.compile intervals total4.853s across collection and both
resets; shared createSkillValidator's2.758s is nested within that total. The
existing schema-identity cache is already effective. There are no per-case phase
markers; sample weights include scheduling gaps and do not establish host/Prayer
causality or a removable compiler/import defect. Independent review finds no
justified production optimization and recommends ending this diagnostic loop.
The isolated pass does not clear the failed full result, BUG180, BUG366 or Prayer.
No rerun loop, timeout/configuration change or material-source replay follows.
Next investigation requires a bounded full-workload phase-attribution plan.


### Sole full-workload terminal follow-up — 2026-10-28

The separately pre-reviewed unfiltered default full-workspace capture completes
native0:21,528passed/0failed/2same skips /1,007files in1,619.476379s. Both exact
entry cases execute and pass: player-first2,713ms, inventory-first2,024ms.
Material-source passes4,866ms and untouched save compile-laziness passes3,405ms.
These are native reported task durations, not exact import phases/deadline windows.
All2,045before/after/live executable inputs match
`680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3`,
source checkpoint `af71980f69561a472fdf033088ceb7f0209bb465`, documentation HEAD
`d2f04645f5c349b9d1d093a660eb2f1d749c9e6d`. No assertions,5,000ms deadlines,
worker/isolation/discovery/configuration/dependency settings or environment change.

Producer terminal review approves only the current-byte native full-unit
prerequisite, security-pass/findings[]/readers released; terminal-review.json
SHA256 `aef63973046e2eced4252aad34a988a20f1b1707b98385d7b9e3da3977b0854d`.
Same-byte focused-feature246/12files, engine10,959/409files, typecheck/lint/build
passes remain valid. Historical focused-final instead retains246passes plus
one save timeout/native1; earlier isolated save/full-native1 failures are not erased.
Only two unchanged Date-fixture runtime labels differ in raw assertion inventories;
independent review reconciles precisely those cases, with all other names/files/
skips equal. Raw records remain unchanged.

Profile attribution is inadequate:59of1,009profiles contain62negative time deltas,
minimum-168microseconds. All1,009raw profiles/1,317,319,852bytes remain retained
with verified hashes; no clamp, analyzer change, repeat capture or deletion.
No stack/phase/timeout-cause conclusion, production correction or speedup is
established. Root retains the exact new packet at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-full-timeout-attribution-tx4w01xr`
through BUG180/366,Prayer,next-card/umbrella consumers and owns eventual cleanup.
Original Prayer evidence remains in its previously recorded packet. Coordinator
2456515/driver2456501 are absent; postrun audit finds no worktree processes and
no intervention. [Full terminal evidence](../../docs/plans/evidence/full-workload-timeouts.md)
records exact execution/reconciliation/review and the separate gate interpretation.

BUG180 remains Open: this is instrumented nonreproduction and a reviewed current
unit pass, not cause/fix or closure. No extra unprofiled full invocation is required
or recommended. Recurrence stops source continuation for bounded diagnosis.
BUG365/browser/earned/actual CI/full-v1 acceptance remains Open; next Fire needs
separate refreshed readiness before reproduction/implementation. No app/browser,
protected-fixture/closed-policy read/replay, spent/replacement acquisition/lineage
experiment, push/merge/deployment occurs. Goal/worktree stay active.

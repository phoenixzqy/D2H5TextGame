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

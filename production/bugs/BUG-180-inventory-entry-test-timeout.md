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

# BUG-610 — Retain the owning act in preparation journal labels

Status: fixed locally, uncommitted. Severity: Medium. Found: 2026-11-02.
Owner: root, campaign preparation and evidence tooling.
Build: `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
with retained working changes; production authority80 and frozen119 campaign inputs.
Environment: WSL/Linux native campaign harness. Browser, viewport and locale do
not participate. This journal defect consumes no RNG; the native reproduction
starts from the authenticated Act III level47 / next1130 export.

## Reproduction

1. Create the fresh Act IV preparation controller with Guardian claimed.
2. Prepare Plains while below its full challenge target, using an eligible
   previously cleared Act III training area.
3. Inspect the emitted preparation-attempt journal record.

Expected: `act4-area-prepared-attempt` identifies the owning controller, while
`attempt.act: 3` identifies the actual training source. The Act III wrapper
likewise retains `act3-area-prepared-attempt` when training in Act II.

Actual: the kind becomes `act3-area-prepared-attempt` for Act IV training and
`act2-area-prepared-attempt` for Act III training. Source state and gameplay are
correct, but existing consumers filtering by controller kind lose progress or
reject the journal.

## Evidence and cause

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
`p15-intended-act4-prepared-v1-readback-v1.json` independently authenticates102
source-labeled Act III training records and three Act IV route records without
combat replay. The native run and reader both completed before any source edit.
Its source, plan, manifest, report, journal and exact export remain immutable.
`p15-preparation-journal-labels-before-v1.json` archives the three affected files.

In `tests/campaign/challenge-area-preparation.ts`, the nested `attempt(act, ...)`
parameter shadows the controller's owning `act`. Its finally block builds the
record kind from that source-act parameter. Rename the parameter to `sourceAct`,
retain it in the attempt/admission, and build the journal label from the owning
controller. No gameplay, retry, source-selection or budget change is needed.

Plan review: ready; correct the single shadowed binding and guard both wrappers'
public journal contract with constructed admissions. Run only these cases and
scoped types/lint. Security check: pass; authorized local test-harness correction,
no dependencies, credentials, networking, publication or permissions changes.

## Local resolution

Renamed nested source-act parameter in `tests/campaign/challenge-area-preparation.ts`;
record kinds now bind to the owning controller. Native source/admissions and
all limits are unchanged. Added owning-act tests to Act III and Act IV
preparation regression files. Both failed before and pass after the correction:
`p15-preparation-journal-labels-red-v1.log` / `-green-v1.log`; strict scoped types
and explicit lint also pass (`-types-v1` / `-lint-v1` receipts).64 unselected
cases were not rerun. No commit was created; accumulated changes are retained.

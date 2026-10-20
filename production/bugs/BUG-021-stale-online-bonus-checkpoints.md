# BUG-021 — Save and export retain an unconsumed online bonus

Severity: High (saved bonus duration can refresh across restarts).
Status: fixed in P17a03 (implementation commit in execution ledger), 2026-10-20.
Affected: meta store and persistence; base `b9da90b`.
Environment: Node24.21.0, Vitest1.6.1/jsdom; fixed wall clock, no RNG/viewport.

## Reproduction and evidence

1. Raw hydrate a valid v7 save with multiplier1.32/4800seconds, offlineTime123
   and a lastOnline/save timestamp one day old at clock1792454400000.
2. Advance the online clock600seconds, call production flushSave or export.
3. Actual saved/exported tuple is still1.32/4800 with old lastOnline. Expected
   tuple is1.28/4200 with lastOnline equal to the new save timestamp.
4. Exact explicit import has the same problem. Projecting from its historical
   lastOnline directly would instead expire the imported bonus immediately.

Behavioral RED before runtime edits:3/3failed,2.87s at06:02:58UTC.
Command: `npx vitest run --project ui src/stores/persistence.bonus-checkpoint.test.ts --reporter=dot`.
Real stores/orchestration/adapter; only Dexie IO is faked. This is production
save/export behavior, not merely a missing-helper test or browser restart proof.

## Approved root fix and boundaries

One transient clock anchor accompanies the sole raw idle tuple. Restoring exact
raw data reanchors online consumption at successful publication; startup uses
its one sampled reconciliation time. Shared read-only projection consumes online
time without mutating either source tuple or anchor. Save/export use the same
projection and one sampled timestamp; snapshotStores remains raw. Neither
successful nor failed saves may advance only the anchor and refresh the tuple.

An explicit finite update.lastOnline supplies a new tuple basis. Partial bonus
numeric edits without that basis first project existing values to sampled now,
then merge/normalize/reanchor. Target/counter-only and empty/no-op edits preserve
the prior bonus basis. Reset installs a fresh tuple and anchor together.
Reject nonfinite inputs before publishing. flushSave must return a rejected
Promise and observable error on synchronous projection failure so background
timer callers can catch it. Ordinary retry remains possible. Export throws to
its existing UI error handler. No schema change or duplicate bonus tuple.

Own metaStore.ts, persistence.ts, new checkpoint tests, D12 and this report.
Root and producer reviewed the plan. UI/reward consumers, periodic/close saves,
hidden interval ownership, browser restart/PWA proof and full P17 remain open.

Security check PASS: local validated-save arithmetic only; no external IO,
credentials, permissions, CI, infrastructure or agent-behavior changes.

## Validation

Expanded22-case RED22failed3.28s at06:04:43UTC also preceded runtime edits.
Initial GREEN22pass3.21s; related70pass3.68s. Two later contract tests clarify
that whole-patch identity is the no-op rule; changed mixed patches deliberately
replace explicitly supplied numeric/basis fields, even equal to raw history.
They passed in the full suite; no runtime changes were needed for that rule.

Combined with integrated hero capacity and scheduler: U1219pass/1existing
merc-XP skip109files27.01s; E497pass42files3.98s. T/L/forced changed-file lint/B
pass, build6.98s. Timing budgets15s/3s remain exceeded; existing React/router,
large-chunk and2.57MB manifest precache warnings remain. Lint corrections added
callback braces and normalized caught unknown to Error, without suppression.

Root and producer independently APPROVE the five-file source/test/control.
Ordinary browser regression exposed stale assertions in existing save-management
spec:6failed/8passed41.7s, port4316. Four localized import/reload assertions
expected unchanged idle timestamps/counter, but new startup correctly projects
lastOnline+1000ms and adds500ms since the resumed autosave; two malformed-import
assertions expected timestamps frozen despite advancing wall time. Capacity,
layout and storage-failure cases all pass. These are superseded expectations,
not production save loss. The failure output is
`/tmp/d2h5-b97b12e-checkpoint-browser` (disposable after final evidence review).

Producer reviewed/accepted a sixth file, tests/e2e/save-management.spec.ts:
retain the original old-autosave/import durable cancellation oracle, assert
all new clock/counter values explicitly while preserving complete save equality,
add a same-clock second reload, and freeze the malformed-import test clock.
No idle fields are omitted or broad normalized comparisons used.

That first corrected matrix passed11/14,1.1m: both English runs yielded zero
away time rather than the assumed500ms; the mobile malformed-import toast stayed
frozen over the Cancel pointer target. The fixed500 assumption was withdrawn.
Final tests read the actual committed checkpoint without mutating storage,
bound its timestamp to+500..1000ms and verify its complete payload against the
known imported fixture before using its clock to derive the exact reload gap.
Thus stale old-character writes still fail the durable cancellation oracle.
The same-clock second reload requires complete equality. Malformed import uses
the existing ordinary Escape key path, preserving frozen-time exact equality.
Existing ignored-spec lint findings were corrected with readFile(download.path)
instead of unsafe stream iteration and readonly viewport tuples instead of
non-null assertions. No runtime/assertion bypass or weakened policy.

Final save-management browser matrix10/10pass22.4s, en/zh-CN at1280×800/360×640,
including malformed import, five viewport sizes and quota/export recovery.
Command: `E2E_PORT=4320 npx playwright test tests/e2e/save-management.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-b97b12e-save-browser-observed`.
All four capacity cases also passed at the same runtime source in both prior
matrices. Forced final-spec lint/diffcheck pass. No runtime changed after full
U/E/T/L/B above; the later edits only strengthen browser evidence/docs. Root and
producer independent final six-file source/test/control review recorded in the
ledger. UI/reward/lifecycle/PWA and full P17 remain open.

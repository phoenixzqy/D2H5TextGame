# BUG-561 — Reconcile fractional training clocks

- Severity: Medium; the native result is retained and can be audited without replay.
- Status: Fixed locally; uncommitted. The original receipt remains intact.
- Owner: campaign QA harness, root sole writer.
- Build: `feat/playable-foundations` at `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
  plus retained working changes, supplemental campaign source authority v5;
  production hash `e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a`.
- Environment: Node native campaign runner in WSL; browser, viewport and locale
  do not apply. No seed override; the native handles remain in the journal.

## Reproduction

1. Continue the retained level-12/ordinal-127 Javelin save using
   `p15-javelin-route-continuation-v2.policy.json`.
2. Clear the remaining Act I route and enter the first Act II training stage.
3. Audit the retained checkpoint against its actual waves.

Expected: independently accumulated fractional durations reconcile within
floating-point precision, while actual time discrepancies and budget violations
remain failures.

Actual: subtraction of cumulative clocks gives `200428.63535491715` ms; summing
the training waves gives `200428.63535491718` ms. Exact equality rejects the
otherwise identical durations. The native gameplay stop remains a training
retry limit, independently of this accounting defect.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-javelin-route-continuation-v2.json`
and the adjacent `.journal.jsonl.gz`; the original receipt must remain intact.

Root cause: `auditJavelinTraining` compares floating-point sums assembled in
different orders using exact equality.

Regression: `tests/campaign/javelin-progression.regression.test.ts` must exercise
a nonzero fractional starting clock and reject a one-millisecond discrepancy.
Workaround: re-read retained waves after correcting the numerical comparison;
no new combat is needed.

Fix: tolerate at most `1e-6` milliseconds (one nanosecond) when comparing
cumulative subtraction with stage summation. Admission and combat-budget
bounds remain exact. The fractional-clock regression failed before the fix;
all nine Javelin checks now pass, including rejection of a one-millisecond
discrepancy. Retained readback
`p15-javelin-route-continuation-readback-v1.json` passes both previously failed
audits with zero new admissions or waves.

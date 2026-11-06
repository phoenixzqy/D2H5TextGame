# BUG-615 — Audit terminal controller at comparison start

Status: Fixed locally in retained v2 scratch caller; native terminal and independent readback pass. No commit.

Severity: High for the campaign verification path; no player gameplay affected.

Affected systems: QA campaign comparison driver (qa-engineer responsibility).

Reproduction environment: local Node 24.21.0 / Vite SSR, Linux; source HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus accumulated local changes.
Browser, viewport and locale do not apply. No battle seed was consumed.

1. Authenticate the native pre1456 checkpoint from the original Act V journal.
2. Restore its exact save and reconstruct its 27-admission successful prefix.
3. Call the shared controller's terminal `audit` with `completed: false` and
   `failureStatus: null` before admitting any new battle.

Expected: validate inherited terminal evidence and checkpoint-prefix custody,
then execute the separately declared comparison with existing limits.

Actual: terminal audit requires a completed state, a terminal failure, or an
authenticated wall-continuation marker. It rejects a running prefix at
`tests/campaign/challenge-area-preparation.ts` (`if (!state.completed) ...`).
The scratch driver calls the wrong validator at this boundary. Production
controller behavior is correct and must not be weakened or given a fake failure.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files: `d02-act5-corpse-native-v1-driver.ts`,
`d02-act5-corpse-native-v1-run-attempt1.log`,
`d02-act5-corpse-native-v1.json`, and
`d02-act5-corpse-native-v1-process-exit.json`.

The run ended with technical-error, zero new admissions, zero new waves, zero
rewards and unchanged level63/next1456. Its report/export/journal remain frozen;
its exact task cache was removed. Original terminal1459 remains exhausted.

Fix at the caller: audit the authenticated original terminal controller, derive
and validate the retained successful prefix against the native checkpoint,
and reserve terminal audit for the new run's actual terminal state. Exercise
the same preparation helper in a zero-combat preflight before another launch.
Retain this failed launch and charge its wall/journal expense to the corrected
comparison. Do not change production code or replay earlier routes/tests.

Correction: `d02-act5-corpse-native-v2-driver.ts` audits the original terminal
and separately validates the retained running prefix. The same helper passes
preflight at level63/next1456 with zero new admissions/waves. Scoped driver types
pass. The first preflight exposed a missing controlled clock in the new preflight
wrapper (timestamp only); it is corrected to use the main driver's clock setup.
Both preflight receipts remain, and the corrected preflight process exits zero
with its cache absent. No combat was performed by either preflight. There is no
commit yet; the correction remains in retained scratch evidence.


The corrected v2 launcher has now completed the actual native comparison through
terminal66/next1505. Its terminal controller audit and independent readbackv3
pass. Gameplay is a bounded nonwin; process success does not imply a route clear.
Evidence: `d02-act5-corpse-native-v2-process-exit.json` (completed/cacheAbsent),
`d02-act5-corpse-native-v2-readback-v3.json` and the [terminal report](../../docs/balance/2026-11-03-act5-corpse-native-terminal.md).
All v1 failure costs remain charged and historical artifacts remain immutable.

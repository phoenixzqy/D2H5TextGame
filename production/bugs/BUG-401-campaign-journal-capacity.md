# BUG-401 — Retain bounded campaign diagnostics without exhausting the journal

- Status: Fixed locally; final source review and validation pass. Fire-v3 unexecuted.
- Severity: Medium — diagnostic stops; no product gameplay defect established.
- Build: uncommitted current32 plus BUG398/400 on
  `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL/Linux, Node24.21.0, installed Vitest1.6.1 explicit campaign
  workspace. Service-path test; browser/viewport/locale not involved.
- Clock:1793304000000; native seed stream, no supplied seed/ordinal/save.
- Affected system/owner: root-owned campaign diagnostic recorder and final audit.

## Reproduction

1. Execute the separately frozen fresh cold-v3 Act I case once.
2. Earn actual gear and native quest/combat rewards using unchanged route/bounds.
3. Continue after ordinary capacity refusals with BUG400's validated policy.
4. At L11/96admissions/262played victories, observe the190MiB raw JSONL cap.

Expected: preserve complete diagnostics within the declared physical disk budget,
and preserve independent terminal checkpoint/economy assertions when recording
fails. A real recorder failure still stops technical acceptance.

Actual: serializing repeated native events/state/comparisons exhausts the journal
before the route finishes. The byte counter advances before refusal, so report
bytes include unwritten attempts. A staged-wave write throws; final checkpoint
recording also throws and skips the following economy audit, leaving it null.
The report retains successor/export and source snapshots; it remains a technical
failure. All262combat waves were victories, with2512earned items/130670XP in the
report. These figures require independent reconstruction, not an economy-PASS
claim. No balance or class tuning follows from this recorder failure.

## Evidence

Root retains packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:

- `p15-current32-act1-cold-v3/`: original report/journal/log/process/execution.
- `p15-current32-act1-cold-v3-run-exit.json`: exit1,119.334s.
- `p15-current32-cold-terminal-failure-v3.json`: actual/reported journal bytes,
  null audit, exact source/campaign stability and fire-v3 absence.
- `p15-current32-screen-before-v3.json`:3005-input/tool/plan freeze.
- `bug400-validation-acceptance-v1.json`: the gear-policy correction passed
  eight native regressions,14contracts, strict types/lint/boundary and review.

The v3 pair is closed at this technical failure. Fire-v3 is never started. Keep
all earlier results; do not execute the PASS-only terminal audit on this case.

## Correction boundary

Review a lossless bounded recording format before implementation; retain every
record, payload and order, and distinguish physical bytes from uncompressed
bytes. Do not remove combat/gear/state evidence, increase the disk cap, change
gameplay policy/numbers/route, or count failed writes as persisted bytes.
Independent terminal economy assertions must execute before a fallible checkpoint
record callback. Add meaningful writer budget/roundtrip/terminal-failure tests,
validate source/types/lint/boundary and review before any new declared cases.

## Writer review finding before final correction

Independent review of the first gzip writer found that an I/O failure could
leave an incomplete member beyond the last counted boundary. A later checkpoint
append could then extend corrupt data, and counters advanced before fsync. The
correction must truncate back to the last committed boundary on write/flush
failure, advance counters only after flush, and permanently refuse further
appends after I/O failure. If rollback fails, report actual physical bytes and
retain the error. Inject partial-write, flush and rollback failures against real
temporary files; retain failed attempts and exact source-review evidence.

## Local correction validation

Uncommitted seven-path correction over the build above: lossless compressed
writer, reward-before-logger accounting, report metadata and regression workspace.
`tests/campaign/journal.regression.test.ts` covers native settlement/Claim logging
failures, codec/cap/exclusivity/close and injected partial-write/flush/rollback
failures. The original eight BUG400 regressions remain unchanged.

Packet receipts: `bug401-all-green-v2`17/17; `bug401-contracts-v1`14/14;
`bug401-delta-lint-v2`, `bug401-types-v1` and `bug401-test-boundary-v1` exit0.
Independent review: `bug401-independent-review-v3.md`. Exact3007-input manifest:
`bug401-final-source-v3.json`; patch SHA256
`867e57aa5c1afcba378182992349e89075d35f4cf73f2bbb9b3e4618ea104926`.
Invalid setup attempts and the transient-input v2 snapshot are retained and are
not passing evidence. No commit, production/balance change or full-game acceptance.

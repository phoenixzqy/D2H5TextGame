# BUG-723 — Journal the terminal campaign save before validating it

Status: Locally resolved in the retained working tree; no new commit.
Severity: High. Owner: root / campaign diagnostic runner.
Affected systems: native campaign checkpoint capture, failure evidence, realm cleanup.

## Reproduction — 2026-11-04

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree. Node/Vitest under WSL; no browser,
viewport, locale or combat seed applies. Both constructed cases use the native
character/store/export paths and a mocked route; they confer no earned progress.

1. Run the new `journals the exact terminal save` cases in
   `tests/campaign/dispatch.regression.test.ts` against the original runner.
2. The constructed route gains 17 XP and three rune-shards, captures the native
   save, installs a terminal decoder rejection or decoded-state mismatch, and
   stops without admitting combat.
3. Observe terminal checkpoint records and the restored nonempty outer realm.

Expected: record exactly one original export and snapshot before terminal
validation, report technical failure, and restore the outer stores/clock/pity.
Actual: both cases receive zero terminal checkpoint records. Decode/equality
throws before the recorder is reached; cleanup removes the live campaign realm.
The returned report can retain its export, but the fsynced journal does not.

Evidence: `red.log` and `red-result.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-campaign-capture-4gwv8cir`.
Both selected cases fail on the missing record assertion (2 failed, 26 excluded
by the command-line selection). Root retains the packet through umbrella
acceptance, then owns exact cleanup.

Confirmed cause: `tests/campaign/native-runner.ts` records
`stopped-native-checkpoint` after decode/equality and audit setup. Preserve the
raw capture first while keeping validation failures explicit. Recorder failure
must still allow existing independent audits and cleanup to run.

Limit: this fix cannot recover Double Swing's historical missing export and
does not qualify any new campaign, pacing result or formal acceptance cell.

## Resolution — 2026-11-04

The runner records the single raw native checkpoint immediately after capture
and non-null checks, before decode/equality validation. Recorder exceptions
remain technical failures and independent audits still run. Both new validation
failure regressions now pass, preserving the exact export/snapshot and full
surrounding realm/clock/pity. All 37 affected dispatch/journal checks, scoped
strict types and explicit two-file lint pass. See
[capture evidence](../../docs/plans/evidence/p15-campaign-terminal-capture.md).

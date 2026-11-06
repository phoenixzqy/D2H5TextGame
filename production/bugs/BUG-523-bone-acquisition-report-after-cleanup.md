# BUG-523 — Snapshot acquisition results before restoring stores

Status: Fixed in task-local helpers (uncommitted; implementation HEAD unchanged)
Severity: Medium (task-local report emission; earned state retained)
Owner: root / QA campaign helper

## Reproduction

Implementation HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty worktree. Node24.21.0 native-store harness; browser/viewport/locale not applicable. Exact earned source: `p15-bone-act4-earned50-training-v1.json`, level50/XP14651/normal next1279. Seeds and wave inputs are retained in the journal. Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Execute the checked bounded driver `p15-bone-earned-gear-acquisition-v1.ts` with `p15-bone-act4-owned-gear-acquisition-v1.spec.json`.
2. Native admissions1279/1280 commit eight waves and stop on the first nonwin. The checkpoint and terminal journal retain level50/XP60081/next1281.
3. Finally audits snapshot the terminal save, then cleanup restores the original stores (player becomes null).
4. Post-cleanup report construction calls `acquisition()` again. Its live `equipmentPlan()` asserts `ok(player)`, so no final report is emitted and the process exits1.

## Expected

Capture the final acquisition summary while its owned stores are live. Post-cleanup report/console emission uses that immutable captured value. Retain committed partial saves when reporting fails.

## Actual and evidence

`p15-bone-act4-owned-gear-acquisition-v1.log` records `AssertionError: ok(player)` at `equipmentPlan` → `acquisition` → final report emission. Its `-exit.json` proves exit1 and no owned descendants alive. The `.checkpoint.json` equals the `.raw.jsonl.gz` terminal successor/export; both remain authoritative. No report `.json` existed at intake. The pre-recovery source observation verifies all2087 source-manifest files and exact dirty state against the immediately preceding farm forecast.

## Cause and recovery scope

The driver confuses store lifetime with report lifetime. Freeze the summary in the audited terminal snapshot before cleanup; use it afterward. Preserve failed executed bytes. Reconstruct the missing report directly from terminal journal, settled-wave deltas and checkpoint, explicitly retaining original exit1/recovery provenance. Independently read back all income, custody, quests and clocks before resuming. Never replay either admission or restore salvaged items. No engine/data/UI change.

## Verification

Pending: report-emission regression without combat, scoped types/lint and independent recovered-report readback. The existing gameplay acquisition bound remains a nonwin, not completion of Plains or v1.

## Fixed verification

Driver v2 freezes the terminal acquisition summary before cleanup. Zero-admission native emission red exits1 on the original assertion; green exits0 and emits the exact checkpoint/export. Scoped `bug523-bone-types-v1`/lint and resume checks pass. Recovery-v1 originally mislabeled the combat draw as defeat and refused before report creation; corrected recovery-v2 and independent acquisition readback pass. Original emission exit1/bytes/journal/checkpoint and recovery provenance remain explicit. Recovered-source native route binds the independent report hash and clears Plains without replaying farming.

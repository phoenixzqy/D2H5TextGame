# BUG503 — Advance campaign admission time with consumed combat

Status: Fixed locally for empty-bonus campaign transport; targeted verification passed.
Severity: High — repeated samples cannot establish realistic loot acquisition.
Owner: Root (QA harness), private-v1 P15. Production seed generation is correct.

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty WSL/Node24.21.0
native campaign harness; locale/browser/viewport are not involved.

Reproduction: inspect `tests/campaign/native-runner.ts` and the retained
`p15-bow-act4-ranged-loot-continuation-v1.raw.jsonl.gz`. Date.now stays at
1793304000000 while12 admissions1466–1477 consume24 recorded battles. Native
`startSubAreaRun` hashes area/time, so these starts all share the same run seed.
The corrected loot tables produce107 items but no ranged item in this correlated
sample. The timestamp stays unchanged in the committed next1478 export.

Expected: the accelerated fresh campaign clock advances by consumed logical
battle time. Native area/time seed generation then sees the timestamp a real
later admission would see. Only played waves count; unplayed Flee recordings
grant no time/rewards. Save/export and the online bonus anchor stay coherent.

Actual: logical time is reported separately but never reaches Date.now, which
controls native admission seeds. Repeating the same acquisition batch cannot
fix this sampling defect. This is a transport defect, not a reason to override
runSeed or change production PRNG behavior.

Fix: install one task-owned campaign clock and advance it after each returned
wave by the recorded terminal duration. Checkpoint the online bonus through the
native meta service, preserving its basis and consuming elapsed online time.
Restore the caller's Date.now during cleanup. Use the shared clock in the
maintained fresh runner and new continuation drivers. Record start timestamps
and verify exact native area/time seed hashes in the new journal readback.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Preserve old reports and their earned successor. They prove their frozen-clock
samples and custody; they do not prove independent seed sampling or pacing.
Resume1478, retain all35actions and all newly earned rewards.

Verification: three clock arithmetic/ownership tests and the selected Act IV
partial-wave budget case pass. The maintained runner records admission times;
snapshot/export consumes only returned wave durations and restores the caller's
clock. Independent1478–1481 journal readback verifies four distinct native
area/time seed hashes, exact elapsed-time sums, no time/rewards for unplayed
Flee waves, coherent export/meta timestamps, and all retained reward custody.
The clock-aware successor is next1482, all35actions preserved.

Limitation: active online bonus consumption arithmetic is verified, but native
next-wave staging occurs before the caller advances this accelerated clock.
This does not establish full active-bonus transport equivalence. Current
fresh/continuation inputs have empty bonuses; do not broaden the claim.

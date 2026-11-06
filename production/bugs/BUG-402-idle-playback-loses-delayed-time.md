# BUG-402 — Idle playback loses delayed callback time

- Status: Fixed locally; focused, type/lint and native production browser verification pass. Full ordinary unit run finished: 1170 files/24808 tests pass; one unrelated campaign policy expectation fails (BUG-405).
- Severity: High — background idle progress falls behind the existing playback schedule.
- Environment: WSL/Linux, React CombatScreen, ordinary area idle mode; host timer throttling.
- Affected systems: idle playback and combat screen lifecycle.

## Reproduction

1. Start an ordinary eligible idle farm through the map.
2. Delay the first playback callback by ten seconds of host time.
3. Allow just that callback to run and inspect the recording cursor.

Expected: consume the elapsed existing playback delays across atomic timestamp
groups and qualified wave/repeat transitions, with one five-minute catch-up cap.
Actual: the callback consumes only one timestamp group, discarding the delay.
The focused `catches up multiple idle batches when the first timer wakes late`
regression exercises this without fabricating a victory or granting rewards.

## Cause and intended correction

CombatScreen schedules one `tick()` per relative timeout and retains no elapsed
clock. Add a transient coordinator for ordinary idle playback, preserving recorded
1×/2×/4× timing, unscaled 1500 ms transitions, native settlement authority and
Pause/Stop/hydration/recovery ownership. A destroyed runtime receives no backlog;
existing startup owns offline bonus handling. Native hidden-tab observation is a
separate integration check, not established by fake timers.

## Evidence

The unchanged twelve-profile baseline and source closure are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`
as `p15-earned-screen-closure-v1.json`. Prechange source files are preserved in
`p15-idle-prechange-v1/`. This defect does not explain the campaign combat draws.

The original late-wake regression failed at its intended cursor assertion
(`p15-idle-catchup-red-v1.log`). The transient coordinator now passes 24 focused
tests, including real native timely-versus-delayed wave-frontier equivalence,
cap boundaries, qualified settlement and nonwin reward conservation. All 35
CombatScreen lifecycle tests pass (`p15-idle-catchup-ui-v3.log`), including actual
Pause/Resume buttons, StrictMode, Retry and stale callbacks after Stop.

Independent review approved the four source/test files in
`p15-idle-catchup-independent-review-v1.md`. Strict types pass on the final source
(`p15-idle-catchup-types-v3-exit.json`). An isolated production build passes,
with seven JS chunks free of test-bridge tokens and required offline shell,
chunks and install icons present in the service-worker precache. Build identity:
`p15-idle-browser-build-binding-v1.json`.

Browser attempt v1 launched Chromium successfully but stopped before any game
case: its process-ownership check did not recognize Chromium's flattened
process-title arguments. This is a runner defect, not product/hiding evidence.
The attempt is retained at `p15-idle-browser-v1/`; its independent cleanup audit
confirms all recorded process identities absent, temporary profile removed,
owned port closed and bundle unchanged. A separately labelled corrected runner
will verify the actual hidden-tab path without changing game inputs or assertions.

## Final successor verification

The final lint-only delta passed independent review, clock24/24 and lifecycle
35/35; strict types and full zero-warning ESLint passed. Final idle clock and
quest SVG/two-Shaman source are bound in
`p15-idle-browser-build-binding-v2.json` (742production inputs,763bundle files,
seven bridge-free JS chunks; actual required offline-precache guard passes).

Native headed Chromium v4 passed150063.7ms ordinary farming, including65021.7ms
with trusted native hidden visibility. Seventy-seven committed snapshots retained
offlineTime0,active multiplier1 and remaining bonus0;74positive-XP snapshots and
ordinals0→6 demonstrate qualified automatic repeat. Pause, Stop and4060ms without
late awards pass. Offline reload and all required JS load from the service worker;
ordinary public combat/Flee/Save and offline public Home→Continue→town pass exact
non-time state and actual real-gap comparisons.

Earlier v1/v2 pre-app failures and v3 offline timing-bound failure remain retained.
Native hiding was corrected by disabling Playwright's forced focus on its exact
owning CDP sessions; no getters or synthetic events were used. V3's offline
screen was visible before asynchronous hydration completed. V4 bounds the resume
through completed public Export while retaining original screen timing; product
assertions and all non-time comparisons remain unchanged.

`p15-idle-browser-v4/result.json`, `evidence-review.json` and `cleanup-audit.json`
retain the accepted case. Independent audit confirms twelve owned process births
absent, temporary profile removed, owned port closed and unchanged bundle. Both
consumed build directories are now removed after manifest checks; all bindings,
snapshots and screenshots remain. This is constructed integration evidence,
not earned progression/pacing, hardware-sleep/full-close testing or P17 acceptance.
The focused300000ms cap tests remain distinct from the65second browser observation.

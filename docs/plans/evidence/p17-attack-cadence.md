# P17 — Attack interval near the combat log

Verified locally on 2026-11-04 at HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
Closes BUG676 (idle spec §5.3) and BUG677 locally; full private v1 remains open.

The combat scheduler emits silent hero cadence observations initially and only
when its actual interval changes. The UI displays only observations already
consumed by playback, hides absent/dead heroes, and preserves the complete initial
status prefix. The bilingual indicator beside the log reports attack interval
and equipment's Attack Speed contribution from canonical equipped/bare stats,
excluding learned passives. Playback speed does not alter its value. No reward,
RNG, scheduling formula, save format, timer or live region changes.

| Check | Result |
| --- | --- |
| Initial missing-feature reproduction | Expected RED: 9 failures |
| Pre-change refund fixture reproduction | 3 failed / 23 passed |
| Final affected suites | 219 passed, 12 files, 13.57s |
| Scoped strict types and explicit no-ignore lint | Passed |
| Production build and bridge scan | Passed; 10 JS chunks, no forbidden symbols |
| Desktop/mobile × English/Chinese browser | 4 passed in 13.2s; no skips/retries/page errors |

Tests cover actual Burst/Chill onset/expiry, interval clamps, related Vigor and
Decrepify effects, canonical equipment/passive/resource attribution, consumed
playback boundaries, negative/absent gear values and hidden dead heroes. Browser
cases create a character and enter combat through ordinary UI; native speed125
produces1500ms, unchanged at2x/4x. Five viewport sizes pass reflow/overflow checks.
All four screenshots were visually inspected across this and the prior review.

Three existing playback tests incorrectly expected player-only summon death
refunds from hostile owners. Replaying pre-cadence source reproduces all three
failures. Positive cases now use friendly owner/child with an inert surviving
opponent, preventing terminal orbs from masking missing refunds/carry behavior.
Three hostile no-refund controls at MP0/98/100 preserve their carry. Production
refund behavior is unchanged; all29 playback cases pass. The original failures
and baseline snapshots remain retained.

Local five-axis source/test/capture review found no material issue within scope;
no independent reviewer agent or merge approval is claimed.

Required evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-attack-cadence-v1`.
It retains source/baseline snapshots and hashes, RED/failed/corrected/final logs,
configuration evidence, build manifest, browser report, four PNG captures and
four native observations, task diff, review and cleanup receipt. Original lint
and typing harness errors remain alongside passing corrected checks.

All recorded consumers are terminal; port4399 is closed. Source hashes and all766
production file hashes matched before cleanup. Exact temporary runner/type
configs, build output and disposable browser results were removed and verified
absent; no cleanup failures. Root retains required evidence and the claimed
human2 worktree through umbrella review and owns eventual cleanup/release.

No campaign replay, full suite, install, new agent, commit/push/publication or
renewed closed preparation/diagnostic budget. Counts stay14intended ActI/3Normal;
formal balance0/210. Remaining scope includes build viability, balance/economy/
pacing, broader idle/MF/PWA/endgame integration, accessibility/performance and
final review/soak. Browser works; CI excluded; no pending external blocker.

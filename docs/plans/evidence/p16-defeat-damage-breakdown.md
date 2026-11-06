# P16 — Final-wave hero damage after defeat

2026-11-05. Implemented locally; full private v1 remains unfinished. The previous
goal turn was a status report and made no implementation progress.

This P16/G5 addition gives a player a concise damage breakdown before changing
gear or skills for a retry. The existing detailed log remains available. A pure
engine helper reads the existing final-wave recording, selects the player-side
hero through the native role contract, and groups positive, non-dodged direct
amounts by damage type. Unknown direct types use a localized generic bucket.
Periodic damage stays pooled: its raw provenance and rounding carry do not prove
exact typed HP shares. Prevention amounts are excluded. Both locales explain
that recorded amounts include overkill and self-damage and can differ from HP
lost. The summary does not attribute every recorded hit to an enemy.

The section appears only after completed loss/draw playback with the cursor at
the end. A missing hero or terminal recording displays unavailable details;
a valid completed recording without hero damage displays an explicit no-damage
state. The full recording is used, including damage older than the 200-line
visible log. No combat resolution, tuning, reward settlement, economy, save,
worker, or dependency change is included.

Two causal presentation RED cases reproduce the absent section in English and
Chinese. Six aggregation cases and eighteen actual-CombatScreen UI cases pass.
The sixteen existing reward-summary cases also pass against the final production
behavior. Initial checks caught one capitalized-English-label test expectation
and two strict optional-field fixture diagnostics; those test issues were fixed
without changing existing translations or production contracts. Reports retain
the intermediate failures. Scoped strict checking traverses 997 files with zero
diagnostics. Changed-file lint and the subsequent two changed-test lint pass;
locale validation proves the seven new keys match and existing locale data is
unchanged.

Twenty-four constructed Chromium cases render the actual CombatScreen in both
locales at 360×640, 412×915, 640×360, 1280×800 and 1920×1080. Checks cover exact
labels/amounts, loss/draw, unavailable/no-damage states, victory and incomplete
playback omission, no horizontal overflow, enabled keyboard-focusable 44px return
controls, and unchanged recorded teams/events/rewards/inventory/player state.
No page errors, console warnings or failed requests were observed. Four screenshots
are retained; both mobile locale screenshots were visually inspected.

These are presentation/aggregation checks, not earned progression, balance,
human pacing, physical-device, or whole-app acceptance. Five-axis self-review
found no required change; this is not independent signoff. No broad suite,
campaign replay or exhausted sample/retry budget was renewed. Historical 14/14
Normal completions and 210 checkpoint sources remain historical; formal balance
acceptance remains 0/210. P15 progression/challenge/acquisition/economy/pacing and
P16/P17/P19 integrated acceptance remain open. Browser works; CI is excluded;
the owner's playtest follows implementation and no user question is pending.

Root retains this packet through full-v1 acceptance and removes it after its
consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-defeat-damage-nubb2fmm`.
It contains scope/security/plan review, preimages, current snapshots and increment,
RED/intermediate/GREEN results, strict types/lint, browser driver/results/screenshots,
self-review and cleanup receipt. The driver closed its own browser/server; its
PID and listening port are absent. The exact task-owned Vite cache was removed
and absence verified. No disposable task paths remain.

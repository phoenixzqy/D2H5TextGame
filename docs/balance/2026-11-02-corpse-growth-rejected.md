# Corpse Explosion rank-growth experiment — rejected, 2026-11-02

The frozen +6 → +80 damage-per-rank candidate is rejected. All production,
engine-test and Skills-preview inputs are restored exactly to authority52;
all 2,141 source entries were verified after restoration. The historical
[experiment decision](../plans/decisions/P15-corpse-explosion-growth-v1.md)
remains immutable evidence of the proposal, not the current numeric contract.
D06's +6 curve remains controlling. Accepted balance cells remain 0/210.

| Outcome, 100 paired seeds | Baseline | Candidate |
| --- | ---: | ---: |
| Full-area wins | 5 | 96 |
| Defeats | 32 | 4 |
| Draws/timeouts | 63 | 0 |
| Intended target reached | 39 | 100 |
| Intended target won | 21 | 99 |

The paired outcomes are 93 loss→win, two loss→loss, two win→loss and three
win→win. Newly fatal candidate seeds are 21, 36 and 77. Two baseline-win
regressions and three newly fatal seeds violate the frozen retention rule,
despite the large aggregate improvement. No further coefficient was selected
against these seeds. The Act IV Corpse and curses progression problem remains
open; the experiment establishes no cross-act or fresh-campaign acceptance.

The 100 candidate areas took 54.947 execution seconds. All 100 canonical-priority
baseline areas were reused. A separate reader authenticated both source
versions, reconstructed 859 settlement deltas and verified 1,265 retained-unit
resource/cooldown transitions without replay. All failed attempts remain visible.
The candidate passed 160 affected engine/native/UI cases, scoped strict types,
changed-file lint and the actual catalog schema-load case before simulation.
Those passes do not override the failed gameplay criterion. Restoration reused
the exact earlier source and test bytes; no broad suites or combat reruns.

Retained-log diagnosis authenticates six baseline/candidate rows for seeds
21/36/77 without combat replay. Candidate21/36 cast Weaken at400/3600ms;
its3000ms duration expires6600ms, before the6640ms Charge burst. Baseline timing
covers that burst. Faster clearing changes carried cooldown timing legitimately;
no engine defect is established. Seed77's baseline times out earlier; candidate
reaches the last elite with196HP and a dead mercenary. Final-wave minimum mana
389/373/378 does not support mana starvation. Do not tune Weaken around these
seeds. `p15-corpse-growth-v1-cooldown-diagnosis-v1.json` preserves custody/events.

Evidence retained by root through full-v1 review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`:

- `p15-corpse-growth-v1.policy.json`: frozen source, budget and retention rule.
- `p15-corpse-growth-v1.json`: complete native result and raw custody.
- `p15-corpse-growth-v1-readback-v1.json`: independent paired result.
- `p15-corpse-growth-v1-rollback.json`: exact restoration and source verification.
- Candidate compressed raws and rejected byte snapshots remain required evidence.

Browser works; CI is excluded; no pending user question or external blocker.
BUG592 runtime performance, population balance/holdouts, representative economy,
defeat/retry, manual/idle, calibrated 30–50 active-hour pacing and integrated
gates/soak/independent review remain before owner playtest.

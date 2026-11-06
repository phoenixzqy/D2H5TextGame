# P15 — Wishstone kill-award rate candidate

Status: implementation candidate v2 (0.025), 2026-11-02; balance acceptance pending.
The original 0.020 rationale below remains historical; the revision follows.

P15 authorizes tuning actual currency faucets and publishing affordability.
D10 retains recruitment-only wishstones and the existing 10/90 prices. The
retained Normal pilot, after BUG575, grants 50,900 wishes in 20.333 combat
hours. A read-only native reward audit reconciles all 7,020 waves, including
unchanged shards/runes/gems: direct TC wishes 16,741, secondary wishes 34,159.
Guaranteed secondary amounts alone grant 32,721. Tuning just one source cannot
reach the intended recruitment cadence.

## Frozen tuning group

Add a required closed JSON probability, `currencyRewards.wishstones.killChance`.
Each rewarded kill first generates the existing direct and secondary bags, then
one independent coin either retains their **combined** wishstones or awards
zero. Conditional quantities and boss difficulty scaling stay as authored.
This explicitly replaces unconditional kill-wishstone guarantees in the legacy
drop/gacha prose; it does not change quest, first-clear or other non-kill grants,
stored wallets, recruitment prices, or pity. No essential unlock uses this coin.

| Candidate | Normal pilot expected wishes/combat hour | Act V fixed-cadence Hell projection |
| --- | ---: | ---: |
| 0.015 | 37.549 | 56.368 |
| **0.020** | **50.066** | **75.157** |
| 0.025 | 62.582 | 93.947 |

Act V projection uses the same 39,815,180.231 combat ms and enemy cadence,
11,478 direct + 22,683 secondary wishes, plus 1,476 ordinary-boss increments
of five and one chapter increment of twenty: 41,561 ungated wishes. It is an
arithmetic projection, not an earned Hell run or L70 population result. The
selected candidate implies about 71.85 combat minutes per 90-cost bulk pull
in that projection. Human decision time is uncalibrated.

## Implementation and acceptance boundary

Roll at the engine kill-award origin, after both sources merge, including the
missing-TC path. Quest-table rewards bypass this gate. Native settlement gives
each slain enemy a separate RNG fork keyed by its unique runtime ID and the
existing wave loot seed; ordinary and Find Item bags already have separate
seeds. Legacy idle uses its existing per-tick seed with a separate wishstone
fork. Batch generation accepts a separate continuous wishstone stream, so
successive batches never reuse the same indexed fork labels. Native parent
item/material RNG must not advance for these coins. Standalone kill/batch
callers may provide a separate RNG as the fourth argument; otherwise their
ordinary RNG supplies the new coin.

Required focused checks: reject invalid probabilities; hit/miss boundaries;
apply once across direct+secondary income; missing table; quest bypass;
preserve non-wish rewards and parent RNG with a dedicated stream; actual
native settlement and legacy idle regressions. Use retained journals for a
reward-only before/after bridge; do not replay completed combat.

Remaining: representative L70 Hell rates, per-build acquisition and economic
fairness, retry/manual-idle populations, calibrated active pacing, integrated
gates and owner playtest. This candidate earns no accepted balance cells.

## Candidate v2 — earned Hell cadence calibration, 2026-11-02

Change only `currencyRewards.wishstones.killChance`:0.020→0.025. The native
probability implementation is correct; this calibrates the existing tuning knob.
BUG591 records the diagnosis before editing. The actual earned70 sample retains
all48admissions/285wins/1defeat,10wishes/1.677509combat hours=5.9612/hour.
Its low outcome is unusually rare conditional on retained other loot rolls;
that trace alone did not justify tuning.

128 predeclared independent native reward/enemy-ID cohorts, holding captured
spawn contexts/hero MF/combat cadence and defeat denominator fixed, average
64.9540/hour under0.020 (approximate95%mean interval60.0687–69.8393).
The aggregate2.0076% gate rate supports correct authored probability behavior.
With0.025, the paired mean is80.6534/hour (75.5870–85.7199), p10/p50/p90
45.9014/77.4959/116.8399. All457728paired kills conserve nonwish payloads;
all128 old cohort totals reconcile. Raw policies/seeds/reports are retained in
`p15-earned-hell70-reward-cohort-v1` and `-v2` in the shared evidence packet.

The 54affected tests, scoped strict types/lint and material-schema validation
pass. No completed combat route is replayed, no historical wallet is rewritten,
and no recruitment price, pity or nonkill grant changes. This is conditional
combat-hour calibration, not measured80/active-hour acceptance, representative
build economics or six-hour pity distribution acceptance. Broader P15 gates stay
open and accepted balance cells remain0.

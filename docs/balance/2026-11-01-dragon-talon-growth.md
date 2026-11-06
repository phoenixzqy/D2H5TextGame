# Dragon Talon earned rank-growth correction

BALANCE-CHECK: CONCERNS

2026-11-01. BUG-547 fixes the rank-growth floor exposed by the earned Martial
Assassin Durance route. Only Dragon Talon's damagePerLevel changes4→40. Rank1
stays40–60; rank11 becomes440–460; rank20 becomes800–820 per attempt. Three
ordinary physical attempts, original target,4MP/1s and all mitigation/stop rules
remain. This is provisional tuning, not equal-investment balance approval.

## Before/after evidence

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Exact earned source: `p15-martial-act3-route-native-v3.json`, level28,XP68069,
next ordinal356. Owned equipment, skill orders and available points were compared
before training or the correction. Forecast rewards are discarded.

Baseline `p15-martial-act3-durance-talon-baseline-forecast-v1.json`: both paid
Talon11 and a legitimate free reset to Talon20 lose wave4. Talon20's original
116–136 per attempt barely reaches ordinary Defense129; resistance applies
before flat Defense. Fire, physical and poison use Defense, not magicResist.

Corrected `p15-martial-act3-durance-talon-corrected-forecast-v1.json`: Talon11
clears five waves but loses to Mephisto. Talon20/Tail11 clears all six waves;
Mephisto25.5s, terminal82HP. Native `p15-martial-act3-route-native-v4.json`
matches all forecast initial teams, events and metrics; readback-v4 independently
passes rewards, reset/refund/allocation, paid-item custody, final Claim and Act IV
unlock. Native report SHA256:
`6e7845d3a5b689cf374892eaf192ca0b1d7e923ffe40d17b7245ca1701e4d12a`.

## Validation and limits

Focused RED15failed/35passed precedes the data edit; GREEN50/50passes, including
native damage after mitigation, preserved rank1, closed schema/registration,
display and bilingual allocation. Scoped strict types and lint pass. Exact five
data/test paths are bound by `p15-talon-growth-source-binding-v1.json`; the
all2090 baseline production inputs were checked; exactly five paths changed.

These are paired deterministic progression controls, not a population death
rate, drops/hour study, optimal-level claim, challenge holdout or30–50 active-hour
pacing proof. Later Act IV attrition remains. Full build identity, cross-build
equal-investment balance, economy, holdouts and final integration acceptance are
open. No global Defense change, save-shape change or migration was introduced.

## Act IV follow-up: current growth is +60/rank

The initial +40 value above is historical. Current data uses+60/rank after the
retained on-chapter Izual reproduction. `p15-martial-act4-plains-growth-forecast-v1`
compares the earned source projected to48 with ordinary paid growth: Talon-only
survives but times out at60s, dealing15657 and leaving27544bossHP; Shadow support
also times out, dealing13552 while finishing994HP. Both discard all income.
Izual has43201HP,50% physical resistance and363Defense; the old cap minimum800
becomes37ordinary damage per attempt. Owned full sets, wards, speed and recovery
orders were compared first. No additional native farming was performed.

Growth40→60 yields rank11=640–660 and rank20=1180–1200. The cap minimum after
that boss mitigation is227 per attempt; it still obeys ordinary resistance,
Defense, hit, critical, shield, reflection and death. Rank1 stays40–60. No
weapon scaling, special boss override, timer bypass or save migration.

The new native maximum-rank50%/363Defense regression and exact display tests give
RED15failed/36passed; GREEN51/51passed. Scoped strict types and lint pass.
`p15-talon-growth-late-source-binding-v1.json` binds exactly the same five
data/test paths from the immutable +40 archives to current +60. Source-qualified
whole-area controls continue from the actual level28 save, not projected48.

Verdict remains CONCERNS. Neither paired control certifies equal-investment
cross-class DPS, the class-average ceiling, all-area/disjoint holdouts, drops/hour
or active-player pacing. Those gates remain required for final acceptance.

Actual-source qualification `p15-martial-act4-plains-party-ward-forecast-v1.json`
passes at28 without further farming. The native v2 report exactly matches all
five qualified wave teams/events/metrics and claims Izual; v3 completes Act IV,
including Diablo22.4s and the final Claim. Both independent readbacks pass. The
Rogue's owned full Arctic set and seven MR inserts preserve its support; the
hero uses owned complete-set, physical, arcane and speed preparation. These are
joint preparation/tuning outcomes; they do not isolate the +40→60 effect from
equipment changes. The native noncritical chapter-mitigation regression does
isolate the ordinary damage-floor improvement. Act V Bloody Foothills also
clears, while Frigid's arcane burst remains the next earned frontier.

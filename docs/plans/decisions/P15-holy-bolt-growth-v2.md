# P15 — Holy Bolt damage growth candidate v2

Status: proposed numerical correction for reopened BUG-535. Full balance and
independent design/QA acceptance remain open. Root is sole writer.

The55/rank candidate in v1 fixed Duriel but leaves200/200 fixed Mephisto
screening inputs as draws. The retained level25 full-area projection clears
all five group waves with Hammer first, then deals18301/33600 boss HP in60s
with Holy Bolt first. It preserves the exact earned source and uses no free
preparation. Level30 Conviction and owned speed comparisons fail qualification
as well; their income, levels and socket spending are diagnostic only.

Change only Holy Bolt scaling.damagePerLevel55→130, yielding2520–2540 at
rank20 while rank1 remains50–70. The factor addresses the observed primary-
first damage deficit with room for ordinary dodge/crit variation. Keep all
payment, cooldown, cap, target, mitigation, RNG and actual-damage50% healing
rules. No per-boss exception, timeout increase, injected growth or free gear.
This supersedes only v1's coefficient; its history and failed results stay.

Use the same fixed200 Mephisto tuning inputs before/after, reporting actual
wins/deaths/draws and victorious durations. This is diagnostic combat screening,
not earned Mephisto or holdout credit. Then requalify the whole unfinished
Durance from the exact earned25/22211/467 source and run a native continuation
with all six HP/MP/time results required to match and Guardian Claim once.
Run existing affected schema/combat/preview cases. Do not replay old acts.

Early-rank power/healing, earlier-boss TTK changes, later acts, acquired gear,
all-build identity, pacing and disjoint holdouts remain open. This coefficient
is a candidate, not final balance acceptance. Prior Duriel timings are for55;
they do not certify130. Rank1 numerical compatibility follows unchanged data;
no earlier-act acceptance run is repeated during this development slice.

Security check: pass. Scope: first-party local numeric skill data, documented
BUG-535 and fixed diagnostic battle inputs. Findings: none actionable. No new
credential, dependency, network, CI, permission, save or external input boundary.
Author plan review: correct the authored primary curve, preserve loss/retry and
custody gates, qualify full area before retaining rewards. No test weakening.


Local result: Holy-Bolt-first improves0/100→94/100 wins;6 draws remain, no
deaths. Victorious p50=46.92s/p95=59.34s. Hammer-first still draws100/100;
priority matters. The exact ordered200 policy/seed pairs and diagnostic input
match before/after. Fresh whole Durance qualifies6/6; native467 matches every
wave's HP/MP/time and defeats Mephisto41.4s. Guardian Claim succeeds once,
Act IV unlocks, exact final export independently passes readback. Existing33
affected cases and new-helper scoped strict types/lint pass. This is a local
correction with visible residual screen draws, not final balance acceptance.

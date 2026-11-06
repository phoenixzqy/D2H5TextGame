# P15 — Double Throw rank-based Attack growth

Type: provisional tuning of the existing per-rank Attack contribution, within
the authorized private-v1 implementation. Root is the sole writer. This records
the adopted result of the prospectively frozen BUG656 diagnostic; it does not
claim independent design, QA or formal balance acceptance.

Double Throw uses `scaling.attackDamagePctPerLevel: 30`, previously20. Each
resolved attempt adds `30% × (effective rank − 1)` of the snapshot Attack to
its flat Physical damage. Allocated ranks1/2/20 display0%/30%/570%; an actual
paid Battle Command grant can temporarily increase the effective rank through
the existing native path. The Attack term enters before combo, increased
damage, critical, Physical resistance and ordinary Defense.

The two total independent throws, original-target-pool rules, flat50–75/+5
per rank curve,12MP cost,1s cooldown, prerequisite/unlock and allocated cap20
remain in force. Double Swing retains20% per rank above one and its own
two-strike cross. The engine formula, schema, registration consumer, display
consumer, saves and migrations need no production changes; they already read
this finite nonnegative JSON field. There is no mitigation bypass or rank-one
damage increase.

BUG656's retained three Izual fights time out with4863–9657boss Life remaining
while the hero survives with ample mana. The sole30pp candidate targets earned
Attack and paid Throw growth. The bounded comparison reproduced all15control
events/outcomes and12published transitions exactly, then won all15candidate
battles with a living hero. Izual finished in54.5396/47.0578/50.4570seconds.
See [evidence](../evidence/p15-double-throw-rank-growth.md).

These are reconstructed historical inputs with exact observable controls,
not complete historical native snapshots. Comparing published openings uses
the actual `stageRecordedBattle()` boundary; opaque engine-paid Battle Command
carry comes from preceding real engine results. Neither reconstruction nor
successful isolated battles establishes campaign custody, rewards or a new
clear. Throw706–708 and all earlier preparation budgets remain exhausted.
BUG656 stays Open pending earned progression acceptance under a new prospective
scope; the diagnostic itself authorizes no successor campaign attempt.

Verification covers literal Attack sensitivity at ranks1/2/20 after25%
Physical resistance and ordinary Defense, unchanged Swing registration/growth,
schema/registration, bilingual current/next/MAX display, native target-pool
and damage accounting, learning for the next wave, and save rank/priority
roundtrip. Real browser previews use disposable synthetic imported saves,
never the earned campaign save. Later-act/population/holdout/pacing and final
independent review remain open.

Security check: pass for local JSON tuning and affected tests; no new
credentials, external requests, installs, CI, permissions or persistence shape.
The frozen plan permits one value only,15controls/15candidates and zero native
admissions, save actions, rewards or seed searches. Including the two stopped
predecessor controls,32diagnostic battles were consumed. All failures and
original save/journal hashes are retained. The20→30change is locally supported,
not final balance signoff.

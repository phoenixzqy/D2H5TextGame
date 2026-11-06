# P15 — Bounded earned Act I recovery

Adopted 2026-10-30 within the authorized private-v1 implementation scope.
This changes the campaign evaluation policy; production combat is unchanged.

The optional `CAMPAIGN_RECOVERY=act1-training-v1` mode exercises the existing
native Return, training, and fresh-admission paths. The default is `none`;
unknown modes fail before character creation. Historical first-nonwin screens
retain their original meaning. Reports and process metadata bind the mode.

Only a settled nonwin during the final Act I route can start recovery. Retain
the failed wave and its zero XP/items. Return normally, then train the last
fully cleared area until the hero earns one native level. Apply the existing
allocation/equipment policy and retry the entire failed area from wave one.
No imported checkpoint, resource grant, direct healing, or fabricated admission
is permitted. Native fresh admission already restores the hero and fielded merc.

Limits are two recovery cycles, level 14, twelve training admissions per cycle
and twenty total. Existing global admission, combat-time, wall-time and journal
limits remain. Intro, Den acquisition, training nonwins, technical failures and
budget stops propagate. Journal every start, actual training admission, retry
attempt and resolution; independently reconcile all retained nonwins and actual
admission references, including pre-entry recorder failures.

Meaningful regressions cover successful recovery, exhaustion, limits, failure
propagation, native refill, and persistent ownership conservation. A separately
declared fresh cold-sorceress screen measures the policy once after review.
Its outcome cannot by itself accept campaign balance, fourteen builds, pacing,
or the complete private-v1 goal. See [evidence](../evidence/p15-earned-act1-recovery.md).

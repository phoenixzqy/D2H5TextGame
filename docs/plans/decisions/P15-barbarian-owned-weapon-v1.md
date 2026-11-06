# P15 — Barbarian owned physical weapon preparation

2026-11-03. Preparation correction for BUG659/BUG656; neither Act IV failure is
resolved by this decision. All failed admissions and spent budgets remain closed.

## Cause and replacement

The retained Double Swing journal rejects every weapon decision under all-stat
nondecrease despite187 higher-Attack owned candidates. Native equip and rank
scaling already work. Reuse the existing `physical-offense-v1` mainhand selector
for intended Double Swing from its authored level6 unlock and intended Double
Throw from level12. Keep these transitions in campaign JSON. Other profiles,
earlier levels, armor and historical profiles retain their existing policies.

Use the existing native comparison and basic physical expectation, including
critical overflow and the400ms action-period floor; strictly higher expectation
may trade defensive stats, resources or speed. This is a preparation proxy, not
measured skill DPS, survival, acquisition odds, pacing or encounter acceptance.
No new game formula, skill restriction, coefficient or reward is introduced.

The preferred-weapon acquisition rule takes precedence over that score: Double
Throw must be able to acquire its first eligible owned throwing weapon even
when this lowers basic physical expectation. Once acquired, retain throwing
affinity. Keep deterministic score/ID ordering, native eligibility, two-hand
mutex, Iron Golem reservation, idle-only changes, retrieval/staging/capacity
fallback and full signed decision evidence. Use native equip and max-resource
clamps; create no equipment, XP, healing, spending or respec.

This extends the explicit opt-ins documented in
[Corpse/Bone preparation](P15-corpse-owned-weapon-v1.md) and qualifies the later
monotone rule in [intended owned equipment](P15-intended-owned-equipment-v1.md).
The full private-v1 objective and all other acceptance requirements remain open.

## Validation and boundaries

Write RED cases for offensive tradeoffs, exact unlock boundaries and first
throwing-affinity acquisition under active physical scoring. Run only the
affected equipment regression file, scoped strict types and explicit lint.
Existing cadence/critical, custody/economy, idempotence, reservation, eligibility,
mutex and full-container fallback cases must continue passing.

No campaign replay, combat or retained-save mutation is authorized by this
slice. Any future earned preparation or admission needs its own prospective
bounded protocol and must preserve every earlier loss, cost and exhausted limit.
Root retains human2 and required evidence through umbrella review and owns
eventual cleanup/release. No agents, install, CI, commit, push or publication.

Plan review: ready. The affinity override needs a separate reproduction because
enabling the score alone would mask the missing first-acquisition precedence.
Security check: pass; authorized local evaluation changes use existing guarded
transactions, with no external communication or credentials/permissions changes.

## Focused regression result

Six intended RED failures reproduce the absent opt-ins and affinity precedence.
The same unchanged-source run exposes one stale full-container fixture: it
expects an Act I survival second pass that this Sorceress profile does not opt
into. Its corrected contract requires the ordinary backpack fallback, one failed
stash retrieval, no survival pass and preserved stronger stash item. The first
GREEN run also exposes a new assertion's incorrect assumption: native offhand
equip may recover defense from the displaced throwing knife. Check the actual
mainhand-equip boundary's defensive trade instead of asserting final defense
must stay lower. Both original failed runs are retained. The corrected35cases,
scoped strict types and explicit zero-warning lint pass. No formula changed.

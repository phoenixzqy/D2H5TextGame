# BUG-793 — Restore ordinary two-handed weapon tiers

- Status: Implemented locally; static data checks pass; owner gameplay validation deferred.
- Severity: Medium — War Pike and Giant Thresher have only fixed unique goblin sources.
- Owner: root, solo content repair.

The canonical six-tier two-handed ladder in items-spec.md §3.9 promises these
bases, but ordinary two-handed source families skip both middle tiers. Some
late sources also stop offering their current usable ordinary tier.

Append only missing bands of the existing six-tier ladder within the finite
envelopes of sources already carrying ordinary canonical two-handed weapons.
Keep Battle Scythe's specialized five-socket polearm source, all fixed rewards,
original rows/weights/bounds, base stats and mastery rules. Reuse the established
supplementary source weight; goblins use their existing ordinary weight of 10.
No forced rarity, new bases, mechanics, save fields or gameplay tests.

Check JSON schema, references, level-band coverage and exact predecessor statically.
Drop odds, acquisition speed and balance are deferred to owner playtesting.

Implementation and static results: [source report](../../docs/plans/evidence/p15-ordinary-armor-and-two-handed-tiers.md). No gameplay tests were run.

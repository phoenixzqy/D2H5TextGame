# P15 — Skeleton owner-level progression

Status: bounded candidate; full campaign balance remains unaccepted.

BUG496 identifies capped body power against level-growing enemies. Add linear
JSON growth per owner level above1 to newly created player-hero skeletons/mages:
Skeleton +30life/+14Attack/+4Defense; Mage +20life/+10Attack/+3Defense.
These coefficients preserve rank1/owner1 body values and rank investment.
At owner12/Skeleton11 the unmastered body becomes542HP/199Attack/68Defense,
above the recorded98armor. At owner55/Skeleton20/Mastery20 it has3459.6HP/
1146.6Attack/298.8Defense; an ordinary physical hit can exceed Baal's560armor.
They are initial tuning values requiring native combat evidence, not a guaranteed
victory or accepted win-rate/TTK claim.

Apply rank growth first, owner growth second, existing Mastery/passives third.
Only fresh player-hero Skeleton/Mage bodies receive owner growth. Hostile bodies,
other templates, enemy-derived Revive, preloaded living summons and existing
startup/one-batch/cost/cap/death rules preserve their contracts. Growth coefficients
live in the existing validated Necromancer JSON definition; schema rejects missing,
foreign or invalid growth. No persistent new field or save migration is needed.

Pure previews accept explicit owner level (default1 for standalone base previews).
The Skills screen supplies the current player level for both current/next rank.
Runtime uses its actual current owner level, not a caller-provided preview level.
A malformed runtime owner level withholds earned growth while preserving existing
generic summon preparation; strict pure-preview input rejection remains unchanged.

Execution: focused RED for body progression, native damage past the armor floor,
preview equality and invalid/foreign inputs; implement shared growth; focused
GREEN and native exact retained Catacombs wave. Use separate immutable evidence
for before/after, skills/resources/teams/outcome, actual time/damage/deaths and
source hashes. Stop on a technical failure; retain nonwins. Do not replay earned
training/earlier acts or run a seed grid. Broaden testing only for affected
summon/preview consumers or an observed failure. Root reviewed this plan for
rank/owner/Mastery order, source custody, preview honesty and enemy exclusion.

# P14a02 — Authored monster attack progression

GD-DESIGN-REVIEW: APPROVE. TD-TECH-REVIEW: APPROVE.
Implemented by `e3bf53a`; root sole writer in claimed human worktree2.
[Execution evidence](../evidence/p14a02-monster-attack.md): shared runtime/eight
archetypes verified; CatacombsW4 still defeats the single earned route.
Full v1/C0–C4/G0–G7 scope remains unchanged.

The earned Catacombs comparison in P14a01 loses W4 before Andariel. All13
enemies are planner output, not summons. Of352incoming damage, Shaman physical
fallbacks deal240, Fire Bolts8 and Bone Warriors104. Fire Bolt is actually
zero-mana/CD2; mana starvation is not the cause. Resurrection is a separate
permanent self-buff placeholder and must eventually become real corpse revival;
no enemy dies in this recording, so it does not explain this loss.

`docs/design/monster-spec.md` establishes level-one attack plus level growth;
`docs/balance/early-game-spec.md` §3–4 accepts point-valued attacks for v1 and
authors32/+5 plus seven archetype coefficients. The current JSON/factory omits
that model. Do not freeze Shaman's level-one10–15 range at every level as a
local workaround. The earlier GD proposal to do that was withdrawn before edits.

## Approved shared representation

Add paired optional JSON/type `attack` and `attackGrowth` ranges. Require both
together; finite, nonnegative, ordered endpoints; fractions allowed. Resolve
each endpoint as `round((base + max(0,L−1)*growth)*tierAttackMultiplier)`.
Round only after level and tier scaling. Preserve exact stat overrides, which
also control the resulting ordinary damage. Unmigrated definitions keep the
legacy fallback. Scalar `stats.attack` is the rounded resolved midpoint for
existing scalar consumers. Carry the resolved range to ordinary combat, using
the existing damage pipeline without adding scalar Attack again. Point ranges
consume no new damage-roll RNG. Keep aura behavior and unchanged active skills.
Blood Raven's explicit fixed `basicAttack` remains higher priority.

| Archetype | Base point attack | Per-level growth |
| --- | ---: | ---: |
| Fallen |32|5|
| Carver |33.6|5.25|
| Quill Rat |27.2|4.25|
| Zombie |28.8|4.5|
| Dark Archer |35.2|5.5|
| Tainted |32|5|
| Bone Warrior |35.2|5.5|
| Fallen Shaman |13|2|

The first seven come from the balance specification. Shaman13/+2 is new,
provisional GD authoring: rounded midpoint of its documented10–15 level-one
intent, with caster growth below the melee baseline. It is not an old source
value recovered from the catalog. All109 monster definitions are not accepted
by migrating these eight. Other numeric authoring remains required.

| Shaman tier | L1 | L12 | L17 |
| --- | ---: | ---: | ---: |
| Trash ×1 |13|35|45|
| Elite / rare minion ×1.3 |17|46|59|
| Champion ×1.5 |20|53|68|
| Rare elite ×2 |26|70|90|
| Boss ×1.6 |21|56|72|

## Predeclared validation and route

Freeze genuine RED for real data/factory and ordinary combat, paired schema,
fractions/ordering/finite checks, exact overrides, active-skill compatibility,
point-range RNG neutrality, Blood Raven precedence and unrelated actor controls.
Plan review: ready with shared ordering/finite checks at central data and factory
boundaries; do not introduce an Ajv keyword that unconfigured consumers cannot
compile. Security check: pass; local authored data/pure engine/owned diagnostics,
no network, credentials, dependency, permission or publication change.

Baseline/candidate use retained P14a01 Catacombs W4 opening, seeds0–999 matched,
identical allies/resources and13enemies/HP/levels/tiers/affixes. Build candidate
attacks through the updated production factory without changing spawn RNG.
Combat only, no rewards/continuation; report every seed and paired transitions,
durations/resources. Select no favorable seed. After validation and cohort
review, replay the original earned four-map→Catacombs route once at unchanged
seed2223645302/ordinals102–106, stopping first nonwin. No farming, extra gear
selection/points/refills or reward-funded preparation. Preserve all earlier
failures. A W4 win alone accepts neither campaign pacing nor full balance.

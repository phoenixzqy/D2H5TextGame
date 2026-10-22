# BUG-087 — Monster ordinary attacks omit authored archetype progression

Status: open. Severity: High. Owners: engine-dev/content-designer; GD/TD/QA.

Environment: Node production-service continuation, implementation `06f3c88`;
locale/viewport independent. Retained P14a01 Catacombs old/reviewed reports.

Reproduce: restore the earned four-map final saveSHA
`c32f919de346b2230322630254e7d1e2c3e0cd0185398cc210064aa7ae22c3e0`;
attempt all Catacombs waves at seed2223645302/ordinal106. Both boss packages
win W1–3 and lose W4 at7653.846153846154ms, before Andariel. Do not replay from
either failed diagnostic export or finance preparation with its guard rewards.

Actual: every archetype falls back to generic Attack32/+5 per level. Thirteen
ordinary/champion L17 enemies include six Shamans; their physical fallbacks
deal240of352incoming damage. The intended archetype attack/growth model is
absent from all109 JSON rows. Shaman ordinary Attack112/168 dominates its
actual zero-mana Fire Bolt. There are no summons in the failing wave.

Expected: [approved shared attack contract](../../docs/plans/decisions/P14a02-monster-attack-growth-v1.md).
Use data-authored level growth/tier scaling once, exact overrides and existing
mitigation; preserve active spells and Blood Raven's explicit base action.
The Shaman13/+2 package is new provisional numeric design, not proof the old
level-one range must remain fixed at L17. Remaining catalog migration and real
resurrection remain open; changing corpse revival would not solve this wave,
which has no enemy death.

Root cause: monster schema/type/factory lacks per-archetype attack/growth,
leaving one generic fallback as ordinary combat damage for all monster roles.
No runtime fix, accepted balance screen or new route retry exists yet.

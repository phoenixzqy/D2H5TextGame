# D04 — Reachable summoners under automatic enemy focus

Provisional author design revision,2026-10-31. Root owns implementation and
verification; independent design/QA and final earned balance remain open.
Addresses BUG517 and the full-v1 mechanically distinct viable-build gate.

Hostile summons no longer receive implicit Taunt solely from their kind.
Sort hostile candidates by battle insertion order. Original monsters precede
their later replacements; existing initial arrays retain their explicit order.
Dead/friendly candidates remain filtered by the existing allegiance boundary.
Actual active Taunt still forces a living eligible source for single-target
attacks; area effects retain their existing sets. Player-side summons keep
their ordering and enemy attackers keep existing weighted threat and Decoy.
No additional RNG draw, remembered cursor, round-robin state or save change.

The earlier summon-first clauses in Double Throw and direct/AoE author
contracts are superseded only for hostile targets. Original bounded pools,
per-target hit/status order, independent RNG, reflection/death stops, geometry,
target caps, costs and cooldowns remain binding. Enemy-summon priority tests
must now assert the literal insertion-order targets and corresponding seeded
damage/status results, preserving all other assertions.

Why: summon-kind priority creates an automatic-focus barrier when multiple
owners replace bodies faster than a single-target build attacks. The player
has no manual target control. This prevents weapon/skill power from solving
the encounter and forces an area-damage secondary for target access. Adds
remain living attackers until killed or their owner dies under the existing
orphan lifecycle; summoning still adds pressure and is not removed.

Plan review: ready. Change the shared priority origin, prove source access
with native summoners across fixed seeds, retain explicit-Taunt/allied-threat
controls, check actual affected bounded/AoE consumers, then forecast current
earned ActV before native admission. Existing completed campaigns remain
historical; final integration must use current source. No prior-act replay.
Security check: pass; no dependencies, network, grants or audit changes.

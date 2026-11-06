# P15 — Early Frost Nova diagnostic policy

Adopted 2026-10-30 within the authorized private-v1 scope, using the existing
quick-design, TDD and bounded campaign workflow. This is a separate evaluation
policy; production skill values and the fourteen baseline policies are unchanged.

The [earned cold recovery screen](../evidence/p15-earned-act1-recovery.md) exposes
a mismatch: Nova-first casting spends five of eleven then four of seven actions
on rank-one Nova, while the sequential allocation policy invests in Blast until
rank twenty. Eight landed Nova hits against the first failed wave's two Dark
Stalker champions each deal one damage. Mana starvation and hero stun-lock are
ruled out by actual event/resource data. Poison and direct damage reconcile the
losses exactly; no production formula defect has been established.

Add only `sorceress-cold-nova5`: Warmth 1 at level 1, Frost Nova 5 at level 6,
then Ice Blast 20 at level 6. Preserve native starter ranks, stat allocation
(0 strength / 0 dexterity / 2 vitality / 3 energy), combo order Nova → Blast →
Bolt, hero gear policy, unequipped merc policy, route, RNG, budgets and recovery
caps. All points use native allocation; no free ranks, refunds or respec.

With the once-only Den point, the same earned budget at L12 changes Nova1 /
Blast13 to Nova5 / Blast9; L13 changes Nova1 / Blast14 to Nova5 / Blast10.
Nova raw damage changes 25–35 to 37–47 on every target; the four displaced Blast
ranks remove sixteen single-target raw damage. Costs, cooldowns and control do
not change. Earlier trash removal is a hypothesis; lower Blast can delay an
elite kill. This diagnosis does not predict success or approve numerical tuning.

Acceptance for the policy increment: a meaningful failing test, exact closed
registry/CLI/profile contracts, consecutive native allocation through L14 with
independent expected ranks and conservation, and a once-only native Den claim
boundary. Existing baseline/Impale/Poison2 profiles must remain exact. Then run
one separately declared fresh target-act5 screen with `act1-training-v1`, retaining
the first terminal nonrecoverable outcome and all failures. No retry of that
declaration, cap relaxation or success claim from partial progress.

Security check: pass. Local test policy/evidence only; no dependency, network,
credential, persistent-save, CI or publication change. Plan review: bounded and
isolates allocation order; root owns edits, existing advisers review read-only.
The unequipped merc and conservative hero gear policy remain explicit limits.

# P15 — Druid summon owner growth

Local provisional numeric correction for BUG552; root sole writer. Supersedes only
the no-new-growth statement in D06 Druid summon behavior. All other D06 authority,
one paid complete batch, no resummon and exact corpse/effect rules still apply.

## Evidence and choice

The actual12/next104 source has no free points, three free resets and no eligible
owned sets. Owned gear/orders and14-rank free-reset controls fail Cold Plains W3.
Max-rank Spirit Wolf's58Attack remains below the champion's79Defense; increasing
character level cannot strengthen capped pets. Four owned Elds clear the area by
turning the hero/merc into attackers while the entire summon batch dies with15damage.
Do not farm or accept this workaround as summon identity proof.

Add flat growth for each owner level above1 after existing rank scaling, before
existing aura composition. Use the existing Skeleton runtime/preview seam; no
new stat system, saved fields, grants, retries or encounter-specific exceptions.

| Template | HP/owner level | Attack/owner level | Defense/owner level |
| --- | ---: | ---: | ---: |
| Raven |20|10|3|
| Spirit Wolf |30|14|4|
| Dire Wolf |40|18|5|
| Grizzly |70|25|7|
| Poison Creeper |25|8|3|
| Carrion Vine |25|8|3|
| Solar Creeper |25|8|3|

Spirit Wolf follows the existing Skeleton growth budget, with Druid's own rank/cap
and aura rules. Raven retains faster attacks/Blind and lighter bodies; heavier
beasts trade count or speed for stats; vines retain their utility and ordinary
fallback attacks. Coefficients are provisional, not broad balance acceptance.
At owner12/rank14 Wolf becomes475HP/200Attack/67Defense. This escapes the existing
79armor floor without bypassing mitigation; incoming111base still causes44damage.

## Scope and proof

Strict schema requires all seven templates and all three nonnegative integral
coefficients (maximum500), rejects extra/nonfinite data; loader deep-copies/freezes
them. Owner1 remains byte-equivalent. Runtime grows only player-hero fresh bodies
with safe integral owner levels>=1; invalid owners keep the pre-existing generic
path. Pure owner-level previews use the same path and reject invalid levels.
Do not mutate ranked input stats, templates, caller definitions or saved state.
Hostile/merc/monster-backed bodies and unrelated templates retain their behavior.

RED/GREEN cover all seven owner1/12/55 rank1/2/20 stats, actual physical damage,
runtime/preview parity, immutable definitions and schema/actor/level guards.
Update native30 rank1/2/20 oracles for the explicit additive term; retain their
costs/caps/authority/replay/immutability assertions. Run affected summon mechanics
and preview checks plus scoped strict types/lint. Reuse unchanged browser/other-act
results; qualify exact actual12/104 before native continuation. Compare free and
paid plans again; never count discarded forecast XP or replay historical rewards.

Plan review: ready after requiring actual summon damage/survival rather than a
mercenary-carried victory, current-source qualification and unchanged native batch
payment. This is local author review; independent balance/QA acceptance stays open.
Security check: pass; authorized local source/schema/tests, no dependencies,
network, permissions, save migration, CI or external publication.

Implementation update,2026-11-01:210 affected checks and scoped types/lint pass;
the strengthened new regression selection passes10/10. The unchanged Cold Plains
policy now wins with actual summon damage/survival, and earned Acts I–III complete.
These observations support the correction without approving its numerical balance.
See [balance concerns](../../balance/2026-11-01-druid-summon-owner-growth.md) and
[earned continuation](../evidence/p15-druid-summon-earned-route-continuation-v1.md).


Earned five-act follow-through,2026-11-01: actual49/all29areas/64canonical actions
and all five final Claims/native Baal receipt independently pass. No additional
production tuning; the retained free Poison/Grizzly/wolf/Barbs policy clears the
last Act V frontier. Ancients56.96s/Baal9.10s and cold-heavy pack variance retain
CONCERNS for general balance, acquisition/pacing and holdouts. Full v1 is open.

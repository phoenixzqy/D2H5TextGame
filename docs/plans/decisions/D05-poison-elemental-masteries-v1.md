# D05 — Poison and Elemental Mastery

Root contract implemented in `09a2722` and locally verified. Independent acceptance and full C3/G2 stay open.
[Evidence](../evidence/d05-poison-elemental-masteries.md).
Preserve authored JSON potency and the fire/cold scope stated by both locales
and `docs/design/skills-spec.md`; supersede only their fixed30% descriptions.

| Authored / canonical identity | Class / unlock / cap | Per allocated rank |
| --- | --- | --- |
| skills-necromancer-poison-mastery / necromancer.poison_mastery | Necromancer /30/20 | +.04 poison and +.02 arcane damage |
| skills-druid-elemental-mastery / druid.elemental_mastery | Druid /30/20 | +.03 fire/cold damage and +.005 magical dodge |

Damage fractions add with existing same-type modifiers, before the ordinary
combo/crit/resistance/mitigation/floor pipeline. Dodge adds percentage points
to fresh equipment-derived magical dodge; existing downstream dodge caps apply.
No physical/lightning/thorns bonus; no owner bonus inherited by mercs/summons.
The existing final-hit-derived poison/burn snapshots include the increased hit
once. Do not scale ticks a second time, alter status duration/stacking, or invent
missing DoT coefficients (Poison Dagger's marker is a separate authoring issue).

Require exactly one row per authored identity, strict passive/self/zero-CD shape,
positive integer unlock/cap, closed exact per-rank coefficient objects with finite
nonnegative numbers. Copy/freeze primitives without retaining/freezing caller JSON.
Use the shared skill validator. Maximum valid positive integer under the two exact
aliases, clamped once; no implicit rank, similar alias or foreign class eligibility.
Native allocation retains prerequisite validation. Finite player level must meet
the copied requiredLevel; no new cost, action, cooldown, status or RNG draw.

Compose only at the fresh hero adapter. Current recordings stay frozen; ordinary
next waves and explicit replay refresh from original resource baselines. Reset
clears modifiers without accumulation/refill/income. Save shape/version unchanged.
Display current/next per-rank values in both locales, explicitly name fire/cold
instead of an ambiguous elemental row, and state next-wave/class/unlock/cap rules.

Plan review: ready after checking DoT ownership/snapshot ordering, existing
fire/cold promises, fresh-equipment/runeword addition, exact aliases, eligibility,
reset/replay pools and native save/Continue proof. Root self-review only.
Security check: pass; local typed combat/schema/copy/tests, no dependencies,
network/credentials, permissions, CI bypass or persistence changes.
Use root-cause-fix, TDD and incremental-implementation: retain causal composition
RED first, schema/display RED next, implement one coherent passive consumer, then
focused/native combat tests, engine/full/types/lint/build and production browser.
Constructed eligibility is functional evidence, not an earned campaign/balance proof.

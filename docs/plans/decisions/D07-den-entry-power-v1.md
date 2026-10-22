# D07 — Den entry power and authored family correction

Status: GD-DESIGN-REVIEW APPROVE, 2026-10-22; implementation/validation recorded
in the execution ledger. This accepts one authored family correction, not full
campaign balance, final onboarding or pacing. Root is sole writer/executor.

## Decision and rationale

Den is an early optional Act I quest with a skill-point reward, as retained by
[D07/D11](D07-D11-first-act-route-v1.md). Maps-spec §5 Act I table names Dark Ones
in its pool; the current Den flavor names the Dark One. Its W3 encounter instead
uses Dark Stalkers, the more durable Cold Plains family. The retained native L6
screen wins W1/W2 but draws W3; [complete diagnosis](../evidence/p01-den-wave-three-diagnosis.md)
shows no resolver, mana, carry or deadline defect. The rare leader takes171/855HP
in60seconds under current rules. Ice Bolt is learned but not slotted.

Change exactly `areas/act1-den-of-evil` / `w3` / `act1-den-w3-e1` /
`monsters[0].archetypeId` from `monsters/act1.dark-stalker` to
`monsters/act1.dark-one`. Keep count2, elite:true, authored level4 and all other
fields. Both legacy and active Den plans consume this shared authored row and
intentionally receive the substitution. No global monster, mitigation, tier,
affix, skill, reward algorithm, access or deadline change is authorized here.
The existing independent legacy test fixture with Stalkers remains a control.

At the retained ordinal40, W3 still has11bodies and the existing1rare/3minion
bounded group. Effective guard level remains7:

| Property | Old Stalker leader | Correct Dark One leader |
| --- | ---: | ---: |
| HP envelope |640–960|236–364|
| DEF / MR |77 /9|27 /9|
| Elemental resistance |55%|30%|
| Frost2 ordinary landed damage |3–8|10–17|
| Fire4/Warmth1 with Inner Sight, ordinary hit |1|9–20|
| Whole W3 HP envelope |1936–2960|926–1470|

W2's832–1312HP envelope makes the corrected W3 approximately11–12%larger,
instead of the old~2.3×jump. These static bounds do not predict victory or
final pacing; actual casts, RNG, focused targeting, survival and carry matter.

## Entry target and evidence budget

Preliminary target: L4–6, ordinary starter skills and free Inner Sight Rogue.
Legal L4 comparison: Frost1/Fire3/Ice1/Warmth1; Frost2 requiresL6. Lower-level
viability is an unmeasured target, not accepted behavior. First measured proof
uses the retained L6Fire4/Frost2/Ice1/Warmth1 build with actual two-entry
Frost/Fire order, earned gear/resources and existing40BloodMoorW1 acquisition
ceiling from [D07](D07-first-act-elite-power-v1.md). That ceiling is a bounded
screen and does not endorse40farms as final onboarding.

First preserve all actual resources. Run one reconstructed production-service
W1→W4 attempt from the retained earned input, stopping at first nonwin. No
extra acquisition, refill, seed sweep, registry/engine replacement or retry.
Report actual XP/items/currencies/clear and surviving inter-wave carry. A
successful reconstruction permits a separately frozen joined native C1 route:
Den→Akara talk/claim→legal upgrades→Andariel→boss equipment→Save/new-page
Continue, with mobile critical-path proof. A service success alone cannot
accept UI, acquisition, mobile, campaign or persistence.

## Regression and validation scope

Before runtime editing, reproduce the real data/planner/factory mismatch.
Assert the actual Den row, legacy substitution, active unchanged L7/tier/order,
and expected27DEF/9MR/30%resist/236–364HP. Across the13count ordinals in manual
and idle, reversing only the family must recover a cloned old full plan,
including W1/W2/W4, levels, counts, affixes, pity and RNG-dependent metadata.
Keep Dark Stalker definitions and every other map unchanged. Validate real
JSON loading/crossrefs, focused and full engine/unit tests, types, lint and
production build/bridge scan at final source. Broad class/tier/difficulty balance
certification remains P15; this scoped correction establishes no such verdict.

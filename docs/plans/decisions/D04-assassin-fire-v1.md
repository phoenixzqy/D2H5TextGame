# D04 — Assassin Fire hits and Phoenix elemental attribution

2026-10-25. Author implementation contract for
[BUG205](../../../production/bugs/BUG-205-assassin-burn-missing-periodic-damage.md).
Root sole writer; independent design/QA and earned balance remain open.
This advances the existing full213-skill objective without waiving charge,
trap, corpse, campaign or build requirements.

## Selected repair and preserved identity

Author explicit `statusEffect.dotPctOfDamage:0.1` on Fire Blast, Fists of Fire,
Dragon Tail, Wake of Fire, Wake of Inferno and Phoenix Strike. Match the
existing Fire Bolt/[Druid reference](D04-druid-fire-dot-v1.md); this is provisional
functional tuning, not earned balance. Do not add a global missing-rate default.
Preserve each skill's actual unlock, cap20, transitive prerequisites, target,
damage/growth, mana and cooldown; do not add weapon Attack scaling.

| Slug (`skills-assassin-…`) | Damage range / additional rank | Target | Mana / CD seconds | Unlock |
| --- | --- | --- | --- | --- |
| fire-blast | Fire50–70 / +5 | area cross | 25 / 2 | 1 |
| fists-of-fire | Fire45–70 / +5 | single enemy | 5 / 1 | 6 |
| dragon-tail | Fire70–100 / +6 | all enemies | 13 / 2 | 18 |
| wake-of-fire | Fire60–85 / +5 | all enemies | 17 / 2 | 12 |
| wake-of-inferno | Fire90–130 / +7 | all enemies | 25 / 3 | 24 |
| phoenix-strike | total120–180 / +12, equal Fire/Cold/Lightning | single enemy | 40 / 3 | 30 |

Phoenix must opt in to the existing shared-roll weighted-component runtime.
Its authored weights60/60/60 split the actual total roll, preserving the
design's rank1 range40–60per element. Apply each component's own mitigation,
bonuses and absorption, one Fire Burn, one Cold Chill and one Lightning
Paralyze. Burn captures only final positive Fire-component damage. One
action/payment/cooldown, shared dodge/critical/roll, original target and one
death/corpse settlement after the complete compound strike. Preserve existing
component status and personal-absorption ordering; damaging potency is captured
from the mitigated Fire hit before personal absorption, matching Vengeance.
Keep Vengeance behavior and all ordinary scalar skills unchanged. Schema
ownership expands narrowly to Phoenix with its actual identity/prerequisites;
invalid weights, statuses or missing opt-in fail validation.

Each positive Fire hit captures `max(1,floor(finalFireHit*0.1))` DPS per stack,
three seconds, aggregate cap5. Retain existing stack refresh/source/potency,
rate-less promotion, fractional interval carry, expiry/death and combo rules.
No repeated resistance/crit roll, new status runtime, save field or version.
The pure display must identify Phoenix's Fire-component rate and show all
three damage/status rows; existing bilingual Burn explanation is reused.

## Scope fidelity

Death Sentry is excluded from this potency patch: its Fire/Burn JSON conflicts
with the promised lightning trap and corpse explosions. Correct its complete
identity/runtime under a separate contract. Adding potency to the wrong Fire
identity would retain the defect. Its reproduced row stays unverified.

Fists charge behavior and persistent Wake traps remain advertised acceptance
requirements. Phoenix's charge/build interactions also remain open. Do not
delete promises or credit those whole skills solely for this hit/status repair.
Fire Blast's historical cone/trap description also differs from the actual
cross targeting preserved here. That identity gap needs explicit resolution;
this Burn repair does not silently redefine the cone promise as a cross.
Fire Blast/Dragon Tail credits require full targeting/native/UI/save evidence;
no credit is automatic from a schema or aggregate test pass.

## Ordered verification and self-review

1. Original84native cases/63positive zero-DoT hits are retained before edits.
2. Add failing actual-data/schema/display and native final-HP tests before the
   repair. Cover ranks1/2/20, each component and status, mitigation, misses,
   criticals, finite shields, one payment/cooldown, native prerequisites,
   immutable replay and scalar/Vengeance controls.
3. Prove bilingual unlearned/current/next/MAX details and public production
   allocation/configuration plus exact five-domain Save-close-Continue, with
   synthetic high-level fixtures disclosed. Check desktop/mobile geometry.
4. Run focused compatibility, engine, strict types, lint, full suite and isolated
   production build/bridge/precache checks. Freeze tested bytes; audit actual
   committed blobs, reconcile only fully proven inventory rows, archive evidence
   and remove exact task-owned artifacts after consumers finish.

Root security check: first-party local data/catalog/display repair, no network,
credentials, permissions, CI, dependencies or remote action. Root plan review:
ready after requiring Fire-component-only potency and excluding contradictory
Death Sentry identity; charges/traps remain open. These are author self-reviews,
not independent approvals. FullC2–C4/G0–G7/privatev1 remains incomplete.

## Earned Dragon Tail growth correction — 2026-11-01

BUG-548 supersedes only Tail's provisional +6 growth with +120 per additional paid rank. Rank1 stays Fire70–100; rank14 becomes1630–1660; rank20 becomes2350–2380. Preserve all-enemy targeting,13MP/2s, unlock18/cap20, prerequisites, ordinary Fire resistance/Defense/hit/crit/shields/reflection, powered Burn and one martial release per cast. No weapon contribution or save migration.

The earned Frigid controls compare paid orders, full owned sets, funded crafting and discarded37/40 party projections before tuning; even cap Tail previously fell at ordinary190Defense. New native cap tests preserve positive damage at50% Fire resistance/363Defense with a high irrelevant magicResist control. Current affected checks total163, with scoped types/lint passed; unchanged results reused. Frigid then clears natively at29 with Tail-first and owned wards, without farming. Full balance/holdout/build identity acceptance remains CONCERNS. Exact source transition: p15-tail-growth-source-binding-v2.json in the retained packet. See docs/balance/2026-11-01-dragon-tail-growth.md.

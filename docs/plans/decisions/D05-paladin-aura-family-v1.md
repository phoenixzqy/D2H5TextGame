# D05 — Complete the selected Paladin aura family

Local implementation contract; independent design, QA and earned balance open.
This stages the full twenty-aura requirement rather than reducing it.

## Shared rules

Exactly one explicitly selected aura; learning never selects. Class, authored
unlock and positive allocated rank qualify selection. Rank aliases resolve by
maximum, never sum; authored cap applies. Allocation keys use the existing
underscore canonical skill ID or authored data ID; the explicit selection domain
also remains an accepted rank alias. Copy rank, coefficients, hero identity
and the originally fielded merc identity into each native wave input. Only the
living source hero and original living fielded merc benefit; summons, enemies,
bench and ownership-forged units do not. Source death ends the effect at the
next calculation, including phase-preserving cadence reconciliation. Crowd
control alone does not extinguish an aura. No mutation of baseline saved stats,
resource refill, effect stacking or additional RNG. Original-input replay retains
its copied selection. Native edits apply next wave. Might and Meditation retain
their existing numeric, recovery and timing rules.

## First effect batch: preserve authored coefficients

| Aura | Effect per rank |
|---|---|
| Thorns | Reflect 4% of actual physical HP lost by a surviving recipient, using existing deterministic thorns mitigation; no recursive reflection |
| Blessed Aim | +3% Attack for basic attacks and Attack-scaled skill components |
| Fanaticism | +3% physical increased damage, +1% attack speed |
| Defiance | +4% Defense before existing defense reductions |
| Resist Fire | +1 percentage point to all six resistances, +1% fire increased damage |
| Resist Cold | +1 percentage point to all six resistances, +1% cold increased damage |
| Resist Lightning | +1 percentage point to all six resistances, +1% lightning increased damage |
| Salvation | +2 percentage points to all six resistances, +1% fire/cold/lightning increased damage |

These coefficients already exist in `paladin.json`. Named resistance auras retain
their authored all-resistance bonus; bilingual copy must expose that full effect.
Damage increases add to existing increases. Attack and Defense scale a fresh
baseline view. Resistances enter existing penalties/clamps. No aura multiplies
prior aura-modified state.

## Remaining required effects

Holy Fire/Shock require actual damage pulses; Holy Freeze requires enemy Chill;
Conviction requires enemy resistance reduction; Sanctuary requires undead damage
and explicit no-movement repulsion adaptation. Cleansing requires poison/curse
duration reduction; Redemption consumes authoritative corpses for life/mana;
Prayer heals; Vigor requires a truthful no-movement/stamina adaptation;
Concentration requires an explicit interruption-prevention rule. Existing JSON
and older descriptions disagree for these ten: resolve their affected rules and
data explicitly before implementation. Do not expose or count stat-only
substitutes as completion of those effects.

Save v22 follows [ADR-011](../../decisions/ADR-011-version-player-aura-selection.md).
No campaign action or diagnostic-save promotion is authorized by these tests.

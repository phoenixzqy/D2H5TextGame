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

## Enemy-effect batch: Holy Freeze and Conviction

Local implementation decision; independent design/QA/balance acceptance open.
These implement existing advertised effects through the selected wave projection.

Holy Freeze uses the shared JSON-owned Chill multiplier for every living enemy
while the eligible source hero lives. It derives observable Chill with the hero's
source ID, without persisting enemy statuses or impersonating a mercenary source.
Ordinary Chill and native mercenary Holy Freeze share one slowdown, never stack.
Pending action progress is preserved when a source disappears. The mercenary's
separate party-wide cold bonus remains mercenary-only. Preserve authored unlock18,
Holy Fire prerequisite, +3% cold damage and +0.5 percentage point physical dodge
per allocated rank for hero/original living fielded merc; cap20. Crowd control
does not extinguish a living hero's aura.

Conviction subtracts a JSON-owned25 percentage points from all six resistances
of living enemy defenders while the source hero lives (zero becomes-25). It adds
to existing attacker penetration/curses before ordinary act penalties and clamps.
This enemy debuff also benefits damage from allied summons, whereas its authored
+2% fire/cold/lightning and +1% arcane increased damage per rank apply only to the
hero/original living fielded merc. Preserve authored unlock30, Sanctuary prerequisite
and cap20; this resolves the old spec's contradictory unlock24 and mislabeled
Chinese name. The resistance reduction is fixed across ranks; the damage bonuses
scale. Add strict `conviction.enemyResistReductionPct` data/schema metadata, not
an engine constant. No new RNG, raw resistance mutation or saved transient state.

Acceptance requires actual cadence/status provenance and six-type mitigated damage,
source death/CC/forgery controls, additive Cold Mastery/Amplify Damage, native public
allocation/selection/next-wave/replay, and bilingual production persistence/layout.

## Remaining required effects

Holy Fire/Shock require actual damage pulses; Sanctuary requires undead damage
and explicit no-movement repulsion adaptation. Cleansing requires poison/curse
duration reduction; Redemption consumes authoritative corpses for life/mana;
Prayer heals; Vigor requires a truthful no-movement/stamina adaptation;
Concentration requires an explicit interruption-prevention rule. Existing JSON
and older descriptions disagree for these eight: resolve their affected rules and
data explicitly before implementation. Holy Freeze/Conviction follow the resolved
contract above and have [bounded local verification](../evidence/d05-paladin-enemy-auras.md).
Independent design/QA and earned class/build balance remain open.
Do not expose or count stat-only
substitutes as completion of those effects.

Save v22 follows [ADR-011](../../decisions/ADR-011-version-player-aura-selection.md).
No campaign action or diagnostic-save promotion is authorized by these tests.

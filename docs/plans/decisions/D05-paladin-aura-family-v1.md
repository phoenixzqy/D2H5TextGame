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

## Pulse batch: Holy Fire and Holy Shock

Local implementation decision; independent design/QA and earned balance open.
The old Holy Fire text specifies20 fire damage/turn and burn, but neither skill
has a pulse consumer or pulse tuning. D04 makes simulation seconds authoritative;
legacy five-second turn markers do not define an aura interval. Use an explicit
JSON-owned1000ms interval, first pulse one full interval after each wave entry.
Holy Fire preserves the advertised20 base fire damage and authors burn as10% of
the mitigated pulse damage per second for3000ms. Canonical Ignite stacking,
original-potency refresh, max-five cap, finite expiry and periodic settlement
remain authoritative. Holy Shock receives a provisional20 base lightning damage
on the same interval; this newly specified tuning requires earned balance review.
Preserve each aura's authored +3% matching-element increased damage per rank,
unlock6/24, existing prerequisites and cap20 for hero/original fielded merc only.

Each selected living hero emits one automatic pulse against every living enemy
in registration order. It persists through source crowd control, uses no mana,
cast, cooldown or action-budget slot, and cannot occur before its first interval.
Pulse damage uses the source's matching increased damage, existing combos,
resistance penalties/clamps, flat mitigation, minimum damage and Bone Armor.
It has no dodge or critical roll. Pulse and guaranteed Burn application consume
no damage/proc RNG; normal deaths retain their existing seeded side effects.
Source death during periodic settlement prevents a pulse at that same boundary.
Settle existing periodic effects and deaths before pulses, then reconcile cadence
and permit surviving tied actions. The60000ms deadline includes a due pulse;
the action cap must never fabricate a future pulse. Never catch up after battle
end. Every pulse retains actual hero provenance and normal exact-once death,
corpse, reward and summon consequences. Learning never selects an aura.

Copy strict `auraPulse` JSON metadata into the shared selected wave projection;
only these two exact skill IDs may own it. Fixed positive damage, integer interval
1000–60000ms, matching fire/lightning type, exact Fire-only finite Burn tuning
and rejection of unknown keys are required. Deep-copy nested tuning and reject
forged/missing/foreign direct-engine potency. No new save version or transient
payload; savev22 already permits both canonical selection IDs. Native edits apply
next wave and explicit replay starts from original inputs with no duplicate income.
Dream's item-granted Holy Shock remains governed by its separate D10 contract.

## Healing batch: Prayer

Local implementation decision; independent design/QA and earned balance open.
The old formula's20 HP/turn and authored3% lifeRegenPct/rank have no HP consumer.
Define explicit JSON-owned20 base healing every5000 simulation milliseconds,
starting one full interval after wave entry. The five-second interval is a new
provisional local default, not inferred from presentation turn markers. Each
recipient restores floor(baseAmount × (1 + allocated-rank lifeRegenPct)), capped
to actual missing HP: rank1 gives20, rank2 gives21 and rank20 gives32 per pulse.
Do not activate the old unused Vitality baseline or percentage-of-max-life regen.

Only the living selected hero and original living fielded merc heal, in unit
registration order. Crowd control does not suppress the aura. Dead units never
resurrect; full units skip without banking, fractional carry or a heal event.
Settle existing periodic damage/deaths first; source death prevents a same-time
pulse, then heal before surviving tied actions. Include a due60000ms pulse;
action-cap/battle-end stops never fabricate future healing. Healing consumes
no mana, cast/cooldown, action slot, or RNG. Emit only actual positive restored HP
through the normal heal settlement and playback path, with no saved-stat mutation.

Require exact Prayer-only `auraHealing` metadata with exactly `amount` (finite
positive base HP) and `intervalMs` (integer1000–60000), plus aura/passive/self/CD0
and no ordinary damage/status/effects. Copy/freeze metadata into the existing
selected wave projection and reject missing/foreign/invalid direct-engine tuning.
Learning never selects or refills. Ordinary native edits take effect next wave.
Explicit diagnostic configuration replay retains original wave teams, resources
and seed, composes current selected configuration under existing replay rules,
and grants no income; identical configuration reproduces the exact recording.
Every wave starts its own full interval.
Preserve unlock1/cap20/no prerequisites. Savev22 already permits Prayer; selection
alone persists, with no healing timers, potency, carry or save migration.

## Cleansing: finite duration reduction and independent recovery

Local implementation decision; independent design/QA and earned balance open.
Preserve unlock12, Prayer prerequisite, cap20, authored lifeRegenPct1.5% and
magical dodge0.5 percentage point per rank. Cleansing-only JSON `cleansing`
owns durationMultiplier0.5 and independent healing `{ intervalMs:5000, amount:20 }`.
The factor and healing base/interval are explicit provisional local defaults.
Do not infer them from D2, turn markers, a Prayer synergy or a general Vitality
regeneration baseline. Prayer-only top-level `auraHealing` remains forbidden on
Cleansing; only the generic selected projection/healing settlement is shared.

While the source hero lives, the eligible hero/original living fielded merc
shorten finite Poison, Plague and named Necromancer curse status durations by50%.
The exact curse set is Amplify Damage (including legacy `amplify`), Decrepify,
Dim Vision, Weaken, Iron Maiden, Terror, Confuse, Life Tap, Attract and Lower
Resist. This changes their duration only; it does not establish implementation
or acceptance of the other skills' still-unverified effects.

For incoming timed applications, multiply the original duration after boss
scaling, then floor once to at least1ms. On first eligible wave admission or
refresh of an unmarked active record, shorten only its remaining finite duration;
future records keep their start and shorten the full future duration. Preserve
source, DoT potency, stacks, start, legacy remaining counter and max-expiry
refresh identity. A transient status-local `cleansingShortened` marker follows
the same record across waves and prevents repeated admission reduction.
Incoming refresh duration is independently reduced once; a fresh application
after expiry is a new record. A later unshortened refresh that extends expiry
clears the old marker. Poison death spread consults each recipient independently
and never inherits the source's marker. Missing/indefinite expiry and unrelated
statuses remain unchanged. Source death suppresses future effects but never
lengthens a duration already shortened. Crowd control alone does not suppress.

Independent recovery uses floor(20 × (1 +1.5% × rank)), giving20/20/26HP at
ranks1/2/20 every5000ms, first heal one full interval after each wave entry.
Preserve Prayer's shared living-recipient, periodic-death/tie/deadline/cap,
missing-HP floor/cap, no-resurrection/no-banking/no-RNG/no-action/mana rules.
Magical dodge adds through ordinary damage resolution; physical dodge is unchanged.
Savev22 already admits selection; no combat status marker, recovery timer or
potency is persisted. Native ordinary edits apply next wave; explicit unlocked
configuration replay uses current selection over original teams/resources/seed
without income, as in the shared contract.

## Redemption: shared corpse consumption for life and mana

Local implementation decision; independent design/QA and earned balance open.
Preserve unlock30, Meditation prerequisite, cap20 and authored2% lifeRegenPct and
manaRegenPct per rank. Redemption-only JSON `redemption` owns intervalMs5000,
life20 and mana10. These base amounts and interval are provisional local tuning.
Each eligible recipient restores floor(base × (1 + matching2% × rank)), capped
independently to missing resources: ranks1/2/20 give20/20/28 HP and10/10/14 MP.
No implicit baseline regeneration or Prayer/Meditation synergy. Existing
`item.redemption` remains a separate active self-heal under its own contract.

The selected living hero consumes at most one oldest available body per due
pulse from the same authoritative wave-local FIFO pool as Corpse Explosion and
Poison Explosion. That one body recovers both the living hero and exact original
living fielded merc in registration order. Preserve source/recipient ownership
and kind guards. Each full resource, invalid maximum or zero-rounded recovery
grants nothing; dead recipients never qualify. If nobody can receive a positive
amount, preserve the body.
An empty pool skips the pulse without banking. Crowd control alone does not
suppress the aura. Dead recipients never resurrect. Bodies are supplied only
by the existing primary enemy-monster death closure, once; initial dead inputs,
summons, ownership-forged victims, orphan-only deaths and cross-wave bodies do
not qualify. Do not introduce a parallel pool or replay death consequences.

Use the existing selected aura timeline, first pulse one full interval after
each wave entry. Periodic deaths and ordinary interval mana settlement precede
the pulse; source death prevents it. A pulse at the same timestamp precedes
surviving active casts, so it may consume a corpse before a tied CE/PE action;
an earlier CE/PE cast has already consumed its body. Include due60000ms recovery,
but never fabricate future recovery after an action cap or battle end. Reuse
normal HP settlement and MP commit/cap-carry semantics; emit only actual positive
resource changes and truthful corpse-consumption feedback. No extra RNG, action,
cast/cooldown or mana payment. Save remainsv22; no corpse, timer or potency is
persisted. Ordinary changes apply next wave; explicit current-configuration
replay retains original teams/resources/seed without duplicate income.

Require exact finite positive life/mana and integer1000–60000ms tuning, owned
only by the exact passive/self/CD0 Redemption row. Copy/freeze at definition,
native projection and direct-engine boundaries; missing/foreign/invalid tuning
provides no effect. Existing Prayer-only healing and Cleansing-only metadata
remain separate. Bilingual descriptions must explain consumption, recipients,
timing, rank scaling and full-resource preservation.

## Vigor: temporary endurance and attack cadence

Local implementation decision; independent design/QA and earned balance open.
The game has no movement or stamina resource. Replace those old copy promises
with explicit endurance and attack cadence using the existing unchanged JSON:
lifePct2% and attackSpeedPct0.5% per rank, unlock18, Defiance+Cleansing
prerequisites and cap20. No invented movement, stamina or additional dodge bonus.
Only the living hero and exact original living fielded merc qualify while the
source hero lives; crowd control alone does not suppress the aura.

Temporary capacity is base maximum life + floor(base maximum life × lifePct ×
rank), composed over fresh equipment/passives once. Preserve absolute HP, capped
to that capacity. Selection, admission and rank changes grant no HP, percentage
refill or resurrection. The existing fresh-run base-full initialization stays
base-full. Actual existing heals and HP orbs use and may fill the temporary
capacity; attack cadence uses the shared phase-preserving speed consumer.

One transient base/applied maximum record prevents compounding when combat units
carry into another wave. Recompose from the original base; preserve actual HP
up to the current eligible capacity. Native fresh equipment replaces the base
without prematurely clamping carried HP to the smaller unboosted maximum.
Source/recipient death removes the capacity, caps HP to the base without a damage
or healing cue, and settles before death-orb effects. Authoritative capacity
observations keep playback HP bars, healing and caps aligned with the engine.
The marker and capacity never enter persistent Player/Merc stats or saves;
save remainsv22. Ordinary edits apply next wave; explicit replay uses current
configuration over original resources/teams/seed without duplicate income.

## Sanctuary: authored undead pulses and repulsion adaptation

Local contract; implementation/independent design/QA and earned balance open.
[Explicit monster classification](D05-monster-undead-v1.md) is the sole undead
identity authority. Literal true marks an eligible living hostile unit; absent,
false or malformed truthy identity never qualifies. Allied units never qualify.
Apply to all currently living hostile units with that explicit marker, including
reinforcements admitted after wave start; do not infer from names or IDs.

Preserve unlock24, Thorns prerequisite, cap20 and authored3% arcane damage per
rank for the living hero/original living fielded merc. Sanctuary-only JSON tuning
owns intervalMs2000, damage20 and repulseDurationMs500. These pulse/control values
are provisional local defaults; they do not establish earned balance.
The selected living hero emits deterministic Arcane pulses to eligible undead
in registration order, starting one complete interval after each wave entry.
Use existing source increases, combos, independent magical mitigation and
resistances. No resistance bypass, crit, dodge or extra damage/status RNG.

The game has no movement/range system. Repulsion explicitly becomes canonical
Stun on each surviving eligible target after pulse damage, independently of
final HP loss under existing mitigation/absorption rules. Base duration500ms; existing boss/chapter-boss multiplier
halves it to250ms. Use the existing exact timed status/refresh/action-skipping
rules and truthful Stun observations. Never move targets or invent knockback.
Lethal damage closes death before any repulsion; existing death/orb/corpse
machinery remains authoritative. Source crowd control alone does not suppress
pulses; source death stops future pulses. An already applied Stun keeps its
normal remaining duration after source death. Periodic deaths settle before a
due pulse, which precedes surviving tied actions; existing deadline/action-cap/
battle-end rules remain. Do not bank missed pulses or frontload wave entry.

Copy/freeze exact finite tuning at definition, native and direct-engine
boundaries. Missing/foreign/invalid tuning gives no selected effect. Keep Holy
Fire/Shock pulse metadata closed to its existing owners. No saved aura timer,
undead marker, status or potency; save remainsv22. Normal changes next wave;
explicit current-configuration replay uses original resources/teams/seed with
no duplicate income. Both locales must describe actual undead targeting,
Arcane bonus, pulse timing and Stun adaptation.

## Remaining required effects

Vigor follows the explicit temporary endurance/cadence contract above and has
[bounded local verification](../evidence/d05-paladin-vigor.md). Eighteen of20
selected Paladin auras now have supported effects. Sanctuary still requires
an authoritative undead classification, undead damage and an explicit
no-movement repulsion adaptation. Concentration still requires an explicit
interruption-prevention rule. Existing JSON and older descriptions disagree
for these two: resolve their affected rules and data explicitly before
implementing the remaining mechanics. Do not count stat-only substitutes as
completion of those effects.

Other family evidence remains bounded:
[stat auras](../evidence/d05-paladin-stat-auras.md),
[Holy Freeze/Conviction](../evidence/d05-paladin-enemy-auras.md),
[Holy Fire/Shock](../evidence/d05-paladin-pulse-auras.md),
[Prayer](../evidence/d05-paladin-prayer.md),
[Cleansing](../evidence/d05-paladin-cleansing.md) and
[Redemption](../evidence/d05-paladin-redemption.md).
Independent design/QA and earned class/build balance remain open.

Save v22 follows [ADR-011](../../decisions/ADR-011-version-player-aura-selection.md).
No campaign action or diagnostic-save promotion is authorized by these tests.

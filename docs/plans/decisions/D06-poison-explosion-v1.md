# D06 — Poison Explosion and damaging status refresh

Status: accepted bounded mechanic contract, 2026-10-22. Independent GD/TD/design
APPROVE, QA-PLAN APPROVE/ADEQUATE and producer ready are recorded in ledger v1cc.
Runtime implementation remains pending. This document grants no runtime, earned-L18, balance,
player-feel or full D06/P09/P10 acceptance. Root is sole writer/executor in the
existing claimed worktree; every increment owns at most five paths.

## Overview and controlling sources

Poison Explosion (PE) turns one actual current-wave enemy-monster corpse into
an all-enemy poison hit and a damaging Poison status. It extends the accepted
[CE pool contract](D06-corpse-consumption-v1.md), not corpse-free summon startup.
Preserve authored Necromancer JSON unlock18, Poison Dagger prerequisite,
rank1–20,15MP,2s and damage40–60,+5/rank. Add explicit
`statusEffect.dotPctOfDamage: 0.05` through the ordinary JSON adapter. Poison's
existing default is5s/max10 stacks; no duration adapter extension is required.

[D04 timing](D04-combat-timing-v1.md), [fire aliases](D04-fire-status-alias-v1.md),
`src/engine/combat/status.ts`, `combat.ts` and `types.ts` control integration.
Today PE has neither corpse qualification nor DoT potency. Poison Dagger also
creates a potency-free Poison marker. Active `applyStatus` refresh retains the
old payload, so adding PE potency alone would fail after its own prerequisite.
This contract explicitly changes that shared refresh boundary. Pillar and
anti-pillar files remain absent; no missing-document approval is inferred.

## Player fantasy, alternatives and tradeoffs

The Necromancer earns a first kill, then converts its body into pressure on
survivors. This supports Challenge, Discovery and Competence with automatic
combo priority. One body pays for one cast, shared with CE; selection order
settles competition. There is no new corpse-selection click or inventory item.

Use the existing single-record aggregate Poison model rather than independent
per-hit rates. Retain a valid first rate; a marker cannot suppress the first
later damaging application. Implement that rule in shared status refresh,
avoiding a PE-specific status branch. All current aggregate stacks then use the
adopted rate prospectively, a deliberate tradeoff against per-stack provenance.
Preserve existing ordinary Poison/Plague death spread as bounded compatibility;
the wider design distinction between those families remains unresolved.

## Detailed rules: authority and corpse commitment

1. Compose a separate optional readonly PE projection from actual Player data.
   Require nonempty hero ID, Necromancer class, integral character level>=18,
   allocated PE and Poison Dagger. Exact aliases are
   `necromancer.poison_explosion` / `skills-necromancer-poison-explosion` and
   `necromancer.poison_dagger` / `skills-necromancer-poison-dagger`. Resolve the
   maximum valid integral rank1–20 per skill; ignore invalid aliases without
   summing/clamping. No Teeth/CE prerequisite, equipment, legacy skills or
   generic implicit rank proves eligibility.
2. Copy only `{ sourceHeroId, rank }` primitives. Missing/malformed arrays, holes,
   extra fields or duplicate source IDs disable the complete PE projection
   array. Keep the CE projection independent. Runtime requires a living finite-HP
   player-side hero, level>=18, with no summon/owner markers. Combo order remains
   necessary to select PE. Synthetic CombatUnit alone grants no authority.
3. Validate authored PE/prerequisite independently of mutable registration.
   Preserve Dagger unlock6/cap20/no prerequisite. Exact PE active/all-enemies
   semantics are one poison damage effect, base40–60,+5/rank, poison tag/status,
   0.05 potency,15MP/2s and the authored unlock/cap/prerequisite. Ignore only
   presentation metadata when validating source. Refuse sparse/additional effects,
   altered resource/rank/status/chance/target semantics and alias replacements.
   Gate both requested order identity and resolved identity, including startup
   paths. Unrelated synthetic or monster spells keep their current behavior.
4. Enable corpse collection when either valid CE or PE authority exists. Share
   the accepted CE FIFO, death closure, eligible primary enemy-monster identities,
   initial-dead/summon/orphan exclusions and exactly-once credit. PE-only battles
   must collect supply. Extend the invariant to
   `available = eligible deaths credited - accepted CE casts - accepted PE casts`.
   Both consumers compete in existing action order; neither receives a copy.
5. Selection checks authority, exact semantics, living enemy, finite affordable
   mana, cooldown and supply with no mutation or RNG. Empty supply skips PE to
   the next legal combo/basic attack in that same scheduled action. Recheck at
   synchronous commitment; remove one oldest token, debit15MP and start2s cooldown
   before effects. At14MP, active cooldown, dead actor, no living enemy or invalid
   authority, consume nothing. Every target dodging still spends the accepted cast.
6. Preserve ordinary target order and recheck liveness per target. Each hit uses
   ordinary rank/crit/mitigation/combo/dodge logic. Dodges apply no status. Current
   hit processing applies Poison before closing a lethal hit, so that death may
   spread Poison onto later living targets before their PE hit. Keep this ordering.
7. Never delete a dead unit, death/reward identity or handled-death marker to
   consume a body. Preserve exactly-once XP/loot/orbs and no recursive/free cast.
   PE direct/periodic kills can supply later scheduled casts; final-enemy death
   ends combat before any further action.

## Detailed rules: shared active-refresh promotion

Valid potency is a numeric finite `dotPerStack > 0`; preserve positive fractions
exactly. Only the first matching active status record participates, including
legacy Burn/Ignite aliases. In `applyStatus`'s existing active-refresh branch:

- Valid previous potency retains previous rate, source and optional damage type,
  even when the incoming rate is stronger, weaker, invalid or missing.
- Invalid/missing previous potency plus valid incoming potency copies incoming
  rate and source. Copy an incoming optional damage type when supplied; otherwise
  retain the previous type exactly, including absence.
- All other cases retain the previous payload.

Still perform ordinary capped stack increase: a three-stack marker receiving
one damaging application becomes four damaging stacks; a capped marker gains
potency while staying capped. Keep stored ID, original `appliedAtMs`, unrelated
metadata, first-match/duplicate behavior, maximum `remaining`, later finite
expiry and existing indefinite expiry. Future/expired records use the existing
fresh-record branch with one stack, new source/rate/start, not promotion.

Apply this payload rule uniformly, including Poison, Plague, Ignite/Burn, Bleed
and death-spread applications. Ordinary control/debuff applications without
positive incoming DoT payload retain their behavior and RNG. This is a targeted
active-refresh rule, not comprehensive fresh-input validation or recovery from
an already-corrupted periodic accumulator.

Promotion takes effect at the actual application boundary. Integrate the old
interval before application, then use the new aggregate rate afterward. Give
no immediate/retroactive HP damage, extra RNG/event, duration bonus or reset of
the unit's accumulated fractional periodic damage. Original start timestamps
remain provenance; they do not authorize reintegrating an already-settled interval.
Ordinary cast/hit/status events and existing paralyze handling remain intact;
there is no promotion-specific event, tick or RNG draw.
This expressly supersedes earlier D04 rate-less-refresh preservation only at
the invalid-old/valid-incoming boundary. Valid-rate retention remains unchanged.

## Formulas and examples

For PE rank `r` in1–20, direct poison base is
`[40 + 5*(r-1), 60 + 5*(r-1)]`. Ranks1/6/12/20 give
40–60 /65–85 /95–115 /135–155. Cost15MP and cooldown2s do not scale.
Each ordinary successful hit adds one Poison stack. Fresh potency is
`max(1, floor(ordinaryFinalHitDamage * 0.05))` HP/stack/second.
Fresh duration5000ms, max10 stacks; reapplication extends aggregate expiry.
Under an unmodified guaranteed noncritical hit, rank1 endpoints yield2/3 HP/s,
rank20 endpoints6/7 HP/s; endpoint rounding increases at ranks5/9/13/17.
These examples are arithmetic oracles, not damage/TTK/balance guarantees.

Periodic damage integrates active overlap `[appliedAt, expiry)` with existing
compensated fractional carry, no free initial tick or second mitigation/crit/combo.
A potency-free three-stack Poison marker hit for40 adopts2HP/s and becomes four
stacks: eight prospective HP/s. An existing three-stack1HP/s Poison hit for100
keeps1HP/s, becomes four stacks and deals four prospective HP/s.

For death spread retain the current first-match Poison/Plague choice, then
`max(1, floor(stacks * 0.5))` Poison applications to every other living same-side
recipient after complete dead/orphan closure. It uses the selected dying status's
existing spread rate, `sourceId = dying unit.id` and poison damage type through ordinary `applyStatus`;
recipient valid-rate retention/promotion and5s/max10 rules apply. Do not add
recipient copies, dead recipients or a recursive free explosion.

## Edge cases and lifecycle

Cover rank/cost/CD bounds, no targets/supply, malformed authority/registry,
all-dodge cost, mixed CE/PE competition, simultaneous periodic deaths and final
enemy termination. Reject initial-dead supply and duplicate credit. Missing,
zero, negative, NaN and either infinite prior rates may promote from valid input;
invalid incoming potency cannot promote or overwrite a valid record. Preserve
aliases, duplicates, optional type absence, fractional rates and immutable inputs.

Keep D04 expiry and wave carry; new simulations/waves start with empty corpse
pool. Ordinary playback preserves recordings; unlocked replay recomputes from
captured original resources/current eligible Player configuration. Iron-locked
replay reinstalls exact input/recording. Neither replay claims another reward.
No save field/version/migration, persistent corpse, decay, body-HP coefficient,
resurrection, selection UI or generic qualification rewrite is introduced.

## Dependencies and delivery

Data flows from JSON/schema and Player allocation through independent PE
definition/projection to existing combat, native recording/replay and UI.
Reuse shared availability feedback; add PE-specific localized consumption text
rather than display the CE-named key for PE. Both Skills descriptions must explain
opening kill/shared body,15MP/2s, damage/Poison duration/stacking and empty-pool
skip. Native allocation, rank preview, priority and save/reload need zh-CN/en
desktop/mobile and keyboard/44px/no-overflow verification.

Deliver separate <=5-path increments, each locally committed after independent
review. First shared-refresh prerequisite: status.ts, status.test.ts,
periodic-timing.test.ts, structured bug reproduction and ledger. Obtain RED and
file the bug before the runtime patch, deliberately replace the two obsolete
rate-less assertions and preserve timing/alias/valid-rate controls. Then PE
authored metadata/independent definition/projection and literal tests; combat
qualification/shared pool/commit and negatives; native store/replay/rewards;
feedback; Skills/locales; production browser and separately earned-L18 evidence.
Split any stage requiring more paths before edits. Engine stages require focused,
engine, full units, types, lint, build/bridge checks and independent QA/GD/TD/code
review; UI stages also require production-browser acceptance. Keep command
timings, warnings, failures and exact task-owned cleanup receipts.

## Tuning knobs

Preserve damage/rank growth (curve),15MP/2s (feel),unlock18/Dagger/cap20 (gate).
The new authored0.05 DoT ratio makes the advertised poison meaningful using
existing5s/max10 defaults. It is a proposed mechanic value, not proven balanced.
Do not tune XP/loot/enemies to force acceptance. Any later number change requires
its own reviewed source/definition/test/copy update and actual balance evidence.

## Acceptance criteria and remaining work

1. Shared refresh obeys literal payload/stack/clock rules, establishes prospective
   HP damage from a marker and preserves accrued fractions, valid-rate retention,
   ordinary control behavior, determinism and immutable inputs.
2. Actual PE eligibility plus an actual kill enables one15MP/one-body/2s ranked
   all-enemy hit/Poison; empty/invalid/failure paths spend nothing and match
   fallback RNG. CE/PE compete without duplicate deaths/rewards; all lifecycle,
   authority, aliases and registry negatives pass.
3. Ordinary bilingual mobile/desktop controls show truthful allocation, first
   kill/supply, PE consumption, MP, Poison HP/expiry and save/replay/new-wave
   behavior. The [QA matrix](../../../production/stories/poison-explosion/qa-plan.md)
   defines independent oracles and separates imported functional scaffolding
   from an earned-L18 route. Manual playtest must assess whether the first-kill
   transition is understandable and satisfying; no automated feel proxy closes it.

Poison Dagger's own absent potency, broader Poison-versus-Plague design, other
corpse consumers, earned-L18 reachability/affordability, broad balance/player
feel, campaign and complete D06/P09/P10/private-v1 remain open.


## Approved follow-on: finite hostile monster resurrection

The [monster resurrection contract](../../design/monster-resurrection.md),
approved by GD/TD, explicitly extends this child's original scope. Original
qualified hostile Shamans compete for the same finite FIFO corpse token as
existing player consumers; they remove the oldest eligible original Fallen body
without reordering other tokens. Each original body supplies one token and may
revive once. Preserve all existing costs, corpse qualification and ordinary
selection behavior. First-death effects remain once per original; second-life
cleanup emits death without another corpse/orb/economic effect.

An explicit copied `revive` event restores the existing dead actor in place,
clears its presentation dead-ID latch, then supplies a forced noninitial status
observation. Preserve atomic timestamps, seeded schedule identity, normal
Pause/speed and both replay policies. No corpse, revival proof or added reward
identity enters a save. Necromancer Revive retains its separate corpse-free
startup-summon contract. This authorizes the specified implementation, not
campaign balance or release acceptance.

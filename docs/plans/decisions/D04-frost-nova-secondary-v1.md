# D04 — Player Frost Nova secondary Freeze

Status: root/producer/QA accepted bounded A/B representation/runtime at13b5378;
ordinary-earned browser child C accepted by root/producer/QA on2026-10-20.
Date:2026-10-20. Full D04/P08/skill/campaign gates remain open.

## Source and intent

Player `skills-sorceress-frost-nova` authors all-enemies cold25–35, +3 damage
per rank (rank20:82–92), mana20, cooldown3seconds, requiredLevel6, ranks1–20,
and `appliesStatus:[chill,freeze]`. The JSON adapter reads only the first ID;
the engine damage primitive currently has one on-hit status. Production JSON
overrides the older default builder. `docs/design/skills-spec.md` Sorceress
active table explicitly specifies Chill + Freeze(10%). The skill inventory
already records this secondary-status truncation risk. Current UI already
reads both authored IDs; no UI source changes are needed for this prerequisite.

Root adopts the source-specified10% Freeze per successfully hit target, with
independent target rolls appended after the existing Chill chance draw. These
are explicit bounded contract choices, preserving existing on-hit ownership.
Damage resolves once per target; standalone debuffs or extra damage effects
would bypass hit gating or duplicate damage and are unsuitable.

## Preserved behavior and RNG

Keep first-status Chill exactly as currently authored/registered. Keep damage,
rank scaling, minLevel6, cost20, CD3, target ordering, resources and targeting.
Use current accepted D04 status lifecycle: Chill2000ms, Freeze1000ms on ordinary
targets/500ms on boss and chapter-boss, rank invariant, boss multiplier once,
active `[appliedAtMs,expiresAtMs)`, existing refresh and expiry behavior. This
child does not adopt older prose about two-turn conditional freezes or change
the separate missing Chill attack-speed behavior.

Per successful target: existing hit draw, variable-range damage draw, crit draw,
existing Chill chance1 draw, then new Freeze chance0.1 draw. Chance0/1 still
consume one draw. A miss returns after hit draw with no status draw. Complete
one target's damage/status sequence before the next target, preserving current
summon-first/insertion target order and status-before-death-finalization.
No scheduler tie-stream, seed, counter or recording-identity changes.

## Additive interfaces and validation

Keep scalar `statusEffect` as metadata for the first `appliesStatus` ID.
Add opt-in `additionalStatusEffects:{freeze:{chance:0.1}}` to player Frost Nova
only in the behavior child. Secondary metadata requires chance0..1 and allows
only existing optional integer stacksOnApply>=1 and dotPctOfDamage>=0; no
Amplify duration/potency fields. For this increment, schema permits only known
secondary ID Freeze, closed metadata, and requires damage/damageType plus
exactly two unique appliesStatus IDs: a nonempty non-Freeze primary followed
by Freeze. Scope all these relational/length/unique restrictions to opted-in
rows, preserving legacy corpus. Invalid chance,
unknown ID/field, missing primary/damage, duplicate/first-position Freeze and
misplaced metadata and overlong lists are rejected. Expansion to more tails or
other secondary IDs is separate. This explicit two-entry authored contract
keeps Ajv strictTuples intact; the engine tuple below remains general.

Add an engine OnHitStatus shape and full ordered nonempty readonly tuple
`applyStatuses` variant to DamageEffect, retaining singular `applyStatus` and
no-status compatibility. A mutually exclusive type forbids both forms and an
empty plural list. Adapter emits
exactly one form: original singular byte-equivalent shape if no explicit
secondary configuration; otherwise complete ordered primary + opted-in Freeze.
Never emit both. Engine normalizes `applyStatuses ?? [applyStatus]` (or empty)
and uses one application loop, retaining current singular semantics. Existing
no-status and scalar constructors remain valid. No sibling parallel status
application branch. Other authored multi-status tails remain disabled until
individually contracted; no silent default100% secondary proc.

## Ordered bounded increments and evidence

A: representation prerequisite, schema/shared skill types/effect types,
dataCatalog local JsonSkill type only, plus existing loader-schema tests. No authored row/runtime adapter/combat behavior
change. Capture and independently review desired schema RED before source edits;
validate strict boundaries/optional absence and all current content. Existing
runtime behavior remains unchanged and the Frost bug stays open.

B: player sorceress JSON, dataCatalog adapter, combat loop, existing registry
tests and dedicated actual Frost combat tests. Capture independently reviewed genuine actual
JSON→registry→runBattleRecorded desired-behavior RED before those source edits;
never replace production Frost through registerSkill. Add no UI/source locale,
monster Frost or other authored secondary behavior.

Read-only analyst seed arithmetic is hypothesis until executed: seed5 first
hit33/freeze roll.085137; seed1 hit25/noFreeze(.968377); seed4 miss(.923636);
seed5two targets33/32, first Freeze only. Desired tests must prove actual
outcomes rather than modifying constants to match an unexplained failure.
Hero level6/speed150/mana20 casts1300ms; enemy speed100 acts1700ms. Timed
fixture holds later actions to isolate real Freeze suppression. Require exact
ordinary/boss/chapter suppression and1000/500ms exclusive-expiry actions,
rank1/20/cost/CD/level/mana/cooldown guards and actual cooldown expiry. Assert
one damage per target, ordered status events/independent AoE rolls, successful
and failed procs and miss gating. Preserve scalar Fire Bolt/Amplify and other
nonopted tails with exact registered effects and seeded control recordings.
Require repeat and A/B/A, normal/recorded parity and input immutability.

Each child: focused/related/engine where applicable; before combined handoff,
full units/typecheck/lint/build and unchanged80% engine coverage gate, plus
meaningful changed-module coverage and independent producer/QA review. Keep
exact failure evidence separate from harness/typecheck mistakes. Report timing
and bundle warnings accurately; no full skill/campaign gate acceptance here.

Source investigation by design_contracts was read-only: no edits/builds/tests,
artifacts/processes. Root owns implementation and final evidence cleanup.


Producer independent plan-review: ready with refinements above. Representation
RED must exercise actual existing validateGameData rejecting otherwise-valid
opt-in metadata solely as an unrecognized field; malformed fixture cases are
supplemental. No missing-module/type-only failure is a genuine behavioral RED.
B includes lethal status-before-death, dead-target exclusion, summon-first
ordering, exact CD recast and scalar Plague Javelin/Fire Bolt controls. Freeze
and metadata type constraints are source contracts, not ordinary-earned browser
acceptance. Root/producer security check PASS within this bounded scope.


Root/producer/QA explicitly approved the exact-two authored opt-in refinement
before RED. Installed Ajv strictTuples rejects a variadic prefixItems tuple;
use a closed two-entry tuple inside the opt-in conditional, without changing
validator settings. Tests reject opt-in [chill,burn,freeze] and accept the
identical opt-out list; no primary registry enum is added.


## P08a04c ordinary-earned browser discovery — approved plan

Root/producer/QA permit bounded native Stage1 discovery after accepted A/B at
13b5378. Representation/runtime acceptance does not accept this browser child.
Use fresh Sorceress at Date2026-10-20T12:00:00.000Z; native timers, no save
injection/grants/debug bridge/runtime imports. Verify Frost1 preowned but locked
below6, disabled allocation, absent from all9 options and sanitized combo.
Ordinarily learn FireBolt1 with the initial point and hire free InnerSight;
explicit soleFire in all9 slots. No stat/Warmth/gear allocation. Fire direct
30–45 equals Ice; cost8 versus10 and guaranteed Burn adds damage. Both are
sustainable: Energy35 gives7MP/s, action interval1.5s recovers10.5 between casts.
No assumption that either survives40 waves; fail at the first native loss.

Exactly40 manually entered BloodMoor first-wave wins at fixedDate, ordinals0–39,
observe all enemies dead/hero alive then wave2/Pause/Flee before more reward.
Source expected counts8+(ordinal mod13),554kills×20=11080XP. At39wins10920
remainsL5;40 producesL6XP67,next8818/statPoints25/skillPoints5 afterFire1.
Preserve all ordinary loot overflow, no conditional disposal or loss fallback.
Record every earned snapshot; freeze actual route only after native verification.
Unfield merc ordinarily before Frost witnesses; replace all9 slots with soleFrost.
Rank1 then ordinary allocation2 leaves4points; full Save/DB/export/actual page
close/newPage/Continue, followed by genuine rank2cast with newpageordinal0.
Mana oracles include universal7MP/s recovery; freeze exact Date/ordinal/target
oracles independently. No runtime/data/locale edits planned.

Same identified living target must show ordered hit→Chill→Freeze→stunned skip
and later normal action, with living unfrozen control. Capture phased native
logs before200-row rollover; status playback does not populate badges and emits
no expiry UI event. Browser proves ordered suppression/recovery only; accepted
engine tests own exact1000/500ms, exclusive boundary and10%probability.
Missing Chill slowdown stays deferred. Final en/zh×desktop/mobile, all9slots,
full unrelated payload/locale/gear/merc preservation, SW/noBridge/no page errors;
measure40wave runtime before choosing bounded timeout. No C/G/fullskills grant.

Final C acceptance: all four native production en/zh-CN × desktop/mobile cases
pass without skip/retry/flaky/errors at frozen spec c6ead538/config015418b.
Independent root/producer/QA verified all184 attachments, earned progression,
living Freeze suppression/recovery, MP112→92 and full Save/close/Continue.
[Evidence and limitations](../evidence/p08a04c-earned-frost-nova.md).
Exact status timing/probability remains engine evidence; Chill slowdown,
broader skills/campaign, UX/performance and C0–C4/G0–G7 remain unaccepted.

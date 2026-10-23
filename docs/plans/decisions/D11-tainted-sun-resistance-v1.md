# D11 — Permanent Tainted Sun resistance reward

Accepted2026-10-23, source base `aba7e12`. Design/technical investigation and
producer plan-review READY/security PASS establish the transaction and decoder
integration requirements below. This is one required Act II feature, not C2
or full-v1 acceptance.

The progression design requires the existing4500 hero XP reward plus permanent
hero **+30 fire and +30 cold resistance percentage points**. Author the amounts
in quest JSON as `stat: {fire_resist:30,cold_resist:30}`. Extend the schema with
a closed pair of nonnegative safe integers. Preserve historical stat shapes
as structurally valid but unsupported by the executor. Only the canonical
Tainted Sun pair becomes executable; do not enable unrelated stat rewards.

The sole persisted entitlement is an own canonical
`quests/act2-tainted-sun` progress entry with matching id, completed status,
`rewardClaimed === true`, and its own `obj-destroy-altar === true`. An absent,
unclaimed, mismatched, inherited or inconsistent entry contributes zero.
Recovering the Amulet never implies altar destruction or Claim.

Use pure shared hero equipment composition with explicit immutable quest
context. Read bonus amounts from validated authored JSON. Recompute raw
resistances from gear plus entitlement; never increment saved/cached values.
Keep raw values above75 and retain existing combat caps/difficulty penalties.
Mercenaries, summons and enemies receive no bonus. Recomposition preserves
current life/mana without healing.

Integrate progression XP/attribute/equipment recomputation, equipment comparison
(both absolute values), battle entry, later waves and current-configuration
replay through this composition. Recorded/locked replay keeps its baseline.
Respec retains the claimed entitlement. Keep historical migration composition
historical instead of reading live stores.

Claim preflights the complete bag, valid own completed altar progress, and a
prospective claimed-context projection at the post-XP level. Reject unsafe
authored counts and nonfinite/unsafe resistance arithmetic before writes.
Apply grants normally, compose final player stats with the prospective context
inside the transaction, then publish the claimed flag last. Include stat-only
rewards in the participating player snapshot. On any publication failure,
restore player, participating merc state and the target quest entry; attempt
all restorations, preserve unrelated writes, hold the shared lock and retain
AggregateError behavior. No crash/observer-wide atomicity is claimed.

No new Player field, receipt, save version or migration is needed. Valid legacy
claimed rows intentionally gain the missing effective bonus on load. After
item restoration, refresh only cached fire/cold from the supplied save's own
progress and authoritative gear. Preserve all other cached fields, resources,
progress, inventory and input objects. Gate this compatibility repair on a
qualified claimed Sun entitlement; absent/unclaimed/inconsistent rows keep
their existing cache untouched. Do not call Claim, grant XP/points or
read another live character's map. Repeated decoding/import is idempotent.
The earned Staff-inserted fixture has no Sun row and gains no bonus.

Show localized permanent fire/cold resistance rewards in both languages,
without exposing JSON field names. Retain explicit Destroy then Claim and
the separate Amulet recovery action.

Acceptance: causal engine/data/Claim failures first; own-entry/objective/id
positive and negative cases; exactly4500XP/3375mercXP and native level points;
immediate once-only bonus with unchanged pools; duplicate/reentrant/refused
no-op; overflow and mutate-then-throw rollback/retry; equipment, comparison,
allocation, progression, respec, battle/waves/replay consistency; raw over-cap
values; legacy claimed/unclaimed decoding and cross-character independence;
production en/zh mobile Claim and Save-close-new-page Continue/import. Full
unit/type/lint/build/bridge checks and independent source/evidence review
precede acceptance. Preserve all earned gear and distinguish constructed
compatibility checks from campaign progress.

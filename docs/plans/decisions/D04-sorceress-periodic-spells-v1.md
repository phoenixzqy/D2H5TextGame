# D04 — Paid Blaze, Fire Wall and Thunder Storm

2026-10-25. Provisional author contract; independent design/QA and earned
balance remain open. BUG234/235. Root sole implementation/review owner.

## Overview

Replace the three generic one-shot adapters with paid combat-only recurring
spells using the ordinary seeded damage pipeline. Preserve authored ranks,
damage/growth, unlocks, costs/cooldowns, targets and Burn/Paralyze metadata.
Publish every unit's current cooldown view at the terminal combat boundary:
a paid cast that ends a wave must carry its remaining cooldown into the next
wave. BUG235 corrects this shared stale cache for all skills and units.

## Player fantasy

Establish a fire field or storm, then perform other actions while it attacks.
This serves canonical build diversity and lightweight text-first combat
(`Diablo2TextGame.md` §3; the charter's separate pillars file is absent).
No movement/range system exists: Blaze's trail and Fire Wall are explicitly
adapted into fields affecting all living hostiles. Thunder Storm also keeps
its authored all-enemies target. These adaptations require final design review.

## Detailed rules

One legal cast pays MP and starts cooldown exactly once. It captures source
and paid rank in an immutable finite status, emits its first pulse immediately,
then pulses at authored intervals. Every pulse independently rolls ordinary
hit/base/crit and resolves resistance/MR, mastery, combos, shields, statuses,
deaths, corpses and orbs. All current living hostiles are selected each pulse.
The immediate pulse is also a periodic spell hit. It cannot trigger Frozen,
Shiver or Chilling Armor or explicit direct-hit recovery/self-cost mechanics.
Burn remains the normal real DoT, and Thunder Storm applies ordinary Paralyze
only on a landed eligible hit. No ambient-aura guaranteed-hit shortcut.

Persistent spells continue through Stun/Freeze; no further action/payment or
cooldown is generated. Same spell cannot recast while active. Different spells
coexist. Source death stops future pulses. At a common timestamp: continuous
DoT/deaths/expiry, MP recovery, ambient aura, paid spell pulses in stable unit
then authored spell order, then ordinary actions. Winner checks stop later
phases; each pulse rechecks source/target life. No pulse at the expiry endpoint.

## Formulas

JSON `periodicSpell = { durationMs:3000, intervalMs:1000 }` initially for all
three. Cast time t gives t,t+1000,t+2000; half-open [t,t+3000).
Pulse count = ceil(durationMs/intervalMs), damage range at rank r is existing
[min+growth*(r-1),max+growth*(r-1)] before ordinary damage processing.
Blaze60–85/+5, Fire Wall70–100/+6, Thunder Storm70–110/+7; ranks1–20.
Existing MP22/25/30 and cooldown3/4/4 seconds remain unchanged, including
authored per-rank cost/cooldown adjustments. No Attack-based invented scaling.

## Edge cases

No rank-one fallback, bare-marker authority or malformed/nonfinite payment.
Exact registry effect/identity/payment/target metadata must match authored data.
Native Fire Wall/Storm require Sorceress class, unlock and all prerequisites.
Blaze respects existing governed native/equipped ranks, including other-class
heroes and mercenaries; never summons/enemies. Equipment source removal or
invalid native ownership removes paid carry at the next native wave boundary.
Positive reallocation or removal from priorities preserves paid rank. Existing
status clock rebasing preserves remaining duration/phase. The old wave already
settled its endpoint, so a pulse at next-wave zero must never replay. Future
pulses affect new hostiles. Fresh/imported/reopened runs start unpaid; no saved
spell/timer field or save-version change. Never mutate earlier snapshots.

## Dependencies

Strict skill schema → JSON → immutable spell definitions → exact effect adapter
→ native authority → combat-only paid status → scheduler → ordinary damage.
Avoid catalog/projection import cycles. Native hero and mercenary wave refresh
must validate current source authority. UI previews/prose/chips in zh-CN/en
explain per-pulse damage, total duration, interval/count, MP/CD and real statuses.
Use existing i18next keys and add spell-specific description/preview keys.

## Tuning knobs

Feel: duration/interval (positive integer milliseconds, interval≥1000,
duration≤60000). Curve: existing rank damage/growth. Gate: existing required
level/MP/cooldown/prerequisites. Three seconds/one second preserves initial
impact while making the named persistent behavior observable; it increases
total damage and is not accepted campaign tuning. Publish earned TTK/resource
and build evidence before balance acceptance; no credit from cast counts alone.

## Acceptance criteria

Fixed-seed RED→GREEN for all three via real native projection; ranks1/2/20,
independent seeded damage/payment oracle, multi-target selection, mitigation,
Burn/Paralyze, no recursion, source death/ties, control persistence, finite
expiry/nonrecast/coexistence, valid Blaze grants and removal. Exact recorded/
unrecorded/repeated results, immutable input and actual combat-store playback.
Native wave carry/phase/source invalidation and fresh unpaid run. Loader/schema,
terminal cooldown values on immediate victory and unchanged historical fields,
types/lint/engine/full/build/precache, bilingual component and production browser
mobile/desktop, ordinary save/reopen and offline Continue. Earned campaign,
independent design/QA, experience and balance acceptance remain unproven.

## Author checks before implementation

Security check: pass. Scope is local deterministic combat/data/UI; no secrets,
network/dependency/permissions/save-export changes or external writes requested.
Plan review: ready after explicitly covering granted mercenary Blaze, no
wave-zero replay, ordinary RNG versus ambient-aura shortcut, and death/tie order.
DESIGN-REVIEW: CONCERNS. All eight sections present; executable rules are ready
for local work. New duration/interval and no-movement adaptations remain
provisional; author review is not independent acceptance or a shipping gate.

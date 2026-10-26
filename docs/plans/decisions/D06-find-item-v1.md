# D06 — Find Item shared-corpse search and victory settlement

Status: author draft for the next BUG225 repair. No implementation, skill credit,
independent approval, earned economy or campaign acceptance is established here.
Root remains sole writer/reviewer. Find Potion is a separate recovery consumer;
Grim Ward remains unfinished.

## Overview

Find Item consumes one actual enemy-monster corpse from the existing shared
wave-local pool. A paid search has a seeded chance to authorize one additional
ordinary loot roll for that original monster, collected only on wave victory.
Preserve the advertised corpse-to-loot identity, existing level12/ranks1–20,
7MP/-0.1MP per rank and4s/-0.05s per rank cooldown. Remove the inert self marker
and generic passive MF scaling from this row only. No new currency or potion.

## Player fantasy

Discovery and build choice: trade a limited corpse and an action for an extra
loot opportunity instead of recovery, explosion or a ward. Searches must show
success/failure and explain that uncollected loot is lost on defeat or flight.
No-body selection skips normally; it cannot become guaranteed zero-body income.

## Detailed rules

1. JSON owns `corpseSearch.successChance` and `successChancePerRank`. A dedicated
   effect identifies this skill. Require exact registered identity, native
   Barbarian source, learned valid rank and actual Find Potion prerequisite.
   Resolve maximum valid alias ranks, never clamp/sum malformed allocations.
   Copy/freeze complete native authority; reject sparse, duplicate or extra
   projection fields. Generic unit ranks or old buff markers grant no search.
2. Use the same FIFO as CE/PE/vines/Redemption/Find Potion. Preserve the original
   primary-death, initial-dead, summoned-body and orphan exclusions. Require a
   living hostile, eligible living player hero, affordable finite mana and
   both aliases off cooldown. Pure refused selection draws no RNG, consumes no
   body and pays no resources. It falls through to the next skill/basic attack.
3. Synchronously recheck, reserve exactly one oldest body, pay ordinary scaled
   MP and cooldown, then draw exactly one battle RNG value for success. Failure
   still spends that body/payment. No action after the last living hostile dies.
   Each body may authorize at most one search and cannot be used by another
   consumer. Neither success nor failure removes the actual death/reward unit.
4. On success, the engine emits normal localized feedback and a typed immutable
   attestation binding source hero, consumed original enemy ID and paid rank.
   Attestations are ephemeral battle results, never saved inventory grants.
   Capture a private copied/frozen attestation list during native staging before
   callbacks/publication; later edits of public events cannot invent a payout.
5. At existing guarded victory settlement, validate attested IDs against the
   original positive-HP enemy-monster input and actual slain outcome. Reject
   duplicate/malformed/foreign/summoned/nondead sources before any bonus grant.
   Invalid attestations fail the whole settlement before reward mutation; never
   silently drop a promised bonus and publish only ordinary loot.
   Use original resolved level/tier, actual wave TC/act/difficulty and existing
   MF/offline-MF policy. Roll the ordinary kill reward bundle once per successful
   body using the existing `rollKillRewards` service and a separate salted seeded
   loot stream. Normal kill loot uses its unchanged stream and inputs first.
   Do not grant extra kill XP, quest credit, boss/cache claims or progression.
6. Merge normal and search reward bags before the existing single guarded
   inventory publication. Retain item-ID uniqueness, overflow recovery, safe
   currency/material arithmetic and complete settlement rollback. Existing
   opaque logical-wave payout identity owns exact-once behavior, including
   normal replay and synchronous observers. Do not pay from playback or logs.
   Generation/publication failure cannot partially award either bag; retry must
   follow existing failed-receipt semantics, never reroll for a better result.
7. Loss/draw/flee and dead-source defeat grant no search rewards. A success with
   a real TC no-drop is a legal loot outcome; do not add a guaranteed item to
   hide it. Preserve normal reward currencies in that ordinary bonus roll, but
   add no separate per-kill XP/currency award. New waves start with an empty
   pool and recompose current learned authority. Save22 remains unchanged.

## Formulas

Provisional author chance at integral rank r1–20:
`p(r)=0.20+0.01*(r-1)`. Ranks1/2/20 give20%/21%/39%. Success is one seeded draw
`u<p(r)` for uniform u in[0,1); no draw on refused selection. Exactly one normal
reward roll per successful consumed body; its TC may legitimately yield no item.

Cost and cooldown use existing shared functions, including ordinary decimal
rounding and1MP/1s minima. No chance multiplier or global MF bonus is introduced.
For N eligible searches, expected extra ordinary reward rolls are N*p(r), not
N extra kills. That expectation is a tuning input, not earned economy evidence.

## Edge cases

No bodies, final-hostile termination, one body competing consumers, full aliases,
rank1/2/20, exact affordability and cooldown expiry; invalid native class/level/
prerequisite/rank/owner and malformed arrays; ordinary RNG unchanged on refusal;
one draw per committed search; deterministic success and failure; initial-dead,
summoned, converted and orphan exclusion consistent with the shared corpse rule.
Duplicate/forged public events cannot produce loot. Cover actual no-drop, unknown
TC behavior, malformed attestations, stash/merc item-ID collisions, safe-integer
overflow, observer/reentrancy failure, replay/duplicate settlement, next-wave
respec and fresh save/import. Test failed settlement without rerolling.

## Dependencies

JSON/schema -> learned authority -> engine FIFO/payment/attestation -> private
native staging/binding -> existing loot service -> guarded whole-wave settlement
-> ordinary reward display/save. Update bilingual skill description and current/
next/MAX chance rows plus search success/failure and victory-collection copy.
Public production mobile/desktop en/zh-CN must learn/equip/fight and display an
actual consumed corpse and collected generated reward, then Save-close-Continue
online/offline. Synthetic imported state proves mechanics, never earned economy.

## Tuning knobs

Curve:20% base and1pp/rank chance, JSON-owned and provisional. Feel: existing
action/cost/cooldown. Gate: level12, actual prerequisite and a shared real corpse.
No global monster/XP/loot/economy tuning is part of this repair. Independent
acquisition and faucet/sink measurement must assess the extra rolls later.

## Acceptance criteria

The original no-body native cases stop casting/paying. A real eligible death
authorizes exactly one seeded search/payment. Both success and failure are
reproducible. Pure engine success produces no inventory mutation; ordinary
guarded victory grants precisely one extra normal reward bag per attested body,
with unchanged ordinary loot and XP. Loss/flee/replay/forgery/failure cannot
duplicate or partially grant loot. Prove actual item/material/currency ownership
and conservation, not merely action/messages or a larger aggregate count.
Run focused tests, engine, full unit, types/lint/build/precache/bridge checks and
public bilingual production/browser persistence. Playtest must judge whether
spending a scarce body for a probabilistic bonus is clear and worthwhile.

## Author review and execution plan

Security check: pass for local data/engine/UI/guarded rewards; no credentials,
CI, dependencies, external publication or expanded save deserialization. The
payout boundary needs private attestations; public playback text is untrusted.
Design review: required eight sections supplied; pillar files remain absent,
so no independent pillar alignment approval is claimed. Extra rolls require
future earned economy acceptance. Plan review: ready only with private copied
attestations, separate RNG streams, whole-bag rollback and replay negatives.

Execution order: keep the original BUG225 repro; native no-body and generated-
loot REDs; definition/authority; FIFO/payment/search result; private staging and
guarded loot; bilingual previews/feedback; production save/offline evidence;
author review/required checks/exact cleanup; then one bounded inventory credit.
Do not close BUG225 while Grim Ward remains unfinished.

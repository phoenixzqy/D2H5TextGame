# Drognan’s recovered sun-cult tome

Status: accepted locally for bounded functionality/current28. Independent
design/source/rollback APPROVE and browser evidence ADEQUATE; final-source unit
coverage reconciled1075/22682, strict types/lint/build pass. Exact original
failed attempts and earned-acceptance limits are retained in
[implementation evidence](../plans/evidence/drognan-tome.md).
Producer’s source investigation and independent review approve this route.
Runtime begins only after Warband/current27 local acceptance.

## Overview

Make the existing `quests/side-act2-drognan-tome` executable: recover its real
sun-cult tome in Lost City, complete its single fetch, then separately Claim
Drognan’s authored knowledge reward. Keep IDs and numeric rewards; add no second
learning tome, hand-in, Read effect, cost or combat mechanic.

## Player fantasy

Discover a forgotten manuscript and gain knowledge from Drognan. Explicit
physical recovery serves Discovery and Competence; a separate journal Claim
keeps reward timing under player control. Follow canonical GDD/invariants;
studio pillar files are absent, as recorded by prior side contracts.

## Detailed rules

Preserve quest ID, side type, Act II, `npc/drognan`, `obj-fetch`, fetch type,
`quest/sun_cult_tome` and exact authored `{xp:4000,skillPoints:1}` rewards.
Correct objective area to canonical `areas/act2-lost-city`; author target
`objects/sun_cult_tome_cache`. Add an objective-sourced `kind:'tool'` definition
using the existing schema, with no effect or consumer. This retained archival
item is capacity independent and has no ordinary inventory slot or sale value.

Only explicit Recover at current Normal, unlocked Act II Lost City, with an
ordinary-action-ready hydrated hero and no active combat/run, earns own source
`quests/side-act2-drognan-tome#objective:obj-fetch` in `questItems`, exact
`{itemId:'quest/sun_cult_tome',state:'owned'}`. No level, area-clear, kill, RNG
or Talk requirement is added. Opening objects, conversation, entering/clearing
the area and setting a flag grant no item/proof/reward. Exact tracked unclaimed
in-progress or historical completed row is required. Recover publishes the
owned receipt, true objective and terminal completed status coherently under
the shared quest lease; it grants no XP, currency or points. Preserve other
quests’ staged fetch semantics when fixing terminal recovery publication.

Separate journal Claim requires the exact canonical definition, owned physical
receipt and completed exact side row, plus ordinary action readiness. Later
Claim may occur in any location or difficulty, through existing numeric reward
publication. Preserve source, mark claimed last, apply authored 4000 hero XP
and one additional unspent skill point, and existing 75% quest-XP share (3000)
to the previously fielded actual mercenary when present. Preserve current
progression and level-cap rules, no automatic fielding or alternate recipient.
The tome remains owned after Claim. Repeated recovery/Claim is inert. No second
item or later Read grants another point.

Both locale quest descriptions explain recovered manuscript → Drognan’s
knowledge, replacing the unimplemented learning-tome promise. Add item name and
description keys and reuse existing Recover/journal/quest-item controls, with
zh-CN primary/en parity, named target and ≥44px controls.

## Formulas

Recover: all reward deltas zero, exactly one owned receipt. First Claim:
hero XP award=4000; direct skill-point award=1, in addition to ordinary
level-up skill points produced by that XP. Prior-fielded merc XP award=
floor(4000×0.75)=3000, otherwise zero. Existing cap/level progression remains
authoritative. Repeats award zero; retained item count remains one. No numeric
economy tuning or XP threshold change.

## Edge cases and compatibility

Freeze actual accepted27 quest/item/action/campaign admission before expected
current28; composition of immutable accepted domains and literal Warband
authority is allowed when equality is proved. Preserve established historical
material/runeword/respec/repair policies; no broader arbitrary-catalog freeze.
Version-only27→28 migration infers no item, completion, points or compensation.
Unknown, malformed, consumed, getter/inherited or mismatched new receipt/source
is rejected; owned receipt requires exact completed objective graph. It survives
Claim. Historical completed/unclaimed flags without receipt remain readable,
but cannot Claim until actual Normal Lost City Recover. Claimed legacy history
remains claimed, receives no inferred item, and cannot recover for replay.

Recheck hero/context/source/definition inside the lease and after observable
publication. Refuse stale/foreign source, wrong area/act/difficulty, locked act,
missing row, combat/run, hydration/import replacement, duplicate, reentry,
unsafe numeric reward or mutated publication. Scoped deep rollback preserves
unrelated writes and the exact physical source; restoration failure is explicit.
No browser-crash atomicity claim. Do not broaden other side quests’ Claim rules
or weaken existing multi-stage delivery/assembly gates.

## Dependencies

Canonical side objective + bound item catalog → Lost City object discovery →
protected terminal Recover → exact owned physical receipt → guarded existing
numeric Claim → quest-item presentation and save/export/import/Continue.
Current28 reader/migration follows accepted27 freeze. Existing numeric Claim
and mercenary XP helpers remain authoritative; introduce no reward subsystem.

## Tuning knobs

Curve: retain authored 4000 XP and one point; existing merc share remains75%.
Gate: unlocked Normal Act II/current Lost City/actual Recover, with no new
clear or level threshold. Feel: explicit named Recover, completed journal row,
separate Claim and retained readable description. All content stays JSON/i18n.

## Acceptance criteria

1. Actual canonical Recover coherently earns exact owned receipt, objective and
   terminal completion, with no rewards. Negative/legacy/repeat/reentry and
   observer-fault cases prove scoped conservation; staged neighboring recoveries
   retain their existing semantics.
2. Preview/execution reject flag-only credit; first source-bound Claim retains
   the tome, awards authored hero/point/prior-fielded merc progression exactly
   once, with absent/foreign field, overflow, callbacks and rollback controls.
3. Literal27/current28 controls and full required local checks pass. Production
   headed browser covers both locales, mobile/desktop, real Recover→Claim,
   named source/retained item, repeats and exact Save/export/import/close/reopen
   Continue. Disclose imported capability state; owner playtest, earned campaign
   balance/pacing and other P14 obligations remain separate.

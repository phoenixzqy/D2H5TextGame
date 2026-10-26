# D04 — Paid Inferno channel

2026-10-25. Provisional author contract, BUG239. Root sole implementation and
review owner; independent design/QA and earned balance remain open.

## Overview

Replace Inferno's generic instantaneous damage with a finite, interruptible
Fire stream using the existing paid periodic scheduler and ordinary damage
pipeline. Explicit channel metadata distinguishes it from independent fields.
Preserve level6 unlock, ranks1–20,35–55 Fire/+4 per extra rank,10MP/CD1s and
ordinary10%-of-hit Burn. No other skill's mechanics or payment changes.

## Player fantasy

Commit the caster to maintaining a flame stream; disabling control breaks it.
This preserves the continuous-stream description and Sorceress build variety
in the text-first battle model. An explicit existing `cone-2` footprint supplies
an area stream without movement/range stats: one anchor cell and three cells
in its next row. The shared selector chooses the densest footprint each pulse.
This geometry is a provisional author adaptation, not independent design approval.

## Detailed rules

One legal cast pays once, captures source/rank, starts the ordinary cooldown
and immediately pulses. JSON timing initially gives3000ms duration/1000ms
interval, with a half-open active interval. While paid channel state is active,
the caster spends its scheduled opportunities maintaining the stream: no
basic attack, other skill, recast, extra payment or extra RNG for maintaining it.
Other units act normally. The normal cadence continues; expiry/interruption
does not grant an immediate bonus action or reset pending action progress.

At every pulse, reselect current living hostiles with the shared cone selector.
Each target independently uses ordinary hit/base/crit, Fire mastery/resistance,
Defense, combos, shields, Burn, death/corpse/orb settlement. Like other paid
spell pulses, these are not direct weapon hits and do not trigger cold armor,
Enchant or explicit direct-hit recovery/self-damage mechanics.

A real action-blocking Stun, Freeze, Paralyze or Howl cancels the channel at
its onset, even when it ends before the next pulse/action. Reuse ordinary action
interruption semantics: active Concentration protects Stun only. Chill/Blind,
damage alone and resisted controls do not interrupt. Cancellation removes the
paid status without a refund; future casts obey existing cooldown/MP rules.
Source death stops pulses. Existing DoT/expiry/recovery/aura/pulse/action order
remains; newly active control cancels before same-time paid pulses. Controls
applied by an ordinary action cancel before a later actor at the same clock.

## Formulas

Cast at t emits pulses t,t+1000,t+2000; no pulse at t+3000.
Pulse count=ceil(durationMs/intervalMs). At rank r in1–20, base range is
[35+4(r-1),55+4(r-1)]. A landed hit applies ordinary Burn:3s, up to5 stacks,
each stack max(1,floor(actualHitDamage×0.1)) per second. All regular mitigation
and damage-rule rounding remain authoritative. Example rank20 base111–131.
One10MP payment and1s cooldown; recast is also suppressed while channeling.

## Edge cases

Native learned Sorceress authority requires unlock and legal positive rank;
no granted/merc/summon/enemy channel, rank-one fallback or bare marker power.
Exact registered identity/body/payment/target/cone must match validated JSON.
Copied paid source/rank/clocks use existing standard status fields. Positive
reallocation or priority removal preserves paid rank through native wave carry;
unlearn/wrong-class invalidation strips it. Rebased phase never replays a pulse
at next-wave zero; active carry still occupies later action opportunities.
Fresh/imported/reopened runs start unpaid; no save field or version change.
An absent optional projected Inferno rank is zero, not legacy learned fallback.
Immutable inputs, old recordings and existing three field spells are preserved.

## Dependencies

Strict skill schema → JSON → copied definitions/effect adapter → native learned
projection → source-bound paid status → shared timing and interruption → normal
damage. Localized current/next/MAX previews explain per-pulse damage, cone,
duration/interval/count, one MP/CD payment, occupied turns and cancellation;
combat chip is positive and follows recorded status removal. zh-CN/en and
mobile360×640/desktop must remain usable. No new controls or navigation flow.

## Tuning knobs

Feel: JSON duration/interval (positive integer ms, duration≤60000, interval≥1000,
duration>interval). Initial3s/1s makes sustained commitment visible with existing
combat cadence. Curve: existing Fire range/+4 growth and Burn coefficient.
Gate: existing unlock6,10MP,CD1s. Three pulses alter damage/MP economy, so
earned TTK/resources/build evidence is required before final balance acceptance.

## Acceptance criteria

Native fixed-seed RED→GREEN for actual pulses/payment/occupied turns and short
control interruption; ranks1/2/20 seeded oracle, cone recipients and reselection,
death/tie/expiry/recast, all blocking controls versus nonblocking/resisted control,
Concentration Stun exception, native eligibility/malformed state/registry refusal.
Recorded/unrecorded/repeated equality, immutable input and actual playback.
Real native wave phase/rank carry/invalidation and fresh/import unpaid state.
Schema/loader checks, types/lint/engine/full/build/precache, bilingual component
and production-browser mobile/desktop, ordinary save/reopen/offline Continue.
Earned campaign, independent QA/design and experience/balance remain open.

## Author checks before implementation

Security check: pass. Local deterministic combat/data/UI; no secrets, remote
writes, dependency/permission/CI change, or new persistent/save-export surface.
Plan review: ready after covering sub-interval controls, Concentration parity,
same-clock cancellation, optional absent-zero native rank, occupied turns,
native wave carry and unchanged field-spell rules. Implementation sequence:
native RED/bug → strict schema/JSON/definition → shared scheduler/control →
native/UI → focused/static/engine/full/build/browser → evidence/cleanup/commit.
DESIGN-REVIEW: CONCERNS. All eight sections are present and executable. The
referenced pillars file remains absent; canonical text-first/no-movement rules
apply. Duration/geometry/tuning and independent earned acceptance stay open.

# D06 — Grim Ward corpse-created fear totem

Status: provisional author contract; implemented locally. Bounded verification
is recorded in the accompanying evidence when complete; independent acceptance
and earned balance remain open.
Root is sole author/reviewer. No independent design/QA, earned balance, skill
credit or campaign acceptance is established by this document.

## Overview

Replace the inert enemy marker with one actual wave-local ward per caster,
created from one shared enemy corpse. The ward immediately frightens current
hostiles, then repeats at finite simulation boundaries. Preserve the level24
unlock, Find Item prerequisite, ranks1–20 and existing mana/cooldown scaling.
Its area is the whole battlefield, matching the authored all-enemies target;
the game has no movement/range stats. A ward is an indestructible area effect,
not a combatant, attack, tank, summon-cap occupant or source of rewards.

## Player fantasy

Trade a scarce corpse for breathing room instead of recovery, explosion or
loot. The player sees a ward being raised, its finite duration and successive
fear pulses. Actual enemy actions are interrupted; a decorative debuff alone
does not satisfy the skill. This serves tactical choice and class fantasy.

## Detailed rules

1. JSON owns duration6000ms, +500ms per additional rank, pulse interval2000ms,
   fear duration1000ms and boss multiplier0.5. Remove only this row's generic
   dodge/MF scaling and marker route; use a dedicated `corpse-ward` effect.
2. Require a living native Barbarian hero, level24+, valid learned Find Item
   and Find Potion prerequisite chain, and MAX valid allocated ward aliases.
   Reject malformed ranks/projections and altered/additional registry effects.
   Saved/preloaded markers, summons, mercenaries and equipment grant no ward.
3. Require one actual shared FIFO corpse, a current living hostile, affordable
   finite mana, both aliases ready, and no active ward for this caster. Refusal
   is pure: no corpse/payment/CD/RNG. It falls through normally. Recheck and
   reserve the body synchronously with ordinary cost/cooldown commitment.
4. Maintain a private wave-local ward record bound to source/corpse/paid rank
   and cast/expiry/next-pulse times. Immediately pulse, then at exact interval
   boundaries strictly before expiry. An active ward prevents recasting even
   after cooldown. A stunned living owner does not stop its existing ward.
5. Each pulse applies ordinary timed Howl fear to current hostile living units,
   with the authored ward duration/config and existing nonstacking refresh,
   boss scaling, status observations and action/channel interruption. Converted
   allies are excluded. Fear deals no damage and draws no RNG. Already applied
   fear expires normally even if the ward subsequently ends.
6. Periodic deaths/expiry settle before ward pulses, which precede same-time
   ordinary actions. Source death removes the ward before further pulses.
   Expiry removes it at the exact boundary. No pulse at expiry, after final
   hostile death or after battle termination. Existing paid fear remains timed.
7. Visible owner `grim-ward` status and localized raised/pulse/ended feedback
   describe private paid state; incoming markers cannot establish authority.
   Clear the owner marker at wave termination and reject carried markers on
   input. No ward/corpse state persists or crosses waves; save22 is unchanged.
8. Share the existing corpse pool with CE/PE/vines/Redemption/Find Potion/Find
   Item. Keep normal corpse exclusions, death units, loot, XP, quest credit,
   replay determinism and ordinary settlement unchanged. A new wave recomposes
   current learned authority and starts without a ward or corpse supply.

## Formulas

Integral rank r1–20: `duration(r)=6000+500*(r-1)` ms, yielding6000/6500/15500ms
at ranks1/2/20. Pulse times are `cast+2000*k`, k>=0, strictly below expiry:
three/four/eight pulses at those ranks. Each applies1000ms fear,500ms to bosses.
Cost `round(7-0.1*(r-1))` and cooldown `max(1,4-0.05*(r-1))` seconds use shared
ordinary rounding/minima. Valid costs remain5–7MP. No success roll or global
MF/dodge modifier. Duration/pulse values are provisional author tuning.

## Edge cases

No body, initial-dead/summoned/orphan exclusions, FIFO contention and final
hostile termination; exact MP/CD/expiry boundaries; rank1/2/20; absent/invalid
native class/level/prerequisites/ownership/projections; incoming fake markers;
one ward versus multiple corpses; owner stun/death; boss fear duration and enemy
channel cancellation; conversions at a pulse; simultaneous death/pulse/action;
wave restart/respec; malformed registry and source input purity; exact replay.

## Dependencies

Schema/JSON -> dedicated registry effect -> copied native learned authority ->
shared corpse/payment -> private ward scheduler -> existing Howl lifecycle and
action interruption -> bilingual feedback/details/playback. No new persistence
or reward format. Skills UI shows current/next/MAX duration, pulse interval,
normal/boss fear, payment and wave-local/one-active limits. Production browser
checks cover both locales, desktop/mobile, actual fear and online/offline saves.

## Tuning knobs

Curve: finite ward duration and rank growth. Feel: pulse gap and fear duration.
Gate: level24, learned chain, corpse competition and one-active policy. All
numeric tuning is JSON-owned; no global encounter/economy rebalance in this fix.
Independent playtest must assess readability and avoiding excessive lockdown.

## Acceptance criteria

Original no-body casts/payments stop. One genuine death permits one paid ward
and exactly one FIFO consumption. Prove repeated actual fear and missed enemy
actions, correct boss durations and channels, exact expiry/owner-death stop,
no active recast or carried fake ward. Normal fallback RNG and unrelated skills
remain exact. Prove native current-rank composition, shared-consumer contention,
ordinary save preservation and real bilingual production playback. Run focused,
engine/full unit, typecheck/lint/build/precache/bridge and browser checks before
bounded credit. Earned balance and independent acceptance remain separate.

## Author design, security and plan review

Design review: eight required sections present; no movement/range, potion,
currency, RNG or stack change. Pillar files remain absent, so independent pillar
alignment and level-designer balance signoff are unproven. This is a provisional
implementation contract, not a substitute for those gates.

Security check: pass for local pure-engine/schema/native/UI work. No credentials,
dependencies, CI, network publication or genuine campaign actions. Private paid
state cannot be reconstructed from public playback or imported marker statuses.

Plan review: ready with explicit scheduler ordering, source-death/expiry cleanup,
no wave carry, current prerequisite authority, no RNG and original no-body RED.
Execute: native causal RED -> authored/schema/authority -> shared consumption
and finite pulses -> native composition/bilingual UI -> boundary/regression and
production persistence -> author review/required checks/retention/exact cleanup.
Keep BUG225 open and grant no inventory credit until that evidence exists.

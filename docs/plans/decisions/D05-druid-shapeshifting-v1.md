# D05 — Druid shapeshifting local implementation contract

Scope: Werewolf, Werebear and Lycanthropy; BUG187. Private local implementation,
independent design/QA and earned balance acceptance remain open.

## Reconciliation

Preserve all authored coefficients, unlocks, costs, cooldowns and cap20.
Werewolf gives2%attack speed and0.5percentage-point physical dodge per rank.
Werebear gives2.5%maximum life and2%defense per rank, unlocked6 with learned
Lycanthropy. Lycanthropy gives3%maximum life and1%attack speed per rank only
in wolf form, retaining the explicit form dependency in skills-spec. Its stale
fixed50%prose becomes rank-dependent. Werewolf's vague damage prose is explicitly
replaced by its authored physical-dodge adaptation; no damage coefficient is
invented and no tuning change is disguised as verification. Oak Sage, Heart of
Wolverine and Spirit of Barbs still require their advertised ally/spirit effects
and receive no credit from this card. Equipped item Lycanthropy remains separate.

## Trigger, authority and composition

The first eligible form in the ordinary combo is the desired form. One living
native Druid hero pays the usual rounded rank-dependent MP and at least1s
cooldown on its normal scheduled action. Both exact allocated aliases use MAX
once; positive integer ranks clamp to cap. Native class/integer level and the
full authored prerequisite chain govern ranks. No implicit rank, foreign/merc/
summon/opponent potency, registry marker override, passive cast or extra RNG.

The selected form lasts for this combat run, including wave carry. Already in
that form means no recast/payment. Normal next-wave configuration changes can
remove it or select a different form; a different form requires a new paid cast.
Changed allocations update a retained form at the next wave. No current recording
is rewritten. No arbitrary duration is invented for the existing permanent buff.

Wolf+Lycan speed bonuses add before existing speed multipliers/clamps and cadence
phase handling. Physical dodge adds to the existing damage path. Bear defense
adds before existing defense reductions. One floored bonus increases the fresh
equipment/quest maximum life; current absolute HP is preserved, never refilled.
Real healing/orbs may fill the additional capacity. Removal caps absolute HP,
without healing, damage or death rewards. No stacking between forms, waves or
replays; no ally/summon stat leakage. Form markers alone confer no power.

## Lifecycle, presentation and persistence

Transient explicit ranks/paid form/capacity metadata belong to CombatUnit only.
Copied schema-validated primitives establish tuning; immutable copied paid
payloads and exact source/role checks establish engine behavior. Permanent
positive statuses expose the active form. Absolute capacity events drive actual
playback; speed/dodge/defense read the same paid form. Fresh runs/imports start
human. Save22 persists allocations/combo only; no migration or new saved field.
Replay uses original wave resources and cannot duplicate rewards. Public form
combo controls defer edits until the next wave. Explicit diagnostic replay keeps
the existing current-configuration contract; it is not a new free resource or
reward path. Paid carry records its source hero and copies allocation authority.

Both locales show actual current/next coefficients, unlock/prerequisite/cap,
payment/no-refill, first-form selection and next-wave rules. Lycanthropy is
automatic only while wolf form is active. No form-only attack restrictions are
added to unrelated skills in this card.

## Plan and security review

Plan review: ready. The shared upstream form consumer covers both active forms
and passive dependency, with capacity/playback/native refresh accounted for.
Required proof: original native causal RED, rank1/cap actual cadence/defense/
dodge, human/bear Lycan negatives, payment/resource/override controls, capacity
healing/removal, immutable replay, native wave learning/reselection/reset,
save/import, bilingual details, production mobile/desktop, engine/full/types/
lint/build. Independent acceptance is not claimed by root's own checks.

Security check: pass. Scope: local data/engine/store/UI/tests and retained
evidence. No credentials, network integration, permissions, external execution
or security bypass requested. Preserve seeded RNG, strict boundaries and save
validation; no remote publication or genuine campaign actions.

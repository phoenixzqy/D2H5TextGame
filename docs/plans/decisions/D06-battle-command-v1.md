# D06 — Paid Battle Command party ranks

Status: provisional author contract for BUG241. Implementation and independent
design/QA/balance acceptance remain open. This document grants no skill credit.

## Overview

Replace Battle Command's generic indefinite self buff with a paid finite party
effect. The current living native party receives +1 effective rank to eligible
learned skills. Durable allocation, prerequisites, class/level/weapon gates and
item grants retain their existing authority. Use the shared effective-rank
boundary and native passive composition established at `318ed060`.

## Player fantasy

The Barbarian's command briefly strengthens the party's existing expertise.
Build and weapon choices remain meaningful; mastered skills can improve beyond
their allocation cap. Finite feedback must make the paid interval observable.

## Detailed rules

1. Native Battle Command requires a living personal player Barbarian, level30,
   learned rank1–20 and the native Howl -> Shout -> Battle Orders prerequisite
   chain. Resolve exact authored/runtime aliases with MAX, never sum. A marker,
   imported bonus field, foreign class or altered registry effect grants no
   permission. Existing data-driven skill-order and equipment checks still run.
2. JSON owns +1 bonus and duration8000ms plus500ms per additional paid rank.
   Preserve the existing mana11 minus0.1/rank and cooldown4 minus0.05/rank,
   including ordinary rounding and the minimum1s cooldown. Cost/cooldown use
   the authorized effective rank captured before this cast grants its effect.
3. On successful payment, snapshot current living player-side allies, including
   caster, mercenaries and owned summons. Exclude hostile/converted-hostile
   bodies and dead units. Units created later receive no retroactive grant.
   The interval is [cast, expiry); no stacking, refresh or recast while the
   caster already has paid Command. One effect per recipient, never summed.
4. Source death does not undo an already-paid command. Recipient death removes
   its live grant. Expiry removes the grant before actions at that timestamp.
   All rate intervals earned before expiry settle with their old rates first.
5. Add the bonus only after the existing learned/current authority resolver.
   Zero remains zero; allocated20 may become effective21. Do not bypass
   prerequisites, class, level, weapon or native grant validation. Fixed merc
   abilities gain no invented rank-dependent tuning. Basic attacks are not
   promoted to learned player skills. Saved skill maps and order never change.
6. Native Barbarian passive changes use baseline/+1 profiles composed by the
   same fresh native function, not inverse ratios or duplicated stat formulas.
   Preserve absolute HP/MP, then clamp only against the final capacity after
   other life layers. Raising capacity never heals. Recovery changes settle
   old intervals first; attack-speed changes preserve scheduled action phase.
7. Paid skills capture effective potency at payment. Their duration, damage,
   defenses, wards and successful corpse-search metadata keep that potency
   after Command expiry. Distinguish learned allocation and captured bonus so
   ordinary forged rank21 payloads remain invalid. Find Item keeps body/source
   identity and allocated authority separate from boosted success chance.
8. Native wave carry may transfer validated remaining paid intervals only from
   the prior engine result through the existing native rebasing boundary, with
   fresh current learned/passive authority. Do not infer payment from saved
   markers or imported fields. Fresh challenge entry has no Command grant;
   offline/save serialization must not persist a temporary allocation change.
9. Playback consumes authoritative status and passive/stat observations. It
   must match the engine through cast, expiry, death and wave transitions.
   Reuse bilingual skill/status keys; describe finite duration and +1 potency
   in details. Verify mobile360x640 and desktop when player-facing work lands.

## Formulas

For learned rank a>0 and paid bonus b=1, effective rank e=a+b; a=0 stays0.
Duration(e)=8000+500*(e-1)ms. Unboosted Command ranks1/2/20 last8/8.5/17.5s.
Cost(e)=max(0,round(11-0.1*(e-1))). Cooldown(e) uses the existing one-decimal
rounding over max(1,4-0.05*(e-1)) seconds. A command cannot boost its own paid
rank retroactively. Passive coefficients remain in their existing JSON rows.

## Edge cases

Insufficient/nonfinite MP; alias cooldowns; dead/foreign/underlevel/unlearned
caster; missing transitive prerequisite; duplicate/altered definitions;
malformed/imported marker/bonus; future/expired/indefinite clocks; rank1/2/20;
allocated20 plus1; unlearned skills; multiple aliases; simultaneous expiry and
action; source/recipient death; newly spawned summons; cast/expiry within a
mana interval; layered life capacity; carried cooldown/remaining duration;
already-paid Leap/Concentrate/ward/search at boosted rank; input purity/replay.

## Dependencies

JSON/schema -> immutable definition/adapter -> native learned authority ->
ordinary payment -> battle-local recipient bindings -> effective rank and
native passive projections -> scheduler/recovery/capacity -> observations ->
native carry/playback and bilingual details. No new dependency, RNG source,
save-version bump, equipment grant, encounter tuning or genuine campaign action.

## Tuning knobs

Feel: durationMs8000 (positive, at most60000). Curve: durationPerRankMs500
(nonnegative, at most60000). Potency: bonusRanks1 (fixed v1 contract).
Gate: existing level30, prerequisites and allocated cap20. Existing cost/CD
curves stay JSON-owned. Defaults are provisional; earned balance is unproven.

## Acceptance criteria

Retain the actual paid-skill causal RED and matched-action/cost controls.
Verify caster/allied rank-dependent outcomes, exact payment/expiry/nonstacking,
native legal and illegal authority, passives/resources/action phase, captured
rank21 paid effects, corpses/search settlement, death, spawn, wave carry,
unchanged allocation and deterministic replay/playback. Run relevant focused,
engine/full unit, types, lint, schema validators and production build/precache
checks; verify bilingual production browser save/offline behavior. Synthetic
fixtures do not establish earned builds, campaign completion or balance.
Do not close BUG241 or credit the skill before the complete behavior is proven.

## Author design, security and plan review

DESIGN-REVIEW: CONCERNS

All eight required sections are present. Existing combat invariants are
preserved. Pillar documents and independent numerical/experiential signoff are
absent, so final acceptance stays open. These do not prevent authorized local
implementation under this explicitly provisional contract.

Security check: pass. Scope: BUG241 report, existing reproduction, local design
and implementation plan. No credential, network, CI, permission or external
publication changes requested. Validate native authority and copied paid state;
never grant power from imported status/bonus fields or mutate saved ranks.

Plan review: ready. Ordered work: strict data/definition/native authority and
actual paid party causal tests; engine lifecycle/rank/passive consumers;
captured effects and native carry; playback/details/browser persistence;
appropriate final checks and explicit evidence reconciliation. Each tested
increment may be committed without claiming the complete repair. Root remains
sole writer/reviewer; independent acceptance stays open.

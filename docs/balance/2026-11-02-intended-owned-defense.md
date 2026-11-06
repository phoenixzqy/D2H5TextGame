# Intended owned defensive equipment

All fourteen intended profiles now opt into the existing `act2-owned-v1` and
`stash-room-v1` policies. The shared two-pass armor/jewelry selector uses the
existing mixed Act II probes, canonical damage/stat projection, eligibility,
native stash transfers/equips and attack/attack-speed floors. The150Mana reserve
is bounded by entry capacity. Weapons/offhands/charms retain the ordinary build
policy. No new optimizer, supplied resources, healing, purchases, crafting,
monster tuning or extra retries were added. Historical profiles remain exact.

An equipment-only diagnostic uses the prior earned Prayer trial's terminal
native export:95backpack/190stash items. Mixed-threat selection raises hero
lightning resistance17→37 and Prayer29→46. Hero Life capacity490→470 and Mana
286→277; Prayer Life462→473 and Mana336→234. Attack120/129 and speed145/139
remain unchanged. Current resources, XP, intrinsic items, all other domains and
companion identities/progress are conserved through13native equips. Hero
normalized mixed incoming score improves -0.0714244898→-0.0557452128. A retained
lightning-only comparison is not the chosen policy. No combat ran in this
increment, so survival with this gear remains unverified.

BUG605 reproduced before the fix for both hero and merc: defensive selection
could equip the current hero's reserved Iron Golem item. Excluding that item
before candidate projection fixes the shared selector. Both custody/reservation
regressions now pass. All47affected equipment assertions, scoped strict types
and explicit lint pass. The native integration verifies Act I no-op, actual
stash transfers, defensive tradeoffs, weapon/attack/speed retention, resource
conservation and idempotence.

All2142production inputs still match authority77; no new production authority
was needed. All113campaign inputs are frozen; exactly four paths differ from
the companion freeze: intended-profiles.ts, survival-gear.ts and their two
relevant regression files. All14prior profile fields and historical source
remain exact after removing the two newly added survival fields.

Exact artifact names, sizes and SHA256 hashes are verified in
`p15-intended-preparation-artifact-closure-v1.json` under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Failed diagnostic v1 used nonexistent clock.restore; v2 incorrectly compared
embedded merc equipment as immutable during equip. Their originals and exit
explanations remain; v3 uses clock.dispose and compares intrinsic merc state.
These are diagnostic failures, not game defects. All drivers are terminal and
exact owned caches absent; root retains worktree/packet through umbrella review
and owns eventual cleanup. Next declare one authenticated pre-failure branch
for earned validation; never extend the exhausted prior trial.
The subsequent [earned pilot](2026-11-02-intended-defense-act2-pilot.md) clears
Rocky Waste but exhausts three Dry Hills attempts, with full independent
readback. This supersedes the earlier survival-pending next step, not the
retained equipment-only findings. Full-v1 unfinished; accepted balance0/210.
Remaining full-scope gates unchanged.

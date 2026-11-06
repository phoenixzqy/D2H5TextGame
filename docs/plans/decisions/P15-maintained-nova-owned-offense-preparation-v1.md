# P15 — Maintain the qualified earned offensive preparation

Status: implemented and locally verified; fresh maintained Nova Act II completes and unlocks Act III.

The frozen owned-offense whole-area screen reproduces12 original recordings
and12 joined controls. Static→Blizzard with owned crit swords and native
Dexterity reset clears both original full areas and32/32 combat seeds each;
Prayer survives throughout. This qualifies preparation, not chapter acceptance.

Immediately before the first Nova Tomb attempt, retain the existing one-time
owned sockets and ordinary native capacity preparation. Consume one additional
free stat reset. Set future stat targets to five Dexterity per level and retain
all current cold/Static ranks and earned skill points. Set the maintained
post-preparation priority to Static→Blizzard. No skill reset or damage tuning.

Extend the existing owned caster selector with an explicit critical weapon
policy. For weapon/offhand only, require eligible one-handed owned weapons;
accept only nondecreasing crit chance AND multiplier, with at least one greater.
Sort by highest crit chance, then multiplier, then stable item ID. Use native
stash retrieval/equip and preserve full-bag refusals and exact intrinsic payloads.
All other slots keep the existing survival policy. Default callers keep the
survival policy. The prepared controller and final native admission gear pass
must both use the declared critical policy after the reset so they do not
silently equip the old survival swords again.

Record the preparation flag/profile before later fallible actions. Execute the
reset exactly once across retries, retaining its before/after point and service
cost audit. Independently validate prepared profile/order and forbid missing
preparation evidence at Tomb. Keep every64/256/3/6/28/1800 bound and every prior
loss. Existing native settlement/economy/quest/point/save/source audits remain.

Plan review: ready. This corrects the preparation selector's missing offensive
choice and ensures native admission applies that choice. Meaningful red/green
checks must cover owned critical upgrades, ties, refusal, no crit regressions,
unchanged default behavior, one reset across retries and forged evidence.
Then run scoped types/lint and a fresh native Act II from character creation.
Require actual six-wave victory, SevenTombs Claim and Act III unlock before
closing BUG481. Root sole writer; no agents/installs/commits/publication or CI.

Final65 integrated regressions pass101.994s, scoped strict types12.894s and
explicit no-ignore lint9.837s. Original red36 checks retain six failures; focused
controller/refusal checks pass, and the intermediate tie oracle is corrected for
existing offhand-before-weapon slot order. No source ordering change or weakened
assertion. Full repository acceptance was not repeated for this campaign-only
change; umbrella integrated/player acceptance remains open.

Fresh native run passes245.031s:371 admissions/1606 waves/1598 victories/eight
retained nonwins. All six Tomb waves clear, Duriel35.424s; hero527HP/297mana and
Prayer survive. Actual SevenTombs once-only Claim and Act III unlock pass.
Independent proof verifies exact1600 prior waves, unchanged engine/data, five
intended campaign changes,13 owned inserts, native additional free reset125 and
Dexterity allocation, exports and all native economy/quest/point/recovery audits.
BUG481 resolves locally. Later acts/fourteen builds/economy/pacing remain open.

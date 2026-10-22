# D04 — Player-controlled mercenary secondary skill priority

GD-DESIGN-REVIEW: APPROVE, 2026-10-22. Scoped P13/P08 usability prerequisite;
no damage/weapon scaling, class completion or campaign acceptance.

The earned Cold Plains diagnostic shows the Inner Sight Rogue never casts
her existing Pierce Arrow. Basic Arrow CD1s is always ready at her1524ms action
period, and its position ahead of Pierce permanently hides that skill. The
first-ready engine selection is intentional. Expose a player choice instead
of secretly changing saved priorities or tuning the38HP remainder.

Provide an owned-merc store action accepting an exact permutation of the
current effective skill order. Signature remains first. Reject unknown owner,
additions/removals/duplicates/signature displacement and active runs/combat
without mutation. Retain ordinary wave/restore/debit ownership guards. Use
existing comboOrder persistence without migration, skill grant or schema bump.
Effective order retains the adapter's existing signature-first deduplication
and legacy archetype fallback. Initial priorities stay unchanged. An accepted
order is copied; caller changes cannot mutate stores. Existing recordings
remain unchanged; a new run reads the choice.

Mercs screen shows signature plus ordered secondaries, with visible labeled
44px up/down buttons, keyboard operation and zh-CN/en explanations. Signature
and list boundaries cannot move. Disable during combat and explain refusal.
Unknown names use readable existing identity fallback. UI delegates all
membership/eligibility checks and order mutation to the store.

Freeze behavior tests before runtime implementation: valid choice/defaults,
all refusals, copy/no-other-domain changes, actual Pierce casts, save round
trip and recorded-run isolation. Run focused/related, full unit/types/lint,
production build/bridge and production browser control/save checks.

One exact W3 diagnostic changes only the merc priority to Inner Sight → Pierce
Arrow → Basic Arrow, awards nothing, and retains baseline/candidate full events
and outcomes. Current registry damage/cooldowns remain Basic15–25/1s and
Pierce22–35/2s; differing JSON values are a separate unresolved decision.

After validation, restore original unique earned L12 SHA8c46c4f4… and apply
Frost Nova2/Ice Blast8 and the merc order through ordinary actions. Attempt
Blood Moor/Cold Plains/Burial Grounds/Dark Wood at ordinals102–105 once, seed
2223645302/bonus1, stopping at first nonwin. No farming, gear change, point
allocation, respec, refill, direct XP or idle ticker. Success qualifies the
previously approved Catacombs comparison; failure ends this experiment. Full
five-act/seven-class/213-skill/30–50-hour objective remains unchanged.

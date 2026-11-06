# P15 — Fallen family and Panic Flee

Type: bounded mechanic repair and provisional numeric adoption, 2026-10-30.
References: monster catalog decision, early-game-spec §4,
`docs/design/monsters-act1-2-canon.md` (shaman-death fleeing), current bilingual
Panic description. Source establishes fleeing/dodge, not the new exact values.

Fallen, Dark One and Devilkin become Panic-only, exposing ordinary attacks
when Panic is unavailable. Preserve Fallen32/+5; author Dark One and Devilkin
32/+5 as explicit adoption of their native fallback, not an inferred tribe
coefficient. Other stats, generic skills, affixes, planners and chapter overrides
remain unchanged. Appended elite spells keep their priority after unavailable
Panic, and can cover ordinary gaps. No numerical balance sign-off is implied.

Replace the CD4 permanent marker stub with a schema-validated native skill:
authored CD5/MP0, +20 percentage points physical and magical dodge for 5000ms.
Duration and dodge live in the authored skill JSON. One reaction per original
recipient per wave is a rule, not a repeatedly payable buff. No escape/removal,
corpse consumption, permanent stat mutation or save-format change.

Capture exact original living hostile Fallen, Dark One and Devilkin bodies in
trash/elite/champion/rare-elite/rare-minion tiers. Exclude summons and ownership
markers, spoofed names/IDs and later entrants. Original sources are exact
Fallen/Carver/Devilkin Shaman and Bishibosh bodies. Capture source and recipient
allegiance before lethal HP writes/conversion cleanup, including projectiles,
reflection and periodic settlement. Original source deaths alone can trigger;
recipients in the complete simultaneous death set cannot receive a reaction.

Private states: unused → pending → cast → expired. A qualifying death marks
each eligible living hostile unused recipient pending and uses its wave
allowance immediately; additional deaths coalesce. The next eligible normal
action pays MP0, sets CD5 and consumes the action, granting dodge on the
half-open interval [cast, cast+5000ms). Stun/interruption/cooldowns delay pending
without paying. Ordinary/affix selection resumes on following actions. Death
forfeits pending/active power and any unused allowance; conversion forfeits
pending/active power but never resets the used allowance. Resurrection cannot
rearm. A fresh wave starts unused, and strips carried/forged Panic markers.
Expired power cannot be restored by markers or replaced registry definitions.

Presentation uses private status-state projection and exact expiry boundaries.
Periodic damage keeps its existing non-dodge semantics; always-hit attacks keep
their existing dodge bypass. Inputs/base stats remain immutable and plain,
recorded and playback views agree.

Acceptance: meaningful RED/GREEN with actual bundled rows/factory/default
registry; no opening Panic/no-shaman Den guards; original qualifying deaths,
multiple/simultaneous/converted/friendly/summoned/forged cases; finite revival,
shared corpse FIFO and affix order unchanged; exact action/MP/CD/expiry and both
dodge channels; deterministic output, immutability and replay agreement.
Related resurrection, conversion, native planners, status and schema checks,
strict types/lint and independent review precede inventory advancement.
No campaign or balance rerun is required for this bounded functional repair.

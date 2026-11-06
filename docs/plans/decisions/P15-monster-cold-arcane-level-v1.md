# P15 — Monster Frost Nova and Arcane Bolt level curves

Provisional numeric/content repair for BUG428,2026-10-30. Root sole writer in
the retained claimed worktree; no numerical/campaign acceptance implied.

These two skills still use fixed engine stubs with divergent JSON. Replace
their shared native definitions with validated immutable JSON projections.
Apply globally to actual monster users, including promoted affixes and native
boss bars; no Act I alias or favorable encounter exception. This supersedes
only the fixed payloads for these two skills and their older JSON numbers.

| Skill | L1 range | Growth per monster level above1 | Target/CD/flight |
| --- | --- | --- | --- |
| Frost Nova |6–9|1–2|all enemies/3s/none|
| Arcane Bolt |12–18|2–3|single enemy/2s/500ms|

Arcane adopts the existing D07 Lightning single-target12–18/+2–3 budget.
Nova halves that starting power because every party member can be hit, with
integer1–2growth. AtL3 these are8–13/16–24; L7 12–21/24–36; L15 20–37/40–60;
L90 95–187/190–285. Nova retains Chill and ordinary status duration; neither
spell gains combo tags, DoT or new control. Both cost0 and stay skill-rank1.
Arcane's2s CD reconciles its authored cooldown; minimum scheduler timing and
existing priority/control still determine actual casts. No promise of survival.

Reuse the JSON `scaling.monsterLevelDamageGrowth` ordered integer tuple, allowing
it on these exact two additional rows only. Preserve the existing Act I Lightning
affix's separate rank-binding contract. Copy the tuple to an opt-in damage-effect
field, evaluated in the shared direct-hit input from actual monster level.
Allocated rank, Attack, victim level and Battle Command never scale this field.
Other actor kinds receive no monster-level increment; converted monsters retain
their own level. No global multiplier or change to other installed effects.
Do not double-apply growth when a snapshot carries skillLevels.

Keep monster HP/Attack/armor/resists/counts/elite coefficients, orb chance/power,
starting power, rewards, progression policy, save format and RNG draw order.
The diagnostic's halved elite life is not adopted. Orb recovery already works;
do not add a refill or weaken mandatory encounters to address attrition.

Validation: genuine native endpoint RED before edits; unchanged tests GREEN for
L1/3/7/15/50/90, both endpoints, tiers/rank/Attack independence, normal mitigation/
crit/dodge, target scope, flight/CD/Chill, immutable source/recorded parity,
nonmonster/unopted effects. Resolver tests refuse missing/duplicate/invalid rows,
negative/nonfinite/fractional/reversed ranges and confirm independent freezing.
Run loader and relevant consumers, types/lint/build and browser verification.
Then rerun one fresh sorceress-cold existing Act I route once, same policy/date,
stop on first nonwin; no imported checkpoint, extra farming or favorable rerun.
Further balance and all14/five-act/pacing acceptance remain umbrella work.

Plan review: ready; caller/JSON/schema/registry/shared-damage/UI metadata and
production provenance covered. Security check: pass; local owner-authorized
gameplay repair, no dependencies/network/credentials/permissions/publication.
No commits/push/PR/deploy; CI excluded by owner. Root owns task artifacts/cleanup.

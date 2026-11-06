# P15 — Dark Stalker signature priority

Adopted by root on2026-10-30 after the design adviser's read-only role review,
under the authorized private-v1 implementation scope. This is a new bounded
content decision, not a recovered numeric approval. It follows BUG142's
signature-before-generic-melee precedent and the existing first-valid selector.

For `monsters/act1.dark-stalker` only, reverse the priority to
`["monster-charge", "monster-strong-melee"]`. At nativeAS120/1540ms the old
CD1/MP0melee is always ready and prevents Charge. Corrected actions are
Charge1540→Strong3080→Strong4620→Charge6160ms. At stable2000msChill, Charge
is ready exactly at6000ms after its2000mscast, with Strong Melee at4000ms.

Preserve native Charge physical60–90/CD4/MP0 and Strong Melee physical30–50/
CD1/MP0, physical dodge/DEF/resistance, melee delivery and no extra ordinary
attack. Do not invent stun, movement, projectile or numeric growth behavior.
Every other field/row, registry/selector, affix and chapter-boss override stays
unchanged. Vile Hunter's existing order is an unrelated negative control.

Canon establishes Dark Stalker's spear/charge role and real encounters in Cold
Plains, Dark Wood and Catacombs. This decision supersedes its melee-first order
in the historical monster tables. It adds no ordinary attack/growth numbers;
the101outstanding numerical role reviews remain101. Charge exposure changes
threat even though numeric skill fields stay unchanged. Functional regressions
and a frozen paired diagnostic quantify that change; neither accepts earned
campaign balance, fourteen builds or30–50hour pacing.

Validation: genuine test-only RED, native cadence/endpoint/mitigation/dodge/
Chill/control/determinism/input-immutability GREEN, exact one-row delta, related
data/combat checks, types/lint. Fixed diagnostic recipe and full raw/paired
results remain under the active packet; no retry or tuning loop is implied.

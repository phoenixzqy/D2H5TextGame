# BUG-093 — Canonical unique and set rate packages contain percentage points

Status: fixed for canonical packages; validated and independently reviewed.
Severity: High. Owners: engine/content; GD/TD/producer unit contract approved.

At fd2c96e, 21 critical/dodge fields across 20 unique IDs and three active set
threshold fields store whole literals 8–50. `aggregateEquipmentMods` sends these
canonical packages directly to fractional probability/multiplier fields. For
example Crushflange contributes critical chance10 rather than.10, Cleglaw's
three-piece bonus contributes physical dodge15 rather than.15, and Natalya's
four-piece critical-damage contribution50 becomes a50×increment rather than.50.

Reproduce: load the real definitions in `src/data/items/uniques.json` and
`sets.json`, equip the named unique/complete set in `aggregateEquipmentMods`,
and inspect those critical/dodge fields. The canonical contract in
`docs/plans/decisions/P13c01-merc-equipment-combat-authority-v1.md` requires
chance/dodge fractions and additive critical multipliers. Already-correct
Silkweave.20/Carrion Wind.10 and ten set boots.05 confirm the existing unit scale.

Approved correction: edit only the audited24literal paths, explicitly by ID;
keep the existing12fractional values, raw modern rolls, legacy maps, persisted
statRolls, resistance points and all unrelated fields. Do not divide canonical
packages globally or infer units from runtime magnitudes. Every corrected
field is a literal, so no persisted roll conversion or save-format change is
involved. Full per-ID expectations live in equipment-percent-data.test.ts.

Natalya's existing critDamage key is retained; the older deadly-strike wording
in items-spec.md is a separate semantics discrepancy, not permission to change
the current mechanic during a unit correction. Prior campaign evidence remains
bound to its original source/data; no victory follows from this audit.

Read-only design and producer reviews approve the explicit24corrections and
canonical-fraction controls. Root owns task evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-affix-units` through full-v1
consumers; root removes disposable outputs after validation/readers finish.

Resolution: exactly the approved24literal corrections are applied. Real-data
regressions preserve12correct fractions and compose unique/set packages with
modern and legacy affixes without double division. Final8600tests/T/L/build and
four-chunk bridge scan pass; producer APPROVE/security PASS, independent evidence
ADEQUATE. [Evidence](../../docs/plans/evidence/equipment-percentage-units.md).
Historical derived-cache repair remains BUG094; no campaign acceptance follows.

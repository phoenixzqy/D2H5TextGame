# BUG-130 — Supply a real staff base for Leaf

Severity: High. Status: Fixed locally. Owner: content-designer/game-designer; root sole writer.
Environment: local80f2909, JSON catalog and Vitest; browser/locale/viewport and RNG
not applicable to static base availability.

1. Inspect `runewords/leaf`: weapon slot, staff only, two sockets.
2. Filter `loadItemBases()` for weaponType staff and maxSockets at least2.
3. Run `src/data/loaders/leaf-base.test.ts`.

Expected: at least one real base can receive Tir/Ral and be equipped as Leaf.
Actual: zero staff bases exist. Leaf is unreachable through real crafting even
after its structured grant is authored. No alternate weapon qualifies.
Affected systems: content catalog, ordinary acquisition, crafting and equipment.
Evidence: root-owned `d2h5-runeword-combat-n9x0uhgk/runtime-red.log` records the
initial nonexistent-staff fixture failure; the separate catalog reproduction
provides the direct availability check. Infinity's initially misspelled fixture
base is separately corrected to the existing giant-thresher and is not this bug.
Root cause: closed weapon eligibility was added without a corresponding staff
base. Read-only game-design consultation will set the minimal authored row.

Resolution: `[GD-D10-LEAF-STAFF]: APPROVE` supplies the single early nonmetal
two-handed staff and one normal `loot/trash-act1` pick, preserving prior weights.
`leaf-base.test.ts` checks exact catalog eligibility,512fixed seeds through real
ordinary selection/materialization and capacities0/1/2, actual Tir→Ral formation
and level19 equipment requirement. The approved amendment and bilingual names
are implemented. Future ordinary selection proportions change; acquisition
balance and the complete earned crafting loop remain unmeasured. Validation is
recorded in `docs/plans/evidence/d10-runeword-combat.md`.

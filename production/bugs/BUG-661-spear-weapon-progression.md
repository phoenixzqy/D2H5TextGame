# BUG-661 — Add ordinary spear weapon progression

- **Status:** Fixed locally; retained uncommitted source, umbrella acceptance open.
- **Severity:** High; Spear Mastery has no later weapon in its family.
- **Owner:** Root; content/game design.
- **Affected systems:** Item bases, ordinary loot, spear equipment and mastery.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
human2 tree; exact touched-file preimages/hashes in the evidence packet.
WSL/Linux JSON inspection; browser/viewport/locale/RNG not applicable.

1. Load `src/data/items/bases.json` and filter `weaponType === "spear"`.
2. Only `weapon-spear`, equip level1, physical8–18 exists.
3. Inspect `treasure-classes.json`: its sole spear source is Act I trash,
   normal weight100, levels1–58 (the current D08 Hell ceiling). No later spear exists to materialize.

Expected: ordinary two-handed spear upgrades support the existing mastery
through the same finite equipment envelopes as other weapon families.
Actual: the starter remains the only spear; changing to later polearms loses
Spear Mastery. War Pike correctly remains a polearm and must not be retyped.
Workaround: change weapon family/build, abandoning spear specialization.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-spear-progression-v1/reproduction.json`
and `before-manifest.json` / `before/` in that packet.
Decision: `docs/plans/decisions/P15-spear-progression-v1.md`.
This absence is a content defect, not proof of any stalled campaign's cause.

## Resolution and verification

Four spear tiers,61 additive loot picks and bilingual names implement the missing
ordinary family progression without changing engine/schema/save or War Pike.
151 distinct affected unit cases, final scoped strict types/lint, exact JSON
preservation and four distinct browser cases pass. Original mobile-English
setup reload timeout remains documented; its isolated rerun passes. Eight captures
inspected; owned disposable configs/cache removed and recorded processes absent.
[Evidence](../../docs/plans/evidence/p15-spear-progression.md) distinguishes
availability/native equip from unverified earned acquisition/economy/balance.
Campaign sources/saves and counts unchanged; BUG656/BUG659 remain open.

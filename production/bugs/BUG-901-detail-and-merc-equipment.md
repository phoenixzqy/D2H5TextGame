# BUG-901 — Show complete details and preview mercenary equipment

- Severity: Medium
- Status: Fixed
- Build: d1a18ade
- Environment: user report; zh-CN, mobile and desktop. Source reproduction confirms unconditional detail tabs and name-only merc candidates; static browser validation completed.
- Owner: frontend-dev
- Seed: not applicable (UI only)

## Reproduction
1. Open a skill detail: description, current rank, next rank and requirements are separated into tabs.
2. Open equipped-item details: item information and total character stats are separated; mercenary stats is empty.
3. Open mercenary equipment, select a slot: a nested dialog shows only item names and immediate Equip actions.
4. Attempt an ineligible equip: error is rendered in the obscured parent dialog.

## Expected
Complete scrollable item/skill information. One mercenary equipment dialog with visible current gear, selected item details before confirmation, requirements and visible transfer feedback.

## Actual / evidence
`SkillDetailPanel` renders five detail tabs. `EquippedItemModal` always renders a stats tab even with null derived stats. `MercEquipmentCandidates` has no item preview. `MercEquipmentEditor` renders errors outside its nested picker.

## Scope and validation
Preserve engine/store transfer authority and top-level screen tabs. Focused UI tests and static responsive fixtures only; no gameplay runs.

## Resolution
- Skill and equipped-item dialogs show complete scrollable details without detail tabs.
- Mercenary equipment uses one dialog with current/candidate item details, explicit confirmation, eligibility reasons, and visible equip/return feedback.
- The existing store remains authoritative for transfers; UI eligibility uses the same star-projected mercenary.

## Validation results
- Mercenary UI component tests: 8 passed (preview, replacement, return, requirements, full backpack feedback).
- Item comparison/detail component tests: 4 passed.
- Source-only TypeScript and scoped ESLint passed; diff whitespace check passed.
- Real Chromium static fixtures: mercenary equipment and skill details at 360×640, 412×915, 800×360, 1280×800 and 1920×1080; item details at 360×640 in English. No horizontal overflow or runtime errors; mercenary flow uses one dialog, details/actions remain reachable, and detail tabs are absent.
- No gameplay tests, simulations or campaign runs performed.

# BUG-902 — Show mercenary gear and skill details

- Severity: Medium
- Status: Fixed
- Build: 314feca6
- Environment: user report in mercenary UI, English and zh-CN; Chromium desktop and mobile layouts
- Owner: frontend-dev
- Seed: not applicable (UI only)

## Reproduction
1. Open a hired mercenary's equipment and select Details on an occupied slot.
2. Select an equipment slot with compatible backpack items and inspect the choices.
3. Open the mercenary's base abilities and its skill priority tab.

## Expected
Details show the equipped instance. Replacement choices show rarity and stats, with a comparison against the mercenary's current loadout. Skill priority shows the complete descriptions of available skills.

## Actual / evidence
Details opens the candidate picker instead of displaying the equipped item. Candidate rows show only names and instance IDs, without rarity or comparative stats. Skill priority lists names without descriptions. Source reproduction: `MercEquipmentEditor` passes `selectSlot` to both slot selection and details, `MercEquipmentCandidates` renders name-only rows, and `MercSkillPriority` renders names and reorder controls. Regression coverage: `src/features/mercs/MercsScreen.equipment-detail.test.tsx` and `tests/e2e/merc-equipment-integrity.spec.ts`.

## Workaround
Select a replacement to see its tooltip; the current mercenary comparison and skill descriptions are unavailable in this flow.

## Fix and verification
Details opens the equipped instance, while replacement choices share the player equipment presentation and compare the mercenary's projected stats. The abilities and priority views show skill descriptions.

Regression tests cover equipment details, rarity, comparison, transfers, capacity, pagination, star projections, and bilingual skill descriptions. The browser test exercises the same flow and save round-trip in English and Chinese on desktop and mobile.

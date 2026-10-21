# BUG-062 — Display allocated Lightning Mastery rank and truthful passive details

- **Status:** Fixed in `cf8e9fc`; bounded production-browser verification `b1bfab6` accepted, with separate open shared-layout BUG-063.
- **Severity:** Medium — misleading learned rank and incomplete passive description; actual store allocation remains available.
- **Owner / affected systems:** frontend-dev; Skills screen rank projection and bilingual copy.
- **Build:** `1818c22`, approved tests installed; SkillsScreen and locales unchanged.
- **Environment:** Linux/Node24, Vitest1.4/jsdom; browser/viewport N/A for component reproduction. Both en and zh-CN.
- **Seed:** 7 for unchanged real recorded-wave control; display cases have no RNG.

## Reproduction

1. Run `node node_modules/vitest/vitest.mjs run src/features/skills/SkillsScreen.lightning-mastery.test.tsx`.
2. Inspect Lightning Mastery at allocated rank1, then with legacy-only rank20 and no allocation.
3. Inspect canonical19/authored1 aliases in each insertion order; canonical99; fractional/negative allocations.

## Expected

Only allocated valid integer ranks count, using maximum exact alias once and cap20. No allocation stays unlearned. Rank1 current4%, next8%(+4%), unlock30 and complete passive prose state direct lightning,4% per allocated rank,cap20/+80%,unchanged Paralyze in both locales. Ordinary learning preserves current wave recording.

## Actual before patch

Ten of18 cases fail: incomplete prose, legacy fallback falsely learned, alias insertion-order yields4% instead of76%, header99/20 despite capped80% rows, invalid allocation falsely learned. Eight controls pass: reverse alias order, NaN alternate, actual L29/L30 allocation and complete current recording preservation, in both locales. Generic current/next rows already work; no18-failure claim.

## Evidence

Root-owned retained RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-lightning-mastery-6siwydfd`:
`ui-prepatch-freeze.json`, approved test SHA256 `1ccd29955d272f9ac47cb1115a360cffe8ea3f6023b0a010de985e57b8d0fdb8`, `focused-ui-red-report.json` and metadata. Actual18total/10failed/8passed/0pending,6.418s,exit1,no stops/signals. Production source/locales unchanged throughout RED.

## Root cause and bounded fix

Generic allocated map merges legacy skills and aliases in iteration order without Lightning validation. Normalize only Lightning exact aliases with the existing allocation resolver; translate its exact-skill description from the immutable authored definition. No engine/store/replay/save/data changes.

## Closure

Fixed `cf8e9fc`. Regression: `src/features/skills/SkillsScreen.lightning-mastery.test.tsx`,18 cases. Final focused62/2files and full4527/186 pass; types/lint/production bridge-build pass serially. The first broad lint failure required only a block body around a void `act` callback; all inputs/assertions stayed unchanged. Historical prepatch prose/rank/order/cap/invalid-allocation RED remains intact.

Separate browser `b1bfab6` passes two bilingual cases with18 viewport samples and four explicit Settings Save/confirmed Saved → page close → new page → Continue cycles, using ordinary UI/native Tab+Enter and exact saved slices. CDP proves actual Noto Chinese prose glyphs; screenshot review preserves the existing fixed-header overlap in [BUG-063](BUG-063-skills-header-overlap.md). Bounding-box and visibility assertions do not prove absence of occlusion. Initial browser failures were corrected harness oracles/locators, not additional product RED.

[Acceptance/evidence index](../../docs/plans/evidence/p07a03-lightning-mastery.md) records exact scope, corrections and durable evidence. Explicit importedL30 eligibility is not earned campaign evidence. No autosave, browser-process restart, real-device, full mobile/readability/accessibility/performance or private-v1 acceptance is claimed.

# BUG-062 — Display allocated Lightning Mastery rank and truthful passive details

- **Status:** Reproduced; bounded UI fix pending. Browser layout/persistence remain separate.
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

Record UI commit and regression gates after implementation. Explicit importedL30 fixtures are not earned campaign evidence; production browser layout and real disk persistence remain separately required.

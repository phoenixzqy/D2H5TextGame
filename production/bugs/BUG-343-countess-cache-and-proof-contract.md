# BUG-343 — Activate the exact Countess cache and proof contract

- **Severity:** High
- **Status:** Locally corrected; final full unit check pending.
- **Build:** `b7bf3595912f7c461ad825382c989baaa91b8adc` plus the uncommitted Countess source slice.
- **Environment:** Node/Vitest, constructed fixtures; browser/viewport/locale not applicable to this data assertion.
- **Seed:** No RNG is executed by the authored-cache reproduction.
- **Affected systems:** content-designer (quest data), engine-dev (current save graph), frontend-dev (Claim boundary).

## Reproduction

1. Load `quests/act1-forgotten-tower` with the production quest loader.
2. Compare its rewards to D11's exact `{xp:3000,lootTable:{tableId:'loot/countess-runes',ilvl:13,picks:1}}` bundle.
3. Run the `authors` case in `countess-claim-red.test.ts` using the Countess task's scratch Vitest config.

## Expected

The named level-13 one-pick cache and 3,000 XP, without gold or replacement currency. First Claim requires the canonical completed objective and actual Countess victory receipt. Native v23 accepts only the coherent Countess proof graph; literal v22 remains frozen.

## Actual

The executed authored-data case fails: rewards contain `gold:5000` and string `lootTable:'loot/countess-runes'`. Three gameplay-dependent cases were filtered, not executed. The current schema does not yet admit the Countess receipt, so this report gives no credit for live victory or Claim.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/claim-authored-cache-red.log` and sibling receipt: exit 1, one failed assertion. D11: `docs/plans/decisions/D11-act1-remaining-quests-v1.md:78`.

## Root cause and correction

The old placeholder quest data and unactivated current proof domain have not been integrated with the dedicated Countess source. Correct the authored bundle, use the existing exact quest-table generator, and share the finite completion predicate across save and Claim validation. Prevent generic kill events from completing the protected quest when its canonical target is authored.

## Final correction

The authored reward is exactly hero3000XP plus one level13 private Countess-table pick, with gold removed and no replacement. First Claim requires the real proof; native23 validates its reciprocal graph while frozen literal22 refuses it. Regressions: src/stores/countessClaim.test.ts and src/engine/save/countess-state.test.ts. Production-browser fresh Claims independently confirm3000hero/2250mercXP and exactly one authored rune.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.

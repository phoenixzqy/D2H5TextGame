# BUG-344 — Retain Countess native merc output ownership through rollback

- **Severity:** High
- **Status:** Locally corrected; final full unit check pending.
- **Build:** `b7bf3595912f7c461ad825382c989baaa91b8adc` plus the uncommitted Countess settlement slice.
- **Environment:** Node/Vitest, constructed production-store fixture; no browser, locale, earned gameplay or historical replay.
- **Seed:** Countess encounter seed7, recipient XP one below its native next-level threshold.
- **Affected systems:** engine-dev (native settlement and merc progression), qa-engineer (observer failure regression).

## Reproduction

1. Field a real recruited merc and set its constructed XP one below the next native level.
2. Enter and finish playback of the selected Countess encounter.
3. During native merc XP publication, a synchronous observer renames the newly grown recipient object in place, then throws.
4. Inspect the roster after the failed settlement restores its pre-income participants.

## Expected

Rollback removes every transaction-owned output and restores one original recipient, with no duplicate XP/level-up copy. Keep unrelated mercs and the stable failed wave receipt.

## Actual

The original-ID/original-reference filter misses the newly allocated grown object after its ID changes. It restores the original recipient alongside that renamed output. The causal observer fired and threw its original error; the explicit no-renamed-output assertion failed.

## Evidence

Countess task `native-ownership-stage.log` and sibling receipt: one merc provenance failure, three passing gear relocation cases. Reproduction: `countess-merc-provenance-red.test.ts`, one causal case. Independent draft review identified the missing ownership before reproduction; it did not itself count as runtime evidence.

## Root cause and correction

The transaction predicts merc values but does not own the native helper's allocated output before observers run. Publish the exact precomputed merc-growth result under the existing leases, capture its reference before publication, and use that provenance during scoped restoration and final verification. Reuse the production growth/XP functions; leave other settlement and Claim paths on their existing helpers.

## Final correction

Native merc growth is prepared by the existing production formulas and its exact allocated output reference is captured before observer publication. Scoped rollback removes renamed transaction-owned output and restores the original recipient. Regression: src/stores/countessMercProvenance.test.ts; corrected17-case group and broader356-case native/source/Claim run pass.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.

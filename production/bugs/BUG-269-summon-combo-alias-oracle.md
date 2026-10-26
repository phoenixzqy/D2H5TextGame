# BUG-269 — Preserve the authored summon slot in the native test oracle

- Severity: Low; author test oracle, no observed gameplay regression.
- Status: Corrected in native acceptance `6c4b2b58`; production alias behavior unchanged.
- Owner: root; no independent approval.
- Environment: Vitest jsdom native Player conversion, synthetic level60 Necromancer, seed7; no browser/locale.

## Reproduction

1. Convert a legal native player whose combo contains an authored summon ID.
2. Run the prospective Skeleton/Clay/Revive payment-and-damage suite.
3. The draft incorrectly expects the copied combo slot to become canonical.

Expected: preserve the explicit authored slot; normalize the copied learned rank.
Actual: nine draft cases fail at the slot assertion; six denial controls pass.
No summon/damage assertion in those nine cases was reached, so this failure is
neither evidence of missing damage nor a passing body test.

## Cause and correction

`scopedSummonConfiguration` filters the original combo and normalizes learned
rank keys. Its existing `combatHelpers.summon-eligibility.test.ts` explicitly
requires retained authored/canonical slots (lines51–63). `projectPlayerClassActives`
also filters rather than renaming these slots. Correct the expected slot from
`row.id` to `row.authored`; additionally assert the actual canonical learned rank.
Keep body counts/stats, payment, actual HP-loss control and determinism unchanged.
Do not change production alias behavior.

## Evidence

Original prospective source/workspace and complete7462byte failure log retained
in the parent bone-defense task. Log SHA256:
`31413de6242fc3c15771289b6ff6e75c1ae1503dd217fe6ff8da31413daffdbc`.
This report was staged outside the repository while the frozen full suite ran;
root preserved it under production/bugs before repository test integration.

## Final local validation

Native21cases/related186in3files pass35.734s; full types120.220s and focused typed lint8.784s pass. Eight completed Skeleton/Clay contexts from the original failed aggregate command plus separate Revive4/4PASS80.285s establish12completed locale/viewport cases. No12/12successful single command is claimed. All original failed sources/logs remain retained. See docs/plans/evidence/d06-basic-necromancer-summons.md and its checkpoint packet. No production runtime change, independent sign-off or earned-build balance acceptance.

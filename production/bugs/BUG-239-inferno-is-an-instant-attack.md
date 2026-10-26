# BUG-239 — Make Inferno a continuous interruptible stream

Severity: High. Status: Locally fixed and verified in `65be2984`;
independent acceptance and earned balance remain open.
Owners: engine/content/frontend; root sole author and reviewer.

Environment: deterministic Vitest/Node, seed19; browser/locale independent.
Native regression: `src/stores/inferno.causal.test.ts`.

1. Project a synthetic level30 Sorceress with learned rank1 Inferno through
   `playerToCombatUnit`; select only Inferno. Give100MP, attackSpeed200 and
   a surviving disabled hostile. A declared poison fixture ends at3500ms.
2. Record the production battle; inspect Fire timestamps and caster actions.
3. Repeat with a pending Freeze at1400–1500ms, between the first two pulses.

Expected: a paid continuous stream occupies later caster opportunities and
   stops on disabling control. The provisional [channel contract](../../docs/plans/decisions/D04-inferno-channel-v1.md)
   gives900/1900/2900ms pulses for the first fixture, one10MP payment, no
   intervening ordinary attack, and cancellation at1400ms in the second.
Actual: instantaneous Fire at900/2700ms, a basic attack at1800ms, two payments,
   and no paid channel to interrupt. The strengthened two-test RED fails twice.
   The initial cancellation assertion passed vacuously because no channel had
   ever started; it was strengthened to require paid state before interruption.

Root cause: JSON has only ordinary damage; its generic adapter and scheduler
   establish no recurring, caster-occupying channel. Existing field spells are
   independent and deliberately continue through control, so copying those
   rules without explicit channel semantics would also be incorrect.
Workaround: recasts deal damage but do not supply the promised continuous stream.

Repair: explicit JSON-owned channel timing, shared paid pulse/cone scheduler,
   occupied caster opportunities and the ordinary control/Concentration rule.
   Native source/rank/phase carry, localized previews and positive chips are
   included.95 new regressions; full16466/743/two existing skips, engine8194/306,
   types/lint/build/precache and four production-browser cases pass.

Original `native-red.log`, `native-red-strengthened.log`, receipts and frozen
   `native-red.test.ts` are retained in the root-owned archive named by the
   [retention record](../../docs/plans/evidence/fixtures/inferno/retention.json).
   Root removes it after failure diagnosis and all full-v1 consumers finish.
   Disposable scratch/build are removed; process/profile/port cleanup is verified.
   [Final evidence and limits](../../docs/plans/evidence/d04-inferno-channel.md).

No earned campaign, independent acceptance or final balance claim.

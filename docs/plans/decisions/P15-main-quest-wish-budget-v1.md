# P15 — Shared main-quest wishstone budget

Status: shared main-quest group implemented; specialized and side groups open,
2026-11-02.

Drop-tables §9 promises 10–25 wishes per finite quest. Add the 19 bonuses in
`p15-main-quest-wish-budget-v1.json` (external retained packet) to main.json's
existing numeric wishstones reward field. Countess 15; Act II 20/20/15/15/25;
Act III 15/15/20/15/25; Act IV 20/20/25; Act V 15/15/20/20/25, in authored order.
This adds 360 to the existing 55 starter wishes, a shared-main total 415.

No old reward/objective/unlock fields change. Bonuses use the same preflight,
claimed flag and rollback as the rest of each bundle, without the kill coin,
difficulty multiplier or offline bonus. Existing claimed quests are not
reopened or compensated; saves and prices are unchanged. Fix safeGrants to
read exactly the same canonical wallet key as the prepared currency grant.
Historical plural wishstones is opaque even at MAX_SAFE_INTEGER.

Cain and Malus still require their specialized currency participant and exact
bundle contract amendments. Their frozen later candidates are 20/15, giving
a full-main candidate 450. Side quests, special publishers and repeatable
bounties remain required work; do not make a blanket recurring10-wish grant.

Verify missing data and old-wallet preflight failures before edits; use the
production quest loader/Ajv and actual claim family cases for points, retained
items, services, tables and campaign titles. Preserve existing source proof,
repeat refusal and rollback assertions. Run affected claim checks only; reuse
retained campaign saves for prospective arithmetic and never replay chapters.
Final L70 Hell/economy/build fairness/pacing/holdouts/retry/manual-idle and
integrated G0–G7/soak/review/owner requirements remain open.

## Implementation receipt

[Report](../../balance/2026-11-02-main-quest-wishes.md). The nineteen shared
bonuses are implemented, totaling 360 new / 415 authored main wishes across
22 of 24 main quests. Existing reward/objective/unlock fields are unchanged.
Canonical preflight and already-paid currency overflow fixes retain old
plural balances and valid observer additions. The quest card now uses the
existing zh-CN/en wishstone label.

Authority24 retains 572 distinct affected assertions across incremental checks,
with final core/family checks rerun after the transaction correction. Four
focused browser cases cover both locales at 360×640 and 1280×800; no battle,
import or claim occurs. The retained pilot's claimed main rows would supply
340 wishes plus 115 first-clear wishes prospectively, totaling 455. None are
granted to its old save. This does not accept the full quest economy or pacing.
